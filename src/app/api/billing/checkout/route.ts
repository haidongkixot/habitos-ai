/**
 * POST /api/billing/checkout
 *
 * Body: { priceSlug: 'starter'|'pro'|'premium', interval: 'monthly'|'yearly' }
 * Returns: { url: string }
 *
 * Errors:
 *   401 — not signed in
 *   400 — invalid body / unknown priceSlug / no Stripe price configured
 *   500 — Stripe SDK failure
 */
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createCheckoutSession } from '@/lib/stripe/checkout'
import {
  isBillingInterval,
  isPaidPlanSlug,
} from '@/lib/stripe/tier-resolver'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function getAppUrl(): string {
  return (
    process.env.NEXTAUTH_URL ??
    process.env.APP_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    'http://localhost:3000'
  )
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = (session.user as any).id as string | undefined
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const priceSlug = body?.priceSlug
  const interval = body?.interval

  if (!isPaidPlanSlug(priceSlug)) {
    return NextResponse.json(
      { error: 'priceSlug must be one of starter|pro|premium' },
      { status: 400 }
    )
  }
  if (!isBillingInterval(interval)) {
    return NextResponse.json(
      { error: 'interval must be monthly or yearly' },
      { status: 400 }
    )
  }

  // Pull email + name for the Stripe customer.
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true },
  })
  if (!user || !user.email) {
    return NextResponse.json(
      { error: 'User has no email on file' },
      { status: 400 }
    )
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: 'Stripe is not configured on this server' },
      { status: 500 }
    )
  }

  try {
    const result = await createCheckoutSession({
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      priceSlug,
      interval,
      appUrl: getAppUrl(),
    })
    return NextResponse.json({ url: result.url })
  } catch (err: any) {
    const message = err?.message ?? 'Failed to create checkout session'
    // No price configured for this slug+interval -> 400 (client config issue).
    if (message.startsWith('No Stripe price configured')) {
      return NextResponse.json({ error: message }, { status: 400 })
    }
    console.error('[api/billing/checkout]', err)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
