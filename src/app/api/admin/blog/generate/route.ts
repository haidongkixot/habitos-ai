import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { aiGenerate } from '@/lib/ai-generate'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { topic, tone } = await req.json()
  if (!topic) return NextResponse.json({ error: 'Topic is required' }, { status: 400 })

  const toneGuide = tone === 'scientific'
    ? 'Use a scientific, evidence-based tone with references to research.'
    : tone === 'inspirational'
    ? 'Use an inspirational, uplifting tone that motivates the reader.'
    : 'Use an educational, informative tone that teaches the reader.'

  const userPrompt = `Create a blog post about habits, productivity, or self-improvement.
Topic: ${topic}
Tone: ${toneGuide}

Return ONLY valid JSON with this structure:
{
  "title": "Engaging Blog Title",
  "slug": "url-friendly-slug",
  "excerpt": "A compelling 1-2 sentence summary",
  "body": "Full blog post in markdown format (500-800 words). Include headings, paragraphs, and bullet points where appropriate.",
  "tags": ["tag1", "tag2", "tag3"]
}

Guidelines:
- Title should be catchy and SEO-friendly
- Slug should be lowercase with dashes
- Body should be well-structured markdown with ## headings
- Include practical tips and actionable advice
- Reference habit science and behavior change research where appropriate
- Tags should be relevant keywords (3-5 tags)`

  try {
    const { result, model, tokensUsed, durationMs } = await aiGenerate({
      contentType: 'blog_post',
      userPrompt,
      adminId: (session.user as any).id || session.user?.email || 'admin',
      metadata: { topic, tone },
      fallbackSystemPrompt: 'You are a productivity and habit science writer. Write engaging, research-backed blog posts about habit building, behavior change, and personal growth. Return ONLY valid JSON.',
    })

    return NextResponse.json({ post: result, model, tokensUsed, durationMs, status: 'preview' })
  } catch (err) {
    return NextResponse.json({ error: 'AI generation failed: ' + String(err) }, { status: 500 })
  }
}
