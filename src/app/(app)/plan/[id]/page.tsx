import Link from 'next/link'
import { headers } from 'next/headers'
import PlanActions from './plan-actions'
import HabitCheckinButton from './habit-checkin-button'

export const dynamic = 'force-dynamic'

type Milestone = {
  id: string
  title: string
  description?: string | null
  weekIndex?: number | null
  targetDay?: number | null
  status?: string | null
  successMetric?: string | null
}

type PlanHabit = {
  id: string
  name: string
  frequency?: string | null
  intentionCue?: string | null
  intentionTime?: string | null
  intentionLocation?: string | null
  intentionStatement?: string | null
  twoMinuteVersion?: string | null
  reward?: string | null
  category?: string | null
  difficulty?: string | null
  linkedMilestoneId?: string | null
}

type Plan = {
  id: string
  title: string
  summary?: string | null
  identityStatement?: string | null
  framework: string
  durationDays?: number | null
  startDate?: string | null
  endDate?: string | null
  status: string
  momentumScore?: number | null
  completionPercent?: number | null
  weeklyCheckinPrompt?: string | null
  goalId?: string | null
  goal?: { id: string; title: string } | null
  milestones?: Milestone[]
  planHabits?: PlanHabit[]
}

async function fetchPlan(id: string): Promise<{
  plan: Plan | null
  ok: boolean
  errorMessage: string | null
}> {
  try {
    const h = headers()
    const host = h.get('x-forwarded-host') ?? h.get('host')
    const proto = h.get('x-forwarded-proto') ?? 'https'
    if (!host) {
      return { plan: null, ok: false, errorMessage: 'Could not determine host.' }
    }
    const cookie = h.get('cookie') ?? ''
    const res = await fetch(`${proto}://${host}/api/coaching-plans/${id}`, {
      cache: 'no-store',
      headers: { cookie },
    })
    if (!res.ok) {
      return {
        plan: null,
        ok: false,
        errorMessage: `Plan API returned ${res.status}.`,
      }
    }
    const data = (await res.json()) as Plan | { plan?: Plan }
    const plan: Plan | null =
      data && typeof data === 'object' && 'id' in data
        ? (data as Plan)
        : ((data as { plan?: Plan }).plan ?? null)
    return { plan, ok: true, errorMessage: null }
  } catch (e) {
    return {
      plan: null,
      ok: false,
      errorMessage: e instanceof Error ? e.message : 'Unknown error',
    }
  }
}

function MomentumRing({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, score))
  const radius = 28
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - clamped / 100)
  return (
    <div className="relative w-20 h-20" aria-label={`Momentum ${clamped} of 100`}>
      <svg viewBox="0 0 72 72" className="w-full h-full -rotate-90">
        <circle
          cx="36"
          cy="36"
          r={radius}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={6}
          fill="none"
        />
        <circle
          cx="36"
          cy="36"
          r={radius}
          stroke="url(#momentum-gradient)"
          strokeWidth={6}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
        <defs>
          <linearGradient id="momentum-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f59e0b" />
            <stop offset="1" stopColor="#fb923c" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-white tabular-nums">{clamped}</span>
        <span className="text-[9px] uppercase tracking-wider text-zinc-500">momentum</span>
      </div>
    </div>
  )
}

function MilestoneTimeline({ milestones }: { milestones: Milestone[] }) {
  if (milestones.length === 0) {
    return (
      <p className="text-sm text-zinc-500 italic">
        No milestones yet. Your coach will add them as your plan evolves.
      </p>
    )
  }
  return (
    <ol className="relative space-y-6 pl-8 border-l border-white/10">
      {milestones.map((m, idx) => {
        const status = (m.status ?? 'pending').toLowerCase()
        const dotColor =
          status === 'completed' || status === 'done'
            ? 'bg-emerald-400 border-emerald-400/40'
            : status === 'in-progress' || status === 'in_progress'
              ? 'bg-amber-400 border-amber-400/40'
              : 'bg-zinc-600 border-zinc-700'
        const day = m.targetDay ?? (m.weekIndex != null ? m.weekIndex * 7 : null)
        return (
          <li key={m.id} className="relative">
            <span
              className={`absolute -left-[37px] top-1.5 w-4 h-4 rounded-full border-2 ${dotColor}`}
              aria-hidden="true"
            />
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <h4 className="text-white font-semibold">
                {idx + 1}. {m.title}
              </h4>
              <div className="flex items-center gap-2">
                {day != null && (
                  <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-zinc-400">
                    Day {day}
                  </span>
                )}
                <span
                  className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                    status === 'completed' || status === 'done'
                      ? 'bg-emerald-500/15 text-emerald-200 border-emerald-400/30'
                      : status === 'in-progress' || status === 'in_progress'
                        ? 'bg-amber-500/15 text-amber-200 border-amber-400/30'
                        : 'bg-white/5 text-zinc-400 border-white/10'
                  }`}
                >
                  {status.replace('_', '-')}
                </span>
              </div>
            </div>
            {m.description && (
              <p className="text-sm text-zinc-400 mt-1 leading-relaxed">{m.description}</p>
            )}
            {m.successMetric && (
              <p className="text-xs text-zinc-500 italic mt-1">Success: {m.successMetric}</p>
            )}
          </li>
        )
      })}
    </ol>
  )
}

function DifficultyBadge({ difficulty }: { difficulty?: string | null }) {
  const d = (difficulty ?? 'tiny').toLowerCase()
  const styles =
    d === 'tiny'
      ? 'bg-emerald-500/15 text-emerald-200 border-emerald-400/30'
      : d === 'small'
        ? 'bg-amber-500/15 text-amber-200 border-amber-400/30'
        : 'bg-rose-500/15 text-rose-200 border-rose-400/30'
  return (
    <span
      className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${styles}`}
    >
      {d}
    </span>
  )
}

export default async function PlanPage({ params }: { params: { id: string } }) {
  const { plan, ok, errorMessage } = await fetchPlan(params.id)

  if (!ok || !plan) {
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
            <li className="text-zinc-300">Plan</li>
          </ol>
        </nav>
        <div
          role="status"
          className="rounded-2xl border border-amber-400/30 bg-amber-500/10 backdrop-blur p-6 text-sm text-amber-100"
        >
          <p className="font-medium">Plan is warming up</p>
          <p className="text-amber-200/80 mt-1">
            We couldn&apos;t load this plan yet
            {errorMessage ? ` (${errorMessage})` : ''}. Refresh once the backend is ready.
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

  const momentum = plan.momentumScore ?? 0
  const completion = Math.max(0, Math.min(100, plan.completionPercent ?? 0))
  const habits = plan.planHabits ?? []
  const milestones = plan.milestones ?? []

  // Group habits by linked milestone
  const habitsByMilestone = new Map<string, PlanHabit[]>()
  const unlinkedHabits: PlanHabit[] = []
  for (const h of habits) {
    if (h.linkedMilestoneId) {
      const arr = habitsByMilestone.get(h.linkedMilestoneId) ?? []
      arr.push(h)
      habitsByMilestone.set(h.linkedMilestoneId, arr)
    } else {
      unlinkedHabits.push(h)
    }
  }

  const startDate = plan.startDate ? new Date(plan.startDate) : null
  const endDate = plan.endDate ? new Date(plan.endDate) : null

  return (
    <div className="space-y-10">
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
          {plan.goal?.id && (
            <>
              <li aria-hidden="true">/</li>
              <li>
                <Link
                  href={`/goals/${plan.goal.id}`}
                  className="hover:text-zinc-300 truncate max-w-[160px]"
                >
                  {plan.goal.title}
                </Link>
              </li>
            </>
          )}
          <li aria-hidden="true">/</li>
          <li className="text-zinc-300">Plan</li>
        </ol>
      </nav>

      {/* Hero */}
      <header className="rounded-3xl border border-white/10 bg-gradient-to-br from-amber-500/10 via-white/5 to-white/[0.02] backdrop-blur p-6 sm:p-8">
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-200 border border-amber-400/30">
            {plan.framework}
          </span>
          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-200 border border-emerald-400/30">
            {plan.status}
          </span>
          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 text-zinc-300 border border-white/10">
            {plan.durationDays ?? 66} days
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
          {plan.title}
        </h1>
        {plan.summary && (
          <p className="mt-4 text-zinc-300 leading-relaxed max-w-3xl">{plan.summary}</p>
        )}
        {plan.identityStatement && (
          <blockquote className="mt-6 pl-4 border-l-2 border-amber-400/60 text-zinc-200 italic max-w-3xl">
            &ldquo;{plan.identityStatement}&rdquo;
          </blockquote>
        )}
      </header>

      {/* Metadata strip */}
      <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-center">
          <div className="flex items-center gap-4">
            <MomentumRing score={momentum} />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-zinc-500">Momentum</p>
              <p className="text-sm text-zinc-300">
                Research-grounded signal from check-ins and consistency.
              </p>
            </div>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">Completion</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-teal-400"
                  style={{ width: `${completion}%` }}
                />
              </div>
              <span className="text-sm text-white font-semibold tabular-nums">{completion}%</span>
            </div>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Start</p>
            <p className="text-sm text-white">
              {startDate
                ? startDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : '—'}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">End</p>
            <p className="text-sm text-white">
              {endDate
                ? endDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : '—'}
            </p>
          </div>
        </div>
      </section>

      {/* Milestones */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Milestones</h2>
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-6">
          <MilestoneTimeline milestones={milestones} />
        </div>
      </section>

      {/* Habits */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Habits</h2>
        {habits.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-8 text-center">
            <p className="text-sm text-zinc-400">
              No habits yet. Your coach will generate these as the plan begins.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {milestones.map((m) => {
              const list = habitsByMilestone.get(m.id) ?? []
              if (list.length === 0) return null
              return (
                <div key={m.id} className="space-y-3">
                  <p className="text-xs uppercase tracking-wider text-zinc-500">
                    For: {m.title}
                  </p>
                  {list.map((h) => (
                    <HabitCard key={h.id} habit={h} planId={plan.id} />
                  ))}
                </div>
              )
            })}
            {unlinkedHabits.length > 0 && (
              <div className="space-y-3">
                {milestones.length > 0 && (
                  <p className="text-xs uppercase tracking-wider text-zinc-500">Daily cornerstones</p>
                )}
                {unlinkedHabits.map((h) => (
                  <HabitCard key={h.id} habit={h} planId={plan.id} />
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Weekly check-in prompt */}
      {plan.weeklyCheckinPrompt && (
        <section>
          <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 backdrop-blur p-6">
            <p className="text-[10px] uppercase tracking-wider text-amber-300 mb-2">
              Weekly check-in
            </p>
            <p className="text-lg text-amber-100 leading-relaxed">
              {plan.weeklyCheckinPrompt}
            </p>
          </div>
        </section>
      )}

      {/* Action bar */}
      <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-4 sticky bottom-4 z-30">
        <PlanActions planId={plan.id} status={plan.status} />
      </section>
    </div>
  )
}

function HabitCard({ habit, planId }: { habit: PlanHabit; planId: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <h3 className="text-white font-semibold">{habit.name}</h3>
            <DifficultyBadge difficulty={habit.difficulty} />
            {habit.frequency && (
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 text-zinc-400 border border-white/10">
                {habit.frequency}
              </span>
            )}
          </div>
          {habit.intentionStatement && (
            <p className="text-sm text-zinc-300 italic mb-3">
              &ldquo;{habit.intentionStatement}&rdquo;
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {(habit.intentionCue || habit.intentionTime || habit.intentionLocation) && (
              <div>
                <p className="uppercase tracking-wider text-zinc-500 mb-1">Cue</p>
                <p className="text-zinc-300">
                  {[habit.intentionCue, habit.intentionTime, habit.intentionLocation]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>
            )}
            {habit.twoMinuteVersion && (
              <div>
                <p className="uppercase tracking-wider text-zinc-500 mb-1">Routine</p>
                <p className="text-zinc-300">{habit.twoMinuteVersion}</p>
              </div>
            )}
            {habit.reward && (
              <div>
                <p className="uppercase tracking-wider text-zinc-500 mb-1">Reward</p>
                <p className="text-zinc-300">{habit.reward}</p>
              </div>
            )}
          </div>
        </div>
        <HabitCheckinButton planId={planId} habitId={habit.id} habitTitle={habit.name} />
      </div>
    </div>
  )
}
