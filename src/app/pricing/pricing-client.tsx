'use client'

/**
 * HabitOS M6 — Pricing client.
 *
 * Responsibilities:
 *  - Render 4 tier cards (Free / Starter / Pro / Premium) per DEC-005.
 *  - Billing-cycle toggle (monthly/yearly). Yearly shows a "Save ~17%" badge.
 *  - Fetch GET /api/billing/current on mount to highlight the user's tier
 *    and swap "Upgrade" -> "Manage billing" on the active card.
 *  - CTAs:
 *      - Free & not logged in       -> /signup
 *      - Current plan (any tier)    -> disabled "Current plan" OR
 *                                      "Manage billing" (non-free)
 *      - Paid tier, not current     -> POST /api/billing/checkout
 *                                      -> window.location.assign(data.url)
 *  - Loading + error state on every CTA. All buttons disabled while in-flight.
 *
 * Designer primitives (src/components/billing/*) and marketer's tier-copy
 * library may or may not exist when this ships — we lazy-import with inline
 * stub fallbacks so tsc stays clean regardless of parallel landing order.
 */

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import FeatureList from '@/components/billing/feature-list'
import PremiumBadge from '@/components/billing/premium-badge'

// ---------- Backend contract types ----------
type TierSlug = 'free' | 'starter' | 'pro' | 'premium'
type BillingInterval = 'monthly' | 'yearly'

interface BillingCurrentResponse {
  tier: {
    slug: TierSlug
    name: string
  }
  subscription: {
    id: string
    status: string
    currentPeriodEnd: string | null
    cancelAtPeriodEnd: boolean
    stripeSubId: string
  } | null
  canCustomizeCoach: boolean
  canEditBasicCoachFields: boolean
}

interface CheckoutResponse {
  url: string
}

interface PortalResponse {
  url: string
}

// ---------- Tier copy (marketer-owned fallback) ----------
// TODO: replace with `import { TIER_COPY } from '@/lib/billing/tier-copy'`
// once marketer's library lands.
interface TierCopy {
  slug: TierSlug
  name: string
  tagline: string
  priceMonthly: number
  priceYearly: number
  features: string[]
  highlighted?: boolean
}

const FALLBACK_TIER_COPY: TierCopy[] = [
  {
    slug: 'free',
    name: 'Free',
    tagline: 'Get started with habit tracking',
    priceMonthly: 0,
    priceYearly: 0,
    features: [
      '5 habits',
      '3 AI coach messages/day',
      '7-day history',
      'Basic streaks',
      'Daily quests',
      '2 Academy chapters',
    ],
  },
  {
    slug: 'starter',
    name: 'Starter',
    tagline: 'Real coaching on a budget',
    priceMonthly: 9,
    priceYearly: 90,
    features: [
      'Unlimited habits',
      'Full AI coach conversations',
      '30-day history',
      'Streak freezes',
      'All Academy chapters',
      'Custom coach name + gender',
    ],
  },
  {
    slug: 'pro',
    name: 'Pro',
    tagline: 'Best value for most people',
    priceMonthly: 19,
    priceYearly: 190,
    features: [
      'Everything in Starter',
      'Pro reasoning model (o4-mini)',
      'All coach personas',
      'Full analytics + insights',
      'Relationship style tuning',
      'Priority support',
    ],
    highlighted: true,
  },
  {
    slug: 'premium',
    name: 'Premium',
    tagline: 'The whole HumanOS experience',
    priceMonthly: 39,
    priceYearly: 390,
    features: [
      'Everything in Pro',
      'o3 weekly deep review',
      'Custom outfit packs',
      'Custom voice accents',
      'Cross-app integration',
      'Early access to new features',
    ],
  },
]

// ---------- Inline stub: TierCard ----------
// TODO: replace with `import { TierCard } from '@/components/billing/tier-card'`
// once designer's primitive lands.
interface TierCardProps {
  copy: TierCopy
  billingCycle: BillingInterval
  isCurrent: boolean
  currentTierSlug: TierSlug | null
  isSignedIn: boolean
  inFlightSlug: string | null
  errorSlug: string | null
  errorMessage: string | null
  onUpgrade: (slug: TierSlug) => void
  onManage: () => void
  loadingPayPal: string | null
  onPayPalCheckout: (slug: string) => void
}

function TierCardStub({
  copy,
  billingCycle,
  isCurrent,
  currentTierSlug,
  isSignedIn,
  inFlightSlug,
  errorSlug,
  errorMessage,
  onUpgrade,
  onManage,
  loadingPayPal,
  onPayPalCheckout,
}: TierCardProps) {
  const isFree = copy.slug === 'free'
  const price = billingCycle === 'yearly' ? copy.priceYearly : copy.priceMonthly
  const priceLabel = isFree
    ? '$0'
    : billingCycle === 'yearly'
      ? `$${price}/yr`
      : `$${price}/mo`

  const isPremium = copy.slug === 'premium'
  const highlight = copy.highlighted
  const inFlight = inFlightSlug === copy.slug || inFlightSlug === 'portal'
  const anyInFlight = inFlightSlug !== null

  let ctaLabel = 'Get Started'
  let ctaDisabled = false
  let ctaAction: 'signup' | 'checkout' | 'portal' | 'none' = 'signup'

  if (isCurrent) {
    if (isFree) {
      ctaLabel = 'Current plan'
      ctaDisabled = true
      ctaAction = 'none'
    } else {
      ctaLabel = inFlight ? 'Opening portal...' : 'Manage billing'
      ctaAction = 'portal'
    }
  } else if (isFree) {
    if (isSignedIn) {
      ctaLabel = currentTierSlug && currentTierSlug !== 'free' ? 'Downgrade' : 'Current plan'
      ctaDisabled = currentTierSlug === null || currentTierSlug === 'free'
      ctaAction = currentTierSlug && currentTierSlug !== 'free' ? 'portal' : 'none'
    } else {
      ctaLabel = 'Get Started'
      ctaAction = 'signup'
    }
  } else {
    ctaLabel = inFlight ? 'Redirecting...' : 'Upgrade'
    ctaAction = 'checkout'
  }

  const handleClick = () => {
    if (ctaDisabled || anyInFlight) return
    if (ctaAction === 'checkout') onUpgrade(copy.slug)
    else if (ctaAction === 'portal') onManage()
    else if (ctaAction === 'signup') {
      window.location.assign('/signup')
    }
  }

  return (
    <div
      className={`relative rounded-2xl p-6 flex flex-col ${
        highlight
          ? 'bg-[#1c1c22]/80 border-2 border-amber-500/60 shadow-[0_0_40px_rgba(245,158,11,0.12)]'
          : 'bg-[#1c1c22]/60 border border-white/[0.06]'
      }`}
    >
      {highlight && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-amber-500 text-[#0c0c0f] text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
          Most popular
        </div>
      )}
      {isCurrent && (
        <div className="absolute -top-3 right-4 bg-emerald-500/90 text-[#0c0c0f] text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
          Current plan
        </div>
      )}

      <div className="flex items-center gap-2">
        <h2 className="text-xl font-bold text-white">{copy.name}</h2>
        {isPremium && <PremiumBadge size="sm" />}
      </div>
      <p className="text-zinc-400 text-sm mt-1 min-h-[40px]">{copy.tagline}</p>

      <div className="mt-4 mb-5">
        {isFree ? (
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold text-white">$0</span>
            <span className="text-zinc-500 text-sm">/forever</span>
          </div>
        ) : (
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold text-white">
              ${price}
            </span>
            <span className="text-zinc-500 text-sm">
              /{billingCycle === 'yearly' ? 'year' : 'month'}
            </span>
          </div>
        )}
        {!isFree && billingCycle === 'yearly' && (
          <div className="text-xs text-emerald-400 mt-1">
            Save ~17% vs monthly
          </div>
        )}
        {!isFree && billingCycle === 'monthly' && (
          <div className="text-xs text-zinc-600 mt-1">
            {priceLabel} · billed monthly
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={handleClick}
        disabled={ctaDisabled || anyInFlight}
        className={`w-full text-center py-3 rounded-xl text-sm font-semibold transition-all ${
          highlight
            ? 'bg-amber-500 hover:bg-amber-400 text-[#0c0c0f]'
            : isCurrent
              ? 'bg-white/5 text-zinc-300 border border-white/10 hover:bg-white/10'
              : 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
        aria-busy={inFlight}
      >
        {ctaLabel}
      </button>

      {!isFree && (
        <button
          onClick={() => onPayPalCheckout(copy.slug)}
          disabled={loadingPayPal !== null}
          className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-[#009CDE] text-sm font-semibold transition disabled:opacity-50"
        >
          {loadingPayPal === copy.slug ? 'Redirecting...' : (
            <>
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#009CDE]" aria-hidden="true">
                <path d="M20.067 8.478c.492.88.556 2.014.3 3.327-.74 3.806-3.276 5.12-6.514 5.12h-.5a.805.805 0 0 0-.794.68l-.04.22-.63 3.993-.032.17a.804.804 0 0 1-.794.679H7.72a.483.483 0 0 1-.477-.558L7.418 21h1.518l.95-6.02h1.385c4.678 0 7.75-2.203 8.796-6.502z"/>
                <path d="M9.738 6.145c.24-.394.63-.696 1.086-.812.234-.06.48-.09.73-.09h5.245c.622 0 1.2.033 1.73.1a6.7 6.7 0 0 1 1.017.228c.29.09.557.203.8.34.257-1.632-.002-2.743-.887-3.75C18.392.947 16.524.5 14.073.5H7.02a.96.96 0 0 0-.949.812L3.082 17.43a.578.578 0 0 0 .57.668H7.42L9.738 6.145z"/>
              </svg>
              Pay with PayPal
            </>
          )}
        </button>
      )}

      {errorSlug === copy.slug && errorMessage && (
        <div
          role="alert"
          className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200"
        >
          {errorMessage}
        </div>
      )}

      <div className="mt-5">
        <FeatureList features={copy.features} size="md" />
      </div>
    </div>
  )
}

// ---------- Inline stub: BillingCycleToggle ----------
// TODO: replace with `import { BillingCycleToggle } from '@/components/billing/billing-cycle-toggle'`
interface BillingCycleToggleProps {
  value: BillingInterval
  onChange: (value: BillingInterval) => void
  disabled?: boolean
}

function BillingCycleToggleStub({
  value,
  onChange,
  disabled,
}: BillingCycleToggleProps) {
  return (
    <div
      className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1"
      role="radiogroup"
      aria-label="Billing cycle"
    >
      <button
        type="button"
        role="radio"
        aria-checked={value === 'monthly'}
        disabled={disabled}
        onClick={() => onChange('monthly')}
        className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
          value === 'monthly'
            ? 'bg-white text-[#0c0c0f]'
            : 'text-zinc-400 hover:text-zinc-200'
        } disabled:opacity-50`}
      >
        Monthly
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={value === 'yearly'}
        disabled={disabled}
        onClick={() => onChange('yearly')}
        className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors flex items-center gap-1.5 ${
          value === 'yearly'
            ? 'bg-white text-[#0c0c0f]'
            : 'text-zinc-400 hover:text-zinc-200'
        } disabled:opacity-50`}
      >
        Yearly
        <span
          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
            value === 'yearly'
              ? 'bg-emerald-500/20 text-emerald-700'
              : 'bg-emerald-500/20 text-emerald-400'
          }`}
        >
          -17%
        </span>
      </button>
    </div>
  )
}

// ---------- Main client ----------
export default function PricingClient() {
  const { data: session, status: sessionStatus } = useSession()
  const isSignedIn = sessionStatus === 'authenticated' && !!session

  const [billingCycle, setBillingCycle] = useState<BillingInterval>('monthly')
  const [current, setCurrent] = useState<BillingCurrentResponse | null>(null)
  const [currentLoading, setCurrentLoading] = useState(false)
  const [inFlightSlug, setInFlightSlug] = useState<string | null>(null)
  const [errorSlug, setErrorSlug] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [loadingPayPal, setLoadingPayPal] = useState<string | null>(null)

  const fetchCurrent = useCallback(async () => {
    if (!isSignedIn) {
      setCurrent(null)
      return
    }
    setCurrentLoading(true)
    try {
      const res = await fetch('/api/billing/current', { cache: 'no-store' })
      if (!res.ok) {
        setCurrent(null)
        return
      }
      const json = (await res.json()) as BillingCurrentResponse
      setCurrent(json)
    } catch {
      setCurrent(null)
    } finally {
      setCurrentLoading(false)
    }
  }, [isSignedIn])

  useEffect(() => {
    fetchCurrent()
  }, [fetchCurrent])

  const currentTierSlug: TierSlug | null = current?.tier?.slug ?? null

  const handleUpgrade = useCallback(
    async (slug: TierSlug) => {
      if (slug === 'free') return
      if (!isSignedIn) {
        window.location.assign(`/login?callbackUrl=${encodeURIComponent('/pricing')}`)
        return
      }
      setInFlightSlug(slug)
      setErrorSlug(null)
      setErrorMessage(null)
      try {
        const res = await fetch('/api/billing/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ priceSlug: slug, interval: billingCycle }),
        })
        if (!res.ok) {
          const text = await res.text().catch(() => '')
          throw new Error(
            text ? `Checkout failed (${res.status})` : `Checkout failed (${res.status})`
          )
        }
        const json = (await res.json()) as CheckoutResponse
        if (!json.url) throw new Error('Checkout URL missing from response')
        window.location.assign(json.url)
      } catch (err) {
        setErrorSlug(slug)
        setErrorMessage(
          err instanceof Error ? err.message : 'Could not start checkout'
        )
        setInFlightSlug(null)
      }
    },
    [billingCycle, isSignedIn]
  )

  async function handlePayPalCheckout(slug: string) {
    setLoadingPayPal(slug)
    try {
      const res = await fetch('/api/billing/paypal/create-subscription', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceSlug: slug, interval: 'monthly' }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else alert(data.error || 'PayPal unavailable')
    } catch { alert('Network error') }
    finally { setLoadingPayPal(null) }
  }

  const handleManage = useCallback(async () => {
    setInFlightSlug('portal')
    setErrorSlug(null)
    setErrorMessage(null)
    try {
      const res = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (!res.ok) {
        throw new Error(`Portal unavailable (${res.status})`)
      }
      const json = (await res.json()) as PortalResponse
      if (!json.url) throw new Error('Portal URL missing from response')
      window.location.assign(json.url)
    } catch (err) {
      setErrorSlug(currentTierSlug)
      setErrorMessage(
        err instanceof Error ? err.message : 'Could not open billing portal'
      )
      setInFlightSlug(null)
    }
  }, [currentTierSlug])

  return (
    <div>
      {/* Billing cycle toggle */}
      <div className="flex items-center justify-center mb-10">
        <BillingCycleToggleStub
          value={billingCycle}
          onChange={setBillingCycle}
          disabled={inFlightSlug !== null}
        />
      </div>

      {/* Current-plan fetch hint (very subtle) */}
      {isSignedIn && currentLoading && (
        <div className="text-center text-xs text-zinc-600 mb-4">
          Loading your current plan...
        </div>
      )}

      {/* Grid: 1 col mobile -> 2 col tablet -> 4 col desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {FALLBACK_TIER_COPY.map((copy) => (
          <TierCardStub
            key={copy.slug}
            copy={copy}
            billingCycle={billingCycle}
            isCurrent={currentTierSlug === copy.slug}
            currentTierSlug={currentTierSlug}
            isSignedIn={isSignedIn}
            inFlightSlug={inFlightSlug}
            errorSlug={errorSlug}
            errorMessage={errorMessage}
            onUpgrade={handleUpgrade}
            onManage={handleManage}
            loadingPayPal={loadingPayPal}
            onPayPalCheckout={handlePayPalCheckout}
          />
        ))}
      </div>

      {/* Footer helper links */}
      <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 text-xs text-zinc-500">
        <Link href="/settings/billing" className="hover:text-zinc-300 transition-colors">
          Manage your subscription
        </Link>
        <span className="hidden sm:inline">·</span>
        <Link href="/contact" className="hover:text-zinc-300 transition-colors">
          Questions? Contact us
        </Link>
      </div>
    </div>
  )
}
