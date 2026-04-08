/**
 * HabitOS M6 — Coach customize components barrel.
 *
 * Pure presentational pickers + locked-state cards for the Premium-gated
 * /coach/customize page. Builder imports from `@/components/coach/customize`.
 *
 * Per DEC-008 only outfitPack + accent are Premium-gated; the other
 * UserCoachSettings fields (customName, customGender, relationshipStyle,
 * customSystemAdd) are open to all paying tiers and live in the builder's
 * page (not in this barrel).
 */

export {
  OutfitPackPicker,
  DEFAULT_OUTFIT_PACKS,
  default as OutfitPackPickerDefault,
} from './outfit-pack-picker'
export type {
  OutfitPackPickerProps,
  OutfitPackOption,
} from './outfit-pack-picker'

export {
  AccentPicker,
  DEFAULT_ACCENTS,
  default as AccentPickerDefault,
} from './accent-picker'
export type { AccentPickerProps, AccentOption } from './accent-picker'

export {
  LockedFeatureCard,
  default as LockedFeatureCardDefault,
} from './locked-feature-card'
export type { LockedFeatureCardProps, RequiredTier } from './locked-feature-card'
