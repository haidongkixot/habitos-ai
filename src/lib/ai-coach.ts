import OpenAI from 'openai'
import type { CoachPersona } from '@prisma/client'
import { buildCoachSystemPrompt } from '@/lib/coach/system-prompt'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

/**
 * Legacy fallback prompt — used only when no persona is supplied (e.g.
 * during tests or if the persona seed has not run). The persona-aware
 * pipeline is the default path in production.
 */
const LEGACY_SYSTEM_PROMPT = `You are Habitos Coach, an encouraging and knowledgeable AI habit-building coach.

Your expertise includes:
- Habit formation science (cue-routine-reward loops, habit stacking, implementation intentions)
- Behavioral psychology (BJ Fogg's Tiny Habits, James Clear's Atomic Habits principles)
- Streak psychology and motivation
- Breaking bad habits and replacing them with positive ones
- Building keystone habits that create positive cascading effects

Guidelines:
- Be warm, supportive, and concise (under 200 words unless asked for detail)
- Celebrate wins and streaks enthusiastically
- When users struggle, normalize setbacks and focus on restart strategies
- Give specific, actionable advice — not generic platitudes
- Reference the user's actual habit data when provided in context
- Use simple language; avoid jargon unless explaining a concept`

const FALLBACK_TIPS = [
  'Start with a habit so small it feels almost too easy. Success builds momentum.',
  'Stack your new habit onto something you already do every day.',
  'Track your streaks visually. Seeing progress is incredibly motivating.',
  'Missed a day? No problem. Never miss twice in a row — that is the real rule.',
  'Environment design beats willpower. Make good habits easy and bad habits hard.',
  'Celebrate each small win. Your brain needs that positive reinforcement.',
  'Focus on identity: "I am someone who exercises" is more powerful than "I need to exercise."',
  'The two-minute rule: scale any habit down to something that takes two minutes to start.',
]

export interface CoachContext {
  userName?: string
  currentStreak?: number
  totalCheckins?: number
  activeHabits?: string[]
  recentMood?: number
  // --- Phase 2 additions (all optional for backward compatibility) ---
  /** The user's chosen persona. If supplied, the persona system prompt is injected. */
  persona?: CoachPersona
  /** The user's identity statement (from their active CoachingPlan). */
  identityStatement?: string | null
  /** The active goal title for context injection. */
  activeGoalTitle?: string | null
  /** Momentum score (0-100) from the active CoachingPlan. */
  momentumScore?: number | null
}

/**
 * Sends a chat completion to OpenAI for the coach pipeline.
 *
 * Backward compatible: callers that omit `context.persona` get the legacy
 * Habitos Coach prompt — same shape as before. Callers that include
 * `context.persona` get the full persona-driven system prompt with
 * coaching guardrails injected.
 *
 * The return shape `{ reply, fallback }` is unchanged.
 */
export async function chat(
  messages: { role: 'user' | 'assistant'; content: string }[],
  context?: CoachContext
) {
  const systemContent = buildSystemContent(context)

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemContent },
        ...messages,
      ],
      max_tokens: 500,
      temperature: 0.7,
    })

    return {
      reply: completion.choices[0]?.message?.content ?? getFallbackTip(),
      fallback: false,
    }
  } catch (err) {
    console.error('[ai-coach] OpenAI error:', err)
    return {
      reply: getFallbackTip(),
      fallback: true,
    }
  }
}

function buildSystemContent(context?: CoachContext): string {
  // Persona-aware path (Phase 2)
  if (context?.persona) {
    return buildCoachSystemPrompt({
      persona: context.persona,
      user: {
        name: context.userName ?? null,
        identityStatement: context.identityStatement ?? null,
      },
      context: {
        activeGoalTitle: context.activeGoalTitle ?? null,
        momentumScore: context.momentumScore ?? null,
        streakDays: context.currentStreak ?? null,
      },
    })
  }

  // Legacy path — preserve original Phase 1 behaviour exactly.
  let systemContent = LEGACY_SYSTEM_PROMPT

  if (context) {
    const parts: string[] = []
    if (context.userName) parts.push(`User's name: ${context.userName}`)
    if (context.currentStreak !== undefined) parts.push(`Current streak: ${context.currentStreak} days`)
    if (context.totalCheckins !== undefined) parts.push(`Total check-ins: ${context.totalCheckins}`)
    if (context.activeHabits?.length) parts.push(`Active habits: ${context.activeHabits.join(', ')}`)
    if (context.recentMood !== undefined) parts.push(`Recent mood rating: ${context.recentMood}/5`)
    if (parts.length > 0) {
      systemContent += `\n\nUser context:\n${parts.join('\n')}`
    }
  }

  return systemContent
}

function getFallbackTip(): string {
  return FALLBACK_TIPS[Math.floor(Math.random() * FALLBACK_TIPS.length)]
}
