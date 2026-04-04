'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Habit = { id: string; name: string; icon: string; color: string }

type AuditRating = {
  cueVisibility: number
  startFriction: number
  competingTemptations: number
}

type HabitAudit = {
  habit: Habit
  ratings: AuditRating
  score: number
  suggestions: string[]
}

const DIMENSIONS = [
  {
    key: 'cueVisibility' as const,
    label: 'Cue Visibility',
    question: 'Can I see the trigger for this habit?',
    low: 'Invisible',
    high: 'Very visible',
  },
  {
    key: 'startFriction' as const,
    label: 'Start Friction',
    question: 'How many steps to begin?',
    low: 'Many steps',
    high: 'Effortless',
  },
  {
    key: 'competingTemptations' as const,
    label: 'Competing Temptations',
    question: 'How tempting are alternatives?',
    low: 'Very tempting',
    high: 'No distractions',
  },
]

function calcEnvScore(r: AuditRating): number {
  return Math.round(((r.cueVisibility + r.startFriction + r.competingTemptations) / 15) * 100)
}

function getSuggestions(habit: Habit, r: AuditRating): string[] {
  const suggestions: string[] = []
  if (r.cueVisibility <= 2) {
    suggestions.push(`Place a visual cue for "${habit.name}" where you will see it first thing.`)
  }
  if (r.cueVisibility === 3) {
    suggestions.push(`Make the cue for "${habit.name}" more prominent. Put it at eye level.`)
  }
  if (r.startFriction <= 2) {
    suggestions.push(`Prepare everything for "${habit.name}" the night before. Reduce steps to start.`)
  }
  if (r.startFriction === 3) {
    suggestions.push(`Can you shave off one step to start "${habit.name}"? Every friction point matters.`)
  }
  if (r.competingTemptations <= 2) {
    suggestions.push(`Remove distractions that compete with "${habit.name}" from your environment.`)
  }
  if (r.competingTemptations === 3) {
    suggestions.push(`Make competing temptations harder to access when it is time for "${habit.name}".`)
  }
  if (suggestions.length === 0) {
    suggestions.push(`Your environment is well-designed for "${habit.name}". Keep it up!`)
  }
  return suggestions
}

export default function EnvironmentAuditPage() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [loading, setLoading] = useState(true)
  const [ratings, setRatings] = useState<Record<string, AuditRating>>({})
  const [results, setResults] = useState<HabitAudit[]>([])
  const [audited, setAudited] = useState(false)
  const [selectedHabits, setSelectedHabits] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch('/api/habits')
      .then((r) => r.json())
      .then((data: Habit[]) => {
        if (Array.isArray(data)) {
          setHabits(data)
          // Auto-select first 5
          const initial = new Set(data.slice(0, 5).map((h) => h.id))
          setSelectedHabits(initial)
          const initRatings: Record<string, AuditRating> = {}
          data.forEach((h) => {
            initRatings[h.id] = { cueVisibility: 3, startFriction: 3, competingTemptations: 3 }
          })
          setRatings(initRatings)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const toggleHabit = (id: string) => {
    setSelectedHabits((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleRate = (habitId: string, key: keyof AuditRating, val: number) => {
    setRatings((prev) => ({
      ...prev,
      [habitId]: { ...prev[habitId], [key]: val },
    }))
  }

  const handleAudit = () => {
    const auditResults = habits
      .filter((h) => selectedHabits.has(h.id))
      .map((habit) => {
        const r = ratings[habit.id]
        return {
          habit,
          ratings: r,
          score: calcEnvScore(r),
          suggestions: getSuggestions(habit, r),
        }
      })
    auditResults.sort((a, b) => a.score - b.score)
    setResults(auditResults)
    setAudited(true)
  }

  const overallScore = results.length > 0
    ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)
    : 0

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-white/5 rounded w-64" />
          {[1, 2, 3].map((i) => <div key={i} className="h-40 bg-white/5 rounded-xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-12">
      <Link href="/academy" className="text-sm text-zinc-500 hover:text-zinc-300 mb-6 inline-flex items-center gap-1">
        &larr; Back to Academy
      </Link>

      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white mb-3">Environment Audit</h1>
        <p className="text-zinc-400 max-w-2xl">
          Based on <span className="text-emerald-400">Wood &amp; Neal&apos;s</span> research on context cues and environmental design.
          Your environment is the invisible hand that shapes your behavior. Audit it to make good habits easier and bad habits harder.
        </p>
      </div>

      {habits.length === 0 ? (
        <div className="text-center py-16 bg-white/[0.03] border border-white/[0.06] rounded-xl">
          <p className="text-zinc-400 text-lg mb-3">No active habits found</p>
          <Link href="/habits/new" className="text-emerald-400 hover:text-emerald-300 text-sm">
            Create your first habit &rarr;
          </Link>
        </div>
      ) : !audited ? (
        <>
          {/* Habit Selector */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6 mb-6">
            <h3 className="text-sm font-semibold text-zinc-400 mb-3">Select habits to audit (up to 5)</h3>
            <div className="flex flex-wrap gap-2">
              {habits.map((h) => (
                <button
                  key={h.id}
                  onClick={() => toggleHabit(h.id)}
                  className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
                    selectedHabits.has(h.id)
                      ? 'bg-emerald-600/10 border-emerald-500/30 text-white'
                      : 'bg-white/[0.03] border-white/[0.06] text-zinc-400 hover:border-white/10'
                  }`}
                >
                  <span className="mr-1">{h.icon || '✅'}</span> {h.name}
                </button>
              ))}
            </div>
          </div>

          {/* Rating Cards */}
          <div className="space-y-6">
            {habits
              .filter((h) => selectedHabits.has(h.id))
              .map((habit) => (
                <div key={habit.id} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <span className="text-2xl">{habit.icon || '✅'}</span>
                    <h3 className="text-lg font-semibold text-white">{habit.name}</h3>
                  </div>
                  <div className="space-y-5">
                    {DIMENSIONS.map((dim) => (
                      <div key={dim.key}>
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="text-sm text-zinc-300 font-medium">{dim.label}</span>
                            <p className="text-xs text-zinc-500">{dim.question}</p>
                          </div>
                          <span className="text-sm font-mono text-emerald-400 w-6 text-right">
                            {ratings[habit.id]?.[dim.key] || 3}
                          </span>
                        </div>
                        <input
                          type="range"
                          min={1}
                          max={5}
                          value={ratings[habit.id]?.[dim.key] || 3}
                          onChange={(e) => handleRate(habit.id, dim.key, Number(e.target.value))}
                          className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-emerald-500"
                        />
                        <div className="flex justify-between text-xs text-zinc-600 mt-1">
                          <span>{dim.low}</span>
                          <span>{dim.high}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>

          <button
            onClick={handleAudit}
            disabled={selectedHabits.size === 0}
            className="mt-8 w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors disabled:opacity-40"
          >
            Run Environment Audit
          </button>
        </>
      ) : (
        <>
          {/* Overall Score */}
          <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 rounded-2xl p-8 text-center mb-8">
            <div className="text-6xl font-bold text-white mb-2">{overallScore}%</div>
            <p className="text-sm text-zinc-400">Overall Environment Score</p>
            <p className="text-xs text-zinc-500 mt-2">
              {overallScore >= 75 ? 'Your environment is well-designed for your habits.'
                : overallScore >= 50 ? 'Good foundation. A few tweaks will make a big difference.'
                : 'Significant room for improvement. Focus on the suggestions below.'}
            </p>
          </div>

          {/* Per-Habit Results */}
          <div className="space-y-4 mb-8">
            {results.map((r) => (
              <div key={r.habit.id} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{r.habit.icon || '✅'}</span>
                    <span className="font-semibold text-white">{r.habit.name}</span>
                  </div>
                  <span className={`text-lg font-bold ${
                    r.score >= 75 ? 'text-emerald-400' : r.score >= 50 ? 'text-amber-400' : 'text-red-400'
                  }`}>
                    {r.score}%
                  </span>
                </div>

                {/* Dimension bars */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {DIMENSIONS.map((dim) => (
                    <div key={dim.key} className="text-center">
                      <div className="text-xs text-zinc-500 mb-1">{dim.label}</div>
                      <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            r.ratings[dim.key] >= 4 ? 'bg-emerald-500' : r.ratings[dim.key] >= 3 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${(r.ratings[dim.key] / 5) * 100}%` }}
                        />
                      </div>
                      <div className="text-xs font-mono text-zinc-400 mt-1">{r.ratings[dim.key]}/5</div>
                    </div>
                  ))}
                </div>

                {/* Suggestions */}
                <div className="space-y-2">
                  {r.suggestions.map((s, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-emerald-400 mt-0.5">&#x2192;</span>
                      <span className="text-zinc-300">{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setAudited(false)}
            className="w-full py-3 rounded-xl border border-white/10 text-zinc-400 hover:text-white hover:border-white/20 transition-colors"
          >
            Re-audit
          </button>
        </>
      )}
    </div>
  )
}
