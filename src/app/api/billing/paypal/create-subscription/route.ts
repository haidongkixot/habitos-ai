import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isPaidPlanSlug, isBillingInterval } from '@/lib/stripe/tier-resolver'
import { getPayPalPlanId } from '@/lib/paypal/tier-resolver'
import { createPayPalSubscription } from '@/lib/paypal/subscriptions'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { priceSlug, interval } = await req.json()
  if (!isPaidPlanSlug(priceSlug)) return NextResponse.json({ error: 'Invalid plan slug' }, { status: 400 })
  if (!isBillingInterval(interval)) return NextResponse.json({ error: 'Invalid interval' }, { status: 400 })
  if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET)
    return NextResponse.json({ error: 'PayPal not configured' }, { status: 503 })
  const paypalPlanId = getPayPalPlanId(priceSlug as any, interval)
  if (!paypalPlanId) return NextResponse.json({ error: `PayPal plan not configured for ${priceSlug}:${interval}` }, { status: 503 })
  try {
    const { approvalUrl } = await createPayPalSubscription({
      paypalPlanId, email: session.user.email,
      userId: (session.user as any).id,
      appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://habitos.app',
    })
    return NextResponse.json({ url: approvalUrl })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'PayPal checkout failed' }, { status: 500 })
  }
}
