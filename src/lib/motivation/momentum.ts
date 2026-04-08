/**
 * HabitOS M4 — Momentum score recalculator.
 *
 * Computes a 0–100 momentum score for a coaching plan based on recent
 * engagement signals. Updates `CoachingPlan.momentumScore` and records a
 * `MotivationEvent` with type `momentum_recalc`.
 *
 * FORMULA (with research citations)
 * ---------------------------------
 * Base: 50 — neutral anchor, matches the default in the schema.
 *
 * +15 if a check-in was logged today.
 *   [Lally & Gardner 2013, "Promoting habit formation"] — immediate
 *   feedback on behaviour loop reinforces momentum.
 *
 * +10 per consecutive daily check-in (cap +30).
 *   [Duhigg 2012, Fogg 2019] — streak salience drives perceived mastery.
 *
 * -20 if no check-in in the last 48h.
 *   [Wood 2019, "Good Habits, Bad Habits"] — lapse risk compounds after
 *   ~2 missed cycles.
 *
 * -15 per missed milestone (targetDay < today AND status !== "done").
 *   [Amabile & Kramer 2011, "The Progress Principle"] — unmet milestones
 *   erode perceived progress the hardest.
 *
 * Clamp: [0, 100].
 *
 * This is intentionally additive and will evolve as we learn.
 */

import { prisma } from '@/lib/prisma'
import { recordMotivationEvent } from './events'

export interface RecalculateMomentumResult {
  previous: number
  current: number
  delta: number
}

const DAY_MS = 24 * 60 * 60 * 1000

function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export async function recalculateMomentum(
  planId: string
): Promise<RecalculateMomentumResult> {
  const plan = await (prisma as any).coachingPlan.findUnique({
    where: { id: planId },
    include: {
      checkins: { orderBy: { createdAt: 'desc' }, take: 30 },
      milestones: true,
    },
  })

  if (!plan) {
    return { previous: 50, current: 50, delta: 0 }
  }

  const previous: number = Number(plan.momentumScore ?? 50)
  const now = new Date()
  const todayKey = toDateKey(now)

  let score = 50

  // Check-in today bonus.
  const checkins: Array<{ createdAt: Date }> = plan.checkins ?? []
  const hasCheckinToday = checkins.some(
    (c) => toDateKey(new Date(c.createdAt)) === todayKey
  )
  if (hasCheckinToday) score += 15

  // Consecutive streak bonus (cap +30).
  const seenDays = new Set(
    checkins.map((c) => toDateKey(new Date(c.createdAt)))
  )
  let streak = 0
  for (let i = 0; i < 30; i++) {
    const probe = new Date(now.getTime() - i * DAY_MS)
    if (seenDays.has(toDateKey(probe))) {
      streak++
    } else {
      break
    }
  }
  score += Math.min(30, streak * 10)

  // 48h no check-in penalty.
  const latest = checkins[0]?.createdAt
    ? new Date(checkins[0].createdAt).getTime()
    : null
  const hoursSinceLast =
    latest != null ? (now.getTime() - latest) / (60 * 60 * 1000) : Infinity
  if (hoursSinceLast >= 48) score -= 20

  // Missed milestone penalty.
  const startDate = new Date(plan.startDate)
  const missedMilestones = (plan.milestones ?? []).filter(
    (m: { weekIndex: number; status?: string }) => {
      const targetDay = new Date(
        startDate.getTime() + (m.weekIndex ?? 0) * 7 * DAY_MS
      )
      return (
        targetDay.getTime() < now.getTime() &&
        m.status !== 'done' &&
        m.status !== 'completed'
      )
    }
  )
  score -= 15 * missedMilestones.length

  // Clamp.
  const current = Math.max(0, Math.min(100, Math.round(score)))
  const delta = current - previous

  try {
    await (prisma as any).coachingPlan.update({
      where: { id: planId },
      data: { momentumScore: current },
    })
  } catch (err) {
    console.error('[motivation/momentum] update failed', err)
  }

  await recordMotivationEvent({
    userId: plan.userId,
    planId,
    type: 'momentum_recalc',
    content: `Momentum ${previous} → ${current}`,
    delta,
    metadata: {
      streak,
      hasCheckinToday,
      hoursSinceLast:
        hoursSinceLast === Infinity ? null : Math.round(hoursSinceLast),
      missedMilestones: missedMilestones.length,
    },
  })

  return { previous, current, delta }
}
