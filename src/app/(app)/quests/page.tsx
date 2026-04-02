'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'

interface Quest {
  id: string
  questType: string
  description: string
  xpReward: number
  completed: boolean
}

function getQuestIcon(type: string): string {
  switch (type) {
    case 'complete_checkin': return '✅'
    case 'streak_day': return '🔥'
    case 'try_category': return '🎯'
    default: return '⭐'
  }
}

export default function QuestsPage() {
  const [quests, setQuests] = useState<Quest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/quests')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setQuests(data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const completedCount = quests.filter(q => q.completed).length
  const totalXp = quests.reduce((sum, q) => sum + q.xpReward, 0)
  const earnedXp = quests.filter(q => q.completed).reduce((sum, q) => sum + q.xpReward, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Daily Quests</h1>
          <p className="text-gray-400 text-sm mt-1">Complete quests to earn bonus XP</p>
        </div>
        <div className="text-right">
          <div className="text-emerald-400 font-bold text-lg">{earnedXp}/{totalXp} XP</div>
          <div className="text-gray-400 text-xs">{completedCount}/{quests.length} completed</div>
        </div>
      </div>

      {/* Overall progress */}
      <div className="card card-hover">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-300">Daily Progress</span>
          <span className="text-sm text-emerald-400 font-medium">
            {quests.length > 0 ? Math.round((completedCount / quests.length) * 100) : 0}%
          </span>
        </div>
        <div className="w-full bg-white/5 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-emerald-500 to-teal-400 h-3 rounded-full transition-all duration-500"
            style={{ width: quests.length > 0 ? `${(completedCount / quests.length) * 100}%` : '0%' }}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : quests.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-3">🎯</div>
          <h3 className="text-white font-medium mb-1">No quests available</h3>
          <p className="text-gray-400 text-sm">Check back soon for new daily quests!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {quests.map(q => (
            <div
              key={q.id}
              className={`card card-hover transition-colors ${
                q.completed ? 'border-emerald-500/30 bg-emerald-500/5' : ''
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="text-2xl flex-shrink-0">{getQuestIcon(q.questType)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-medium ${q.completed ? 'text-emerald-400' : 'text-white'}`}>
                      {q.description}
                    </p>
                    {q.completed && (
                      <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  {/* Progress bar per quest */}
                  <div className="mt-2 w-full bg-white/5 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-500 ${q.completed ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-white/10'}`}
                      style={{ width: q.completed ? '100%' : '0%' }}
                    />
                  </div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <span className={`text-sm font-bold ${q.completed ? 'text-emerald-400' : 'text-yellow-400'}`}>
                    +{q.xpReward} XP
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {completedCount === quests.length && quests.length > 0 && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 text-center">
          <div className="text-4xl mb-2">🎉</div>
          <h3 className="text-emerald-400 font-bold text-lg">All Quests Complete!</h3>
          <p className="text-gray-300 text-sm mt-1">You earned {totalXp} XP today. Come back tomorrow for new quests!</p>
        </div>
      )}
    </div>
  )
}
