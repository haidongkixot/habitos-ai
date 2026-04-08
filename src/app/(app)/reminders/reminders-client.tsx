'use client'

import { useMemo, useState } from 'react'
import ReminderRow, { type ReminderItem } from '@/components/reminders/reminder-row'

type Tab = 'upcoming' | 'sent' | 'all'

type Props = {
  initial: ReminderItem[]
}

export default function RemindersClient({ initial }: Props) {
  const [reminders, setReminders] = useState<ReminderItem[]>(initial)
  const [tab, setTab] = useState<Tab>('upcoming')
  const [modalOpen, setModalOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: '',
    body: '',
    channel: 'in-app',
    scheduledFor: '',
  })

  const filtered = useMemo(() => {
    if (tab === 'all') return reminders
    if (tab === 'sent') return reminders.filter((r) => r.status === 'sent')
    // upcoming: not sent, not cancelled
    return reminders.filter(
      (r) => r.status !== 'sent' && r.status !== 'cancelled',
    )
  }, [reminders, tab])

  async function handleCancel(id: string) {
    const res = await fetch(`/api/reminders?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
    if (!res.ok) {
      throw new Error(`Cancel failed (${res.status})`)
    }
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'cancelled' } : r)),
    )
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) {
      setCreateError('Title is required.')
      return
    }
    setCreating(true)
    setCreateError(null)
    try {
      const res = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'custom',
          title: form.title,
          body: form.body,
          channel: form.channel,
          scheduledFor: form.scheduledFor || new Date().toISOString(),
        }),
      })
      if (!res.ok) {
        throw new Error(`Create failed (${res.status})`)
      }
      const created = (await res.json()) as ReminderItem | { reminder?: ReminderItem }
      const item: ReminderItem | null =
        created && typeof created === 'object' && 'id' in created
          ? (created as ReminderItem)
          : ((created as { reminder?: ReminderItem }).reminder ?? null)
      if (item) {
        setReminders((prev) => [item, ...prev])
      }
      setModalOpen(false)
      setForm({ title: '', body: '', channel: 'in-app', scheduledFor: '' })
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Could not create reminder.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div
          role="tablist"
          aria-label="Reminder filters"
          className="inline-flex rounded-full border border-white/10 bg-white/5 p-1 text-xs"
        >
          {(['upcoming', 'sent', 'all'] as Tab[]).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-full capitalize transition-colors ${
                tab === t
                  ? 'bg-gradient-to-r from-amber-500 to-orange-400 text-[#1c1c22] font-semibold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full border border-amber-400/40 bg-amber-500/10 text-amber-100 hover:bg-amber-500/20 transition-colors"
        >
          + Create custom reminder
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-10 text-center">
          <p className="text-sm text-zinc-400">
            {tab === 'upcoming'
              ? 'No upcoming reminders. Your coach will queue these as your plan runs.'
              : tab === 'sent'
                ? 'No reminders have been sent yet.'
                : 'You have no reminders yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <ReminderRow key={r.id} reminder={r} onCancel={handleCancel} />
          ))}
        </div>
      )}

      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => !creating && setModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#1c1c22] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-white mb-1">Create custom reminder</h2>
            <p className="text-xs text-zinc-500 mb-5">
              A one-off nudge. Your coach will still send its own reminders.
            </p>
            <form onSubmit={handleCreate} className="space-y-4">
              <label className="block">
                <span className="text-xs uppercase tracking-wider text-zinc-500">Title</span>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="mt-1 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-400/50 focus:outline-none"
                  placeholder="Walk after lunch"
                  required
                />
              </label>
              <label className="block">
                <span className="text-xs uppercase tracking-wider text-zinc-500">
                  Message (optional)
                </span>
                <textarea
                  value={form.body}
                  onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                  rows={3}
                  className="mt-1 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-400/50 focus:outline-none"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs uppercase tracking-wider text-zinc-500">Channel</span>
                  <select
                    value={form.channel}
                    onChange={(e) => setForm((f) => ({ ...f, channel: e.target.value }))}
                    className="mt-1 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:border-amber-400/50 focus:outline-none"
                  >
                    <option value="in-app" className="bg-[#1c1c22]">In-app</option>
                    <option value="push" className="bg-[#1c1c22]">Push</option>
                    <option value="email" className="bg-[#1c1c22]">Email</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs uppercase tracking-wider text-zinc-500">When</span>
                  <input
                    type="datetime-local"
                    value={form.scheduledFor}
                    onChange={(e) => setForm((f) => ({ ...f, scheduledFor: e.target.value }))}
                    className="mt-1 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:border-amber-400/50 focus:outline-none"
                  />
                </label>
              </div>
              {createError && (
                <p role="alert" className="text-xs text-rose-300">
                  {createError}
                </p>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={creating}
                  className="px-4 py-2 rounded-full text-sm border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-amber-500 to-orange-400 text-[#1c1c22] disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
