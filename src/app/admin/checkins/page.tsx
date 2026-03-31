'use client'

import { useEffect, useState } from 'react'

type CheckIn = {
  id: string
  date: string
  completed: boolean
  mood: number | null
  note: string | null
  user: {
    name: string | null
    email: string
  }
  habit: {
    name: string
  }
}

const MOOD_EMOJI: Record<number, string> = {
  1: '😞',
  2: '😕',
  3: '😐',
  4: '🙂',
  5: '😄',
}

export default function AdminCheckInsPage() {
  const [checkins, setCheckins] = useState<CheckIn[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [completedFilter, setCompletedFilter] = useState<'all' | 'yes' | 'no'>('all')

  const fetchCheckins = async (p: number, completed: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/checkins?page=${p}&completed=${completed}`)
      const data = await res.json()
      setCheckins(data.checkins || [])
      setTotalPages(data.totalPages || 1)
      setTotal(data.total || 0)
    } catch {
      setCheckins([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCheckins(page, completedFilter)
  }, [page, completedFilter])

  const handleFilterChange = (f: 'all' | 'yes' | 'no') => {
    setCompletedFilter(f)
    setPage(1)
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Check-ins</h1>
        <p className="text-gray-400 text-sm mt-1">
          Recent check-in activity &mdash; {total} total
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {(['all', 'yes', 'no'] as const).map((f) => (
          <button
            key={f}
            onClick={() => handleFilterChange(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
              completedFilter === f
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'
            }`}
          >
            {f === 'all' ? 'All' : f === 'yes' ? 'Completed' : 'Not Completed'}
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
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : checkins.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                    No check-ins found
                  </td>
                </tr>
              ) : (
                checkins.map((ci) => (
                  <tr key={ci.id} className="hover:bg-gray-800/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-white text-sm font-medium">{ci.user.name || '—'}</div>
                      <div className="text-gray-500 text-xs">{ci.user.email}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-300 font-medium">{ci.habit.name}</td>
                    <td className="px-6 py-4 text-gray-400">{ci.date}</td>
                    <td className="px-6 py-4">
                      {ci.completed ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold text-base">
                          ✓
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-400 font-semibold text-base">
                          ✗
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-lg">
                      {ci.mood ? MOOD_EMOJI[ci.mood] || ci.mood : <span className="text-gray-600 text-sm">—</span>}
                    </td>
                    <td className="px-6 py-4 text-gray-400 max-w-xs truncate">
                      {ci.note || <span className="text-gray-600">—</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800">
            <div className="text-xs text-gray-500">
              Page {page} of {totalPages} &mdash; {total} records
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-800 text-gray-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-800 text-gray-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
