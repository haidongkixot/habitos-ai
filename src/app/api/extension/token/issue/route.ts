import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import {
  ACCESS_TTL_MS,
  REFRESH_TTL_MS,
  generateToken,
  isExtensionAllowed,
  isExtensionEnabled,
  sha256,
} from '@/lib/extension-auth'
import { corsJson, preflight } from '@/lib/extension-cors'
import { checkRateLimit } from '@/lib/rate-limit'

export const runtime = 'nodejs'

const Body = z
  .object({
    extensionId: z.string().min(1).max(128),
    pairingCode: z.string().regex(/^\d{6}$/),
  })
  .strict()

export async function OPTIONS(req: Request) {
  return preflight(req)
}

export async function POST(req: Request) {
  if (!isExtensionEnabled()) {
    return corsJson(req, { error: 'Extension disabled' }, { status: 503 })
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
  const parsed = Body.safeParse(json)
  if (!parsed.success) {
    return corsJson(req, { error: 'Invalid body' }, { status: 400 })
  }
  const { extensionId, pairingCode } = parsed.data

  if (!isExtensionAllowed(extensionId)) {
    return corsJson(req, { error: 'Unauthorized extension' }, { status: 401 })
  }

  if (!checkRateLimit(`extension:token:issue:${extensionId}`, 60, 60_000)) {
    return corsJson(req, { error: 'Rate limited' }, { status: 429 })
  }

  // Single-use: delete on lookup regardless of validity (replay protection).
  const codeRow = await prisma.extensionPairingCode
    .delete({ where: { code: pairingCode } })
    .catch(() => null)
  if (!codeRow) {
    return corsJson(req, { error: 'Invalid pairing code' }, { status: 400 })
  }
  if (codeRow.expiresAt.getTime() < Date.now()) {
    return corsJson(req, { error: 'Pairing code expired' }, { status: 400 })
  }

  const accessToken = generateToken()
  const refreshToken = generateToken()
  const now = new Date()
  const expiresAt = new Date(now.getTime() + ACCESS_TTL_MS)
  const refreshExpiresAt = new Date(now.getTime() + REFRESH_TTL_MS)
  const userAgent = req.headers.get('user-agent')?.slice(0, 256) || null

  await prisma.extensionToken.create({
    data: {
      userId: codeRow.userId,
      tokenHash: sha256(accessToken),
      refreshHash: sha256(refreshToken),
      extensionId,
      userAgent,
      expiresAt,
      refreshExpiresAt,
    },
  })

  return corsJson(req, {
    accessToken,
    refreshToken,
    expiresAt: expiresAt.toISOString(),
    refreshExpiresAt: refreshExpiresAt.toISOString(),
  })
}
