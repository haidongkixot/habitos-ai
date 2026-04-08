'use client'

import { useMemo, useState } from 'react'

type PlanSlug = 'free' | 'starter' | 'pro' | 'premium'
type Gender = 'M' | 'F' | 'NB'

export type Persona = {
  id: string
  slug: string
  name: string
  gender: Gender
  style: string
  tone: string
  shortBio: string
  avatarUrl: string
  minPlanSlug: PlanSlug
}

export type PersonaPickerProps = {
  personas: Persona[]
  userPlanSlug: PlanSlug
  currentPersonaSlug: string | null
  onSelect: (slug: string) => Promise<void> | void
}

const PLAN_RANK: Record<PlanSlug, number> = {
  free: 0,
  starter: 1,
  pro: 2,
  premium: 3,
}

const PLAN_LABEL: Record<PlanSlug, string> = {
  free: 'Free',
  starter: 'Starter',
  pro: 'Pro',
  premium: 'Premium',
}

const PLAN_BADGE_STYLES: Record<PlanSlug, string> = {
  free: 'bg-white/10 text-zinc-200 border border-white/10',
  starter: 'bg-blue-500/15 text-blue-200 border border-blue-400/30',
  pro: 'bg-amber-500/15 text-amber-200 border border-amber-400/30',
  premium:
    'bg-gradient-to-r from-purple-500/30 to-fuchsia-500/30 text-purple-100 border border-purple-400/40',
}

const GENDER_LABEL: Record<Gender, string> = {
  M: 'Male',
  F: 'Female',
  NB: 'Non-binary',
}

type GenderFilter = 'all' | Gender
type PlanFilter = 'all' | 'included' | 'locked'

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12.5l3 3 5-6" />
    </svg>
  )
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V8a4 4 0 018 0v3" />
    </svg>
  )
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14z" />
    </svg>
  )
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4M12 16h.01" />
    </svg>
  )
}

export default function PersonaPicker({
  personas,
  userPlanSlug,
  currentPersonaSlug,
  onSelect,
}: PersonaPickerProps) {
  const [genderFilter, setGenderFilter] = useState<GenderFilter>('all')
  const [planFilter, setPlanFilter] = useState<PlanFilter>('all')
  const [pendingSlug, setPendingSlug] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const userRank = PLAN_RANK[userPlanSlug]

  const filtered = useMemo(() => {
    return personas.filter((p) => {
      if (genderFilter !== 'all' && p.gender !== genderFilter) return false
      const accessible = PLAN_RANK[p.minPlanSlug] <= userRank
      if (planFilter === 'included' && !accessible) return false
      if (planFilter === 'locked' && accessible) return false
      return true
    })
  }, [personas, genderFilter, planFilter, userRank])

  const handleClick = async (persona: Persona) => {
    const accessible = PLAN_RANK[persona.minPlanSlug] <= userRank
    if (!accessible) {
      setError(
        `${persona.name} is unlocked on the ${PLAN_LABEL[persona.minPlanSlug]} plan. Upgrade to switch to this coach.`,
      )
      return
    }
    if (pendingSlug || persona.slug === currentPersonaSlug) return
    setError(null)
    setPendingSlug(persona.slug)
    try {
      await onSelect(persona.slug)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not switch coach. Please try again.'
      setError(msg)
    } finally {
      setPendingSlug(null)
    }
  }

  const genderChips: Array<{ key: GenderFilter; label: string }> = [
    { key: 'all', label: 'All' },
    { key: 'M', label: 'Male' },
    { key: 'F', label: 'Female' },
    { key: 'NB', label: 'Non-binary' },
  ]

  const planChips: Array<{ key: PlanFilter; label: string }> = [
    { key: 'all', label: 'All' },
    { key: 'included', label: 'Included in my plan' },
    { key: 'locked', label: 'Upgrade to unlock' },
  ]

  return (
    <section className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-white tracking-tight">Choose your coach</h1>
        <p className="text-zinc-300 max-w-2xl">
          Your coach&apos;s voice shapes every plan, reminder, and nudge you&apos;ll get.
        </p>
        <p className="text-xs text-zinc-500">
          You can change your coach anytime from settings &mdash; your progress and habits stay with you.
        </p>
      </header>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-wider text-zinc-500 mr-1">Gender</span>
          {genderChips.map((c) => {
            const active = genderFilter === c.key
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => setGenderFilter(c.key)}
                aria-pressed={active}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 ${
                  active
                    ? 'bg-amber-500/20 text-amber-200 border-amber-400/40'
                    : 'bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10'
                }`}
              >
                {c.label}
              </button>
            )
          })}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-wider text-zinc-500 mr-1">Plan</span>
          {planChips.map((c) => {
            const active = planFilter === c.key
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => setPlanFilter(c.key)}
                aria-pressed={active}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 ${
                  active
                    ? 'bg-amber-500/20 text-amber-200 border-amber-400/40'
                    : 'bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10'
                }`}
              >
                {c.label}
              </button>
            )
          })}
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-amber-400/30 bg-amber-500/10 backdrop-blur p-4 text-sm text-amber-100"
        >
          <AlertIcon className="w-5 h-5 mt-0.5 shrink-0 text-amber-300" />
          <div className="flex-1">{error}</div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-xs text-amber-200/80 hover:text-amber-100 underline underline-offset-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-10 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
            <SparklesIcon className="w-6 h-6 text-zinc-400" />
          </div>
          <h2 className="text-white font-semibold mb-1">No coaches match your filters</h2>
          <p className="text-zinc-400 text-sm">
            Try clearing the filters above. If the list still looks empty, refresh the page in a moment.
          </p>
        </div>
      ) : (
        <ul
          role="list"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          {filtered.map((p) => {
            const accessible = PLAN_RANK[p.minPlanSlug] <= userRank
            const selected = currentPersonaSlug === p.slug
            const pending = pendingSlug === p.slug
            const isPremium = p.minPlanSlug === 'premium'
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => handleClick(p)}
                  aria-pressed={selected}
                  aria-label={
                    accessible
                      ? `Select ${p.name} as your coach`
                      : `${p.name} requires the ${PLAN_LABEL[p.minPlanSlug]} plan`
                  }
                  disabled={pending}
                  className={`group relative w-full text-left rounded-2xl border bg-white/5 backdrop-blur p-5 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 ${
                    selected
                      ? 'border-amber-400/60 shadow-[0_0_30px_rgba(245,158,11,0.18)]'
                      : 'border-white/10 hover:border-white/20 hover:-translate-y-0.5 hover:shadow-[0_0_30px_rgba(245,158,11,0.08)]'
                  } ${!accessible ? 'opacity-60' : ''} ${pending ? 'cursor-wait' : ''}`}
                >
                  <span
                    className={`absolute top-3 right-3 inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider px-2 py-1 rounded-full ${PLAN_BADGE_STYLES[p.minPlanSlug]}`}
                  >
                    {isPremium && <SparklesIcon className="w-3 h-3" />}
                    {PLAN_LABEL[p.minPlanSlug]}
                  </span>

                  {selected && (
                    <span className="absolute top-3 left-3 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full bg-amber-500/20 text-amber-200 border border-amber-400/40">
                      <CheckIcon className="w-3 h-3" />
                      Current
                    </span>
                  )}

                  <div className="flex flex-col items-center text-center pt-6">
                    <div
                      className={`relative w-24 h-24 rounded-full overflow-hidden border ${
                        selected
                          ? 'border-amber-400/60 shadow-[0_0_25px_rgba(245,158,11,0.35)] ring-2 ring-amber-400/40 ring-offset-2 ring-offset-[#0c0c0f]'
                          : 'border-white/10'
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.avatarUrl}
                        alt={`${p.name} avatar`}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <h3 className="mt-4 text-lg font-bold text-white">{p.name}</h3>

                    <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                      <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-zinc-300">
                        {GENDER_LABEL[p.gender]}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-zinc-300">
                        {p.style}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-zinc-300">
                        {p.tone}
                      </span>
                    </div>

                    <p className="mt-3 text-sm text-zinc-400 line-clamp-2 min-h-[2.5rem]">
                      {p.shortBio}
                    </p>

                    <div className="mt-4 w-full">
                      {!accessible ? (
                        <span className="inline-flex w-full items-center justify-center gap-1.5 text-xs font-medium px-3 py-2 rounded-full bg-white/5 border border-white/10 text-zinc-300">
                          <LockIcon className="w-3.5 h-3.5" />
                          Upgrade to unlock
                        </span>
                      ) : pending ? (
                        <span className="inline-flex w-full items-center justify-center gap-1.5 text-xs font-medium px-3 py-2 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-100">
                          <span className="inline-block w-3 h-3 rounded-full border-2 border-amber-200 border-t-transparent animate-spin" />
                          Selecting...
                        </span>
                      ) : selected ? (
                        <span className="inline-flex w-full items-center justify-center gap-1.5 text-xs font-medium px-3 py-2 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-200">
                          <CheckIcon className="w-3.5 h-3.5" />
                          Your coach
                        </span>
                      ) : (
                        <span className="inline-flex w-full items-center justify-center gap-1.5 text-xs font-medium px-3 py-2 rounded-full bg-white/5 border border-white/10 text-zinc-200 group-hover:border-amber-400/40 group-hover:text-amber-200 transition-colors">
                          Select coach
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
