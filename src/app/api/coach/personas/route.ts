import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { listPersonas } from '@/lib/coach/personas'
import { buildAvatarUrl } from '@/lib/coach/avatar'
import { getUserPlanSlug } from '@/lib/academy/access'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = (session.user as any).id as string

  const userPlanSlug = await getUserPlanSlug(userId)

  const personas = await listPersonas({ planSlug: userPlanSlug, onlyActive: true })

  // Look up which persona the user has currently selected (if any).
  let userCurrentPersonaSlug: string | null = null
  try {
    const settings = await (prisma as any).userCoachSettings?.findUnique?.({
      where: { userId },
    })
    if (settings?.personaId) {
      const current = await (prisma as any).coachPersona.findUnique({
        where: { id: settings.personaId },
        select: { slug: true },
      })
      userCurrentPersonaSlug = current?.slug ?? null
    }
  } catch {
    userCurrentPersonaSlug = null
  }

  const enriched = personas.map((p) => ({
    ...p,
    avatarUrl: buildAvatarUrl(p),
  }))

  return NextResponse.json({
    personas: enriched,
    userPlanSlug,
    userCurrentPersonaSlug,
  })
}
