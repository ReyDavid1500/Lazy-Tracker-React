/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { NetworkFirst } from 'workbox-strategies'

declare const self: ServiceWorkerGlobalScope

// Workbox — injected at build time by vite-plugin-pwa
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// Runtime cache: API calls (NetworkFirst, 10s timeout)
registerRoute(
  ({ url }) => url.pathname.startsWith('/api') || /\/api\//i.test(url.href),
  new NetworkFirst({ cacheName: 'api-cache', networkTimeoutSeconds: 10 })
)

// Push notifications
self.addEventListener('push', (event) => {
  const data = (event as PushEvent).data?.json() ?? {}
  ;(event as ExtendableEvent).waitUntil(
    self.registration.showNotification(data.title ?? 'LazyTracker', {
      body: data.body ?? '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: { url: data.url ?? '/' },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  const notifEvent = event as NotificationEvent
  notifEvent.notification.close()
  notifEvent.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        const targetUrl: string = notifEvent.notification.data?.url ?? '/'
        const existing = clientList.find((c) => c.url === targetUrl)
        if (existing) return existing.focus()
        return self.clients.openWindow(targetUrl)
      })
  )
})
