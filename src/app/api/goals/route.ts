/**
 * HabitOS Phase 3 — /api/goals
 *
 * GET  → list the session user's non-deleted goals (newest first)
 * POST → create a goal
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const createGoalSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  category: z.string().min(1).max(50),
  framework: z.enum(['GROW', 'WOOP', 'IDENTITY']),
  targetDate: z.string().datetime().optional(),
  priority: z.number().int().min(0).max(10).optional(),
})

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = (session.user as any).id as string

  try {
    const goals = await (prisma as any).goal.findMany({
      where: {
        userId,
        NOT: { status: 'deleted' },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { plans: true } },
      },
    })

    return NextResponse.json({ goals })
  } catch (err) {
    console.error('[api/goals GET] error', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
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

  const parsed = createGoalSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.flatten() },
      { status: 400 }
    )
  }
  const data = parsed.data

  try {
    const goal = await (prisma as any).goal.create({
      data: {
        userId,
        title: data.title,
        description: data.description ?? null,
        category: data.category,
        framework: data.framework,
        targetDate: data.targetDate ? new Date(data.targetDate) : null,
        priority: data.priority ?? 0,
        status: 'active',
      },
    })
    return NextResponse.json({ goal }, { status: 201 })
  } catch (err) {
    console.error('[api/goals POST] error', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
