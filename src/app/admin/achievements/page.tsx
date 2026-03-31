'use client'

import { useEffect, useState } from 'react'

type Achievement = {
  id: string
  achievement: string
  unlockedAt: string
  user: {
    name: string | null
    email: string
  }
}

export default function AdminAchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAchievements = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/admin/achievements')
        const data = await res.json()
        setAchievements(data.achievements || [])
      } catch {
        setAchievements([])
      } finally {
        setLoading(false)
      }
    }
    fetchAchievements()
  }, [])

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Achievements</h1>
        <p className="text-gray-400 text-sm mt-1">
          All unlocked achievements &mdash;{' '}
          <span className="text-emerald-400 font-semibold">{achievements.length}</span> total
        </p>
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
                  Achievement
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Unlocked At
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-10 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : achievements.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-10 text-center text-gray-500">
                    No achievements unlocked yet
                  </td>
                </tr>
              ) : (
                achievements.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-800/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-white text-sm font-medium">{a.user.name || '—'}</div>
                      <div className="text-gray-500 text-xs">{a.user.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🏆</span>
                        <span className="text-amber-400 font-medium">{a.achievement}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-400">
                      {new Date(a.unlockedAt).toLocaleString()}
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
