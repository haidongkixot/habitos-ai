import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const templates = await prisma.habitTemplate.findMany({
      where: { isActive: true },
      orderBy: [{ packName: 'asc' }, { sortOrder: 'asc' }],
    })

    // Group by packName
    const grouped: Record<string, typeof templates> = {}
    for (const t of templates) {
      if (!grouped[t.packName]) grouped[t.packName] = []
      grouped[t.packName].push(t)
    }

    return NextResponse.json({ packs: grouped })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { templateId } = await req.json()
    if (!templateId) {
      return NextResponse.json({ error: 'Missing templateId' }, { status: 400 })
    }

    const template = await prisma.habitTemplate.findUnique({ where: { id: templateId } })
    if (!template || !template.isActive) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    const habit = await prisma.habit.create({
      data: {
        userId: (session.user as any).id,
        name: template.name,
        description: template.description,
        category: template.category,
        frequency: template.frequency,
        color: template.color,
        icon: template.icon,
      },
    })

    return NextResponse.json(habit, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
