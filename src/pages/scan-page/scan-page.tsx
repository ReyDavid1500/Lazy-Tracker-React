import { useRef, useState, useEffect, useCallback, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ScanLine, Camera, Upload, WifiOff, RefreshCw, Zap, ZapOff } from 'lucide-react'
import { scanImage } from '@/api/scan'
import { enqueue, getQueueCount, flushQueue } from '@/hooks/useOfflineQueue'
import { useToast } from '@/store/toast'
import { cn } from '@/lib/cn'

const AUTO_OFF_MS = 60_000

const styles = {
  root: 'h-full flex flex-col bg-bg',
  header: 'px-4 pt-12 pb-4 flex items-center justify-between md:pt-8',
  headerIcon: 'w-10 h-10 rounded-xl bg-accent-bg border border-accent/20 flex items-center justify-center',
  queueBanner: 'mx-4 mb-3 flex items-center gap-3 bg-warning-bg border border-warning/30 rounded-xl px-4 py-3',
  viewfinder: 'mx-4 relative rounded-2xl overflow-hidden bg-surface border border-border max-h-50',
  actions: 'px-4 py-5 flex flex-col gap-3 md:flex-row md:flex-wrap',
} as const

function isNetworkError(err: unknown): boolean {
  return !(err as { response?: unknown })?.response
}

function compressBlob(source: Blob): Promise<Blob> {
  return new Promise(resolve => {
    const url = URL.createObjectURL(source)
    const img = new Image()

    img.onload = () => {
      const MAX = 800
      const ratio = Math.min(MAX / img.width, MAX / img.height, 1)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * ratio)
      canvas.height = Math.round(img.height * ratio)
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      canvas.toBlob(b => resolve(b!), 'image/jpeg', 0.75)
    }

    img.src = url
  })
}

export function ScanPage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const autoOffRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const [cameraActive, setCameraActive] = useState(false)
  const [cameraSupported, setCameraSupported] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [queueCount, setQueueCount] = useState(0)

  const navigate = useNavigate()
  const toast = useToast()

  const refreshQueue = useCallback((): void => {
    getQueueCount().then(setQueueCount)
  }, [])

  useEffect(() => { refreshQueue() }, [refreshQueue])

  useEffect(() => {
    const handleVisibility = (): void => {
      if (document.visibilityState === 'visible') refreshQueue()
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [refreshQueue])

  const stopCamera = useCallback((): void => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setCameraActive(false)
    clearTimeout(autoOffRef.current)
  }, [])

  const startCamera = useCallback(async (): Promise<void> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 } },
      })
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      setCameraActive(true)
      clearTimeout(autoOffRef.current)
      autoOffRef.current = setTimeout(stopCamera, AUTO_OFF_MS)
    } catch {
      setCameraSupported(false)
    }
  }, [stopCamera])

  useEffect(() => () => stopCamera(), [stopCamera])

  const processBlob = useCallback(async (blob: Blob): Promise<void> => {
    setScanning(true)
    try {
      const compressed = await compressBlob(blob)
      const result = await scanImage(compressed)
      stopCamera()
      navigate('/confirm', { state: { scanResult: result } })
    } catch (err: unknown) {
      if (isNetworkError(err)) {
        const compressed = await compressBlob(blob)
        await enqueue(compressed)
        refreshQueue()
        toast('Saved offline — will sync when connected', 'warning')
      } else {
        const axiosErr = err as { response?: { data?: { message?: string } } }
        toast(axiosErr.response?.data?.message ?? 'Scan failed', 'error')
      }
    } finally {
      setScanning(false)
    }
  }, [navigate, stopCamera, refreshQueue, toast])

  const captureFrame = useCallback((): void => {
    const video = videoRef.current
    if (!video) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')!.drawImage(video, 0, 0)
    canvas.toBlob(blob => blob && processBlob(blob), 'image/jpeg', 0.95)
  }, [processBlob])

  const handleFileChange = useCallback((e: ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0]
    if (file) processBlob(file)
    e.target.value = ''
  }, [processBlob])

  const handleRetryQueue = async (): Promise<void> => {
    toast('Retrying queued scans…', 'warning')
    await flushQueue(
      () => { refreshQueue() },
      () => { toast('Still offline — will retry automatically', 'error') },
    )
    refreshQueue()
  }

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div>
          <h1 className="text-xl font-bold text-text-primary">Scan Product</h1>
          <p className="text-text-sub text-sm mt-0.5">Point camera at product or barcode</p>
        </div>
        <div className={styles.headerIcon} aria-hidden="true">
          <ScanLine size={20} className="text-accent" />
        </div>
      </header>

      {queueCount > 0 && (
        <div className={styles.queueBanner} role="status" aria-live="polite">
          <WifiOff size={18} className="text-warning shrink-0" aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <p className="text-warning text-sm font-medium">
              {queueCount} scan{queueCount > 1 ? 's' : ''} waiting to sync
            </p>
          </div>
          <button
            onClick={handleRetryQueue}
            aria-label="Retry syncing queued scans"
            className="flex items-center gap-1.5 text-xs font-semibold text-warning border border-warning/40 rounded-lg px-3 py-1.5 hover:bg-warning/10"
          >
            <RefreshCw size={14} aria-hidden="true" />
            Retry
          </button>
        </div>
      )}

      <div className={styles.viewfinder}>
        <video
          ref={videoRef}
          playsInline
          muted
          aria-label="Camera viewfinder"
          className={cn('w-full h-full object-cover', !cameraActive && 'hidden')}
        />

        {!cameraActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-accent-bg border border-accent/20 flex items-center justify-center">
              <Camera size={36} className="text-accent" aria-hidden="true" />
            </div>
            <p className="text-text-sub text-sm text-center px-6">
              {cameraSupported
                ? 'Tap "Activate Camera" below to start scanning'
                : 'Live camera not available — use Upload Photo instead'}
            </p>
          </div>
        )}

        {cameraActive && (
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            {[
              ['top-4 left-4', 'border-t-2 border-l-2'],
              ['top-4 right-4', 'border-t-2 border-r-2'],
              ['bottom-4 left-4', 'border-b-2 border-l-2'],
              ['bottom-4 right-4', 'border-b-2 border-r-2'],
            ].map(([pos, border]) => (
              <div key={pos} className={cn('absolute w-8 h-8 border-accent rounded-sm', pos, border)} />
            ))}
          </div>
        )}

        {scanning && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div
                className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin"
                role="status"
                aria-label="Analyzing image"
              />
              <p className="text-white text-sm font-medium">Analyzing…</p>
            </div>
          </div>
        )}
      </div>

      <section className={styles.actions}>
        {cameraSupported && (
          <button
            onClick={cameraActive ? captureFrame : startCamera}
            disabled={scanning}
            className="w-full md:flex-1 flex items-center justify-center gap-2.5 bg-accent hover:bg-accent-light disabled:opacity-50 text-white font-semibold py-4 rounded-2xl text-sm transition-colors shadow-[0_0_24px_rgba(79,106,255,0.3)]"
          >
            {cameraActive ? (
              <><ScanLine size={20} aria-hidden="true" />Capture &amp; Scan</>
            ) : (
              <><Zap size={20} aria-hidden="true" />Activate Camera</>
            )}
          </button>
        )}

        {cameraActive && (
          <button
            onClick={stopCamera}
            className="w-full md:w-auto flex items-center justify-center gap-2 border border-border text-text-sub py-3 px-5 rounded-2xl text-sm hover:border-border-focus hover:text-text-primary transition-colors"
          >
            <ZapOff size={18} aria-hidden="true" />
            Deactivate
          </button>
        )}

        <button
          onClick={() => fileRef.current?.click()}
          disabled={scanning}
          className="w-full md:w-auto flex items-center justify-center gap-2 border border-border text-text-sub py-3 px-5 rounded-2xl text-sm hover:border-border-focus hover:text-text-primary transition-colors"
        >
          <Upload size={18} aria-hidden="true" />
          Upload Photo
        </button>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
          aria-label="Upload product photo"
        />
      </section>
    </div>
  )
}
