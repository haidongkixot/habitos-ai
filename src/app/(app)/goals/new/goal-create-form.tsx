'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Category =
  | 'health'
  | 'career'
  | 'relationships'
  | 'learning'
  | 'finance'
  | 'creativity'
  | 'other'

type Framework = 'GROW' | 'WOOP' | 'IDENTITY'

type FrameworkInfo = {
  key: Framework
  name: string
  tagline: string
  citation: string
  bestFor: string[]
  estimatedMinutes: number
}

// TODO(phase3-backend): refactor to fetch from /api/coaching/frameworks when available
const FRAMEWORKS: FrameworkInfo[] = [
  {
    key: 'GROW',
    name: 'GROW',
    tagline: 'Goal · Reality · Options · Will',
    citation: 'Whitmore, 1992',
    bestFor: [
      'Concrete, measurable outcomes',
      'You already know roughly where you want to go',
      'Career, fitness, skill-building',
    ],
    estimatedMinutes: 7,
  },
  {
    key: 'WOOP',
    name: 'WOOP',
    tagline: 'Wish · Outcome · Obstacle · Plan',
    citation: 'Oettingen, 2014',
    bestFor: [
      'Breaking through past failures',
      'Goals where obstacles keep derailing you',
      'Mental contrasting + implementation intentions',
    ],
    estimatedMinutes: 6,
  },
  {
    key: 'IDENTITY',
    name: 'Identity',
    tagline: 'Become the person, then the habits follow',
    citation: 'Clear, 2018',
    bestFor: [
      'Deep lifestyle change',
      'When you want the habit to feel like "who I am"',
      'Long-term transformation, not quick wins',
    ],
    estimatedMinutes: 6,
  },
]

const CATEGORIES: Array<{ value: Category; label: string }> = [
  { value: 'health', label: 'Health' },
  { value: 'career', label: 'Career' },
  { value: 'relationships', label: 'Relationships' },
  { value: 'learning', label: 'Learning' },
  { value: 'finance', label: 'Finance' },
  { value: 'creativity', label: 'Creativity' },
  { value: 'other', label: 'Other' },
]

export default function GoalCreateForm() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<Category>('health')
  const [priority, setPriority] = useState<number>(2)
  const [targetDate, setTargetDate] = useState('')
  const [submitting, setSubmitting] = useState<Framework | null>(null)
  const [error, setError] = useState<string | null>(null)

  const canAdvance = title.trim().length >= 3

  const handleFrameworkSelect = async (framework: Framework) => {
    if (submitting) return
    setError(null)
    setSubmitting(framework)
    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          category,
          framework,
          priority,
          targetDate: targetDate || undefined,
        }),
      })
      if (!res.ok) {
        let message = 'Could not create goal. Please try again.'
        try {
          const data = (await res.json()) as { error?: string; message?: string }
          if (data?.error) message = data.error
          else if (data?.message) message = data.message
        } catch {
          // ignore
        }
        throw new Error(message)
      }
      const data = (await res.json()) as { id?: string; goal?: { id?: string } }
      const newId = data?.id ?? data?.goal?.id
      if (!newId) {
        throw new Error('Goal created but no ID returned.')
      }
      router.push(`/goals/${newId}/wizard`)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Something went wrong.'
      setError(msg)
      setSubmitting(null)
    }
  }

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Progress indicator */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border ${
              step >= 1
                ? 'bg-amber-500/20 text-amber-200 border-amber-400/40'
                : 'bg-white/5 text-zinc-400 border-white/10'
            }`}
          >
            1
          </div>
          <span
            className={`text-xs uppercase tracking-wider ${
              step >= 1 ? 'text-amber-200' : 'text-zinc-500'
            }`}
          >
            Define
          </span>
        </div>
        <div className="flex-1 h-px bg-white/10" />
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border ${
              step >= 2
                ? 'bg-amber-500/20 text-amber-200 border-amber-400/40'
                : 'bg-white/5 text-zinc-400 border-white/10'
            }`}
          >
            2
          </div>
          <span
            className={`text-xs uppercase tracking-wider ${
              step >= 2 ? 'text-amber-200' : 'text-zinc-500'
            }`}
          >
            Framework
          </span>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-2xl border border-rose-400/30 bg-rose-500/10 backdrop-blur p-4 text-sm text-rose-100"
        >
          <p className="font-medium">Could not save your goal</p>
          <p className="text-rose-200/80 mt-1">{error}</p>
        </div>
      )}

      {step === 1 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-6 sm:p-8 space-y-6">
          <div>
            <label
              htmlFor="goal-title"
              className="block text-sm font-medium text-zinc-200 mb-2"
            >
              Goal title
              <span className="text-rose-400 ml-1" aria-hidden="true">
                *
              </span>
            </label>
            <input
              id="goal-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Run a half-marathon by October"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-500 focus:border-amber-400/50 focus:outline-none transition-colors"
              maxLength={200}
            />
            <p className="text-xs text-zinc-500 mt-1">{title.length}/200</p>
          </div>

          <div>
            <label
              htmlFor="goal-description"
              className="block text-sm font-medium text-zinc-200 mb-2"
            >
              Why does this matter to you?
            </label>
            <textarea
              id="goal-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="The more you share, the better your coach can tailor the plan."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-500 focus:border-amber-400/50 focus:outline-none transition-colors resize-none"
              maxLength={1000}
            />
            <p className="text-xs text-zinc-500 mt-1">{description.length}/1000</p>
          </div>

          <div>
            <label
              htmlFor="goal-category"
              className="block text-sm font-medium text-zinc-200 mb-2"
            >
              Category
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => {
                const active = category === c.value
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCategory(c.value)}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-200 mb-2">
                Priority
              </label>
              <div className="flex items-center gap-1">
                {[1, 2, 3].map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setPriority(i)}
                    aria-label={`Priority ${i}`}
                    aria-pressed={priority >= i}
                    className="p-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 rounded"
                  >
                    <svg
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className={`w-7 h-7 transition-colors ${
                        priority >= i ? 'text-amber-300' : 'text-zinc-700 hover:text-zinc-600'
                      }`}
                    >
                      <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9L10 1.5z" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label
                htmlFor="goal-target-date"
                className="block text-sm font-medium text-zinc-200 mb-2"
              >
                Target date (optional)
              </label>
              <input
                id="goal-target-date"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-amber-400/50 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={!canAdvance}
              className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-400 text-[#1c1c22] font-semibold text-sm shadow-[0_0_24px_rgba(245,158,11,0.25)] hover:shadow-[0_0_32px_rgba(245,158,11,0.4)] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next: pick framework
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                className="w-4 h-4"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="w-4 h-4"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
              Back
            </button>
            <span className="text-xs text-zinc-500">Pick one to start the wizard</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {FRAMEWORKS.map((f) => {
              const isSubmitting = submitting === f.key
              const disabled = submitting !== null
              return (
                <div
                  key={f.key}
                  className={`rounded-2xl border bg-white/5 backdrop-blur p-6 flex flex-col transition-all ${
                    isSubmitting
                      ? 'border-amber-400/60 shadow-[0_0_30px_rgba(245,158,11,0.18)]'
                      : 'border-white/10 hover:border-amber-400/40'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-bold text-white">{f.name}</h3>
                    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-zinc-400">
                      ~{f.estimatedMinutes} min
                    </span>
                  </div>
                  <p className="text-sm text-amber-200/90 font-medium mb-1">{f.tagline}</p>
                  <p className="text-xs text-zinc-500 italic mb-4">{f.citation}</p>
                  <div className="flex-1">
                    <p className="text-xs uppercase tracking-wider text-zinc-500 mb-2">
                      Best for
                    </p>
                    <ul className="space-y-1.5 mb-6">
                      {f.bestFor.map((b, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-sm text-zinc-300"
                        >
                          <span className="text-amber-400 mt-0.5">•</span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleFrameworkSelect(f.key)}
                    disabled={disabled}
                    className={`w-full inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 font-semibold text-sm transition-all ${
                      isSubmitting
                        ? 'bg-amber-500/20 border border-amber-400/40 text-amber-100'
                        : 'bg-gradient-to-r from-amber-500 to-orange-400 text-[#1c1c22] shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_30px_rgba(245,158,11,0.35)]'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="inline-block w-3 h-3 rounded-full border-2 border-amber-200 border-t-transparent animate-spin" />
                        Creating goal...
                      </>
                    ) : (
                      <>Select {f.name}</>
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
