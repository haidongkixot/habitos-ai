import { z } from 'zod'

export const coachPersonaSchema = z.object({
  slug: z.string(),
  name: z.string(),
  gender: z.enum(['M', 'F', 'NB']),
  style: z.string(),
  tone: z.string(),
  systemPrompt: z.string(),
  shortBio: z.string(),
  avatarSeed: z.string(),
  avatarStyle: z.string().default('personas'),
  minPlanSlug: z.enum(['free', 'starter', 'pro', 'premium']).default('free'),
})

export const userCoachSettingsSchema = z.object({
  personaId: z.string().optional(),
  customName: z.string().max(40).optional(),
  customGender: z.enum(['M', 'F', 'NB']).optional(),
  outfitPack: z.enum(['athletic', 'business', 'casual', 'zen_robe', 'lab_coat', 'streetwear', 'formal']).optional(),
  accent: z.enum(['us', 'uk', 'aus', 'ind', 'generic']).optional(),
  relationshipStyle: z.enum(['mentor', 'friend', 'therapist', 'drill_sergeant']).optional(),
  customSystemAdd: z.string().max(1000).optional(),
})
