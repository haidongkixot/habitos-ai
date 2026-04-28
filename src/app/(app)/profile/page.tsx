import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ProfileClient, { type ProfileSnapshot } from './profile-client'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    redirect('/login?callbackUrl=/profile')
  }

  const userId = (session.user as { id?: string }).id
  if (!userId) {
    redirect('/login?callbackUrl=/profile')
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      createdAt: true,
      password: true,
      accounts: {
        select: { id: true, provider: true, providerAccountId: true },
      },
    },
  })

  if (!user) {
    redirect('/login?callbackUrl=/profile')
  }

  const activeSub = await prisma.subscription.findFirst({
    where: { userId, status: 'active' },
    orderBy: { currentPeriodEnd: 'desc' },
    include: { plan: true },
  })

  const snapshot: ProfileSnapshot = {
    id: user.id,
    name: user.name ?? '',
    email: user.email,
    hasPassword: Boolean(user.password),
    createdAt: user.createdAt.toISOString(),
    accounts: user.accounts.map((a) => ({
      id: a.id,
      provider: a.provider,
      providerAccountId: a.providerAccountId,
    })),
    plan: activeSub
      ? {
          name: activeSub.plan.name,
          slug: activeSub.plan.slug,
          status: activeSub.status,
          currentPeriodEnd: activeSub.currentPeriodEnd.toISOString(),
        }
      : null,
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
          <li>
            <Link href="/settings" className="hover:text-zinc-300 transition-colors">
              Settings
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-zinc-300">Profile</li>
        </ol>
      </nav>

      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-white tracking-tight">Profile</h1>
        <p className="text-sm text-zinc-400 max-w-2xl">
          Manage how you appear in HabitOS, change your password, and review connected
          accounts.
        </p>
      </header>

      <ProfileClient initial={snapshot} />
    </div>
  )
}
