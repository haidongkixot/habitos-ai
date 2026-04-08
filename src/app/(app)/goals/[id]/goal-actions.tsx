'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  goalId: string
  status: string
}

type ActionKind = 'pause' | 'resume' | 'delete' | null

export default function GoalActions({ goalId, status }: Props) {
  const router = useRouter()
  const [confirming, setConfirming] = useState<ActionKind>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isPaused = status === 'paused'

  const runAction = async () => {
    if (!confirming || busy) return
    setBusy(true)
    setError(null)
    try {
      if (confirming === 'delete') {
        const res = await fetch(`/api/goals/${goalId}`, { method: 'DELETE' })
        if (!res.ok) throw new Error(`Delete failed (${res.status})`)
        router.push('/goals')
        router.refresh()
        return
      }
      const nextStatus = confirming === 'pause' ? 'paused' : 'active'
      const res = await fetch(`/api/goals/${goalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      })
      if (!res.ok) throw new Error(`Update failed (${res.status})`)
      setConfirming(null)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-3 text-xs text-rose-100"
        >
          {error}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <a
          href={`/goals/${goalId}/edit`}
          className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-full border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 transition-colors"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="w-3.5 h-3.5"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-5" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          Edit
        </a>
        <button
          type="button"
          onClick={() => setConfirming(isPaused ? 'resume' : 'pause')}
          className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-full border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 transition-colors"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="w-3.5 h-3.5"
            aria-hidden="true"
          >
            {isPaused ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 3l14 9-14 9V3z" />
            ) : (
              <>
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </>
            )}
          </svg>
          {isPaused ? 'Resume' : 'Pause'}
        </button>
        <button
          type="button"
          onClick={() => setConfirming('delete')}
          className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-full border border-rose-400/30 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20 transition-colors"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="w-3.5 h-3.5"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.9 12.1A2 2 0 0116.1 21H7.9a2 2 0 01-2-1.9L5 7M10 11v6M14 11v6M4 7h16M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
          </svg>
          Delete
        </button>
      </div>

      {confirming && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => !busy && setConfirming(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#1c1c22] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="confirm-title" className="text-lg font-semibold text-white mb-2">
              {confirming === 'delete'
                ? 'Delete this goal?'
                : confirming === 'pause'
                  ? 'Pause this goal?'
                  : 'Resume this goal?'}
            </h2>
            <p className="text-sm text-zinc-400 mb-6">
              {confirming === 'delete'
                ? 'This removes the goal and any coaching plans linked to it. Your habit history stays intact.'
                : confirming === 'pause'
                  ? 'Reminders will stop. You can resume at any time.'
                  : 'Reminders will restart from where you left off.'}
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirming(null)}
                disabled={busy}
                className="px-4 py-2 rounded-full text-sm border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={runAction}
                disabled={busy}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all disabled:opacity-50 ${
                  confirming === 'delete'
                    ? 'bg-rose-500/80 text-white hover:bg-rose-500'
                    : 'bg-gradient-to-r from-amber-500 to-orange-400 text-[#1c1c22]'
                }`}
              >
                {busy ? 'Working...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
