/**
 * Stripe webhook idempotency helper.
 *
 * STRATEGY (documented in completion signal):
 * The schema is frozen — we cannot add a dedicated `ProcessedWebhookEvent`
 * table. Of the existing tables:
 *   - PlanAuditLog requires a CoachingPlan FK (unusable for billing rows)
 *   - AIGenerationLog has required `adminId` (also a poor fit + semantic mismatch)
 *   - SiteSettings has { key @unique, value @db.Text } and is the cleanest
 *     KV store already in the schema
 *
 * We use SiteSettings rows with key=`stripe.webhook.event:<event.id>` and
 * value=ISO timestamp of when we first processed it. The unique constraint
 * on `key` makes this race-safe across instances: a parallel webhook
 * delivery for the same event.id will fail the create() with a unique
 * violation, which we catch and treat as "already processed".
 *
 * Cleanup: Stripe webhook events are best-deduped for ~30 days (Stripe
 * retries up to 3 days with exponential backoff). A periodic cron can
 * `prisma.siteSettings.deleteMany({ where: { key: { startsWith: 'stripe.webhook.event:' }, ... } })`
 * but that is out of scope for M6.
 */
import { prisma } from '@/lib/prisma'

const KEY_PREFIX = 'stripe.webhook.event:'

function makeKey(eventId: string): string {
  return `${KEY_PREFIX}${eventId}`
}

/**
 * Returns true iff this event.id has already been recorded as processed.
 */
export async function hasProcessedEvent(eventId: string): Promise<boolean> {
  if (!eventId) return false
  try {
    const row = await (prisma as any).siteSettings?.findUnique?.({
      where: { key: makeKey(eventId) },
    })
    return Boolean(row)
  } catch {
    return false
  }
}

/**
 * Atomically claim an event.id as "processed by us". Returns true if we
 * are the first instance to record it (caller should run handlers).
 * Returns false if another instance already recorded it (caller should
 * skip handlers and return 200 to Stripe).
 *
 * Implementation uses prisma.create + unique violation catch — this is
 * safe across multiple webhook instances because the SiteSettings.key
 * column carries a UNIQUE index.
 */
export async function claimEvent(eventId: string): Promise<boolean> {
  if (!eventId) return false
  try {
    await (prisma as any).siteSettings.create({
      data: {
        key: makeKey(eventId),
        value: new Date().toISOString(),
      },
    })
    return true
  } catch (err: any) {
    // Prisma unique constraint violation = already claimed by a peer.
    // Code 'P2002' is the unique-constraint failure.
    if (err?.code === 'P2002') return false
    // Any other error: don't double-process. Re-raise so the webhook
    // handler returns 500 and Stripe retries.
    throw err
  }
}

/**
 * Convenience: combine hasProcessedEvent + claimEvent into one call.
 * Returns 'duplicate' if the event was already processed (caller should
 * 200-skip), 'fresh' if we just claimed it (caller should run handlers).
 */
export async function tryClaimEvent(
  eventId: string
): Promise<'fresh' | 'duplicate'> {
  if (await hasProcessedEvent(eventId)) return 'duplicate'
  const claimed = await claimEvent(eventId)
  return claimed ? 'fresh' : 'duplicate'
}
