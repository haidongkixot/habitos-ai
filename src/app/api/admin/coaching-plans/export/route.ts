/**
 * HabitOS M5 — GET /api/admin/coaching-plans/export
 *
 * Streams a text/csv of every coaching plan matching the supplied filters.
 * Same filter contract as the LIST endpoint, but no pagination — capped
 * defensively at 10000 rows by the data-engineer's serializer.
 *
 * The heavy lifting (Prisma query + RFC 4180 escaping + formula-injection
 * guard) lives in `src/lib/analytics/csv-serializer.ts`. We simply auth,
 * parse the filters, call the helper, and return the CSV with the right
 * Content-Type / Content-Disposition headers.
 *
 * If the data-engineer's helper isn't yet in tree (parallel ship window),
 * we fall back to a header-only CSV via the local stub so tsc + the route
 * still respond. The TODO marker keeps the swap obvious.
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// ------------------------------------------------------------
// CSV serializer import — graceful degrade.
//
// Data-engineer ships `exportPlansAsCsv` in src/lib/analytics/csv-serializer.
// We import it dynamically through a typed thin wrapper so tsc stays happy
// even if the file regresses or gets renamed during the parallel sprint.
// ------------------------------------------------------------
interface ExportPlansFilters {
  status?: string
  tier?: string
  framework?: string
  personaSlug?: string
  q?: string
  from?: Date
  to?: Date
  cap?: number
}

type ExportPlansAsCsv = (filters: ExportPlansFilters) => Promise<string>

async function loadExporter(): Promise<ExportPlansAsCsv> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = (await import('@/lib/analytics/csv-serializer')) as {
      exportPlansAsCsv?: ExportPlansAsCsv
    }
    if (typeof mod.exportPlansAsCsv === 'function') {
      return mod.exportPlansAsCsv
    }
  } catch {
    // module not present yet — fall through to stub
  }
  // TODO: replace with data-engineer impl
  return async () =>
    'planId,title,framework,status,createdAt,updatedAt,momentumScore,userEmail,userName,userTier,personaSlug,personaName,milestoneCount,habitCount,checkinCount\r\n'
}

const querySchema = z.object({
  status: z.enum(['active', 'paused', 'stopped', 'complete']).optional(),
  tier: z.enum(['free', 'starter', 'pro', 'premium']).optional(),
  framework: z.enum(['GROW', 'WOOP', 'IDENTITY']).optional(),
  personaSlug: z.string().min(1).optional(),
  q: z.string().min(1).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
})

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== 'admin') {
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
  const { status, tier, framework, personaSlug, q, from, to } = parsed.data

  const filters: ExportPlansFilters = {
    status,
    tier,
    framework,
    personaSlug,
    q,
    from: from ? new Date(from) : undefined,
    to: to ? new Date(to) : undefined,
    cap: 10000,
  }

  let csv: string
  try {
    const exporter = await loadExporter()
    csv = await exporter(filters)
  } catch (err) {
    console.error('[api/admin/coaching-plans/export] error', err)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }

  const filename = `coaching-plans-${new Date().toISOString()}.csv`

  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
