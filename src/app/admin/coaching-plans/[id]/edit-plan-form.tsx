'use client'

/**
 * HabitOS M5 — Inline edit form for a coaching plan.
 *
 * Patches /api/admin/coaching-plans/[id] with any changed fields.
 * Keeps its own local state and notifies the parent with the updated
 * plan when the PATCH succeeds so tabs refresh from the same source.
 */

import { useState, useEffect } from 'react'

export interface EditablePlan {
  id: string
  title: string
  summary: string | null
  notes: string | null
}

type Props = {
  plan: EditablePlan
  onSaved: (updated: { title: string; summary: string | null; notes: string | null }) => void
}

export default function EditPlanForm({ plan, onSaved }: Props) {
  const [title, setTitle] = useState(plan.title || '')
  const [summary, setSummary] = useState(plan.summary || '')
  const [notes, setNotes] = useState(plan.notes || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState<number | null>(null)

  // Keep local state in sync when the parent passes a fresh plan
  // (e.g. after a pause/resume/stop round-trip).
  useEffect(() => {
    setTitle(plan.title || '')
    setSummary(plan.summary || '')
    setNotes(plan.notes || '')
  }, [plan.id, plan.title, plan.summary, plan.notes])

  const dirty =
    title !== (plan.title || '') ||
    summary !== (plan.summary || '') ||
    notes !== (plan.notes || '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!dirty || saving) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/coaching-plans/${plan.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          summary: summary || null,
          notes: notes || null,
        }),
      })
      if (!res.ok) {
        throw new Error(`Save failed (${res.status})`)
      }
      onSaved({
        title,
        summary: summary || null,
        notes: notes || null,
      })
      setSavedAt(Date.now())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4"
    >
      <h3 className="text-sm font-semibold text-white">Edit plan</h3>

      <div>
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
          Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
          Summary
        </label>
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={3}
          className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 resize-none"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
          Admin notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Internal notes visible to admins only"
          className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 resize-none"
        />
      </div>

      {error && (
        <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500">
          {savedAt && !dirty ? 'Saved just now' : dirty ? 'Unsaved changes' : 'Up to date'}
        </div>
        <button
          type="submit"
          disabled={!dirty || saving}
          className="px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-gray-950 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </div>
    </form>
  )
}
