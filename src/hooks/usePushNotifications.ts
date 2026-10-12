import { useState, useEffect } from 'react'
import { api } from '../api/client'

export function usePushNotifications() {
  const [supported, setSupported] = useState(false)
  const [subscribed, setSubscribed] = useState(false)

  useEffect(() => {
    setSupported('serviceWorker' in navigator && 'PushManager' in window)
  }, [])

  const subscribe = async () => {
    const reg = await navigator.serviceWorker.ready
    const existing = await reg.pushManager.getSubscription()
    if (existing) { setSubscribed(true); return }

    const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY
    if (!vapidKey) throw new Error('VITE_VAPID_PUBLIC_KEY not set')

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: vapidKey,
    })
    await api.post('/notifications/subscribe', sub)
    setSubscribed(true)
  }

  return { supported, subscribed, subscribe }
}
