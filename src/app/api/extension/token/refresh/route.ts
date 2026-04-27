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
    refreshToken: z.string().min(10).max(512),
  })
  .strict()

export async function OPTIONS(req: Request) {
  return preflight(req)
}

export async function POST(req: Request) {
  if (!isExtensionEnabled()) {
    return corsJson(req, { error: 'Extension disabled' }, { status: 503 })
  }

  const extId = req.headers.get('x-extension-id')
  if (!isExtensionAllowed(extId)) {
    return corsJson(req, { error: 'Unauthorized extension' }, { status: 401 })
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

  if (!checkRateLimit(`extension:token:refresh:${extId}`, 60, 60_000)) {
    return corsJson(req, { error: 'Rate limited' }, { status: 429 })
  }

  const refreshHash = sha256(parsed.data.refreshToken)
  const row = await prisma.extensionToken.findUnique({ where: { refreshHash } })

  if (!row) {
    return corsJson(req, { error: 'Invalid refresh token' }, { status: 401 })
  }

  // Reuse detection: if this refresh token is on a revoked row, the leak
  // is real → revoke ALL of this user's tokens.
  if (row.revokedAt) {
    await prisma.extensionToken.updateMany({
      where: { userId: row.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    })
    return corsJson(req, { error: 'Refresh reuse detected; all tokens revoked' }, { status: 401 })
  }

  if (row.refreshExpiresAt.getTime() < Date.now()) {
    return corsJson(req, { error: 'Refresh token expired' }, { status: 401 })
  }
  if (row.extensionId !== extId) {
    return corsJson(req, { error: 'Extension mismatch' }, { status: 401 })
  }

  const accessToken = generateToken()
  const refreshToken = generateToken()
  const now = new Date()
  const expiresAt = new Date(now.getTime() + ACCESS_TTL_MS)
  const refreshExpiresAt = new Date(now.getTime() + REFRESH_TTL_MS)

  // Rotate: revoke the old row (keep it so reuse can be detected), insert a new one.
  await prisma.$transaction([
    prisma.extensionToken.update({
      where: { id: row.id },
      data: { revokedAt: new Date() },
    }),
    prisma.extensionToken.create({
      data: {
        userId: row.userId,
        tokenHash: sha256(accessToken),
        refreshHash: sha256(refreshToken),
        extensionId: row.extensionId,
        userAgent: row.userAgent,
        expiresAt,
        refreshExpiresAt,
      },
    }),
  ])

  return corsJson(req, {
    accessToken,
    refreshToken,
    expiresAt: expiresAt.toISOString(),
    refreshExpiresAt: refreshExpiresAt.toISOString(),
  })
}
