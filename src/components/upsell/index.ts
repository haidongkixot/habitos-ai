/**
 * HabitOS M6 — Upsell components barrel.
 *
 * Pure presentational tier-gate prompts. Builder imports from
 * `@/components/upsell`.
 */

export { UpsellModal, default as UpsellModalDefault } from './upsell-modal'
export type { UpsellModalProps, UpsellRecommendedTier } from './upsell-modal'

export { UpgradeCta, default as UpgradeCtaDefault } from './upgrade-cta'
export type {
  UpgradeCtaProps,
  UpgradeCtaVariant,
  UpgradeTargetTier,
} from './upgrade-cta'
