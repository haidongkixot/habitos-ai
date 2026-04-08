/**
 * HabitOS M6 — Pricing page (4-tier).
 *
 * Server shell that renders the interactive pricing client. The client
 * owns the billing-cycle toggle, /api/billing/current fetch for "current
 * plan" highlighting, and all checkout/portal CTAs.
 *
 * Copy is sourced from `@/lib/billing/tier-copy` (marketer-owned) with
 * inline fallback strings if the library is not yet in the tree.
 */

import Link from 'next/link'
import PricingClient from './pricing-client'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Pricing — HabitOS AI',
  description:
    'Four tiers, one goal: build habits that stick. Start free, upgrade when you are ready.',
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#0c0c0f]">
      <div className="max-w-6xl mx-auto px-4 pt-6">
        <Link
          href="/"
          className="text-zinc-400 hover:text-white text-sm transition-colors"
        >
          &larr; Back
        </Link>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3 tracking-tight">
            Simple, transparent pricing
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            Start free and upgrade when you are ready to unlock your full
            potential. Science-backed coaching, warm personas, zero
            lock-in.
          </p>
        </div>

        <PricingClient />

        <div className="text-center mt-14">
          <p className="text-zinc-500 text-sm">
            All plans include daily quests, streak freezes, and research-backed
            habit frameworks. Cancel anytime from your billing portal.
          </p>
        </div>
      </div>
    </div>
  )
}
