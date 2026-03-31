import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding HabitOS AI...')

  const adminHash = await bcrypt.hash('admin123!', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@habitos.ai' },
    update: {},
    create: { name: 'Admin', email: 'admin@habitos.ai', password: adminHash, role: 'admin' },
  })
  console.log('Admin:', admin.email)

  const demoHash = await bcrypt.hash('demo1234', 12)
  const demo = await prisma.user.upsert({
    where: { email: 'demo@habitos.ai' },
    update: {},
    create: { name: 'Demo User', email: 'demo@habitos.ai', password: demoHash },
  })
  console.log('Demo:', demo.email)

  const habits = [
    { name: 'Morning Meditation', category: 'wellness', frequency: 'daily', color: '#10b981', icon: 'brain', description: '10 minutes of mindful meditation to start the day.' },
    { name: 'Read 20 Pages', category: 'learning', frequency: 'daily', color: '#6366f1', icon: 'book', description: 'Read at least 20 pages of a non-fiction book.' },
    { name: 'Exercise', category: 'fitness', frequency: 'daily', color: '#f43f5e', icon: 'zap', description: '30 minutes of physical activity.' },
    { name: 'Drink 8 Glasses of Water', category: 'health', frequency: 'daily', color: '#0ea5e9', icon: 'droplets', description: 'Stay hydrated throughout the day.' },
    { name: 'Weekly Review', category: 'productivity', frequency: 'weekly', color: '#f59e0b', icon: 'check', description: 'Review goals and plan the upcoming week.' },
  ]

  for (const habit of habits) {
    const created = await prisma.habit.upsert({
      where: { id: `demo-habit-${habit.name.toLowerCase().replace(/\s+/g, '-')}` },
      update: {},
      create: {
        id: `demo-habit-${habit.name.toLowerCase().replace(/\s+/g, '-')}`,
        userId: demo.id,
        ...habit,
      },
    })
    console.log('Habit:', created.name)

    // Seed last 7 days of check-ins for daily habits
    if (habit.frequency === 'daily') {
      for (let i = 1; i <= 7; i++) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const dateStr = d.toISOString().split('T')[0]
        await prisma.checkIn.upsert({
          where: { habitId_date: { habitId: created.id, date: dateStr } },
          update: {},
          create: { userId: demo.id, habitId: created.id, date: dateStr, completed: Math.random() > 0.2 },
        })
      }
    }
  }

  await prisma.userAchievement.upsert({
    where: { userId_achievement: { userId: demo.id, achievement: 'first_habit' } },
    update: {},
    create: { userId: demo.id, achievement: 'first_habit' },
  })

  console.log('Seed complete!')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
