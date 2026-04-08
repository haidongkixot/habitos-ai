/**
 * Stripe price ID <-> Plan slug mapping.
 *
 * The Plan model in prisma/schema.prisma has no stripePriceId column
 * (M1 schema is frozen). Workaround: store Stripe price IDs in env
 * vars keyed by `STRIPE_PRICE_<SLUG>_<INTERVAL>` and resolve at runtime.
 *
 * Slug values match prisma/seed-plan-tiers.ts:
 *   free | starter | pro | premium
 *
 * `free` has no Stripe price (it is the default fallback tier).
 */

export type PlanSlug = 'free' | 'starter' | 'pro' | 'premium'
export type BillingInterval = 'monthly' | 'yearly'

export const PAID_PLAN_SLUGS: ReadonlyArray<Exclude<PlanSlug, 'free'>> = [
  'starter',
  'pro',
  'premium',
] as const

export const ALL_PLAN_SLUGS: ReadonlyArray<PlanSlug> = [
  'free',
  'starter',
  'pro',
  'premium',
] as const

export function isPlanSlug(value: unknown): value is PlanSlug {
  return (
    typeof value === 'string' &&
    (ALL_PLAN_SLUGS as ReadonlyArray<string>).includes(value)
  )
}

export function isPaidPlanSlug(
  value: unknown
): value is Exclude<PlanSlug, 'free'> {
  return (
    typeof value === 'string' &&
    (PAID_PLAN_SLUGS as ReadonlyArray<string>).includes(value)
  )
}

export function isBillingInterval(value: unknown): value is BillingInterval {
  return value === 'monthly' || value === 'yearly'
}

/**
 * Resolve a Stripe price ID for a (slug, interval) pair from env vars.
 * Returns null if the env var is missing — callers should treat that as
 * a 400 ("price not configured for this tier+interval").
 */
export function getStripePriceId(
  slug: Exclude<PlanSlug, 'free'>,
  interval: BillingInterval
): string | null {
  const key = `STRIPE_PRICE_${slug.toUpperCase()}_${interval.toUpperCase()}`
  const value = process.env[key]
  if (!value) return null
  return value
}

/**
 * Reverse map: given a Stripe price ID (from a Subscription item),
 * find which (slug, interval) it corresponds to. Returns null if no
 * match (e.g. an old test price that was deleted from env).
 */
export function getPlanSlugFromPriceId(
  priceId: string
): { slug: Exclude<PlanSlug, 'free'>; interval: BillingInterval } | null {
  for (const slug of PAID_PLAN_SLUGS) {
    for (const interval of ['monthly', 'yearly'] as const) {
      const id = getStripePriceId(slug, interval)
      if (id && id === priceId) {
        return { slug, interval }
      }
    }
  }
  return null
}

/**
 * Convenience: list every (slug, interval, priceId) we have configured.
 * Used by the seed-stripe-prices.ts helper for diagnostics.
 */
export function listConfiguredPrices(): Array<{
  slug: Exclude<PlanSlug, 'free'>
  interval: BillingInterval
  priceId: string
}> {
  const out: Array<{
    slug: Exclude<PlanSlug, 'free'>
    interval: BillingInterval
    priceId: string
  }> = []
  for (const slug of PAID_PLAN_SLUGS) {
    for (const interval of ['monthly', 'yearly'] as const) {
      const id = getStripePriceId(slug, interval)
      if (id) out.push({ slug, interval, priceId: id })
    }
  }
  return out
}
