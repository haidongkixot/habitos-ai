import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const { code } = await req.json()
    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Invalid code' }, { status: 400 })
    }
    const referralCode = await prisma.referralCode.findUnique({ where: { code } })
    if (!referralCode) {
      return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 })
    }
    await prisma.referralCode.update({
      where: { code },
      data: { clicks: { increment: 1 } },
    })
    const response = NextResponse.json({ success: true })
    response.cookies.set('referral_code', code, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })
    return response
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
