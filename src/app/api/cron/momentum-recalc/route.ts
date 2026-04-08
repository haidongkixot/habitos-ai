/**
 * HabitOS M4 — Cron endpoint: momentum recalculator + watchdog.
 *
 * Protected via `Authorization: Bearer <CRON_SECRET>`.
 *
 * 1. Finds up to 50 active plans whose `updatedAt` is older than 6h.
 * 2. Recalculates each plan's momentum score.
 * 3. Runs the reminder watchdog to enqueue missed_streak / momentum_drop.
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { recalculateMomentum } from '@/lib/motivation/momentum'
import { runReminderWatchdog } from '@/lib/reminders/watchdog'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const header = req.headers.get('authorization') ?? ''
  return header === `Bearer ${secret}`
}

const SIX_HOURS_MS = 6 * 60 * 60 * 1000

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const cutoff = new Date(Date.now() - SIX_HOURS_MS)

  let recalculated = 0
  let totalCandidates = 0
  let totalDelta = 0

  try {
    const candidates: Array<{ id: string }> = await (
      prisma as any
    ).coachingPlan.findMany({
      where: { status: 'active', updatedAt: { lt: cutoff } },
      orderBy: { updatedAt: 'asc' },
      take: 50,
      select: { id: true },
    })
    totalCandidates = candidates.length

    for (const plan of candidates) {
      try {
        const res = await recalculateMomentum(plan.id)
        recalculated++
        totalDelta += res.delta
      } catch (err) {
        console.error(
          '[cron/momentum-recalc] recalc failed for plan',
          plan.id,
          err
        )
      }
    }
  } catch (err) {
    console.error('[cron/momentum-recalc] candidate query failed', err)
  }

  let watchdog = { missedStreakCreated: 0, momentumDropCreated: 0 }
  try {
    watchdog = await runReminderWatchdog()
  } catch (err) {
    console.error('[cron/momentum-recalc] watchdog failed', err)
  }

  return NextResponse.json({
    ok: true,
    totalCandidates,
    recalculated,
    totalDelta,
    watchdog,
  })
}
