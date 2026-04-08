'use client'

/**
 * Push notification registration helpers.
 *
 * Flow:
 *  1. Ask Notification.requestPermission()
 *  2. Register /sw.js
 *  3. Fetch VAPID public key from /api/push/vapid-key (server-held; never NEXT_PUBLIC_*)
 *  4. pushManager.subscribe({ userVisibleOnly, applicationServerKey })
 *  5. POST the subscription to /api/push/subscribe
 *
 * Unregister reverses the subscription and tells the server to forget it.
 */

export type PushRegistrationResult =
  | { ok: true; subscription: PushSubscription }
  | { ok: false; reason: PushFailureReason; message: string }

export type PushFailureReason =
  | 'unsupported'
  | 'permission-denied'
  | 'permission-dismissed'
  | 'vapid-key-missing'
  | 'subscribe-failed'
  | 'server-rejected'
  | 'unknown'

/** Convert a base64url-encoded VAPID key to a BufferSource for pushManager.subscribe. */
function urlBase64ToUint8Array(base64String: string): BufferSource {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = typeof atob === 'function' ? atob(base64) : ''
  const output = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; ++i) {
    output[i] = raw.charCodeAt(i)
  }
  // Cast to BufferSource to avoid the Uint8Array<ArrayBufferLike> type friction
  // in newer TS lib.dom definitions.
  return output as unknown as BufferSource
}

/** Returns true when the current browser has the APIs we need. */
export function isPushSupported(): boolean {
  if (typeof window === 'undefined') return false
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

/**
 * Opt the current user into web push.
 * Safe to call multiple times — it will reuse an existing subscription.
 */
export async function registerForPush(): Promise<PushRegistrationResult> {
  if (!isPushSupported()) {
    return {
      ok: false,
      reason: 'unsupported',
      message: 'Push notifications are not supported in this browser.',
    }
  }

  // 1. Permission
  let permission: NotificationPermission
  try {
    permission = await Notification.requestPermission()
  } catch (err) {
    return {
      ok: false,
      reason: 'unknown',
      message: err instanceof Error ? err.message : 'Permission request failed.',
    }
  }

  if (permission === 'denied') {
    return {
      ok: false,
      reason: 'permission-denied',
      message: 'Notifications are blocked. Re-enable them from your browser site settings.',
    }
  }
  if (permission !== 'granted') {
    return {
      ok: false,
      reason: 'permission-dismissed',
      message: 'Notification permission was dismissed. You can enable it later from Settings.',
    }
  }

  // 2. Service worker
  let registration: ServiceWorkerRegistration
  try {
    registration = await navigator.serviceWorker.register('/sw.js')
    // Make sure it's active before we subscribe.
    if (registration.installing) {
      await new Promise<void>((resolve) => {
        const worker = registration.installing
        if (!worker) return resolve()
        worker.addEventListener('statechange', () => {
          if (worker.state === 'activated' || worker.state === 'redundant') resolve()
        })
      })
    }
  } catch (err) {
    return {
      ok: false,
      reason: 'unknown',
      message: err instanceof Error ? err.message : 'Service worker registration failed.',
    }
  }

  // 3. VAPID public key from the server — never expose via NEXT_PUBLIC_*
  let publicKey: string | null = null
  try {
    const res = await fetch('/api/push/vapid-key', { cache: 'no-store' })
    if (res.ok) {
      const data = (await res.json()) as { publicKey?: string }
      publicKey = data.publicKey ?? null
    }
  } catch {
    // fall through to vapid-key-missing below
  }
  if (!publicKey) {
    return {
      ok: false,
      reason: 'vapid-key-missing',
      message: 'Could not fetch VAPID public key from the server.',
    }
  }

  // 4. Subscribe
  let subscription: PushSubscription
  try {
    const existing = await registration.pushManager.getSubscription()
    if (existing) {
      subscription = existing
    } else {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })
    }
  } catch (err) {
    return {
      ok: false,
      reason: 'subscribe-failed',
      message: err instanceof Error ? err.message : 'pushManager.subscribe failed.',
    }
  }

  // 5. Tell the server
  try {
    const res = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription.toJSON()),
    })
    if (!res.ok) {
      return {
        ok: false,
        reason: 'server-rejected',
        message: `Server rejected subscription (${res.status}).`,
      }
    }
  } catch (err) {
    return {
      ok: false,
      reason: 'server-rejected',
      message: err instanceof Error ? err.message : 'Could not POST subscription.',
    }
  }

  return { ok: true, subscription }
}

export type PushUnregisterResult =
  | { ok: true }
  | { ok: false; message: string }

/** Undo registerForPush(). Safe to call when no subscription exists. */
export async function unregisterFromPush(): Promise<PushUnregisterResult> {
  if (!isPushSupported()) {
    return { ok: true }
  }
  try {
    const registration = await navigator.serviceWorker.getRegistration('/sw.js')
    if (!registration) return { ok: true }
    const sub = await registration.pushManager.getSubscription()
    if (sub) {
      try {
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        })
      } catch {
        // Non-fatal — still unsubscribe locally.
      }
      await sub.unsubscribe()
    }
    return { ok: true }
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : 'Failed to unregister push.',
    }
  }
}
