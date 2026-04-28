import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const PostSchema = z
  .object({
    currentPassword: z.string().min(1).max(200).optional(),
    newPassword: z.string().min(8, 'Password must be at least 8 characters').max(200),
  })
  .strict()

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string } | undefined)?.id
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = PostSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 },
    )
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, password: true },
  })
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  if (user.password) {
    if (!parsed.data.currentPassword) {
      return NextResponse.json(
        { error: 'Current password is required' },
        { status: 400 },
      )
    }
    const ok = await bcrypt.compare(parsed.data.currentPassword, user.password)
    if (!ok) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 },
      )
    }
  }

  const hash = await bcrypt.hash(parsed.data.newPassword, 12)
  await prisma.user.update({
    where: { id: userId },
    data: { password: hash },
  })

  return NextResponse.json({ ok: true })
}
