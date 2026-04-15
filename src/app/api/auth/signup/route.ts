import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { checkRateLimit } from '@/lib/rate-limit'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown'
  if (!checkRateLimit(`signup:${ip}`, 5, 60000)) {
    return NextResponse.json({ error: 'Too many attempts' }, { status: 429 })
  }
  try {
    const { name, email, password, referralCode: refFromBody } = await req.json()
    if (!email || !password || password.length < 6) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }
    const exists = await prisma.user.findUnique({ where: { email } })
    if (exists) return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    const hashed = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({ data: { name, email, password: hashed } })

    // Handle referral: check body param first, then cookie
    const cookieStore = await cookies()
    const refCode = refFromBody || cookieStore.get('referral_code')?.value
    if (refCode) {
      try {
        const referralCodeRow = await prisma.referralCode.findUnique({
          where: { code: refCode },
        })
        if (referralCodeRow && referralCodeRow.userId !== user.id) {
          // Create the referral reward (pending activation)
          await prisma.referralReward.create({
            data: {
              referrerId: referralCodeRow.userId,
              referredUserId: user.id,
              referralCodeId: referralCodeRow.id,
            },
          })
        }
      } catch {
        // Non-critical: don't fail signup if referral tracking fails
      }
    }

    return NextResponse.json({ id: user.id, email: user.email }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}