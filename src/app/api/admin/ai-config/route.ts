import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const configs = await prisma.aIConfig.findMany({ orderBy: { contentType: 'asc' } })
  return NextResponse.json({ configs })
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { contentType, model, temperature, maxTokens, systemPrompt, isActive } = body

  if (!contentType) return NextResponse.json({ error: 'contentType required' }, { status: 400 })

  const config = await prisma.aIConfig.upsert({
    where: { contentType },
    update: {
      ...(model !== undefined && { model }),
      ...(temperature !== undefined && { temperature: parseFloat(temperature) }),
      ...(maxTokens !== undefined && { maxTokens: parseInt(maxTokens) }),
      ...(systemPrompt !== undefined && { systemPrompt }),
      ...(isActive !== undefined && { isActive }),
    },
    create: {
      contentType,
      model: model ?? 'gpt-4o-mini',
      temperature: temperature ? parseFloat(temperature) : 0.9,
      maxTokens: maxTokens ? parseInt(maxTokens) : 1000,
      systemPrompt: systemPrompt ?? 'You are a helpful content creator. Return ONLY valid JSON.',
      isActive: isActive ?? true,
    },
  })

  return NextResponse.json({ config })
}
