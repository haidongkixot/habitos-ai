import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const QUEST_TEMPLATES = [
  {
    questType: 'complete_checkin',
    description: 'Complete at least 1 habit check-in today',
    xpReward: 15,
  },
  {
    questType: 'streak_day',
    description: 'Maintain your current streak',
    xpReward: 20,
  },
  {
    questType: 'try_category',
    description: 'Check in a habit from a different category',
    xpReward: 25,
  },
]

async function evaluateQuests(userId: string, date: string) {
  const quests = await prisma.dailyQuest.findMany({
    where: { userId, date },
  })

  const todayCheckins = await prisma.checkIn.findMany({
    where: { userId, date, completed: true },
    include: { habit: { select: { category: true } } },
  })

  const gamification = await prisma.userGamification.findUnique({ where: { userId } })

  for (const quest of quests) {
    if (quest.completed) continue

    let shouldComplete = false

    switch (quest.questType) {
      case 'complete_checkin':
        shouldComplete = todayCheckins.length >= 1
        break
      case 'streak_day':
        shouldComplete = (gamification?.currentStreak ?? 0) >= 1 && gamification?.lastCheckinDate === date
        break
      case 'try_category': {
        const categories = new Set(todayCheckins.map(c => c.habit.category))
        shouldComplete = categories.size >= 2
        break
      }
    }

    if (shouldComplete) {
      await prisma.dailyQuest.update({
        where: { id: quest.id },
        data: { completed: true, completedAt: new Date() },
      })

      // Award XP
      await prisma.$transaction([
        prisma.xpTransaction.create({
          data: { userId, amount: quest.xpReward, source: 'quest', detail: quest.questType },
        }),
        prisma.userGamification.upsert({
          where: { userId },
          create: { userId, xp: quest.xpReward },
          update: { xp: { increment: quest.xpReward } },
        }),
      ])
    }
  }
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id
  const today = new Date().toISOString().split('T')[0]

  try {
    // Check if quests exist for today
    let quests = await prisma.dailyQuest.findMany({
      where: { userId, date: today },
    })

    // Create daily quests if none exist
    if (quests.length === 0) {
      await prisma.dailyQuest.createMany({
        data: QUEST_TEMPLATES.map(qt => ({
          userId,
          date: today,
          questType: qt.questType,
          description: qt.description,
          xpReward: qt.xpReward,
        })),
        skipDuplicates: true,
      })

      quests = await prisma.dailyQuest.findMany({
        where: { userId, date: today },
      })
    }

    // Evaluate quest completion
    await evaluateQuests(userId, today)

    // Re-fetch after evaluation
    quests = await prisma.dailyQuest.findMany({
      where: { userId, date: today },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json(quests)
  } catch (err) {
    console.error('[quests] Error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
