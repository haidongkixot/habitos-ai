import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { habitId, date, note, mood } = await req.json()
    if (!habitId) return NextResponse.json({ error: 'Missing habitId' }, { status: 400 })
    const dateStr = date || new Date().toISOString().slice(0, 10)
    const checkin = await prisma.checkIn.upsert({
      where: { habitId_date: { habitId, date: dateStr } },
      update: { completed: true, note: note?.slice(0, 500), mood },
      create: {
        userId: (session.user as any).id,
        habitId,
        date: dateStr,
        completed: true,
        note: note?.slice(0, 500),
        mood,
      },
    })
    return NextResponse.json(checkin, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { habitId, date } = await req.json()
    const dateStr = date || new Date().toISOString().slice(0, 10)
    await prisma.checkIn.deleteMany({
      where: { habitId, date: dateStr, userId: (session.user as any).id },
    })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}