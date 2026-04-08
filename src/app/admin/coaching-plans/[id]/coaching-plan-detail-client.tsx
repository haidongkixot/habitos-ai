'use client'

/**
 * HabitOS M5 — Coaching plan detail client.
 *
 * Tabs: Overview | Milestones | Habits | Check-ins | Audit Log
 * Wires inline edit, action menu (pause/resume/stop/delete), and
 * audit-log fetch. Uses graceful-degrade error cards w/ retry.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import PlanStatusBadge from '@/components/admin/coaching-plans/plan-status-badge'
import PlanActionMenu, {
  type PlanAction,
} from '@/components/admin/coaching-plans/plan-action-menu'
import EditPlanForm from './edit-plan-form'

// -------- Backend contract types --------

interface ApiUser {
  id: string
  email: string
  name: string | null
  tierSlug?: string
}

interface ApiPersona {
  slug: string
  name: string
}

interface ApiGoal {
  id: string
  title?: string | null
  description?: string | null
}

interface ApiMilestone {
  id: string
  title: string
  description?: string | null
  dueDate?: string | null
  status?: string | null
  orderIndex?: number | null
  completedAt?: string | null
}

interface ApiHabit {
  id: string
  name: string
  cue?: string | null
  routine?: string | null
  reward?: string | null
  frequency?: string | null
  category?: string | null
  isActive?: boolean | null
}

interface ApiCheckin {
  id: string
  createdAt: string
  content?: unknown
  mood?: number | null
  note?: string | null
}

interface ApiPlanDetail {
  id: string
  title: string
  summary: string | null
  notes: string | null
  framework: 'GROW' | 'WOOP' | 'IDENTITY'
  status: 'active' | 'paused' | 'stopped' | 'complete'
  createdAt: string
  updatedAt: string
  momentumScore: number
  user: ApiUser
  persona: ApiPersona | null
  goal: ApiGoal | null
  milestones: ApiMilestone[]
  habits: ApiHabit[]
  recentCheckins: ApiCheckin[]
}

interface ApiAuditActor {
  id: string
  email: string
  name: string | null
}

interface ApiAuditEntry {
  id: string
  action: string
  before: unknown
  after: unknown
  reason: string | null
  createdAt: string
  actor: ApiAuditActor | null
}

interface ApiAuditResponse {
  entries: ApiAuditEntry[]
  nextCursor: string | null
}

// ----------------------------------------

const TABS = ['overview', 'milestones', 'habits', 'checkins', 'audit'] as const
type Tab = (typeof TABS)[number]

const TAB_LABELS: Record<Tab, string> = {
  overview: 'Overview',
  milestones: 'Milestones',
  habits: 'Habits',
  checkins: 'Check-ins',
  audit: 'Audit Log',
}

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString()
  } catch {
    return iso
  }
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-gray-500 text-sm">
      <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      {label || 'Loading...'}
    </div>
  )
}

function ErrorCard({
  message,
  onRetry,
}: {
  message: string
  onRetry: () => void
}) {
  return (
    <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 flex items-center justify-between">
      <div>
        <div className="text-sm font-semibold text-rose-300">
          Something went wrong
        </div>
        <div className="text-xs text-rose-400/80 mt-0.5">{message}</div>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 transition-colors"
      >
        Retry
      </button>
    </div>
  )
}

export default function CoachingPlanDetailClient({
  planId,
}: {
  planId: string
}) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('overview')
  const [plan, setPlan] = useState<ApiPlanDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const fetchPlan = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/coaching-plans/${planId}`, {
        cache: 'no-store',
      })
      if (!res.ok) {
        throw new Error(`Request failed (${res.status})`)
      }
      const json = (await res.json()) as ApiPlanDetail | { plan: ApiPlanDetail }
      // Accept both `{...fields}` and `{ plan: {...} }` envelope shapes.
      const nextPlan: ApiPlanDetail =
        (json as { plan?: ApiPlanDetail }).plan ?? (json as ApiPlanDetail)
      setPlan({
        ...nextPlan,
        milestones: Array.isArray(nextPlan.milestones)
          ? nextPlan.milestones
          : [],
        habits: Array.isArray(nextPlan.habits) ? nextPlan.habits : [],
        recentCheckins: Array.isArray(nextPlan.recentCheckins)
          ? nextPlan.recentCheckins
          : [],
      })
    } catch (err) {
      setPlan(null)
      setError(err instanceof Error ? err.message : 'Failed to load plan')
    } finally {
      setLoading(false)
    }
  }, [planId])

  useEffect(() => {
    fetchPlan()
  }, [fetchPlan])

  const handleAction = async (action: PlanAction, reason: string) => {
    setActionError(null)
    try {
      if (action === 'delete') {
        const res = await fetch(`/api/admin/coaching-plans/${planId}`, {
          method: 'DELETE',
        })
        if (!res.ok) throw new Error(`Delete failed (${res.status})`)
        router.push('/admin/coaching-plans')
        return
      }
      const res = await fetch(
        `/api/admin/coaching-plans/${planId}/${action}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason }),
        }
      )
      if (!res.ok) throw new Error(`Action failed (${res.status})`)
      await fetchPlan()
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : `${action} failed`
      )
    }
  }

  const handleFormSaved = (updated: {
    title: string
    summary: string | null
    notes: string | null
  }) => {
    setPlan((prev) =>
      prev
        ? {
            ...prev,
            title: updated.title,
            summary: updated.summary,
            notes: updated.notes,
          }
        : prev
    )
  }

  if (loading) {
    return (
      <div className="p-8">
        <Spinner label="Loading coaching plan..." />
      </div>
    )
  }

  if (error || !plan) {
    return (
      <div className="p-8">
        <div className="mb-4">
          <Link
            href="/admin/coaching-plans"
            className="text-xs text-gray-500 hover:text-gray-300"
          >
            ← Back to Coaching Plans
          </Link>
        </div>
        <ErrorCard
          message={error || 'Plan not found'}
          onRetry={fetchPlan}
        />
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin/coaching-plans"
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors mb-3 inline-flex items-center gap-1"
        >
          ← Back to Coaching Plans
        </Link>
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mt-2">
          <div className="flex items-start gap-4 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-lg font-bold flex-shrink-0">
              {(plan.title || '?')[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-white truncate">
                  {plan.title || 'Untitled plan'}
                </h1>
                <PlanStatusBadge status={plan.status} />
                <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-800 text-xs font-medium text-gray-300">
                  {plan.framework}
                </span>
              </div>
              <div className="text-sm text-gray-400 mt-1 truncate">
                {plan.user.name || '—'}{' '}
                <span className="text-gray-600">·</span>{' '}
                <span className="text-gray-500">{plan.user.email}</span>
                {plan.user.tierSlug && (
                  <>
                    {' '}
                    <span className="text-gray-600">·</span>{' '}
                    <span className="capitalize">{plan.user.tierSlug}</span>
                  </>
                )}
              </div>
              {plan.persona && (
                <div className="text-xs text-gray-500 mt-0.5">
                  Coach: {plan.persona.name} ({plan.persona.slug})
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs text-gray-500">Momentum</div>
              <div className="text-2xl font-bold text-emerald-400">
                {Math.round(plan.momentumScore || 0)}
              </div>
            </div>
            <PlanActionMenu status={plan.status} onAction={handleAction} />
          </div>
        </div>

        {actionError && (
          <div className="mt-4 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2">
            {actionError}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-800 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px whitespace-nowrap ${
              tab === t
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {/* Tab body */}
      {tab === 'overview' && (
        <OverviewTab plan={plan} onSaved={handleFormSaved} />
      )}
      {tab === 'milestones' && <MilestonesTab milestones={plan.milestones} />}
      {tab === 'habits' && <HabitsTab habits={plan.habits} />}
      {tab === 'checkins' && <CheckinsTab checkins={plan.recentCheckins} />}
      {tab === 'audit' && <AuditTab planId={plan.id} />}
    </div>
  )
}

// -------- Tab components --------

function OverviewTab({
  plan,
  onSaved,
}: {
  plan: ApiPlanDetail
  onSaved: (updated: {
    title: string
    summary: string | null
    notes: string | null
  }) => void
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-2">Summary</h3>
          <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
            {plan.summary || (
              <span className="text-gray-500 italic">
                No summary provided.
              </span>
            )}
          </p>
        </div>

        {plan.goal && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-2">Goal</h3>
            <div className="text-sm text-gray-300">
              {plan.goal.title || '—'}
            </div>
            {plan.goal.description && (
              <div className="text-xs text-gray-500 mt-1">
                {plan.goal.description}
              </div>
            )}
          </div>
        )}

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-3">Metadata</h3>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            <dt className="text-gray-500">Created</dt>
            <dd className="text-gray-300">{formatDateTime(plan.createdAt)}</dd>
            <dt className="text-gray-500">Updated</dt>
            <dd className="text-gray-300">{formatDateTime(plan.updatedAt)}</dd>
            <dt className="text-gray-500">Framework</dt>
            <dd className="text-gray-300">{plan.framework}</dd>
            <dt className="text-gray-500">Status</dt>
            <dd className="text-gray-300 capitalize">{plan.status}</dd>
            <dt className="text-gray-500">Milestones</dt>
            <dd className="text-gray-300">{plan.milestones.length}</dd>
            <dt className="text-gray-500">Habits</dt>
            <dd className="text-gray-300">{plan.habits.length}</dd>
          </dl>
        </div>
      </div>

      <div className="lg:col-span-1">
        <EditPlanForm
          plan={{
            id: plan.id,
            title: plan.title,
            summary: plan.summary,
            notes: plan.notes,
          }}
          onSaved={onSaved}
        />
      </div>
    </div>
  )
}

function MilestonesTab({ milestones }: { milestones: ApiMilestone[] }) {
  if (milestones.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-10 text-center text-gray-500 text-sm">
        No milestones for this plan yet.
      </div>
    )
  }
  const sorted = [...milestones].sort(
    (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)
  )
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                #
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Due
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Completed
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {sorted.map((milestone, idx) => (
              <tr
                key={milestone.id}
                className="hover:bg-gray-800/40 transition-colors"
              >
                <td className="px-6 py-4 text-gray-500 text-xs">
                  {milestone.orderIndex ?? idx + 1}
                </td>
                <td className="px-6 py-4">
                  <div className="text-white font-medium">
                    {milestone.title}
                  </div>
                  {milestone.description && (
                    <div className="text-xs text-gray-500 mt-0.5">
                      {milestone.description}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 text-gray-400">
                  {formatDate(milestone.dueDate)}
                </td>
                <td className="px-6 py-4 text-gray-300 capitalize">
                  {milestone.status || '—'}
                </td>
                <td className="px-6 py-4 text-gray-400">
                  {formatDate(milestone.completedAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function HabitsTab({ habits }: { habits: ApiHabit[] }) {
  if (habits.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-10 text-center text-gray-500 text-sm">
        No habits for this plan yet.
      </div>
    )
  }
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Habit
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Cue
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Routine
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Reward
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Frequency
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {habits.map((habit) => (
              <tr
                key={habit.id}
                className="hover:bg-gray-800/40 transition-colors"
              >
                <td className="px-6 py-4 text-white font-medium">
                  {habit.name}
                </td>
                <td className="px-6 py-4 text-gray-400">{habit.cue || '—'}</td>
                <td className="px-6 py-4 text-gray-400">
                  {habit.routine || '—'}
                </td>
                <td className="px-6 py-4 text-gray-400">
                  {habit.reward || '—'}
                </td>
                <td className="px-6 py-4 text-gray-400 capitalize">
                  {habit.frequency || '—'}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      habit.isActive
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-gray-700 text-gray-400'
                    }`}
                  >
                    {habit.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function CheckinsTab({ checkins }: { checkins: ApiCheckin[] }) {
  if (checkins.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-10 text-center text-gray-500 text-sm">
        No recent check-ins.
      </div>
    )
  }
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                When
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Mood
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Content
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {checkins.map((c) => (
              <tr key={c.id} className="hover:bg-gray-800/40 transition-colors">
                <td className="px-6 py-4 text-gray-300 whitespace-nowrap">
                  {formatDateTime(c.createdAt)}
                </td>
                <td className="px-6 py-4 text-gray-400">
                  {typeof c.mood === 'number' ? c.mood : '—'}
                </td>
                <td className="px-6 py-4 text-gray-300">
                  {c.note ? (
                    <div className="text-xs text-gray-400">{c.note}</div>
                  ) : null}
                  {c.content !== undefined && c.content !== null && (
                    <details className="text-xs text-gray-500 mt-1">
                      <summary className="cursor-pointer hover:text-gray-300">
                        View payload
                      </summary>
                      <pre className="mt-2 bg-gray-950 border border-gray-800 rounded-lg p-3 overflow-x-auto text-[11px] leading-snug">
                        {safeStringify(c.content)}
                      </pre>
                    </details>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function AuditTab({ planId }: { planId: string }) {
  const [entries, setEntries] = useState<ApiAuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)

  const load = useCallback(
    async (cursor: string | null) => {
      if (cursor) setLoadingMore(true)
      else setLoading(true)
      setError(null)
      try {
        const qs = new URLSearchParams({ limit: '50' })
        if (cursor) qs.set('cursor', cursor)
        const res = await fetch(
          `/api/admin/coaching-plans/${planId}/audit?${qs.toString()}`,
          { cache: 'no-store' }
        )
        if (!res.ok) throw new Error(`Request failed (${res.status})`)
        const json = (await res.json()) as ApiAuditResponse
        const fresh = Array.isArray(json.entries) ? json.entries : []
        setEntries((prev) => (cursor ? [...prev, ...fresh] : fresh))
        setNextCursor(json.nextCursor || null)
      } catch (err) {
        if (!cursor) setEntries([])
        setError(err instanceof Error ? err.message : 'Failed to load audit log')
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [planId]
  )

  useEffect(() => {
    load(null)
  }, [load])

  if (loading) return <Spinner label="Loading audit log..." />
  if (error)
    return <ErrorCard message={error} onRetry={() => load(null)} />
  if (entries.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-10 text-center text-gray-500 text-sm">
        No audit entries yet.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {entries.map((entry) => (
        <AuditEntryRow key={entry.id} entry={entry} />
      ))}
      {nextCursor && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            disabled={loadingMore}
            onClick={() => load(nextCursor)}
            className="px-4 py-2 rounded-lg text-xs font-medium border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors disabled:opacity-40"
          >
            {loadingMore ? 'Loading...' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  )
}

function AuditEntryRow({ entry }: { entry: ApiAuditEntry }) {
  const [expanded, setExpanded] = useState(false)
  const hasDiff =
    (entry.before !== undefined && entry.before !== null) ||
    (entry.after !== undefined && entry.after !== null)

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-semibold uppercase tracking-wider">
              {entry.action}
            </span>
            <span className="text-xs text-gray-500">
              {formatDateTime(entry.createdAt)}
            </span>
          </div>
          <div className="text-sm text-gray-300 mt-1">
            {entry.actor
              ? `${entry.actor.name || entry.actor.email}`
              : 'System'}
          </div>
          {entry.reason && (
            <div className="text-xs text-gray-500 mt-1">
              Reason: {entry.reason}
            </div>
          )}
        </div>
        {hasDiff && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-xs text-emerald-400 hover:text-emerald-300 flex-shrink-0"
          >
            {expanded ? 'Hide diff' : 'Show diff'}
          </button>
        )}
      </div>
      {expanded && hasDiff && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Before
            </div>
            <pre className="bg-gray-950 border border-gray-800 rounded-lg p-3 overflow-x-auto text-[11px] leading-snug text-gray-300">
              {entry.before !== undefined && entry.before !== null
                ? safeStringify(entry.before)
                : '—'}
            </pre>
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
              After
            </div>
            <pre className="bg-gray-950 border border-gray-800 rounded-lg p-3 overflow-x-auto text-[11px] leading-snug text-gray-300">
              {entry.after !== undefined && entry.after !== null
                ? safeStringify(entry.after)
                : '—'}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}
