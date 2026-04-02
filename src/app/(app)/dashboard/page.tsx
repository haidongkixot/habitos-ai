'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import HabitCard from '@/components/habit-card'

export default function DashboardPage() {
  const [habits, setHabits] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [coaching, setCoaching] = useState('')

  useEffect(() => {
    fetch('/api/habits').then(r => r.json()).then(d => Array.isArray(d) && setHabits(d)).catch(() => {})
    fetch('/api/progress').then(r => r.json()).then(setStats).catch(() => {})
  }, [])

  const handleToggle = async (habitId: string, checked: boolean) => {
    if (checked) {
      await fetch('/api/checkins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ habitId }),
      })
    } else {
      await fetch('/api/checkins', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ habitId }),
      })
    }
  }

  const getCoaching = async () => {
    const res = await fetch('/api/ai/coach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        habits: habits.map(h => h.name).join(', '),
        streak: stats?.currentStreak || 0,
        weeklyRate: stats?.weeklyRate || 0,
      }),
    })
    const d = await res.json()
    setCoaching(d.coaching)
  }

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  const completedToday = habits.filter(h => h.checkins?.length > 0).length

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Today</h1>
          <p className="text-zinc-400 mt-1">{today}</p>
        </div>
        <Link href="/habits/new" className="bg-gradient-to-r from-emerald-500 to-teal-400 hover:shadow-[0_0_25px_rgba(16,185,129,0.3)] text-white px-5 py-2 rounded-full text-sm font-semibold transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)]">
          + New Habit
        </Link>
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Today', value: `${completedToday}/${habits.length}`, icon: '✅' },
            { label: 'Streak', value: `${stats.currentStreak}d`, icon: '🔥' },
            { label: 'Weekly', value: `${stats.weeklyRate}%`, icon: '📊' },
            { label: 'Total', value: stats.totalCheckins, icon: '🏆' },
          ].map(s => (
            <div key={s.label} className="bg-[#1c1c22]/80 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-4 hover:border-emerald-500/20 hover:shadow-[0_0_30px_rgba(16,185,129,0.06)] transition-all duration-300">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-xl font-bold text-white">{s.value}</div>
              <div className="text-xs text-zinc-400">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Your Habits</h2>
        {habits.length > 0 ? habits.map(h => (
          <HabitCard
            key={h.id}
            id={h.id}
            name={h.name}
            category={h.category}
            color={h.color}
            checkedToday={h.checkins?.length > 0}
            totalCheckins={h._count?.checkins || 0}
            onToggle={handleToggle}
          />
        )) : (
          <div className="bg-[#1c1c22]/80 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-8 text-center">
            <div className="text-4xl mb-3">🌱</div>
            <h3 className="text-white font-medium mb-1">No habits yet</h3>
            <p className="text-zinc-400 text-sm mb-4">Start by creating your first habit</p>
            <Link href="/habits/new" className="inline-block bg-gradient-to-r from-emerald-500 to-teal-400 hover:shadow-[0_0_25px_rgba(16,185,129,0.3)] text-white px-6 py-2 rounded-full text-sm font-semibold transition-all">
              Create First Habit
            </Link>
          </div>
        )}
      </div>

      <div className="bg-[#1c1c22]/80 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white">AI Coach</h2>
          <button onClick={getCoaching} className="text-emerald-400 text-sm hover:text-emerald-300 transition-colors">Get Advice</button>
        </div>
        {coaching ? (
          <p className="text-zinc-300 text-sm">{coaching}</p>
        ) : (
          <p className="text-zinc-500 text-sm">Click &quot;Get Advice&quot; for personalized habit coaching.</p>
        )}
      </div>
    </div>
  )
}
