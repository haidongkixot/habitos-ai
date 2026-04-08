/**
 * HabitOS M4 — Reminder dispatcher.
 *
 * Pulls due reminders from the `Reminder` table and fans them out to the
 * appropriate transport (email, push, inapp). Called by the cron endpoint
 * `/api/cron/dispatch-reminders`.
 *
 * Query criteria:
 *   status = "scheduled" AND scheduledFor <= now AND dispatchedAt IS NULL
 *
 * For each reminder the dispatcher:
 *   1. Resolves channel → transport function
 *   2. Substitutes persona-flavoured placeholders in title/body (no AI calls)
 *   3. Marks the row with dispatchedAt + new status (sent | failed)
 *   4. Records a MotivationEvent on success
 */

import { prisma } from '@/lib/prisma'
import { sendEmailReminder } from '@/lib/notifications/email'
import { sendPushNotification } from '@/lib/notifications/push'
import { writeInAppNotification } from '@/lib/notifications/inapp'
import { recordMotivationEvent } from '@/lib/motivation/events'

export interface DispatchResult {
  total: number
  dispatched: number
  failed: number
  skipped: number
}

export interface DispatchOptions {
  now?: Date
  limit?: number
}

interface ReminderRow {
  id: string
  userId: string
  planId: string | null
  planHabitId: string | null
  type: string
  title: string
  body: string
  channel: string
  scheduledFor: Date
  metadata: unknown
}

function substituteTemplate(
  text: string,
  vars: Record<string, string | undefined>
): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? '')
}

function flavourByPersona(style: string | undefined, text: string): string {
  const s = (style ?? 'encouraging').toLowerCase()
  if (s === 'drill_sergeant' || s === 'intense') {
    return text.replace(/\.$/, '. No excuses.')
  }
  if (s === 'zen' || s === 'reflective') {
    return text.replace(/\.$/, '. Breathe, then begin.')
  }
  if (s === 'cheerleader' || s === 'playful') {
    return text + ' You got this!'
  }
  return text
}

async function getUserContext(userId: string): Promise<{
  email: string | null
  name: string | null
}> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    })
    return { email: user?.email ?? null, name: user?.name ?? null }
  } catch {
    return { email: null, name: null }
  }
}

async function dispatchOne(row: ReminderRow): Promise<{
  ok: boolean
  error?: string
  channelUsed: string
}> {
  const userCtx = await getUserContext(row.userId)
  const nameVar = userCtx.name ?? 'friend'

  // Resolve plan motivation style (best-effort, optional).
  let motivationStyle: string | undefined
  if (row.planId) {
    try {
      const plan = await (prisma as any).coachingPlan.findUnique({
        where: { id: row.planId },
        select: { motivationStyle: true },
      })
      motivationStyle = plan?.motivationStyle ?? undefined
    } catch {
      motivationStyle = undefined
    }
  }

  const title = flavourByPersona(
    motivationStyle,
    substituteTemplate(row.title, { name: nameVar })
  )
  const body = flavourByPersona(
    motivationStyle,
    substituteTemplate(row.body, { name: nameVar })
  )

  const channel = row.channel

  if (channel === 'inapp' || channel === 'all') {
    await writeInAppNotification({
      userId: row.userId,
      title,
      body,
      href: row.planId ? `/plan/${row.planId}` : undefined,
      category: row.type,
    })
    if (channel === 'inapp') {
      return { ok: true, channelUsed: 'inapp' }
    }
  }

  if (channel === 'email' || channel === 'all') {
    if (!userCtx.email) {
      return { ok: false, error: 'no_user_email', channelUsed: 'email' }
    }
    // We cannot import from src/emails/* (designer owns it). Build a
    // minimal React element inline so the email helper has something to
    // render. When the designer's templates land we can swap this out
    // without touching dispatch logic.
    const React: typeof import('react') = await import('react')
    const element = React.createElement(
      'div',
      null,
      React.createElement('h1', null, title),
      React.createElement('p', null, body)
    )
    const result = await sendEmailReminder({
      to: userCtx.email,
      subject: title,
      reactTemplate: element as any,
      tags: [{ name: 'reminder_type', value: row.type }],
    })
    if (!result.ok && channel === 'email') {
      return { ok: false, error: result.error, channelUsed: 'email' }
    }
    if (channel === 'email') {
      return { ok: true, channelUsed: 'email' }
    }
  }

  if (channel === 'push' || channel === 'all') {
    const subs = await (prisma as any).pushSubscription.findMany({
      where: { userId: row.userId },
      take: 5,
    })
    if (!subs.length) {
      if (channel === 'push') {
        return {
          ok: false,
          error: 'no_push_subscription',
          channelUsed: 'push',
        }
      }
    }

    let anyOk = false
    let lastError: string | undefined
    for (const sub of subs) {
      const res = await sendPushNotification({
        subscription: {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dhKey, auth: sub.authKey },
        },
        title,
        body,
        url: row.planId ? `/plan/${row.planId}` : '/',
        tag: `habitos-${row.type}`,
      })
      if (res.ok) {
        anyOk = true
      } else {
        lastError = res.error
      }
    }
    if (channel === 'push') {
      return anyOk
        ? { ok: true, channelUsed: 'push' }
        : { ok: false, error: lastError ?? 'push_failed', channelUsed: 'push' }
    }
    // 'all' — at least one succeeded (inapp was already attempted above)
    return { ok: true, channelUsed: 'all' }
  }

  return { ok: false, error: `unknown_channel:${channel}`, channelUsed: channel }
}

export async function dispatchDueReminders(
  options: DispatchOptions = {}
): Promise<DispatchResult> {
  const now = options.now ?? new Date()
  const limit = options.limit ?? 200

  const due: ReminderRow[] = await (prisma as any).reminder.findMany({
    where: {
      status: 'scheduled',
      scheduledFor: { lte: now },
      dispatchedAt: null,
    },
    orderBy: { scheduledFor: 'asc' },
    take: limit,
  })

  const result: DispatchResult = {
    total: due.length,
    dispatched: 0,
    failed: 0,
    skipped: 0,
  }

  for (const row of due) {
    try {
      const outcome = await dispatchOne(row)
      if (outcome.ok) {
        await (prisma as any).reminder.update({
          where: { id: row.id },
          data: {
            dispatchedAt: new Date(),
            status: 'sent',
          },
        })
        await recordMotivationEvent({
          userId: row.userId,
          planId: row.planId ?? undefined,
          type: 'reminder_dispatched',
          content: `${row.type} via ${outcome.channelUsed}`,
          metadata: { reminderId: row.id, channel: outcome.channelUsed },
        })
        result.dispatched++
      } else {
        await (prisma as any).reminder.update({
          where: { id: row.id },
          data: {
            dispatchedAt: new Date(),
            status: 'failed',
            metadata: {
              error: outcome.error ?? 'unknown',
              channel: outcome.channelUsed,
              originalMetadata: row.metadata ?? null,
            } as any,
          },
        })
        result.failed++
      }
    } catch (err) {
      console.error('[reminders/dispatch] unexpected error', err)
      result.failed++
      try {
        await (prisma as any).reminder.update({
          where: { id: row.id },
          data: {
            dispatchedAt: new Date(),
            status: 'failed',
          },
        })
      } catch {
        // swallow
      }
    }
  }

  return result
}
