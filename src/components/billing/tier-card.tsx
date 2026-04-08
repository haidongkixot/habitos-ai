'use client'

/**
 * HabitOS M6 — Tier card.
 *
 * Pricing card for one of the 4 tiers (free / starter / pro / premium per
 * DEC-005). Pure presentational — builder owns the data wiring + the actual
 * Stripe checkout call. The Premium tier renders a subtle gradient border
 * and `isHighlighted` adds a "Most Popular" ribbon.
 *
 * Pricing display:
 *   monthly cycle => `$X / mo`
 *   yearly cycle  => `$X / yr` with `≈ $Y / mo billed yearly` subtitle
 *
 * The 'free' tier price is rendered as `Free` regardless of cycle.
 */

import { FeatureList } from './feature-list'
import { PremiumBadge } from './premium-badge'

export type TierSlug = 'free' | 'starter' | 'pro' | 'premium'
export type BillingCycle = 'monthly' | 'yearly'

export interface TierCardProps {
  slug: TierSlug
  name: string
  priceMonthly: number
  priceYearly: number
  billingCycle: BillingCycle
  features: string[]
  highlights?: string[]
  isCurrent?: boolean
  isHighlighted?: boolean
  ctaLabel: string
  ctaDisabled?: boolean
  onSelect: () => void
  loading?: boolean
  className?: string
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12.5l4.5 4.5L19 7" />
    </svg>
  )
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2.5l2.9 6 6.6.95-4.78 4.66 1.13 6.58L12 17.77 6.15 20.69l1.13-6.58L2.5 9.45 9.1 8.5 12 2.5z" />
    </svg>
  )
}

function formatPrice(n: number): string {
  // No decimals for whole dollars, two decimals otherwise.
  if (Number.isInteger(n)) return `$${n}`
  return `$${n.toFixed(2)}`
}

export function TierCard({
  slug,
  name,
  priceMonthly,
  priceYearly,
  billingCycle,
  features,
  highlights,
  isCurrent = false,
  isHighlighted = false,
  ctaLabel,
  ctaDisabled = false,
  onSelect,
  loading = false,
  className = '',
}: TierCardProps) {
  const isPremium = slug === 'premium'
  const isFree = slug === 'free'

  const monthlyEquivalent =
    priceYearly > 0 ? Math.round((priceYearly / 12) * 100) / 100 : 0

  const ringClasses = isPremium
    ? 'border-transparent bg-[linear-gradient(#16161a,#16161a)_padding-box,linear-gradient(135deg,rgba(245,158,11,0.7),rgba(244,63,94,0.5),rgba(168,85,247,0.55))_border-box] border-2'
    : isHighlighted
      ? 'border-amber-400/40 shadow-[0_0_30px_rgba(245,158,11,0.18)]'
      : 'border-white/10'

  const buttonDisabled = ctaDisabled || isCurrent || loading

  return (
    <div
      className={`group relative flex flex-col rounded-2xl border bg-[#16161a]/80 backdrop-blur p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_36px_rgba(245,158,11,0.12)] ${ringClasses} ${className}`}
      data-tier={slug}
      aria-label={`${name} plan`}
    >
      {isHighlighted && !isCurrent && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-rose-400 text-zinc-900 shadow-[0_4px_20px_rgba(245,158,11,0.35)]">
          <StarIcon className="w-3 h-3" />
          Most Popular
        </span>
      )}

      {isCurrent && (
        <span className="absolute top-4 right-4 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-400/30">
          <CheckIcon className="w-3 h-3" />
          Current
        </span>
      )}

      <div className="flex items-center gap-2">
        <h3 className="text-lg font-bold text-white">{name}</h3>
        {isPremium && <PremiumBadge size="sm" />}
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        {isFree ? (
          <span className="text-4xl font-extrabold tracking-tight text-white">Free</span>
        ) : billingCycle === 'monthly' ? (
          <>
            <span className="text-4xl font-extrabold tracking-tight text-white">
              {formatPrice(priceMonthly)}
            </span>
            <span className="text-sm text-zinc-400">/ mo</span>
          </>
        ) : (
          <>
            <span className="text-4xl font-extrabold tracking-tight text-white">
              {formatPrice(priceYearly)}
            </span>
            <span className="text-sm text-zinc-400">/ yr</span>
          </>
        )}
      </div>
      {!isFree && billingCycle === 'yearly' && monthlyEquivalent > 0 && (
        <p className="mt-1 text-xs text-zinc-500">
          ≈ {formatPrice(monthlyEquivalent)} / mo, billed yearly
        </p>
      )}
      {!isFree && billingCycle === 'monthly' && (
        <p className="mt-1 text-xs text-zinc-500">Cancel anytime</p>
      )}

      {highlights && highlights.length > 0 && (
        <ul className="mt-5 space-y-2">
          {highlights.map((h, idx) => (
            <li
              key={`${idx}-h`}
              className="flex items-start gap-2 text-sm font-semibold text-amber-100/90"
            >
              <span
                className="mt-0.5 inline-flex shrink-0 items-center justify-center rounded-full border border-amber-400/40 bg-amber-500/10 p-0.5 text-amber-300"
                aria-hidden="true"
              >
                <CheckIcon className="w-4 h-4" />
              </span>
              <span className="leading-snug">{h}</span>
            </li>
          ))}
        </ul>
      )}

      {features && features.length > 0 && (
        <div className="mt-4 border-t border-white/5 pt-4">
          <FeatureList features={features} size="sm" />
        </div>
      )}

      <div className="mt-6 flex-1" />

      <button
        type="button"
        onClick={onSelect}
        disabled={buttonDisabled}
        aria-disabled={buttonDisabled}
        className={`inline-flex items-center justify-center gap-2 w-full rounded-full px-4 py-2.5 text-sm font-semibold transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 disabled:cursor-not-allowed ${
          isCurrent
            ? 'bg-emerald-500/15 text-emerald-200 border border-emerald-400/30'
            : isHighlighted || isPremium
              ? 'bg-gradient-to-r from-amber-400 to-rose-400 text-zinc-900 hover:brightness-110 disabled:opacity-60'
              : 'bg-white/5 text-white border border-white/10 hover:bg-white/10 disabled:opacity-60'
        }`}
      >
        {loading ? (
          <>
            <span className="inline-block w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
            Working...
          </>
        ) : isCurrent ? (
          <>
            <CheckIcon className="w-3.5 h-3.5" />
            {ctaLabel}
          </>
        ) : (
          ctaLabel
        )}
      </button>
    </div>
  )
}

export default TierCard
