/**
 * HabitOS Phase 3 — Persist a validated coaching plan to the DB.
 *
 * Writes a single `CoachingPlan` row plus its child `PlanMilestone` and
 * `PlanHabit` rows inside a Prisma `$transaction` so partial writes are
 * impossible. Also writes a `PlanAuditLog` entry in the same transaction
 * with `action: "plan_created"`.
 *
 * Returns the freshly-created plan with its milestones + habits loaded.
 */

import { prisma } from '@/lib/prisma'
import type { z } from 'zod'
import { coachingPlanSchema } from '@/lib/zod/coaching-plan'

export type ValidatedCoachingPlan = z.infer<typeof coachingPlanSchema>

export interface PersistCoachingPlanParams {
  userId: string
  goalId: string
  plan: ValidatedCoachingPlan
  /** The OpenAI model used to generate this plan (for the aiModel column). */
  aiModel: string
  /** The raw model response blob, stored as JSON for later debugging. */
  rawAiResponse?: unknown
}

/**
 * Writes the plan + children + audit log in a single transaction.
 */
export async function persistCoachingPlan(params: PersistCoachingPlanParams) {
  const { userId, goalId, plan, aiModel, rawAiResponse } = params

  const durationDays = plan.durationDays ?? 66
  const startDate = new Date()
  const endDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000)

  const result = await prisma.$transaction(async (tx) => {
    // 1. CoachingPlan row
    const created = await (tx as any).coachingPlan.create({
      data: {
        goalId,
        userId,
        framework: plan.framework,
        title: plan.title,
        summary: plan.summary,
        identityStatement: plan.identityStatement ?? null,
        durationDays,
        startDate,
        endDate,
        status: 'active',
        momentumScore: 50,
        completionPercent: 0,
        motivationStyle: plan.motivationStyle ?? 'encouraging',
        weeklyCheckinPrompt: plan.weeklyCheckinPrompt,
        aiModel,
        rawAiResponse: rawAiResponse as any,
      },
    })

    // 2. Milestones
    if (plan.milestones.length > 0) {
      await (tx as any).planMilestone.createMany({
        data: plan.milestones.map((m) => ({
          planId: created.id,
          title: m.title,
          description: m.description ?? null,
          weekIndex: m.weekIndex,
          successMetric: m.successMetric ?? null,
          checkpointType: m.checkpointType ?? 'self-report',
          status: 'pending',
        })),
      })
    }

    // 3. Habits
    if (plan.habits.length > 0) {
      await (tx as any).planHabit.createMany({
        data: plan.habits.map((h) => ({
          planId: created.id,
          name: h.name,
          frequency: h.frequency,
          intentionCue: h.intentionCue ?? null,
          intentionLocation: h.intentionLocation ?? null,
          intentionTime: h.intentionTime ?? null,
          intentionStatement: h.intentionStatement ?? null,
          twoMinuteVersion: h.twoMinuteVersion ?? null,
          reward: h.reward ?? null,
          category: h.category ?? null,
          isActive: true,
        })),
      })
    }

    // 4. Audit log (inside the transaction so the plan + audit row are atomic)
    await (tx as any).planAuditLog.create({
      data: {
        planId: created.id,
        userId,
        adminId: null,
        action: 'plan_created',
        before: undefined,
        after: {
          framework: plan.framework,
          title: plan.title,
          durationDays,
          milestoneCount: plan.milestones.length,
          habitCount: plan.habits.length,
          antiObstacleCount: plan.antiObstaclePlans?.length ?? 0,
          aiModel,
        },
        reason: 'Created via wizard + generate-plan pipeline.',
      },
    })

    // 5. Return the plan with children loaded
    const full = await (tx as any).coachingPlan.findUnique({
      where: { id: created.id },
      include: {
        milestones: { orderBy: { weekIndex: 'asc' } },
        planHabits: { orderBy: { createdAt: 'asc' } },
      },
    })

    return full
  })

  return result
}
