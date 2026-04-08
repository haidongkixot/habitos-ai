/**
 * createCheckoutSession — server-side helper that wraps Stripe's
 * checkout.sessions.create with HabitOS conventions baked in.
 *
 * Customer handling: the User schema has NO stripeCustomerId column
 * (M1 schema is frozen). We look up the customer by email each call:
 *   1. stripe.customers.list({ email, limit: 1 })
 *   2. If none, create a new customer with the user's email + name
 *   3. Pass that customer ID into the checkout session
 *
 * Metadata: { userId, planSlug, interval } — the webhook handler
 * reads this to attach the resulting Subscription to the right user.
 */
import type Stripe from 'stripe'
import { stripe } from './client'
import {
  getStripePriceId,
  type BillingInterval,
  type PlanSlug,
} from './tier-resolver'

export interface CreateCheckoutSessionParams {
  userId: string
  userEmail: string
  userName?: string | null
  priceSlug: Exclude<PlanSlug, 'free'>
  interval: BillingInterval
  appUrl: string
}

export interface CreateCheckoutSessionResult {
  url: string
  sessionId: string
  customerId: string
  priceId: string
}

export async function findOrCreateCustomerByEmail(
  email: string,
  name?: string | null,
  metadata?: Record<string, string>
): Promise<Stripe.Customer> {
  const existing = await stripe.customers.list({ email, limit: 1 })
  if (existing.data.length > 0) {
    return existing.data[0]
  }
  return stripe.customers.create({
    email,
    name: name ?? undefined,
    metadata: metadata ?? undefined,
  })
}

export async function createCheckoutSession(
  params: CreateCheckoutSessionParams
): Promise<CreateCheckoutSessionResult> {
  const {
    userId,
    userEmail,
    userName,
    priceSlug,
    interval,
    appUrl,
  } = params

  const priceId = getStripePriceId(priceSlug, interval)
  if (!priceId) {
    throw new Error(
      `No Stripe price configured for slug=${priceSlug} interval=${interval}. ` +
        `Set STRIPE_PRICE_${priceSlug.toUpperCase()}_${interval.toUpperCase()} in env.`
    )
  }

  const customer = await findOrCreateCustomerByEmail(userEmail, userName, {
    userId,
  })

  const successUrl = `${appUrl.replace(/\/$/, '')}/settings/billing?success=1&session_id={CHECKOUT_SESSION_ID}`
  const cancelUrl = `${appUrl.replace(/\/$/, '')}/pricing?canceled=1`

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customer.id,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer_update: {
      address: 'auto',
    },
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
    metadata: {
      userId,
      planSlug: priceSlug,
      interval,
    },
    subscription_data: {
      metadata: {
        userId,
        planSlug: priceSlug,
        interval,
      },
    },
  })

  if (!session.url) {
    throw new Error('Stripe returned a checkout session without a URL')
  }

  return {
    url: session.url,
    sessionId: session.id,
    customerId: customer.id,
    priceId,
  }
}
