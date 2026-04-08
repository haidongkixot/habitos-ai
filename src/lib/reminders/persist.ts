/**
 * HabitOS M4 — Reminder persistence.
 *
 * Writes a batch of `ReminderSpec`s into the `Reminder` table inside a
 * single Prisma $transaction. Idempotent: for each spec it checks whether a
 * matching row already exists using the composite key
 *
 *     (userId, planId, type, scheduledFor, channel)
 *
 * and skips it if so. This lets the same plan be re-scheduled (eg. after a
 * preference change) without creating duplicates.
 */

import { prisma } from '@/lib/prisma'
import type { ReminderSpec } from './schedule'

export interface UpsertRemindersInput {
  userId: string
  planId: string
  specs: ReminderSpec[]
}

export interface UpsertRemindersResult {
  created: number
  skipped: number
}

export async function upsertReminders(
  input: UpsertRemindersInput
): Promise<UpsertRemindersResult> {
  const { userId, planId, specs } = input
  if (!specs.length) return { created: 0, skipped: 0 }

  return prisma.$transaction(async (tx) => {
    let created = 0
    let skipped = 0

    for (const spec of specs) {
      // Composite idempotency check.
      const existing = await (tx as any).reminder.findFirst({
        where: {
          userId,
          planId,
          type: spec.type,
          channel: spec.channel,
          scheduledFor: spec.scheduledFor,
        },
        select: { id: true },
      })

      if (existing) {
        skipped++
        continue
      }

      await (tx as any).reminder.create({
        data: {
          userId,
          planId,
          planHabitId: spec.planHabitId ?? null,
          type: spec.type,
          title: spec.title,
          body: spec.body,
          channel: spec.channel,
          scheduledFor: spec.scheduledFor,
          status: 'scheduled',
          metadata: (spec.metadata ?? undefined) as any,
        },
      })
      created++
    }

    return { created, skipped }
  })
}
