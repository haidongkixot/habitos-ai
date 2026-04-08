/**
 * POST /api/billing/portal
 *
 * Body: {} (empty)
 * Returns: { url: string }
 *
 * Errors:
 *   401 — not signed in
 *   404 — no Stripe customer for this user (free tier never paid)
 *   500 — Stripe SDK failure
 */
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createPortalSession, findCustomerByEmail } from '@/lib/stripe/portal'

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

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = (session.user as any).id as string | undefined
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
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
    const customer = await findCustomerByEmail(user.email)
    if (!customer) {
      return NextResponse.json(
        { error: 'No active subscription to manage' },
        { status: 404 }
      )
    }
    const result = await createPortalSession({
      customerId: customer.id,
      appUrl: getAppUrl(),
    })
    return NextResponse.json({ url: result.url })
  } catch (err) {
    console.error('[api/billing/portal]', err)
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    )
  }
}
