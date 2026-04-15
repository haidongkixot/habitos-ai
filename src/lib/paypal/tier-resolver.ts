const PAID_PLAN_SLUGS = ['starter', 'pro', 'premium'] as const
type PaidPlanSlug = 'starter' | 'pro' | 'premium'
type BillingInterval = 'monthly' | 'yearly'

export function getPayPalPlanId(slug: PaidPlanSlug, interval: BillingInterval): string | null {
  return process.env[`PAYPAL_PLAN_${slug.toUpperCase()}_${interval.toUpperCase()}`] ?? null
}

export function getPlanSlugFromPayPalPlanId(paypalPlanId: string): { slug: PaidPlanSlug; interval: BillingInterval } | null {
  for (const slug of PAID_PLAN_SLUGS) {
    for (const interval of ['monthly', 'yearly'] as const) {
      const id = getPayPalPlanId(slug, interval)
      if (id && id === paypalPlanId) return { slug, interval }
    }
  }
  return null
}
