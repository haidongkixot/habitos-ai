# HabitOS v2 Deploy Checklist

**Target:** Vercel production environment + Neon production branch + Stripe live mode + Resend live + web-push live VAPID keys.
**Date prepared:** 2026-04-08
**Owner:** pm

This is a sequential checklist. Do not skip steps. Where a step says "verify in staging first," that means the same action must already have succeeded in staging before you do it in production.

---

## 0. Preconditions

- [ ] `docs/TEST-PLAN.md` was fully executed against staging and all sections passed
- [ ] `.shared/outputs/smoke-test-results.md` is filled in for the staging run
- [ ] Release branch is tagged `v2.0.0` and the tag is pushed to the remote
- [ ] `npx tsc --noEmit` exits 0 on the release tag commit
- [ ] `npx prisma migrate diff --from-schema-datamodel prisma/schema.prisma --to-schema-datasource prisma/schema.prisma` shows zero diff between local schema and the production Neon branch (or, if there is a diff, it has been migrated and verified)
- [ ] At least one team member other than the deployer has reviewed this checklist

---

## 1. Database (Neon production branch)

- [ ] Snapshot the production Neon branch (or take a logical backup) and store the snapshot ID somewhere recoverable
- [ ] Run `npx prisma db push` (or your migration command of choice) against the production branch URL
- [ ] Run `npx prisma db seed` if any of the v2 seeds (`seed-coach-personas.ts`, `seed-plan-tiers.ts`) have not yet run on production
- [ ] Verify the new tables / columns exist with a sanity query:
  - `SELECT count(*) FROM "CoachPersona";` should be 12
  - `SELECT slug FROM "Plan" ORDER BY slug;` should return free / starter / pro / premium
  - `SELECT count(*) FROM "PlanAuditLog";` should not error
- [ ] Verify the existing data is intact: `SELECT count(*) FROM "User"; SELECT count(*) FROM "Habit"; SELECT count(*) FROM "Checkin";` should match pre-deploy snapshots

---

## 2. Environment variables (Vercel project settings)

Add the following to the production Vercel environment. Each block should be pasted as one operation, then "Save" pressed once per block to keep the audit trail clean.

### 2.1 Stripe (live mode)
- [ ] `STRIPE_SECRET_KEY` = `sk_live_...`
- [ ] `STRIPE_PUBLISHABLE_KEY` = `pk_live_...` (NOT exposed to the client; HabitOS reads it server-side)
- [ ] `STRIPE_WEBHOOK_SECRET` = `whsec_...` (the secret for the production webhook endpoint, NOT the staging one)
- [ ] `STRIPE_PRICE_STARTER_MONTHLY` = `price_...`
- [ ] `STRIPE_PRICE_STARTER_YEARLY` = `price_...`
- [ ] `STRIPE_PRICE_PRO_MONTHLY` = `price_...`
- [ ] `STRIPE_PRICE_PRO_YEARLY` = `price_...`
- [ ] `STRIPE_PRICE_PREMIUM_MONTHLY` = `price_...`
- [ ] `STRIPE_PRICE_PREMIUM_YEARLY` = `price_...`

### 2.2 Resend (live)
- [ ] `RESEND_API_KEY` = `re_...` (production key, distinct from staging)
- [ ] `RESEND_FROM_EMAIL` = `coach@<your-production-domain>`
- [ ] Verify the From domain has a green DKIM/SPF status in the Resend dashboard

### 2.3 Web Push (VAPID)
- [ ] Generate fresh VAPID keys for production: `npx web-push generate-vapid-keys`
- [ ] `VAPID_PUBLIC_KEY` = the public key from the generation step
- [ ] `VAPID_PRIVATE_KEY` = the private key from the generation step
- [ ] `VAPID_SUBJECT` = `mailto:admin@<your-production-domain>`
- [ ] **Do NOT** set `NEXT_PUBLIC_VAPID_PUBLIC_KEY` — the key is served from `/api/push/vapid-key` per DEC-010

### 2.4 Cron secret
- [ ] `CRON_SECRET` = a long random string. Vercel cron jobs include this in the `Authorization` header so unauthenticated traffic cannot trigger the dispatch endpoints.

### 2.5 Existing variables (verify present)
- [ ] `DATABASE_URL` and `DATABASE_URL_UNPOOLED` point at the production Neon branch
- [ ] `NEXTAUTH_SECRET` is set
- [ ] `NEXTAUTH_URL` is set to the production HTTPS URL
- [ ] `OPENAI_API_KEY` is set
- [ ] `NEXT_PUBLIC_APP_URL` is set to the production HTTPS URL

---

## 3. Stripe (live dashboard)

- [ ] Confirm the 4 Plan tiers exist as Products in the live Stripe dashboard
- [ ] Confirm each Product has a monthly and a yearly Price; capture the 6 price IDs and paste them into the env vars in section 2.1
- [ ] Register a new webhook endpoint at `https://<your-production-domain>/api/webhooks/stripe`
- [ ] Subscribe the endpoint to these events:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.paid`
  - `invoice.payment_failed`
- [ ] Copy the endpoint's signing secret into `STRIPE_WEBHOOK_SECRET` in section 2.1
- [ ] Enable the Customer Portal in the live dashboard if it is not already on
- [ ] Configure the portal: cancellation policy, allowed update operations (cancel, update card, update billing address)

---

## 4. Vercel cron jobs

- [ ] Open the Vercel project's Cron tab
- [ ] Confirm both crons from `vercel.json` are listed:
  - `/api/cron/dispatch-reminders` — every 5 minutes
  - `/api/cron/momentum-recalc` — every 6 hours
- [ ] Click "Run now" on `dispatch-reminders` once and verify a 200 response in the run log
- [ ] Click "Run now" on `momentum-recalc` once and verify a 200 response in the run log
- [ ] Wait 5 minutes and verify the dispatch cron fires automatically with a 200

---

## 5. Deploy

- [ ] Promote the release tag `v2.0.0` to production via Vercel's deploy hook (or `vercel --prod`)
- [ ] Wait for the build to complete and the new deployment to become "Ready"
- [ ] Verify the deployment URL responds 200 on the home page
- [ ] Verify `/api/billing/current` responds 200 with valid JSON for an authenticated user
- [ ] Verify `/api/coach/personas` responds 200 with valid JSON
- [ ] Verify `/api/push/vapid-key` returns `{ publicKey: "..." }` (not `{ key: ... }`)

---

## 6. Smoke test in production

Pick a real test account on production (NOT a staging account) and run this minimal smoke:

- [ ] Sign in
- [ ] Visit `/coach/personas` — list loads
- [ ] Visit `/goals/new` — page loads
- [ ] Visit `/pricing` — 4 tiers render with the new copy
- [ ] Visit `/settings/notifications` — preferences load
- [ ] Visit `/settings/billing` — current tier card loads
- [ ] If the test account is admin: visit `/admin/coaching-plans` — list loads, even if empty
- [ ] Subscribe to push from `/settings/notifications` and confirm the browser shows the permission prompt
- [ ] Trigger a Stripe test purchase using a real card (with a real refund afterward) on the lowest tier and verify the webhook syncs `/settings/billing` to show the new tier
- [ ] Refund the purchase from the Stripe dashboard and verify the webhook syncs the cancellation back

---

## 7. Post-deploy monitoring (first 60 minutes)

- [ ] Watch Vercel logs for ERROR / FATAL entries — there should be none related to the new code paths
- [ ] Watch Sentry / your error tracker for new error signatures
- [ ] Watch the Stripe webhook dashboard for failed deliveries — none expected
- [ ] Watch the Resend dashboard for bounces / complaints — should be zero or background-rate
- [ ] Verify the dispatch-reminders cron has run at least 12 times (every 5 minutes for an hour) and each run was 200
- [ ] Verify a momentum-recalc has fired (or wait until the 6-hour mark)

If any of these alarms fires, refer to `docs/ROLLBACK-PLAN.md`.

---

## 8. Sign-off

- [ ] All sections above are checked
- [ ] Release notes published to users (email blast, in-app banner, or whatever your release channel is)
- [ ] `RELEASE-NOTES-M6-DRAFT.md` content has been moved into `docs/RELEASE-NOTES-v2.md` and the draft can be deleted
- [ ] Tag `v2.0.0` is the current production deploy
- [ ] PM updates `.shared/state/project-state.json` to mark M7 complete
- [ ] PM posts the final `SIG-008` announcement to the signal bus

---

## Appendix A — Variables that intentionally do NOT exist

- `User.stripeCustomerId` — DEC-016 (lookup by email each call instead)
- `Plan.stripePriceId` — DEC-001-ish (env vars per slug+interval instead)
- `Subscription.cancelAtPeriodEnd` — DEC-017 (derived heuristically)
- `ProcessedWebhookEvent` table — DEC-015 (SiteSettings KV claim store instead)
- `CoachingPlan.notes` — M5 deviation (notes live in PlanAuditLog)
- `CoachingPlan.deletedAt` — M5 deviation (soft-delete via status='stopped')

If any of these were added in a future migration, this checklist needs updating to drop the corresponding workaround.
