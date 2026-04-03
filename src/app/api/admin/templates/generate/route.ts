import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { aiGenerate } from '@/lib/ai-generate'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
      "icon": "\u{1F3C3}",
      "color": "#10B981",
      "benefits": ["benefit 1", "benefit 2", "benefit 3"],
      "difficulty": "beginner"
    }
  ]
}

Guidelines:
- Use relevant emoji icons
- Colors: #10B981 (emerald), #3B82F6 (blue), #8B5CF6 (purple), #F59E0B (amber), #EF4444 (red), #EC4899 (pink)
- Difficulties: beginner (takes <5 min), intermediate (5-20 min), advanced (20+ min)
- Descriptions should be motivating and actionable
- Each habit should be specific, measurable, and achievable`

    const { result: parsed, model, tokensUsed, durationMs } = await aiGenerate({
      contentType: 'habit_template',
      userPrompt: prompt,
      adminId: (session.user as any).id || session.user?.email || 'admin',
      metadata: { category, packName, count, theme },
      fallbackSystemPrompt: 'You are a habit design expert. Return only valid JSON, no markdown.',
    })

    // Attach packName to each template
    const templates = (parsed.templates || []).map((t: any, i: number) => ({
      ...t,
      packName: packName || 'Daily Essentials',
      sortOrder: i,
    }))

    return NextResponse.json({ templates, model, tokensUsed, durationMs })
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('AI generation error:', error)
    return NextResponse.json({ error: 'Failed to generate templates' }, { status: 500 })
  }
}
