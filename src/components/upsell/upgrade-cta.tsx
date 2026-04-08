'use client'

/**
 * HabitOS M6 — Upgrade CTA.
 *
 * A reusable call-to-action that the builder drops anywhere a feature is
 * gated. Three variants:
 *   - inline  : compact button (default), used inline within copy
 *   - banner  : full-width strip, sits above gated forms
 *   - card    : padded card with message + button, used in empty states
 *
 * Pure presentational — `onClick` is wired by the builder to /pricing,
 * the upsell modal, or directly to a Stripe checkout intent.
 */

import { PremiumBadge } from '@/components/billing/premium-badge'

export type UpgradeCtaVariant = 'inline' | 'banner' | 'card'
export type UpgradeTargetTier = 'starter' | 'pro' | 'premium'

export interface UpgradeCtaProps {
  variant?: UpgradeCtaVariant
  message?: string
  targetTier?: UpgradeTargetTier
  onClick: () => void
  className?: string
}

const TIER_LABEL: Record<UpgradeTargetTier, string> = {
  starter: 'Starter',
  pro: 'Pro',
  premium: 'Premium',
}

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  )
}

export function UpgradeCta({
  variant = 'inline',
  message,
  targetTier = 'premium',
  onClick,
  className = '',
}: UpgradeCtaProps) {
  const tierLabel = TIER_LABEL[targetTier]
  const ctaLabel = `Upgrade to ${tierLabel}`

  if (variant === 'banner') {
    return (
      <div
        role="region"
        aria-label="Upgrade prompt"
        className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-amber-400/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-rose-500/10 backdrop-blur p-4 ${className}`}
      >
        <div className="flex items-start gap-3 min-w-0">
          {targetTier === 'premium' && <PremiumBadge size="sm" />}
          <p className="text-sm text-amber-50 leading-snug">
            {message ?? `Unlock this with the ${tierLabel} plan.`}
          </p>
        </div>
        <button
          type="button"
          onClick={onClick}
          className="inline-flex items-center justify-center gap-2 shrink-0 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider bg-gradient-to-r from-amber-400 to-rose-400 text-zinc-900 hover:brightness-110 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60"
        >
          {ctaLabel}
          <ArrowIcon className="w-3.5 h-3.5" />
        </button>
      </div>
    )
  }

  if (variant === 'card') {
    return (
      <div
        className={`flex flex-col items-center text-center gap-3 rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-6 ${className}`}
      >
        {targetTier === 'premium' && <PremiumBadge size="md" />}
        <p className="text-sm text-zinc-300 max-w-sm leading-relaxed">
          {message ?? `This feature is part of the ${tierLabel} plan.`}
        </p>
        <button
          type="button"
          onClick={onClick}
          className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold bg-gradient-to-r from-amber-400 to-rose-400 text-zinc-900 hover:brightness-110 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60"
        >
          {ctaLabel}
          <ArrowIcon className="w-4 h-4" />
        </button>
      </div>
    )
  }

  // inline (default)
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={message ? `${message} — ${ctaLabel}` : ctaLabel}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-amber-400 to-rose-400 text-zinc-900 hover:brightness-110 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 ${className}`}
    >
      {ctaLabel}
      <ArrowIcon className="w-3.5 h-3.5" />
    </button>
  )
}

export default UpgradeCta
