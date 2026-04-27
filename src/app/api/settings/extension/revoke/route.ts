import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkRateLimit } from '@/lib/rate-limit'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!checkRateLimit(`settings:extension:revoke:${userId}`, 60, 60_000)) {
    return NextResponse.json({ error: 'Rate limited' }, { status: 429 })
  }

  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  const all = url.searchParams.get('all') === '1'

  const now = new Date()
  if (all) {
    await prisma.extensionToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: now },
    })
    return NextResponse.json({ ok: true })
  }
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const row = await prisma.extensionToken.findFirst({
    where: { id, userId },
    select: { id: true },
  })
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.extensionToken.update({
    where: { id: row.id },
    data: { revokedAt: now },
  })
  return NextResponse.json({ ok: true })
}
