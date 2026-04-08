# HabitOS v2 Coach Upgrade — Test Plan

**Scope:** Milestones M2 through M6 of the v2 Coach Upgrade.
**Target environment:** staging on Vercel, against an isolated Neon branch with seed data.
**Date:** 2026-04-08
**Owner:** tester (PM-proxied for the v2 release)

This document is the master QA checklist for the v2 launch. It is grouped by milestone so that a regression in any single phase can be triaged without re-running the whole suite.

---

## 0. Pre-flight

- [ ] `npx tsc --noEmit` exits 0 on the release branch
- [ ] `npx prisma migrate status` reports no pending migrations
- [ ] All env vars from `.env.example` are present in the staging Vercel project
- [ ] Stripe is in test mode and the staging webhook endpoint is registered with the events listed in section 6
- [ ] Resend is in test mode and the configured `RESEND_FROM_EMAIL` resolves
- [ ] VAPID keys are generated and `NEXT_PUBLIC_VAPID_PUBLIC_KEY` is **NOT** set (the public key is served from `/api/push/vapid-key`)
- [ ] Vercel cron jobs from `vercel.json` are visible in the project's Cron tab
- [ ] Seed data: `prisma/seed-coach-personas.ts` and `prisma/seed-plan-tiers.ts` ran cleanly on the staging Neon branch
- [ ] Admin test user exists with `role='admin'` and a Premium subscription
- [ ] Test user exists at each tier: free, starter, pro, premium

---

## 1. M2 — Coach Persona System

### 1.1 Persona listing
- [ ] Free user visiting `/coach/personas` sees only free-tier personas
- [ ] Starter user sees free + starter personas
- [ ] Pro user sees free + starter + pro personas
- [ ] Premium user sees the full library
- [ ] Each persona card renders an avatar from DiceBear (no broken image)
- [ ] The user's currently selected persona shows a "Current" badge

### 1.2 Persona selection
- [ ] Picking an unlocked persona PUTs `/api/coach/settings` with `{ personaId }` and returns 200
- [ ] After selection, refreshing the page keeps the new persona selected
- [ ] Picking a locked persona shows the upsell modal (M6) instead of submitting

### 1.3 System prompt injection
- [ ] Sending a message in `/coach` (or wherever the chat lives) uses the selected persona's system prompt
- [ ] Switching personas mid-conversation changes the next reply's voice/tone
- [ ] When `UserCoachSettings` row is missing, the default persona resolves via the fallback chain `alex` → `alex-default` → first free → first active

---

## 2. M3 — Wizard + Plan Generation

### 2.1 Goal creation
- [ ] `/goals/new` accepts a goal title + category + framework choice
- [ ] Submit redirects to `/goals/[id]/wizard`
- [ ] Free user is gated to the GROW framework only (or whatever the tier matrix decides; verify against `frameworks.ts`)

### 2.2 Wizard flows (run all three)
- [ ] **GROW:** Goal → Reality → Options → Way Forward steps each accept input, back navigation works, partial state survives a refresh
- [ ] **WOOP:** Wish → Outcome → Obstacle → Plan steps complete cleanly
- [ ] **IDENTITY:** Identity → Evidence → Habits → Environment steps complete cleanly
- [ ] On final submit, the wizard POSTs `/api/coaching-plans` and follows the response envelope to `/plan/[id]`

### 2.3 Plan generation tier routing
- [ ] Free + Starter user generates a plan using `gpt-4o-mini` (verify in `AIGenerationLog`)
- [ ] Pro user generates with `gpt-4o`
- [ ] Premium user generates with `o4-mini`
- [ ] Generated plan contains 3-5 milestones and 3-8 habits
- [ ] Plan view at `/plan/[id]` renders milestones, habits, and a per-day habit check-in button

### 2.4 Edge cases
- [ ] Wizard with extra fields (the wizard captures more than the Zod schemas require) succeeds — Zod is `.passthrough()` per the M3 patch
- [ ] Submitting an empty wizard returns 400 with a readable error
- [ ] AI generation failure falls back to a manual-entry stub plan rather than crashing

---

## 3. M4 — Reminders, Cron, Email, Push, Motivation

### 3.1 Reminder scheduling
- [ ] Creating a plan auto-schedules reminders into the `Reminder` table
- [ ] Reminder rows respect the user's notification preferences (time of day, channels)
- [ ] Composite-key idempotency prevents duplicate rows for the same `(userId, planId, type, channel, scheduledFor)`

### 3.2 Cron dispatch
- [ ] Manually invoking `/api/cron/dispatch-reminders` with the cron secret header dispatches due reminders and stamps `dispatchedAt`
- [ ] Reminders past their dispatch window without being sent are picked up by the watchdog
- [ ] `/api/cron/momentum-recalc` updates `momentumScore` on every active plan
- [ ] Vercel cron jobs from `vercel.json` actually fire on schedule (every 5 minutes for dispatch, every 6 hours for momentum)

### 3.3 Email delivery
- [ ] `daily-habit-reminder.tsx` renders correctly in the Resend preview
- [ ] `weekly-checkin.tsx` renders
- [ ] `milestone-celebration.tsx` renders
- [ ] `missed-streak.tsx` renders
- [ ] `momentum-drop.tsx` renders
- [ ] Persona name + voice flavors land in the rendered email body

### 3.4 Push notifications
- [ ] `/api/push/vapid-key` returns `{ publicKey: string }` (NOT `{ key }` — fixed in M4)
- [ ] Subscribing from `/settings/notifications` writes a `PushSubscription` row
- [ ] Sending a test push delivers to the browser
- [ ] Unsubscribing removes the row via `deleteMany` (PushSubscription has no `active` field)
- [ ] Service worker at `/sw.js` handles `push` events and renders the notification

### 3.5 Anti-gaming check-ins
- [ ] `/api/checkins` accepts the legacy single-habit shape AND the new dual shape (M4 backend deviation)
- [ ] A check-in increments momentum
- [ ] Spamming check-ins within a short window does not multiply momentum (rate limit)
- [ ] Missed check-ins decrement momentum on the next cron run

### 3.6 Notification preferences
- [ ] `/settings/notifications` loads current prefs
- [ ] PUT updates prefs and persists across refresh
- [ ] Disabling a channel (email/push/in-app) actually stops dispatch in that channel

---

## 4. M5 — Admin Coaching Console

### 4.1 List + filter
- [ ] `/admin/coaching-plans` is reachable only by admin role users (401/403 otherwise)
- [ ] List renders with pagination (prev/next + total count badge)
- [ ] Each filter narrows results correctly: status, tier, framework, personaSlug, q (email/name/title), from/to date range
- [ ] Combining multiple filters works
- [ ] Sort by createdAt / updatedAt / momentumScore in both directions
- [ ] CSV export downloads a file named `coaching-plans-<ISO>.csv` with the right `Content-Disposition`
- [ ] Exported CSV opens cleanly in Excel and Google Sheets, no formula injection (titles starting with `=`/`+`/`-`/`@` are prefixed with a single quote)

### 4.2 Detail tabs
- [ ] Overview tab shows summary, goal, metadata
- [ ] Milestones tab lists with order + due + status
- [ ] Habits tab lists with cue/routine/reward/frequency
- [ ] Check-ins tab shows last 30 with expandable JSON payload
- [ ] Audit Log tab paginates with cursor + actor expansion

### 4.3 Mutations
- [ ] PATCH inline edit form updates title/summary/notes and shows the new value after refetch
- [ ] Pause action sets status='paused' and writes audit row
- [ ] Resume action sets status='active' and writes audit row
- [ ] Stop action sets status='stopped' and writes audit row
- [ ] Delete action soft-deletes (sets status='stopped' since no `deletedAt` column) and writes audit row
- [ ] Each mutation is atomic via `prisma.$transaction` (verify by killing the request mid-flight if possible)

### 4.4 Analytics
- [ ] `getPlanMetricsSnapshot()` returns the right shape (manually call from a dev script if no admin dashboard renders it yet)
- [ ] `getPlanFunnel()` returns the right shape; the `wizardsStarted` proxy is documented and matches `goals-with-plans` count

---

## 5. M6 — Stripe + 4 Tiers + Premium Customization

### 5.1 Pricing page
- [ ] `/pricing` renders 4 tier cards with the marketer's tier copy
- [ ] Billing-cycle toggle switches monthly/yearly and the yearly badge shows ~17% savings
- [ ] Logged-out user clicking "Get Started" on Free routes to `/signup`
- [ ] Logged-in user clicking "Upgrade" on a paid tier POSTs `/api/billing/checkout` and is redirected to the Stripe Checkout URL
- [ ] User's current tier shows the "Current plan" badge and disabled CTA
- [ ] Pro tier shows the "Most Popular" ribbon
- [ ] Premium tier shows the gradient border

### 5.2 Checkout flow
- [ ] Stripe Checkout session creates with the right `priceSlug + interval` metadata
- [ ] Successful test card (`4242 4242 4242 4242`) lands on `/checkout/success?session_id=...`
- [ ] Cancel button lands on `/checkout/canceled`
- [ ] Webhook fires `checkout.session.completed` and creates/updates a `Subscription` row
- [ ] User's tier reflects the new subscription on `/settings/billing` and `/pricing`

### 5.3 Stripe webhook
- [ ] Webhook signature verification rejects unsigned/forged requests with 400
- [ ] Replaying the same Stripe event ID results in a 200 with `ignored:true` (idempotency via SiteSettings KV)
- [ ] All 6 event types route to a handler: checkout.session.completed, customer.subscription.created/updated/deleted, invoice.paid, invoice.payment_failed
- [ ] Unknown event types return 200 (no Stripe retry storm)
- [ ] `syncSubscriptionFromStripe` upserts on `stripeSubId` and the resulting row has the right `currentPeriodStart`/`End`/`canceledAt`/`status`

### 5.4 Customer portal
- [ ] `/api/billing/portal` returns a portal URL for users with an existing customer
- [ ] Returns 404 for users with no customer (free tier never paid)
- [ ] Updating the card in the portal triggers a webhook and the new card shows up

### 5.5 /settings/billing
- [ ] Current tier card shows tier name, price, renewal date
- [ ] "Manage subscription" button opens the portal
- [ ] cancelAtPeriodEnd derived flag triggers the warning banner correctly
- [ ] Upgrade CTA appears for free/starter users

### 5.6 /coach/customize
- [ ] Free user is redirected to `/pricing?upgrade=customize`
- [ ] Starter/Pro user can edit customName, customGender, relationshipStyle, customSystemAdd
- [ ] Starter/Pro user sees a `LockedFeatureCard` over the outfit pack picker and accent picker (Premium-only per DEC-008)
- [ ] Premium user can pick an outfit pack from the 7 options
- [ ] Premium user can pick an accent from the 5 options
- [ ] Save button PUTs `/api/coach/settings` and persists across refresh

### 5.7 Upsell + premium badge
- [ ] Upsell modal opens with the right reason text from `UPSELL_MESSAGES`
- [ ] Backdrop click + Escape key close the modal
- [ ] Body scroll is locked while the modal is open
- [ ] Premium badge renders on the Premium tier card

---

## 6. Stripe webhook event matrix

The staging webhook endpoint must be registered with at least these events:
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

Run the Stripe CLI against the staging endpoint to dry-fire all 6 events and confirm each one is processed exactly once.

```
stripe listen --forward-to https://<staging-host>/api/webhooks/stripe
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
# etc.
```

---

## 7. Cross-cutting smoke

- [ ] Sign-up → onboarding → goal creation → wizard → plan view → check-in works end-to-end on a fresh free account
- [ ] Same flow on a fresh Pro account (post-upgrade)
- [ ] Same flow on a fresh Premium account with a customized coach
- [ ] Mobile viewport (375×667) renders all new pages without horizontal scroll (admin tables have explicit horizontal scroll containers)
- [ ] Dark/light theme switch (if the app supports it) does not break any new component

---

## 8. Sign-off

- [ ] All sections above pass on staging
- [ ] No new ERROR-level entries in Vercel logs during a 1-hour smoke window
- [ ] No spike in 5xx rate vs the previous deploy
- [ ] Admin Coaching Console reachable, list returns at least one seed plan
- [ ] Premium customization end-to-end verified by the test Premium user

When all boxes are checked, post `SIG-HABITOS-PHASE7-QA-COMPLETE` to `.shared/signals/board.json` and proceed to the deploy checklist (`docs/DEPLOY-CHECKLIST-v2.md`).
