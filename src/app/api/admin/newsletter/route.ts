import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if ((session?.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const [total, active, unsubscribed, recent] = await Promise.all([
    prisma.emailSubscriber.count(),
    prisma.emailSubscriber.count({ where: { status: 'active' } }),
    prisma.emailSubscriber.count({ where: { status: 'unsubscribed' } }),
    prisma.emailSubscriber.findMany({
      orderBy: { subscribedAt: 'desc' },
      take: 50,
      select: { id: true, email: true, status: true, source: true, subscribedAt: true },
    }),
  ])
  return NextResponse.json({ total, active, unsubscribed, subscribers: recent })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if ((session?.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { subject, html, previewOnly } = await req.json()
  if (!subject || !html) {
    return NextResponse.json({ error: 'subject and html required' }, { status: 400 })
  }
  const key = process.env.RESEND_API_KEY
  if (!key) {
    return NextResponse.json({ error: 'RESEND_API_KEY not configured — set it in Vercel environment variables' }, { status: 503 })
  }
  const subscribers = await prisma.emailSubscriber.findMany({
    where: { status: 'active' },
    select: { email: true },
  })
  if (previewOnly) {
    return NextResponse.json({ count: subscribers.length, preview: true, subject, sample: subscribers.slice(0, 5).map(s => s.email) })
  }
  const { Resend } = require('resend') as typeof import('resend')
  const resend = new Resend(key)
  const FROM = process.env.RESEND_FROM_EMAIL || 'HabitOS <noreply@habitos.app>'
  let sent = 0
  let failed = 0
  const errors: string[] = []
  const BATCH_SIZE = 50
  for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
    const batch = subscribers.slice(i, i + BATCH_SIZE)
    try {
      const results = await Promise.allSettled(batch.map(s => resend.emails.send({ from: FROM, to: s.email, subject, html })))
      results.forEach((r, idx) => {
        if (r.status === 'fulfilled') sent++
        else { failed++; errors.push(`${batch[idx].email}: ${r.reason}`) }
      })
    } catch (err) { failed += batch.length; errors.push(`Batch error: ${err}`) }
    if (i + BATCH_SIZE < subscribers.length) await new Promise(resolve => setTimeout(resolve, 200))
  }
  return NextResponse.json({ sent, failed, total: subscribers.length, errors: errors.slice(0, 10) })
}
