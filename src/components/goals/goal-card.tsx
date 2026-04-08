import Link from 'next/link'

export type GoalCardData = {
  id: string
  title: string
  description?: string | null
  category: string
  framework: string
  status: string
  priority: number
  targetDate?: string | null
  _count?: { coachingPlans?: number } | null
}

const CATEGORY_STYLES: Record<string, string> = {
  health: 'bg-emerald-500/15 text-emerald-200 border-emerald-400/30',
  career: 'bg-sky-500/15 text-sky-200 border-sky-400/30',
  relationships: 'bg-rose-500/15 text-rose-200 border-rose-400/30',
  learning: 'bg-indigo-500/15 text-indigo-200 border-indigo-400/30',
  finance: 'bg-lime-500/15 text-lime-200 border-lime-400/30',
  creativity: 'bg-fuchsia-500/15 text-fuchsia-200 border-fuchsia-400/30',
  growth: 'bg-teal-500/15 text-teal-200 border-teal-400/30',
  mindset: 'bg-violet-500/15 text-violet-200 border-violet-400/30',
  other: 'bg-zinc-500/15 text-zinc-200 border-zinc-400/30',
}

const FRAMEWORK_STYLES: Record<string, string> = {
  GROW: 'bg-amber-500/15 text-amber-200 border-amber-400/30',
  WOOP: 'bg-purple-500/15 text-purple-200 border-purple-400/30',
  IDENTITY: 'bg-cyan-500/15 text-cyan-200 border-cyan-400/30',
}

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-500/15 text-emerald-200 border-emerald-400/30',
  paused: 'bg-amber-500/15 text-amber-200 border-amber-400/30',
  stopped: 'bg-rose-500/15 text-rose-200 border-rose-400/30',
  completed: 'bg-sky-500/15 text-sky-200 border-sky-400/30',
  deleted: 'bg-zinc-500/15 text-zinc-200 border-zinc-400/30',
}

function formatRelative(dateString?: string | null): string | null {
  if (!dateString) return null
  const target = new Date(dateString)
  if (Number.isNaN(target.getTime())) return null
  const now = new Date()
  const diffMs = target.getTime() - now.getTime()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'today'
  if (diffDays === 1) return 'tomorrow'
  if (diffDays === -1) return 'yesterday'
  if (diffDays > 1) return `in ${diffDays} days`
  return `${Math.abs(diffDays)} days ago`
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
          className={`w-3.5 h-3.5 ${i <= clamped ? 'text-amber-300' : 'text-zinc-700'}`}
          aria-hidden="true"
        >
          <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9L10 1.5z" />
        </svg>
      ))}
    </div>
  )
}

export default function GoalCard({ goal }: { goal: GoalCardData }) {
  const categoryStyle =
    CATEGORY_STYLES[goal.category.toLowerCase()] ?? CATEGORY_STYLES.other
  const frameworkStyle =
    FRAMEWORK_STYLES[goal.framework.toUpperCase()] ??
    'bg-white/10 text-zinc-200 border-white/10'
  const statusStyle =
    STATUS_STYLES[goal.status.toLowerCase()] ??
    'bg-white/10 text-zinc-200 border-white/10'
  const relative = formatRelative(goal.targetDate)
  const planCount = goal._count?.coachingPlans ?? 0

  return (
    <Link
      href={`/goals/${goal.id}`}
      className="group block rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-5 hover:border-amber-400/40 hover:-translate-y-0.5 hover:shadow-[0_0_30px_rgba(245,158,11,0.08)] transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          <span
            className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${categoryStyle}`}
          >
            {goal.category}
          </span>
          <span
            className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${frameworkStyle}`}
          >
            {goal.framework}
          </span>
        </div>
        <PriorityStars priority={goal.priority} />
      </div>

      <h3 className="mt-4 text-lg font-semibold text-white line-clamp-2 group-hover:text-amber-100 transition-colors">
        {goal.title}
      </h3>

      {goal.description ? (
        <p className="mt-2 text-sm text-zinc-400 line-clamp-2">{goal.description}</p>
      ) : null}

      <div className="mt-5 flex items-center justify-between gap-2 text-xs text-zinc-400">
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border ${statusStyle}`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              goal.status === 'active' ? 'bg-emerald-300' : 'bg-current'
            }`}
          />
          {goal.status}
        </span>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="w-3.5 h-3.5"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7l9-4 9 4-9 4-9-4z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9 4 9-4M3 17l9 4 9-4" />
            </svg>
            {planCount} plan{planCount === 1 ? '' : 's'}
          </span>
          {relative ? (
            <span className="inline-flex items-center gap-1">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="w-3.5 h-3.5"
                aria-hidden="true"
              >
                <rect x="3" y="5" width="18" height="16" rx="2" />
                <path strokeLinecap="round" d="M8 3v4M16 3v4M3 11h18" />
              </svg>
              {relative}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  )
}
