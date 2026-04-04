import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canAccessChapter, getUserPlanSlug } from '@/lib/academy/access'

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = (session.user as any).id
  const { slug } = params

  const chapter = await prisma.academyChapter.findUnique({
    where: { slug },
    include: {
      progress: { where: { userId }, take: 1 },
    },
  })

  if (!chapter || !chapter.isActive) {
    return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })
  }

  const userPlan = await getUserPlanSlug(userId)
  const locked = !canAccessChapter(userPlan, chapter.minPlanSlug)

  if (locked) {
    return NextResponse.json(
      {
        error: 'Upgrade required',
        chapter: {
          slug: chapter.slug,
          title: chapter.title,
          subtitle: chapter.subtitle,
          category: chapter.category,
          readTimeMin: chapter.readTimeMin,
          minPlanSlug: chapter.minPlanSlug,
          locked: true,
        },
      },
      { status: 403 }
    )
  }

  const prog = chapter.progress[0]

  return NextResponse.json({
    ...chapter,
    progress: prog ?? null,
    locked: false,
  })
}
