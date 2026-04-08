'use client'

import { useEffect, useMemo, useState } from 'react'
import { registerForPush, unregisterFromPush } from '@/components/push/push-registration'

export type ReminderType =
  | 'daily-habits'
  | 'weekly-checkins'
  | 'milestones'
  | 'missed-streak'
  | 'momentum-drop'

export type NotificationPreferences = {
  emailEnabled: boolean
  pushEnabled: boolean
  inAppEnabled: boolean
  quietHoursStart: string // "HH:mm"
  quietHoursEnd: string // "HH:mm"
  timezone: string // IANA
  reminderTypes: ReminderType[]
}

const DEFAULTS: NotificationPreferences = {
  emailEnabled: true,
  pushEnabled: false,
  inAppEnabled: true,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  timezone: 'UTC',
  reminderTypes: ['daily-habits', 'weekly-checkins', 'milestones'],
}

const COMMON_TIMEZONES: string[] = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Berlin',
  'Europe/Paris',
  'Europe/Madrid',
  'Europe/Istanbul',
  'Africa/Johannesburg',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Bangkok',
  'Asia/Singapore',
  'Asia/Hong_Kong',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Australia/Sydney',
  'Pacific/Auckland',
]

const REMINDER_TYPE_LABELS: Record<ReminderType, { label: string; description: string }> = {
  'daily-habits': {
    label: 'Daily habits',
    description: 'Morning nudge for today\u2019s habit stack.',
  },
  'weekly-checkins': {
    label: 'Weekly check-ins',
    description: 'Sunday reflection prompt from your coach.',
  },
  milestones: {
    label: 'Milestones',
    description: 'Celebrate when you cross a milestone or streak level.',
  },
  'missed-streak': {
    label: 'Missed-streak recovery',
    description: 'Gentle nudge if you break a streak so you can reset fast.',
  },
  'momentum-drop': {
    label: 'Momentum drop',
    description: 'Heads-up when your momentum score starts to dip.',
  },
}

type Props = {
  initial: Partial<NotificationPreferences>
}

function mergeDefaults(initial: Partial<NotificationPreferences>): NotificationPreferences {
  return {
    ...DEFAULTS,
    ...initial,
    reminderTypes:
      Array.isArray(initial.reminderTypes) && initial.reminderTypes.length > 0
        ? (initial.reminderTypes as ReminderType[])
        : DEFAULTS.reminderTypes,
  }
}

export default function NotificationPreferencesForm({ initial }: Props) {
  const merged = useMemo(() => mergeDefaults(initial), [initial])
  const [prefs, setPrefs] = useState<NotificationPreferences>(merged)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  const [pushBusy, setPushBusy] = useState(false)

  // Browser timezone detection on first mount — only apply if server didn't send one.
  useEffect(() => {
    if (initial.timezone) return
    try {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone
      if (detected) {
        setPrefs((p) => ({ ...p, timezone: detected }))
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-hide toast
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  const timezoneOptions = useMemo(() => {
    if (prefs.timezone && !COMMON_TIMEZONES.includes(prefs.timezone)) {
      return [prefs.timezone, ...COMMON_TIMEZONES]
    }
    return COMMON_TIMEZONES
  }, [prefs.timezone])

  async function handlePushToggle(next: boolean) {
    setPushBusy(true)
    try {
      if (next) {
        const result = await registerForPush()
        if (result.ok) {
          setPrefs((p) => ({ ...p, pushEnabled: true }))
          setToast({ kind: 'ok', text: 'Push notifications enabled.' })
        } else {
          setPrefs((p) => ({ ...p, pushEnabled: false }))
          setToast({ kind: 'err', text: result.message })
        }
      } else {
        await unregisterFromPush()
        setPrefs((p) => ({ ...p, pushEnabled: false }))
        setToast({ kind: 'ok', text: 'Push notifications disabled.' })
      }
    } finally {
      setPushBusy(false)
    }
  }

  function toggleReminder(type: ReminderType) {
    setPrefs((p) => {
      const set = new Set(p.reminderTypes)
      if (set.has(type)) set.delete(type)
      else set.add(type)
      return { ...p, reminderTypes: Array.from(set) as ReminderType[] }
    })
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setToast(null)
    try {
      const res = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      })
      if (!res.ok) {
        throw new Error(`Save failed (${res.status})`)
      }
      setToast({ kind: 'ok', text: 'Preferences saved.' })
    } catch (err) {
      setToast({
        kind: 'err',
        text: err instanceof Error ? err.message : 'Could not save preferences.',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Channels */}
      <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Channels</h2>
          <p className="text-xs text-zinc-500 mt-1">Where HabitOS is allowed to reach you.</p>
        </div>

        <ToggleRow
          label="Email"
          description="Reminders and weekly digests delivered to your inbox."
          checked={prefs.emailEnabled}
          onChange={(v) => setPrefs((p) => ({ ...p, emailEnabled: v }))}
        />
        <ToggleRow
          label="Push"
          description="Web push notifications on this device. Requires browser permission."
          checked={prefs.pushEnabled}
          disabled={pushBusy}
          onChange={handlePushToggle}
        />
        <ToggleRow
          label="In-app"
          description="Notifications inside HabitOS while you\u2019re using the app."
          checked={prefs.inAppEnabled}
          onChange={(v) => setPrefs((p) => ({ ...p, inAppEnabled: v }))}
        />
      </section>

      {/* Quiet hours */}
      <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Quiet hours</h2>
          <p className="text-xs text-zinc-500 mt-1">
            Reminders scheduled during this window will be held until quiet hours end.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-xs uppercase tracking-wider text-zinc-500">Start</span>
            <input
              type="time"
              value={prefs.quietHoursStart}
              onChange={(e) => setPrefs((p) => ({ ...p, quietHoursStart: e.target.value }))}
              className="mt-1 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-amber-400/50 focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-wider text-zinc-500">End</span>
            <input
              type="time"
              value={prefs.quietHoursEnd}
              onChange={(e) => setPrefs((p) => ({ ...p, quietHoursEnd: e.target.value }))}
              className="mt-1 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-amber-400/50 focus:outline-none"
            />
          </label>
        </div>
      </section>

      {/* Timezone */}
      <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Timezone</h2>
          <p className="text-xs text-zinc-500 mt-1">
            Reminders fire in your local time based on this zone.
          </p>
        </div>
        <label className="block">
          <span className="text-xs uppercase tracking-wider text-zinc-500">IANA zone</span>
          <select
            value={prefs.timezone}
            onChange={(e) => setPrefs((p) => ({ ...p, timezone: e.target.value }))}
            className="mt-1 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-amber-400/50 focus:outline-none"
          >
            {timezoneOptions.map((tz) => (
              <option key={tz} value={tz} className="bg-[#1c1c22]">
                {tz}
              </option>
            ))}
          </select>
        </label>
      </section>

      {/* Reminder types */}
      <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Reminder types</h2>
          <p className="text-xs text-zinc-500 mt-1">
            Turn individual reminder categories on or off.
          </p>
        </div>
        <div className="space-y-3">
          {(Object.keys(REMINDER_TYPE_LABELS) as ReminderType[]).map((type) => {
            const meta = REMINDER_TYPE_LABELS[type]
            return (
              <ToggleRow
                key={type}
                label={meta.label}
                description={meta.description}
                checked={prefs.reminderTypes.includes(type)}
                onChange={() => toggleReminder(type)}
              />
            )
          })}
        </div>
      </section>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="text-xs text-zinc-500">
          Changes apply the next time a reminder is scheduled.
        </div>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-1.5 text-sm font-semibold px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-400 text-[#1c1c22] shadow-[0_0_24px_rgba(245,158,11,0.25)] hover:shadow-[0_0_32px_rgba(245,158,11,0.35)] transition-all disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save preferences'}
        </button>
      </div>

      {toast && (
        <div
          role="status"
          className={`rounded-xl border p-3 text-xs ${
            toast.kind === 'ok'
              ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100'
              : 'border-rose-400/30 bg-rose-500/10 text-rose-100'
          }`}
        >
          {toast.text}
        </div>
      )}
    </form>
  )
}

function ToggleRow({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string
  description?: string
  checked: boolean
  disabled?: boolean
  onChange: (next: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white">{label}</p>
        {description && <p className="text-xs text-zinc-500 mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative shrink-0 w-11 h-6 rounded-full transition-colors disabled:opacity-50 ${
          checked ? 'bg-gradient-to-r from-amber-500 to-orange-400' : 'bg-white/10'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  )
}
