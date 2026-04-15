import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const apiKey = req.headers.get('x-api-key')
  if (!apiKey || apiKey !== process.env.HUMANOS_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(req.url)
  const email = url.searchParams.get('email')
  if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return NextResponse.json({ app: 'habitos', email, found: false, stats: null })

  const [checkInsCount, gamification, lastCheckIn] = await Promise.all([
    prisma.checkIn.count({ where: { userId: user.id } }),
    prisma.userGamification.findUnique({ where: { userId: user.id } }),
    prisma.checkIn.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true, habit: { select: { name: true } } },
    }),
  ])

  const streak = gamification?.currentStreak ?? 0
  const totalCheckins = gamification?.totalCheckins ?? checkInsCount

  // Compute weekly completion: check-ins in last 7 days vs active habits × 7
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const [weeklyCheckins, activeHabits] = await Promise.all([
    prisma.checkIn.count({
      where: { userId: user.id, createdAt: { gte: sevenDaysAgo } },
    }),
    prisma.habit.count({ where: { userId: user.id, isActive: true } }),
  ])
  const weeklyTarget = activeHabits * 7
  const weeklyPct = weeklyTarget > 0 ? Math.round((weeklyCheckins / weeklyTarget) * 100) : 0

  return NextResponse.json({
    app: 'habitos',
    appLabel: 'HabitOS',
    email,
    found: true,
    stats: {
      totalSessions: totalCheckins,
      lastActiveAt: lastCheckIn?.createdAt ?? null,
      lastActivity: lastCheckIn?.habit?.name ?? null,
      metric: streak > 0
        ? `${streak}-day streak, ${weeklyPct}% weekly completion`
        : `${totalCheckins} check-ins, ${weeklyPct}% weekly completion`,
    },
  })
}
