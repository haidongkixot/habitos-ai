/**
 * GET /api/billing/current
 *
 * Returns: {
 *   tier: { slug, name, priceMonthly, priceYearly },
 *   subscription: { id, status, currentPeriodStart, currentPeriodEnd,
 *                   cancelAtPeriodEnd, canceledAt, stripeSubId } | null,
 *   canCustomizeCoach: boolean,        // Premium-only (DEC-008)
 *   canEditBasicCoachFields: boolean,  // any paying tier
 * }
 *
 * Used by /settings/billing and /coach/customize page-level gating.
 */
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getCurrentTier } from '@/lib/billing/get-current-tier'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = (session.user as any).id as string | undefined
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await getCurrentTier(userId, { includeStripeCustomer: false })
    return NextResponse.json({
      tier: {
        slug: result.tier.slug,
        name: result.tier.name,
        priceMonthly: result.tier.priceMonthly,
        priceYearly: result.tier.priceYearly,
      },
      subscription: result.subscription,
      canCustomizeCoach: result.canCustomizeCoach,
      canEditBasicCoachFields: result.canEditBasicCoachFields,
    })
  } catch (err) {
    console.error('[api/billing/current]', err)
    return NextResponse.json(
      { error: 'Failed to load billing state' },
      { status: 500 }
    )
  }
}
