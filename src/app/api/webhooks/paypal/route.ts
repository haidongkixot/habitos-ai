import { NextResponse } from 'next/server'
import { paypalRequest } from '@/lib/paypal/client'
import { syncSubscriptionFromPayPal } from '@/lib/billing/paypal-sync'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const SUBSCRIPTION_EVENTS = new Set([
  'BILLING.SUBSCRIPTION.ACTIVATED',
  'BILLING.SUBSCRIPTION.CANCELLED',
  'BILLING.SUBSCRIPTION.SUSPENDED',
  'BILLING.SUBSCRIPTION.EXPIRED',
])

async function verifyWebhook(req: Request, body: string): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID
  if (!webhookId) return true
  try {
    const result = await paypalRequest<any>('POST', '/v1/notifications/verify-webhook-signature', {
      auth_algo: req.headers.get('paypal-auth-algo'),
      cert_url: req.headers.get('paypal-cert-url'),
      transmission_id: req.headers.get('paypal-transmission-id'),
      transmission_sig: req.headers.get('paypal-transmission-sig'),
      transmission_time: req.headers.get('paypal-transmission-time'),
      webhook_id: webhookId,
      webhook_event: JSON.parse(body),
    })
    return result.verification_status === 'SUCCESS'
  } catch { return false }
}

async function tryClaimPayPalEvent(eventId: string): Promise<boolean> {
  if (!eventId) return true
  try {
    await prisma.siteSettings.create({ data: { key: `paypal.webhook.event:${eventId}`, value: new Date().toISOString() } })
    return true
  } catch (err: any) {
    if (err?.code === 'P2002') return false
    throw err
  }
}

export async function POST(req: Request) {
  const body = await req.text()
  const valid = await verifyWebhook(req, body)
  if (!valid) return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 })
  let event: any
  try { event = JSON.parse(body) } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const eventId: string = event.id
  const eventType: string = event.event_type
  const claimed = await tryClaimPayPalEvent(eventId)
  if (!claimed) return NextResponse.json({ received: true, duplicate: true })
  try {
    if (SUBSCRIPTION_EVENTS.has(eventType)) {
      const subscriptionId: string = event.resource?.id
      if (subscriptionId) await syncSubscriptionFromPayPal(subscriptionId)
    } else if (eventType === 'PAYMENT.SALE.COMPLETED') {
      const subscriptionId: string = event.resource?.billing_agreement_id
      if (subscriptionId) await syncSubscriptionFromPayPal(subscriptionId)
    }
  } catch (err) {
    console.error('[webhook/paypal] handler error', eventType, err)
    return NextResponse.json({ error: 'Handler error' }, { status: 500 })
  }
  return NextResponse.json({ received: true })
}
