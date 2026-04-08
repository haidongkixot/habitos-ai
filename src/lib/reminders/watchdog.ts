/**
 * HabitOS M4 — Reminder watchdog.
 *
 * Scans active coaching plans for at-risk users and enqueues recovery-style
 * reminders. Called from the `/api/cron/momentum-recalc` cron endpoint so it
 * runs on the same cadence as momentum recalculation.
 *
 * Rules:
 *   1. Active plans where the most recent `PlanCheckin` is older than 48h
 *      (or no checkins and the plan is older than 2 days) → enqueue a
 *      `recovery` reminder with kind=missed_streak.
 *   2. Active plans whose momentumScore dropped below 40 → enqueue a
 *      `recovery` reminder with kind=momentum_drop.
 *
 * Reminders are scheduled for ~1 hour in the future and go out via whatever
 * channel the dispatch engine picks (defaults to inapp fallback if nothing
 * else is configured).
 */

import { prisma } from '@/lib/prisma'
import { upsertReminders } from './persist'
import type { ReminderSpec } from './schedule'

export interface WatchdogResult {
  missedStreakCreated: number
  momentumDropCreated: number
}

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR

export async function runReminderWatchdog(): Promise<WatchdogResult> {
  const now = new Date()
  let missedStreakCreated = 0
  let momentumDropCreated = 0

  const plans: Array<{
    id: string
    userId: string
    title: string
    momentumScore: number
    startDate: Date
    checkins: Array<{ createdAt: Date }>
  }> = await (prisma as any).coachingPlan.findMany({
    where: { status: 'active' },
    select: {
      id: true,
      userId: true,
      title: true,
      momentumScore: true,
      startDate: true,
      checkins: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { createdAt: true },
      },
    },
    take: 500,
  })

  for (const plan of plans) {
    const latest = plan.checkins[0]?.createdAt
      ? new Date(plan.checkins[0].createdAt).getTime()
      : null
    const planStartMs = new Date(plan.startDate).getTime()
    const planAgeMs = now.getTime() - planStartMs

    const specs: ReminderSpec[] = []

    // Rule 1: missed streak.
    const missedStreak =
      (latest != null && now.getTime() - latest > 48 * HOUR) ||
      (latest == null && planAgeMs > 2 * DAY)

    if (missedStreak) {
      specs.push({
        type: 'recovery',
        title: `We miss you on ${plan.title}`,
        body: `It has been a bit — one tiny action today is all it takes to restart the streak.`,
        channel: 'all',
        scheduledFor: new Date(now.getTime() + HOUR),
        metadata: {
          planId: plan.id,
          kind: 'missed_streak',
          hoursSinceCheckin:
            latest != null
              ? Math.round((now.getTime() - latest) / HOUR)
              : null,
        },
      })
    }

    // Rule 2: momentum drop.
    if ((plan.momentumScore ?? 50) < 40) {
      specs.push({
        type: 'recovery',
        title: `Momentum is slipping on ${plan.title}`,
        body: `Your momentum score dropped below 40. Let's recover with a small win — what is the 2-minute version of today's habit?`,
        channel: 'all',
        scheduledFor: new Date(now.getTime() + HOUR),
        metadata: {
          planId: plan.id,
          kind: 'momentum_drop',
          momentumScore: plan.momentumScore,
        },
      })
    }

    if (!specs.length) continue

    try {
      const res = await upsertReminders({
        userId: plan.userId,
        planId: plan.id,
        specs,
      })
      for (const spec of specs) {
        if (spec.metadata?.kind === 'missed_streak' && res.created > 0) {
          missedStreakCreated++
        }
        if (spec.metadata?.kind === 'momentum_drop' && res.created > 0) {
          momentumDropCreated++
        }
      }
    } catch (err) {
      console.error('[reminders/watchdog] upsert failed for plan', plan.id, err)
    }
  }

  return { missedStreakCreated, momentumDropCreated }
}
