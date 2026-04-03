import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import OpenAI from 'openai'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== 'admin') throw new Error('Unauthorized')
  return session
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
    }

    const openai = new OpenAI({ apiKey })
    const body = await req.json()
    const { category, packName, count, theme } = body

    const prompt = `Create ${count || 5} unique habit templates for a habit tracking app.
Category: ${category || 'wellness'}
Pack name: ${packName || 'Daily Essentials'}
Theme: ${theme || 'general self-improvement'}

Return ONLY valid JSON:
{
  "templates": [
    {
      "name": "Habit Name",
      "description": "Why this habit matters and how to do it (2-3 sentences)",
      "category": "${category || 'wellness'}",
      "frequency": "daily",
      "icon": "🏃",
      "color": "#10B981",
      "benefits": ["benefit 1", "benefit 2", "benefit 3"],
      "difficulty": "beginner"
    }
  ]
}

Guidelines:
- Use relevant emoji icons (🧘 for meditation, 📖 for reading, 💪 for exercise, etc.)
- Colors: #10B981 (emerald), #3B82F6 (blue), #8B5CF6 (purple), #F59E0B (amber), #EF4444 (red), #EC4899 (pink)
- Difficulties: beginner (takes <5 min), intermediate (5-20 min), advanced (20+ min)
- Descriptions should be motivating and actionable
- Each habit should be specific, measurable, and achievable`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a habit design expert. Return only valid JSON, no markdown.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.8,
      max_tokens: 2000,
    })

    const content = response.choices[0]?.message?.content || ''

    // Parse JSON from response (handle potential markdown wrapping)
    let parsed
    try {
      const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      parsed = JSON.parse(jsonStr)
    } catch {
      return NextResponse.json({ error: 'Failed to parse AI response', raw: content }, { status: 500 })
    }

    // Attach packName to each template
    const templates = (parsed.templates || []).map((t: any, i: number) => ({
      ...t,
      packName: packName || 'Daily Essentials',
      sortOrder: i,
    }))

    return NextResponse.json({ templates })
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('AI generation error:', error)
    return NextResponse.json({ error: 'Failed to generate templates' }, { status: 500 })
  }
}
