import { prisma } from '@/lib/prisma'
import { getPayPalSubscription } from '@/lib/paypal/subscriptions'
import { getPlanSlugFromPayPalPlanId } from '@/lib/paypal/tier-resolver'

export interface PayPalSyncResult {
  ok: boolean; reason?: string; subscriptionId?: string; userId?: string; planSlug?: string; status?: string
}

function normalizeStatus(s: string): string {
  return ({ ACTIVE:'active', APPROVAL_PENDING:'incomplete', APPROVED:'incomplete', SUSPENDED:'past_due', CANCELLED:'canceled', EXPIRED:'canceled' } as Record<string,string>)[s] ?? s.toLowerCase()
}

export async function syncSubscriptionFromPayPal(subscriptionId: string): Promise<PayPalSyncResult> {
  let sub: any
  try { sub = await getPayPalSubscription(subscriptionId) } catch (err) {
    return { ok: false, reason: `Failed to fetch: ${err}`, subscriptionId }
  }

  let userId: string | null = null
  if (sub.custom_id) {
    const u = await prisma.user.findUnique({ where: { id: sub.custom_id }, select: { id: true } })
    if (u) userId = u.id
  }
  if (!userId && sub.subscriber?.email_address) {
    const u = await prisma.user.findUnique({ where: { email: sub.subscriber.email_address }, select: { id: true } })
    if (u) userId = u.id
  }
  if (!userId) return { ok: false, reason: `No user found for sub ${subscriptionId}`, subscriptionId }

  const mapped = getPlanSlugFromPayPalPlanId(sub.plan_id)
  if (!mapped) return { ok: false, reason: `Unknown plan_id ${sub.plan_id}`, subscriptionId, userId }

  const plan = await prisma.plan.findUnique({ where: { slug: mapped.slug }, select: { id: true, slug: true } })
  if (!plan) return { ok: false, reason: `No Plan row for slug=${mapped.slug}`, subscriptionId, userId }

  const status = normalizeStatus(sub.status)
  const currentPeriodStart = sub.billing_info?.last_payment?.time
    ? new Date(sub.billing_info.last_payment.time)
    : (sub.start_time ? new Date(sub.start_time) : new Date())
  const currentPeriodEnd = sub.billing_info?.next_billing_time
    ? new Date(sub.billing_info.next_billing_time) : null
  // HabitOS: canceledAt with single 'l', no period/startDate/endDate fields
  const canceledAt = (sub.status === 'CANCELLED' || sub.status === 'EXPIRED') ? new Date() : null

  await prisma.subscription.upsert({
    where: { paypalSubId: subscriptionId },
    update: {
      userId, planId: plan.id, status,
      currentPeriodStart,
      currentPeriodEnd: currentPeriodEnd ?? undefined,
      canceledAt,
    },
    create: {
      userId, planId: plan.id, status,
      paypalSubId: subscriptionId,
      currentPeriodStart,
      currentPeriodEnd: currentPeriodEnd ?? undefined,
      canceledAt,
    },
  })

  // HabitOS User has NO plan field — skip user.plan update
  console.log('[paypal/sync] upserted sub=', subscriptionId, 'user=', userId, 'plan=', plan.slug)
  return { ok: true, subscriptionId, userId, planSlug: plan.slug, status }
}
