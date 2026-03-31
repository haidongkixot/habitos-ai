import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const entries = await prisma.userGamification.findMany({
      orderBy: { xp: 'desc' },
      take: 20,
      include: {
        user: { select: { name: true } },
      },
    })

    const leaderboard = entries.map(e => ({
      name: e.user.name || 'Anonymous',
      level: e.level,
      xp: e.xp,
      streak: e.currentStreak,
    }))

    return NextResponse.json(leaderboard)
  } catch (err) {
    console.error('[leaderboard] Error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
