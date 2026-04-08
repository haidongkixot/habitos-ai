/**
 * HabitOS M4 — /api/notifications/preferences
 *
 * GET → current user's NotificationPreference row (or sensible defaults).
 * PUT → validate with notificationPreferenceSchema and upsert by userId.
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notificationPreferenceSchema } from '@/lib/zod/reminder'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const DEFAULTS = {
  inappEnabled: true,
  emailEnabled: true,
  pushEnabled: false,
  quietStart: null as string | null,
  quietEnd: null as string | null,
  weekendQuiet: false,
  cadence: 'normal' as const,
}

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
    const row = await (prisma as any).notificationPreference.findUnique({
      where: { userId },
    })
    return NextResponse.json({ preferences: row ?? { userId, ...DEFAULTS } })
  } catch (err) {
    console.error('[api/notifications/preferences GET] failed', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
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

  const parsed = notificationPreferenceSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const data = parsed.data

  try {
    const row = await (prisma as any).notificationPreference.upsert({
      where: { userId },
      update: {
        inappEnabled: data.inappEnabled,
        emailEnabled: data.emailEnabled,
        pushEnabled: data.pushEnabled,
        quietStart: data.quietStart ?? null,
        quietEnd: data.quietEnd ?? null,
        weekendQuiet: data.weekendQuiet,
        cadence: data.cadence,
      },
      create: {
        userId,
        inappEnabled: data.inappEnabled,
        emailEnabled: data.emailEnabled,
        pushEnabled: data.pushEnabled,
        quietStart: data.quietStart ?? null,
        quietEnd: data.quietEnd ?? null,
        weekendQuiet: data.weekendQuiet,
        cadence: data.cadence,
      },
    })
    return NextResponse.json({ preferences: row })
  } catch (err) {
    console.error('[api/notifications/preferences PUT] failed', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
