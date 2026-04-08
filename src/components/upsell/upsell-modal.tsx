'use client'

/**
 * HabitOS M6 — Upsell modal.
 *
 * Centered modal with backdrop, used to prompt an upgrade when the user
 * hits a tier-gated feature. Pure presentational — builder owns open state
 * and wires `onUpgradeClick` to /pricing or directly to a Stripe checkout.
 *
 * Accessibility:
 *   - role="dialog" + aria-modal + aria-labelledby + aria-describedby
 *   - Escape key closes
 *   - Backdrop click closes
 *   - Focus trap is intentionally NOT implemented (no focus-trap dep in tree);
 *     initial focus is moved to the close button so keyboard users can act.
 */

import { useEffect, useRef } from 'react'
import { PremiumBadge } from '@/components/billing/premium-badge'

export type UpsellRecommendedTier = 'starter' | 'pro' | 'premium'

export interface UpsellModalProps {
  open: boolean
  onClose: () => void
  reason: string
  recommendedTier: UpsellRecommendedTier
  onUpgradeClick: () => void
  title?: string
  className?: string
}

const TIER_META: Record<
  UpsellRecommendedTier,
  { label: string; tagline: string; price: string }
> = {
  starter: {
    label: 'Starter',
    tagline: 'Daily reminders, plan persistence, and 4 coach personas.',
    price: '$9 / mo',
  },
  pro: {
    label: 'Pro',
    tagline: 'Advanced reasoning, 8 coach personas, and momentum analytics.',
    price: '$19 / mo',
  },
  premium: {
    label: 'Premium',
    tagline: 'Customize your coach, weekly deep reviews, and priority support.',
    price: '$39 / mo',
  },
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
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

export function UpsellModal({
  open,
  onClose,
  reason,
  recommendedTier,
  onUpgradeClick,
  title = 'Unlock this feature',
  className = '',
}: UpsellModalProps) {
  const closeBtnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }
    document.addEventListener('keydown', onKey)
    // Move focus to close button so keyboard users can act immediately.
    const t = setTimeout(() => closeBtnRef.current?.focus(), 50)
    // Lock body scroll while open.
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      clearTimeout(t)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  if (!open) return null

  const tier = TIER_META[recommendedTier]

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${className}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="upsell-modal-title"
      aria-describedby="upsell-modal-reason"
    >
      <button
        type="button"
        aria-label="Close upgrade prompt"
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm cursor-default"
      />

      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#16161a] shadow-[0_30px_80px_rgba(0,0,0,0.5)] p-6 sm:p-7 animate-[fadeIn_0.2s_ease-out]">
        <button
          ref={closeBtnRef}
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 inline-flex items-center justify-center w-8 h-8 rounded-full text-zinc-400 hover:text-white hover:bg-white/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60"
        >
          <CloseIcon className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center text-center">
          {recommendedTier === 'premium' ? (
            <PremiumBadge size="md" />
          ) : (
            <span className="inline-flex items-center text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-200 border border-amber-400/30">
              {tier.label}
            </span>
          )}

          <h2
            id="upsell-modal-title"
            className="mt-4 text-xl font-bold text-white tracking-tight"
          >
            {title}
          </h2>

          <p
            id="upsell-modal-reason"
            className="mt-2 text-sm text-zinc-300 leading-relaxed max-w-sm"
          >
            {reason}
          </p>

          <div className="mt-5 w-full rounded-2xl border border-amber-400/25 bg-gradient-to-br from-amber-500/10 via-transparent to-rose-500/10 p-4 text-left">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-semibold text-white">{tier.label}</span>
              <span className="text-sm font-bold text-amber-200">{tier.price}</span>
            </div>
            <p className="mt-1 text-xs text-zinc-300 leading-snug">{tier.tagline}</p>
          </div>

          <button
            type="button"
            onClick={onUpgradeClick}
            className="mt-5 inline-flex items-center justify-center gap-2 w-full rounded-full px-4 py-2.5 text-sm font-semibold bg-gradient-to-r from-amber-400 to-rose-400 text-zinc-900 hover:brightness-110 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60"
          >
            Upgrade to {tier.label}
            <ArrowIcon className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="mt-3 text-xs text-zinc-400 hover:text-zinc-200 underline underline-offset-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 rounded"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  )
}

export default UpsellModal
