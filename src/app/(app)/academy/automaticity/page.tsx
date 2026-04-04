'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Habit = {
  id: string
  name: string
  icon: string
  color: string
  _count: { checkins: number }
}

type Ratings = {
  withoutThinking: number
  feelWeirdNot: number
  partOfRoutine: number
  needReminder: number
}

type HabitScore = {
  habit: Habit
  ratings: Ratings
  score: number
  daysActive: number
  daysRemaining: number
}

const QUESTIONS = [
  { key: 'withoutThinking' as const, label: 'I do this without thinking', reversed: false },
  { key: 'feelWeirdNot' as const, label: "I'd feel weird NOT doing this", reversed: false },
  { key: 'partOfRoutine' as const, label: 'This feels part of my routine', reversed: false },
  { key: 'needReminder' as const, label: 'I have to remind myself', reversed: true },
]

function calcScore(r: Ratings): number {
  const forward = r.withoutThinking + r.feelWeirdNot + r.partOfRoutine
  const reversed = 6 - r.needReminder
  return Math.round(((forward + reversed) / 20) * 100)
}

function estimateDaysRemaining(score: number, daysActive: number): number {
  // Lally's curve: automaticity plateaus around 66 days on average
  const target = 66
  if (score >= 85) return 0
  const progress = Math.min(daysActive, target)
  const remaining = Math.max(0, target - progress)
  // Adjust by score: higher score = closer to done
  const scoreAdjustment = score / 100
  return Math.max(0, Math.round(remaining * (1 - scoreAdjustment * 0.5)))
}

function getTip(score: number): { label: string; color: string; advice: string } {
  if (score >= 75) return { label: 'High Automaticity', color: 'emerald', advice: 'This habit is well-established. Consider stacking a new habit on top of it.' }
  if (score >= 45) return { label: 'Building', color: 'amber', advice: 'Stay consistent. Missing a day is fine, but never miss two in a row.' }
  return { label: 'Forming', color: 'red', advice: 'Add stronger cues. Place visual reminders where you will see them.' }
}

export default function AutomaticityPage() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [loading, setLoading] = useState(true)
  const [scores, setScores] = useState<HabitScore[]>([])
  const [currentRatings, setCurrentRatings] = useState<Record<string, Ratings>>({})
  const [assessed, setAssessed] = useState(false)

  useEffect(() => {
    fetch('/api/habits')
      .then((r) => r.json())
      .then((data: Habit[]) => {
        if (Array.isArray(data)) {
          setHabits(data)
          const initial: Record<string, Ratings> = {}
          data.forEach((h) => {
            initial[h.id] = { withoutThinking: 3, feelWeirdNot: 3, partOfRoutine: 3, needReminder: 3 }
          })
          setCurrentRatings(initial)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleRate = (habitId: string, key: keyof Ratings, val: number) => {
    setCurrentRatings((prev) => ({
      ...prev,
      [habitId]: { ...prev[habitId], [key]: val },
    }))
  }

  const handleAssess = () => {
    const results: HabitScore[] = habits.map((h) => {
      const ratings = currentRatings[h.id]
      const score = calcScore(ratings)
      const daysActive = h._count?.checkins || 0
      return {
        habit: h,
        ratings,
        score,
        daysActive,
        daysRemaining: estimateDaysRemaining(score, daysActive),
      }
    })
    results.sort((a, b) => b.score - a.score)
    setScores(results)
    setAssessed(true)
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-white/5 rounded w-64" />
          <div className="h-4 bg-white/5 rounded w-96" />
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
        <h1 className="text-3xl font-bold text-white mb-3">Automaticity Self-Assessment</h1>
        <p className="text-zinc-400 max-w-2xl">
          Based on the <span className="text-emerald-400">Self-Report Habit Index</span> (Verplanken &amp; Orbell, 2003).
          Rate each habit to discover how automatic it has become and estimate your path to full automaticity on Lally&apos;s 66-day curve.
        </p>
      </div>

      {habits.length === 0 ? (
        <div className="text-center py-16 bg-white/[0.03] border border-white/[0.06] rounded-xl">
          <p className="text-zinc-400 text-lg mb-3">No active habits found</p>
          <Link href="/habits/new" className="text-emerald-400 hover:text-emerald-300 text-sm">
            Create your first habit &rarr;
          </Link>
        </div>
      ) : !assessed ? (
        <>
          <div className="space-y-6">
            {habits.map((habit) => (
              <div key={habit.id} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6">
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-2xl">{habit.icon || '✅'}</span>
                  <h3 className="text-lg font-semibold text-white">{habit.name}</h3>
                  <span className="ml-auto text-xs text-zinc-500">{habit._count?.checkins || 0} check-ins</span>
                </div>
                <div className="space-y-4">
                  {QUESTIONS.map((q) => (
                    <div key={q.key}>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm text-zinc-300">
                          {q.label}
                          {q.reversed && <span className="text-xs text-zinc-500 ml-2">(reversed)</span>}
                        </label>
                        <span className="text-sm font-mono text-emerald-400 w-6 text-right">
                          {currentRatings[habit.id]?.[q.key] || 3}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={5}
                        value={currentRatings[habit.id]?.[q.key] || 3}
                        onChange={(e) => handleRate(habit.id, q.key, Number(e.target.value))}
                        className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-emerald-500"
                      />
                      <div className="flex justify-between text-xs text-zinc-600 mt-1">
                        <span>Strongly disagree</span>
                        <span>Strongly agree</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleAssess}
            className="mt-8 w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors"
          >
            Calculate Automaticity Scores
          </button>
        </>
      ) : (
        <>
          {/* Results */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6 mb-8">
            <h2 className="text-xl font-semibold text-white mb-6">Your Automaticity Scores</h2>
            <div className="space-y-4">
              {scores.map((s) => {
                const tip = getTip(s.score)
                return (
                  <div key={s.habit.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{s.habit.icon || '✅'}</span>
                        <span className="text-sm font-medium text-white">{s.habit.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${
                          tip.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          tip.color === 'amber' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                          {tip.label}
                        </span>
                        <span className="text-lg font-bold text-white">{s.score}%</span>
                      </div>
                    </div>
                    <div className="w-full h-3 bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          s.score >= 75 ? 'bg-emerald-500' : s.score >= 45 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${s.score}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-zinc-500">
                      <span>{tip.advice}</span>
                      <span>{s.daysRemaining > 0 ? `~${s.daysRemaining} days to automaticity` : 'Automatic!'}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-emerald-400">
                {scores.filter((s) => s.score >= 75).length}
              </div>
              <div className="text-xs text-zinc-500 mt-1">Automatic</div>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-amber-400">
                {scores.filter((s) => s.score >= 45 && s.score < 75).length}
              </div>
              <div className="text-xs text-zinc-500 mt-1">Building</div>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-red-400">
                {scores.filter((s) => s.score < 45).length}
              </div>
              <div className="text-xs text-zinc-500 mt-1">Forming</div>
            </div>
          </div>

          <button
            onClick={() => setAssessed(false)}
            className="w-full py-3 rounded-xl border border-white/10 text-zinc-400 hover:text-white hover:border-white/20 transition-colors"
          >
            Re-assess
          </button>
        </>
      )}
    </div>
  )
}
