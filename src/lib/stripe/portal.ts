/**
 * createPortalSession — wraps Stripe's billingPortal.sessions.create.
 *
 * The customer must already exist in Stripe (i.e. they checked out
 * at least once). If we cannot find a customer for the user, the
 * caller should respond with 404 — the user is on the free tier and
 * has nothing to manage in Stripe yet.
 */
import type Stripe from 'stripe'
import { stripe } from './client'

export interface CreatePortalSessionParams {
  customerId: string
  appUrl: string
}

export interface CreatePortalSessionResult {
  url: string
  sessionId: string
}

export async function createPortalSession(
  params: CreatePortalSessionParams
): Promise<CreatePortalSessionResult> {
  const { customerId, appUrl } = params
  const returnUrl = `${appUrl.replace(/\/$/, '')}/settings/billing`

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })

  return {
    url: session.url,
    sessionId: session.id,
  }
}

/**
 * Find a Stripe customer for a HabitOS user by email.
 * Returns null if no customer exists in Stripe yet (free tier user
 * who never opened a checkout session).
 */
export async function findCustomerByEmail(
  email: string
): Promise<Stripe.Customer | null> {
  const result = await stripe.customers.list({ email, limit: 1 })
  if (result.data.length === 0) return null
  return result.data[0]
}
