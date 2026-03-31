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
    const page = parseInt(searchParams.get('page') || '1', 10)
    const completedFilter = searchParams.get('completed') || 'all'

    const pageSize = 25
    const skip = (page - 1) * pageSize

    const where: any = {}
    if (completedFilter === 'yes') where.completed = true
    if (completedFilter === 'no') where.completed = false

    const [checkins, total] = await Promise.all([
      prisma.checkIn.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          habit: {
            select: {
              name: true,
            },
          },
        },
      }),
      prisma.checkIn.count({ where }),
    ])

    const totalPages = Math.ceil(total / pageSize)

    return NextResponse.json({ checkins, total, totalPages })
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
