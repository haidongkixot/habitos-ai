import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const TILES: Array<{
  href: string
  title: string
  description: string
  icon: string
}> = [
  {
    href: '/profile',
    title: 'Profile',
    description: 'Display name, password, connected accounts, and account deletion.',
    icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  },
  {
    href: '/settings/notifications',
    title: 'Notifications',
    description: 'Channels, quiet hours, and reminder preferences.',
    icon: 'M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0a3 3 0 11-6 0',
  },
  {
    href: '/settings/billing',
    title: 'Billing',
    description: 'Plan, payment method, and invoices via Stripe or PayPal.',
    icon: 'M3 10h18M5 6h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z',
  },
  {
    href: '/settings/referral',
    title: 'Referral',
    description: 'Share HabitOS and earn rewards when friends sign up.',
    icon: 'M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-3.13a4 4 0 11-8 0 4 4 0 018 0zm6 3a3 3 0 100-6 3 3 0 000 6z',
  },
  {
    href: '/settings/extension',
    title: 'Extension',
    description: 'Pair the Chrome extension and manage device tokens.',
    icon: 'M9 3v18m6-18v18M3 9h18M3 15h18',
  },
]

export default async function SettingsIndexPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    redirect('/login?callbackUrl=/settings')
  }

  return (
    <div className="space-y-6">
      <nav aria-label="Breadcrumb" className="text-xs text-zinc-500">
        <ol className="flex items-center gap-2">
          <li>
            <Link href="/dashboard" className="hover:text-zinc-300 transition-colors">
              Dashboard
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-zinc-300">Settings</li>
        </ol>
      </nav>

      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-white tracking-tight">Settings</h1>
        <p className="text-sm text-zinc-400 max-w-2xl">
          Manage your account, plan, and how HabitOS communicates with you.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {TILES.map((tile) => (
          <Link
            key={tile.href}
            href={tile.href}
            className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-emerald-500/30 transition-all p-5 backdrop-blur"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:text-emerald-300">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tile.icon} />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors">
                  {tile.title}
                </h2>
                <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{tile.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
