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
    <div className="bg-[#0c0c0f]/80 backdrop-blur-xl border-b border-white/[0.06] px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center gap-6 text-sm">
        {/* Level badge */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center shadow-[0_0_12px_rgba(16,185,129,0.3)]">
            <span className="text-white font-bold text-xs">{stats.level}</span>
          </div>
          <span className="text-zinc-400 text-xs hidden sm:block">Level {stats.level}</span>
        </div>

        {/* XP bar */}
        <div className="flex-1 max-w-xs flex items-center gap-2">
          <span className="text-zinc-500 text-xs whitespace-nowrap">{stats.xpInCurrentLevel}/{stats.xpForNextLevel} XP</span>
          <div className="flex-1 bg-white/10 rounded-full h-1.5">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-1.5 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
              style={{ width: `${stats.progressPercent}%` }}
            />
          </div>
        </div>

        {/* Streak */}
        {stats.currentStreak > 0 && (
          <Link href="/quests" className="flex items-center gap-1 text-amber-400 hover:text-amber-300 transition-colors">
            <span>🔥</span>
            <span className="font-bold text-xs">{stats.currentStreak}d</span>
            <span className="text-zinc-500 text-xs hidden sm:block">streak</span>
          </Link>
        )}

        {/* Quests link */}
        <Link href="/quests" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors hidden sm:block">
          Daily Quests →
        </Link>

        {/* Leaderboard link */}
        <Link href="/leaderboard" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors hidden sm:block">
          🏆 Leaderboard
        </Link>
      </div>
    </div>
  )
}
