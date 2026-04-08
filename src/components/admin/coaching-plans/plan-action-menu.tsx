'use client'

/**
 * HabitOS M5 — Plan action menu.
 *
 * Provides pause / resume / stop / delete with:
 *   - reason prompt (textarea in the confirm dialog)
 *   - confirmation dialog overlay
 *   - loading state per action
 *
 * All network calls are owned by the parent via the onAction handler
 * so this component stays presentational and testable.
 */

import { useState, useEffect, useRef } from 'react'

export type PlanAction = 'pause' | 'resume' | 'stop' | 'delete'

type Props = {
  status: string
  onAction: (action: PlanAction, reason: string) => Promise<void> | void
  disabled?: boolean
}

const ACTION_META: Record<
  PlanAction,
  {
    label: string
    description: string
    requiresReason: boolean
    confirmTone: 'amber' | 'emerald' | 'rose'
  }
> = {
  pause: {
    label: 'Pause plan',
    description:
      'Temporarily pause this plan. Reminders will stop until resumed.',
    requiresReason: true,
    confirmTone: 'amber',
  },
  resume: {
    label: 'Resume plan',
    description: 'Reactivate this plan. Reminders will resume on schedule.',
    requiresReason: false,
    confirmTone: 'emerald',
  },
  stop: {
    label: 'Stop plan',
    description:
      'Mark this plan as permanently stopped. It can still be viewed in history.',
    requiresReason: true,
    confirmTone: 'rose',
  },
  delete: {
    label: 'Delete plan',
    description:
      'Permanently remove this plan and all associated data. This cannot be undone.',
    requiresReason: true,
    confirmTone: 'rose',
  },
}

const TONE_CLASSES: Record<'amber' | 'emerald' | 'rose', string> = {
  amber: 'bg-amber-500 hover:bg-amber-400 text-gray-950',
  emerald: 'bg-emerald-500 hover:bg-emerald-400 text-gray-950',
  rose: 'bg-rose-500 hover:bg-rose-400 text-white',
}

export function PlanActionMenu({ status, onAction, disabled = false }: Props) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState<PlanAction | null>(null)
  const [confirming, setConfirming] = useState<PlanAction | null>(null)
  const [reason, setReason] = useState('')
  const menuRef = useRef<HTMLDivElement | null>(null)

  // Close menu when clicking outside.
  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const availableActions: PlanAction[] = (() => {
    const actions: PlanAction[] = []
    if (status === 'active') actions.push('pause', 'stop')
    else if (status === 'paused') actions.push('resume', 'stop')
    else if (status === 'stopped' || status === 'complete')
      actions.push('resume')
    actions.push('delete')
    return actions
  })()

  const handleRequestAction = (action: PlanAction) => {
    setOpen(false)
    setReason('')
    setConfirming(action)
  }

  const handleConfirm = async () => {
    if (!confirming) return
    const meta = ACTION_META[confirming]
    if (meta.requiresReason && reason.trim().length === 0) return
    setPending(confirming)
    try {
      await onAction(confirming, reason.trim())
      setConfirming(null)
      setReason('')
    } finally {
      setPending(null)
    }
  }

  const handleCancel = () => {
    if (pending) return
    setConfirming(null)
    setReason('')
  }

  const confirmMeta = confirming ? ACTION_META[confirming] : null

  return (
    <>
      <div className="relative inline-block text-left" ref={menuRef}>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((o) => !o)}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm font-medium text-white border border-gray-700 transition-colors disabled:opacity-50"
        >
          Actions
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-lg bg-gray-900 border border-gray-700 shadow-lg z-20">
            <div className="py-1">
              {availableActions.map((action) => {
                const meta = ACTION_META[action]
                const isDanger = meta.confirmTone === 'rose'
                return (
                  <button
                    key={action}
                    type="button"
                    onClick={() => handleRequestAction(action)}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                      isDanger
                        ? 'text-rose-400 hover:bg-rose-500/10'
                        : 'text-gray-200 hover:bg-gray-800'
                    }`}
                  >
                    {meta.label}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {confirming && confirmMeta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-xl bg-gray-900 border border-gray-700 p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-2">
              {confirmMeta.label}
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              {confirmMeta.description}
            </p>

            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Reason{' '}
              {confirmMeta.requiresReason ? (
                <span className="text-rose-400">(required)</span>
              ) : (
                <span className="text-gray-500">(optional)</span>
              )}
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Why are you taking this action?"
              className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 resize-none"
            />

            <div className="flex justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={handleCancel}
                disabled={!!pending}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 border border-gray-700 hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={
                  !!pending ||
                  (confirmMeta.requiresReason && reason.trim().length === 0)
                }
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  TONE_CLASSES[confirmMeta.confirmTone]
                }`}
              >
                {pending ? 'Working...' : `Confirm ${confirmMeta.label.toLowerCase()}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default PlanActionMenu
