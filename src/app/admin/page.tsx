import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string
  value: string | number
  sub?: string
  accent: string
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{label}</div>
      <div className={`text-3xl font-bold ${accent} mb-1`}>{value}</div>
      {sub && <div className="text-xs text-gray-500">{sub}</div>}
    </div>
  )
}

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== 'admin') redirect('/login')

  const today = new Date().toISOString().split('T')[0]

  const [totalUsers, activeHabits, totalCheckins, todayCheckins, recentUsers] = await Promise.all([
    prisma.user.count(),
    prisma.habit.count({ where: { isActive: true } }),
    prisma.checkIn.count({ where: { completed: true } }),
    prisma.checkIn.count({ where: { date: today } }),
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            habits: true,
            checkins: true,
          },
        },
      },
    }),
  ])

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">Platform overview for HabitOS</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-10">
        <StatCard
          label="Total Users"
          value={totalUsers}
          sub="All registered accounts"
          accent="text-blue-400"
        />
        <StatCard
          label="Active Habits"
          value={activeHabits}
          sub="Currently enabled habits"
          accent="text-emerald-400"
        />
        <StatCard
          label="Completed Check-ins"
          value={totalCheckins}
          sub="All time completions"
          accent="text-violet-400"
        />
        <StatCard
          label="Today's Check-ins"
          value={todayCheckins}
          sub={`On ${today}`}
          accent="text-amber-400"
        />
      </div>

      {/* Admin sections — quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-10">
        <Link
          href="/admin/coaching-plans"
          className="group block bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-emerald-500/40 hover:bg-gray-900/80 transition-colors"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2v20" />
                <path d="M2 12h20" />
                <circle cx="12" cy="12" r="9" />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">
                  Coaching Plans
                </h3>
                <span className="text-xs text-emerald-400/80">New</span>
              </div>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                List, filter, edit and pause/stop user coaching plans. Includes audit log + CSV export.
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent users */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="text-sm font-semibold text-white">Recent Users</h2>
          <Link
            href="/admin/users"
            className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            View all →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Habits
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {recentUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-800/40 transition-colors">
                  <td className="px-6 py-4 text-white font-medium">
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="hover:text-emerald-400 transition-colors"
                    >
                      {user.name || '—'}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-gray-400">{user.email}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'admin'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-gray-700 text-gray-300'
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400">{user._count.habits}</td>
                  <td className="px-6 py-4 text-gray-400">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {recentUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500 text-sm">
                    No users yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
