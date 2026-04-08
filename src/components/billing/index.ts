/**
 * HabitOS M6 — Billing components barrel.
 *
 * Pure presentational primitives for the monetization layer.
 * Builder imports from `@/components/billing`.
 */

export { TierCard, default as TierCardDefault } from './tier-card'
export type { TierCardProps, TierSlug, BillingCycle } from './tier-card'

export { BillingCycleToggle, default as BillingCycleToggleDefault } from './billing-cycle-toggle'
export type { BillingCycleToggleProps } from './billing-cycle-toggle'

export { PremiumBadge, default as PremiumBadgeDefault } from './premium-badge'
export type { PremiumBadgeProps, PremiumBadgeSize } from './premium-badge'

export { FeatureList, default as FeatureListDefault } from './feature-list'
export type { FeatureListProps, FeatureListSize } from './feature-list'
