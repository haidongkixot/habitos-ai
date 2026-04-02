'use client'
import { useState } from 'react'
import Link from 'next/link'

const PLANS = [
  {
    name: 'Free',
    slug: 'free',
    priceMonthly: 0,
    priceYearly: 0,
    description: 'Get started with habit tracking',
    features: [
      '5 habits',
      'Basic statistics',
      '3 AI coach messages/day',
      '7-day history',
      'Basic streaks',
      'Daily quests',
    ],
    cta: 'Get Started',
    href: '/signup',
    highlighted: false,
  },
  {
    name: 'Pro',
    slug: 'pro',
    priceMonthly: 4.99,
    priceYearly: 39.99,
    description: 'Unlimited habits and full AI coaching',
    features: [
      'Unlimited habits',
      'Full statistics & insights',
      'Unlimited AI coaching',
      'Complete history',
      'Streak freezes',
      'Priority support',
      'Custom themes',
      'Advanced analytics',
    ],
    cta: 'Start Pro Trial',
    href: '/signup?plan=pro',
    highlighted: true,
  },
]

export default function PricingPage() {
  const [annual, setAnnual] = useState(false)

  return (
    <div className="min-h-screen bg-[#0c0c0f]">
      {/* Nav back */}
      <div className="max-w-5xl mx-auto px-4 pt-6">
        <Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors">
          &larr; Back
        </Link>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-3">Simple, transparent pricing</h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Start free and upgrade when you are ready to unlock your full potential.
          </p>

          {/* Toggle */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <span className={`text-sm ${!annual ? 'text-white' : 'text-gray-500'}`}>Monthly</span>
            <button
              onClick={() => setAnnual(!annual)}
              className={`relative w-12 h-6 rounded-full transition-colors ${annual ? 'bg-emerald-500' : 'bg-white/10'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${annual ? 'translate-x-6' : ''}`} />
            </button>
            <span className={`text-sm ${annual ? 'text-white' : 'text-gray-500'}`}>
              Yearly <span className="text-emerald-400 text-xs font-medium">Save 33%</span>
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {PLANS.map(plan => (
            <div
              key={plan.slug}
              className={`rounded-2xl p-6 ${
                plan.highlighted
                  ? 'bg-[#1c1c22]/80 backdrop-blur-sm border-2 border-emerald-500/60 relative shadow-[0_0_40px_rgba(16,185,129,0.1)]'
                  : 'card'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-teal-400 text-white text-xs font-bold px-3 py-1 rounded-full">
                  POPULAR
                </div>
              )}

              <h2 className="text-xl font-bold text-white">{plan.name}</h2>
              <p className="text-gray-400 text-sm mt-1">{plan.description}</p>

              <div className="mt-4 mb-6">
                {plan.priceMonthly === 0 ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">$0</span>
                    <span className="text-gray-400 text-sm">/forever</span>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">
                      ${annual ? plan.priceYearly : plan.priceMonthly}
                    </span>
                    <span className="text-gray-400 text-sm">/{annual ? 'year' : 'month'}</span>
                  </div>
                )}
              </div>

              <Link
                href={plan.href}
                className={`block w-full text-center py-3 rounded-xl text-sm font-medium transition-all ${
                  plan.highlighted
                    ? 'btn-primary'
                    : 'btn-secondary'
                }`}
              >
                {plan.cta}
              </Link>

              <ul className="mt-6 space-y-3">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                    <svg className={`w-4 h-4 flex-shrink-0 ${plan.highlighted ? 'text-emerald-400' : 'text-gray-500'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-500 text-sm">
            All plans include daily quests, leaderboard access, and gamification features.
          </p>
        </div>
      </div>
    </div>
  )
}
