# HabitOS AI — Tech Stack Reference

## Core
- **Framework**: Next.js 14.2 (App Router)
- **Language**: TypeScript 5
- **Runtime**: Node.js 20+

## Frontend
- **Styling**: Tailwind CSS 3.4 (dark theme, amber accent #f59e0b)
- **Icons**: lucide-react
- **Charts**: recharts (already installed)
- **Font**: Inter (Google Fonts)

## Backend
- **Database**: PostgreSQL (Neon serverless)
- **ORM**: Prisma 6 (MUST stay on v6, v7 has breaking changes)
- **Auth**: NextAuth.js 4.24 (credentials + JWT strategy)
- **AI**:
  - `gpt-4o-mini` — Free/Starter tier, chat + plan generation
  - `o4-mini` — Pro tier reasoning model (plan generation)
  - `o3` — Premium tier, weekly deep analysis only
- **Validation**: Zod (to be added in Phase 1)
- **Email**: Resend + React Email (to be added in Phase 1)
- **Push**: web-push + VAPID (to be added in Phase 1)
- **Payments**: Stripe (to be added in Phase 1)
- **Cron**: Vercel Cron via vercel.json (to be added in Phase 4)

## Infrastructure
- **Hosting**: Vercel
- **Database**: Neon PostgreSQL (db: habitos_ai)
- **VCS**: GitHub (haidongkixot/habitos-ai)
- **Cron**: Vercel Cron — 3 jobs (hourly dispatch, daily at-risk, daily motivation)

## Brand
- **Color**: Amber #f59e0b
- **Background**: Dark (#0c0c0f base, #1c1c22 card, #16161a elevated)
- **Font**: Inter
- **Tagline**: "Build habits that stick"
- **Voice**: Warm, grounded, science-based

## Coach Personas
12 personas across 4 tiers. See `roles/designer/CLAUDE.md` for avatar strategy.

## Research Foundation
See `RESEARCH-FOUNDATION.md` at project root. All coaching logic must cite this.
Core pillars: Lally 66-day asymptote, Fogg B=MAP, Gollwitzer implementation intentions, Clear identity layers, Wood & Neal context cues, Deci & Ryan self-determination theory.
