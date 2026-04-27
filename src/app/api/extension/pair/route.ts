import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  generatePairingCode,
  isExtensionEnabled,
  PAIRING_TTL_MS,
} from '@/lib/extension-auth'
import { checkRateLimit } from '@/lib/rate-limit'

export const runtime = 'nodejs'

export async function POST() {
  if (!isExtensionEnabled()) {
    return NextResponse.json({ error: 'Extension disabled' }, { status: 503 })
  }
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!checkRateLimit(`extension:pair:${userId}`, 60, 60_000)) {
    return NextResponse.json({ error: 'Rate limited' }, { status: 429 })
  }

  // Try a few times in the unlikely event of code collision.
  let code = ''
  for (let i = 0; i < 5; i++) {
    code = generatePairingCode()
    const existing = await prisma.extensionPairingCode.findUnique({ where: { code } })
    if (!existing) break
    code = ''
  }
  if (!code) {
    return NextResponse.json({ error: 'Could not generate code' }, { status: 500 })
  }

  const expiresAt = new Date(Date.now() + PAIRING_TTL_MS)

  // Best-effort cleanup of any stale codes for this user.
  await prisma.extensionPairingCode.deleteMany({
    where: { OR: [{ userId }, { expiresAt: { lt: new Date() } }] },
  })

  await prisma.extensionPairingCode.create({
    data: { code, userId, expiresAt },
  })

  return NextResponse.json({ code, expiresInSeconds: Math.floor(PAIRING_TTL_MS / 1000) })
}
