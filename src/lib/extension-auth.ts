import crypto from 'crypto'
import type { NextRequest } from 'next/server'
import { prisma } from './prisma'

export const ACCESS_TTL_MS = 15 * 60 * 1000 // 15 minutes
export const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days
export const PAIRING_TTL_MS = 120 * 1000 // 120 seconds

export function isExtensionEnabled(): boolean {
  return process.env.EXTENSION_ENABLED === 'true'
}

export function getAllowedExtensionIds(): string[] {
  return (process.env.EXTENSION_IDS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

export function isExtensionAllowed(extensionId: string | null | undefined): boolean {
  if (!extensionId) return false
  const allowlist = getAllowedExtensionIds()
  if (allowlist.length === 0) return false
  return allowlist.includes(extensionId)
}

export function sha256(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex')
}

export function generatePairingCode(): string {
  // 6 digits, zero-padded, drawn from crypto-random for evenness.
  const n = crypto.randomInt(0, 1_000_000)
  return n.toString().padStart(6, '0')
}

export function generateToken(): string {
  // 32 bytes -> 43 chars base64url; high entropy.
  return crypto.randomBytes(32).toString('base64url')
}

export type ExtensionAuthOk = { userId: string; tokenId: string }
export type ExtensionAuthErr = { error: string; status: number }
export type ExtensionAuthResult = ExtensionAuthOk | ExtensionAuthErr

export function isAuthErr(r: ExtensionAuthResult): r is ExtensionAuthErr {
  return 'error' in r
}

/**
 * Validate Bearer token + X-Extension-Id allowlist + EXTENSION_ENABLED gate.
 * Updates lastUsedAt on success.
 */
export async function verifyExtensionToken(req: Request | NextRequest): Promise<ExtensionAuthResult> {
  if (!isExtensionEnabled()) {
    return { error: 'Extension disabled', status: 503 }
  }

  const extId = req.headers.get('x-extension-id')
  if (!isExtensionAllowed(extId)) {
    return { error: 'Unauthorized extension', status: 401 }
  }

  const auth = req.headers.get('authorization') || ''
  const m = /^Bearer\s+(.+)$/i.exec(auth)
  if (!m) {
    return { error: 'Missing bearer token', status: 401 }
  }
  const token = m[1].trim()
  if (!token) {
    return { error: 'Missing bearer token', status: 401 }
  }

  const tokenHash = sha256(token)
  const row = await prisma.extensionToken.findUnique({ where: { tokenHash } })
  if (!row) return { error: 'Invalid token', status: 401 }
  if (row.revokedAt) return { error: 'Revoked', status: 401 }
  if (row.expiresAt.getTime() < Date.now()) return { error: 'Expired', status: 401 }
  if (row.extensionId !== extId) return { error: 'Extension mismatch', status: 401 }

  // Best-effort touch.
  prisma.extensionToken
    .update({ where: { id: row.id }, data: { lastUsedAt: new Date() } })
    .catch(() => {})

  return { userId: row.userId, tokenId: row.id }
}
