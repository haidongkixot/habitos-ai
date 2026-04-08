/**
 * HabitOS Phase 3 — /api/coaching-plans
 *
 * POST → wizard flow: validates answers, resolves persona + tier, generates
 *        plan via OpenAI, persists plan + children + audit log in a
 *        transaction, logs a CoachingSession row, and returns the full plan.
 *
 * GET  → list the session user's coaching plans. Supports ?goalId and
 *        ?status filters.
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import type { CoachPersona } from '@prisma/client'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getDefaultPersona } from '@/lib/coach/personas'
import { getUserPlanSlug } from '@/lib/academy/access'
import {
  growAnswersSchema,
  woopAnswersSchema,
  identityAnswersSchema,
} from '@/lib/zod/wizard-answers'
import { generateCoachingPlan, type UserPlanSlug } from '@/lib/coaching/generate-plan'
import { persistCoachingPlan } from '@/lib/coaching/persist-plan'
import type { FrameworkSlug } from '@/lib/coaching/frameworks'
import { buildRemindersForPlan } from '@/lib/reminders/schedule'
import { upsertReminders } from '@/lib/reminders/persist'

const createPlanSchema = z.object({
  goalId: z.string().min(1),
  framework: z.enum(['GROW', 'WOOP', 'IDENTITY']),
  answers: z.record(z.string(), z.unknown()),
})

function validateAnswersForFramework(
  framework: FrameworkSlug,
  answers: unknown
) {
  switch (framework) {
    case 'GROW':
      return growAnswersSchema.safeParse(answers)
    case 'WOOP':
      return woopAnswersSchema.safeParse(answers)
    case 'IDENTITY':
      return identityAnswersSchema.safeParse(answers)
  }
}

function normalisePlanSlug(slug: string): UserPlanSlug {
  if (slug === 'starter' || slug === 'pro' || slug === 'premium') return slug
  return 'free'
}

async function resolvePersona(userId: string): Promise<CoachPersona> {
  const settings = await (prisma as any).userCoachSettings?.findUnique?.({
    where: { userId },
  })

  if (settings?.personaId) {
    const persona = await (prisma as any).coachPersona.findUnique({
      where: { id: settings.personaId },
    })
    if (persona && persona.isActive) return persona
  }

  return getDefaultPersona()
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = (session.user as any).id as string

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsedBody = createPlanSchema.safeParse(body)
  if (!parsedBody.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsedBody.error.flatten() },
      { status: 400 }
    )
  }
  const { goalId, framework, answers } = parsedBody.data

  // 1. Verify goal ownership
  const goal = await (prisma as any).goal.findUnique({ where: { id: goalId } })
  if (!goal) {
    return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
  }
  if (goal.userId !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 2. Validate wizard answers against the correct schema
  const answersResult = validateAnswersForFramework(framework, answers)
  if (!answersResult.success) {
    return NextResponse.json(
      {
        error: 'Wizard answers failed validation',
        issues: answersResult.error.flatten(),
      },
      { status: 400 }
    )
  }

  // 3. Resolve persona
  let persona: CoachPersona
  try {
    persona = await resolvePersona(userId)
  } catch (err) {
    console.error('[api/coaching-plans POST] persona resolution failed', err)
    return NextResponse.json(
      { error: 'Coach persona not configured' },
      { status: 500 }
    )
  }

  // 4. Resolve user plan tier
  const slug = await getUserPlanSlug(userId)
  const userPlanSlug = normalisePlanSlug(slug)

  // 5. Resolve user profile for prompt context
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  })

  // 6. Generate the plan
  let generation
  try {
    generation = await generateCoachingPlan({
      userId,
      goalId,
      framework,
      answers: answersResult.data as Record<string, unknown>,
      persona,
      userPlanSlug,
      goalTitle: goal.title,
      goalCategory: goal.category,
      goalDescription: goal.description,
      goalTargetDate: goal.targetDate,
      userName: user?.name ?? null,
      identityStatement: null,
    })
  } catch (err) {
    console.error('[api/coaching-plans POST] generation failed', err)
    return NextResponse.json(
      {
        error: 'Failed to generate coaching plan',
        detail: (err as Error).message,
      },
      { status: 502 }
    )
  }

  // 7. Persist the plan (plan + milestones + habits + audit row, transactional)
  let coachingPlan
  try {
    coachingPlan = await persistCoachingPlan({
      userId,
      goalId,
      plan: generation.plan,
      aiModel: generation.modelUsed,
      rawAiResponse: generation.rawResponse,
    })
  } catch (err) {
    console.error('[api/coaching-plans POST] persist failed', err)
    return NextResponse.json(
      { error: 'Failed to save coaching plan' },
      { status: 500 }
    )
  }

  // 8. Log a CoachingSession row for AI accounting
  try {
    await (prisma as any).coachingSession.create({
      data: {
        planId: coachingPlan.id,
        userId,
        personaId: persona.id,
        messages: [
          {
            role: 'system',
            type: 'plan_generation',
            framework,
            answerKeys: Object.keys(answersResult.data as object),
          },
        ],
        tokensUsed: generation.tokensUsed ?? null,
        model: generation.modelUsed,
      },
    })
  } catch (err) {
    // Non-fatal — the plan is already committed.
    console.error('[api/coaching-plans POST] session log failed', err)
  }

  // M4: auto-schedule reminders
  try {
    const prefs = await (prisma as any).notificationPreference
      .findUnique({ where: { userId } })
      .catch(() => null)
    const specs = buildRemindersForPlan({
      plan: coachingPlan as any,
      preferences: prefs,
    })
    await upsertReminders({ userId, planId: coachingPlan.id, specs })
  } catch (e) {
    console.error('[M4] reminder schedule failed', e)
  }

  return NextResponse.json(
    {
      coachingPlan,
      reasoning: {
        modelUsed: generation.modelUsed,
        tokensUsed: generation.tokensUsed,
        cost: generation.cost,
      },
    },
    { status: 201 }
  )
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = (session.user as any).id as string

  const url = new URL(req.url)
  const goalId = url.searchParams.get('goalId')
  const status = url.searchParams.get('status')

  const where: Record<string, unknown> = { userId }
  if (goalId) where.goalId = goalId
  if (status) where.status = status

  try {
    const plans = await (prisma as any).coachingPlan.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        milestones: { orderBy: { weekIndex: 'asc' } },
        planHabits: { orderBy: { createdAt: 'asc' } },
        _count: { select: { checkins: true } },
      },
    })
    return NextResponse.json({ plans })
  } catch (err) {
    console.error('[api/coaching-plans GET] error', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
