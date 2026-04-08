/**
 * HabitOS M5 — Plan metrics aggregation.
 *
 * Pure library: backend admin routes import getPlanMetricsSnapshot()
 * to render the coaching console dashboard. No HTTP, no auth, no UI here.
 *
 * Performance contract:
 *  - All queries use `select` (not `include`) and never pull row bodies.
 *  - Independent counts run in parallel via `Promise.all`.
 *  - Optional filter window (`from`/`to`/`tierSlug`/`framework`) applies
 *    consistently to plan-shaped metrics; check-in counters stay anchored
 *    to absolute "last 7 / 30 days" semantics regardless of the window so
 *    the dashboard counters always reflect "now".
 */

import { prisma } from '@/lib/prisma'

// Prisma client types lag behind the M1 schema additions for the coaching
// models, so we cast through `any` whenever we touch the new tables. This is
// the same pattern used by persist-plan.ts and the coaching-plans routes.
const db = prisma as any

export interface PlanMetricsSnapshot {
  totalPlans: number
  activePlans: number
  pausedPlans: number
  stoppedPlans: number
  completePlans: number
  byFramework: { GROW: number; WOOP: number; IDENTITY: number }
  byTier: Record<string, number> // tier slug -> count
  byPersona: Array<{ slug: string; name: string; count: number }>
  avgMomentumScore: number
  totalCheckins: number
  checkinsLast7Days: number
  checkinsLast30Days: number
  newPlansLast7Days: number
  newPlansLast30Days: number
}

export interface PlanMetricsOptions {
  from?: Date
  to?: Date
  tierSlug?: string
  framework?: string
}

/**
 * Build the where clause used by every plan-shaped query in this snapshot.
 * Tier filtering joins via the user's active subscription -> Plan.slug.
 */
function buildPlanWhere(opts?: PlanMetricsOptions): Record<string, unknown> {
  const where: Record<string, unknown> = {}

  if (opts?.from || opts?.to) {
    const range: Record<string, Date> = {}
    if (opts.from) range.gte = opts.from
    if (opts.to) range.lte = opts.to
    where.createdAt = range
  }

  if (opts?.framework) {
    where.framework = opts.framework
  }

  if (opts?.tierSlug) {
    // Plan -> User -> active Subscription -> Plan(slug)
    where.user = {
      subscriptions: {
        some: {
          status: 'active',
          plan: { slug: opts.tierSlug },
        },
      },
    }
  }

  return where
}

function daysAgo(days: number): Date {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - days)
  return d
}

/**
 * Returns aggregated counters + breakdowns suitable for an admin dashboard
 * card grid. Defaults all numbers to 0 on missing data — never throws on
 * absent rows.
 */
export async function getPlanMetricsSnapshot(
  opts?: PlanMetricsOptions
): Promise<PlanMetricsSnapshot> {
  const where = buildPlanWhere(opts)
  const since7 = daysAgo(7)
  const since30 = daysAgo(30)

  const [
    totalPlans,
    activePlans,
    pausedPlans,
    stoppedPlans,
    completePlans,
    growCount,
    woopCount,
    identityCount,
    momentumAgg,
    totalCheckins,
    checkinsLast7Days,
    checkinsLast30Days,
    newPlansLast7Days,
    newPlansLast30Days,
    tierGroups,
    personaGroups,
  ] = await Promise.all([
    db.coachingPlan.count({ where }),
    db.coachingPlan.count({ where: { ...where, status: 'active' } }),
    db.coachingPlan.count({ where: { ...where, status: 'paused' } }),
    db.coachingPlan.count({ where: { ...where, status: 'stopped' } }),
    db.coachingPlan.count({ where: { ...where, status: 'completed' } }),
    db.coachingPlan.count({ where: { ...where, framework: 'GROW' } }),
    db.coachingPlan.count({ where: { ...where, framework: 'WOOP' } }),
    db.coachingPlan.count({ where: { ...where, framework: 'IDENTITY' } }),
    db.coachingPlan
      .aggregate({
        where,
        _avg: { momentumScore: true },
      })
      .catch(() => ({ _avg: { momentumScore: 0 } })),
    db.planCheckin.count(),
    db.planCheckin.count({ where: { createdAt: { gte: since7 } } }),
    db.planCheckin.count({ where: { createdAt: { gte: since30 } } }),
    db.coachingPlan.count({
      where: { ...where, createdAt: { gte: since7 } },
    }),
    db.coachingPlan.count({
      where: { ...where, createdAt: { gte: since30 } },
    }),
    // Tier breakdown — pull just (planId, user.subscriptions[0].plan.slug)
    // and bucket in JS. Doing this in pure SQL would need a join Prisma
    // doesn't generate cleanly through the relation graph.
    db.coachingPlan
      .findMany({
        where,
        select: {
          id: true,
          user: {
            select: {
              subscriptions: {
                where: { status: 'active' },
                select: { plan: { select: { slug: true } } },
                orderBy: { createdAt: 'desc' },
                take: 1,
              },
            },
          },
        },
      })
      .catch(() => [] as Array<{ id: string; user: { subscriptions: Array<{ plan: { slug: string } | null }> } }>),
    // Persona breakdown via CoachingSession.personaId
    db.coachingSession
      .groupBy({
        by: ['personaId'],
        where: opts?.from || opts?.to
          ? {
              createdAt: {
                ...(opts?.from ? { gte: opts.from } : {}),
                ...(opts?.to ? { lte: opts.to } : {}),
              },
            }
          : undefined,
        _count: { _all: true },
      })
      .catch(() => [] as Array<{ personaId: string | null; _count: { _all: number } }>),
  ])

  // Tier bucket
  const byTier: Record<string, number> = {}
  for (const row of tierGroups as Array<{
    user?: { subscriptions?: Array<{ plan?: { slug?: string } | null }> }
  }>) {
    const slug = row?.user?.subscriptions?.[0]?.plan?.slug ?? 'free'
    byTier[slug] = (byTier[slug] ?? 0) + 1
  }

  // Persona breakdown — resolve slug + name in a single follow-up query.
  const personaIds = (personaGroups as Array<{ personaId: string | null }>)
    .map((g) => g.personaId)
    .filter((id): id is string => typeof id === 'string' && id.length > 0)

  let personaLookup: Array<{ id: string; slug: string; name: string }> = []
  if (personaIds.length > 0) {
    personaLookup = await db.coachPersona
      .findMany({
        where: { id: { in: personaIds } },
        select: { id: true, slug: true, name: true },
      })
      .catch(
        () => [] as Array<{ id: string; slug: string; name: string }>
      )
  }
  const personaIndex = new Map(personaLookup.map((p) => [p.id, p]))
  const byPersona = (
    personaGroups as Array<{ personaId: string | null; _count: { _all: number } }>
  )
    .filter((g) => g.personaId)
    .map((g) => {
      const meta = personaIndex.get(g.personaId as string)
      return {
        slug: meta?.slug ?? 'unknown',
        name: meta?.name ?? 'Unknown',
        count: g._count?._all ?? 0,
      }
    })
    .sort((a, b) => b.count - a.count)

  const avgMomentumScore = Number(
    (momentumAgg as { _avg?: { momentumScore: number | null } })?._avg
      ?.momentumScore ?? 0
  )

  return {
    totalPlans: Number(totalPlans ?? 0),
    activePlans: Number(activePlans ?? 0),
    pausedPlans: Number(pausedPlans ?? 0),
    stoppedPlans: Number(stoppedPlans ?? 0),
    completePlans: Number(completePlans ?? 0),
    byFramework: {
      GROW: Number(growCount ?? 0),
      WOOP: Number(woopCount ?? 0),
      IDENTITY: Number(identityCount ?? 0),
    },
    byTier,
    byPersona,
    avgMomentumScore: Math.round(avgMomentumScore * 10) / 10,
    totalCheckins: Number(totalCheckins ?? 0),
    checkinsLast7Days: Number(checkinsLast7Days ?? 0),
    checkinsLast30Days: Number(checkinsLast30Days ?? 0),
    newPlansLast7Days: Number(newPlansLast7Days ?? 0),
    newPlansLast30Days: Number(newPlansLast30Days ?? 0),
  }
}
