import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkRateLimit } from '@/lib/rate-limit'

export const runtime = 'nodejs'

const PutBody = z.object({ syncCheckins: z.boolean() }).strict()

export async function GET() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const prefs = await prisma.extensionPreferences.findUnique({ where: { userId } })
  return NextResponse.json({ syncCheckins: prefs?.syncCheckins ?? false })
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!checkRateLimit(`settings:extension:prefs:${userId}`, 60, 60_000)) {
    return NextResponse.json({ error: 'Rate limited' }, { status: 429 })
  }

  const raw = await req.text()
  if (raw.length > 64 * 1024) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
  }
  let json: unknown
  try {
    json = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = PutBody.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const updated = await prisma.extensionPreferences.upsert({
    where: { userId },
    create: { userId, syncCheckins: parsed.data.syncCheckins },
    update: { syncCheckins: parsed.data.syncCheckins },
  })
  return NextResponse.json({ syncCheckins: updated.syncCheckins })
}
