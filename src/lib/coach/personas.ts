import { prisma } from '@/lib/prisma'
import type { CoachPersona } from '@prisma/client'

/**
 * Plan tier hierarchy. Index = rank. Higher index unlocks lower tiers.
 */
export const PLAN_RANK = ['free', 'starter', 'pro', 'premium'] as const
export type PlanSlug = (typeof PLAN_RANK)[number]

/**
 * Returns true if the given user plan can access the persona.
 * Unknown plans default to free-tier rank (0).
 */
export function canUserAccessPersona(persona: CoachPersona, userPlanSlug: string): boolean {
  const userIdx = PLAN_RANK.indexOf(userPlanSlug as PlanSlug)
  const requiredIdx = PLAN_RANK.indexOf(persona.minPlanSlug as PlanSlug)
  const safeUser = userIdx === -1 ? 0 : userIdx
  const safeRequired = requiredIdx === -1 ? 0 : requiredIdx
  return safeUser >= safeRequired
}

/**
 * Lists personas. By default returns only active personas, ordered so the
 * cheapest tier appears first and then alphabetical by name.
 *
 * If `planSlug` is supplied, only personas the user can access are returned.
 */
export async function listPersonas(options?: {
  planSlug?: string
  onlyActive?: boolean
}): Promise<CoachPersona[]> {
  const onlyActive = options?.onlyActive ?? true

  const where: Record<string, unknown> = {}
  if (onlyActive) where.isActive = true

  const personas: CoachPersona[] = await (prisma as any).coachPersona.findMany({
    where,
    orderBy: [{ minPlanSlug: 'asc' }, { name: 'asc' }],
  })

  if (!options?.planSlug) return personas
  return personas.filter((p) => canUserAccessPersona(p, options.planSlug as string))
}

/**
 * Loads a single persona by its slug. Returns null if not found.
 */
export async function getPersonaBySlug(slug: string): Promise<CoachPersona | null> {
  const persona = await (prisma as any).coachPersona.findUnique({
    where: { slug },
  })
  return persona ?? null
}

/**
 * Returns the default free-tier persona. Prefers slug "alex" if present
 * (matches the original spec), then "alex-default" (current seed), then
 * the first active free-tier persona ordered by name.
 */
export async function getDefaultPersona(): Promise<CoachPersona> {
  const preferredSlugs = ['alex', 'alex-default']
  for (const slug of preferredSlugs) {
    const candidate = await (prisma as any).coachPersona.findUnique({ where: { slug } })
    if (candidate && candidate.isActive) return candidate
  }

  const fallback = await (prisma as any).coachPersona.findFirst({
    where: { isActive: true, minPlanSlug: 'free' },
    orderBy: { name: 'asc' },
  })
  if (fallback) return fallback

  // Last-ditch — any active persona at all so the coach pipeline never breaks.
  const anyPersona = await (prisma as any).coachPersona.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: 'asc' },
  })
  if (anyPersona) return anyPersona

  throw new Error('No CoachPersona rows found in database. Run prisma/seed-coach-personas.ts.')
}
