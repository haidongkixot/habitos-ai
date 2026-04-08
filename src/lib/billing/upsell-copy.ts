/**
 * HabitOS — Upsell Copy
 *
 * Owner: marketer role (M6)
 * Consumers: designer (upsell-modal, locked-feature-card),
 *            builder (/coach/customize gate, /reminders gate, etc.)
 *
 * Pure constants. One message per locked feature.
 *
 * Tone rules (.shared/memory/brand.md):
 *  - Always anchored in the user's progress, never scarcity or FOMO
 *  - Max 1 nudge per user per day (enforced upstream — not in this file)
 *  - Premium-gated fields per DEC-008: outfitPack + accent only
 *
 * Tier ladder per DEC-005:
 *   free -> starter ($9) -> pro ($19) -> premium ($39)
 */

export type UpsellTrigger =
  | 'customize.outfit'         // Premium gate
  | 'customize.accent'         // Premium gate
  | 'goals.limit'              // 'You have hit your active goal limit'
  | 'reminders.frequency'      // need Pro for multi-daily
  | 'persona.locked'           // persona requires higher tier
  | 'weekly.review'            // Premium deeper review
  | 'cross.app.integration'    // Premium cross-app
  | 'analytics.dashboard'      // Pro+

export interface UpsellMessage {
  trigger: UpsellTrigger
  recommendedTier: 'starter' | 'pro' | 'premium'
  /** Short, 5–9 words. */
  headline: string
  /** 1–2 sentences. Plain language, no exclamation marks. */
  body: string
  /** Button label on the upsell modal / locked card. */
  ctaLabel: string
}

export const UPSELL_MESSAGES: Record<UpsellTrigger, UpsellMessage> = {
  'customize.outfit': {
    trigger: 'customize.outfit',
    recommendedTier: 'premium',
    headline: 'Dress your coach the way you like',
    body: 'Outfit packs are part of Premium coach customization. Pick from a curated set of looks so your daily check-in feels a little more like yours.',
    ctaLabel: 'Upgrade to Premium',
  },

  'customize.accent': {
    trigger: 'customize.accent',
    recommendedTier: 'premium',
    headline: 'Give your coach a voice you love',
    body: 'Accent and voice tuning are reserved for Premium. Choose how your coach sounds when they greet you, celebrate a win, or talk you through a hard day.',
    ctaLabel: 'Upgrade to Premium',
  },

  'goals.limit': {
    trigger: 'goals.limit',
    recommendedTier: 'pro',
    headline: 'You are ready for your next goal',
    body: 'You have filled the active goal slots on your current plan. Upgrade to make room for the next habit you want to build, without losing the progress you already have.',
    ctaLabel: 'See upgrade options',
  },

  'reminders.frequency': {
    trigger: 'reminders.frequency',
    recommendedTier: 'pro',
    headline: 'Get reminders when they help most',
    body: 'Multi-daily smart reminders are part of Pro. Your coach will time them around your routines and quiet hours, instead of just once a day.',
    ctaLabel: 'Upgrade to Pro',
  },

  'persona.locked': {
    trigger: 'persona.locked',
    recommendedTier: 'pro',
    headline: 'This coach is on a higher tier',
    body: 'You can preview every persona, and the one you picked unlocks on a higher plan. Upgrade when you are ready to switch — your goals and history move with you.',
    ctaLabel: 'See plans',
  },

  'weekly.review': {
    trigger: 'weekly.review',
    recommendedTier: 'premium',
    headline: 'Get a deeper weekly review',
    body: 'Premium adds a longer-form weekly review powered by an advanced reasoning model. It looks across your goals, momentum, and check-ins to help you adjust the week ahead.',
    ctaLabel: 'Upgrade to Premium',
  },

  'cross.app.integration': {
    trigger: 'cross.app.integration',
    recommendedTier: 'premium',
    headline: 'Connect HabitOS to the rest of HumanOS',
    body: 'Cross-app integrations are a Premium feature, letting your habits sync with the rest of your HumanOS apps. Your data stays in your account — you choose what flows where.',
    ctaLabel: 'Upgrade to Premium',
  },

  'analytics.dashboard': {
    trigger: 'analytics.dashboard',
    recommendedTier: 'pro',
    headline: 'See your habits in full detail',
    body: 'The analytics dashboard shows streaks, completion rates, and trend lines across your goals. It is included with Pro and above, so you can spot what is working and what needs adjusting.',
    ctaLabel: 'Upgrade to Pro',
  },
}

/**
 * Convenience array for iterating every upsell trigger
 * (e.g. when prebuilding modal content at build time).
 */
export const UPSELL_TRIGGERS: readonly UpsellTrigger[] = [
  'customize.outfit',
  'customize.accent',
  'goals.limit',
  'reminders.frequency',
  'persona.locked',
  'weekly.review',
  'cross.app.integration',
  'analytics.dashboard',
] as const
