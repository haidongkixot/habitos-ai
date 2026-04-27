import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { isAuthErr, verifyExtensionToken } from '@/lib/extension-auth'
import { corsJson, preflight } from '@/lib/extension-cors'
import { checkRateLimit } from '@/lib/rate-limit'

export const runtime = 'nodejs'

const Body = z
  .object({
    all: z.boolean().optional(),
  })
  .strict()

export async function OPTIONS(req: Request) {
  return preflight(req)
}

export async function POST(req: Request) {
  const auth = await verifyExtensionToken(req)
  if (isAuthErr(auth)) {
    return corsJson(req, { error: auth.error }, { status: auth.status })
  }

  if (!checkRateLimit(`extension:token:revoke:${auth.userId}`, 60, 60_000)) {
    return corsJson(req, { error: 'Rate limited' }, { status: 429 })
  }

  const raw = await req.text()
  if (raw.length > 64 * 1024) {
    return corsJson(req, { error: 'Payload too large' }, { status: 413 })
  }
  let body: { all?: boolean } = {}
  if (raw.length) {
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
    body = parsed.data
  }

  const now = new Date()
  if (body.all) {
    await prisma.extensionToken.updateMany({
      where: { userId: auth.userId, revokedAt: null },
      data: { revokedAt: now },
    })
  } else {
    await prisma.extensionToken.update({
      where: { id: auth.tokenId },
      data: { revokedAt: now },
    })
  }

  return corsJson(req, { ok: true })
}
