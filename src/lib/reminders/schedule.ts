/**
 * HabitOS M4 — Reminder scheduler (pure functions).
 *
 * Builds `ReminderSpec[]` from a CoachingPlan + its habits + milestones,
 * honouring the user's NotificationPreference and any detected push
 * subscription. Pure — does NOT touch the DB. Callers pass the plan in
 * already-loaded form.
 *
 * Channel resolution rules:
 *   - inapp  → always available (default fallback)
 *   - push   → enabled only when `hasPushSubscription === true` AND
 *              `preferences?.pushEnabled !== false`
 *   - email  → enabled only when `preferences?.emailEnabled !== false`
 *
 * Quiet hours:
 *   If quietStart/quietEnd are set on NotificationPreference the scheduled
 *   timestamp is nudged forward to the next valid window (per user timezone).
 *
 * All returned `scheduledFor` values are UTC `Date` instances.
 */

export type ReminderType =
  | 'habit'
  | 'milestone'
  | 'motivation'
  | 'recovery'
  | 'celebration'

export type ReminderChannel = 'inapp' | 'email' | 'push' | 'all'

export type ReminderSpec = {
  type: ReminderType
  title: string
  body: string
  channel: ReminderChannel
  scheduledFor: Date
  planHabitId?: string
  metadata?: Record<string, unknown>
}

export interface SchedulePlanInput {
  id: string
  startDate: Date | string
  endDate?: Date | string | null
  title: string
  weeklyCheckinPrompt?: string | null
  motivationStyle?: string | null
  planHabits?: Array<{
    id: string
    name: string
    frequency?: string | null
    intentionTime?: string | null
    isActive?: boolean | null
  }>
  milestones?: Array<{
    id: string
    title: string
    weekIndex: number
    status?: string | null
  }>
}

export interface SchedulePreferences {
  inappEnabled?: boolean | null
  emailEnabled?: boolean | null
  pushEnabled?: boolean | null
  quietStart?: string | null
  quietEnd?: string | null
  weekendQuiet?: boolean | null
  cadence?: string | null
}

export interface BuildRemindersInput {
  plan: SchedulePlanInput
  /** IANA time zone id. Defaults to UTC. We only use this as an annotation —
   *  schedule math is done directly in UTC against a "local-8am" heuristic. */
  userTimezone?: string | null
  preferences?: SchedulePreferences | null
  /** Whether the user has at least one active push subscription. */
  hasPushSubscription?: boolean
  /** Override "now" — for tests. */
  now?: Date
  /** Maximum number of daily habit specs per habit. Defaults to 14 (two weeks
   *  worth of lead-time). Cron + watchdog will schedule more as the plan
   *  progresses. */
  dailyLookAheadDays?: number
}

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR

function coerceDate(value: Date | string): Date {
  return value instanceof Date ? new Date(value.getTime()) : new Date(value)
}

function parseHHMM(value?: string | null): { h: number; m: number } | null {
  if (!value) return null
  const match = /^([0-9]{1,2}):([0-9]{2})$/.exec(value)
  if (!match) return null
  const h = Number(match[1])
  const m = Number(match[2])
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null
  if (h < 0 || h > 23 || m < 0 || m > 59) return null
  return { h, m }
}

/**
 * Returns `date` with UTC HH:mm set to the given values. This is a rough
 * "local" heuristic — we treat each user's 8am as "8am in their clock" but
 * persist UTC. True tz math would require a library (Intl DateTimeFormat with
 * `timeZone`), which is intentionally avoided in Phase 4 backend to keep this
 * pure and dependency-free.
 */
function setUtcHM(date: Date, h: number, m: number): Date {
  const d = new Date(date.getTime())
  d.setUTCHours(h, m, 0, 0)
  return d
}

/**
 * Shifts the supplied timestamp forward if it falls inside the configured
 * quiet window. Quiet windows may wrap midnight ("22:00" → "07:00").
 */
function applyQuietHours(
  candidate: Date,
  preferences?: SchedulePreferences | null
): Date {
  if (!preferences) return candidate
  const start = parseHHMM(preferences.quietStart ?? null)
  const end = parseHHMM(preferences.quietEnd ?? null)
  if (!start || !end) return candidate

  const h = candidate.getUTCHours()
  const m = candidate.getUTCMinutes()
  const current = h * 60 + m
  const startMin = start.h * 60 + start.m
  const endMin = end.h * 60 + end.m

  const inWindow =
    startMin < endMin
      ? current >= startMin && current < endMin
      : current >= startMin || current < endMin

  if (!inWindow) return candidate

  // Push to end-of-quiet today (or tomorrow if wrapped past midnight).
  const shifted = new Date(candidate.getTime())
  shifted.setUTCHours(end.h, end.m, 0, 0)
  if (shifted.getTime() <= candidate.getTime()) {
    shifted.setUTCDate(shifted.getUTCDate() + 1)
  }
  return shifted
}

/**
 * Picks the most permissive channel the user has opted into, given that the
 * reminder has a preferred channel. If the preferred channel is disabled we
 * fall back to inapp (which is always allowed).
 */
function resolveChannel(
  preferred: ReminderChannel,
  preferences?: SchedulePreferences | null,
  hasPushSubscription?: boolean
): ReminderChannel {
  const emailOk = preferences?.emailEnabled !== false
  const pushOk =
    preferences?.pushEnabled !== false && hasPushSubscription === true
  const inappOk = preferences?.inappEnabled !== false

  if (preferred === 'push' && pushOk) return 'push'
  if (preferred === 'email' && emailOk) return 'email'
  if (preferred === 'inapp' && inappOk) return 'inapp'
  if (preferred === 'all') {
    if (pushOk) return 'push'
    if (emailOk) return 'email'
    return 'inapp'
  }
  // fallback
  if (inappOk) return 'inapp'
  if (pushOk) return 'push'
  if (emailOk) return 'email'
  return 'inapp'
}

function isActiveHabit(h: {
  isActive?: boolean | null
}): boolean {
  return h.isActive !== false
}

function isDayMatch(
  frequency: string | null | undefined,
  date: Date
): boolean {
  const freq = (frequency ?? 'daily').toLowerCase()
  const dow = date.getUTCDay() // 0 = Sun ... 6 = Sat
  if (freq === 'daily') return true
  if (freq === 'weekdays') return dow >= 1 && dow <= 5
  if (freq === 'weekends') return dow === 0 || dow === 6
  return true // unknown / custom → default to daily
}

/**
 * Build the full reminder plan for a freshly created coaching plan.
 */
export function buildRemindersForPlan(
  input: BuildRemindersInput
): ReminderSpec[] {
  const {
    plan,
    preferences,
    hasPushSubscription = false,
    now: nowOverride,
    dailyLookAheadDays = 14,
  } = input

  const now = nowOverride ?? new Date()
  const startDate = coerceDate(plan.startDate)
  const endDate = plan.endDate ? coerceDate(plan.endDate) : null

  const specs: ReminderSpec[] = []

  // ------------------------------------------------------------------ habits
  const habits = (plan.planHabits ?? []).filter(isActiveHabit)
  for (const habit of habits) {
    const time = parseHHMM(habit.intentionTime) ?? { h: 8, m: 0 }

    for (let i = 0; i < dailyLookAheadDays; i++) {
      const base = new Date(startDate.getTime() + i * DAY)
      if (endDate && base.getTime() > endDate.getTime()) break
      if (!isDayMatch(habit.frequency ?? 'daily', base)) continue

      let scheduledFor = setUtcHM(base, time.h, time.m)
      // Never schedule in the past.
      if (scheduledFor.getTime() < now.getTime()) continue

      scheduledFor = applyQuietHours(scheduledFor, preferences)

      const channel = resolveChannel(
        'push', // habits prefer push when available
        preferences,
        hasPushSubscription
      )

      specs.push({
        type: 'habit',
        title: `Time for: ${habit.name}`,
        body: `Keep the streak alive. Two minutes is enough to start.`,
        channel,
        scheduledFor,
        planHabitId: habit.id,
        metadata: {
          planId: plan.id,
          habitName: habit.name,
          frequency: habit.frequency ?? 'daily',
        },
      })
    }
  }

  // -------------------------------------------------------- weekly check-in
  const checkinPrompt =
    plan.weeklyCheckinPrompt?.trim() ||
    'How did this week feel? Any wins or obstacles worth naming?'

  // Every 7 days from startDate, aligned to Sunday 8am local.
  const maxWeeks = endDate
    ? Math.ceil((endDate.getTime() - startDate.getTime()) / (7 * DAY))
    : 10
  for (let w = 1; w <= Math.max(1, maxWeeks); w++) {
    const candidate = new Date(startDate.getTime() + w * 7 * DAY)
    // Nudge to Sunday if not already (0 = Sunday).
    const dow = candidate.getUTCDay()
    const nudge = dow === 0 ? 0 : 7 - dow
    const sunday = new Date(candidate.getTime() + nudge * DAY)
    let scheduledFor = setUtcHM(sunday, 8, 0)
    if (scheduledFor.getTime() < now.getTime()) continue
    scheduledFor = applyQuietHours(scheduledFor, preferences)

    const channel = resolveChannel('email', preferences, hasPushSubscription)

    specs.push({
      type: 'motivation',
      title: `Weekly check-in: ${plan.title}`,
      body: checkinPrompt,
      channel,
      scheduledFor,
      metadata: { planId: plan.id, weekIndex: w, kind: 'weekly_checkin' },
    })
  }

  // --------------------------------------------------- milestone celebration
  for (const ms of plan.milestones ?? []) {
    if (ms.status === 'skipped' || ms.status === 'completed') continue
    const targetDay = new Date(
      startDate.getTime() + ms.weekIndex * 7 * DAY
    )
    const oneDayBefore = new Date(targetDay.getTime() - DAY)
    let scheduledFor = setUtcHM(oneDayBefore, 12, 0) // noon
    if (scheduledFor.getTime() < now.getTime()) continue
    scheduledFor = applyQuietHours(scheduledFor, preferences)

    const channel = resolveChannel('push', preferences, hasPushSubscription)

    specs.push({
      type: 'celebration',
      title: `Milestone ahead: ${ms.title}`,
      body: `Tomorrow is a checkpoint. You've been building toward this — worth a pause to celebrate progress.`,
      channel,
      scheduledFor,
      metadata: {
        planId: plan.id,
        milestoneId: ms.id,
        weekIndex: ms.weekIndex,
      },
    })
  }

  return specs
}
