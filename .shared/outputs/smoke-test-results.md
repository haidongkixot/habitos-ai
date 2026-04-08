# HabitOS v2 — Smoke Test Results Template

**Run by:** _________________
**Date:** _________________
**Environment:** [ ] staging  [ ] production
**Build SHA:** _________________
**Tag:** _________________

This is a fillable template. Print or duplicate before each smoke run. The corresponding full test plan is at `docs/TEST-PLAN.md`. This template is the short-form summary for sign-off; the full plan is what you actually execute.

---

## Section 0 — Pre-flight
- [ ] All env vars present
- [ ] tsc clean on the deploy SHA
- [ ] Stripe webhook registered on the right endpoint
- [ ] Cron jobs visible in Vercel
- [ ] Seed data verified

**Issues found:** _________________

---

## Section 1 — Coach personas (M2)
- [ ] Persona list loads for free / starter / pro / premium tiers
- [ ] Selection persists across refresh
- [ ] System prompt injection works (chat reply uses persona voice)

**Issues found:** _________________

---

## Section 2 — Wizard + plan generation (M3)
- [ ] GROW wizard end-to-end
- [ ] WOOP wizard end-to-end
- [ ] IDENTITY wizard end-to-end
- [ ] Plan view at `/plan/[id]` renders
- [ ] Tier-routed model selection verified (check `AIGenerationLog`)

**Issues found:** _________________

---

## Section 3 — Reminders (M4)
- [ ] Reminders auto-scheduled at plan creation
- [ ] Cron dispatch fires every 5 min
- [ ] Email template renders (one of the 5)
- [ ] Push notification delivers
- [ ] In-app notification appears
- [ ] Notification preferences saved
- [ ] Watchdog catches a missed reminder

**Issues found:** _________________

---

## Section 4 — Admin console (M5)
- [ ] List loads with filters
- [ ] Detail tabs load
- [ ] Pause / resume / stop / delete each writes audit row
- [ ] CSV export downloads with correct headers
- [ ] CSV opens cleanly in Excel and Google Sheets

**Issues found:** _________________

---

## Section 5 — Stripe + tiers (M6)
- [ ] /pricing renders 4 tiers
- [ ] Checkout flow works with test card 4242 4242 4242 4242
- [ ] Webhook signature verifies
- [ ] Webhook idempotency: replay returns 200 with `ignored:true`
- [ ] /settings/billing reflects new tier
- [ ] Customer portal works
- [ ] /coach/customize gates Premium fields correctly

**Issues found:** _________________

---

## Section 6 — Cross-cutting
- [ ] Sign-up → onboarding → goal → wizard → plan → check-in works on a fresh account
- [ ] Mobile viewport (375×667) renders all new pages without horizontal scroll
- [ ] No new ERROR-level entries in Vercel logs during the smoke window
- [ ] No spike in 5xx rate vs the previous deploy

**Issues found:** _________________

---

## Sign-off

| Role | Name | Status | Date |
|---|---|---|---|
| Tester | | [ ] passed [ ] failed | |
| PM | | [ ] approved [ ] blocked | |
| Engineering | | [ ] approved [ ] blocked | |

**Final verdict:** [ ] GO  [ ] NO-GO

**Notes:** _________________
