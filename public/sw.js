/* HabitOS Service Worker
 * Handles web push notifications for reminders, milestones, and coaching nudges.
 * Registered by src/components/push/push-registration.tsx after the user opts in.
 */

// Log lifecycle so we can see in DevTools > Application > Service Workers.
self.addEventListener('install', (event) => {
  // Activate immediately so new pushes start flowing on next notification.
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

// push: payload is delivered by the server via web-push with a VAPID auth header.
self.addEventListener('push', (event) => {
  let payload = {}
  try {
    payload = event.data ? event.data.json() : {}
  } catch (err) {
    // If the payload is not valid JSON, fall back to plain text.
    payload = { title: 'HabitOS', body: event.data ? event.data.text() : '' }
  }

  const title = payload.title || 'HabitOS'
  const body = payload.body || ''
  const url = payload.url || '/'
  const tag = payload.tag || 'habitos-reminder'

  const options = {
    body,
    data: { url },
    tag,
    icon: '/icon-192.svg',
    badge: '/badge-72.svg',
    // Re-alert if the same tag fires again (e.g. escalated streak reminder).
    renotify: true,
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

// notificationclick: close the toast and focus (or open) the deep-link URL.
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = (event.notification.data && event.notification.data.url) || '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If there's already a HabitOS tab open, focus it and navigate there.
      for (const client of windowClients) {
        if ('focus' in client) {
          try {
            client.navigate(target)
            return client.focus()
          } catch (err) {
            // Cross-origin or other restriction — fall through to openWindow.
          }
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(target)
      }
      return undefined
    }),
  )
})

// pushsubscriptionchange: browser rotated the subscription; try to re-subscribe.
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const keyRes = await fetch('/api/push/vapid-key')
        if (!keyRes.ok) return
        const { publicKey } = await keyRes.json()
        if (!publicKey) return

        const applicationServerKey = urlBase64ToUint8Array(publicKey)
        const newSub = await self.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        })
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newSub),
        })
      } catch (err) {
        // Swallow — nothing more we can do from the SW context.
      }
    })(),
  )
})

// Helper: VAPID public key → Uint8Array for pushManager.subscribe.
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const output = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; ++i) {
    output[i] = raw.charCodeAt(i)
  }
  return output
}
