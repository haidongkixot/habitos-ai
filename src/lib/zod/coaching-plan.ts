import { z } from 'zod'

export const planHabitSchema = z.object({
  name: z.string().max(120),
  frequency: z.enum(['daily', 'weekdays', 'weekends', 'custom']),
  intentionCue: z.string().optional(),
  intentionLocation: z.string().optional(),
  intentionTime: z.string().optional(),
  intentionStatement: z.string().optional(),
  twoMinuteVersion: z.string().optional(),
  reward: z.string().optional(),
  category: z.string().optional(),
})

export const planMilestoneSchema = z.object({
  title: z.string().max(120),
  description: z.string().optional(),
  weekIndex: z.number().int().min(0).max(52),
  successMetric: z.string().optional(),
  checkpointType: z.enum(['self-report', 'photo', 'journal', 'quiz']).default('self-report'),
})

export const antiObstaclePlanSchema = z.object({
  obstacle: z.string(),
  ifThenResponse: z.string(),
})

export const coachingPlanSchema = z.object({
  title: z.string().max(80),
  summary: z.string().max(280),
  framework: z.enum(['GROW', 'WOOP', 'IDENTITY']),
  category: z.string(),
  durationDays: z.number().int().min(7).max(365).default(66),
  identityStatement: z.string().optional(),
  milestones: z.array(planMilestoneSchema).min(3).max(6),
  habits: z.array(planHabitSchema).min(1).max(4),
  weeklyCheckinPrompt: z.string(),
  motivationStyle: z.enum(['encouraging', 'firm', 'playful', 'reflective']).default('encouraging'),
  antiObstaclePlans: z.array(antiObstaclePlanSchema).max(3).default([]),
})

export type CoachingPlanOutput = z.infer<typeof coachingPlanSchema>
