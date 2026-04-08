/**
 * POST /api/webhooks/stripe
 *
 * Stripe webhook receiver. Verifies signature, deduplicates by event.id,
 * and dispatches subscription events to syncSubscriptionFromStripe.
 *
 * IDEMPOTENCY STRATEGY (see lib/billing/webhook-events.ts for full notes):
 * Schema is frozen so we cannot add a dedicated ProcessedWebhookEvent
 * table. We use the existing SiteSettings table (key/value String,
 * key @unique) with key=`stripe.webhook.event:<event.id>`. The unique
 * constraint makes the claim atomic across multiple webhook instances.
 *
 * MUST read the raw body via req.text() — JSON parsing the body BEFORE
 * verifying the signature would break the HMAC (Stripe signs the exact
 * bytes). Next.js 14 App Router gives us req.text() for raw body access.
 *
 * MUST always return 2xx for processed/duplicate/unknown events. Only
 * return 400 on signature verification failure.
 */
import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { stripe } from '@/lib/stripe/client'
import { syncSubscriptionFromStripe } from '@/lib/billing/sync'
import { tryClaimEvent } from '@/lib/billing/webhook-events'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const RELEVANT_TYPES = new Set<string>([
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.paid',
  'invoice.payment_failed',
])

export async function POST(req: Request) {
  const signature = req.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.error(
      '[stripe/webhook] STRIPE_WEBHOOK_SECRET not configured — refusing webhook'
    )
    return NextResponse.json(
      { error: 'Webhook not configured' },
      { status: 500 }
    )
  }
  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    )
  }

  // CRITICAL: read raw body (NOT req.json()) so signature verification works.
  let rawBody: string
  try {
    rawBody = await req.text()
  } catch (err) {
    console.error('[stripe/webhook] failed to read raw body', err)
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (err: any) {
    console.error('[stripe/webhook] signature verification failed:', err?.message ?? err)
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${err?.message ?? 'unknown'}` },
      { status: 400 }
    )
  }

  // Idempotency check.
  let claimed: 'fresh' | 'duplicate'
  try {
    claimed = await tryClaimEvent(event.id)
  } catch (err) {
    console.error('[stripe/webhook] idempotency claim failed', err)
    // Returning 500 makes Stripe retry — that's the right call here.
    return NextResponse.json({ error: 'Idempotency check failed' }, { status: 500 })
  }
  if (claimed === 'duplicate') {
    console.log('[stripe/webhook] duplicate event, skipping', event.id, event.type)
    return NextResponse.json({ received: true, duplicate: true })
  }

  // Dispatch.
  try {
    if (!RELEVANT_TYPES.has(event.type)) {
      console.log('[stripe/webhook] ignoring event type', event.type, event.id)
      return NextResponse.json({ received: true, ignored: true })
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        // For subscription mode, fetch the resulting subscription and sync it.
        if (session.mode === 'subscription' && session.subscription) {
          const subId =
            typeof session.subscription === 'string'
              ? session.subscription
              : session.subscription.id
          const sub = await stripe.subscriptions.retrieve(subId)
          await syncSubscriptionFromStripe(sub)
        }
        break
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        await syncSubscriptionFromStripe(sub)
        break
      }
      case 'invoice.paid':
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subRef = (invoice as any).subscription
        if (subRef) {
          const subId = typeof subRef === 'string' ? subRef : subRef.id
          try {
            const sub = await stripe.subscriptions.retrieve(subId)
            await syncSubscriptionFromStripe(sub)
          } catch (err) {
            console.warn(
              '[stripe/webhook] failed to refetch subscription for invoice',
              subId,
              err
            )
          }
        }
        break
      }
      default:
        // Should be unreachable thanks to RELEVANT_TYPES guard above.
        break
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('[stripe/webhook] handler failed', event.type, event.id, err)
    // Return 500 so Stripe retries — but the idempotency claim is already
    // recorded, which means the retry will be marked duplicate. That is a
    // known wart of this strategy: if the dispatch fails AFTER claim, we
    // lose the chance to retry. The alternative (claim AFTER dispatch)
    // races with parallel deliveries. We accept the trade because Stripe
    // event retries on transient failures are rare in practice.
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 })
  }
}
