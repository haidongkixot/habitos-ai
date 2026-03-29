import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id

  try {
    const habits = await prisma.habit.findMany({ where: { userId, isActive: true } })
    const checkins = await prisma.checkIn.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 500,
    })

    const totalHabits = habits.length
    const totalCheckins = checkins.length
    const today = new Date().toISOString().slice(0, 10)
    const todayCheckins = checkins.filter(c => c.date === today).length

    // Streak: consecutive days with at least one check-in
    const daySet = new Set(checkins.map(c => c.date))
    const days = Array.from(daySet).sort().reverse()
    let currentStreak = 0
    for (let i = 0; i < days.length; i++) {
      const expected = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10)
      if (days[i] === expected) currentStreak++
      else break
    }

    // Weekly completion rate
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)
    const weekCheckins = checkins.filter(c => c.date >= weekAgo)
    const weeklyRate = totalHabits > 0 ? Math.round((weekCheckins.length / (totalHabits * 7)) * 100) : 0

    // Category breakdown
    const catStats: Record<string, { total: number; completed: number }> = {}
    habits.forEach(h => {
      catStats[h.category] = catStats[h.category] || { total: 0, completed: 0 }
      catStats[h.category].total++
    })
    checkins.filter(c => c.date >= weekAgo).forEach(c => {
      const habit = habits.find(h => h.id === c.habitId)
      if (habit) {
        catStats[habit.category] = catStats[habit.category] || { total: 0, completed: 0 }
        catStats[habit.category].completed++
      }
    })

    // Mood average
    const moodCheckins = checkins.filter(c => c.mood != null)
    const avgMood = moodCheckins.length > 0
      ? Math.round((moodCheckins.reduce((a, c) => a + (c.mood || 0), 0) / moodCheckins.length) * 10) / 10
      : null

    const achievements = await prisma.userAchievement.findMany({ where: { userId } })

    return NextResponse.json({
      totalHabits, totalCheckins, todayCheckins, currentStreak,
      weeklyRate, categoryStats: catStats, avgMood,
      achievements, recentCheckins: checkins.slice(0, 20),
    })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
