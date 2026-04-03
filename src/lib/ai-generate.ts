import { prisma } from './prisma'

interface AIGenerateOptions {
  contentType: string
  userPrompt: string
  adminId: string
  metadata?: any
  fallbackSystemPrompt?: string
}

export async function aiGenerate({ contentType, userPrompt, adminId, metadata, fallbackSystemPrompt }: AIGenerateOptions) {
  const startTime = Date.now()

  // Load config for this content type
  const config = await prisma.aIConfig.findUnique({ where: { contentType } })
  const model = config?.model ?? 'gpt-4o-mini'
  const temperature = config?.temperature ?? 0.9
  const maxTokens = config?.maxTokens ?? 1000
  const systemPrompt = config?.systemPrompt ?? fallbackSystemPrompt ?? 'You are a helpful content creator. Return ONLY valid JSON.'

  if (!config?.isActive && config) {
    throw new Error(`AI generation is disabled for ${contentType}`)
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OpenAI API key not configured')

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: maxTokens,
        temperature,
      }),
    })

    const data = await res.json()
    const raw = data.choices?.[0]?.message?.content ?? '{}'
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const result = JSON.parse(cleaned)
    const durationMs = Date.now() - startTime
    const tokensUsed = data.usage?.total_tokens ?? null

    // Log the generation
    await prisma.aIGenerationLog.create({
      data: {
        contentType,
        action: 'generate',
        prompt: userPrompt.slice(0, 5000),
        result,
        model,
        tokensUsed,
        durationMs,
        status: 'success',
        adminId,
        metadata: metadata ?? {},
      },
    })

    return { result, model, tokensUsed, durationMs }
  } catch (err: any) {
    const durationMs = Date.now() - startTime
    // Log the error
    await prisma.aIGenerationLog.create({
      data: {
        contentType,
        action: 'generate',
        prompt: userPrompt.slice(0, 5000),
        result: {},
        model,
        durationMs,
        status: 'error',
        error: String(err),
        adminId,
        metadata: metadata ?? {},
      },
    }).catch(() => {})

    throw err
  }
}
