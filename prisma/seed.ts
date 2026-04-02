import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

function daysAgo(n: number) { const d = new Date(); d.setDate(d.getDate() - n); return d }
function dateStr(n: number) { return daysAgo(n).toISOString().split('T')[0] }

async function main() {
  console.log('🌱 Seeding HabitOS AI...')

  // Plans
  const freePlan = await prisma.plan.upsert({
    where: { slug: 'free' }, update: {},
    create: { slug: 'free', name: 'Starter', description: 'Build your first habits', priceMonthly: 0, priceYearly: 0, features: 'Up to 5 habits\nBasic analytics\nStreak tracking\nCommunity support', isActive: true },
  })
  const proPlan = await prisma.plan.upsert({
    where: { slug: 'pro' }, update: {},
    create: { slug: 'pro', name: 'Growth', description: 'Unlimited habits, AI coaching, and deep insights', priceMonthly: 799, priceYearly: 7188, features: 'Unlimited habits\nAI coaching (unlimited)\nAdvanced analytics\nReminders & notifications\nHabit templates\nPriority support', isActive: true },
  })
  const teamPlan = await prisma.plan.upsert({
    where: { slug: 'team' }, update: {},
    create: { slug: 'team', name: 'Team', description: 'Shared accountability and team habits', priceMonthly: 1999, priceYearly: 19188, features: 'Everything in Growth\nTeam habits\nShared accountability\nAdmin dashboard\nTeam analytics', isActive: true },
  })
  console.log('  ✓ Plans')

  // Badges
  const badgeDefs = [
    { slug: 'first-checkin', name: 'First Check-in', description: 'Complete your first habit check-in', icon: 'star', category: 'milestone', xpRequired: 0 },
    { slug: 'week-streak', name: '7-Day Streak', description: 'Maintain a 7-day streak on any habit', icon: 'flame', category: 'streak', xpRequired: 100 },
    { slug: 'month-streak', name: '30-Day Streak', description: 'Maintain a 30-day streak', icon: 'trophy', category: 'streak', xpRequired: 500 },
    { slug: 'habit-builder', name: 'Habit Builder', description: 'Create 5 active habits', icon: 'layers', category: 'growth', xpRequired: 50 },
    { slug: 'consistency-king', name: 'Consistency King', description: 'Complete habits 90%+ for 30 days', icon: 'crown', category: 'mastery', xpRequired: 1000 },
    { slug: 'early-bird', name: 'Early Bird', description: 'Complete 10 morning habits before 9am', icon: 'sunrise', category: 'lifestyle', xpRequired: 150 },
  ]
  for (const b of badgeDefs) {
    await prisma.badge.upsert({ where: { slug: b.slug }, update: {}, create: b })
  }
  console.log('  ✓ Badges')

  // Users
  const adminHash = await bcrypt.hash('admin123!', 12)
  const demoHash = await bcrypt.hash('demo1234', 12)

  const admin = await prisma.user.upsert({ where: { email: 'admin@habitos.ai' }, update: {}, create: { email: 'admin@habitos.ai', name: 'Admin', password: adminHash, role: 'admin' } })
  const sarah = await prisma.user.upsert({ where: { email: 'sarah.chen@example.com' }, update: {}, create: { email: 'sarah.chen@example.com', name: 'Sarah Chen', password: demoHash } })
  const marcus = await prisma.user.upsert({ where: { email: 'marcus.johnson@example.com' }, update: {}, create: { email: 'marcus.johnson@example.com', name: 'Marcus Johnson', password: demoHash } })
  const emma = await prisma.user.upsert({ where: { email: 'emma.wilson@example.com' }, update: {}, create: { email: 'emma.wilson@example.com', name: 'Emma Wilson', password: demoHash } })
  const alex = await prisma.user.upsert({ where: { email: 'alex.rivera@example.com' }, update: {}, create: { email: 'alex.rivera@example.com', name: 'Alex Rivera', password: demoHash } })
  console.log('  ✓ Users')

  // Subscriptions
  await prisma.subscription.upsert({
    where: { id: 'sub-sarah-hb' }, update: {},
    create: { id: 'sub-sarah-hb', userId: sarah.id, planId: proPlan.id, status: 'active', currentPeriodStart: daysAgo(30), currentPeriodEnd: daysAgo(-30) },
  })
  console.log('  ✓ Subscriptions')

  // Habits for Sarah
  const sarahHabits = [
    { id: 'sh-meditation', name: 'Morning Meditation', description: '10 minutes of mindful meditation to start the day.', category: 'wellness', frequency: 'daily', color: '#10b981', icon: 'brain', targetDays: 7 },
    { id: 'sh-reading', name: 'Read 30 Pages', description: 'Read at least 30 pages of a non-fiction book.', category: 'learning', frequency: 'daily', color: '#6366f1', icon: 'book', targetDays: 7 },
    { id: 'sh-exercise', name: 'Exercise 30 mins', description: '30 minutes of physical activity — gym, run, or yoga.', category: 'fitness', frequency: 'daily', color: '#f43f5e', icon: 'zap', targetDays: 7 },
    { id: 'sh-water', name: 'Drink 8 Glasses of Water', description: 'Stay hydrated throughout the day.', category: 'health', frequency: 'daily', color: '#0ea5e9', icon: 'droplets', targetDays: 7 },
    { id: 'sh-review', name: 'Weekly Review & Planning', description: 'Review goals and plan the upcoming week.', category: 'productivity', frequency: 'weekly', color: '#f59e0b', icon: 'check', targetDays: 1 },
  ]
  for (const h of sarahHabits) {
    await prisma.habit.upsert({ where: { id: h.id }, update: {}, create: { ...h, userId: sarah.id } })
  }

  // Habits for Marcus
  const marcusHabits = [
    { id: 'mh-run', name: 'Morning Run', description: '5km morning run to energize the day.', category: 'fitness', frequency: 'daily', color: '#f43f5e', icon: 'zap', targetDays: 7 },
    { id: 'mh-social', name: 'No Social Media Before Noon', description: 'Protect morning focus by avoiding social media.', category: 'digital-wellness', frequency: 'daily', color: '#8b5cf6', icon: 'ban', targetDays: 7 },
    { id: 'mh-gratitude', name: 'Gratitude Journal', description: 'Write 3 things you are grateful for each morning.', category: 'mindfulness', frequency: 'daily', color: '#10b981', icon: 'heart', targetDays: 7 },
    { id: 'mh-cold', name: 'Cold Shower', description: 'End shower with 30 seconds of cold water.', category: 'health', frequency: 'daily', color: '#0ea5e9', icon: 'droplets', targetDays: 7 },
  ]
  for (const h of marcusHabits) {
    await prisma.habit.upsert({ where: { id: h.id }, update: {}, create: { ...h, userId: marcus.id } })
  }

  // Habits for Emma
  const emmaHabits = [
    { id: 'eh-steps', name: 'Walk 10,000 Steps', description: 'Reach 10,000 steps every day.', category: 'fitness', frequency: 'daily', color: '#f43f5e', icon: 'footprints', targetDays: 7 },
    { id: 'eh-sleep', name: 'Sleep Before 11pm', description: 'Protect sleep quality with consistent bedtime.', category: 'health', frequency: 'daily', color: '#6366f1', icon: 'moon', targetDays: 7 },
    { id: 'eh-spanish', name: 'Learn Spanish 15 mins', description: '15 minutes of Duolingo or practice daily.', category: 'learning', frequency: 'daily', color: '#f59e0b', icon: 'languages', targetDays: 7 },
  ]
  for (const h of emmaHabits) {
    await prisma.habit.upsert({ where: { id: h.id }, update: {}, create: { ...h, userId: emma.id } })
  }
  console.log('  ✓ Habits')

  // Check-ins: 30 days for Sarah, 14 for Marcus, 3 for Emma
  const checkInConfigs = [
    { user: sarah, habits: sarahHabits.filter(h => h.frequency === 'daily'), days: 30, completionRate: 0.88 },
    { user: marcus, habits: marcusHabits.filter(h => h.frequency === 'daily'), days: 14, completionRate: 0.75 },
    { user: emma, habits: emmaHabits.filter(h => h.frequency === 'daily'), days: 3, completionRate: 1.0 },
  ]
  for (const { user, habits, days, completionRate } of checkInConfigs) {
    for (const habit of habits) {
      for (let i = 1; i <= days; i++) {
        const date = dateStr(i)
        const completed = Math.random() < completionRate
        try {
          await prisma.checkIn.upsert({
            where: { habitId_date: { habitId: habit.id, date } },
            update: {},
            create: { userId: user.id, habitId: habit.id, date, completed, mood: completed ? Math.floor(Math.random() * 2) + 4 : 3 },
          })
        } catch { /* skip duplicates */ }
      }
    }
    console.log(`  ✓ Check-ins: ${user.name}`)
  }

  // UserGamification
  const gamRows = [
    { user: sarah, xp: 3200, level: 7, currentStreak: 24, longestStreak: 30, totalCheckins: 142 },
    { user: marcus, xp: 980, level: 3, currentStreak: 11, longestStreak: 14, totalCheckins: 58 },
    { user: emma, xp: 90, level: 1, currentStreak: 3, longestStreak: 3, totalCheckins: 9 },
    { user: alex, xp: 1450, level: 4, currentStreak: 7, longestStreak: 21, totalCheckins: 87 },
  ]
  for (const { user, xp, level, currentStreak, longestStreak, totalCheckins } of gamRows) {
    await prisma.userGamification.upsert({ where: { userId: user.id }, update: {}, create: { userId: user.id, xp, level, currentStreak, longestStreak, totalCheckins, lastCheckinDate: dateStr(0) } })
  }
  console.log('  ✓ Gamification')

  // XP Transactions
  for (let i = 0; i < 12; i++) {
    const sources = [['checkin', 10], ['full_day', 50], ['streak_bonus', 25], ['badge', 100]] as const
    const [source, amount] = sources[i % 4]
    await prisma.xpTransaction.create({ data: { userId: sarah.id, amount, source, detail: `Day ${30 - i} activity`, createdAt: daysAgo(i) } })
  }
  console.log('  ✓ XP Transactions')

  // User Achievements
  const achievementRows = [
    { user: sarah, achievements: ['first_habit', 'seven_day_streak', 'thirty_day_streak', 'habit_builder', 'consistency_king'] },
    { user: marcus, achievements: ['first_habit', 'seven_day_streak'] },
    { user: emma, achievements: ['first_habit'] },
    { user: alex, achievements: ['first_habit', 'seven_day_streak', 'habit_builder'] },
  ]
  for (const { user, achievements } of achievementRows) {
    for (const achievement of achievements) {
      await prisma.userAchievement.upsert({ where: { userId_achievement: { userId: user.id, achievement } }, update: {}, create: { userId: user.id, achievement } })
    }
  }
  console.log('  ✓ Achievements')

  // UserBadges
  const allBadges = await prisma.badge.findMany({ select: { id: true, slug: true } })
  const badgeMap: Record<string, string> = {}
  for (const b of allBadges) badgeMap[b.slug] = b.id

  const userBadgeRows = [
    { user: sarah, slugs: ['first-checkin', 'week-streak', 'month-streak', 'habit-builder'] },
    { user: marcus, slugs: ['first-checkin', 'week-streak'] },
    { user: emma, slugs: ['first-checkin'] },
    { user: alex, slugs: ['first-checkin', 'week-streak', 'habit-builder'] },
  ]
  for (const { user, slugs } of userBadgeRows) {
    for (const slug of slugs) {
      if (!badgeMap[slug]) continue
      await prisma.userBadge.upsert({ where: { userId_badgeId: { userId: user.id, badgeId: badgeMap[slug] } }, update: {}, create: { userId: user.id, badgeId: badgeMap[slug] } })
    }
  }
  console.log('  ✓ User Badges')

  // Daily Quests
  const today = dateStr(0)
  const quests = [
    { questType: 'morning_habits', description: 'Complete your morning habits (meditation + exercise)', xpReward: 25, completed: false },
    { questType: 'perfect_day', description: 'Complete all 4 daily habits today', xpReward: 50, completed: false },
    { questType: 'journal_note', description: 'Add a note to one of your check-ins', xpReward: 10, completed: true },
  ]
  for (const q of quests) {
    await prisma.dailyQuest.upsert({ where: { userId_date_questType: { userId: sarah.id, date: today, questType: q.questType } }, update: {}, create: { userId: sarah.id, date: today, ...q } })
  }
  console.log('  ✓ Daily Quests')

  // Assistant Conversation
  const convo = await prisma.assistantConversation.create({
    data: { userId: sarah.id, title: 'Habit consistency tips' },
  })
  await prisma.assistantMessage.createMany({ data: [
    { conversationId: convo.id, role: 'user', content: "I keep missing my morning meditation. I'm consistent with everything else but this one keeps slipping. Any tips?" },
    { conversationId: convo.id, role: 'assistant', content: "Morning habits are tough to stick with! Try habit stacking — attach your meditation to an existing trigger you never miss, like your first cup of coffee. Place your meditation cushion next to the coffee maker as a visual cue. Even 5 minutes counts toward your streak. Your data shows you're 88% consistent overall, so this isn't a discipline problem — it's a cue problem." },
    { conversationId: convo.id, role: 'user', content: 'What about when I travel? My routine completely falls apart.' },
    { conversationId: convo.id, role: 'assistant', content: "Travel disrupts routines, but here's the key: shrink the habit. On travel days, commit to just 3 minutes of meditation instead of 10. The streak survives when the minimum viable version is very small. For exercise, use hotel room bodyweight workouts — no gym needed. Your 30-day streak shows you have the discipline; you just need portable versions of your habits." },
  ]})
  console.log('  ✓ AI Conversations')

  // Blog Posts
  const posts = [
    { slug: 'science-of-habit-stacking', title: 'The Science of Habit Stacking: How to Build Habits That Stick', excerpt: "Habit stacking is one of the most reliable techniques in behavioral science. It works by linking a new habit to an existing one — hijacking your brain's existing neural pathways.", content: `BJ Fogg at Stanford spent 20 years studying behavior change and concluded that the most reliable way to build a new habit is to attach it to an existing one. He calls this "habit stacking." The formula is simple: After [CURRENT HABIT], I will [NEW HABIT].\n\nThe science behind it involves procedural memory — the kind of memory that stores "how to do things." When you pair a new behavior with an established cue, the existing neural pathway activates the new behavior automatically over time.\n\n**How to implement it:**\n1. Identify a "golden" habit — something you do every single day without fail (coffee, teeth brushing, checking email)\n2. Choose a new habit that takes under 2 minutes\n3. Write the stack explicitly: "After I pour my morning coffee, I will write one sentence in my gratitude journal"\n4. Place visual cues at the location where the old habit happens\n\nThe two-minute rule is critical for starting. Once a habit has a foothold, you can expand it. But trying to start with a 30-minute meditation when you've never meditated before creates too much friction. Start with one breath.`, published: true, tags: 'science,habit-stacking,behavior-change,beginner' },
    { slug: '66-days-habit-formation', title: "Why 66 Days (Not 21) to Form a Habit — What the Science Actually Says", excerpt: "The '21 days to form a habit' myth has been debunked. A UCL study found the real average is 66 days — and it varies wildly by complexity.", content: `The "21 days to form a habit" idea traces back to Dr. Maxwell Maltz, a plastic surgeon who noticed his patients took about 21 days to adjust to their new appearance. He wrote about this observation in a 1960 self-help book, and it spread as fact.\n\nIn 2010, researcher Phillippa Lally at University College London published the first rigorous study of real habit formation. She tracked 96 participants trying to adopt a new healthy behavior over 12 weeks. The result: it took an average of 66 days for a behavior to become automatic — and the range was 18 to 254 days.\n\n**What affects the timeline?**\n- Complexity: A simple habit like "drink a glass of water at lunch" took ~20 days. "Do 50 sit-ups before dinner" took over 80.\n- Motivation: Higher intrinsic motivation accelerated formation\n- Consistency: Missing a day occasionally didn't significantly delay habit formation\n\nThe most important finding: you don't need to be perfect. Missing one day had no meaningful effect on the formation process. The pressure to never miss is counterproductive — it makes the habit fragile.`, published: true, tags: 'science,habit-formation,psychology,research' },
    { slug: 'morning-routine-keystone-habit', title: 'Morning Routine: The Keystone Habit That Changes Everything', excerpt: "Charles Duhigg's research identified 'keystone habits' — behaviors that trigger a cascade of other positive changes. Morning routines are the most powerful example.", content: `Charles Duhigg coined the term "keystone habits" in his 2012 book The Power of Habit. These are behaviors that don't just affect the immediate activity — they create ripple effects across other areas of life.\n\nMorning routines consistently emerge as the most potent keystone habit for several reasons:\n\n**Willpower is highest in the morning.** Decision fatigue is real — each choice depletes a limited cognitive resource. By placing your most important habit first, before the day's demands drain your reserves, you dramatically increase completion rates.\n\n**Morning sets a "win" trajectory.** Research on mood and motivation shows that completing a meaningful task early creates momentum. The psychological state of "I am someone who follows through" compounds throughout the day.\n\n**The compound effect is strongest for morning habits.** In a 30-day HabitOS data analysis, users who completed at least one morning habit before 9am completed 67% more total habits that day compared to days without a morning completion.\n\nStart with the smallest possible morning habit — 2 minutes of meditation, one page of reading, one glass of water. The specific behavior matters less than the identity it builds: "I am someone who starts each day intentionally."`, published: true, tags: 'morning-routine,keystone-habits,productivity,science' },
    { slug: 'habits-during-travel', title: 'How to Maintain Habits During Travel and Disruption', excerpt: "Travel is where habits go to die — unfamiliar environments, disrupted schedules, and no visual cues. Here's how to protect your streaks without sacrificing the trip.", content: `Travel breaks habits not because of laziness, but because habits depend heavily on environmental cues. Your kitchen coffee maker reminds you to meditate. Your running shoes by the door remind you to exercise. Remove the environment, remove the cue, remove the behavior.\n\n**The Portable Habit Protocol:**\n\n1. **Shrink, don't skip.** Define a "travel minimum" for each habit before you leave. Meditation: 3 minutes (not 20). Exercise: 10 push-ups and a 10-minute walk (not a gym session). This minimum counts for your streak.\n\n2. **Re-anchor to new cues.** Hotel wake-up call → meditate. Hotel breakfast → gratitude journal. Boarding pass scan → deep breathing exercise. New environment, new cues.\n\n3. **Pack trigger objects.** A small item associated with your habit can transport the cue. A travel meditation app, resistance bands, a pocket journal. The object triggers the behavior the same way your home environment did.\n\n4. **Use the "never miss twice" rule.** Missing once is an accident. Missing twice is starting a new habit of not doing it. If you miss due to travel chaos, the next day is non-negotiable.`, published: true, tags: 'travel,habit-maintenance,disruption,practical' },
  ]
  for (const post of posts) {
    await prisma.blogPost.upsert({ where: { slug: post.slug }, update: {}, create: { ...post, publishedAt: daysAgo(Math.floor(Math.random() * 20) + 2) } })
  }
  console.log('  ✓ Blog Posts')

  // Site Settings
  await prisma.siteSettings.upsert({ where: { key: 'site_name' }, update: {}, create: { key: 'site_name', value: 'HabitOS AI' } })
  await prisma.siteSettings.upsert({ where: { key: 'tagline' }, update: {}, create: { key: 'tagline', value: 'Build habits that last.' } })
  await prisma.siteSettings.upsert({ where: { key: 'maintenance_mode' }, update: {}, create: { key: 'maintenance_mode', value: 'false' } })
  console.log('  ✓ Site Settings')

  // Notifications
  await prisma.notification.createMany({ data: [
    { userId: sarah.id, type: 'streak', title: 'Streak Milestone: 24 Days! 🔥', body: "You've maintained your habit streak for 24 consecutive days. You're building something real.", read: false, createdAt: daysAgo(0) },
    { userId: sarah.id, type: 'insight', title: 'Weekly Insight Ready', body: 'Your morning meditation completion jumped to 90% this week. Here\'s what changed.', read: false, createdAt: daysAgo(1) },
    { userId: sarah.id, type: 'reminder', title: 'Don\'t break the chain! ⛓️', body: "You haven't logged your evening habits yet today. 2 minutes before bed!", read: true, createdAt: daysAgo(0) },
    { userId: marcus.id, type: 'badge', title: 'Badge Earned: 7-Day Streak 🔥', body: "You've maintained your morning run for 7 consecutive days. Keep it going!", read: true, createdAt: daysAgo(7) },
    { userId: marcus.id, type: 'reminder', title: 'Gratitude Journal Reminder', body: "You haven't logged your gratitude journal yet today.", read: false, createdAt: daysAgo(0) },
    { userId: emma.id, type: 'welcome', title: 'Welcome to HabitOS! 🌱', body: "You've taken the first step. Check in your first habit to start your streak.", read: true, createdAt: daysAgo(3) },
  ]})
  console.log('  ✓ Notifications')

  // Error Logs
  await prisma.errorLog.createMany({ data: [
    { level: 'info', source: 'cron', message: 'Weekly stats aggregation completed', metadata: '{"users":312,"habits":1847,"checkins_today":924}' },
    { level: 'info', source: 'cron', message: 'Streak calculation and notifications sent', metadata: '{"notifications_sent":89}' },
    { level: 'warn', source: 'api', message: 'AI coaching rate limit reached for free user', userId: emma.id, metadata: '{"limit":3,"attempted":4}' },
    { level: 'error', source: 'api', message: 'Database connection timeout during check-in save', stack: 'Error: Connection timeout\n  at saveCheckIn (route.ts:52)', metadata: '{"userId":"cm_test","retries":3}' },
  ]})
  console.log('  ✓ Error Logs')

  // Activity Events
  for (const user of [sarah, marcus, emma, alex]) {
    await prisma.activityEvent.createMany({ data: [
      { userId: user.id, type: 'login', createdAt: daysAgo(0) },
      { userId: user.id, type: 'checkin_completed', createdAt: daysAgo(1) },
    ]})
  }
  await prisma.activityEvent.create({ data: { userId: sarah.id, type: 'badge_earned', metadata: '{"badge":"month-streak"}', createdAt: daysAgo(5) } })
  console.log('  ✓ Activity Events')

  console.log('\n🎉 HabitOS seed complete!')
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1) })
