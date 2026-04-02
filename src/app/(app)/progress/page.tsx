'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'

export default function ProgressPage() {
  const [data, setData] = useState<any>(null)
  useEffect(() => { fetch('/api/progress').then(r => r.json()).then(setData).catch(() => {}) }, [])

  if (!data) return <div className="text-gray-400 text-center py-12">Loading progress...</div>

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Your Progress</h1>
        <p className="text-gray-400 mt-1">Track your habit-building journey</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Active Habits', value: data.totalHabits, color: 'text-emerald-400' },
          { label: 'Total Check-ins', value: data.totalCheckins, color: 'text-emerald-400' },
          { label: 'Current Streak', value: `${data.currentStreak}d`, color: 'text-orange-400' },
          { label: 'Weekly Rate', value: `${data.weeklyRate}%`, color: 'text-blue-400' },
        ].map(s => (
          <div key={s.label} className="card card-hover p-4">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {data.avgMood !== null && (
        <div className="card card-hover">
          <h2 className="text-lg font-semibold text-white mb-2">Mood Tracker</h2>
          <div className="flex items-center gap-4">
            <div className="text-4xl">
              {data.avgMood >= 4 ? '😊' : data.avgMood >= 3 ? '🙂' : data.avgMood >= 2 ? '😐' : '😔'}
            </div>
            <div>
              <div className="text-xl font-bold text-white">{data.avgMood}/5</div>
              <div className="text-sm text-gray-400">Average mood from check-ins</div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card card-hover">
          <h2 className="text-lg font-semibold text-white mb-4">Category Breakdown</h2>
          {Object.keys(data.categoryStats || {}).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(data.categoryStats as Record<string, { total: number; completed: number }>).map(([cat, stats]) => (
                <div key={cat} className="flex items-center justify-between">
                  <span className="text-sm text-gray-300 capitalize">{cat}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                        style={{ width: `${stats.total > 0 ? Math.round((stats.completed / (stats.total * 7)) * 100) : 0}%` }} />
                    </div>
                    <span className="text-xs text-gray-400">{stats.total} habits</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No data yet</p>
          )}
        </div>

        <div className="card card-hover">
          <h2 className="text-lg font-semibold text-white mb-4">Achievements</h2>
          {data.achievements?.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {data.achievements.map((a: any) => (
                <div key={a.id} className="bg-white/5 border border-white/10 rounded-xl p-3">
                  <div className="text-lg">🏅</div>
                  <div className="text-sm font-medium text-white mt-1">{a.achievement}</div>
                  <div className="text-xs text-gray-400">{new Date(a.unlockedAt).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Complete habits to earn achievements!</p>
          )}
        </div>
      </div>
    </div>
  )
}
