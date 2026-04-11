import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const { email, source } = await req.json()
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
    }
    const normalized = email.toLowerCase().trim()

    // Upsert — resubscribe if previously unsubscribed
    await (prisma as any).emailSubscriber.upsert({
      where: { email: normalized },
      update: { status: 'active', unsubAt: null, source: source || 'landing_page' },
      create: { email: normalized, source: source || 'landing_page' },
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
