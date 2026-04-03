import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'
import Providers from '@/components/providers'

const navLinks = [
  { href: '/admin', label: 'Dashboard', icon: '▦' },
  { href: '/admin/users', label: 'Users', icon: '👥' },
  { href: '/admin/habits', label: 'Habits', icon: '✅' },
  { href: '/admin/templates', label: 'Templates', icon: '📦' },
  { href: '/admin/checkins', label: 'Check-ins', icon: '📋' },
  { href: '/admin/achievements', label: 'Achievements', icon: '🏆' },
  { href: '/admin/analytics', label: 'Analytics', icon: '📊' },
  { href: '/admin/plans', label: 'Plans', icon: '💳' },
  { href: '/admin/cms', label: 'Blog / CMS', icon: '📝' },
  { href: '/admin/ai-config', label: 'AI Config', icon: '🎛️' },
  { href: '/admin/ai-logs', label: 'AI Logs', icon: '📋' },
  { href: '/admin/logs', label: 'Error Logs', icon: '🔍' },
  { href: '/admin/notifications', label: 'Notifications', icon: '🔔' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)

  if (!session?.user || (session.user as any).role !== 'admin') {
    redirect('/login')
  }

  const adminEmail = session.user.email

  return (
    <Providers>
      <div className="flex min-h-screen bg-gray-950 text-gray-100">
        {/* Sidebar */}
        <aside className="w-64 flex-shrink-0 flex flex-col bg-gray-900 border-r border-gray-800">
          {/* Brand header */}
          <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-800">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400">
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
                <polyline points="9 11 12 14 22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-bold text-white leading-tight">HabitOS Admin</div>
              <div className="text-xs text-emerald-400 font-medium">Control Panel</div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors group"
              >
                <span className="text-base w-5 text-center">{link.icon}</span>
                <span className="font-medium">{link.label}</span>
              </Link>
            ))}
          </nav>

          {/* Bottom: admin info + back link */}
          <div className="px-4 py-4 border-t border-gray-800 space-y-3">
            <div className="px-2">
              <div className="text-xs text-gray-500 mb-0.5">Logged in as</div>
              <div className="text-xs text-gray-300 truncate font-medium">{adminEmail}</div>
            </div>
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Back to App
            </Link>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </Providers>
  )
}
