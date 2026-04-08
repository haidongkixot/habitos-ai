/**
 * HabitOS M4 — In-app notification writer.
 *
 * The repo already has a `Notification` model (from the base HabitOS
 * schema) with fields: userId, type, title, body, read, metadata.
 * This helper reuses it rather than introducing a new table.
 *
 * If the write fails it logs and swallows the error — we never want a
 * reminder dispatch to crash because of an inapp row failure.
 */

import { prisma } from '@/lib/prisma'

export interface WriteInAppNotificationInput {
  userId: string
  title: string
  body: string
  href?: string
  category?: string
  /** Free-form metadata. Will be JSON-stringified into the `metadata` column. */
  extra?: Record<string, unknown>
}

export async function writeInAppNotification(
  input: WriteInAppNotificationInput
): Promise<void> {
  const { userId, title, body, href, category, extra } = input

  try {
    const metadataPayload = {
      href: href ?? null,
      category: category ?? 'reminder',
      ...(extra ?? {}),
    }

    await (prisma as any).notification.create({
      data: {
        userId,
        type: category ?? 'reminder',
        title,
        body,
        metadata: JSON.stringify(metadataPayload),
      },
    })
  } catch (err) {
    console.error('[notifications/inapp] write failed', err)
  }
}
