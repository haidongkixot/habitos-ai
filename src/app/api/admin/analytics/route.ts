import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const now = new Date()
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now)
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().split('T')[0]
  })

  const [totalUsers, totalHabits, totalCheckins, recentSignups, categoryStats] = await Promise.all([
    prisma.user.count(),
    prisma.habit.count({ where: { isActive: true } }),
    prisma.checkIn.count({ where: { completed: true } }),
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 30,
      select: { createdAt: true },
    }),
    prisma.habit.groupBy({
      by: ['category'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 8,
    }),
  ])

  // Build signups per day (last 7)
  const signupsPerDay = last7Days.map(date => ({
    date,
    count: recentSignups.filter(u => u.createdAt.toISOString().split('T')[0] === date).length,
  }))

  return NextResponse.json({
    totals: { users: totalUsers, habits: totalHabits, checkins: totalCheckins },
    signupsPerDay,
    categoryStats: categoryStats.map(c => ({ category: c.category || 'Other', count: c._count.id })),
  })
}
