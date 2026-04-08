/**
 * HabitOS Phase 3 — Thin OpenAI reasoning/chat wrapper.
 *
 * This is intentionally minimal: one exported function `reasoningChat` that
 * takes a system + user prompt plus model routing and returns the raw text,
 * the model used, and token accounting so the caller can log a
 * CoachingSession / AIGenerationLog row.
 *
 * Reuses the same `openai` SDK import path already used by
 * `src/lib/ai-coach.ts` so no new dependency is introduced.
 */

import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export interface ReasoningChatParams {
  model: string
  systemPrompt: string
  userPrompt: string
  /** Upper bound on response tokens. Defaults to 2000 which is plenty for a plan. */
  maxTokens?: number
  /** 0-2. Lower = more deterministic. Default 0.3 for structured JSON. */
  temperature?: number
  /** If true, sets response_format to json_object for strict parsing. */
  jsonMode?: boolean
}

export interface ReasoningChatResult {
  /** Raw text content from the first choice. */
  content: string
  /** The model string actually used (echoes the input, kept for auditing). */
  model: string
  /** Prompt tokens if the SDK returned usage data. */
  promptTokens: number | null
  /** Completion tokens if the SDK returned usage data. */
  completionTokens: number | null
  /** Total tokens if the SDK returned usage data. */
  totalTokens: number | null
  /** Raw OpenAI response object for downstream logging. */
  raw: unknown
}

/**
 * Sends a single system+user prompt to the OpenAI chat completions endpoint
 * and returns the text reply plus token accounting.
 *
 * NOTE: Some reasoning models (o-series) reject the `temperature` field. We
 * detect that class by slug prefix and omit the field accordingly.
 */
export async function reasoningChat(
  params: ReasoningChatParams
): Promise<ReasoningChatResult> {
  const {
    model,
    systemPrompt,
    userPrompt,
    maxTokens = 2000,
    temperature = 0.3,
    jsonMode = false,
  } = params

  const isReasoningModel = /^o\d/i.test(model) || model.startsWith('o4-mini') || model.startsWith('o3')

  const request: Record<string, unknown> = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  }

  // Reasoning models use max_completion_tokens, classic chat models use max_tokens.
  if (isReasoningModel) {
    request.max_completion_tokens = maxTokens
  } else {
    request.max_tokens = maxTokens
    request.temperature = temperature
  }

  if (jsonMode) {
    request.response_format = { type: 'json_object' }
  }

  const completion = await (openai.chat.completions.create as any)(request)

  const choice = completion?.choices?.[0]
  const content: string = choice?.message?.content ?? ''

  const usage = completion?.usage ?? null

  return {
    content,
    model,
    promptTokens: usage?.prompt_tokens ?? null,
    completionTokens: usage?.completion_tokens ?? null,
    totalTokens: usage?.total_tokens ?? null,
    raw: completion,
  }
}
