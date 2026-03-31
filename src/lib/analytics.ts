import { prisma } from './prisma'

export async function trackEvent(
  userId: string,
  type: string,
  metadata?: Record<string, unknown>
) {
  try {
    await prisma.activityEvent.create({
      data: {
        userId,
        type,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    })
  } catch (err) {
    console.error('[analytics] Failed to track event:', type, err)
  }
}

export async function getEventCount(
  userId: string,
  type: string,
  since?: Date
) {
  return prisma.activityEvent.count({
    where: {
      userId,
      type,
      ...(since ? { createdAt: { gte: since } } : {}),
    },
  })
}

export async function getRecentEvents(
  userId: string,
  limit = 20
) {
  return prisma.activityEvent.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}
