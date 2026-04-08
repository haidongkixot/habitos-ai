import Link from 'next/link'
import { headers } from 'next/headers'
import RemindersClient from './reminders-client'
import type { ReminderItem } from '@/components/reminders/reminder-row'

export const dynamic = 'force-dynamic'

type RemindersResponse = {
  reminders?: ReminderItem[]
  items?: ReminderItem[]
}

async function fetchReminders(): Promise<{
  reminders: ReminderItem[]
  ok: boolean
  errorMessage: string | null
}> {
  try {
    const h = headers()
    const host = h.get('x-forwarded-host') ?? h.get('host')
    const proto = h.get('x-forwarded-proto') ?? 'https'
    if (!host) {
      return { reminders: [], ok: false, errorMessage: 'Could not determine host.' }
    }
    const cookie = h.get('cookie') ?? ''
    const res = await fetch(`${proto}://${host}/api/reminders`, {
      cache: 'no-store',
      headers: { cookie },
    })
    if (!res.ok) {
      return {
        reminders: [],
        ok: false,
        errorMessage: `Reminders API returned ${res.status}.`,
      }
    }
    const data = (await res.json()) as RemindersResponse | ReminderItem[]
    const reminders: ReminderItem[] = Array.isArray(data)
      ? data
      : Array.isArray(data.reminders)
        ? data.reminders
        : Array.isArray(data.items)
          ? data.items
          : []
    return { reminders, ok: true, errorMessage: null }
  } catch (e) {
    return {
      reminders: [],
      ok: false,
      errorMessage: e instanceof Error ? e.message : 'Unknown error',
    }
  }
}

export default async function RemindersPage() {
  const { reminders, ok, errorMessage } = await fetchReminders()

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
          <li className="text-zinc-300">Reminders</li>
        </ol>
      </nav>

      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-white tracking-tight">Reminders</h1>
          <p className="text-sm text-zinc-400">
            See what your coach has lined up and cancel anything you don&apos;t need.
          </p>
        </div>
      </header>

      {!ok && (
        <div
          role="status"
          className="rounded-2xl border border-amber-400/30 bg-amber-500/10 backdrop-blur p-4 text-sm text-amber-100"
        >
          <p className="font-medium">Reminders service is warming up</p>
          <p className="text-amber-200/80 mt-1">
            We couldn&apos;t load your reminders yet
            {errorMessage ? ` (${errorMessage})` : ''}. Refresh in a moment.
          </p>
        </div>
      )}

      <RemindersClient initial={reminders} />
    </div>
  )
}
