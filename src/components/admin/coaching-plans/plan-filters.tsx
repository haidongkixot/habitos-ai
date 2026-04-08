'use client'

/**
 * HabitOS M5 — Coaching plan list filters.
 *
 * Controlled component used by coaching-plans-client.tsx.
 * Purely presentational; parent owns URL state + fetch trigger.
 */

import { useState } from 'react'

export type PlanFiltersState = {
  q: string
  status: string
  framework: string
  tier: string
  personaSlug: string
  from: string
  to: string
}

export const EMPTY_FILTERS: PlanFiltersState = {
  q: '',
  status: '',
  framework: '',
  tier: '',
  personaSlug: '',
  from: '',
  to: '',
}

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'stopped', label: 'Stopped' },
  { value: 'complete', label: 'Complete' },
]

const FRAMEWORK_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '', label: 'All frameworks' },
  { value: 'GROW', label: 'GROW' },
  { value: 'WOOP', label: 'WOOP' },
  { value: 'IDENTITY', label: 'Identity' },
]

const TIER_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '', label: 'All tiers' },
  { value: 'free', label: 'Free' },
  { value: 'starter', label: 'Starter' },
  { value: 'pro', label: 'Pro' },
  { value: 'premium', label: 'Premium' },
]

const BASE_INPUT =
  'bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30'

export function PlanFilters({
  value,
  onChange,
  onReset,
}: {
  value: PlanFiltersState
  onChange: (next: PlanFiltersState) => void
  onReset: () => void
}) {
  // Local debounce buffer for the free-text search so we don't re-fetch
  // per keystroke. Parent still owns the committed value.
  const [localQ, setLocalQ] = useState(value.q)

  const set = <K extends keyof PlanFiltersState>(
    key: K,
    next: PlanFiltersState[K]
  ) => onChange({ ...value, [key]: next })

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="lg:col-span-2">
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Search
          </label>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              set('q', localQ)
            }}
          >
            <input
              type="text"
              value={localQ}
              onChange={(e) => setLocalQ(e.target.value)}
              onBlur={() => {
                if (localQ !== value.q) set('q', localQ)
              }}
              placeholder="Title, user email, goal..."
              className={`${BASE_INPUT} w-full`}
            />
          </form>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Status
          </label>
          <select
            value={value.status}
            onChange={(e) => set('status', e.target.value)}
            className={`${BASE_INPUT} w-full`}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Framework
          </label>
          <select
            value={value.framework}
            onChange={(e) => set('framework', e.target.value)}
            className={`${BASE_INPUT} w-full`}
          >
            {FRAMEWORK_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Tier
          </label>
          <select
            value={value.tier}
            onChange={(e) => set('tier', e.target.value)}
            className={`${BASE_INPUT} w-full`}
          >
            {TIER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Persona slug
          </label>
          <input
            type="text"
            value={value.personaSlug}
            onChange={(e) => set('personaSlug', e.target.value)}
            placeholder="e.g. alex-default"
            className={`${BASE_INPUT} w-full`}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            From
          </label>
          <input
            type="date"
            value={value.from}
            onChange={(e) => set('from', e.target.value)}
            className={`${BASE_INPUT} w-full`}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            To
          </label>
          <input
            type="date"
            value={value.to}
            onChange={(e) => set('to', e.target.value)}
            className={`${BASE_INPUT} w-full`}
          />
        </div>
      </div>

      <div className="flex justify-end mt-4">
        <button
          type="button"
          onClick={() => {
            setLocalQ('')
            onReset()
          }}
          className="px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-white border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors"
        >
          Reset filters
        </button>
      </div>
    </div>
  )
}

export default PlanFilters
