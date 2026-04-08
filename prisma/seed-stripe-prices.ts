/**
 * seed-stripe-prices.ts
 *
 * One-time diagnostic helper. The Plan model in M1 has no stripePriceId
 * column, so we cannot persist Stripe price IDs in the database — they
 * live in env vars (STRIPE_PRICE_<SLUG>_<INTERVAL>) and are resolved at
 * runtime by src/lib/stripe/tier-resolver.ts.
 *
 * This script does NOT mutate the database. It loads the env, lists the
 * configured price IDs alongside the existing Plan rows, and reports any
 * gaps so an operator can spot a typo before going live.
 *
 * Run with: `npx tsx prisma/seed-stripe-prices.ts`
 *
 * DO NOT auto-run from the seed pipeline.
 */
import { PrismaClient } from '@prisma/client'

const PAID_SLUGS = ['starter', 'pro', 'premium'] as const
const INTERVALS = ['monthly', 'yearly'] as const

const prisma = new PrismaClient()

function envKey(slug: string, interval: string): string {
  return `STRIPE_PRICE_${slug.toUpperCase()}_${interval.toUpperCase()}`
}

async function main() {
  console.log('=== HabitOS Stripe price audit ===\n')

  const plans = await prisma.plan.findMany({
    where: { isActive: true },
    orderBy: { priceMonthly: 'asc' },
    select: {
      slug: true,
      name: true,
      priceMonthly: true,
      priceYearly: true,
    },
  })

  console.log(`Found ${plans.length} active Plan rows in DB:`)
  for (const p of plans) {
    console.log(
      `  ${p.slug.padEnd(10)} ${p.name.padEnd(12)} $${p.priceMonthly / 100}/mo  $${p.priceYearly / 100}/yr`
    )
  }
  console.log()

  console.log('Checking env vars for paid tiers:')
  const missing: string[] = []
  const present: Array<{ slug: string; interval: string; key: string; value: string }> = []
  for (const slug of PAID_SLUGS) {
    for (const interval of INTERVALS) {
      const key = envKey(slug, interval)
      const value = process.env[key]
      if (value) {
        present.push({ slug, interval, key, value })
        console.log(`  OK   ${key.padEnd(40)} = ${value}`)
      } else {
        missing.push(key)
        console.log(`  MISS ${key.padEnd(40)} = <unset>`)
      }
    }
  }
  console.log()

  if (missing.length > 0) {
    console.log(
      `WARNING: ${missing.length} env var(s) missing. ` +
        `Checkout for those tiers will return 400 until configured.\n`
    )
    console.log('Add to .env (or Vercel project env):')
    for (const k of missing) console.log(`  ${k}=price_xxxxxxxx`)
  } else {
    console.log('All 6 paid tier price IDs are present in env. Ready to go.')
  }

  // Sanity check: every paid Plan slug should have an env var pair.
  const dbPaidSlugs = plans.map((p) => p.slug).filter((s) => s !== 'free')
  const expectedSlugs: ReadonlyArray<string> = PAID_SLUGS
  for (const s of dbPaidSlugs) {
    if (!expectedSlugs.includes(s)) {
      console.warn(
        `\nWARN: Plan row '${s}' exists in DB but tier-resolver only knows about ${PAID_SLUGS.join('|')}. ` +
          `Update lib/stripe/tier-resolver.ts if you added a new tier.`
      )
    }
  }
  for (const s of expectedSlugs) {
    if (!dbPaidSlugs.includes(s)) {
      console.warn(
        `\nWARN: tier-resolver expects '${s}' but no active Plan row exists. ` +
          `Run prisma/seed-plan-tiers.ts.`
      )
    }
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
