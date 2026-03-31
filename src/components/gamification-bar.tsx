'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface GamStats {
  xp: number
  level: number
  xpInCurrentLevel: number
  xpForNextLevel: number
  progressPercent: number
  currentStreak: number
}

export default function GamificationBar() {
  const [stats, setStats] = useState<GamStats | null>(null)

  useEffect(() => {
    fetch('/api/gamification').then(r => r.json()).then(d => {
      if (d.level) setStats(d)
    }).catch(() => {})
  }, [])

  if (!stats) return null

  return (
    <div className="bg-gray-900 border-b border-gray-800 px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center gap-6 text-sm">
        {/* Level badge */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center">
            <span className="text-emerald-400 font-bold text-xs">{stats.level}</span>
          </div>
          <span className="text-gray-400 text-xs hidden sm:block">Level {stats.level}</span>
        </div>

        {/* XP bar */}
        <div className="flex-1 max-w-xs flex items-center gap-2">
          <span className="text-gray-500 text-xs whitespace-nowrap">{stats.xpInCurrentLevel}/{stats.xpForNextLevel} XP</span>
          <div className="flex-1 bg-gray-800 rounded-full h-1.5">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${stats.progressPercent}%` }}
            />
          </div>
        </div>

        {/* Streak */}
        {stats.currentStreak > 0 && (
          <Link href="/quests" className="flex items-center gap-1 text-orange-400 hover:text-orange-300 transition-colors">
            <span>🔥</span>
            <span className="font-semibold text-xs">{stats.currentStreak}d</span>
            <span className="text-gray-500 text-xs hidden sm:block">streak</span>
          </Link>
        )}

        {/* Quests link */}
        <Link href="/quests" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors hidden sm:block">
          Daily Quests →
        </Link>

        {/* Leaderboard link */}
        <Link href="/leaderboard" className="text-xs text-gray-500 hover:text-gray-300 transition-colors hidden sm:block">
          🏆 Leaderboard
        </Link>
      </div>
    </div>
  )
}
