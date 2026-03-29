import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const habits = await prisma.habit.findMany({
      where: { userId: (session.user as any).id, isActive: true },
      include: {
        checkins: {
          where: { date: new Date().toISOString().slice(0, 10) },
          take: 1,
        },
        _count: { select: { checkins: true } },
      },
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json(habits)
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { name, description, category, frequency, targetDays, color, icon } = await req.json()
    if (!name || name.length > 100) return NextResponse.json({ error: 'Invalid name' }, { status: 400 })
    const habit = await prisma.habit.create({
      data: {
        userId: (session.user as any).id,
        name: name.slice(0, 100),
        description: description?.slice(0, 500),
        category: category || 'general',
        frequency: frequency || 'daily',
        targetDays: targetDays || 7,
        color: color || '#10b981',
        icon: icon || 'check',
      },
    })
    return NextResponse.json(habit, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}