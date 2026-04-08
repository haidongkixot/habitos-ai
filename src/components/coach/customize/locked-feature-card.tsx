'use client'

/**
 * HabitOS M6 — Locked feature card.
 *
 * Wraps a Premium-gated form section in /coach/customize. Shows a blurred /
 * locked vibe with PremiumBadge and an UpgradeCta. Builder composes children
 * (the actual form fields) BELOW this card, or hides them entirely when the
 * tier check fails.
 *
 * Pure presentational — `onUpgradeClick` is wired by the builder.
 */

import { PremiumBadge } from '@/components/billing/premium-badge'
import { UpgradeCta } from '@/components/upsell/upgrade-cta'

export type RequiredTier = 'starter' | 'pro' | 'premium'

export interface LockedFeatureCardProps {
  title: string
  description: string
  requiredTier: RequiredTier
  onUpgradeClick: () => void
  className?: string
}

const TIER_LABEL: Record<RequiredTier, string> = {
  starter: 'Starter',
  pro: 'Pro',
  premium: 'Premium',
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V8a4 4 0 018 0v3" />
    </svg>
  )
}

export function LockedFeatureCard({
  title,
  description,
  requiredTier,
  onUpgradeClick,
  className = '',
}: LockedFeatureCardProps) {
  const isPremium = requiredTier === 'premium'

  return (
    <div
      className={`relative rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.04] via-white/[0.02] to-rose-500/[0.04] backdrop-blur p-6 overflow-hidden ${className}`}
      aria-label={`${title} — locked, requires ${TIER_LABEL[requiredTier]}`}
    >
      <div
        className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-amber-500/10 blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative flex flex-col sm:flex-row items-start gap-4">
        <div
          className="inline-flex items-center justify-center shrink-0 w-12 h-12 rounded-2xl border border-rose-400/30 bg-rose-500/10 text-rose-300"
          aria-hidden="true"
        >
          <LockIcon className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-white">{title}</h3>
            {isPremium ? (
              <PremiumBadge size="sm" />
            ) : (
              <span className="inline-flex items-center text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-200 border border-amber-400/30">
                {TIER_LABEL[requiredTier]}
              </span>
            )}
          </div>
          <p className="mt-1.5 text-sm text-zinc-300 leading-relaxed">{description}</p>
          <div className="mt-4">
            <UpgradeCta
              variant="inline"
              targetTier={requiredTier}
              onClick={onUpgradeClick}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default LockedFeatureCard
