/**
 * HabitOS M6 — Checkout canceled landing.
 *
 * Reached via Stripe cancel_url when the user bails out of checkout.
 * Friendly message + safe return path to /pricing. No charge occurred.
 */

import Link from 'next/link'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Checkout canceled — HabitOS',
}

export default function CheckoutCanceledPage() {
  return (
    <div className="min-h-screen bg-[#0c0c0f] relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at top, rgba(148,163,184,0.10), transparent 60%)',
        }}
      />

      <div className="relative max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-zinc-700/30 border border-white/10 mb-6">
          <svg
            className="w-10 h-10 text-zinc-300"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx={12} cy={12} r={9} />
            <path d="M9 9l6 6M15 9l-6 6" />
          </svg>
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
          No worries, no charge.
        </h1>
        <p className="mt-4 text-lg text-zinc-300 max-w-xl mx-auto">
          You canceled checkout before completing payment. Nothing was charged
          to your card, and your account is exactly where you left it.
        </p>
        <p className="mt-2 text-sm text-zinc-500 max-w-md mx-auto">
          Take your time &mdash; the plan you were looking at will be right
          here whenever you&apos;re ready.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-[#0c0c0f] transition-colors"
          >
            Back to pricing
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/10 transition-colors"
          >
            Return to dashboard
          </Link>
        </div>

        <div className="mt-12 rounded-2xl border border-white/[0.06] bg-[#1c1c22]/60 p-6 text-left">
          <h2 className="text-sm font-semibold text-white mb-2">
            Questions before upgrading?
          </h2>
          <p className="text-sm text-zinc-400">
            Check out our{' '}
            <Link
              href="/pricing"
              className="text-amber-300 hover:text-amber-200 underline-offset-2 hover:underline"
            >
              tier comparison
            </Link>
            , or{' '}
            <Link
              href="/contact"
              className="text-amber-300 hover:text-amber-200 underline-offset-2 hover:underline"
            >
              reach out
            </Link>{' '}
            &mdash; we&apos;re happy to help you pick the right plan.
          </p>
        </div>
      </div>
    </div>
  )
}
