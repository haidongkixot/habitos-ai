import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canAccessChapter, getUserPlanSlug } from '@/lib/academy/access'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = (session.user as any).id
  const userPlan = await getUserPlanSlug(userId)

  const chapters = await prisma.academyChapter.findMany({
    where: { isActive: true },
    orderBy: { orderIndex: 'asc' },
    include: {
      progress: {
        where: { userId },
        take: 1,
      },
    },
  })

  const result = chapters.map((ch) => {
    const prog = ch.progress[0]
    const locked = !canAccessChapter(userPlan, ch.minPlanSlug)
    return {
      id: ch.id,
      slug: ch.slug,
      title: ch.title,
      subtitle: ch.subtitle,
      category: ch.category,
      orderIndex: ch.orderIndex,
      imageUrl: ch.imageUrl,
      readTimeMin: ch.readTimeMin,
      keyTakeaways: ch.keyTakeaways,
      minPlanSlug: ch.minPlanSlug,
      hasQuiz: !!ch.quizData,
      locked,
      progress: prog
        ? {
            completed: prog.completed,
            readPercent: prog.readPercent,
            quizScore: prog.quizScore,
            quizPassed: prog.quizPassed,
          }
        : null,
    }
  })

  return NextResponse.json({ chapters: result, userPlan })
}
