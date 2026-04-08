/**
 * HabitOS Phase 3 — Coaching Plan Generator
 *
 * Takes validated wizard answers + the user's persona + tier, calls the
 * right OpenAI model with a strict JSON-mode system prompt, validates the
 * output against `coachingPlanSchema`, retries once on parse failure, and
 * returns the validated plan + metadata.
 *
 * Model routing by tier:
 *   free     → gpt-4o-mini   (cheap, good-enough JSON)
 *   starter  → gpt-4o-mini   (same)
 *   pro      → gpt-4o        (higher quality reasoning for paid users)
 *   premium  → o4-mini       (o-series reasoning model for the top tier)
 */

import type { z } from 'zod'
import type { CoachPersona } from '@prisma/client'
import { reasoningChat } from '@/lib/ai/reasoning'
import { buildCoachSystemPrompt } from '@/lib/coach/system-prompt'
import { coachingPlanSchema } from '@/lib/zod/coaching-plan'
import { FRAMEWORKS, type FrameworkSlug } from './frameworks'

export type UserPlanSlug = 'free' | 'starter' | 'pro' | 'premium'

export interface GenerateCoachingPlanParams {
  userId: string
  goalId: string
  framework: FrameworkSlug
  /** Already Zod-validated wizard answers. Shape varies by framework. */
  answers: Record<string, unknown>
  persona: CoachPersona
  userPlanSlug: UserPlanSlug
  /** Optional goal metadata to enrich the user prompt. */
  goalTitle?: string
  goalCategory?: string
  goalDescription?: string | null
  goalTargetDate?: Date | null
  /** Optional user identity fields for buildCoachSystemPrompt. */
  userName?: string | null
  identityStatement?: string | null
}

export interface GenerateCoachingPlanResult {
  plan: z.infer<typeof coachingPlanSchema>
  rawResponse: unknown
  modelUsed: string
  tokensUsed: number | null
  cost: number | null
}

// ---------------------------------------------------------------------------
// Model routing
// ---------------------------------------------------------------------------

function selectModel(tier: UserPlanSlug): string {
  switch (tier) {
    case 'premium':
      return 'o4-mini'
    case 'pro':
      return 'gpt-4o'
    case 'starter':
    case 'free':
    default:
      return 'gpt-4o-mini'
  }
}

/**
 * Rough USD cost estimate per model. Keep these as strings in a switch so
 * the per-million-token pricing is colocated with routing — when pricing
 * moves, both numbers are changed in one place.
 *
 * Returns null if we don't have usage or pricing data.
 */
function estimateCostUsd(
  model: string,
  promptTokens: number | null,
  completionTokens: number | null
): number | null {
  if (promptTokens == null || completionTokens == null) return null

  // Prices in USD per 1M tokens (April 2026 list). Intentionally conservative.
  const pricing: Record<string, { input: number; output: number }> = {
    'gpt-4o-mini': { input: 0.15, output: 0.6 },
    'gpt-4o': { input: 2.5, output: 10 },
    'o4-mini': { input: 3, output: 12 },
    'o3': { input: 15, output: 60 },
  }

  const p = pricing[model]
  if (!p) return null

  const cost = (promptTokens / 1_000_000) * p.input + (completionTokens / 1_000_000) * p.output
  return Math.round(cost * 100000) / 100000 // round to 5dp (hundredths of a cent)
}

// ---------------------------------------------------------------------------
// Prompt builders
// ---------------------------------------------------------------------------

const JSON_SCHEMA_INSTRUCTIONS = `
You are generating a structured coaching plan. Return ONLY valid JSON. Do not wrap it in Markdown, do not add commentary.

The JSON MUST match this TypeScript-like shape exactly:

{
  "title": string (max 80 chars, punchy),
  "summary": string (max 280 chars, research-grounded),
  "framework": "GROW" | "WOOP" | "IDENTITY",
  "category": string (e.g. "health", "career", "finance", "relationships", "growth", "mindset", "creativity"),
  "durationDays": number (7-365, default 66 — cite Lally 2010 asymptote),
  "identityStatement": string | null (present-tense "I am the kind of person who..."),
  "milestones": [
    {
      "title": string (max 120),
      "description": string,
      "weekIndex": number (0-52, 0 = week-one kickoff),
      "successMetric": string,
      "checkpointType": "self-report" | "photo" | "journal" | "quiz"
    }
    // 3-6 items
  ],
  "habits": [
    {
      "name": string (max 120),
      "frequency": "daily" | "weekdays" | "weekends" | "custom",
      "intentionCue": string,
      "intentionLocation": string,
      "intentionTime": string,
      "intentionStatement": string (full "I will [BEHAVIOUR] at [TIME] in [LOCATION]" from Gollwitzer & Sheeran 2006),
      "twoMinuteVersion": string (Fogg-style tiny version that takes ≤ 2 minutes),
      "reward": string (immediate positive reinforcement the user can feel),
      "category": string
    }
    // 1-4 items
  ],
  "weeklyCheckinPrompt": string (one reflective question for the user to answer every week),
  "motivationStyle": "encouraging" | "firm" | "playful" | "reflective",
  "antiObstaclePlans": [
    {
      "obstacle": string (user's predicted obstacle),
      "ifThenResponse": string ("If X happens, then I will Y")
    }
    // 0-3 items
  ]
}

Research hooks you MUST reference in at least one field (summary, weeklyCheckinPrompt, or a habit.intentionStatement):
- Lally et al. (2010) — 66-day habit formation asymptote
- Fogg (2019) — B=MAP / tiny habits / two-minute rule
- Clear (2018) — identity-based habits and habit stacking
- Wood & Neal (2007) — context-dependent automaticity
- Gollwitzer & Sheeran (2006) — implementation intentions (d=0.65)
- Oettingen (2014) — mental contrasting (for WOOP plans only)
- Whitmore (1992) — GROW coaching (for GROW plans only)

Do not fabricate citations. Use ONLY the list above.
`.trim()

function summariseAnswers(
  framework: FrameworkSlug,
  answers: Record<string, unknown>
): string {
  const steps = FRAMEWORKS[framework].steps
  const lines: string[] = []

  for (const step of steps) {
    const raw = answers[step.id]
    if (raw === undefined || raw === null || raw === '') continue
    let rendered: string
    if (Array.isArray(raw)) {
      rendered = raw.map((v) => String(v)).join(', ')
    } else if (typeof raw === 'object') {
      rendered = JSON.stringify(raw)
    } else {
      rendered = String(raw)
    }
    lines.push(`- ${step.title}\n  ${rendered}`)
  }

  return lines.join('\n')
}

function buildUserPrompt(params: GenerateCoachingPlanParams): string {
  const fw = FRAMEWORKS[params.framework]
  const answerBlock = summariseAnswers(params.framework, params.answers)

  const goalLines: string[] = []
  if (params.goalTitle) goalLines.push(`Goal title: ${params.goalTitle}`)
  if (params.goalCategory) goalLines.push(`Category: ${params.goalCategory}`)
  if (params.goalDescription) goalLines.push(`Description: ${params.goalDescription}`)
  if (params.goalTargetDate) {
    goalLines.push(`Target date: ${params.goalTargetDate.toISOString().slice(0, 10)}`)
  }

  const goalBlock = goalLines.length ? goalLines.join('\n') : '(no extra metadata)'

  return `
FRAMEWORK: ${fw.name}
RESEARCH BASIS: ${fw.researchCitation}

GOAL METADATA:
${goalBlock}

USER ANSWERS:
${answerBlock}

Generate the structured coaching plan JSON now, tailored to this user. Milestones should span roughly one per 2 weeks out to the chosen durationDays. Habits should be 1-3 core behaviours the user can start this week. Keep language warm, specific, and research-grounded.
`.trim()
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export async function generateCoachingPlan(
  params: GenerateCoachingPlanParams
): Promise<GenerateCoachingPlanResult> {
  const model = selectModel(params.userPlanSlug)

  const baseSystemPrompt = buildCoachSystemPrompt({
    persona: params.persona,
    user: {
      name: params.userName ?? null,
      identityStatement: params.identityStatement ?? null,
    },
    context: {
      activeGoalTitle: params.goalTitle ?? null,
    },
  })

  const systemPrompt = `${baseSystemPrompt}\n\n---\n\n${JSON_SCHEMA_INSTRUCTIONS}`
  const userPrompt = buildUserPrompt(params)

  // First attempt ---------------------------------------------------------
  const firstTry = await reasoningChat({
    model,
    systemPrompt,
    userPrompt,
    maxTokens: 2400,
    temperature: 0.4,
    jsonMode: true,
  })

  const firstParse = tryParsePlan(firstTry.content)
  if (firstParse.ok) {
    const tokensUsed = firstTry.totalTokens
    const cost = estimateCostUsd(model, firstTry.promptTokens, firstTry.completionTokens)
    return {
      plan: firstParse.plan,
      rawResponse: firstTry.raw,
      modelUsed: model,
      tokensUsed,
      cost,
    }
  }

  // Second attempt — feed back the parse errors ---------------------------
  const retryUserPrompt = `${userPrompt}

---

Your previous JSON failed validation with these errors:
${firstParse.errorSummary}

The raw output you returned was:
${truncate(firstTry.content, 3000)}

Try again. Return ONLY valid JSON matching the schema above. Fix every error.`.trim()

  const secondTry = await reasoningChat({
    model,
    systemPrompt,
    userPrompt: retryUserPrompt,
    maxTokens: 2400,
    temperature: 0.2,
    jsonMode: true,
  })

  const secondParse = tryParsePlan(secondTry.content)
  if (!secondParse.ok) {
    throw new Error(
      `Coaching plan generation failed twice. Final errors: ${secondParse.errorSummary}`
    )
  }

  const tokensUsed =
    (firstTry.totalTokens ?? 0) + (secondTry.totalTokens ?? 0) || secondTry.totalTokens

  const combinedPromptTokens =
    (firstTry.promptTokens ?? 0) + (secondTry.promptTokens ?? 0)
  const combinedCompletionTokens =
    (firstTry.completionTokens ?? 0) + (secondTry.completionTokens ?? 0)
  const cost = estimateCostUsd(
    model,
    combinedPromptTokens || null,
    combinedCompletionTokens || null
  )

  return {
    plan: secondParse.plan,
    rawResponse: { first: firstTry.raw, second: secondTry.raw },
    modelUsed: model,
    tokensUsed,
    cost,
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type ParseResult =
  | { ok: true; plan: z.infer<typeof coachingPlanSchema> }
  | { ok: false; errorSummary: string }

function tryParsePlan(raw: string): ParseResult {
  if (!raw || !raw.trim()) {
    return { ok: false, errorSummary: 'Model returned empty content.' }
  }

  let json: unknown
  try {
    json = JSON.parse(stripCodeFences(raw))
  } catch (err) {
    return {
      ok: false,
      errorSummary: `JSON.parse failed: ${(err as Error).message}`,
    }
  }

  const parsed = coachingPlanSchema.safeParse(json)
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `• ${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n')
    return { ok: false, errorSummary: issues }
  }

  return { ok: true, plan: parsed.data }
}

function stripCodeFences(s: string): string {
  const trimmed = s.trim()
  if (trimmed.startsWith('```')) {
    return trimmed
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/```$/i, '')
      .trim()
  }
  return trimmed
}

function truncate(s: string, n: number): string {
  if (s.length <= n) return s
  return `${s.slice(0, n)}\n…[truncated]`
}
