import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') {
    return null
  }
  return session
}

export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const chapters = await prisma.academyChapter.findMany({
    orderBy: { orderIndex: 'asc' },
    include: { _count: { select: { progress: true } } },
  })

  return NextResponse.json({ chapters })
}

export async function POST(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const data = await req.json()

  const chapter = await prisma.academyChapter.create({
    data: {
      slug: data.slug,
      title: data.title,
      subtitle: data.subtitle || null,
      body: data.body,
      category: data.category,
      orderIndex: data.orderIndex ?? 0,
      imageUrl: data.imageUrl || null,
      readTimeMin: data.readTimeMin ?? 5,
      keyTakeaways: data.keyTakeaways || [],
      isActive: data.isActive ?? true,
      minPlanSlug: data.minPlanSlug ?? 'free',
      quizData: data.quizData || null,
    },
  })

  return NextResponse.json({ chapter }, { status: 201 })
}

export async function PUT(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const data = await req.json()
  if (!data.id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const chapter = await prisma.academyChapter.update({
    where: { id: data.id },
    data: {
      slug: data.slug,
      title: data.title,
      subtitle: data.subtitle ?? undefined,
      body: data.body,
      category: data.category,
      orderIndex: data.orderIndex,
      imageUrl: data.imageUrl ?? undefined,
      readTimeMin: data.readTimeMin,
      keyTakeaways: data.keyTakeaways,
      isActive: data.isActive,
      minPlanSlug: data.minPlanSlug,
      quizData: data.quizData ?? undefined,
    },
  })

  return NextResponse.json({ chapter })
}

export async function DELETE(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  await prisma.academyChapter.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
