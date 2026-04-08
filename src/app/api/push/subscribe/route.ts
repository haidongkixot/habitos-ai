/**
 * HabitOS M4 — /api/push/subscribe
 *
 * POST   → accepts a browser PushSubscription { endpoint, keys: { p256dh, auth } }
 *          and upserts a PushSubscription row. Session required.
 * DELETE → removes a subscription by endpoint (body.endpoint). Session required.
 *
 * NOTE: The Phase-1 PushSubscription model has no `active` field. We treat
 * "inactive" as deletion, which is simpler and avoids dangling rows.
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
  userAgent: z.string().optional(),
})

const unsubscribeSchema = z.object({
  endpoint: z.string().url(),
})

async function getUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user) return null
  return ((session.user as any).id as string) ?? null
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

  const parsed = subscribeSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { endpoint, keys, userAgent } = parsed.data

  try {
    const row = await (prisma as any).pushSubscription.upsert({
      where: { endpoint },
      update: {
        userId,
        p256dhKey: keys.p256dh,
        authKey: keys.auth,
        userAgent: userAgent ?? null,
        lastUsedAt: new Date(),
      },
      create: {
        userId,
        endpoint,
        p256dhKey: keys.p256dh,
        authKey: keys.auth,
        userAgent: userAgent ?? null,
      },
    })
    return NextResponse.json({ subscription: row }, { status: 201 })
  } catch (err) {
    console.error('[api/push/subscribe POST] failed', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
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

  const parsed = unsubscribeSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.flatten() },
      { status: 400 }
    )
  }

  try {
    await (prisma as any).pushSubscription.deleteMany({
      where: { endpoint: parsed.data.endpoint, userId },
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[api/push/subscribe DELETE] failed', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
