# HabitOS v2 Rollback Plan

**When to use this document:** the v2 production deploy is misbehaving badly enough that the right move is to revert. This is the playbook for getting back to v1 with minimal data loss.

This is intentionally short. Long playbooks fail in incidents.

---

## Severity ladder

Pick the lowest level that addresses the actual symptom. Do not jump straight to a full rollback if a feature flag will do.

### Level 1 — Single-feature pause
Symptom: a single new surface is broken (e.g. /pricing 500s) but the rest of the app is fine.
Action:
1. Identify the misbehaving route from Vercel logs
2. Patch forward via a hotfix branch + deploy
3. If a hotfix is not available within 15 minutes, consider Level 2 instead

### Level 2 — Disable a subsystem
Symptom: the reminders engine is mis-firing, or the Stripe webhook is stuck, or push notifications are crashing.
Action:
- **Reminders:** disable the Vercel cron jobs (`/api/cron/dispatch-reminders` and `/api/cron/momentum-recalc`) from the Vercel Cron tab. Existing reminders stop being sent; nothing else breaks.
- **Stripe webhook:** disable the production webhook endpoint in the Stripe dashboard. Stripe will retry with backoff for up to 3 days, so you have time to fix forward without losing events.
- **Push:** flip a feature flag if you have one, or rotate `VAPID_PUBLIC_KEY` to an invalid value so subscriptions silently fail (better: ship a hotfix).
- **Coach customize:** add a server-side redirect from `/coach/customize` to `/coach/personas` until the bug is fixed.

### Level 3 — Full v1 rollback
Symptom: the v2 deploy is fundamentally broken (database errors, auth crashes, money loss in checkout) and patching forward is not feasible.
Action: see "Full rollback procedure" below.

---

## Full rollback procedure

### Pre-conditions
- The Vercel deployment immediately before v2.0.0 is still listed in the project's Deployments tab
- The Neon production branch snapshot taken in step 1 of `docs/DEPLOY-CHECKLIST-v2.md` is still recoverable
- At least one team member is available to execute and one to verify

### Steps

1. **Freeze writes (optional but recommended):** put the app in maintenance mode if you have one, or flip a feature flag that returns 503 from non-GET requests. This prevents new data from being written into the v2 schema during the rollback window.

2. **Promote the previous deployment:** in the Vercel Deployments tab, find the deployment immediately before v2.0.0 and click "Promote to Production." This is reversible and takes effect within ~30 seconds. The new tier resolution and customize routes will 404, but everything else should work because v1 routes have not been deleted.

3. **Verify the v1 deployment is serving:** check the home page, sign-in, goal listing, and habit check-in. These should all work because they predate v2.

4. **Disable the v2 cron jobs:** Vercel Cron tab → toggle off `dispatch-reminders` and `momentum-recalc`. The v1 deploy does not know about them, but the cron entries from `vercel.json` may still exist in the project config; toggling them off prevents accidental dispatches against a now-misaligned database.

5. **Disable the Stripe webhook:** Stripe dashboard → webhook endpoints → production endpoint → "Disable." Stripe will retry events for ~3 days, giving you time to re-enable cleanly once the schema is restored.

6. **Decide on database rollback:** this is the most consequential step.
   - **If no users have transacted on v2 yet** (no new Subscription rows, no new CoachingPlan rows, no new PlanCheckin rows): restore the Neon snapshot from step 1 of the deploy checklist. This is safe because no v2 writes need to be preserved.
   - **If v2 users have already created data**: do NOT restore the snapshot. Instead, leave the schema as-is. The v1 code will simply ignore the new tables and columns. You will lose forward access to v2 data until you fix the v2 deploy and re-promote.

7. **Communicate:** post a status page update, send an email to active users, and post in the team channel. Be honest about what happened and what users should expect.

---

## Money-loss scenario

If users were charged on v2 but the local Subscription row was not synced (e.g. webhook was broken at the time of checkout), do this in order:

1. **Do not refund automatically.** Stripe is the source of truth — the user IS subscribed even if HabitOS does not yet know it.
2. **Re-enable the webhook in Stripe** once the underlying bug is fixed.
3. **Replay missed webhooks:** the Stripe dashboard exposes a "resend" button on each event. Replay any events from the broken window. The webhook handler is idempotent (DEC-015), so replays are safe.
4. **Verify each affected user's tier matches Stripe** by querying Subscription joined with Stripe customer IDs.
5. **Only refund** if the user explicitly asks, or if the v2 feature they paid for was not actually delivered.

---

## Data loss scenarios

### Scenario A: a CoachingPlan was deleted by an admin during the broken window
The audit log catches this. Query `PlanAuditLog` for `action='admin.plan.delete'` in the broken window, find the `before` snapshot in the JSON column, and reconstruct the plan from the snapshot. CoachingPlan rows are soft-deleted (status='stopped') so the row itself may still exist.

### Scenario B: reminders were sent twice
The composite-key idempotency check on `Reminder` should have prevented this, but if it slipped, the affected users will see duplicate emails / pushes. There is no remediation beyond an apology — the messages are already out the door. Add a retro item to add a stronger dedup at the dispatcher level.

### Scenario C: a webhook event was processed twice
DEC-015 documents the SiteSettings claim store. If you suspect double-processing, query SiteSettings for keys matching `stripe.webhook.event:*` in the affected window and cross-reference against Stripe's webhook delivery log. Both numbers should match.

### Scenario D: a Stripe webhook event was missed
Stripe retries for ~3 days. During the rollback window, do not panic — just fix the bug and let Stripe re-deliver. If retries have been exhausted, use the Stripe dashboard's "resend" button on each missed event from the broken window.

---

## Re-deploying v2 after a rollback

1. Identify the bug that caused the rollback. Write a regression test that would have caught it.
2. Patch the bug on a `v2.0.1` branch.
3. Run the full `docs/TEST-PLAN.md` against staging. Specifically re-run the section that exposed the bug.
4. Update `docs/DEPLOY-CHECKLIST-v2.md` if the deploy procedure needs to change.
5. Promote `v2.0.1` to production using the same checklist.
6. Re-enable the webhook + crons that were disabled during the rollback.
7. Replay any Stripe events missed during the rollback window using the Stripe dashboard's "resend" button.
8. Communicate the fix to affected users.

---

## Contacts

- **PM (incident commander):** Quijote (hai@eagodi.com)
- **Stripe issues:** Stripe support via the live dashboard
- **Neon issues:** Neon support
- **Vercel issues:** Vercel support
- **Resend issues:** Resend support

Keep this list current. An incident is the worst time to discover a phone number is wrong.
