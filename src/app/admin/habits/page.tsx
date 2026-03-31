'use client'

import { useEffect, useState } from 'react'

type Habit = {
  id: string
  name: string
  category: string
  frequency: string
  isActive: boolean
  createdAt: string
  user: {
    name: string | null
    email: string
  }
  _count: {
    checkins: number
  }
}

const CATEGORIES = ['all', 'wellness', 'fitness', 'learning', 'health', 'productivity'] as const

const CATEGORY_COLORS: Record<string, string> = {
  wellness: 'bg-blue-500/20 text-blue-400',
  fitness: 'bg-orange-500/20 text-orange-400',
  learning: 'bg-violet-500/20 text-violet-400',
  health: 'bg-emerald-500/20 text-emerald-400',
  productivity: 'bg-amber-500/20 text-amber-400',
  general: 'bg-gray-500/20 text-gray-400',
}

const FREQUENCY_COLORS: Record<string, string> = {
  daily: 'bg-emerald-500/20 text-emerald-400',
  weekly: 'bg-blue-500/20 text-blue-400',
}

export default function AdminHabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [category, setCategory] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)

  const fetchHabits = async (cat: string) => {
    setLoading(true)
    try {
      const url = cat === 'all' ? '/api/admin/habits' : `/api/admin/habits?category=${cat}`
      const res = await fetch(url)
      const data = await res.json()
      setHabits(data.habits || [])
    } catch {
      setHabits([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHabits(category)
  }, [category])

  const handleToggle = async (habit: Habit) => {
    setToggling(habit.id)
    try {
      const res = await fetch('/api/admin/habits', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: habit.id, isActive: !habit.isActive }),
      })
      if (res.ok) {
        setHabits((prev) =>
          prev.map((h) => (h.id === habit.id ? { ...h, isActive: !habit.isActive } : h))
        )
      }
    } finally {
      setToggling(null)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Habits</h1>
        <p className="text-gray-400 text-sm mt-1">All habits across the platform</p>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
              category === cat
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Habit Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Frequency
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Check-ins
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Active
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : habits.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                    No habits found
                  </td>
                </tr>
              ) : (
                habits.map((habit) => (
                  <tr key={habit.id} className="hover:bg-gray-800/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-white text-sm font-medium">{habit.user.name || '—'}</div>
                      <div className="text-gray-500 text-xs">{habit.user.email}</div>
                    </td>
                    <td className="px-6 py-4 text-white font-medium">{habit.name}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                          CATEGORY_COLORS[habit.category] || 'bg-gray-700 text-gray-300'
                        }`}
                      >
                        {habit.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                          FREQUENCY_COLORS[habit.frequency] || 'bg-gray-700 text-gray-300'
                        }`}
                      >
                        {habit.frequency}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400">{habit._count.checkins}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggle(habit)}
                        disabled={toggling === habit.id}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
                          habit.isActive ? 'bg-emerald-500' : 'bg-gray-600'
                        }`}
                        aria-label={habit.isActive ? 'Deactivate habit' : 'Activate habit'}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            habit.isActive ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
