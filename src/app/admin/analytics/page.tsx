import { prisma } from '@/lib/prisma'

export default async function AdminAnalyticsPage() {
  const now = new Date()
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now)
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().split('T')[0]
  })

  const [totalUsers, totalHabits, totalCheckins, recentUsers, categoryStats, topUsers] = await Promise.all([
    prisma.user.count(),
    prisma.habit.count({ where: { isActive: true } }),
    prisma.checkIn.count({ where: { completed: true } }),
    prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 30, select: { createdAt: true } }),
    prisma.habit.groupBy({ by: ['category'], _count: { id: true }, orderBy: { _count: { id: 'desc' } }, take: 8 }),
    prisma.user.findMany({
      take: 10,
      orderBy: { checkins: { _count: 'desc' } },
      select: { id: true, name: true, email: true, _count: { select: { checkins: true, habits: true } } },
    }),
  ])

  const signupsPerDay = last7Days.map(date => ({
    date: date.slice(5),
    count: recentUsers.filter(u => u.createdAt.toISOString().split('T')[0] === date).length,
  }))

  const maxSignups = Math.max(...signupsPerDay.map(d => d.count), 1)
  const maxCategory = Math.max(...categoryStats.map(c => c._count.id), 1)

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-gray-400 text-sm mt-1">Platform usage and growth metrics</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Users', value: totalUsers, color: 'text-blue-400' },
          { label: 'Active Habits', value: totalHabits, color: 'text-emerald-400' },
          { label: 'Total Check-ins', value: totalCheckins, color: 'text-violet-400' },
        ].map(s => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center">
            <div className={`text-3xl font-bold ${s.color}`}>{s.value.toLocaleString()}</div>
            <div className="text-sm text-gray-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Signups chart */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-white mb-6">New Signups — Last 7 Days</h2>
        <div className="flex items-end gap-3 h-32">
          {signupsPerDay.map(d => (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs text-emerald-400 font-medium">{d.count}</span>
              <div
                className="w-full bg-emerald-500 rounded-t-sm transition-all duration-500 min-h-[4px]"
                style={{ height: `${Math.max((d.count / maxSignups) * 100, 4)}px` }}
              />
              <span className="text-xs text-gray-500">{d.date}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Habit categories */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Habits by Category</h2>
          <div className="space-y-3">
            {categoryStats.map(c => (
              <div key={c.category || 'Other'}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-300 capitalize">{c.category || 'Other'}</span>
                  <span className="text-emerald-400">{c._count.id}</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <div
                    className="bg-emerald-500 h-2 rounded-full"
                    style={{ width: `${(c._count.id / maxCategory) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top users */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Top Users by Check-ins</h2>
          <div className="space-y-2">
            {topUsers.map((u, i) => (
              <div key={u.id} className="flex items-center gap-3">
                <span className="w-5 text-xs text-gray-500">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{u.name || u.email}</p>
                </div>
                <span className="text-xs text-emerald-400">{u._count.checkins} checkins</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
