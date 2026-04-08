'use client'

import { useState } from 'react'

export type ReminderItem = {
  id: string
  type?: string | null
  title?: string | null
  body?: string | null
  channel?: string | null // 'email' | 'push' | 'in-app'
  scheduledFor?: string | null // ISO
  status?: string | null // 'pending' | 'sent' | 'cancelled' | ...
  sentAt?: string | null
}

type Props = {
  reminder: ReminderItem
  onCancel?: (id: string) => Promise<void> | void
  cancellable?: boolean
}

const TYPE_ICONS: Record<string, string> = {
  'daily-habits': 'D',
  'weekly-checkins': 'W',
  milestones: 'M',
  'missed-streak': 'S',
  'momentum-drop': 'N',
  custom: 'C',
}

function iconFor(type?: string | null): string {
  if (!type) return 'R'
  return TYPE_ICONS[type] ?? type.charAt(0).toUpperCase()
}

function relativeTime(iso?: string | null): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const diffMs = date.getTime() - Date.now()
  const abs = Math.abs(diffMs)
  const mins = Math.round(abs / 60000)
  const hours = Math.round(abs / 3600000)
  const days = Math.round(abs / 86400000)
  const forward = diffMs >= 0
  if (mins < 1) return forward ? 'now' : 'just now'
  if (mins < 60) return forward ? `in ${mins}m` : `${mins}m ago`
  if (hours < 24) return forward ? `in ${hours}h` : `${hours}h ago`
  if (days < 14) return forward ? `in ${days}d` : `${days}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function channelBadge(channel?: string | null): string {
  const c = (channel ?? 'in-app').toLowerCase()
  if (c === 'push') return 'bg-amber-500/15 text-amber-200 border-amber-400/30'
  if (c === 'email') return 'bg-sky-500/15 text-sky-200 border-sky-400/30'
  return 'bg-white/5 text-zinc-300 border-white/10'
}

export default function ReminderRow({ reminder, onCancel, cancellable = true }: Props) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCancel() {
    if (!onCancel || busy) return
    setBusy(true)
    setError(null)
    try {
      await onCancel(reminder.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not cancel reminder.')
    } finally {
      setBusy(false)
    }
  }

  const scheduledLabel =
    reminder.status === 'sent' && reminder.sentAt
      ? relativeTime(reminder.sentAt)
      : relativeTime(reminder.scheduledFor)

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-4 flex items-start gap-4">
      <div
        aria-hidden="true"
        className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/30 to-orange-400/20 border border-amber-400/30 flex items-center justify-center text-sm font-bold text-amber-200"
      >
        {iconFor(reminder.type)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-white truncate">
            {reminder.title || 'Untitled reminder'}
          </p>
          {reminder.channel && (
            <span
              className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${channelBadge(
                reminder.channel,
              )}`}
            >
              {reminder.channel}
            </span>
          )}
          {reminder.status && reminder.status !== 'pending' && (
            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 text-zinc-400 border border-white/10">
              {reminder.status}
            </span>
          )}
        </div>
        {reminder.body && (
          <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{reminder.body}</p>
        )}
        {scheduledLabel && (
          <p className="text-[11px] text-zinc-500 mt-1">{scheduledLabel}</p>
        )}
        {error && (
          <p role="alert" className="text-[11px] text-rose-300 mt-1">
            {error}
          </p>
        )}
      </div>
      {cancellable && onCancel && reminder.status !== 'sent' && (
        <button
          type="button"
          onClick={handleCancel}
          disabled={busy}
          aria-label={`Cancel reminder ${reminder.title ?? ''}`}
          className="shrink-0 w-8 h-8 rounded-full border border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-50 flex items-center justify-center"
        >
          <span aria-hidden="true">x</span>
        </button>
      )}
    </div>
  )
}
