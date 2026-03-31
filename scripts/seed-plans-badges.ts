import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()

async function main() {
  console.log('Seeding Plans...')

  const plans = [
    {
      slug: 'free',
      name: 'Free',
      description: 'Get started with habit tracking',
      priceMonthly: 0,
      priceYearly: 0,
      features: JSON.stringify([
        '5 habits',
        '7-day history',
        'Basic streaks',
        '3 AI messages/day',
        'Daily quests',
        'Leaderboard access',
      ]),
      isActive: true,
    },
    {
      slug: 'pro',
      name: 'Pro',
      description: 'Unlimited habits and full AI coaching',
      priceMonthly: 499,
      priceYearly: 3999,
      features: JSON.stringify([
        'Unlimited habits',
        'Full history & analytics',
        'Unlimited AI coaching',
        'Streak freezes',
        'Priority support',
        'Custom themes',
        'Advanced insights',
        'Export data',
      ]),
      isActive: true,
    },
  ]

  for (const pl of plans) {
    await p.plan.upsert({ where: { slug: pl.slug }, update: pl, create: pl })
    console.log(`  Plan: ${pl.name}`)
  }

  console.log('\nSeeding Badges...')

  const badges = [
    // Milestone badges
    { slug: 'first-checkin', name: 'First Check-in', description: 'Complete your first habit check-in', icon: 'check-circle', category: 'milestone', xpRequired: 0 },
    { slug: 'five-habits', name: 'Habit Builder', description: 'Create 5 habits', icon: 'layers', category: 'milestone', xpRequired: 0 },
    { slug: 'ten-habits', name: 'Habit Master', description: 'Create 10 habits', icon: 'grid', category: 'milestone', xpRequired: 0 },
    { slug: 'first-quest', name: 'Quest Starter', description: 'Complete your first daily quest', icon: 'flag', category: 'milestone', xpRequired: 0 },

    // Streak badges
    { slug: 'streak-7', name: 'Week Warrior', description: '7-day streak on any habit', icon: 'flame', category: 'streak', xpRequired: 0 },
    { slug: 'streak-30', name: 'Monthly Master', description: '30-day streak on any habit', icon: 'trophy', category: 'streak', xpRequired: 0 },
    { slug: 'streak-100', name: 'Century Streak', description: '100-day streak on any habit', icon: 'diamond', category: 'streak', xpRequired: 0 },

    // Daily badges
    { slug: 'all-habits', name: 'Perfect Day', description: 'Complete all habits in one day', icon: 'star', category: 'daily', xpRequired: 0 },
    { slug: 'early-bird', name: 'Early Bird', description: 'Check in before 7am', icon: 'sunrise', category: 'time', xpRequired: 0 },
    { slug: 'night-owl', name: 'Night Owl', description: 'Check in after 10pm', icon: 'moon', category: 'time', xpRequired: 0 },

    // Wellness badges
    { slug: 'mood-tracker', name: 'Self Aware', description: 'Log mood 7 days in a row', icon: 'brain', category: 'wellness', xpRequired: 0 },

    // XP tier badges
    { slug: 'xp-500', name: 'Rising Star', description: 'Earn 500 XP', icon: 'sparkles', category: 'xp', xpRequired: 500 },
    { slug: 'xp-1000', name: 'Bronze Status', description: 'Earn 1,000 XP', icon: 'medal', category: 'xp', xpRequired: 1000 },
    { slug: 'xp-5000', name: 'Silver Status', description: 'Earn 5,000 XP', icon: 'award', category: 'xp', xpRequired: 5000 },
    { slug: 'xp-10000', name: 'Gold Status', description: 'Earn 10,000 XP', icon: 'crown', category: 'xp', xpRequired: 10000 },
  ]

  for (const b of badges) {
    await p.badge.upsert({ where: { slug: b.slug }, update: b, create: b })
    console.log(`  Badge: ${b.name}`)
  }

  await p.$disconnect()
  console.log('\nHabitOS seed complete! (2 Plans + 15 Badges)')
}

main().catch(e => { console.error(e); process.exit(1) })
