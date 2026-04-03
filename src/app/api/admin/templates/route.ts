import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== 'admin') throw new Error('Unauthorized')
  return session
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const packName = searchParams.get('packName')

    const where: Record<string, unknown> = {}
    if (category && category !== 'all') where.category = category
    if (packName && packName !== 'all') where.packName = packName

    const templates = await prisma.habitTemplate.findMany({
      where,
      orderBy: [{ packName: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json({ templates })
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()

    const body = await req.json()
    const { name, description, category, frequency, icon, color, packName, difficulty, benefits, sortOrder } = body

    if (!name || !description || !category) {
      return NextResponse.json({ error: 'Missing required fields: name, description, category' }, { status: 400 })
    }

    const template = await prisma.habitTemplate.create({
      data: {
        name,
        description,
        category,
        frequency: frequency || 'daily',
        icon: icon || '⭐',
        color: color || '#10B981',
        packName: packName || 'General',
        difficulty: difficulty || 'beginner',
        benefits: benefits || [],
        sortOrder: sortOrder || 0,
      },
    })

    return NextResponse.json({ template }, { status: 201 })
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin()

    const body = await req.json()
    const { id, ...data } = body

    if (!id) {
      return NextResponse.json({ error: 'Missing template id' }, { status: 400 })
    }

    const template = await prisma.habitTemplate.update({
      where: { id },
      data,
    })

    return NextResponse.json({ template })
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin()

    const body = await req.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'Missing template id' }, { status: 400 })
    }

    await prisma.habitTemplate.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
