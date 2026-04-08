/**
 * HabitOS M6 — Settings / Billing (server shell).
 *
 * Authenticated shell that fetches GET /api/billing/current and hands it
 * to the client for rendering. The client owns the portal + upgrade CTAs
 * and any refresh-on-focus logic.
 */

import Link from 'next/link'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import BillingClient, {
  type BillingCurrentSnapshot,
} from './billing-client'

export const dynamic = 'force-dynamic'

async function fetchBillingCurrent(): Promise<{
  data: BillingCurrentSnapshot | null
  ok: boolean
  errorMessage: string | null
}> {
  try {
    const h = headers()
    const host = h.get('x-forwarded-host') ?? h.get('host')
    const proto = h.get('x-forwarded-proto') ?? 'https'
    if (!host) {
      return {
        data: null,
        ok: false,
        errorMessage: 'Could not determine host for internal API call.',
      }
    }
    const cookie = h.get('cookie') ?? ''
    const res = await fetch(`${proto}://${host}/api/billing/current`, {
      cache: 'no-store',
      headers: { cookie },
    })
    if (!res.ok) {
      return {
        data: null,
        ok: false,
        errorMessage: `Billing API returned ${res.status}.`,
      }
    }
    const data = (await res.json()) as BillingCurrentSnapshot
    return { data, ok: true, errorMessage: null }
  } catch (e) {
    return {
      data: null,
      ok: false,
      errorMessage: e instanceof Error ? e.message : 'Unknown error',
    }
  }
}

export default async function BillingSettingsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    redirect('/login?callbackUrl=/settings/billing')
  }

  const { data, ok, errorMessage } = await fetchBillingCurrent()

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
            <Link href="/settings/notifications" className="hover:text-zinc-300 transition-colors">
              Settings
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-zinc-300">Billing</li>
        </ol>
      </nav>

      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Billing &amp; subscription
        </h1>
        <p className="text-sm text-zinc-400 max-w-2xl">
          Manage your HabitOS plan, update payment details, and download
          invoices. Your subscription renews automatically each period.
        </p>
      </header>

      {!ok && (
        <div
          role="status"
          className="rounded-2xl border border-amber-400/30 bg-amber-500/10 backdrop-blur p-4 text-sm text-amber-100"
        >
          <p className="font-medium">Billing service is warming up</p>
          <p className="text-amber-200/80 mt-1">
            We couldn&apos;t load your subscription yet
            {errorMessage ? ` (${errorMessage})` : ''}. Defaults are shown
            below &mdash; refresh in a moment.
          </p>
        </div>
      )}

      <BillingClient initial={data} />
    </div>
  )
}
