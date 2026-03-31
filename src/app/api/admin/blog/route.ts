import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const posts = await prisma.blogPost.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ posts })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { title } = await req.json()
  if (!title) return NextResponse.json({ error: 'Title required' }, { status: 400 })
  const post = await prisma.blogPost.create({
    data: { title, slug: slugify(title), status: 'draft', authorId: (session.user as any).id },
  })
  return NextResponse.json(post)
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id, status, title, content, excerpt } = await req.json()
  const post = await prisma.blogPost.update({
    where: { id },
    data: { ...(status && { status }), ...(title && { title, slug: slugify(title) }), ...(content !== undefined && { content }), ...(excerpt !== undefined && { excerpt }) },
  })
  return NextResponse.json(post)
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await req.json()
  await prisma.blogPost.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
