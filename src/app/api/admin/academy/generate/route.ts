import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { aiGenerate } from '@/lib/ai-generate'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { title, category } = await req.json()

  const prompt = `Create an educational academy chapter for a habit-building and personal development app.
Title: "${title}"
Category: ${category || 'wellness'}

Return ONLY valid JSON with this exact structure:
{
  "body": "Full markdown body (600-800 words). Include ## headings, bullet points, and cite relevant research. Make it engaging and educational.",
  "subtitle": "A compelling one-line subtitle",
  "keyTakeaways": ["takeaway 1", "takeaway 2", "takeaway 3", "takeaway 4", "takeaway 5"],
  "readTimeMin": 5,
  "quizData": {
    "questions": [
      {
        "question": "Question text?",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": 0
      },
      {
        "question": "Question text?",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": 1
      },
      {
        "question": "Question text?",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": 2
      },
      {
        "question": "Question text?",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": 0
      }
    ]
  }
}

Guidelines:
- Body should be rich markdown with research citations
- Key takeaways should be practical and actionable
- Quiz questions should test comprehension, not trivia
- Focus on habit science, behavior change, and personal development`

  try {
    const { result, model, tokensUsed, durationMs } = await aiGenerate({
      contentType: 'academy_chapter',
      userPrompt: prompt,
      adminId: (session.user as any).id || session.user?.email || 'admin',
      metadata: { title, category },
      fallbackSystemPrompt:
        'You are a behavioral science educator and habit formation expert. Create engaging, evidence-based educational content about habits, behavior change, and personal development. Return ONLY valid JSON.',
    })

    return NextResponse.json({ result, model, tokensUsed, durationMs, status: 'preview' })
  } catch (err) {
    return NextResponse.json({ error: 'AI generation failed: ' + String(err) }, { status: 500 })
  }
}
