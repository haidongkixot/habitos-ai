'use client'

/**
 * HabitOS M5 — Coaching plans list client.
 *
 * - Fetches from GET /api/admin/coaching-plans with query filters.
 * - Supports search + status/framework/tier/persona filters + date range.
 * - Pagination (prev/next + total badge).
 * - CSV export: opens /api/admin/coaching-plans/export?<filters> via
 *   window.location.assign — backend returns Content-Disposition so the
 *   browser handles the download.
 * - Graceful error card with retry.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import PlanFilters, {
  EMPTY_FILTERS,
  type PlanFiltersState,
} from '@/components/admin/coaching-plans/plan-filters'
import PlanStatusBadge from '@/components/admin/coaching-plans/plan-status-badge'

// -------- Backend contract types (list endpoint) --------
interface ApiUser {
  id: string
  email: string
  name: string | null
  tierSlug: string
}

interface ApiPersona {
  slug: string
  name: string
}

interface ApiPlanSummary {
  id: string
  title: string
  framework: 'GROW' | 'WOOP' | 'IDENTITY'
  status: 'active' | 'paused' | 'stopped' | 'complete'
  createdAt: string
  updatedAt: string
  momentumScore: number
  user: ApiUser
  persona: ApiPersona | null
  milestoneCount: number
  habitCount: number
  checkinCount: number
}

interface ApiListResponse {
  plans: ApiPlanSummary[]
  total: number
  page: number
  pageSize: number
}

// ------------------------------------------------------

const PAGE_SIZE = 25

function buildQueryString(
  filters: PlanFiltersState,
  page: number,
  pageSize: number
): string {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.status) params.set('status', filters.status)
  if (filters.framework) params.set('framework', filters.framework)
  if (filters.tier) params.set('tier', filters.tier)
  if (filters.personaSlug) params.set('personaSlug', filters.personaSlug)
  if (filters.from) params.set('from', filters.from)
  if (filters.to) params.set('to', filters.to)
  params.set('page', String(page))
  params.set('pageSize', String(pageSize))
  return params.toString()
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString()
  } catch {
    return '—'
  }
}

function LoadingRow() {
  return (
    <tr>
      <td colSpan={8} className="px-6 py-10 text-center text-gray-500">
        <div className="inline-flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          Loading coaching plans...
        </div>
      </td>
    </tr>
  )
}

export default function CoachingPlansClient() {
  const [filters, setFilters] = useState<PlanFiltersState>(EMPTY_FILTERS)
  const [page, setPage] = useState(1)
  const [data, setData] = useState<ApiListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const query = useMemo(
    () => buildQueryString(filters, page, PAGE_SIZE),
    [filters, page]
  )

  const fetchPlans = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/coaching-plans?${query}`, {
        cache: 'no-store',
      })
      if (!res.ok) {
        throw new Error(`Request failed (${res.status})`)
      }
      const json = (await res.json()) as ApiListResponse
      setData({
        plans: Array.isArray(json.plans) ? json.plans : [],
        total: typeof json.total === 'number' ? json.total : 0,
        page: typeof json.page === 'number' ? json.page : 1,
        pageSize:
          typeof json.pageSize === 'number' ? json.pageSize : PAGE_SIZE,
      })
    } catch (err) {
      setData(null)
      setError(
        err instanceof Error ? err.message : 'Failed to load coaching plans'
      )
    } finally {
      setLoading(false)
    }
  }, [query])

  useEffect(() => {
    fetchPlans()
  }, [fetchPlans])

  // Reset to page 1 whenever filters change.
  useEffect(() => {
    setPage(1)
  }, [
    filters.q,
    filters.status,
    filters.framework,
    filters.tier,
    filters.personaSlug,
    filters.from,
    filters.to,
  ])

  const handleExport = () => {
    const exportQuery = buildQueryString(filters, 1, PAGE_SIZE)
    // Use GET so the browser handles Content-Disposition download.
    window.location.assign(`/api/admin/coaching-plans/export?${exportQuery}`)
  }

  const total = data?.total ?? 0
  const totalPages = total > 0 ? Math.ceil(total / PAGE_SIZE) : 1
  const canPrev = page > 1
  const canNext = page < totalPages

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Coaching Plans</h1>
          <p className="text-gray-400 text-sm mt-1">
            Manage every user coaching plan in one place
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-800 border border-gray-700 text-xs font-medium text-gray-300">
            <span className="text-emerald-400 font-semibold">{total}</span>
            total plan{total === 1 ? '' : 's'}
          </span>
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 text-sm font-semibold transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <PlanFilters
        value={filters}
        onChange={setFilters}
        onReset={() => setFilters(EMPTY_FILTERS)}
      />

      {/* Error card */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 mb-4 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-rose-300">
              Failed to load plans
            </div>
            <div className="text-xs text-rose-400/80 mt-0.5">{error}</div>
          </div>
          <button
            type="button"
            onClick={fetchPlans}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Framework
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Tier
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Momentum
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Counts
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Updated
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading ? (
                <LoadingRow />
              ) : !data || data.plans.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    <div className="font-medium text-gray-400 mb-1">
                      No coaching plans found
                    </div>
                    <div className="text-xs">
                      Try adjusting or resetting your filters.
                    </div>
                  </td>
                </tr>
              ) : (
                data.plans.map((plan) => (
                  <tr
                    key={plan.id}
                    className="hover:bg-gray-800/40 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/coaching-plans/${plan.id}`}
                        className="text-white font-medium hover:text-emerald-400 transition-colors"
                      >
                        {plan.title || 'Untitled plan'}
                      </Link>
                      {plan.persona && (
                        <div className="text-xs text-gray-500 mt-0.5">
                          Coach: {plan.persona.name}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-200 text-sm">
                        {plan.user.name || '—'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {plan.user.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-800 text-xs font-medium">
                        {plan.framework}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <PlanStatusBadge status={plan.status} />
                    </td>
                    <td className="px-6 py-4 text-gray-400 capitalize">
                      {plan.user.tierSlug || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 transition-all"
                            style={{
                              width: `${Math.min(
                                100,
                                Math.max(0, plan.momentumScore || 0)
                              )}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs text-gray-400 w-9">
                          {Math.round(plan.momentumScore || 0)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-400">
                      <div>{plan.milestoneCount} milestones</div>
                      <div>{plan.habitCount} habits</div>
                      <div>{plan.checkinCount} check-ins</div>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-400">
                      {formatDate(plan.updatedAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <div className="text-xs text-gray-500">
          Page {page} of {totalPages}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!canPrev || loading}
            onClick={() => canPrev && setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={!canNext || loading}
            onClick={() => canNext && setPage((p) => p + 1)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
