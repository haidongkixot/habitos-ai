import type { CoachPersona } from '@prisma/client'

/**
 * Universal coaching guardrails appended to every persona prompt.
 * These rules supersede the persona voice when conflicting.
 */
const COACHING_GUARDRAILS = `
COACHING GUARDRAILS (apply to every reply, in addition to your persona voice):
- Stay in character as defined above. Do not break role.
- Be concise. Default to under 180 words unless the user asks for depth.
- Ground advice in the user's actual context (goal, momentum, streak) when provided.
- Never promise medical, psychological, or financial outcomes. You are a habit coach, not a clinician or advisor.
- If asked for research, cite evidence by author/year (e.g. Lally 2010, Fogg 2020, Clear 2018, Gollwitzer & Sheeran 2006, Wood & Neal 2007, Deci & Ryan).
- Encourage tiny, repeatable behaviours over heroic efforts.
- Celebrate small wins. Normalize setbacks. Never shame.
- If the user shows signs of crisis or clinical distress, recommend they reach out to a qualified professional.
`.trim()

export interface BuildCoachSystemPromptParams {
  persona: CoachPersona
  user: { name?: string | null; identityStatement?: string | null }
  context?: {
    activeGoalTitle?: string | null
    momentumScore?: number | null
    streakDays?: number | null
  }
}

/**
 * Composes the final system prompt sent to OpenAI for a coaching turn.
 *
 * Output shape (top to bottom):
 *   1. Persona system prompt (verbatim, defines voice + style)
 *   2. User context block (name, identity statement)
 *   3. Plan/momentum context block (active goal, momentum, streak)
 *   4. Universal coaching guardrails
 *
 * Kept well under ~1200 tokens worth of text.
 */
export function buildCoachSystemPrompt(params: BuildCoachSystemPromptParams): string {
  const { persona, user, context } = params

  const sections: string[] = []

  // 1. Persona prompt
  sections.push(persona.systemPrompt.trim())

  // 2. User identity block
  const userLines: string[] = []
  if (user.name) userLines.push(`User name: ${user.name}`)
  if (user.identityStatement) {
    userLines.push(`Identity statement (how the user sees themselves): "${user.identityStatement}"`)
  }
  if (userLines.length > 0) {
    sections.push(`USER:\n${userLines.join('\n')}`)
  }

  // 3. Plan / momentum context
  if (context) {
    const ctxLines: string[] = []
    if (context.activeGoalTitle) ctxLines.push(`Active goal: ${context.activeGoalTitle}`)
    if (typeof context.momentumScore === 'number') {
      ctxLines.push(`Momentum score: ${context.momentumScore}/100`)
    }
    if (typeof context.streakDays === 'number') {
      ctxLines.push(`Current streak: ${context.streakDays} days`)
    }
    if (ctxLines.length > 0) {
      sections.push(`CURRENT CONTEXT:\n${ctxLines.join('\n')}`)
    }
  }

  // 4. Universal guardrails
  sections.push(COACHING_GUARDRAILS)

  return sections.join('\n\n')
}

// TODO(phase-3): If a future coach endpoint is added that does not use
// src/lib/ai-coach.ts → chat(), wire it through buildCoachSystemPrompt here.
// As of Phase 2, the only known injection point is src/lib/ai-coach.ts which
// is consumed by src/app/api/ai/chat/route.ts.
