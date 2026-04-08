import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

// NOTE: Existing Plan model has `features String? @db.Text` (not Json),
// so we JSON.stringify the features object before upserting.
const tiers = [
  {
    slug: 'free',
    name: 'Free',
    priceMonthly: 0,
    priceYearly: 0,
    features: {
      activeGoalsLimit: 1,
      frameworks: ['GROW'],
      personasAllowed: ['alex-default'],
      customizeCoach: false,
      aiModel: 'gpt-4o-mini',
      emailReminders: false,
      pushReminders: false,
      smartScheduling: false,
      streakFreezesPerWeek: 1,
      weeklyInsights: false,
      atRiskRecovery: false,
      crossAppIntegration: false,
      priorityAi: false,
    },
  },
  {
    slug: 'starter',
    name: 'Starter',
    priceMonthly: 900, // cents
    priceYearly: 9000,
    features: {
      activeGoalsLimit: 3,
      frameworks: ['GROW', 'WOOP'],
      personasAllowed: [
        'alex-default',
        'maya-cheer',
        'sergeant-rex',
        'dr-iris',
        'leo-friend',
      ],
      customizeCoach: false,
      aiModel: 'gpt-4o-mini',
      emailReminders: true,
      pushReminders: false,
      smartScheduling: 'basic',
      streakFreezesPerWeek: 2,
      weeklyInsights: false,
      atRiskRecovery: false,
      crossAppIntegration: false,
      priorityAi: false,
    },
  },
  {
    slug: 'pro',
    name: 'Pro',
    priceMonthly: 1900,
    priceYearly: 19000,
    features: {
      activeGoalsLimit: 10,
      frameworks: ['GROW', 'WOOP', 'IDENTITY'],
      personasAllowed: [
        'alex-default',
        'maya-cheer',
        'sergeant-rex',
        'dr-iris',
        'leo-friend',
        'zen-master-ko',
        'coach-amara',
        'exec-vincent',
        'dr-rivera',
      ],
      customizeCoach: false,
      aiModel: 'o4-mini',
      emailReminders: true,
      pushReminders: true,
      smartScheduling: 'full',
      streakFreezesPerWeek: 4,
      weeklyInsights: true,
      atRiskRecovery: 'basic',
      crossAppIntegration: false,
      priorityAi: false,
    },
  },
  {
    slug: 'premium',
    name: 'Premium',
    priceMonthly: 3900,
    priceYearly: 39000,
    features: {
      activeGoalsLimit: -1, // unlimited
      frameworks: ['GROW', 'WOOP', 'IDENTITY'],
      personasAllowed: 'all',
      customizeCoach: true,
      aiModel: 'o4-mini', // o3 for weekly review only
      emailReminders: true,
      pushReminders: true,
      smartScheduling: 'full',
      streakFreezesPerWeek: -1,
      weeklyInsights: 'deep',
      atRiskRecovery: 'full',
      crossAppIntegration: true,
      priorityAi: true,
      weeklyReviewModel: 'o3',
    },
  },
]

async function main() {
  console.log('Seeding 4 plan tiers...')
  for (const t of tiers) {
    const featuresStr = JSON.stringify(t.features)
    await prisma.plan.upsert({
      where: { slug: t.slug },
      update: {
        name: t.name,
        priceMonthly: t.priceMonthly,
        priceYearly: t.priceYearly,
        features: featuresStr,
        isActive: true,
      },
      create: {
        slug: t.slug,
        name: t.name,
        priceMonthly: t.priceMonthly,
        priceYearly: t.priceYearly,
        features: featuresStr,
        isActive: true,
      },
    })
    console.log(`  ${t.name} (${t.slug}) — $${t.priceMonthly / 100}/mo`)
  }
  const count = await prisma.plan.count()
  console.log(`\nTotal plans in DB: ${count}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
