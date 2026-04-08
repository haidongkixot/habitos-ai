import Link from 'next/link'
import { headers } from 'next/headers'
import GoalCard, { type GoalCardData } from '@/components/goals/goal-card'

export const dynamic = 'force-dynamic'

type GoalsResponse = {
  goals?: GoalCardData[]
}

async function fetchGoals(): Promise<{
  goals: GoalCardData[]
  ok: boolean
  errorMessage: string | null
}> {
  try {
    const h = headers()
    const host = h.get('x-forwarded-host') ?? h.get('host')
    const proto = h.get('x-forwarded-proto') ?? 'https'
    if (!host) {
      return {
        goals: [],
        ok: false,
        errorMessage: 'Could not determine host for internal API call.',
      }
    }
    const cookie = h.get('cookie') ?? ''
    const res = await fetch(`${proto}://${host}/api/goals`, {
      cache: 'no-store',
      headers: { cookie },
    })
    if (!res.ok) {
      return {
        goals: [],
        ok: false,
        errorMessage: `Goals API returned ${res.status}.`,
      }
    }
    const data = (await res.json()) as GoalsResponse | GoalCardData[]
    const goals = Array.isArray(data)
      ? data
      : Array.isArray(data?.goals)
        ? data.goals
        : []
    return { goals, ok: true, errorMessage: null }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return { goals: [], ok: false, errorMessage: msg }
  }
}

export default async function GoalsPage() {
  const { goals, ok, errorMessage } = await fetchGoals()

  return (
    <div className="space-y-8">
      <nav aria-label="Breadcrumb" className="text-xs text-zinc-500">
        <ol className="flex items-center gap-2">
          <li>
            <Link href="/dashboard" className="hover:text-zinc-300 transition-colors">
              Dashboard
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-zinc-300">Goals</li>
        </ol>
      </nav>

      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Your Goals</h1>
          <p className="text-zinc-400 mt-1 max-w-2xl">
            The north stars your coach guides you toward. Each goal becomes a research-grounded
            plan of habits and milestones.
          </p>
        </div>
        <Link
          href="/goals/new"
          className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-400 text-[#1c1c22] font-semibold text-sm shadow-[0_0_24px_rgba(245,158,11,0.25)] hover:shadow-[0_0_32px_rgba(245,158,11,0.4)] transition-all"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            className="w-4 h-4"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
          </svg>
          New Goal
        </Link>
      </header>

      {!ok && (
        <div
          role="status"
          className="rounded-2xl border border-amber-400/30 bg-amber-500/10 backdrop-blur p-4 text-sm text-amber-100"
        >
          <p className="font-medium">Goals service is warming up</p>
          <p className="text-amber-200/80 mt-1">
            We couldn&apos;t reach the goals API yet
            {errorMessage ? ` (${errorMessage})` : ''}. Your goals will load as soon as the
            backend is ready &mdash; refresh in a moment.
          </p>
        </div>
      )}

      {ok && goals.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur p-12 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/15 border border-amber-400/30 flex items-center justify-center mb-5">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              className="w-7 h-7 text-amber-300"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9" />
              <circle cx="12" cy="12" r="5" />
              <circle cx="12" cy="12" r="1.5" fill="currentColor" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            Set your first goal &mdash; your coach is waiting.
          </h2>
          <p className="text-zinc-400 text-sm max-w-md mx-auto mb-6">
            Pick something that matters. We&apos;ll turn it into a 66-day plan of tiny, stackable
            habits using research from Lally, Fogg, Clear, and Gollwitzer.
          </p>
          <Link
            href="/goals/new"
            className="inline-flex items-center gap-2 rounded-full px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-400 text-[#1c1c22] font-semibold text-sm shadow-[0_0_24px_rgba(245,158,11,0.25)] hover:shadow-[0_0_32px_rgba(245,158,11,0.4)] transition-all"
          >
            Start your first goal
          </Link>
        </div>
      ) : null}

      {ok && goals.length > 0 ? (
        <ul
          role="list"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {goals.map((g) => (
            <li key={g.id}>
              <GoalCard goal={g} />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
