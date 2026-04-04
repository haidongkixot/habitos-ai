import { prisma } from '../prisma'

const PLAN_HIERARCHY = ['free', 'starter', 'pro', 'premium']

export function canAccessChapter(userPlanSlug: string, chapterMinPlanSlug: string): boolean {
  const userLevel = PLAN_HIERARCHY.indexOf(userPlanSlug)
  const requiredLevel = PLAN_HIERARCHY.indexOf(chapterMinPlanSlug)
  if (userLevel === -1) return chapterMinPlanSlug === 'free'
  if (requiredLevel === -1) return true
  return userLevel >= requiredLevel
}

export async function getUserPlanSlug(userId: string): Promise<string> {
  try {
    const sub = await (prisma as any).subscription?.findFirst?.({
      where: { userId, status: 'active' },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    })
    return sub?.plan?.slug ?? 'free'
  } catch {
    return 'free'
  }
}
