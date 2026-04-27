import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { isAuthErr, verifyExtensionToken } from '@/lib/extension-auth'
import { corsJson, preflight } from '@/lib/extension-cors'
import { checkRateLimit } from '@/lib/rate-limit'

export const runtime = 'nodejs'

const PostBody = z
  .object({
    habitId: z.string().min(1).max(64),
  })
  .strict()

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function computeStreak(sortedDescDates: string[], today: string): number {
  // sortedDescDates: dates with completed=true, descending YYYY-MM-DD strings.
  if (sortedDescDates.length === 0) return 0
  // Allow streak whether or not today is checked in (count from yesterday if today not done).
  let cursor = new Date(today + 'T00:00:00Z')
  if (sortedDescDates[0] !== today) {
    cursor = new Date(cursor.getTime() - 86_400_000)
  }
  let streak = 0
  for (const d of sortedDescDates) {
    const expected = dayKey(cursor)
    if (d === expected) {
      streak++
      cursor = new Date(cursor.getTime() - 86_400_000)
    } else if (d < expected) {
      break
    }
    // If d > expected, skip (shouldn't happen with sorted desc).
  }
  return streak
}

export async function OPTIONS(req: Request) {
  return preflight(req)
}

export async function GET(req: Request) {
  const auth = await verifyExtensionToken(req)
  if (isAuthErr(auth)) {
    return corsJson(req, { error: auth.error }, { status: auth.status })
  }
  if (!checkRateLimit(`extension:habits:get:${auth.userId}`, 60, 60_000)) {
    return corsJson(req, { error: 'Rate limited' }, { status: 429 })
  }

  const today = todayKey()
  // Limit lookback for streak computation to keep payload bounded.
  const lookbackDays = 90
  const lookbackCutoff = dayKey(new Date(Date.now() - lookbackDays * 86_400_000))

  const habits = await prisma.habit.findMany({
    where: { userId: auth.userId, isActive: true },
    select: {
      id: true,
      name: true,
      frequency: true,
      color: true,
      icon: true,
      checkins: {
        where: { completed: true, date: { gte: lookbackCutoff } },
        select: { date: true },
        orderBy: { date: 'desc' },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  const items = habits.map((h) => {
    const dates = h.checkins.map((c) => c.date)
    return {
      id: h.id,
      name: h.name,
      frequency: h.frequency,
      color: h.color,
      icon: h.icon,
      completedToday: dates.includes(today),
      streak: computeStreak(dates, today),
    }
  })

  return corsJson(req, { habits: items, today })
}

export async function POST(req: Request) {
  const auth = await verifyExtensionToken(req)
  if (isAuthErr(auth)) {
    return corsJson(req, { error: auth.error }, { status: auth.status })
  }
  if (!checkRateLimit(`extension:habits:post:${auth.userId}`, 60, 60_000)) {
    return corsJson(req, { error: 'Rate limited' }, { status: 429 })
  }

  const raw = await req.text()
  if (raw.length > 64 * 1024) {
    return corsJson(req, { error: 'Payload too large' }, { status: 413 })
  }
  let json: unknown
  try {
    json = JSON.parse(raw)
  } catch {
    return corsJson(req, { error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = PostBody.safeParse(json)
  if (!parsed.success) {
    return corsJson(req, { error: 'Invalid body' }, { status: 400 })
  }

  // Confirm habit belongs to user.
  const habit = await prisma.habit.findFirst({
    where: { id: parsed.data.habitId, userId: auth.userId, isActive: true },
    select: { id: true },
  })
  if (!habit) {
    return corsJson(req, { error: 'Habit not found' }, { status: 404 })
  }

  const today = todayKey()

  // Idempotent: if already checked in today, return 200 with no change.
  const existing = await prisma.checkIn.findUnique({
    where: { habitId_date: { habitId: habit.id, date: today } },
    select: { id: true, completed: true },
  })
  if (existing) {
    return corsJson(req, { ok: true, alreadyCheckedIn: true, date: today })
  }

  await prisma.checkIn.create({
    data: {
      userId: auth.userId,
      habitId: habit.id,
      date: today,
      completed: true,
    },
  })

  return corsJson(req, { ok: true, alreadyCheckedIn: false, date: today }, { status: 201 })
}
