/**
 * HabitOS M4 — Cron endpoint: dispatch due reminders.
 *
 * Protected via `Authorization: Bearer <CRON_SECRET>`.
 * Meant to be invoked every few minutes by the vercel.json cron config.
 */

import { NextResponse } from 'next/server'
import { dispatchDueReminders } from '@/lib/reminders/dispatch'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const header = req.headers.get('authorization') ?? ''
  return header === `Bearer ${secret}`
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await dispatchDueReminders({ limit: 100 })
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    console.error('[cron/dispatch-reminders] failed', err)
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 }
    )
  }
}
