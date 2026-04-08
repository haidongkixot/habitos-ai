/**
 * HabitOS M4 — MotivationEvent writer.
 *
 * Best-effort logger for user motivation signals. Swallows all errors so
 * it can safely be called from hot paths (dispatch, checkin, momentum).
 *
 * Schema reference (from prisma/schema.prisma):
 *   model MotivationEvent {
 *     id        String   @id @default(cuid())
 *     userId    String
 *     type      String
 *     content   String   @db.Text
 *     personaId String?
 *     model     String?
 *     metadata  Json?
 *     createdAt DateTime @default(now())
 *   }
 */

import { prisma } from '@/lib/prisma'

export interface RecordMotivationEventInput {
  userId: string
  planId?: string
  type: string
  content?: string
  delta?: number
  personaId?: string | null
  model?: string | null
  metadata?: Record<string, unknown>
}

export async function recordMotivationEvent(
  input: RecordMotivationEventInput
): Promise<void> {
  const { userId, planId, type, content, delta, personaId, model, metadata } =
    input

  try {
    const merged: Record<string, unknown> = {
      ...(metadata ?? {}),
    }
    if (planId !== undefined) merged.planId = planId
    if (delta !== undefined) merged.delta = delta

    await (prisma as any).motivationEvent.create({
      data: {
        userId,
        type,
        content: content ?? '',
        personaId: personaId ?? null,
        model: model ?? null,
        metadata: merged as any,
      },
    })
  } catch (err) {
    console.error('[motivation/events] write failed', err)
  }
}
