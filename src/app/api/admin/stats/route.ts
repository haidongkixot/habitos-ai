import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== 'admin') throw new Error('Unauthorized')
  return session
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin()

    // Build last 7 days date strings YYYY-MM-DD
    const last7Days: string[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      last7Days.push(d.toISOString().split('T')[0])
    }

    const [
      totalUsers,
      activeHabits,
      totalCheckins,
      completedCheckins,
      allHabits,
      checkinsByDay,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.habit.count({ where: { isActive: true } }),
      prisma.checkIn.count(),
      prisma.checkIn.count({ where: { completed: true } }),
      prisma.habit.groupBy({
        by: ['category'],
        _count: { category: true },
        orderBy: { _count: { category: 'desc' } },
        take: 5,
      }),
      prisma.checkIn.groupBy({
        by: ['date'],
        where: { date: { in: last7Days } },
        _count: { date: true },
      }),
    ])

    const completionRate =
      totalCheckins > 0 ? Math.round((completedCheckins / totalCheckins) * 100) : 0

    const topCategories = allHabits.map((h) => ({
      category: h.category,
      count: h._count.category,
    }))

    const checkinMap: Record<string, number> = {}
    for (const row of checkinsByDay) {
      checkinMap[row.date] = row._count.date
    }

    const last7DaysCheckins = last7Days.map((date) => ({
      date,
      count: checkinMap[date] || 0,
    }))

    return NextResponse.json({
      totalUsers,
      activeHabits,
      totalCheckins,
      completedCheckins,
      completionRate,
      topCategories,
      last7DaysCheckins,
    })
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
