import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { isAuthErr, verifyExtensionToken } from '@/lib/extension-auth'
import { corsJson, preflight } from '@/lib/extension-cors'
import { checkRateLimit } from '@/lib/rate-limit'

export const runtime = 'nodejs'

const PutBody = z
  .object({
    syncCheckins: z.boolean(),
  })
  .strict()

export async function OPTIONS(req: Request) {
  return preflight(req)
}

export async function GET(req: Request) {
  const auth = await verifyExtensionToken(req)
  if (isAuthErr(auth)) {
    return corsJson(req, { error: auth.error }, { status: auth.status })
  }
  if (!checkRateLimit(`extension:prefs:get:${auth.userId}`, 60, 60_000)) {
    return corsJson(req, { error: 'Rate limited' }, { status: 429 })
  }
  const prefs = await prisma.extensionPreferences.findUnique({ where: { userId: auth.userId } })
  return corsJson(req, {
    syncCheckins: prefs?.syncCheckins ?? false,
  })
}

export async function PUT(req: Request) {
  const auth = await verifyExtensionToken(req)
  if (isAuthErr(auth)) {
    return corsJson(req, { error: auth.error }, { status: auth.status })
  }
  if (!checkRateLimit(`extension:prefs:put:${auth.userId}`, 60, 60_000)) {
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
  const parsed = PutBody.safeParse(json)
  if (!parsed.success) {
    return corsJson(req, { error: 'Invalid body' }, { status: 400 })
  }

  const updated = await prisma.extensionPreferences.upsert({
    where: { userId: auth.userId },
    create: { userId: auth.userId, syncCheckins: parsed.data.syncCheckins },
    update: { syncCheckins: parsed.data.syncCheckins },
  })
  return corsJson(req, { syncCheckins: updated.syncCheckins })
}
