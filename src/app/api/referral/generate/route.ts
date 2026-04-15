import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function generateCode(): string {
  return Math.random().toString(36).substring(2, 10)
}

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = session.user.id
  let referralCode = await prisma.referralCode.findUnique({
    where: { userId },
    include: { referrals: true },
  })
  if (!referralCode) {
    let code = generateCode()
    let attempts = 0
    while (attempts < 5) {
      const existing = await prisma.referralCode.findUnique({ where: { code } })
      if (!existing) break
      code = generateCode()
      attempts++
    }
    referralCode = await prisma.referralCode.create({
      data: { userId, code },
      include: { referrals: true },
    })
  }
  const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  return NextResponse.json({
    code: referralCode.code,
    link: `${appUrl}/invite/${referralCode.code}`,
    clicks: referralCode.clicks,
    referrals: referralCode.referrals.length,
  })
}
