/**
 * HabitOS M5 — GET /api/admin/coaching-plans/[id]/audit
 *
 * Returns chronological PlanAuditLog entries for one plan with the actor
 * (admin or user) expanded to id+email+name.
 *
 * Query:
 *   - limit  (default 50, max 200)
 *   - cursor (createdAt ISO — return rows STRICTLY OLDER than this)
 *
 * Response:
 *   { entries: AuditEntry[], nextCursor: iso | null }
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  cursor: z.string().datetime().optional(),
})

const db = prisma as any

export async function GET(
  req: Request,
  context: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = context.params
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  }

  const url = new URL(req.url)
  const rawQuery: Record<string, string> = {}
  url.searchParams.forEach((value, key) => {
    if (value !== '') rawQuery[key] = value
  })
  const parsed = querySchema.safeParse(rawQuery)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid query', issues: parsed.error.flatten() },
      { status: 400 }
    )
  }
  const { limit, cursor } = parsed.data

  // Verify plan exists (admins can audit any plan).
  const plan = await db.coachingPlan.findUnique({
    where: { id },
    select: { id: true },
  })
  if (!plan) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const where: Record<string, any> = { planId: id }
  if (cursor) {
    where.createdAt = { lt: new Date(cursor) }
  }

  try {
    // Pull one extra row so we can compute nextCursor.
    const rows = await db.planAuditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      select: {
        id: true,
        action: true,
        adminId: true,
        userId: true,
        before: true,
        after: true,
        reason: true,
        createdAt: true,
      },
    })

    const hasMore = rows.length > limit
    const trimmed = hasMore ? rows.slice(0, limit) : rows

    // Resolve actor users in batch.
    const actorIds = Array.from(
      new Set<string>(
        trimmed
          .map((r: any) => r.adminId ?? r.userId)
          .filter((v: string | null): v is string => !!v)
      )
    )
    const actors = actorIds.length
      ? await prisma.user.findMany({
          where: { id: { in: actorIds } },
          select: { id: true, email: true, name: true },
        })
      : []
    const actorById = new Map(actors.map((a) => [a.id, a]))

    const entries = trimmed.map((r: any) => {
      const actorId = r.adminId ?? r.userId ?? null
      return {
        id: r.id,
        action: r.action,
        adminId: r.adminId ?? null,
        userId: r.userId ?? null,
        before: r.before,
        after: r.after,
        reason: r.reason,
        createdAt: r.createdAt,
        actor: actorId ? actorById.get(actorId) ?? null : null,
      }
    })

    const nextCursor = hasMore
      ? trimmed[trimmed.length - 1].createdAt.toISOString()
      : null

    return NextResponse.json({ entries, nextCursor })
  } catch (err) {
    console.error('[api/admin/coaching-plans/:id/audit] error', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
