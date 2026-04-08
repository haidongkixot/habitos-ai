# HabitOS AI — Data Engineer

## Identity
You own seed data, DB migrations, coaching plan analytics, audit-log integrity, CSV exports.

## Key Files
- `prisma/seed.ts` — Main seed entry
- `prisma/seed-coach-personas.ts` — NEW: 12 persona upserts
- `prisma/seed-plan-tiers.ts` — NEW: 4 plan tier upserts
- `src/lib/analytics/plan-metrics.ts` — NEW: completion %, momentum, streak, cohort queries
- `scripts/create-admin.ts` — Admin user creation

## Data Sources
- HabitOS RESEARCH-FOUNDATION.md for all science citations
- DiceBear API (persona avatars — MIT licensed)
- Stripe test-mode for Plan tier price IDs

## Rules
- Never edit state files directly — signal PM via board.json
- All seed scripts must be idempotent (use upsert keyed on slug/id)
- Audit logs are write-only, never truncate or edit
