import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { chat, CoachContext } from '@/lib/ai-coach'
import { checkRateLimit } from '@/lib/rate-limit'

const FREE_MSG_LIMIT = 3

async function getUserPlan(userId: string) {
  const sub = await prisma.subscription.findFirst({
    where: { userId, status: 'active' },
    include: { plan: true },
  })
  return sub?.plan?.slug === 'pro'
}

async function getTodayMessageCount(userId: string) {
  const today = new Date().toISOString().split('T')[0]
  const convo = await prisma.assistantConversation.findFirst({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
  })
  if (!convo) return 0
  const count = await prisma.assistantMessage.count({
    where: {
      conversationId: convo.id,
      role: 'user',
      createdAt: { gte: new Date(today + 'T00:00:00.000Z') },
    },
  })
  return count
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id
  const isPro = await getUserPlan(userId)
  const todayCount = await getTodayMessageCount(userId)

  const convo = await prisma.assistantConversation.findFirst({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    include: {
      messages: { orderBy: { createdAt: 'asc' }, take: 50 },
    },
  })

  return NextResponse.json({
    messages: convo?.messages.map(m => ({
      id: m.id,
      role: m.role,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
    })) ?? [],
    todayCount,
    isPro,
  })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id

  if (!checkRateLimit(`ai-chat:${userId}`, 10, 60_000)) {
    return NextResponse.json({ error: 'Too many requests. Please slow down.' }, { status: 429 })
  }

  const isPro = await getUserPlan(userId)
  const todayCount = await getTodayMessageCount(userId)

  if (!isPro && todayCount >= FREE_MSG_LIMIT) {
    return NextResponse.json({
      error: `Daily message limit reached (${FREE_MSG_LIMIT}). Upgrade to Pro for unlimited coaching.`,
      todayCount,
    }, { status: 403 })
  }

  try {
    const { message } = await req.json()
    if (!message || typeof message !== 'string' || message.length > 1000) {
      return NextResponse.json({ error: 'Invalid message' }, { status: 400 })
    }

    // Get or create conversation
    let convo = await prisma.assistantConversation.findFirst({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    })
    if (!convo) {
      convo = await prisma.assistantConversation.create({
        data: { userId, title: 'Coach Chat' },
      })
    }

    // Save user message
    await prisma.assistantMessage.create({
      data: { conversationId: convo.id, role: 'user', content: message },
    })

    // Build context
    const gamification = await prisma.userGamification.findUnique({ where: { userId } })
    const habits = await prisma.habit.findMany({
      where: { userId, isActive: true },
      select: { name: true },
    })

    const context: CoachContext = {
      userName: session.user.name || undefined,
      currentStreak: gamification?.currentStreak ?? 0,
      totalCheckins: gamification?.totalCheckins ?? 0,
      activeHabits: habits.map(h => h.name),
    }

    // Get recent conversation history
    const recentMsgs = await prisma.assistantMessage.findMany({
      where: { conversationId: convo.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })
    const history = recentMsgs.reverse().map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

    const result = await chat(history, context)

    // Save assistant response
    await prisma.assistantMessage.create({
      data: { conversationId: convo.id, role: 'assistant', content: result.reply },
    })

    return NextResponse.json({
      reply: result.reply,
      fallback: result.fallback,
      todayCount: todayCount + 1,
    })
  } catch (err) {
    console.error('[ai/chat] Error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
