import Link from 'next/link'
import { headers } from 'next/headers'
import GoalActions from './goal-actions'

export const dynamic = 'force-dynamic'

type GoalPlan = {
  id: string
  title: string
  summary?: string | null
  status: string
  momentumScore?: number | null
  completionPercent?: number | null
  framework?: string | null
}

type Goal = {
  id: string
  title: string
  description?: string | null
  category: string
  framework: string
  status: string
  priority: number
  targetDate?: string | null
  createdAt?: string | null
  coachingPlans?: GoalPlan[]
}

async function fetchGoal(id: string): Promise<{
  goal: Goal | null
  ok: boolean
  errorMessage: string | null
}> {
  try {
    const h = headers()
    const host = h.get('x-forwarded-host') ?? h.get('host')
    const proto = h.get('x-forwarded-proto') ?? 'https'
    if (!host) {
      return { goal: null, ok: false, errorMessage: 'Could not determine host.' }
    }
    const cookie = h.get('cookie') ?? ''
    const res = await fetch(`${proto}://${host}/api/goals/${id}`, {
      cache: 'no-store',
      headers: { cookie },
    })
    if (!res.ok) {
      return {
        goal: null,
        ok: false,
        errorMessage: `Goal API returned ${res.status}.`,
      }
    }
    const data = (await res.json()) as Goal | { goal?: Goal }
    const goal: Goal | null =
      data && typeof data === 'object' && 'id' in data
        ? (data as Goal)
        : ((data as { goal?: Goal }).goal ?? null)
    return { goal, ok: true, errorMessage: null }
  } catch (e) {
    return {
      goal: null,
      ok: false,
      errorMessage: e instanceof Error ? e.message : 'Unknown error',
    }
  }
}

function daysBetween(dateString?: string | null): number | null {
  if (!dateString) return null
  const target = new Date(dateString)
  if (Number.isNaN(target.getTime())) return null
  const diffMs = target.getTime() - Date.now()
  return Math.round(diffMs / (1000 * 60 * 60 * 24))
}

function PriorityStars({ priority }: { priority: number }) {
  const clamped = Math.max(0, Math.min(3, priority))
  return (
    <div className="inline-flex items-center gap-0.5" aria-label={`Priority ${clamped} of 3`}>
      {[1, 2, 3].map((i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`w-4 h-4 ${i <= clamped ? 'text-amber-300' : 'text-zinc-700'}`}
          aria-hidden="true"
        >
          <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9L10 1.5z" />
        </svg>
      ))}
    </div>
  )
}

export default async function GoalDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const { goal, ok, errorMessage } = await fetchGoal(params.id)

  if (!ok || !goal) {
    return (
      <div className="space-y-8">
        <nav aria-label="Breadcrumb" className="text-xs text-zinc-500">
          <ol className="flex items-center gap-2">
            <li>
              <Link href="/dashboard" className="hover:text-zinc-300">
                Dashboard
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/goals" className="hover:text-zinc-300">
                Goals
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-zinc-300">{params.id}</li>
          </ol>
        </nav>
        <div
          role="status"
          className="rounded-2xl border border-amber-400/30 bg-amber-500/10 backdrop-blur p-6 text-sm text-amber-100"
        >
          <p className="font-medium">Goal service is warming up</p>
          <p className="text-amber-200/80 mt-1">
            We couldn&apos;t load this goal yet
            {errorMessage ? ` (${errorMessage})` : ''}. Refresh in a moment once the backend is
            ready.
          </p>
          <div className="mt-4">
            <Link
              href="/goals"
              className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-full border border-amber-400/40 bg-amber-500/20 text-amber-100 hover:bg-amber-500/30 transition-colors"
            >
              Back to goals
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const daysLeft = daysBetween(goal.targetDate)
  const plans = goal.coachingPlans ?? []

  return (
    <div className="space-y-8">
      <nav aria-label="Breadcrumb" className="text-xs text-zinc-500">
        <ol className="flex items-center gap-2">
          <li>
            <Link href="/dashboard" className="hover:text-zinc-300">
              Dashboard
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/goals" className="hover:text-zinc-300">
              Goals
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-zinc-300 truncate max-w-[200px]">{goal.title}</li>
        </ol>
      </nav>

      {/* Hero */}
      <header className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-1.5 mb-3">
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-zinc-200 border border-white/10">
                {goal.category}
              </span>
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-200 border border-amber-400/30">
                {goal.framework}
              </span>
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-200 border border-emerald-400/30">
                {goal.status}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              {goal.title}
            </h1>
            <div className="mt-3 flex items-center gap-3">
              <PriorityStars priority={goal.priority} />
              <span className="text-xs text-zinc-500">
                Priority {Math.max(0, Math.min(3, goal.priority))}/3
              </span>
            </div>
          </div>
          <GoalActions goalId={goal.id} status={goal.status} />
        </div>

        {goal.description ? (
          <p className="mt-6 text-zinc-300 leading-relaxed max-w-3xl whitespace-pre-wrap">
            {goal.description}
          </p>
        ) : null}

        {goal.targetDate ? (
          <div className="mt-6 flex items-center gap-2 text-sm text-zinc-400">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="w-4 h-4"
              aria-hidden="true"
            >
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <path strokeLinecap="round" d="M8 3v4M16 3v4M3 11h18" />
            </svg>
            Target: {new Date(goal.targetDate).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
            {daysLeft !== null ? (
              <span className="text-amber-300 ml-1">
                {daysLeft > 0
                  ? `(${daysLeft} days left)`
                  : daysLeft === 0
                    ? '(today)'
                    : `(${Math.abs(daysLeft)} days overdue)`}
              </span>
            ) : null}
          </div>
        ) : null}
      </header>

      {/* Coaching plans */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Coaching plans</h2>
          {plans.length > 0 && (
            <Link
              href={`/goals/${goal.id}/wizard`}
              className="text-xs text-amber-300 hover:text-amber-200 transition-colors"
            >
              + New plan
            </Link>
          )}
        </div>

        {plans.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-10 text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-amber-500/15 border border-amber-400/30 flex items-center justify-center mb-4">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                className="w-6 h-6 text-amber-300"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 7l10 5 10-5-10-5z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No plan yet</h3>
            <p className="text-zinc-400 text-sm mb-5 max-w-md mx-auto">
              Start the {goal.framework} wizard and your coach will craft a 66-day plan of tiny,
              stackable habits.
            </p>
            <Link
              href={`/goals/${goal.id}/wizard`}
              className="inline-flex items-center gap-2 rounded-full px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-400 text-[#1c1c22] font-semibold text-sm shadow-[0_0_24px_rgba(245,158,11,0.25)] hover:shadow-[0_0_32px_rgba(245,158,11,0.4)] transition-all"
            >
              Start the wizard
            </Link>
          </div>
        ) : (
          <ul role="list" className="space-y-3">
            {plans.map((p) => {
              const momentum = Math.max(0, Math.min(100, p.momentumScore ?? 0))
              const completion = Math.max(0, Math.min(100, p.completionPercent ?? 0))
              return (
                <li
                  key={p.id}
                  className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-5 flex flex-col sm:flex-row sm:items-center gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-white font-semibold truncate">{p.title}</h3>
                      <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-200 border border-emerald-400/30">
                        {p.status}
                      </span>
                    </div>
                    {p.summary && (
                      <p className="text-xs text-zinc-400 line-clamp-2 mb-3">{p.summary}</p>
                    )}
                    <div className="space-y-2">
                      <div>
                        <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-1">
                          <span>Momentum</span>
                          <span>{momentum}/100</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-amber-400 to-orange-400"
                            style={{ width: `${momentum}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-1">
                          <span>Completion</span>
                          <span>{completion}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-400 to-teal-400"
                            style={{ width: `${completion}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <Link
                    href={`/plan/${p.id}`}
                    className="inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2 bg-white/5 border border-white/10 text-zinc-200 hover:bg-white/10 text-sm transition-colors whitespace-nowrap"
                  >
                    View
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      className="w-4 h-4"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
