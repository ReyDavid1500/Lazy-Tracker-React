import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/cn'

type ToastType = 'success' | 'error' | 'warning'

type Toast = {
  readonly id: number
  readonly msg: string
  readonly type: ToastType
}

type ShowToastFn = (msg: string, type?: ToastType) => void

const ToastCtx = createContext<ShowToastFn>(null!)

const TOAST_DURATION_MS = 3500

const TOAST_ICONS = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
} as const

const TOAST_STYLES = {
  success: 'bg-success text-white',
  error: 'bg-danger text-white',
  warning: 'bg-warning text-bg',
} as const

type ToastProviderProps = {
  readonly children: ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const show = useCallback((msg: string, type: ToastType = 'success'): void => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, msg, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), TOAST_DURATION_MS)
  }, [])

  return (
    <ToastCtx.Provider value={show}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="fixed top-4 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-[100] flex flex-col gap-2 pointer-events-none"
      >
        {toasts.map(t => {
          const Icon = TOAST_ICONS[t.type]
          return (
            <div
              key={t.id}
              className={cn(
                'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium shadow-lg',
                TOAST_STYLES[t.type],
              )}
            >
              <Icon size={18} className="shrink-0" aria-hidden="true" />
              <span>{t.msg}</span>
            </div>
          )
        })}
      </div>
    </ToastCtx.Provider>
  )
}

export const useToast = (): ShowToastFn => useContext(ToastCtx)
