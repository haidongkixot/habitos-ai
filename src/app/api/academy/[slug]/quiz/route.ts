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
  const { answers } = await req.json()

  const chapter = await prisma.academyChapter.findUnique({ where: { slug } })
  if (!chapter || !chapter.quizData) {
    return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
  }

  const quiz = chapter.quizData as { questions: { correctAnswer: number }[] }
  const questions = quiz.questions || []
  if (!Array.isArray(answers) || answers.length !== questions.length) {
    return NextResponse.json({ error: 'Invalid answers' }, { status: 400 })
  }

  let correct = 0
  questions.forEach((q, i) => {
    if (q.correctAnswer === answers[i]) correct++
  })

  const score = Math.round((correct / questions.length) * 100)
  const passed = score >= 70

  // Update progress
  const progress = await prisma.userChapterProgress.upsert({
    where: { userId_chapterId: { userId, chapterId: chapter.id } },
    create: {
      userId,
      chapterId: chapter.id,
      quizScore: score,
      quizPassed: passed,
      readPercent: 100,
      completed: passed,
      completedAt: passed ? new Date() : null,
    },
    update: {
      quizScore: score,
      quizPassed: passed,
      completed: passed ? true : undefined,
      completedAt: passed ? new Date() : undefined,
    },
  })

  // Award XP if passed
  if (passed) {
    try {
      const existing = await prisma.xpTransaction.findFirst({
        where: { userId, source: 'academy_quiz', detail: chapter.id },
      })
      if (!existing) {
        await prisma.xpTransaction.create({
          data: { userId, amount: 50, source: 'academy_quiz', detail: chapter.id },
        })
        await prisma.userGamification.upsert({
          where: { userId },
          create: { userId, xp: 50 },
          update: { xp: { increment: 50 } },
        })
      }
    } catch {}
  }

  return NextResponse.json({
    score,
    passed,
    correct,
    total: questions.length,
    progress,
  })
}
