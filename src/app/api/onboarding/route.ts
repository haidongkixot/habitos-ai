import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id

  try {
    const { goal, experience, preferredTime } = await req.json()

    if (!goal || !experience || !preferredTime) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    // Save onboarding data as activity event
    await prisma.activityEvent.create({
      data: {
        userId,
        type: 'onboarding_complete',
        metadata: JSON.stringify({ goal, experience, preferredTime }),
      },
    })

    // Initialize gamification profile
    await prisma.userGamification.upsert({
      where: { userId },
      create: { userId, xp: 25, level: 1 },
      update: {},
    })

    // Award onboarding XP
    await prisma.xpTransaction.create({
      data: {
        userId,
        amount: 25,
        source: 'onboarding',
        detail: 'Completed onboarding',
      },
    })

    // Create starter habits based on goal
    const starterHabits = getStarterHabits(goal)
    for (const habit of starterHabits) {
      await prisma.habit.create({
        data: { userId, ...habit },
      })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[onboarding] Error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

function getStarterHabits(goal: string) {
  switch (goal) {
    case 'build-habits':
      return [
        { name: 'Morning Routine', category: 'routine', color: '#10b981', icon: 'sunrise' },
        { name: 'Read 10 minutes', category: 'learning', color: '#6366f1', icon: 'book' },
        { name: 'Drink 8 glasses of water', category: 'health', color: '#06b6d4', icon: 'droplet' },
      ]
    case 'improve-health':
      return [
        { name: 'Exercise 30 min', category: 'fitness', color: '#f43f5e', icon: 'dumbbell' },
        { name: 'Eat a healthy meal', category: 'nutrition', color: '#10b981', icon: 'apple' },
        { name: 'Sleep 8 hours', category: 'sleep', color: '#8b5cf6', icon: 'moon' },
      ]
    case 'boost-productivity':
      return [
        { name: 'Plan my day', category: 'productivity', color: '#f59e0b', icon: 'list' },
        { name: 'Deep work session', category: 'focus', color: '#ef4444', icon: 'zap' },
        { name: 'Review daily goals', category: 'productivity', color: '#10b981', icon: 'target' },
      ]
    case 'mindfulness':
      return [
        { name: 'Meditate 10 min', category: 'mindfulness', color: '#8b5cf6', icon: 'brain' },
        { name: 'Journal entry', category: 'reflection', color: '#06b6d4', icon: 'edit' },
        { name: 'Gratitude practice', category: 'wellness', color: '#f59e0b', icon: 'heart' },
      ]
    default:
      return [
        { name: 'Daily Check-in', category: 'general', color: '#10b981', icon: 'check' },
      ]
  }
}
