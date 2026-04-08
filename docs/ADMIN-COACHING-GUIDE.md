# HabitOS Admin Coaching Console — Enablement Guide

**Audience:** HabitOS administrators with `role='admin'` on their User row.
**Surface:** `/admin/coaching-plans` and the supporting API at `/api/admin/coaching-plans/*`.
**Shipped in:** v2 milestone M5.

This guide walks through every action available in the admin coaching console and explains the data model behind each one. If something does not match what you see in the UI, the source of truth is the route handlers under `src/app/api/admin/coaching-plans/` and the audit log helper at `src/lib/coaching/audit-log.ts`.

---

## 1. Getting in

1. Sign in with an account whose `User.role` is `'admin'`.
2. Navigate to `/admin`. The admin home shows quick-link cards including a new "Coaching Plans" card.
3. Click into `/admin/coaching-plans`. Non-admin users get a 401/403.

If your account has the wrong role, ask another admin to update it from `/admin/users` or run a manual UPDATE on `User.role`.

---

## 2. The list view

The list page shows every coaching plan in the system. By default it is sorted by `createdAt desc` with 25 rows per page.

### Filters
| Filter | Source field | Notes |
|---|---|---|
| Status | `CoachingPlan.status` | active / paused / stopped / complete |
| Tier | derived via `Subscription.plan.slug` | free / starter / pro / premium |
| Framework | `CoachingPlan.framework` | GROW / WOOP / IDENTITY |
| Persona | `UserCoachSettings.personaId` | filter shows the user's currently selected persona |
| Date range | `CoachingPlan.createdAt` | from / to ISO dates |
| Search | `User.email` ∪ `User.name` ∪ `CoachingPlan.title` | substring match |

Filters compose with AND. The total count badge reflects the filtered set, not the global count.

### Sorting
Sort by `createdAt`, `updatedAt`, or `momentumScore` in either direction. Sort and filters survive across pagination.

### Pagination
Prev / next buttons. Page size is fixed at 25 (the API supports up to 100 if you need to change it for a specific use case).

---

## 3. Detail view

Clicking a row opens `/admin/coaching-plans/[id]` with five tabs.

### 3.1 Overview
- Plan title, summary, framework, status, momentum score, persona
- Owning user (id, email, name, current tier slug)
- Linked goal (if any)
- Inline edit form for title, summary, status, and notes

### 3.2 Milestones
Ordered list of milestones with order index, due date, and status.

### 3.3 Habits
Habits attached to the plan with their cue, routine, reward, and frequency.

### 3.4 Check-ins
The most recent 30 check-ins. Each check-in row is expandable to show its raw `content` JSON. Note that `PlanCheckin` has no first-class `completed`/`reflectionText`/`habitId` columns — those values are packed into the `content` JSON per the M4 backend deviation.

### 3.5 Audit Log
Every change to the plan, oldest first by default. Each entry shows:
- Action label (e.g. `admin.plan.pause`, `admin.plan.edit`, `admin.plan.delete`)
- Actor (admin or user, expanded with id/email/name)
- Reason (free text supplied at action time)
- Expandable `before` / `after` JSON diff

The audit log is cursor-paginated. Click "Load more" to fetch the next page.

---

## 4. Mutations

All mutations are wrapped in a `prisma.$transaction` so the plan update and the audit row succeed or fail together. There is no way to mutate a plan from the admin console without leaving an audit trail.

### 4.1 Edit
Open the inline form on the Overview tab, make changes, save. The PATCH writes a new audit row with `before` (the previous snapshot) and `after` (your changes).

The `notes` field is special: there is no `notes` column on `CoachingPlan` in the M1 schema. Notes you save here land in the audit log row's `after` JSON and `reason` field. The detail view will surface them on subsequent reads, but they live in the audit log, not the plan row.

### 4.2 Pause
Sets `status='paused'`. Pauses prevent the cron dispatcher from sending new reminders without breaking the user's existing reminder schedule. Provide a reason in the prompt — it lands in the audit row.

### 4.3 Resume
Reverses a pause. Sets `status='active'`. Provide a reason.

### 4.4 Stop
Sets `status='stopped'`. Stops are intended to be terminal. The user can still see the plan in their history but no new reminders fire. Provide a reason.

### 4.5 Delete
Soft-delete only — sets `status='stopped'` and writes an audit row with `softDelete: true` in the after-snapshot. There is no `deletedAt` column on `CoachingPlan` in M1, so a "deleted" plan is indistinguishable from a "stopped" plan in the database except via the audit log. If you need to find truly removed plans, query the audit log for `action='admin.plan.delete'`.

---

## 5. CSV export

Click "Export CSV" on the list view. The current filters are applied to the export — empty filters export everything (capped at 10,000 rows defensively).

### Format
- RFC 4180 compliant: CRLF line endings, double-quote escaping, fields wrapped in quotes when they contain `,`, `"`, `\r`, or `\n`.
- OWASP formula injection guard: any cell starting with `=`, `+`, `-`, or `@` is prefixed with a single quote `'` so spreadsheet formula execution is neutralized.
- Header row is always emitted, even on empty result sets.

### Columns
| Column | Source |
|---|---|
| planId | `CoachingPlan.id` |
| title | `CoachingPlan.title` |
| framework | `CoachingPlan.framework` |
| status | `CoachingPlan.status` |
| createdAt | ISO timestamp |
| updatedAt | ISO timestamp |
| momentumScore | `CoachingPlan.momentumScore` |
| userEmail | `User.email` |
| userName | `User.name` |
| userTier | resolved via `Subscription.plan.slug`, `'free'` if no active sub |
| personaSlug | `CoachingSession.personaId` (first session per plan; empty if no sessions) |
| personaName | resolved from `CoachPersona.name` |
| milestoneCount | count of `Milestone` rows for the plan |
| habitCount | count of `Habit` rows for the plan |
| checkinCount | count of `PlanCheckin` rows for the plan |

Note that the LIST view's persona filter uses `UserCoachSettings.personaId` (the user's currently selected persona) while the CSV export's `personaSlug` column uses `CoachingSession.personaId` (the persona used in the first session for that plan). This is a documented schema-driven mismatch — the M1 schema has no direct `CoachingPlan.personaId` link.

---

## 6. Analytics

The analytics library at `src/lib/analytics/` is not yet wired into a dashboard surface in this release, but it is available for any internal tool you build.

### `getPlanMetricsSnapshot(opts?)`
Returns a `PlanMetricsSnapshot` with totals, status splits, framework / tier / persona breakdowns, average momentum score, check-in counters (last 7 / last 30 days), and new-plan counters. The 7/30-day windows always reflect "now" — they ignore any `from`/`to` filters passed in the options object so dashboard counters stay live.

### `getPlanFunnel(opts?)`
Returns a `PlanFunnel` with the goal-to-active-plan conversion funnel. The `wizardsStarted` step is a proxy for "Goals that have at least one CoachingPlan" because the M1 `Goal` model has no `wizardStartedAt` column. This is documented inline in `plan-funnel.ts`.

### Importing
```ts
import {
  getPlanMetricsSnapshot,
  getPlanFunnel,
  exportPlansAsCsv,
  serializePlansToCsv,
} from '@/lib/analytics'
```

---

## 7. Common workflows

### A user reports their reminders stopped working
1. Go to `/admin/coaching-plans?q=<their email>`
2. Open their most recent active plan
3. Check the Audit Log tab — was the plan paused or stopped recently?
4. If yes: resume it with a reason like "Reactivated after support ticket #123"
5. If no: check `/admin/users/[id]` for their notification preferences and `PushSubscription` rows

### A user asks for a refund
1. Pause their active coaching plan with reason "Refund pending — support ticket #123"
2. Process the refund through the Stripe dashboard (this is intentionally not in the admin console — keeps a clear separation between coaching state and billing state)
3. The Stripe webhook will sync the subscription change automatically
4. Once refunded, stop or delete the plan with a reason linking to the ticket

### Auditing all admin actions in a date range
1. There is no global "all audit entries" view yet — open individual plans to see their audit logs
2. For a global view, query `PlanAuditLog` directly:
   ```sql
   SELECT * FROM "PlanAuditLog"
   WHERE "createdAt" BETWEEN '2026-04-01' AND '2026-04-30'
     AND "adminId" IS NOT NULL
   ORDER BY "createdAt" DESC;
   ```

### Exporting a cohort for offline analysis
1. Apply your filters on the list view
2. Click "Export CSV"
3. The download is named `coaching-plans-<ISO>.csv` and is safe to open in Excel / Sheets directly (formula injection guarded)

---

## 8. Limits and known constraints

| Constraint | Reason | Workaround |
|---|---|---|
| No hard delete | M1 schema has no `deletedAt` on `CoachingPlan` | Soft-delete to `status='stopped'` + audit row, or DROP from the DB directly |
| `notes` lives in audit log | M1 schema has no `notes` column on `CoachingPlan` | Write notes via the edit form; read them from the audit tab |
| Persona filter ≠ persona export column | M1 schema has no direct `CoachingPlan.personaId` | Documented above; future migration could add the column |
| CSV cap of 10,000 rows | Defensive limit | Filter your export down before clicking |
| No global audit view | Out of scope for M5 | SQL query above |
| `PlanCheckin.completed` not first-class | M4 backend deviation | Inspect the `content` JSON in the Check-ins tab |

---

## 9. Where to look when something breaks

- **API errors:** route handlers under `src/app/api/admin/coaching-plans/`
- **UI errors:** client components under `src/app/admin/coaching-plans/` and `src/components/admin/coaching-plans/`
- **Audit log writes:** `src/lib/coaching/audit-log.ts` (best-effort writer for non-critical writes; mutations use inline `tx.planAuditLog.create` for atomicity per DEC-012)
- **Analytics:** `src/lib/analytics/`
- **Decisions and trade-offs:** `.shared/state/decisions.json` (DEC-006, DEC-011, DEC-012, DEC-013 are M5-relevant)
