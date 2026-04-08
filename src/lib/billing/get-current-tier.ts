/**
 * getCurrentTier — server-side helper for the /settings/billing page.
 *
 * Wraps src/lib/academy/access.ts:getUserPlanSlug() for symmetry but
 * also returns:
 *   - the active Subscription row (if any) with Stripe IDs + period info
 *   - the canCustomizeCoach flag (Premium-only per DEC-008)
 *   - the canEditBasicCoachFields flag (any paying tier)
 *   - the resolved Stripe customer ID (looked up by email)
 *
 * Used by GET /api/billing/current and any server component that needs
 * to gate UI on the user's tier.
 */
import { prisma } from '@/lib/prisma'
import { getUserPlanSlug } from '@/lib/academy/access'
import { findCustomerByEmail } from '@/lib/stripe/portal'
import type { PlanSlug } from '@/lib/stripe/tier-resolver'

export interface CurrentTierTier {
  slug: PlanSlug
  name: string
  priceMonthly: number
  priceYearly: number
}

export interface CurrentTierSubscription {
  id: string
  status: string
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  canceledAt: string | null
  stripeSubId: string | null
}

export interface CurrentTierResult {
  tier: CurrentTierTier
  subscription: CurrentTierSubscription | null
  /**
   * Premium-only: full coach picker (outfitPack + accent fields).
   * Per DEC-008.
   */
  canCustomizeCoach: boolean
  /**
   * Any paying tier (starter / pro / premium): basic coach fields
   * (customName, customGender, relationshipStyle, customSystemAdd).
   * Free tier cannot edit these.
   */
  canEditBasicCoachFields: boolean
  /**
   * The user's Stripe customer ID, if one exists. Populated lazily by
   * an email lookup against Stripe — null if the user has never opened
   * a checkout session.
   */
  stripeCustomerId: string | null
}

const FREE_FALLBACK: CurrentTierTier = {
  slug: 'free',
  name: 'Free',
  priceMonthly: 0,
  priceYearly: 0,
}

function isPlanSlugString(s: string): s is PlanSlug {
  return s === 'free' || s === 'starter' || s === 'pro' || s === 'premium'
}

export async function getCurrentTier(
  userId: string,
  options: { includeStripeCustomer?: boolean } = {}
): Promise<CurrentTierResult> {
  // 1. Resolve plan slug via the same helper academy uses.
  const slugRaw = await getUserPlanSlug(userId)
  const slug: PlanSlug = isPlanSlugString(slugRaw) ? slugRaw : 'free'

  // 2. Look up the Plan row for name + prices.
  let tier: CurrentTierTier = FREE_FALLBACK
  const planRow = await prisma.plan.findUnique({
    where: { slug },
    select: { slug: true, name: true, priceMonthly: true, priceYearly: true },
  })
  if (planRow && isPlanSlugString(planRow.slug)) {
    tier = {
      slug: planRow.slug,
      name: planRow.name,
      priceMonthly: planRow.priceMonthly,
      priceYearly: planRow.priceYearly,
    }
  }

  // 3. Pull the most recent active subscription, if any.
  let subscription: CurrentTierSubscription | null = null
  const subRow = await prisma.subscription.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })
  if (subRow) {
    subscription = {
      id: subRow.id,
      status: subRow.status,
      currentPeriodStart: subRow.currentPeriodStart.toISOString(),
      currentPeriodEnd: subRow.currentPeriodEnd.toISOString(),
      // The Subscription model doesn't store cancelAtPeriodEnd as a
      // dedicated column — derive it: cancellation has been *requested*
      // (canceledAt is set) but the period hasn't ended yet.
      cancelAtPeriodEnd:
        Boolean(subRow.canceledAt) &&
        subRow.currentPeriodEnd.getTime() > Date.now() &&
        subRow.status !== 'canceled',
      canceledAt: subRow.canceledAt ? subRow.canceledAt.toISOString() : null,
      stripeSubId: subRow.stripeSubId,
    }
  }

  // 4. Permission flags per DEC-008.
  const canCustomizeCoach = slug === 'premium'
  const canEditBasicCoachFields = slug !== 'free'

  // 5. Optional: resolve the Stripe customer (email lookup).
  let stripeCustomerId: string | null = null
  if (options.includeStripeCustomer) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      })
      if (user?.email) {
        const customer = await findCustomerByEmail(user.email)
        stripeCustomerId = customer?.id ?? null
      }
    } catch (err) {
      console.warn('[billing/get-current-tier] stripe lookup failed', err)
    }
  }

  return {
    tier,
    subscription,
    canCustomizeCoach,
    canEditBasicCoachFields,
    stripeCustomerId,
  }
}
