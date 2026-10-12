import { openDB } from 'idb'
import { scanImage } from '../api/scan'
import type { QueueEntry } from '../types'

const dbPromise = openDB('lazytracker-queue', 1, {
  upgrade(db) {
    db.createObjectStore('queue', { keyPath: 'id', autoIncrement: true })
  },
})

export async function enqueue(blob: Blob): Promise<void> {
  const reader = new FileReader()
  const imageBase64 = await new Promise<string>((resolve, reject) => {
    reader.onload = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
  const entry: Omit<QueueEntry, 'id'> = {
    imageBase64,
    mimeType: blob.type || 'image/jpeg',
    timestamp: Date.now(),
  }
  const db = await dbPromise
  await db.add('queue', entry)
}

export async function getQueueCount(): Promise<number> {
  const db = await dbPromise
  return db.count('queue')
}

export async function flushQueue(
  onItem?: () => void,
  onError?: (err: unknown) => void,
): Promise<void> {
  const db = await dbPromise
  const all = await db.getAll('queue') as QueueEntry[]

  for (const entry of all) {
    try {
      // Re-build a Blob from stored base64 so scanImage can call blobToBase64 again
      const bytes = Uint8Array.from(atob(entry.imageBase64), c => c.charCodeAt(0))
      const blob = new Blob([bytes], { type: entry.mimeType })
      await scanImage(blob)
      await db.delete('queue', entry.id!)
      onItem?.()
    } catch (err: any) {
      // Stop on network errors; server errors are unrecoverable — remove the entry
      if (!err?.response) {
        onError?.(err)
        break
      }
      // 4xx → bad item, discard and continue
      await db.delete('queue', entry.id!)
    }
  }
}

// Auto-flush when connection is restored
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => flushQueue())
}
