/**
 * HabitOS M4 — Web Push dispatcher.
 *
 * Sends push notifications via the `web-push` library. VAPID keys are read
 * lazily from env so the module imports safely in environments without
 * them (build, local dev). If either key is missing, `sendPushNotification`
 * returns `{ ok: false, statusCode: 0, error: 'missing_vapid_keys' }`
 * without throwing.
 *
 * On `410 Gone` or `404 Not Found` the caller should treat the subscription
 * as dead. The schema does not currently ship an `active` flag on
 * `PushSubscription`, so callers delete the row instead. This helper
 * simply reports the HTTP status and lets the caller decide.
 */

import { prisma } from '@/lib/prisma'

export interface PushSubscriptionLike {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

export interface SendPushInput {
  subscription: PushSubscriptionLike
  title: string
  body: string
  url?: string
  tag?: string
  icon?: string
}

export interface SendPushResult {
  ok: boolean
  statusCode: number
  error?: string
}

let vapidConfigured = false
let vapidAvailable = false

async function getWebPush(): Promise<any | null> {
  try {
    const mod: any = await import('web-push')
    const webpush = mod.default ?? mod

    if (!vapidConfigured) {
      vapidConfigured = true
      const pub = process.env.VAPID_PUBLIC_KEY
      const priv = process.env.VAPID_PRIVATE_KEY
      const subject = process.env.VAPID_SUBJECT || 'mailto:coach@habitos.ai'
      if (pub && priv) {
        try {
          webpush.setVapidDetails(subject, pub, priv)
          vapidAvailable = true
        } catch (err) {
          console.error('[notifications/push] setVapidDetails failed', err)
          vapidAvailable = false
        }
      } else {
        vapidAvailable = false
      }
    }

    return webpush
  } catch (err) {
    console.error('[notifications/push] failed to import web-push', err)
    return null
  }
}

export async function sendPushNotification(
  input: SendPushInput
): Promise<SendPushResult> {
  const { subscription, title, body, url, tag, icon } = input

  const webpush = await getWebPush()
  if (!webpush || !vapidAvailable) {
    return { ok: false, statusCode: 0, error: 'missing_vapid_keys' }
  }

  const payload = JSON.stringify({
    title,
    body,
    url: url ?? '/',
    tag: tag ?? 'habitos',
    icon: icon ?? '/icons/icon-192.png',
  })

  try {
    const res = await webpush.sendNotification(subscription, payload)
    return { ok: true, statusCode: res?.statusCode ?? 201 }
  } catch (err: any) {
    const statusCode: number = Number(err?.statusCode ?? 0)
    // Dead subscription — clean up.
    if (statusCode === 404 || statusCode === 410) {
      try {
        await (prisma as any).pushSubscription.deleteMany({
          where: { endpoint: subscription.endpoint },
        })
      } catch (cleanupErr) {
        console.error(
          '[notifications/push] cleanup failed for dead subscription',
          cleanupErr
        )
      }
    }
    return {
      ok: false,
      statusCode,
      error: String(err?.body ?? err?.message ?? err),
    }
  }
}
