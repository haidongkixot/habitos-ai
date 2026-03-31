'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'

interface LeaderboardEntry {
  rank: number
  name: string
  level: number
  tier: string
  xp: number
  streak: number
}

function getTier(xp: number): string {
  if (xp >= 10000) return 'Diamond'
  if (xp >= 5000) return 'Gold'
  if (xp >= 2000) return 'Silver'
  if (xp >= 500) return 'Bronze'
  return 'Starter'
}

function getTierColor(tier: string): string {
  switch (tier) {
    case 'Diamond': return 'text-cyan-400'
    case 'Gold': return 'text-yellow-400'
    case 'Silver': return 'text-gray-300'
    case 'Bronze': return 'text-amber-600'
    default: return 'text-gray-500'
  }
}

function getRankDisplay(rank: number): string {
  if (rank === 1) return '1st'
  if (rank === 2) return '2nd'
  if (rank === 3) return '3rd'
  return `${rank}th`
}

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/leaderboard')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setEntries(data.map((e: any, i: number) => ({
            rank: i + 1,
            name: e.name || 'Anonymous',
            level: e.level,
            tier: getTier(e.xp),
            xp: e.xp,
            streak: e.streak,
          })))
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Leaderboard</h1>
        <p className="text-gray-400 text-sm mt-1">Top habit builders ranked by XP</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : entries.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">🏆</div>
            <h3 className="text-white font-medium mb-1">No entries yet</h3>
            <p className="text-gray-400 text-sm">Start checking in to climb the ranks!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left text-xs text-gray-400 font-medium px-4 py-3 w-16">Rank</th>
                  <th className="text-left text-xs text-gray-400 font-medium px-4 py-3">Name</th>
                  <th className="text-center text-xs text-gray-400 font-medium px-4 py-3 w-16">Lvl</th>
                  <th className="text-center text-xs text-gray-400 font-medium px-4 py-3 w-24">Tier</th>
                  <th className="text-right text-xs text-gray-400 font-medium px-4 py-3 w-24">XP</th>
                  <th className="text-right text-xs text-gray-400 font-medium px-4 py-3 w-20">Streak</th>
                </tr>
              </thead>
              <tbody>
                {entries.map(e => (
                  <tr key={e.rank} className={`border-b border-gray-800/50 ${e.rank <= 3 ? 'bg-gray-800/30' : ''} hover:bg-gray-800/20 transition-colors`}>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-bold ${e.rank === 1 ? 'text-yellow-400' : e.rank === 2 ? 'text-gray-300' : e.rank === 3 ? 'text-amber-600' : 'text-gray-500'}`}>
                        {getRankDisplay(e.rank)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-white font-medium">{e.name}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm text-emerald-400 font-medium">{e.level}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-semibold ${getTierColor(e.tier)}`}>{e.tier}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm text-gray-300">{e.xp.toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm text-orange-400">{e.streak}d</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
