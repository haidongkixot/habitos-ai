import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = (session.user as any).id
  const { slug } = params
  const { readPercent } = await req.json()

  const chapter = await prisma.academyChapter.findUnique({ where: { slug } })
  if (!chapter) {
    return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })
  }

  const pct = Math.min(100, Math.max(0, Math.round(readPercent ?? 0)))
  const completed = pct >= 100

  const progress = await prisma.userChapterProgress.upsert({
    where: { userId_chapterId: { userId, chapterId: chapter.id } },
    create: {
      userId,
      chapterId: chapter.id,
      readPercent: pct,
      completed,
      completedAt: completed ? new Date() : null,
    },
    update: {
      readPercent: pct,
      completed,
      completedAt: completed ? new Date() : undefined,
    },
  })

  return NextResponse.json({ progress })
}
