/**
 * HabitOS M5 — /api/admin/coaching-plans (LIST)
 *
 * Admin-only paginated + filtered listing of every user's coaching plans.
 * The frontend admin console (/admin/coaching-plans) calls this with the
 * filters defined in the M5 contract.
 *
 * Query params:
 *  - status        active | paused | stopped | complete
 *  - tier          plan slug (free | starter | pro | premium)
 *  - framework     GROW | WOOP | IDENTITY
 *  - personaSlug   coach persona slug
 *  - q             search across user.email / user.name / plan.title
 *  - from, to      ISO date range (createdAt)
 *  - page          default 1
 *  - pageSize      default 25, max 100
 *  - sort          createdAt | updatedAt | momentumScore (default createdAt)
 *  - dir           asc | desc (default desc)
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getUserPlanSlug } from '@/lib/academy/access'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const querySchema = z.object({
  status: z.enum(['active', 'paused', 'stopped', 'complete']).optional(),
  tier: z.enum(['free', 'starter', 'pro', 'premium']).optional(),
  framework: z.enum(['GROW', 'WOOP', 'IDENTITY']).optional(),
  personaSlug: z.string().min(1).optional(),
  q: z.string().min(1).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  sort: z.enum(['createdAt', 'updatedAt', 'momentumScore']).default('createdAt'),
  dir: z.enum(['asc', 'desc']).default('desc'),
})

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== 'admin') {
    return null
  }
  return session
}

export async function GET(req: Request) {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(req.url)
  const rawQuery: Record<string, string> = {}
  url.searchParams.forEach((value, key) => {
    if (value !== '') rawQuery[key] = value
  })

  const parsed = querySchema.safeParse(rawQuery)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid query', issues: parsed.error.flatten() },
      { status: 400 }
    )
  }
  const {
    status,
    tier,
    framework,
    personaSlug,
    q,
    from,
    to,
    page,
    pageSize,
    sort,
    dir,
  } = parsed.data

  // ------------------------------------------------------------
  // Step 1 — resolve persona id from slug (if filter provided)
  // ------------------------------------------------------------
  let personaIdFilter: string | undefined
  if (personaSlug) {
    const persona = await (prisma as any).coachPersona.findUnique({
      where: { slug: personaSlug },
      select: { id: true },
    })
    if (!persona) {
      return NextResponse.json(
        {
          plans: [],
          total: 0,
          page,
          pageSize,
        },
        { status: 200 }
      )
    }
    personaIdFilter = persona.id
  }

  // ------------------------------------------------------------
  // Step 2 — resolve user ids matching the tier filter (if any).
  //  Tier lives on Subscription.plan.slug — not on the plan itself,
  //  so we filter the user set first.
  // ------------------------------------------------------------
  let userIdsInTier: string[] | undefined // include set
  let userIdsToExclude: string[] | undefined // exclude set (for "free")
  if (tier) {
    if (tier === 'free') {
      // "free" = users without any active paid subscription. Resolve all
      // paid user ids and apply NOT IN below.
      const paidSubs = await (prisma as any).subscription.findMany({
        where: {
          status: 'active',
          plan: { slug: { in: ['starter', 'pro', 'premium'] } },
        },
        select: { userId: true },
      })
      userIdsToExclude = Array.from(
        new Set<string>(paidSubs.map((s: any) => s.userId))
      )
    } else {
      const subs = await (prisma as any).subscription.findMany({
        where: { status: 'active', plan: { slug: tier } },
        select: { userId: true },
      })
      userIdsInTier = Array.from(new Set<string>(subs.map((s: any) => s.userId)))
      if (userIdsInTier.length === 0) {
        return NextResponse.json(
          { plans: [], total: 0, page, pageSize },
          { status: 200 }
        )
      }
    }
  }

  // ------------------------------------------------------------
  // Step 3 — build the where clause
  // ------------------------------------------------------------
  const where: Record<string, any> = {}
  if (status) where.status = status
  if (framework) where.framework = framework
  if (from || to) {
    where.createdAt = {}
    if (from) where.createdAt.gte = new Date(from)
    if (to) where.createdAt.lte = new Date(to)
  }
  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { user: { email: { contains: q, mode: 'insensitive' } } },
      { user: { name: { contains: q, mode: 'insensitive' } } },
    ]
  }
  if (tier) {
    if (tier === 'free' && userIdsToExclude && userIdsToExclude.length > 0) {
      where.userId = { notIn: userIdsToExclude }
    } else if (userIdsInTier) {
      where.userId = { in: userIdsInTier }
    }
  }

  // We do NOT have a direct CoachingPlan -> CoachPersona relation in the
  // schema. Persona linkage flows through UserCoachSettings (per user).
  // To honour personaSlug filters, resolve the user ids first and intersect.
  if (personaIdFilter) {
    const settings = await (prisma as any).userCoachSettings.findMany({
      where: { personaId: personaIdFilter },
      select: { userId: true },
    })
    const settingsUserIds: string[] = settings.map((s: any) => s.userId)
    if (settingsUserIds.length === 0) {
      return NextResponse.json(
        { plans: [], total: 0, page, pageSize },
        { status: 200 }
      )
    }
    const existing: any = where.userId
    if (existing?.in) {
      const intersected = (existing.in as string[]).filter((id) =>
        settingsUserIds.includes(id)
      )
      if (intersected.length === 0) {
        return NextResponse.json(
          { plans: [], total: 0, page, pageSize },
          { status: 200 }
        )
      }
      where.userId = { in: intersected }
    } else if (existing?.notIn) {
      const allowed = settingsUserIds.filter(
        (id) => !(existing.notIn as string[]).includes(id)
      )
      if (allowed.length === 0) {
        return NextResponse.json(
          { plans: [], total: 0, page, pageSize },
          { status: 200 }
        )
      }
      where.userId = { in: allowed }
    } else {
      where.userId = { in: settingsUserIds }
    }
  }

  // ------------------------------------------------------------
  // Step 4 — query
  // ------------------------------------------------------------
  try {
    const skip = (page - 1) * pageSize

    const [rows, total] = await Promise.all([
      (prisma as any).coachingPlan.findMany({
        where,
        orderBy: { [sort]: dir },
        skip,
        take: pageSize,
        select: {
          id: true,
          title: true,
          framework: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          momentumScore: true,
          userId: true,
          user: {
            select: { id: true, email: true, name: true },
          },
          _count: {
            select: { milestones: true, planHabits: true, checkins: true },
          },
        },
      }),
      (prisma as any).coachingPlan.count({ where }),
    ])

    // ------------------------------------------------------------
    // Step 5 — enrich each plan with persona + tierSlug for the user.
    //  Batch lookups to avoid an N+1 storm.
    // ------------------------------------------------------------
    const userIds = Array.from(
      new Set(rows.map((r: any) => r.userId).filter(Boolean))
    ) as string[]

    const [settingsRows, subRows] = await Promise.all([
      userIds.length
        ? (prisma as any).userCoachSettings.findMany({
            where: { userId: { in: userIds } },
            select: { userId: true, personaId: true },
          })
        : Promise.resolve([] as Array<{ userId: string; personaId: string | null }>),
      userIds.length
        ? (prisma as any).subscription.findMany({
            where: { userId: { in: userIds }, status: 'active' },
            select: {
              userId: true,
              createdAt: true,
              plan: { select: { slug: true } },
            },
            orderBy: { createdAt: 'desc' },
          })
        : Promise.resolve(
            [] as Array<{
              userId: string
              createdAt: Date
              plan: { slug: string } | null
            }>
          ),
    ])

    const personaIdsToFetch = Array.from(
      new Set(
        settingsRows
          .map((s: any) => s.personaId)
          .filter((id: string | null): id is string => !!id)
      )
    )
    const personaRows = personaIdsToFetch.length
      ? await (prisma as any).coachPersona.findMany({
          where: { id: { in: personaIdsToFetch } },
          select: { id: true, slug: true, name: true },
        })
      : []

    const personaById = new Map<string, { slug: string; name: string }>()
    for (const p of personaRows) {
      personaById.set(p.id, { slug: p.slug, name: p.name })
    }

    const personaByUser = new Map<string, { slug: string; name: string } | null>()
    for (const s of settingsRows) {
      personaByUser.set(s.userId, s.personaId ? personaById.get(s.personaId) ?? null : null)
    }

    const tierByUser = new Map<string, string>()
    for (const sub of subRows) {
      if (!tierByUser.has(sub.userId) && sub.plan?.slug) {
        tierByUser.set(sub.userId, sub.plan.slug)
      }
    }

    const plans = rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      framework: row.framework,
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      momentumScore: row.momentumScore,
      user: {
        id: row.user?.id ?? row.userId,
        email: row.user?.email ?? '',
        name: row.user?.name ?? null,
        tierSlug: tierByUser.get(row.userId) ?? 'free',
      },
      persona: personaByUser.get(row.userId) ?? null,
      milestoneCount: row._count?.milestones ?? 0,
      habitCount: row._count?.planHabits ?? 0,
      checkinCount: row._count?.checkins ?? 0,
    }))

    return NextResponse.json({ plans, total, page, pageSize })
  } catch (err) {
    console.error('[api/admin/coaching-plans GET] error', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// Avoid an unused-import lint hit if getUserPlanSlug ever gets removed —
// retained for parity with M2 + future per-row lookups.
void getUserPlanSlug
