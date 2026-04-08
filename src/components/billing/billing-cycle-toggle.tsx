'use client'

/**
 * HabitOS M6 — Billing cycle toggle.
 *
 * Pill toggle with sliding indicator for monthly/yearly. Pure presentational —
 * builder owns the parent state and the price recompute. Yearly label gets a
 * discount badge when `yearlyDiscountLabel` is provided.
 */

export type BillingCycle = 'monthly' | 'yearly'

export interface BillingCycleToggleProps {
  value: BillingCycle
  onChange: (v: BillingCycle) => void
  yearlyDiscountLabel?: string
  className?: string
}

export function BillingCycleToggle({
  value,
  onChange,
  yearlyDiscountLabel,
  className = '',
}: BillingCycleToggleProps) {
  const isYearly = value === 'yearly'

  return (
    <div
      role="radiogroup"
      aria-label="Billing cycle"
      className={`inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1 backdrop-blur ${className}`}
    >
      <button
        type="button"
        role="radio"
        aria-checked={!isYearly}
        onClick={() => onChange('monthly')}
        className={`relative px-4 py-1.5 text-xs font-medium uppercase tracking-wider rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 ${
          !isYearly
            ? 'bg-amber-500/20 text-amber-100 shadow-[0_0_18px_rgba(245,158,11,0.18)] border border-amber-400/40'
            : 'text-zinc-400 hover:text-zinc-200'
        }`}
      >
        Monthly
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={isYearly}
        onClick={() => onChange('yearly')}
        className={`relative inline-flex items-center gap-2 px-4 py-1.5 text-xs font-medium uppercase tracking-wider rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 ${
          isYearly
            ? 'bg-amber-500/20 text-amber-100 shadow-[0_0_18px_rgba(245,158,11,0.18)] border border-amber-400/40'
            : 'text-zinc-400 hover:text-zinc-200'
        }`}
      >
        Yearly
        {yearlyDiscountLabel && (
          <span
            className={`text-[9px] font-semibold uppercase tracking-wider rounded-full px-1.5 py-0.5 border ${
              isYearly
                ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40'
                : 'bg-emerald-500/10 text-emerald-300/80 border-emerald-400/20'
            }`}
          >
            {yearlyDiscountLabel}
          </span>
        )}
      </button>
    </div>
  )
}

export default BillingCycleToggle
