'use client'
import { useState } from 'react'

interface HabitProps {
  id: string
  name: string
  category: string
  color: string
  checkedToday: boolean
  totalCheckins: number
  onToggle: (habitId: string, checked: boolean) => void
}

const CATEGORY_ICONS: Record<string, string> = {
  health: '💪', mindfulness: '🧘', learning: '📚', fitness: '🏃',
  nutrition: '🥗', sleep: '😴', social: '👥', creativity: '🎨',
  productivity: '⚡', general: '✨',
}

export default function HabitCard({ id, name, category, color, checkedToday, totalCheckins, onToggle }: HabitProps) {
  const [checked, setChecked] = useState(checkedToday)
  const [animating, setAnimating] = useState(false)

  const handleToggle = () => {
    setAnimating(true)
    setChecked(!checked)
    onToggle(id, !checked)
    setTimeout(() => setAnimating(false), 500)
  }

  return (
    <div className={`bg-[#1c1c22]/80 backdrop-blur-sm border rounded-2xl p-4 transition-all duration-300 ${checked ? 'border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.08)]' : 'border-white/[0.06] hover:border-white/10'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggle}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
              checked ? 'bg-gradient-to-br from-emerald-500 to-teal-400 scale-110 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-white/5 border-2 border-white/10 hover:border-emerald-400/50'
            } ${animating ? 'animate-bounce' : ''}`}
          >
            {checked ? (
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            ) : null}
          </button>
          <div>
            <h3 className={`font-medium ${checked ? 'text-emerald-400 line-through' : 'text-white'}`}>{name}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs">{CATEGORY_ICONS[category] || '✨'}</span>
              <span className="text-xs text-zinc-400">{category}</span>
              <span className="text-xs text-zinc-600">·</span>
              <span className="text-xs text-zinc-400">{totalCheckins} check-ins</span>
            </div>
          </div>
        </div>
        <div className="w-2 h-8 rounded-full" style={{ backgroundColor: color, opacity: checked ? 1 : 0.3 }} />
      </div>
    </div>
  )
}
