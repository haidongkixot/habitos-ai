import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import OpenAI from 'openai'

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey || apiKey === 'your-openai-api-key') return null
  return new OpenAI({ apiKey })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { habits, streak, weeklyRate } = await req.json()
    const openai = getOpenAI()
    if (!openai) {
      const tip = streak > 7 ? 'Amazing streak! You\'re building strong momentum.' :
        streak > 3 ? 'Great consistency! Keep the chain going.' :
        weeklyRate > 50 ? 'Good progress this week. Try to check in at the same time each day.' :
        'Start small — even one habit completed today builds momentum for tomorrow.'
      return NextResponse.json({ coaching: tip })
    }

    const resp = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 200,
      temperature: 0.7,
      messages: [{
        role: 'system',
        content: 'You are a habit coaching AI. Give brief, actionable advice based on habit tracking data. Be encouraging and specific.'
      }, {
        role: 'user',
        content: `Habits: ${String(habits || '').slice(0, 200)}, Streak: ${streak} days, Weekly completion: ${weeklyRate}%`
      }],
    })

    return NextResponse.json({ coaching: resp.choices[0]?.message?.content || 'Keep building those habits!' })
  } catch {
    return NextResponse.json({ coaching: 'Stay consistent — small daily actions lead to big changes!' })
  }
}