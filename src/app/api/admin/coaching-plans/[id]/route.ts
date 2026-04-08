/**
 * HabitOS M5 — /api/admin/coaching-plans/[id]
 *
 * GET    → full plan with milestones, habits, recent checkins (last 30),
 *          persona, user (id/email/name/tierSlug), goal (if linked).
 * PATCH  → admin edit. Optional title/summary/status/notes. Writes audit row.
 * DELETE → soft-delete: status='stopped'. Writes audit row.
 *
 * All operations are admin-gated and atomic — mutations + audit insert run
 * inside a single prisma.$transaction.
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getUserPlanSlug } from '@/lib/academy/access'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== 'admin') return null
  return session
}

const patchSchema = z.object({
  title: z.string().min(1).max(160).optional(),
  summary: z.string().max(2000).optional(),
  status: z.enum(['active', 'paused', 'stopped', 'complete']).optional(),
  notes: z.string().max(4000).optional(),
})

// PlanCheckin / coaching pieces are typed as any until Prisma client typings
// catch up with the M1 schema additions.
const db = prisma as any

export async function GET(
  _req: Request,
  context: { params: { id: string } }
) {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = context.params
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  }

  try {
    const plan = await db.coachingPlan.findUnique({
      where: { id },
      select: {
        id: true,
        goalId: true,
        userId: true,
        framework: true,
        title: true,
        summary: true,
        identityStatement: true,
        durationDays: true,
        startDate: true,
        endDate: true,
        status: true,
        momentumScore: true,
        completionPercent: true,
        motivationStyle: true,
        weeklyCheckinPrompt: true,
        aiModel: true,
        createdAt: true,
        updatedAt: true,
        milestones: {
          orderBy: { weekIndex: 'asc' },
          select: {
            id: true,
            title: true,
            description: true,
            weekIndex: true,
            successMetric: true,
            checkpointType: true,
            status: true,
            completedAt: true,
            createdAt: true,
          },
        },
        planHabits: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            habitId: true,
            name: true,
            frequency: true,
            intentionCue: true,
            intentionLocation: true,
            intentionTime: true,
            intentionStatement: true,
            twoMinuteVersion: true,
            reward: true,
            category: true,
            isActive: true,
            createdAt: true,
          },
        },
        checkins: {
          orderBy: { createdAt: 'desc' },
          take: 30,
          select: {
            id: true,
            weekIndex: true,
            content: true,
            mood: true,
            proofType: true,
            proofUrl: true,
            verified: true,
            createdAt: true,
            userId: true,
          },
        },
        user: {
          select: { id: true, email: true, name: true },
        },
        goal: {
          select: {
            id: true,
            title: true,
            description: true,
            category: true,
            targetDate: true,
          },
        },
      },
    })

    if (!plan) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Resolve persona via UserCoachSettings (no direct relation on plan).
    const settings = await db.userCoachSettings
      .findUnique({
        where: { userId: plan.userId },
        select: { personaId: true },
      })
      .catch(() => null)

    let persona: { id: string; slug: string; name: string } | null = null
    if (settings?.personaId) {
      const p = await db.coachPersona
        .findUnique({
          where: { id: settings.personaId },
          select: { id: true, slug: true, name: true },
        })
        .catch(() => null)
      if (p) persona = p
    }

    const tierSlug = await getUserPlanSlug(plan.userId)

    return NextResponse.json({
      plan: {
        ...plan,
        persona,
        user: plan.user
          ? {
              id: plan.user.id,
              email: plan.user.email,
              name: plan.user.name,
              tierSlug,
            }
          : null,
      },
    })
  } catch (err) {
    console.error('[api/admin/coaching-plans/:id GET] error', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  context: { params: { id: string } }
) {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const adminId = (session.user as any).id as string
  const { id } = context.params
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.flatten() },
      { status: 400 }
    )
  }
  const data = parsed.data
  // No-op guard
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  const existing = await db.coachingPlan.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      summary: true,
      status: true,
      userId: true,
    },
  })
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Build update payload — only fields actually provided.
  const updateData: Record<string, unknown> = {}
  if (data.title !== undefined) updateData.title = data.title
  if (data.summary !== undefined) updateData.summary = data.summary
  if (data.status !== undefined) updateData.status = data.status
  // The CoachingPlan model has no `notes` column. We persist admin notes
  // into the audit row metadata so they remain searchable but never mutate
  // the plan itself.
  const adminNote = data.notes

  try {
    const result = await db.$transaction(async (tx: any) => {
      const updated =
        Object.keys(updateData).length > 0
          ? await tx.coachingPlan.update({
              where: { id },
              data: updateData,
              select: {
                id: true,
                title: true,
                summary: true,
                status: true,
                updatedAt: true,
              },
            })
          : await tx.coachingPlan.findUnique({
              where: { id },
              select: {
                id: true,
                title: true,
                summary: true,
                status: true,
                updatedAt: true,
              },
            })

      await tx.planAuditLog.create({
        data: {
          planId: id,
          adminId,
          userId: existing.userId,
          action: 'admin.plan.edit',
          before: {
            title: existing.title,
            summary: existing.summary,
            status: existing.status,
          },
          after: {
            ...updateData,
            ...(adminNote ? { notes: adminNote } : {}),
          },
          reason: adminNote ?? null,
        },
      })

      return updated
    })

    return NextResponse.json({ plan: result })
  } catch (err) {
    console.error('[api/admin/coaching-plans/:id PATCH] error', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  context: { params: { id: string } }
) {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const adminId = (session.user as any).id as string
  const { id } = context.params
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  }

  const existing = await db.coachingPlan.findUnique({
    where: { id },
    select: { id: true, status: true, userId: true },
  })
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // CoachingPlan has no `deletedAt` column — we use the documented soft-delete
  // status='stopped' (with a synthetic 'deleted' marker captured in audit).
  try {
    await db.$transaction(async (tx: any) => {
      await tx.coachingPlan.update({
        where: { id },
        data: { status: 'stopped' },
      })
      await tx.planAuditLog.create({
        data: {
          planId: id,
          adminId,
          userId: existing.userId,
          action: 'admin.plan.delete',
          before: { status: existing.status },
          after: { status: 'stopped', softDelete: true },
          reason: null,
        },
      })
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[api/admin/coaching-plans/:id DELETE] error', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
