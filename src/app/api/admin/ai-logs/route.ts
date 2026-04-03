import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const url = new URL(req.url)
  const page = parseInt(url.searchParams.get('page') || '1')
  const limit = parseInt(url.searchParams.get('limit') || '20')
  const contentType = url.searchParams.get('contentType') || undefined
  const status = url.searchParams.get('status') || undefined
  const from = url.searchParams.get('from') || undefined
  const to = url.searchParams.get('to') || undefined

  const where: any = {}
  if (contentType) where.contentType = contentType
  if (status) where.status = status
  if (from || to) {
    where.createdAt = {}
    if (from) where.createdAt.gte = new Date(from)
    if (to) where.createdAt.lte = new Date(to)
  }

  const [logs, total] = await Promise.all([
    prisma.aIGenerationLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.aIGenerationLog.count({ where }),
  ])

  return NextResponse.json({ logs, total, page, limit, pages: Math.ceil(total / limit) })
}
