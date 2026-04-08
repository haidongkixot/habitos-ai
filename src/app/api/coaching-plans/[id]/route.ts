/**
 * HabitOS Phase 3 — /api/coaching-plans/[id]
 *
 * GET    → full plan + milestones + habits + recent checkins
 * PATCH  → update status / momentumScore / completionPercent / identityStatement
 * DELETE → soft delete by setting status = 'stopped'
 *
 * All operations are owner-gated and write a PlanAuditLog row on mutations.
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writePlanAudit } from '@/lib/coaching/audit-log'

const updatePlanSchema = z.object({
  status: z.enum(['active', 'paused', 'stopped', 'completed']).optional(),
  momentumScore: z.number().int().min(0).max(100).optional(),
  completionPercent: z.number().int().min(0).max(100).optional(),
  identityStatement: z.string().max(500).nullable().optional(),
})

async function loadOwnedPlan(planId: string, userId: string) {
  const plan = await (prisma as any).coachingPlan.findUnique({
    where: { id: planId },
  })
  if (!plan) return { plan: null, status: 404 as const }
  if (plan.userId !== userId) return { plan: null, status: 403 as const }
  return { plan, status: 200 as const }
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

  const { plan, status } = await loadOwnedPlan(id, userId)
  if (!plan) {
    return NextResponse.json(
      { error: status === 404 ? 'Not found' : 'Forbidden' },
      { status }
    )
  }

  const full = await (prisma as any).coachingPlan.findUnique({
    where: { id },
    include: {
      milestones: { orderBy: { weekIndex: 'asc' } },
      planHabits: { orderBy: { createdAt: 'asc' } },
      checkins: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  })

  return NextResponse.json({ coachingPlan: full })
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

  const { plan, status } = await loadOwnedPlan(id, userId)
  if (!plan) {
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

  const parsed = updatePlanSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.flatten() },
      { status: 400 }
    )
  }
  const data = parsed.data

  const updateData: Record<string, unknown> = {}
  if (data.status !== undefined) updateData.status = data.status
  if (data.momentumScore !== undefined) updateData.momentumScore = data.momentumScore
  if (data.completionPercent !== undefined) updateData.completionPercent = data.completionPercent
  if (data.identityStatement !== undefined) updateData.identityStatement = data.identityStatement

  try {
    const updated = await (prisma as any).coachingPlan.update({
      where: { id },
      data: updateData,
    })

    await writePlanAudit({
      planId: id,
      actorId: userId,
      actorRole: 'user',
      action: 'plan_updated',
      before: {
        status: plan.status,
        momentumScore: plan.momentumScore,
        completionPercent: plan.completionPercent,
        identityStatement: plan.identityStatement,
      },
      metadata: updateData,
      reason: 'User updated plan via /api/coaching-plans/[id]',
    })

    return NextResponse.json({ coachingPlan: updated })
  } catch (err) {
    console.error('[api/coaching-plans/:id PATCH] error', err)
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

  const { plan, status } = await loadOwnedPlan(id, userId)
  if (!plan) {
    return NextResponse.json(
      { error: status === 404 ? 'Not found' : 'Forbidden' },
      { status }
    )
  }

  try {
    await (prisma as any).coachingPlan.update({
      where: { id },
      data: { status: 'stopped' },
    })

    await writePlanAudit({
      planId: id,
      actorId: userId,
      actorRole: 'user',
      action: 'plan_stopped',
      before: { status: plan.status },
      metadata: { status: 'stopped' },
      reason: 'User soft-deleted plan.',
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[api/coaching-plans/:id DELETE] error', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
