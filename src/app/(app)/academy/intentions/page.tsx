'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Habit = { id: string; name: string; icon: string }

type Intention = {
  id: string
  habit: string
  cue: string
  location: string
  time: string
  statement: string
  createdAt: string
}

const COMMON_CUES = [
  'wake up',
  'eat breakfast',
  'arrive at work',
  'finish lunch',
  'get home',
  'brush teeth',
  'pour my morning coffee',
  'finish a meeting',
  'put on my shoes',
  'sit at my desk',
]

const STORAGE_KEY = 'habitos-intentions'

function loadIntentions(): Intention[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

function saveIntentions(list: Intention[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

export default function IntentionsPage() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState(0)
  const [selectedHabit, setSelectedHabit] = useState('')
  const [customHabit, setCustomHabit] = useState('')
  const [cue, setCue] = useState(COMMON_CUES[0])
  const [customCue, setCustomCue] = useState('')
  const [location, setLocation] = useState('')
  const [time, setTime] = useState('07:00')
  const [saved, setSaved] = useState<Intention[]>([])
  const [showResult, setShowResult] = useState(false)

  useEffect(() => {
    fetch('/api/habits')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setHabits(data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
    setSaved(loadIntentions())
  }, [])

  const habitName = selectedHabit === '__custom__' ? customHabit : (habits.find((h) => h.id === selectedHabit)?.name || selectedHabit)
  const cueText = cue === '__custom__' ? customCue : cue
  const statement = `After I ${cueText} at ${location || '[location]'}, I will ${habitName || '[habit]'} at ${time}.`

  const handleSave = () => {
    const intention: Intention = {
      id: Date.now().toString(),
      habit: habitName,
      cue: cueText,
      location,
      time,
      statement,
      createdAt: new Date().toISOString(),
    }
    const updated = [intention, ...saved]
    setSaved(updated)
    saveIntentions(updated)
    setShowResult(true)
  }

  const handleDelete = (id: string) => {
    const updated = saved.filter((s) => s.id !== id)
    setSaved(updated)
    saveIntentions(updated)
  }

  const handleReset = () => {
    setStep(0)
    setSelectedHabit('')
    setCustomHabit('')
    setCue(COMMON_CUES[0])
    setCustomCue('')
    setLocation('')
    setTime('07:00')
    setShowResult(false)
  }

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
        <h1 className="text-3xl font-bold text-white mb-3">Implementation Intention Builder</h1>
        <p className="text-zinc-400 max-w-2xl">
          Based on <span className="text-emerald-400">Peter Gollwitzer&apos;s</span> research.
          Implementation intentions increase habit follow-through by 2&ndash;3x by pre-deciding the when, where, and how.
        </p>
      </div>

      {showResult ? (
        <div className="space-y-6">
          {/* Result Card */}
          <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 rounded-2xl p-8 text-center">
            <div className="text-4xl mb-4">&#x1F3AF;</div>
            <h2 className="text-sm uppercase tracking-wider text-emerald-400 mb-4">Your Implementation Intention</h2>
            <p className="text-xl font-semibold text-white leading-relaxed">&ldquo;{statement}&rdquo;</p>
            <div className="mt-6 flex items-center justify-center gap-3 text-xs text-zinc-500">
              <span>Habit: {habitName}</span>
              <span>&middot;</span>
              <span>Cue: {cueText}</span>
              <span>&middot;</span>
              <span>{location}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleReset}
              className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors"
            >
              Create Another
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Wizard Steps */}
          <div className="flex items-center gap-2 mb-8">
            {['Habit', 'Cue', 'Location', 'Time', 'Review'].map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                  i === step ? 'bg-emerald-600 text-white' : i < step ? 'bg-emerald-600/20 text-emerald-400' : 'bg-white/[0.06] text-zinc-500'
                }`}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span className={`text-xs hidden sm:inline ${i === step ? 'text-white' : 'text-zinc-500'}`}>{label}</span>
                {i < 4 && <div className="w-4 h-px bg-white/10" />}
              </div>
            ))}
          </div>

          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6 min-h-[240px]">
            {/* Step 0: Select Habit */}
            {step === 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Which habit do you want to anchor?</h3>
                <div className="grid gap-2">
                  {habits.map((h) => (
                    <button
                      key={h.id}
                      onClick={() => setSelectedHabit(h.id)}
                      className={`text-left px-4 py-3 rounded-lg border transition-colors ${
                        selectedHabit === h.id
                          ? 'bg-emerald-600/10 border-emerald-500/30 text-white'
                          : 'bg-white/[0.03] border-white/[0.06] text-zinc-300 hover:border-white/10'
                      }`}
                    >
                      <span className="mr-2">{h.icon || '✅'}</span> {h.name}
                    </button>
                  ))}
                  <button
                    onClick={() => setSelectedHabit('__custom__')}
                    className={`text-left px-4 py-3 rounded-lg border transition-colors ${
                      selectedHabit === '__custom__'
                        ? 'bg-emerald-600/10 border-emerald-500/30 text-white'
                        : 'bg-white/[0.03] border-white/[0.06] text-zinc-300 hover:border-white/10'
                    }`}
                  >
                    + Custom habit
                  </button>
                </div>
                {selectedHabit === '__custom__' && (
                  <input
                    type="text"
                    value={customHabit}
                    onChange={(e) => setCustomHabit(e.target.value)}
                    placeholder="Enter your habit..."
                    className="w-full px-4 py-3 rounded-lg bg-white/[0.03] border border-white/10 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50"
                  />
                )}
              </div>
            )}

            {/* Step 1: Cue */}
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">&ldquo;After I ___&rdquo; &mdash; pick your trigger cue</h3>
                <div className="grid gap-2">
                  {COMMON_CUES.map((c) => (
                    <button
                      key={c}
                      onClick={() => { setCue(c); setCustomCue('') }}
                      className={`text-left px-4 py-3 rounded-lg border transition-colors ${
                        cue === c
                          ? 'bg-emerald-600/10 border-emerald-500/30 text-white'
                          : 'bg-white/[0.03] border-white/[0.06] text-zinc-300 hover:border-white/10'
                      }`}
                    >
                      After I {c}
                    </button>
                  ))}
                  <button
                    onClick={() => setCue('__custom__')}
                    className={`text-left px-4 py-3 rounded-lg border transition-colors ${
                      cue === '__custom__'
                        ? 'bg-emerald-600/10 border-emerald-500/30 text-white'
                        : 'bg-white/[0.03] border-white/[0.06] text-zinc-300 hover:border-white/10'
                    }`}
                  >
                    + Custom cue
                  </button>
                </div>
                {cue === '__custom__' && (
                  <input
                    type="text"
                    value={customCue}
                    onChange={(e) => setCustomCue(e.target.value)}
                    placeholder="After I ..."
                    className="w-full px-4 py-3 rounded-lg bg-white/[0.03] border border-white/10 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50"
                  />
                )}
              </div>
            )}

            {/* Step 2: Location */}
            {step === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Where will this happen?</h3>
                <p className="text-sm text-zinc-400">Specific locations make intentions 40% more effective.</p>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., my kitchen, the office, living room..."
                  className="w-full px-4 py-3 rounded-lg bg-white/[0.03] border border-white/10 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50"
                />
              </div>
            )}

            {/* Step 3: Time */}
            {step === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">What time?</h3>
                <p className="text-sm text-zinc-400">Pairing a specific time with a cue doubles your follow-through rate.</p>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white/[0.03] border border-white/10 text-white focus:outline-none focus:border-emerald-500/50"
                />
              </div>
            )}

            {/* Step 4: Review */}
            {step === 4 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Review your intention</h3>
                <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 rounded-xl p-6 text-center">
                  <p className="text-lg font-semibold text-white leading-relaxed">&ldquo;{statement}&rdquo;</p>
                </div>
                <button
                  onClick={handleSave}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors"
                >
                  Save Intention
                </button>
              </div>
            )}
          </div>

          {/* Navigation */}
          {step < 4 && (
            <div className="flex gap-3 mt-4">
              {step > 0 && (
                <button
                  onClick={() => setStep(step - 1)}
                  className="flex-1 py-3 rounded-xl border border-white/10 text-zinc-400 hover:text-white hover:border-white/20 transition-colors"
                >
                  Back
                </button>
              )}
              <button
                onClick={() => setStep(step + 1)}
                disabled={step === 0 && !selectedHabit}
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Saved Intentions */}
      {saved.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-semibold text-white mb-4">Saved Intentions ({saved.length})</h2>
          <div className="space-y-3">
            {saved.map((s) => (
              <div key={s.id} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 flex items-start gap-4">
                <div className="flex-1">
                  <p className="text-sm text-white font-medium">&ldquo;{s.statement}&rdquo;</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(s.id)}
                  className="text-zinc-600 hover:text-red-400 text-sm transition-colors"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
