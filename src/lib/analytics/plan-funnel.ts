/**
 * HabitOS M5 — Wizard → Plan → Momentum funnel.
 *
 * Pure library: backend admin route imports getPlanFunnel() to render the
 * conversion-rate widget on the coaching console dashboard.
 *
 * Funnel stages:
 *   1. goalsCreated         — every Goal row
 *   2. wizardsStarted       — proxy: every Goal row that has a CoachingPlan,
 *                              OR the same value as goalsCreated when no
 *                              wizard-start signal exists on the Goal model
 *                              (see NOTE below)
 *   3. plansGenerated       — every CoachingPlan row
 *   4. plansActive          — CoachingPlan with status=active
 *   5. plansWithCheckins    — CoachingPlan that has at least 1 PlanCheckin
 *   6. plansWithMomentumGain — CoachingPlan with momentumScore > 50
 *
 * conversionRate = plansActive / goalsCreated   (0..1, 0 when goals=0)
 */

import { prisma } from '@/lib/prisma'

const db = prisma as any

export interface PlanFunnel {
  goalsCreated: number
  wizardsStarted: number
  plansGenerated: number
  plansActive: number
  plansWithCheckins: number
  plansWithMomentumGain: number
  conversionRate: number
}

export interface PlanFunnelOptions {
  from?: Date
  to?: Date
}

function buildDateRange(opts?: PlanFunnelOptions) {
  if (!opts?.from && !opts?.to) return undefined
  const range: Record<string, Date> = {}
  if (opts.from) range.gte = opts.from
  if (opts.to) range.lte = opts.to
  return range
}

/**
 * Returns the wizard-to-momentum conversion funnel for the optional
 * date window. Independent counts are parallelized via Promise.all.
 *
 * NOTE: Goal model has no `wizardStartedAt` column in the M1 schema — the
 * wizard is a client-side stepper that calls POST /api/coaching-plans
 * directly, so we use "Goal has at least one CoachingPlan" as the proxy
 * for "wizard reached the generate step". When that proxy collapses to
 * 0 (no plans yet), wizardsStarted falls back to goalsCreated to avoid
 * implying a 100% drop-off bar in the dashboard chart.
 */
export async function getPlanFunnel(
  opts?: PlanFunnelOptions
): Promise<PlanFunnel> {
  const dateRange = buildDateRange(opts)
  const goalWhere: Record<string, unknown> = dateRange
    ? { createdAt: dateRange }
    : {}
  const planWhere: Record<string, unknown> = dateRange
    ? { createdAt: dateRange }
    : {}

  const [
    goalsCreated,
    goalsWithPlans,
    plansGenerated,
    plansActive,
    plansWithCheckinsAgg,
    plansWithMomentumGain,
  ] = await Promise.all([
    db.goal.count({ where: goalWhere }),
    db.goal
      .count({
        where: {
          ...goalWhere,
          plans: { some: {} },
        },
      })
      .catch(() => 0),
    db.coachingPlan.count({ where: planWhere }),
    db.coachingPlan.count({
      where: { ...planWhere, status: 'active' },
    }),
    // Distinct planIds with at least 1 PlanCheckin in the window.
    db.planCheckin
      .findMany({
        where: dateRange ? { createdAt: dateRange } : undefined,
        select: { planId: true },
        distinct: ['planId'],
      })
      .catch(() => [] as Array<{ planId: string }>),
    db.coachingPlan.count({
      where: {
        ...planWhere,
        momentumScore: { gt: 50 },
      },
    }),
  ])

  const plansWithCheckins = Array.isArray(plansWithCheckinsAgg)
    ? plansWithCheckinsAgg.length
    : 0

  const goalsCreatedNum = Number(goalsCreated ?? 0)
  // Proxy logic — see NOTE above. Falls back to goalsCreated when the
  // "has plan" signal is empty (e.g. early days, no wizard completions yet).
  const wizardsStarted =
    Number(goalsWithPlans ?? 0) > 0
      ? Number(goalsWithPlans)
      : goalsCreatedNum

  const conversionRate =
    goalsCreatedNum > 0 ? Number(plansActive ?? 0) / goalsCreatedNum : 0

  return {
    goalsCreated: goalsCreatedNum,
    wizardsStarted,
    plansGenerated: Number(plansGenerated ?? 0),
    plansActive: Number(plansActive ?? 0),
    plansWithCheckins,
    plansWithMomentumGain: Number(plansWithMomentumGain ?? 0),
    conversionRate: Math.round(conversionRate * 10000) / 10000,
  }
}
