'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  planId: string
  status: string
}

type ActionKind = 'pause' | 'resume' | 'stop' | 'edit' | null

export default function PlanActions({ planId, status }: Props) {
  const router = useRouter()
  const [confirming, setConfirming] = useState<ActionKind>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isPaused = status === 'paused'
  const isStopped = status === 'stopped'

  const runAction = async () => {
    if (!confirming || busy) return
    if (confirming === 'edit') {
      setConfirming(null)
      router.push(`/plan/${planId}/edit`)
      return
    }
    setBusy(true)
    setError(null)
    try {
      const nextStatus =
        confirming === 'pause'
          ? 'paused'
          : confirming === 'resume'
            ? 'active'
            : 'stopped'
      const res = await fetch(`/api/coaching-plans/${planId}`, {
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
      <div className="flex flex-wrap gap-2 justify-end">
        {!isStopped && (
          <button
            type="button"
            onClick={() => setConfirming(isPaused ? 'resume' : 'pause')}
            className="inline-flex items-center gap-1.5 text-xs px-4 py-2 rounded-full border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 transition-colors"
          >
            {isPaused ? 'Resume plan' : 'Pause plan'}
          </button>
        )}
        {!isStopped && (
          <button
            type="button"
            onClick={() => setConfirming('stop')}
            className="inline-flex items-center gap-1.5 text-xs px-4 py-2 rounded-full border border-rose-400/30 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20 transition-colors"
          >
            Stop plan
          </button>
        )}
        <button
          type="button"
          onClick={() => setConfirming('edit')}
          className="inline-flex items-center gap-1.5 text-xs px-4 py-2 rounded-full border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 transition-colors"
        >
          Edit
        </button>
      </div>

      {confirming && confirming !== 'edit' && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => !busy && setConfirming(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#1c1c22] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-white mb-2">
              {confirming === 'stop'
                ? 'Stop this plan?'
                : confirming === 'pause'
                  ? 'Pause this plan?'
                  : 'Resume this plan?'}
            </h2>
            <p className="text-sm text-zinc-400 mb-6">
              {confirming === 'stop'
                ? 'Stopping ends the plan entirely. Your habit history stays intact. You can start a new plan from the goal.'
                : confirming === 'pause'
                  ? 'Reminders will stop. You can resume anytime.'
                  : 'Reminders will restart from where you paused.'}
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
                  confirming === 'stop'
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
