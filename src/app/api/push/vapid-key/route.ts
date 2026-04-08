/**
 * HabitOS M4 — /api/push/vapid-key
 *
 * Returns the public VAPID key so the frontend can subscribe a browser
 * PushManager without exposing it via NEXT_PUBLIC_* (which bakes it into
 * every page bundle). This is a public key — no authentication required.
 */

import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  return NextResponse.json({ publicKey: process.env.VAPID_PUBLIC_KEY ?? null })
}
