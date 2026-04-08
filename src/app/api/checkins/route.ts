/**
 * HabitOS M4 — /api/checkins
 *
 * Dual-shape endpoint:
 *
 *   Legacy habit check-in (unchanged):
 *     POST { habitId, date?, note?, mood? }
 *     DELETE { habitId, date? }
 *
 *   Plan check-in (M4, new):
 *     POST { planId, habitId?, mood?, reflectionText?, completed }
 *       → Creates a PlanCheckin row (owner-gated by plan)
 *       → Recalculates momentum
 *       → Records MotivationEvent type=checkin_completed
 *       → Returns { planCheckin, momentum }
 *
 * The branch is selected by the presence of `planId` in the POST body.
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { recalculateMomentum } from '@/lib/motivation/momentum'
import { recordMotivationEvent } from '@/lib/motivation/events'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const DAY_MS = 24 * 60 * 60 * 1000

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = (session.user as any).id as string

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // ------------------------------------------------------------ plan check-in
  if (body && typeof body === 'object' && body.planId) {
    const {
      planId,
      habitId,
      mood,
      reflectionText,
      completed,
    }: {
      planId: string
      habitId?: string
      mood?: number
      reflectionText?: string
      completed?: boolean
    } = body

    try {
      const plan = await (prisma as any).coachingPlan.findUnique({
        where: { id: planId },
        select: { id: true, userId: true, startDate: true },
      })
      if (!plan) {
        return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
      }
      if (plan.userId !== userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const weekIndex = Math.max(
        0,
        Math.floor(
          (Date.now() - new Date(plan.startDate).getTime()) / (7 * DAY_MS)
        )
      )

      const contentPayload = JSON.stringify({
        reflectionText: reflectionText ?? null,
        habitId: habitId ?? null,
        completed: completed ?? true,
      })

      const planCheckin = await (prisma as any).planCheckin.create({
        data: {
          planId,
          userId,
          weekIndex,
          content: contentPayload,
          mood: typeof mood === 'number' ? mood : null,
          proofType: 'self-report',
          verified: false,
        },
      })

      let momentum = { previous: 50, current: 50, delta: 0 }
      try {
        momentum = await recalculateMomentum(planId)
      } catch (err) {
        console.error('[api/checkins POST plan] recalc failed', err)
      }

      if (completed !== false) {
        await recordMotivationEvent({
          userId,
          planId,
          type: 'checkin_completed',
          content: reflectionText ?? 'plan check-in completed',
          metadata: {
            weekIndex,
            mood: mood ?? null,
            habitId: habitId ?? null,
          },
        })
      }

      return NextResponse.json(
        { planCheckin, momentum, momentumScore: momentum.current },
        { status: 201 }
      )
    } catch (err) {
      console.error('[api/checkins POST plan] failed', err)
      return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
  }

  // ------------------------------------------------------- legacy habit path
  try {
    const { habitId, date, note, mood } = body
    if (!habitId) {
      return NextResponse.json({ error: 'Missing habitId' }, { status: 400 })
    }
    const dateStr =
      typeof date === 'string' && date
        ? date
        : new Date().toISOString().slice(0, 10)
    const checkin = await prisma.checkIn.upsert({
      where: { habitId_date: { habitId, date: dateStr } },
      update: {
        completed: true,
        note: typeof note === 'string' ? note.slice(0, 500) : undefined,
        mood,
      },
      create: {
        userId,
        habitId,
        date: dateStr,
        completed: true,
        note: typeof note === 'string' ? note.slice(0, 500) : undefined,
        mood,
      },
    })
    return NextResponse.json(checkin, { status: 201 })
  } catch (err) {
    console.error('[api/checkins POST habit] failed', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = (session.user as any).id as string

  try {
    const { habitId, date } = await req.json()
    const dateStr = date || new Date().toISOString().slice(0, 10)
    await prisma.checkIn.deleteMany({
      where: { habitId, date: dateStr, userId },
    })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
