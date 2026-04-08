/**
 * HabitOS M6 — Checkout success landing.
 *
 * Post-checkout landing reached via Stripe success_url. Note: this page
 * is NOT the source of truth — the Stripe webhook syncs the subscription
 * to the DB (per DEC-014). This page is purely celebratory + provides
 * next-step CTAs.
 *
 * CSS-only confetti (no libraries) — a ring of amber dots with staggered
 * fall animation driven by globals.css bounce keyframes (already in tree).
 */

import Link from 'next/link'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Welcome to HabitOS — Payment received',
}

const CONFETTI_COUNT = 18

export default function CheckoutSuccessPage() {
  const dots = Array.from({ length: CONFETTI_COUNT }, (_, i) => i)

  return (
    <div className="min-h-screen bg-[#0c0c0f] relative overflow-hidden">
      {/* Amber glow backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-radial from-amber-500/10 via-transparent to-transparent"
        style={{
          background:
            'radial-gradient(ellipse at top, rgba(245,158,11,0.15), transparent 60%)',
        }}
      />

      {/* CSS-only confetti */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-64 overflow-hidden"
      >
        {dots.map((i) => {
          const left = (i * 53) % 100
          const delay = (i * 0.17) % 2.4
          const duration = 1.6 + ((i * 0.31) % 1.2)
          const colors = [
            'bg-amber-400',
            'bg-emerald-400',
            'bg-rose-400',
            'bg-sky-400',
          ]
          const color = colors[i % colors.length]
          return (
            <span
              key={i}
              className={`absolute top-0 w-2 h-2 rounded-sm ${color} opacity-80 animate-bounce`}
              style={{
                left: `${left}%`,
                animationDelay: `${delay}s`,
                animationDuration: `${duration}s`,
                transform: `rotate(${(i * 37) % 360}deg)`,
              }}
            />
          )
        })}
      </div>

      <div className="relative max-w-2xl mx-auto px-4 py-20 text-center">
        {/* Checkmark */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/40 mb-6">
          <svg
            className="w-10 h-10 text-emerald-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.4}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 12.5l4.5 4.5L19 7"
            />
          </svg>
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
          You&apos;re in.
        </h1>
        <p className="mt-4 text-lg text-zinc-300 max-w-xl mx-auto">
          Your payment was received and your upgrade is being activated right
          now. Your new tier will be live within a few seconds.
        </p>
        <p className="mt-2 text-sm text-zinc-500 max-w-md mx-auto">
          (If your plan doesn&apos;t appear immediately, refresh the dashboard
          &mdash; our webhook handles the sync.)
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-[#0c0c0f] transition-colors"
          >
            Go to dashboard
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
          <Link
            href="/settings/billing"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/10 transition-colors"
          >
            Manage subscription
          </Link>
        </div>

        <div className="mt-12 rounded-2xl border border-white/[0.06] bg-[#1c1c22]/60 p-6 text-left">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
            What&apos;s next
          </h2>
          <ul className="space-y-3 text-sm text-zinc-300">
            <li className="flex items-start gap-3">
              <span className="mt-0.5 text-emerald-400">1.</span>
              <span>
                Head to{' '}
                <Link
                  href="/coach/customize"
                  className="text-amber-300 hover:text-amber-200 underline-offset-2 hover:underline"
                >
                  Coach customize
                </Link>{' '}
                to personalize your AI coach.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 text-emerald-400">2.</span>
              <span>
                Start a new goal from the{' '}
                <Link
                  href="/goals/new"
                  className="text-amber-300 hover:text-amber-200 underline-offset-2 hover:underline"
                >
                  Goals
                </Link>{' '}
                page &mdash; your coach will generate a tailored plan.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 text-emerald-400">3.</span>
              <span>
                Turn on reminders in{' '}
                <Link
                  href="/settings/notifications"
                  className="text-amber-300 hover:text-amber-200 underline-offset-2 hover:underline"
                >
                  Settings
                </Link>{' '}
                so your coach can reach you.
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
