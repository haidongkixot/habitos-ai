'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function HabitsPage() {
  const [habits, setHabits] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/habits').then(r => r.json()).then(d => Array.isArray(d) && setHabits(d))
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">My Habits</h1>
          <p className="text-gray-400 mt-1">Manage your daily routines</p>
        </div>
        <Link href="/habits/new" className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm">+ New Habit</Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {habits.map(h => (
          <div key={h.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: h.color }} />
              <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">{h.frequency}</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">{h.name}</h3>
            <p className="text-gray-400 text-sm mb-3">{h.description || 'No description'}</p>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>{h.category}</span>
              <span>{h._count?.checkins || 0} check-ins</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}