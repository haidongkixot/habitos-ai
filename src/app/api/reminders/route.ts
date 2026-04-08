/**
 * HabitOS M4 — /api/reminders
 *
 * GET    → list user's upcoming scheduled reminders (asc by scheduledFor).
 * POST   → create a custom reminder. Validated with reminderSchema.
 * DELETE → cancel a reminder (?id=…). Owner-gated.
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { reminderSchema } from '@/lib/zod/reminder'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

async function getUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user) return null
  return ((session.user as any).id as string) ?? null
}

export async function GET() {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const reminders = await (prisma as any).reminder.findMany({
      where: {
        userId,
        status: 'scheduled',
      },
      orderBy: { scheduledFor: 'asc' },
      take: 50,
    })
    return NextResponse.json({ reminders })
  } catch (err) {
    console.error('[api/reminders GET] failed', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = reminderSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const data = parsed.data

  // Verify plan ownership if planId provided.
  if (data.planId) {
    const plan = await (prisma as any).coachingPlan.findUnique({
      where: { id: data.planId },
      select: { userId: true },
    })
    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }
    if (plan.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  try {
    const created = await (prisma as any).reminder.create({
      data: {
        userId,
        planId: data.planId ?? null,
        planHabitId: data.planHabitId ?? null,
        type: data.type,
        title: data.title,
        body: data.body,
        channel: data.channel,
        scheduledFor: new Date(data.scheduledFor),
        status: 'scheduled',
        metadata: (data.metadata ?? undefined) as any,
      },
    })
    return NextResponse.json({ reminder: created }, { status: 201 })
  } catch (err) {
    console.error('[api/reminders POST] failed', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  }

  try {
    const existing = await (prisma as any).reminder.findUnique({
      where: { id },
      select: { userId: true },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    if (existing.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updated = await (prisma as any).reminder.update({
      where: { id },
      data: { status: 'cancelled' },
    })
    return NextResponse.json({ reminder: updated })
  } catch (err) {
    console.error('[api/reminders DELETE] failed', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
