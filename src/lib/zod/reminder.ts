import { z } from 'zod'

export const reminderSchema = z.object({
  planId: z.string().optional(),
  planHabitId: z.string().optional(),
  type: z.enum(['habit', 'milestone', 'motivation', 'recovery', 'celebration']),
  title: z.string().max(120),
  body: z.string(),
  channel: z.enum(['inapp', 'email', 'push', 'all']).default('all'),
  scheduledFor: z.string().datetime(),
  metadata: z.record(z.string(), z.any()).optional(),
})

export const notificationPreferenceSchema = z.object({
  inappEnabled: z.boolean(),
  emailEnabled: z.boolean(),
  pushEnabled: z.boolean(),
  quietStart: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  quietEnd: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  weekendQuiet: z.boolean(),
  cadence: z.enum(['minimal', 'normal', 'intense']),
})
