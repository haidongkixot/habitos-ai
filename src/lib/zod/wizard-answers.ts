import { z } from 'zod'

/**
 * Wizard answer schemas are intentionally PERMISSIVE.
 *
 * The wizard UI (src/components/wizard/wizard-runner.tsx) captures a rich
 * superset of fields per framework. Rather than force the UI to match a rigid
 * shape, we validate only the minimum identity field required for each
 * framework and pass everything else through to the AI generator prompt via
 * .passthrough(). The AI coach sees the full answer map and synthesizes the
 * plan from whatever the user provided.
 *
 * If a future Phase 4 admin/analytics feature needs stricter typing, add
 * refined sub-schemas there — do NOT tighten these without updating the wizard
 * in lockstep.
 */

export const growAnswersSchema = z
  .object({
    // Required identity field — every GROW wizard asks "what does success look like".
    goal: z.string().min(1).max(2000),

    // Optional rich fields (backward-compatible superset of the original strict schema).
    category: z.string().optional(),
    targetDate: z.string().optional(),
    successMetric: z.string().optional(),
    goalMetric: z.string().optional(),              // wizard alias for successMetric
    reality: z.string().optional(),
    tried: z.string().optional(),
    resources: z.array(z.string()).optional(),
    blockers: z.array(z.string()).optional(),
    obstacle: z.string().optional(),                 // wizard "biggest obstacle" longtext
    options: z.union([z.string(), z.array(z.string())]).optional(),
    chosenOption: z.string().optional(),
    firstAction: z.string().optional(),
    commitment: z.number().int().min(1).max(10).optional(),
  })
  .passthrough()

export const woopAnswersSchema = z
  .object({
    // Required identity field.
    wish: z.string().min(1).max(2000),

    outcome: z.string().optional(),
    obstacle: z.string().optional(),
    obstacleCue: z.string().optional(),
    plan: z.string().optional(), // free-text if-then
    ifThenPrimary: z
      .object({ if: z.string(), then: z.string() })
      .optional(),
    ifThenBackups: z
      .array(z.object({ if: z.string(), then: z.string() }))
      .max(5)
      .optional(),
    confidence: z.number().int().min(1).max(10).optional(),
  })
  .passthrough()

export const identityAnswersSchema = z
  .object({
    // Required identity field.
    identity: z.string().min(1).max(2000),

    why: z.string().optional(),
    vote: z.string().optional(),
    habitStack: z.string().optional(),
    evidence: z.string().optional(), // wizard longtext of tiny actions
    environment: z.array(z.string()).optional(),
    environmentCues: z.array(z.string()).optional(),
    reward: z.string().optional(),
    twoMinuteVersion: z.string().optional(),
    friction: z.string().optional(),
    identityStrength: z.number().int().min(1).max(10).optional(),
  })
  .passthrough()

export type GrowAnswers = z.infer<typeof growAnswersSchema>
export type WoopAnswers = z.infer<typeof woopAnswersSchema>
export type IdentityAnswers = z.infer<typeof identityAnswersSchema>
