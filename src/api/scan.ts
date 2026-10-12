import { api } from './client'
import type { ScanResponse } from '../types'

/** Convert Blob → base64 string (strips the data URI prefix) */
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Strip "data:image/jpeg;base64," prefix
      resolve(result.split(',')[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export async function scanImage(blob: Blob): Promise<ScanResponse> {
  const imageBase64 = await blobToBase64(blob)
  const mimeType = blob.type || 'image/jpeg'
  return api.post<ScanResponse>('/scan', { imageBase64, mimeType }).then(r => r.data)
}

export const confirmScan = (productId: string, quantity: number) =>
  api.post(`/stock/${productId}`, { quantity })
