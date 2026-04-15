import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = session.user.id
  const referralCode = await prisma.referralCode.findUnique({
    where: { userId },
    include: { referrals: true },
  })
  if (!referralCode) {
    return NextResponse.json({ code: null, link: null, clicks: 0, referrals: [], totalReferred: 0, totalRewarded: 0 })
  }
  const referredUserIds = referralCode.referrals.map((r) => r.referredUserId)
  const referredUsers = await prisma.user.findMany({
    where: { id: { in: referredUserIds } },
    select: { id: true, name: true },
  })
  const userMap = new Map(referredUsers.map((u) => [u.id, u.name]))
  const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  return NextResponse.json({
    code: referralCode.code,
    link: `${appUrl}/invite/${referralCode.code}`,
    clicks: referralCode.clicks,
    referrals: referralCode.referrals.map((r) => ({
      userName: userMap.get(r.referredUserId) || 'Anonymous',
      activatedAt: r.activatedAt,
      rewardGranted: r.rewardGranted,
    })),
    totalReferred: referralCode.referrals.length,
    totalRewarded: referralCode.referrals.filter((r) => r.rewardGranted).length,
  })
}
