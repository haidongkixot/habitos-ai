'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Habit = { id: string; name: string; icon: string }

type JournalEntry = {
  id: string
  prompt: string
  response: string
  habitName: string
  createdAt: string
}

const IDENTITY_PROMPTS = [
  'Today, by completing [HABIT], I am becoming a ___',
  'What kind of person completes [HABIT] every day? I am becoming that person because ___',
  'Each time I do [HABIT], I prove to myself that ___',
  'My future self, who has mastered [HABIT], would tell me ___',
  'By doing [HABIT], the identity I am building is ___',
  'If I keep doing [HABIT] for 365 days, I will have become ___',
  '[HABIT] matters to me because it connects to my deeper value of ___',
  'One small way [HABIT] has already changed me is ___',
  'The person I am becoming through [HABIT] handles challenges by ___',
  'When I complete [HABIT], the part of my identity that grows stronger is ___',
]

const STORAGE_KEY = 'habitos-identity-journal'

function loadEntries(): JournalEntry[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

function saveEntries(list: JournalEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

function getTodayPrompt(habits: Habit[]): { prompt: string; habit: Habit | null } {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
  const promptIdx = dayOfYear % IDENTITY_PROMPTS.length
  const template = IDENTITY_PROMPTS[promptIdx]
  if (habits.length === 0) {
    return { prompt: template.replace('[HABIT]', 'your habit'), habit: null }
  }
  const habitIdx = dayOfYear % habits.length
  const habit = habits[habitIdx]
  return { prompt: template.replace(/\[HABIT\]/g, habit.name), habit }
}

export default function IdentityJournalPage() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [loading, setLoading] = useState(true)
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [response, setResponse] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/habits')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setHabits(data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
    setEntries(loadEntries())
  }, [])

  const { prompt, habit } = getTodayPrompt(habits)

  const handleSave = () => {
    if (!response.trim()) return
    const entry: JournalEntry = {
      id: Date.now().toString(),
      prompt,
      response: response.trim(),
      habitName: habit?.name || 'General',
      createdAt: new Date().toISOString(),
    }
    const updated = [entry, ...entries]
    setEntries(updated)
    saveEntries(updated)
    setResponse('')
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const recentEntries = entries.slice(0, 7)
  const totalEntries = entries.length
  const streak = (() => {
    let count = 0
    const today = new Date().toISOString().slice(0, 10)
    const dates = new Set(entries.map((e) => e.createdAt.slice(0, 10)))
    for (let i = 0; i < 365; i++) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const ds = d.toISOString().slice(0, 10)
      if (i === 0 && !dates.has(ds)) continue
      if (dates.has(ds)) count++
      else break
    }
    return count
  })()

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-white/5 rounded w-64" />
          <div className="h-48 bg-white/5 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto py-12">
      <Link href="/academy" className="text-sm text-zinc-500 hover:text-zinc-300 mb-6 inline-flex items-center gap-1">
        &larr; Back to Academy
      </Link>

      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white mb-3">Habit Identity Journal</h1>
        <p className="text-zinc-400 max-w-2xl">
          Based on <span className="text-emerald-400">James Clear&apos;s</span> identity-based habits.
          Every action is a vote for the type of person you wish to become. Reflect daily to strengthen the identity behind your habits.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-emerald-400">{totalEntries}</div>
          <div className="text-xs text-zinc-500 mt-1">Total Entries</div>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-amber-400">{streak}</div>
          <div className="text-xs text-zinc-500 mt-1">Day Streak</div>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">{habits.length}</div>
          <div className="text-xs text-zinc-500 mt-1">Active Habits</div>
        </div>
      </div>

      {/* Today's Prompt */}
      <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">{habit?.icon || '&#x1F4DD;'}</span>
          <span className="text-xs uppercase tracking-wider text-emerald-400 font-semibold">Today&apos;s Prompt</span>
        </div>
        <p className="text-lg font-semibold text-white leading-relaxed">{prompt}</p>
      </div>

      {/* Response Area */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6 mb-8">
        <textarea
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          placeholder="Write 1-3 sentences about the identity you are building..."
          rows={4}
          className="w-full bg-transparent border-none text-white placeholder-zinc-600 focus:outline-none resize-none text-sm leading-relaxed"
        />
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-zinc-600">{response.length} characters</span>
          <button
            onClick={handleSave}
            disabled={!response.trim()}
            className="px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saved ? 'Saved!' : 'Save Entry'}
          </button>
        </div>
      </div>

      {/* History */}
      {recentEntries.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">Recent Reflections</h2>
          <div className="space-y-3">
            {recentEntries.map((entry) => (
              <div key={entry.id} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-emerald-400 font-medium">{entry.habitName}</span>
                  <span className="text-xs text-zinc-600">
                    {new Date(entry.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 mb-1 italic">{entry.prompt}</p>
                <p className="text-sm text-zinc-300">{entry.response}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
