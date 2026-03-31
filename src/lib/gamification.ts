import { prisma } from './prisma'

// XP reward table
const XP_REWARDS: Record<string, number> = {
  checkin: 10,
  full_day: 50,
  streak_7: 100,
  streak_30: 300,
  first_habit: 25,
  badge_unlock: 50,
}

export async function awardXp(
  userId: string,
  source: string,
  detail?: string
) {
  const amount = XP_REWARDS[source] ?? 0
  if (amount === 0) return null

  const [tx, gamification] = await prisma.$transaction([
    prisma.xpTransaction.create({
      data: { userId, amount, source, detail },
    }),
    prisma.userGamification.upsert({
      where: { userId },
      create: { userId, xp: amount, level: 1 },
      update: { xp: { increment: amount } },
    }),
  ])

  // Level up check: every 200 XP = 1 level
  const newLevel = Math.floor(gamification.xp / 200) + 1
  if (newLevel > gamification.level) {
    await prisma.userGamification.update({
      where: { userId },
      data: { level: newLevel },
    })
  }

  return { xpAwarded: amount, totalXp: gamification.xp, level: newLevel }
}

export async function updateStreak(userId: string) {
  const today = new Date().toISOString().split('T')[0]

  const gam = await prisma.userGamification.upsert({
    where: { userId },
    create: { userId, currentStreak: 1, longestStreak: 1, lastCheckinDate: today, totalCheckins: 1 },
    update: { totalCheckins: { increment: 1 } },
  })

  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  let newStreak = 1

  if (gam.lastCheckinDate === today) {
    // Already checked in today, no streak change
    return { currentStreak: gam.currentStreak, longestStreak: gam.longestStreak }
  } else if (gam.lastCheckinDate === yesterday) {
    newStreak = gam.currentStreak + 1
  }

  const longestStreak = Math.max(gam.longestStreak, newStreak)

  await prisma.userGamification.update({
    where: { userId },
    data: { currentStreak: newStreak, longestStreak, lastCheckinDate: today },
  })

  // Streak milestone rewards
  if (newStreak === 7) await awardXp(userId, 'streak_7', '7-day streak')
  if (newStreak === 30) await awardXp(userId, 'streak_30', '30-day streak')

  return { currentStreak: newStreak, longestStreak }
}

export async function processActivity(
  userId: string,
  type: string,
  metadata?: Record<string, unknown>
) {
  // Record the activity event
  await prisma.activityEvent.create({
    data: {
      userId,
      type,
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  })

  // Award XP for known activity types
  if (type === 'checkin') {
    const streak = await updateStreak(userId)
    const xpResult = await awardXp(userId, 'checkin', `Check-in`)

    // Check if all habits completed for the day
    const today = new Date().toISOString().split('T')[0]
    const activeHabits = await prisma.habit.count({ where: { userId, isActive: true } })
    const todayCheckins = await prisma.checkIn.count({ where: { userId, date: today, completed: true } })

    if (activeHabits > 0 && todayCheckins >= activeHabits) {
      await awardXp(userId, 'full_day', 'All habits completed')
    }

    return { ...xpResult, ...streak }
  }

  return awardXp(userId, type)
}

export async function getProfile(userId: string) {
  const gamification = await prisma.userGamification.upsert({
    where: { userId },
    create: { userId },
    update: {},
  })

  const recentXp = await prisma.xpTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  const badges = await prisma.userBadge.findMany({
    where: { userId },
    include: { badge: true },
    orderBy: { unlockedAt: 'desc' },
  })

  return {
    xp: gamification.xp,
    level: gamification.level,
    currentStreak: gamification.currentStreak,
    longestStreak: gamification.longestStreak,
    totalCheckins: gamification.totalCheckins,
    recentXp,
    badges,
  }
}
