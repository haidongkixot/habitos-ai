'use client'

/**
 * HabitOS M5 — Plan status badge.
 *
 * Visual conventions (per role prompt):
 *   active   -> emerald / green
 *   paused   -> amber
 *   stopped  -> rose
 *   complete -> indigo
 *
 * Unknown statuses fall back to neutral gray so we never crash on
 * unexpected backend values.
 */

export type PlanStatus = 'active' | 'paused' | 'stopped' | 'complete'

const STATUS_STYLES: Record<
  PlanStatus,
  { label: string; classes: string }
> = {
  active: {
    label: 'Active',
    classes: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  },
  paused: {
    label: 'Paused',
    classes: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  },
  stopped: {
    label: 'Stopped',
    classes: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  },
  complete: {
    label: 'Complete',
    classes: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
  },
}

const FALLBACK_STYLE = {
  label: 'Unknown',
  classes: 'bg-gray-700/40 text-gray-300 border-gray-600/40',
}

export function PlanStatusBadge({
  status,
  className = '',
}: {
  status: string
  className?: string
}) {
  const style =
    (STATUS_STYLES as Record<string, { label: string; classes: string }>)[
      status
    ] ?? { ...FALLBACK_STYLE, label: status || FALLBACK_STYLE.label }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style.classes} ${className}`}
    >
      {style.label}
    </span>
  )
}

export default PlanStatusBadge
