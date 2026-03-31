'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

type Habit = {
  id: string
  name: string
  category: string
  frequency: string
  isActive: boolean
  color: string
  createdAt: string
  _count: {
    checkins: number
  }
}

type CheckIn = {
  id: string
  date: string
  completed: boolean
  mood: number | null
  note: string | null
  habit: {
    name: string
  }
}

type Achievement = {
  id: string
  achievement: string
  unlockedAt: string
}

type UserDetail = {
  id: string
  name: string | null
  email: string
  role: string
  createdAt: string
  habits: Habit[]
  checkins: CheckIn[]
  achievements: Achievement[]
}

const MOOD_EMOJI: Record<number, string> = {
  1: '😞',
  2: '😕',
  3: '😐',
  4: '🙂',
  5: '😄',
}

export default function AdminUserDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [user, setUser] = useState<UserDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'habits' | 'activity'>('habits')

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/admin/users/${id}`)
        const data = await res.json()
        setUser(data.user)
      } catch {
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    if (id) fetchUser()
  }, [id])

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500">Loading...</div>
    )
  }

  if (!user) {
    return (
      <div className="p-8 text-center text-gray-500">User not found.</div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin/users"
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors mb-4 inline-flex items-center gap-1"
        >
          ← Back to Users
        </Link>
        <div className="flex items-center gap-4 mt-2">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-lg font-bold">
            {(user.name || user.email)[0].toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{user.name || '—'}</h1>
            <p className="text-gray-400 text-sm">{user.email}</p>
          </div>
          <span
            className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              user.role === 'admin'
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-gray-700 text-gray-300'
            }`}
          >
            {user.role}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Joined {new Date(user.createdAt).toLocaleDateString()} &middot;{' '}
          {user.habits.length} habits &middot; {user.checkins.length} recent check-ins
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-800 pb-0">
        {(['habits', 'activity'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              tab === t
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Habits tab */}
      {tab === 'habits' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Habit
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
                    Completion Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {user.habits.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                      No habits yet
                    </td>
                  </tr>
                ) : (
                  user.habits.map((habit) => {
                    // Completion rate = completed checkins / total checkins * 100
                    // We only have total checkins count from _count; completed checkins
                    // aren't separated here — show total count instead, rate based on
                    // recent checkins from the user's checkins array for this habit
                    const habitCheckins = user.checkins.filter(
                      (c) => c.habit.name === habit.name
                    )
                    const completedCount = habitCheckins.filter((c) => c.completed).length
                    const totalCount = habit._count.checkins
                    // For rate: use recent checkins as sample; if none use 0
                    const rate =
                      habitCheckins.length > 0
                        ? Math.round((completedCount / habitCheckins.length) * 100)
                        : totalCount > 0
                        ? 100
                        : 0

                    return (
                      <tr key={habit.id} className="hover:bg-gray-800/40 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: habit.color }}
                            />
                            <span className="text-white font-medium">{habit.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-400 capitalize">{habit.category}</td>
                        <td className="px-6 py-4 text-gray-400 capitalize">{habit.frequency}</td>
                        <td className="px-6 py-4 text-gray-400">{totalCount}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-700 rounded-full h-1.5 w-20">
                              <div
                                className="bg-emerald-500 h-1.5 rounded-full transition-all"
                                style={{ width: `${rate}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-400 w-8">{rate}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              habit.isActive
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-gray-700 text-gray-400'
                            }`}
                          >
                            {habit.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Activity tab */}
      {tab === 'activity' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Habit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Completed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Mood
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Note
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {user.checkins.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                      No recent activity
                    </td>
                  </tr>
                ) : (
                  user.checkins.map((checkin) => (
                    <tr key={checkin.id} className="hover:bg-gray-800/40 transition-colors">
                      <td className="px-6 py-4 text-white font-medium">{checkin.habit.name}</td>
                      <td className="px-6 py-4 text-gray-400">{checkin.date}</td>
                      <td className="px-6 py-4">
                        {checkin.completed ? (
                          <span className="text-emerald-400 font-bold">✓</span>
                        ) : (
                          <span className="text-red-400 font-bold">✗</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-lg">
                        {checkin.mood ? MOOD_EMOJI[checkin.mood] || checkin.mood : '—'}
                      </td>
                      <td className="px-6 py-4 text-gray-400 max-w-xs truncate">
                        {checkin.note || '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
