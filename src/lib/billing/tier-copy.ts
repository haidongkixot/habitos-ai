/**
 * HabitOS — Tier Copy (Source of Truth for Marketing Strings)
 *
 * Owner: marketer role (M6)
 * Consumers: builder (/pricing, /settings/billing), designer (tier-card, upsell-modal)
 *
 * Pure constants. No runtime logic, no React, no fetches.
 * All prices are in DOLLARS for display purposes only — the Stripe layer
 * (src/lib/stripe) and the Plan model still operate in cents.
 *
 * Voice: warm, grounded, science-based. Mirrors .shared/memory/brand.md.
 * Premium-gated fields per DEC-008: outfitPack + accent only.
 * 4-tier ladder per DEC-005: Free / Starter $9 / Pro $19 / Premium $39.
 */

export type TierSlug = 'free' | 'starter' | 'pro' | 'premium'

export interface TierCopy {
  slug: TierSlug
  /** Display name shown on pricing cards and billing settings. */
  name: string
  /** One-sentence positioning statement, ~10 words. */
  tagline: string
  /** Monthly price in dollars (display only — Stripe stores cents). */
  priceMonthly: number
  /** Yearly price in dollars (display only). */
  priceYearly: number
  /** Effective monthly price when billed yearly, rounded to whole dollars. */
  yearlyMonthlyEquivalent: number
  /** 2–3 hero bullets surfaced at the top of the tier card. */
  highlights: string[]
  /** Full feature list — 8 to 12 items. */
  features: string[]
  /** 1–3 explicit limits surfaced beneath the feature list. */
  limits: string[]
  /** CTA button label on the pricing card. */
  ctaLabel: string
  /** Optional ribbon — 'Most Popular', 'Best Value', etc. */
  badge?: string
  /** When true, the card is visually emphasized as the recommended choice. */
  isHighlighted?: boolean
}

export const TIER_COPY: Record<TierSlug, TierCopy> = {
  free: {
    slug: 'free',
    name: 'Free',
    tagline: 'Start one habit, the right way — no card required.',
    priceMonthly: 0,
    priceYearly: 0,
    yearlyMonthlyEquivalent: 0,
    highlights: [
      'One active goal, fully coached',
      'GROW framework + Alex, your default coach',
      'No credit card, no time limit',
    ],
    features: [
      '1 active coaching goal',
      'GROW goal-setting wizard',
      'Alex — your default AI coach (warm mentor)',
      'Daily habit check-ins',
      'Streak tracking with 1 freeze per week',
      'In-app reminders',
      'Plan dashboard with milestones and habits',
      'Identity-based reflection prompts',
    ],
    limits: [
      '1 active goal at a time',
      'In-app reminders only — no email or push',
      'Default coach Alex (no persona library)',
    ],
    ctaLabel: 'Get Started Free',
  },

  starter: {
    slug: 'starter',
    name: 'Starter',
    tagline: 'Three goals, all the frameworks, the personas you connect with.',
    priceMonthly: 9,
    priceYearly: 90,
    yearlyMonthlyEquivalent: 8,
    highlights: [
      'Up to 3 active goals',
      'GROW, WOOP, and Identity frameworks',
      'Five coach personas to match your style',
    ],
    features: [
      '3 active coaching goals',
      'All three frameworks: GROW, WOOP, Atomic Habits Identity',
      '5 coach personas including Maya, Sergeant Rex, Dr. Iris, and Leo',
      'Daily email reminders',
      'In-app reminders with quiet-hours respect',
      '2 streak freezes per week',
      'Habit check-ins with reflection notes',
      'Goal history and milestone tracking',
      'Email support',
    ],
    limits: [
      'Up to 3 active goals',
      'One reminder per day',
      'Push notifications not included',
    ],
    ctaLabel: 'Start with Starter',
  },

  pro: {
    slug: 'pro',
    name: 'Pro',
    tagline: 'For serious habit builders who want the full coaching system.',
    priceMonthly: 19,
    priceYearly: 190,
    yearlyMonthlyEquivalent: 16,
    highlights: [
      'Up to 10 active goals across life areas',
      'Advanced reasoning model for richer plans',
      'Weekly insights from your AI coach',
    ],
    features: [
      '10 active coaching goals',
      'All three frameworks: GROW, WOOP, Atomic Habits Identity',
      '9 coach personas including Zen Master Ko, Coach Amara, and Dr. Rivera',
      'Multi-daily smart reminders that respect quiet hours',
      'Push notifications across web and mobile',
      'Weekly insights from your AI coach',
      'Momentum tracking and at-risk recovery nudges',
      'Analytics dashboard with streaks, completion, and trends',
      '4 streak freezes per week',
      'Priority email support',
    ],
    limits: [
      'Up to 10 active goals',
      'Coach customization is reserved for Premium',
    ],
    ctaLabel: 'Upgrade to Pro',
    badge: 'Most Popular',
    isHighlighted: true,
  },

  premium: {
    slug: 'premium',
    name: 'Premium',
    tagline: 'Unlimited goals, a coach you shape, and a deeper weekly review.',
    priceMonthly: 39,
    priceYearly: 390,
    yearlyMonthlyEquivalent: 33,
    highlights: [
      'Unlimited active goals',
      'Customize your coach — outfit, accent, voice',
      'Deeper weekly review powered by advanced reasoning',
    ],
    features: [
      'Unlimited active coaching goals',
      'Everything in Pro',
      'Premium-only coach customization: outfit, accent, voice',
      'Full persona library — all 12 coaches',
      'Deeper weekly review with advanced reasoning',
      'Cross-app integrations across the HumanOS ecosystem',
      'Unlimited streak freezes',
      'Priority support and direct feedback channel',
      'Early access to new frameworks and features',
      'Identity-based reflection with long-form journaling',
    ],
    limits: [
      'Cancel anytime from your billing settings',
    ],
    ctaLabel: 'Go Premium',
    badge: 'Best Value',
  },
}

/**
 * Label shown next to the yearly billing toggle.
 * ~17% discount = roughly two months free on the yearly plan.
 */
export const BILLING_CYCLE_DISCOUNT_LABEL = 'Save 17%'

/**
 * Ordered list for rendering tier cards left-to-right on /pricing.
 * Builder + designer can iterate this directly.
 */
export const TIER_DISPLAY_ORDER: readonly TierSlug[] = [
  'free',
  'starter',
  'pro',
  'premium',
] as const
