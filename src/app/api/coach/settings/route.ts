import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { userCoachSettingsSchema } from '@/lib/zod/coach-persona'
import { canUserAccessPersona } from '@/lib/coach/personas'
import { getUserPlanSlug } from '@/lib/academy/access'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = (session.user as any).id as string

  const settings = await (prisma as any).userCoachSettings?.findUnique?.({
    where: { userId },
  })

  return NextResponse.json({ settings: settings ?? null })
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = (session.user as any).id as string

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = userCoachSettingsSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.flatten() },
      { status: 400 }
    )
  }
  const data = parsed.data

  const userPlanSlug = await getUserPlanSlug(userId)
  const isPremium = userPlanSlug === 'premium'

  // Premium-only fields: custom outfit + custom accent (custom voice).
  // Reject for non-premium users.
  if (!isPremium) {
    if (data.outfitPack) {
      return NextResponse.json({ error: 'Premium feature' }, { status: 403 })
    }
    if (data.accent) {
      return NextResponse.json({ error: 'Premium feature' }, { status: 403 })
    }
  }

  // If a persona was supplied, verify it exists AND user can access it.
  if (data.personaId) {
    const persona = await (prisma as any).coachPersona.findUnique({
      where: { id: data.personaId },
    })
    if (!persona) {
      return NextResponse.json({ error: 'Persona not found' }, { status: 404 })
    }
    if (!persona.isActive) {
      return NextResponse.json({ error: 'Persona not available' }, { status: 403 })
    }
    if (!canUserAccessPersona(persona, userPlanSlug)) {
      return NextResponse.json(
        { error: 'Your plan does not include this persona' },
        { status: 403 }
      )
    }
  }

  const upserted = await (prisma as any).userCoachSettings.upsert({
    where: { userId },
    update: {
      personaId: data.personaId ?? null,
      customName: data.customName ?? null,
      customGender: data.customGender ?? null,
      outfitPack: data.outfitPack ?? null,
      accent: data.accent ?? null,
      relationshipStyle: data.relationshipStyle ?? null,
      customSystemAdd: data.customSystemAdd ?? null,
    },
    create: {
      userId,
      personaId: data.personaId ?? null,
      customName: data.customName ?? null,
      customGender: data.customGender ?? null,
      outfitPack: data.outfitPack ?? null,
      accent: data.accent ?? null,
      relationshipStyle: data.relationshipStyle ?? null,
      customSystemAdd: data.customSystemAdd ?? null,
    },
  })

  return NextResponse.json({ settings: upserted })
}
