import type { CoachPersona } from '@prisma/client'

const DICEBEAR_BASE = 'https://api.dicebear.com/9.x'
const DEFAULT_STYLE = 'adventurer'

export interface BuildAvatarUrlOverrides {
  style?: string
  seed?: string
}

/**
 * Builds a DiceBear v9 avatar URL for the given persona.
 *
 * Resolution order:
 *   1. overrides.style → persona.avatarStyle → "adventurer"
 *   2. overrides.seed  → persona.avatarSeed  → persona.slug
 *
 * The seed is always URL-encoded.
 */
export function buildAvatarUrl(
  persona: CoachPersona,
  overrides?: BuildAvatarUrlOverrides
): string {
  const style = overrides?.style || persona.avatarStyle || DEFAULT_STYLE
  const rawSeed = overrides?.seed || persona.avatarSeed || persona.slug
  const seed = encodeURIComponent(rawSeed)
  return `${DICEBEAR_BASE}/${style}/svg?seed=${seed}`
}
