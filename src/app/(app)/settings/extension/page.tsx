import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isExtensionEnabled } from '@/lib/extension-auth'
import ExtensionSettingsClient, { type PairedToken } from './extension-client'

export const dynamic = 'force-dynamic'

export default async function ExtensionSettingsPage() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) redirect('/login')

  const enabled = isExtensionEnabled()

  const [tokens, prefs] = await Promise.all([
    prisma.extensionToken.findMany({
      where: { userId, revokedAt: null },
      select: {
        id: true,
        extensionId: true,
        userAgent: true,
        issuedAt: true,
        expiresAt: true,
        lastUsedAt: true,
      },
      orderBy: { issuedAt: 'desc' },
    }),
    prisma.extensionPreferences.findUnique({ where: { userId } }),
  ])

  const paired: PairedToken[] = tokens.map((t) => ({
    id: t.id,
    extensionId: t.extensionId,
    userAgent: t.userAgent,
    issuedAt: t.issuedAt.toISOString(),
    expiresAt: t.expiresAt.toISOString(),
    lastUsedAt: t.lastUsedAt ? t.lastUsedAt.toISOString() : null,
  }))

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
          <li className="text-zinc-300">Browser extension</li>
        </ol>
      </nav>

      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-white tracking-tight">Browser extension</h1>
        <p className="text-sm text-zinc-400 max-w-2xl">
          Pair the HabitOS Chrome extension with your account so you can check off today&rsquo;s
          habits from any tab.
        </p>
      </header>

      {!enabled && (
        <div
          role="status"
          className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-100"
        >
          <p className="font-medium">Extension support is currently disabled</p>
          <p className="text-amber-200/80 mt-1">
            The server has <code>EXTENSION_ENABLED=false</code>. Pairing and sync will be
            unavailable until an admin re-enables it.
          </p>
        </div>
      )}

      <ExtensionSettingsClient
        initialPaired={paired}
        initialSyncCheckins={prefs?.syncCheckins ?? false}
        enabled={enabled}
      />

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 text-sm text-zinc-300 space-y-2">
        <h2 className="font-semibold text-white">Privacy summary</h2>
        <ul className="list-disc pl-5 space-y-1 text-zinc-400">
          <li>The extension only talks to HabitOS &mdash; no third-party servers.</li>
          <li>Sync is opt-in. With sync off, the extension never sends check-ins to your account.</li>
          <li>Tokens are short-lived (15 min access, 30 day refresh) and stored as hashes on our side.</li>
          <li>You can revoke any paired extension here at any time; it stops working immediately.</li>
        </ul>
      </section>
    </div>
  )
}
