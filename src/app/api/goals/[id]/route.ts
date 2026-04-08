/**
 * HabitOS Phase 3 — /api/goals/[id]
 *
 * GET    → goal + coachingPlans[]
 * PATCH  → update status / priority / title / description / targetDate
 * DELETE → soft delete (status: 'deleted')
 *
 * All operations require the goal to belong to the session user.
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const updateGoalSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  status: z.enum(['active', 'paused', 'stopped', 'completed']).optional(),
  priority: z.number().int().min(0).max(10).optional(),
  targetDate: z.string().datetime().nullable().optional(),
})

async function loadOwnedGoal(goalId: string, userId: string) {
  const goal = await (prisma as any).goal.findUnique({
    where: { id: goalId },
  })
  if (!goal) return { goal: null, status: 404 as const }
  if (goal.userId !== userId) return { goal: null, status: 403 as const }
  return { goal, status: 200 as const }
}

export async function GET(
  _req: Request,
  context: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = (session.user as any).id as string
  const { id } = context.params

  const { goal, status } = await loadOwnedGoal(id, userId)
  if (!goal) {
    return NextResponse.json(
      { error: status === 404 ? 'Not found' : 'Forbidden' },
      { status }
    )
  }

  const full = await (prisma as any).goal.findUnique({
    where: { id },
    include: {
      plans: {
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  return NextResponse.json({ goal: full })
}

export async function PATCH(
  req: Request,
  context: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = (session.user as any).id as string
  const { id } = context.params

  const { goal, status } = await loadOwnedGoal(id, userId)
  if (!goal) {
    return NextResponse.json(
      { error: status === 404 ? 'Not found' : 'Forbidden' },
      { status }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = updateGoalSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.flatten() },
      { status: 400 }
    )
  }
  const data = parsed.data

  const updateData: Record<string, unknown> = {}
  if (data.title !== undefined) updateData.title = data.title
  if (data.description !== undefined) updateData.description = data.description
  if (data.status !== undefined) updateData.status = data.status
  if (data.priority !== undefined) updateData.priority = data.priority
  if (data.targetDate !== undefined) {
    updateData.targetDate = data.targetDate ? new Date(data.targetDate) : null
  }

  try {
    const updated = await (prisma as any).goal.update({
      where: { id },
      data: updateData,
    })
    return NextResponse.json({ goal: updated })
  } catch (err) {
    console.error('[api/goals/:id PATCH] error', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  context: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = (session.user as any).id as string
  const { id } = context.params

  const { goal, status } = await loadOwnedGoal(id, userId)
  if (!goal) {
    return NextResponse.json(
      { error: status === 404 ? 'Not found' : 'Forbidden' },
      { status }
    )
  }

  try {
    await (prisma as any).goal.update({
      where: { id },
      data: { status: 'deleted' },
    })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[api/goals/:id DELETE] error', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
