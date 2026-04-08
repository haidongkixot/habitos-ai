/**
 * HabitOS M5 — CSV serializer for coaching plan exports.
 *
 * Pure library: backend admin route imports exportPlansAsCsv() and streams
 * the result with the right Content-Type. No HTTP, no auth here.
 *
 * RFC 4180 conformance:
 *  - CRLF line endings (`\r\n`).
 *  - Header row first.
 *  - Fields containing comma, double-quote, CR, or LF are wrapped in
 *    double quotes; inner double-quotes are doubled (`"` → `""`).
 *  - Spreadsheet formula injection guard: any field whose first character
 *    is `=`, `+`, `-`, or `@` is prefixed with a single quote (`'`).
 *    See OWASP CSV Injection cheat sheet.
 *  - Empty input -> just the header row + CRLF.
 */

import { prisma } from '@/lib/prisma'

const db = prisma as any

export interface PlanCsvRow {
  planId: string
  title: string
  framework: string
  status: string
  createdAt: string // ISO
  updatedAt: string // ISO
  momentumScore: number
  userEmail: string
  userName: string
  userTier: string
  personaSlug: string
  personaName: string
  milestoneCount: number
  habitCount: number
  checkinCount: number
}

const CSV_HEADER: Array<keyof PlanCsvRow> = [
  'planId',
  'title',
  'framework',
  'status',
  'createdAt',
  'updatedAt',
  'momentumScore',
  'userEmail',
  'userName',
  'userTier',
  'personaSlug',
  'personaName',
  'milestoneCount',
  'habitCount',
  'checkinCount',
]

const FORMULA_TRIGGERS = new Set(['=', '+', '-', '@'])
const QUOTE_TRIGGERS = /[",\r\n]/

/**
 * Escape a single field per RFC 4180 + OWASP formula-injection guard.
 * Always coerces to string. `null`/`undefined` become an empty string.
 */
function escapeField(value: unknown): string {
  if (value === null || value === undefined) return ''
  let s = typeof value === 'string' ? value : String(value)

  // Formula injection guard — neutralize cells starting with =,+,-,@
  if (s.length > 0 && FORMULA_TRIGGERS.has(s[0])) {
    s = `'${s}`
  }

  if (QUOTE_TRIGGERS.test(s)) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function rowToCsvLine(row: PlanCsvRow): string {
  return CSV_HEADER.map((key) => escapeField(row[key])).join(',')
}

/**
 * Serializes plan rows to RFC 4180 CSV.
 * Always emits the header row, even on an empty array.
 */
export function serializePlansToCsv(rows: PlanCsvRow[]): string {
  const lines: string[] = []
  lines.push(CSV_HEADER.join(','))
  for (const row of rows) {
    lines.push(rowToCsvLine(row))
  }
  return lines.join('\r\n') + '\r\n'
}

export interface ExportPlansFilters {
  status?: string
  tier?: string
  framework?: string
  personaSlug?: string
  q?: string
  from?: Date
  to?: Date
  /** Defaults to 10000. Hard cap to keep memory bounded. */
  cap?: number
}

interface PlanExportRow {
  id: string
  title: string | null
  framework: string | null
  status: string | null
  createdAt: Date
  updatedAt: Date
  momentumScore: number | null
  user: {
    email: string | null
    name: string | null
    subscriptions: Array<{ plan: { slug: string | null } | null }>
  } | null
  _count?: {
    milestones?: number
    planHabits?: number
    checkins?: number
  }
}

/**
 * Convenience helper used by the admin LIST CSV export endpoint. Applies
 * the same filter semantics as the admin LIST endpoint so the CSV always
 * matches what the admin sees on screen.
 */
export async function exportPlansAsCsv(
  filters: ExportPlansFilters
): Promise<string> {
  const cap = filters.cap ?? 10000

  const where: Record<string, unknown> = {}

  if (filters.status) where.status = filters.status
  if (filters.framework) where.framework = filters.framework

  if (filters.from || filters.to) {
    const range: Record<string, Date> = {}
    if (filters.from) range.gte = filters.from
    if (filters.to) range.lte = filters.to
    where.createdAt = range
  }

  // Free-text search across plan title and the owning user's name/email.
  if (filters.q && filters.q.trim().length > 0) {
    const q = filters.q.trim()
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { user: { is: { name: { contains: q, mode: 'insensitive' } } } },
      { user: { is: { email: { contains: q, mode: 'insensitive' } } } },
    ]
  }

  // Tier filter joins via the user's active subscription -> Plan.slug
  if (filters.tier) {
    where.user = {
      ...((where.user as Record<string, unknown>) ?? {}),
      subscriptions: {
        some: {
          status: 'active',
          plan: { slug: filters.tier },
        },
      },
    }
  }

  // Persona filter — only plans that have at least one CoachingSession
  // logged with the matching persona slug. Reuses the same join the LIST
  // endpoint does. We need the persona id from slug first.
  let personaIdForFilter: string | null = null
  if (filters.personaSlug) {
    const persona = await db.coachPersona
      .findUnique({
        where: { slug: filters.personaSlug },
        select: { id: true },
      })
      .catch(() => null)
    personaIdForFilter = persona?.id ?? null
    if (personaIdForFilter) {
      where.sessions = {
        some: { personaId: personaIdForFilter },
      }
    } else {
      // Unknown persona slug — short-circuit to an empty result so the
      // CSV header row is still emitted.
      return serializePlansToCsv([])
    }
  }

  let plans: PlanExportRow[] = []
  try {
    plans = await db.coachingPlan.findMany({
      where,
      take: cap,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        framework: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        momentumScore: true,
        user: {
          select: {
            email: true,
            name: true,
            subscriptions: {
              where: { status: 'active' },
              select: { plan: { select: { slug: true } } },
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
        _count: {
          select: {
            milestones: true,
            planHabits: true,
            checkins: true,
          },
        },
      },
    })
  } catch (err) {
    // Defensive: log + return header-only CSV instead of crashing the route.
    console.error('[analytics/csv-serializer] export query failed', err)
    return serializePlansToCsv([])
  }

  // Resolve persona slug/name per plan via a single CoachingSession
  // group lookup so we don't N+1 the export.
  const planIds = plans.map((p) => p.id)
  const personaByPlan = new Map<string, { slug: string; name: string }>()

  if (planIds.length > 0) {
    try {
      const sessions: Array<{ planId: string | null; personaId: string | null }> =
        await db.coachingSession.findMany({
          where: { planId: { in: planIds }, personaId: { not: null } },
          select: { planId: true, personaId: true },
          orderBy: { createdAt: 'asc' },
        })

      const firstPersonaIdByPlan = new Map<string, string>()
      for (const s of sessions) {
        if (s.planId && s.personaId && !firstPersonaIdByPlan.has(s.planId)) {
          firstPersonaIdByPlan.set(s.planId, s.personaId)
        }
      }

      const personaIdValues: string[] = []
      firstPersonaIdByPlan.forEach((id) => personaIdValues.push(id))
      const personaIds = Array.from(new Set(personaIdValues))
      if (personaIds.length > 0) {
        const personas: Array<{ id: string; slug: string; name: string }> =
          await db.coachPersona.findMany({
            where: { id: { in: personaIds } },
            select: { id: true, slug: true, name: true },
          })
        const personaIndex = new Map<
          string,
          { id: string; slug: string; name: string }
        >()
        personas.forEach((p) => personaIndex.set(p.id, p))
        firstPersonaIdByPlan.forEach((personaId, planId) => {
          const meta = personaIndex.get(personaId)
          if (meta) {
            personaByPlan.set(planId, { slug: meta.slug, name: meta.name })
          }
        })
      }
    } catch (err) {
      // Persona lookup is best-effort — leave columns empty on failure.
      console.error('[analytics/csv-serializer] persona lookup failed', err)
    }
  }

  const rows: PlanCsvRow[] = plans.map((p) => {
    const tierSlug = p.user?.subscriptions?.[0]?.plan?.slug ?? 'free'
    const persona = personaByPlan.get(p.id)
    return {
      planId: p.id,
      title: p.title ?? '',
      framework: p.framework ?? '',
      status: p.status ?? '',
      createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : '',
      updatedAt: p.updatedAt ? new Date(p.updatedAt).toISOString() : '',
      momentumScore: Number(p.momentumScore ?? 0),
      userEmail: p.user?.email ?? '',
      userName: p.user?.name ?? '',
      userTier: tierSlug,
      personaSlug: persona?.slug ?? '',
      personaName: persona?.name ?? '',
      milestoneCount: Number(p._count?.milestones ?? 0),
      habitCount: Number(p._count?.planHabits ?? 0),
      checkinCount: Number(p._count?.checkins ?? 0),
    }
  })

  return serializePlansToCsv(rows)
}
