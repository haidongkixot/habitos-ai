import { NextResponse } from 'next/server'
import { paypalRequest } from '@/lib/paypal/client'
import { syncSubscriptionFromPayPal } from '@/lib/billing/paypal-sync'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const SUBSCRIPTION_EVENTS = new Set([
  'BILLING.SUBSCRIPTION.ACTIVATED', 'BILLING.SUBSCRIPTION.CANCELLED',
  'BILLING.SUBSCRIPTION.SUSPENDED', 'BILLING.SUBSCRIPTION.EXPIRED',
])

async function verifyWebhook(req: Request, body: string): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID
  if (!webhookId) return true
  try {
    const result = await paypalRequest<any>('POST', '/v1/notifications/verify-webhook-signature', {
      auth_algo: req.headers.get('paypal-auth-algo'), cert_url: req.headers.get('paypal-cert-url'),
      transmission_id: req.headers.get('paypal-transmission-id'), transmission_sig: req.headers.get('paypal-transmission-sig'),
      transmission_time: req.headers.get('paypal-transmission-time'), webhook_id: webhookId, webhook_event: JSON.parse(body),
    })
    return result.verification_status === 'SUCCESS'
  } catch { return false }
}

async function tryClaimPayPalEvent(eventId: string): Promise<boolean> {
  if (!eventId) return true
  try {
    await prisma.siteSettings.create({ data: { key: `paypal.webhook.event:${eventId}`, value: new Date().toISOString() } })
    return true
  } catch (err: any) { if (err?.code === 'P2002') return false; throw err }
}

export async function POST(req: Request) {
  const body = await req.text()
  if (!await verifyWebhook(req, body)) return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  let event: any
  try { event = JSON.parse(body) } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  if (!await tryClaimPayPalEvent(event.id)) return NextResponse.json({ received: true, duplicate: true })
  try {
    if (SUBSCRIPTION_EVENTS.has(event.event_type)) { const id = event.resource?.id; if (id) await syncSubscriptionFromPayPal(id) }
    else if (event.event_type === 'PAYMENT.SALE.COMPLETED') { const id = event.resource?.billing_agreement_id; if (id) await syncSubscriptionFromPayPal(id) }
  } catch (err) { return NextResponse.json({ error: 'Handler error' }, { status: 500 }) }
  return NextResponse.json({ received: true })
}
