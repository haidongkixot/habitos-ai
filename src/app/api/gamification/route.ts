import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id
  try {
    const gam = await prisma.userGamification.upsert({
      where: { userId },
      create: { userId },
      update: {},
    })
    const xpForNextLevel = gam.level * 200
    const xpInCurrentLevel = gam.xp % 200
    return NextResponse.json({
      xp: gam.xp,
      level: gam.level,
      xpInCurrentLevel,
      xpForNextLevel,
      progressPercent: Math.round((xpInCurrentLevel / xpForNextLevel) * 100),
      currentStreak: gam.currentStreak,
      longestStreak: gam.longestStreak,
      totalCheckins: gam.totalCheckins,
    })
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
