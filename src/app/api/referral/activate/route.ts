import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!(session?.user as any)?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = (session.user as any).id as string

  // Find pending referral reward for this user
  const reward = await prisma.referralReward.findUnique({
    where: { referredUserId: userId },
    include: { referralCode: true },
  })

  if (!reward) {
    return NextResponse.json({ error: 'No referral found' }, { status: 404 })
  }

  if (reward.activatedAt) {
    return NextResponse.json({ message: 'Already activated' })
  }

  // Activate the referral and grant reward to referrer
  const now = new Date()
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  await prisma.$transaction(async (tx) => {
    // Mark the referral as activated and reward granted
    await tx.referralReward.update({
      where: { id: reward.id },
      data: {
        activatedAt: now,
        rewardGranted: true,
      },
    })

    // Check referrer exists
    const referrer = await tx.user.findUnique({
      where: { id: reward.referrerId },
      select: { id: true },
    })

    if (!referrer) return

    // Find the pro plan
    const proPlan = await tx.plan.findUnique({
      where: { slug: 'pro' },
    })

    if (!proPlan) return

    // Check for existing active pro subscription to extend
    const existingSub = await tx.subscription.findFirst({
      where: {
        userId: referrer.id,
        status: 'active',
        plan: { slug: 'pro' },
      },
      include: { plan: true },
    })

    if (existingSub && existingSub.currentPeriodEnd) {
      // Extend existing subscription by 30 days
      await tx.subscription.update({
        where: { id: existingSub.id },
        data: {
          currentPeriodEnd: new Date(
            existingSub.currentPeriodEnd.getTime() + 30 * 24 * 60 * 60 * 1000
          ),
        },
      })
    } else {
      // Create a new referral-based subscription
      await tx.subscription.create({
        data: {
          userId: referrer.id,
          planId: proPlan.id,
          status: 'active',
          currentPeriodStart: now,
          currentPeriodEnd: thirtyDaysFromNow,
        },
      })
    }
  })

  return NextResponse.json({ success: true, message: 'Referral activated' })
}
