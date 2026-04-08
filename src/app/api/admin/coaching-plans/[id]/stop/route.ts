/**
 * HabitOS M5 — POST /api/admin/coaching-plans/[id]/stop
 *
 * Admin permanently stops a coaching plan. Body: { reason?: string }.
 * Sets status='stopped' and writes a PlanAuditLog row in the same
 * transaction. Functionally similar to pause but treated as final.
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const bodySchema = z.object({
  reason: z.string().max(500).optional(),
})

const db = prisma as any

export async function POST(
  req: Request,
  context: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const adminId = (session.user as any).id as string
  const { id } = context.params
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  }

  let body: unknown = {}
  try {
    const text = await req.text()
    body = text ? JSON.parse(text) : {}
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.flatten() },
      { status: 400 }
    )
  }
  const { reason } = parsed.data

  const existing = await db.coachingPlan.findUnique({
    where: { id },
    select: { id: true, status: true, userId: true },
  })
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const updated = await db.$transaction(async (tx: any) => {
      const next = await tx.coachingPlan.update({
        where: { id },
        data: { status: 'stopped' },
        select: { id: true, status: true, updatedAt: true },
      })
      await tx.planAuditLog.create({
        data: {
          planId: id,
          adminId,
          userId: existing.userId,
          action: 'admin.plan.stop',
          before: { status: existing.status },
          after: { status: 'stopped' },
          reason: reason ?? null,
        },
      })
      return next
    })

    return NextResponse.json({ plan: updated })
  } catch (err) {
    console.error('[api/admin/coaching-plans/:id/stop] error', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
