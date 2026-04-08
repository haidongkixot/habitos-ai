'use client'

import { useState } from 'react'

type Props = {
  planId: string
  habitId: string
  habitTitle: string
}

type Status = 'idle' | 'pending' | 'done' | 'error'

export default function HabitCheckinButton({ planId, habitId, habitTitle }: Props) {
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    if (status === 'pending' || status === 'done') return
    setStatus('pending')
    setError(null)
    try {
      const res = await fetch('/api/checkins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, habitId, completed: true }),
      })
      if (!res.ok) {
        throw new Error(`Check-in failed (${res.status})`)
      }
      setStatus('done')
    } catch (e) {
      setStatus('error')
      setError(e instanceof Error ? e.message : 'Check-in failed.')
    }
  }

  const isDone = status === 'done'
  const isPending = status === 'pending'

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        type="button"
        onClick={handleClick}
        disabled={isDone || isPending}
        aria-label={`Log ${habitTitle} for today`}
        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full border whitespace-nowrap transition-all ${
          isDone
            ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200 cursor-default'
            : 'border-amber-400/40 bg-amber-500/10 text-amber-100 hover:bg-amber-500/20 hover:border-amber-400/60'
        } ${isPending ? 'opacity-70' : ''} ${status === 'done' ? 'habit-checkin-pulse' : ''}`}
      >
        {isDone ? 'Logged today \u2713' : isPending ? 'Logging...' : 'Log today'}
      </button>
      {status === 'error' && error && (
        <p role="alert" className="text-[10px] text-rose-300 max-w-[180px] text-right">
          {error}
        </p>
      )}
      <style jsx>{`
        .habit-checkin-pulse {
          animation: habit-checkin-pulse 600ms ease-out;
        }
        @keyframes habit-checkin-pulse {
          0% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.45);
          }
          50% {
            transform: scale(1.06);
            box-shadow: 0 0 18px 4px rgba(16, 185, 129, 0.35);
          }
          100% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
          }
        }
      `}</style>
    </div>
  )
}
