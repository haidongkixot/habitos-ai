'use client'

/**
 * HabitOS M6 — Settings / Billing client.
 *
 * Renders the user's current tier + subscription, and provides the
 * "Manage subscription" (Stripe portal) and "Upgrade" CTAs.
 *
 * Backend contract (SIG-006):
 *   GET  /api/billing/current -> {
 *     tier: { slug, name },
 *     subscription: { id, status, currentPeriodEnd, cancelAtPeriodEnd, stripeSubId } | null,
 *     canCustomizeCoach: boolean,
 *     canEditBasicCoachFields: boolean
 *   }
 *   POST /api/billing/portal -> { url }
 */

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import PremiumBadge from '@/components/billing/premium-badge'

export type TierSlug = 'free' | 'starter' | 'pro' | 'premium'

export interface BillingSubscription {
  id: string
  status: string
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  stripeSubId: string
}

export interface BillingCurrentSnapshot {
  tier: { slug: TierSlug; name: string }
  subscription: BillingSubscription | null
  canCustomizeCoach: boolean
  canEditBasicCoachFields: boolean
}

interface PortalResponse {
  url?: string
  error?: string
}

interface Props {
  initial: BillingCurrentSnapshot | null
}

const TIER_PRICE_HINT: Record<TierSlug, string> = {
  free: '$0 / forever',
  starter: '$9 / month (or $90 / year)',
  pro: '$19 / month (or $190 / year)',
  premium: '$39 / month (or $390 / year)',
}

const TIER_TAGLINE: Record<TierSlug, string> = {
  free: 'Habit tracking basics',
  starter: 'Real coaching on a budget',
  pro: 'Best value for most people',
  premium: 'The whole HumanOS experience',
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return '—'
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case 'active':
      return 'Active'
    case 'trialing':
      return 'Trialing'
    case 'past_due':
      return 'Past due'
    case 'canceled':
      return 'Canceled'
    case 'incomplete':
      return 'Incomplete'
    case 'incomplete_expired':
      return 'Expired'
    case 'paused':
      return 'Paused'
    case 'unpaid':
      return 'Unpaid'
    default:
      return status
  }
}

function statusColor(status: string): string {
  switch (status) {
    case 'active':
    case 'trialing':
      return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
    case 'past_due':
    case 'unpaid':
      return 'bg-rose-500/20 text-rose-300 border-rose-500/40'
    case 'canceled':
    case 'incomplete_expired':
      return 'bg-zinc-700/50 text-zinc-400 border-zinc-700'
    default:
      return 'bg-amber-500/20 text-amber-200 border-amber-500/40'
  }
}

export default function BillingClient({ initial }: Props) {
  const [data, setData] = useState<BillingCurrentSnapshot | null>(initial)
  const [loading, setLoading] = useState(false)
  const [portalInFlight, setPortalInFlight] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/billing/current', { cache: 'no-store' })
      if (!res.ok) {
        throw new Error(`Request failed (${res.status})`)
      }
      const json = (await res.json()) as BillingCurrentSnapshot
      setData(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load billing info')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!initial) {
      refresh()
    }
  }, [initial, refresh])

  const handleManage = useCallback(async () => {
    setPortalInFlight(true)
    setError(null)
    try {
      const res = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (res.status === 404) {
        throw new Error('No active subscription to manage. Upgrade to a paid plan first.')
      }
      if (!res.ok) {
        throw new Error(`Portal unavailable (${res.status})`)
      }
      const json = (await res.json()) as PortalResponse
      if (!json.url) throw new Error('Portal URL missing from response')
      window.location.assign(json.url)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not open billing portal')
      setPortalInFlight(false)
    }
  }, [])

  const tierSlug: TierSlug = (data?.tier?.slug ?? 'free') as TierSlug
  const tierName = data?.tier?.name ?? 'Free'
  const sub = data?.subscription ?? null
  const hasPaidSub = sub !== null && tierSlug !== 'free'
  const isPremium = tierSlug === 'premium'
  const canShowUpgradeCTA = tierSlug === 'free' || tierSlug === 'starter'

  return (
    <div className="space-y-6">
      {/* Current tier card */}
      <section className="rounded-2xl border border-white/[0.06] bg-[#1c1c22]/60 p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="text-xs uppercase tracking-wider text-zinc-500 font-semibold">
              Current plan
            </div>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <h2 className="text-2xl font-bold text-white capitalize">
                {tierName}
              </h2>
              {isPremium && <PremiumBadge size="md" />}
              {sub && (
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${statusColor(
                    sub.status
                  )}`}
                >
                  {statusLabel(sub.status)}
                </span>
              )}
            </div>
            <p className="text-sm text-zinc-400 mt-1">{TIER_TAGLINE[tierSlug]}</p>
            <p className="text-xs text-zinc-500 mt-2">{TIER_PRICE_HINT[tierSlug]}</p>

            {sub && sub.currentPeriodEnd && (
              <p className="text-xs text-zinc-500 mt-3">
                {sub.cancelAtPeriodEnd ? (
                  <>
                    Ends on{' '}
                    <span className="text-zinc-300">
                      {formatDate(sub.currentPeriodEnd)}
                    </span>
                  </>
                ) : (
                  <>
                    Renews on{' '}
                    <span className="text-zinc-300">
                      {formatDate(sub.currentPeriodEnd)}
                    </span>
                  </>
                )}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2 sm:items-end shrink-0">
            {hasPaidSub && (
              <button
                type="button"
                onClick={handleManage}
                disabled={portalInFlight}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/10 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                aria-busy={portalInFlight}
              >
                {portalInFlight ? 'Opening portal...' : 'Manage subscription'}
              </button>
            )}
            {canShowUpgradeCTA && (
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-[#0c0c0f] transition-colors"
              >
                {tierSlug === 'free' ? 'Upgrade' : 'Upgrade plan'}
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 12h14M13 5l7 7-7 7" />
                </svg>
              </Link>
            )}
          </div>
        </div>

        {/* Cancel-at-period-end warning */}
        {sub?.cancelAtPeriodEnd && (
          <div
            role="status"
            className="mt-5 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-100"
          >
            <p className="font-semibold">Your subscription will end soon</p>
            <p className="text-amber-200/80 mt-1">
              You&apos;ve chosen to cancel at the end of the current period. You
              can reactivate any time before{' '}
              <span className="text-amber-50">
                {formatDate(sub.currentPeriodEnd)}
              </span>{' '}
              from the billing portal.
            </p>
          </div>
        )}

        {/* Errors */}
        {error && (
          <div
            role="alert"
            className="mt-5 flex items-start justify-between gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3"
          >
            <div className="text-xs text-rose-200">{error}</div>
            <button
              type="button"
              onClick={refresh}
              className="shrink-0 px-3 py-1 rounded-lg text-[11px] font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-100 border border-rose-500/40 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {loading && !error && (
          <div className="mt-5 text-xs text-zinc-500">Refreshing...</div>
        )}
      </section>

      {/* Subscription history */}
      <section className="rounded-2xl border border-white/[0.06] bg-[#1c1c22]/60 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-white">Subscription history</h2>
          <span className="text-xs text-zinc-500">
            Showing your current subscription only
          </span>
        </div>
        {sub ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[520px]">
              <thead>
                <tr className="border-b border-white/[0.06] text-left">
                  <th className="py-2 px-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Plan
                  </th>
                  <th className="py-2 px-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Status
                  </th>
                  <th className="py-2 px-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Current period ends
                  </th>
                  <th className="py-2 px-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Auto-renew
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-white/[0.04]">
                  <td className="py-3 px-3 text-zinc-200 capitalize">{tierName}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${statusColor(
                        sub.status
                      )}`}
                    >
                      {statusLabel(sub.status)}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-zinc-300">
                    {formatDate(sub.currentPeriodEnd)}
                  </td>
                  <td className="py-3 px-3 text-zinc-300">
                    {sub.cancelAtPeriodEnd ? (
                      <span className="text-amber-300">Ending</span>
                    ) : (
                      <span className="text-emerald-300">On</span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-6 text-center">
            <p className="text-sm text-zinc-400">
              You&apos;re on the Free plan &mdash; no paid subscription history yet.
            </p>
            <Link
              href="/pricing"
              className="inline-flex mt-4 items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-[#0c0c0f] transition-colors"
            >
              See plans
            </Link>
          </div>
        )}
      </section>

      {/* Footer tip */}
      <p className="text-xs text-zinc-600 text-center">
        Need an invoice or a refund? Open the billing portal to download
        invoices and contact support.
      </p>
    </div>
  )
}
