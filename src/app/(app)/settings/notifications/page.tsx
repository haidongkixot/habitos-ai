import Link from 'next/link'
import { headers } from 'next/headers'
import NotificationPreferencesForm, {
  type NotificationPreferences,
} from './notification-preferences-form'

export const dynamic = 'force-dynamic'

type PreferencesResponse = Partial<NotificationPreferences> & {
  preferences?: Partial<NotificationPreferences>
}

async function fetchPreferences(): Promise<{
  data: Partial<NotificationPreferences>
  ok: boolean
  errorMessage: string | null
}> {
  try {
    const h = headers()
    const host = h.get('x-forwarded-host') ?? h.get('host')
    const proto = h.get('x-forwarded-proto') ?? 'https'
    if (!host) {
      return {
        data: {},
        ok: false,
        errorMessage: 'Could not determine host for internal API call.',
      }
    }
    const cookie = h.get('cookie') ?? ''
    const res = await fetch(`${proto}://${host}/api/notifications/preferences`, {
      cache: 'no-store',
      headers: { cookie },
    })
    if (!res.ok) {
      return {
        data: {},
        ok: false,
        errorMessage: `Preferences API returned ${res.status}.`,
      }
    }
    const json = (await res.json()) as PreferencesResponse
    const data: Partial<NotificationPreferences> =
      json && typeof json === 'object' && 'preferences' in json && json.preferences
        ? (json.preferences as Partial<NotificationPreferences>)
        : (json as Partial<NotificationPreferences>)
    return { data, ok: true, errorMessage: null }
  } catch (e) {
    return {
      data: {},
      ok: false,
      errorMessage: e instanceof Error ? e.message : 'Unknown error',
    }
  }
}

export default async function NotificationSettingsPage() {
  const { data, ok, errorMessage } = await fetchPreferences()

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
          <li className="text-zinc-300">Notifications</li>
        </ol>
      </nav>

      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-white tracking-tight">Notification preferences</h1>
        <p className="text-sm text-zinc-400 max-w-2xl">
          Control how HabitOS reaches you. Your coach will respect quiet hours and only send
          reminders you&apos;ve opted into.
        </p>
      </header>

      {!ok && (
        <div
          role="status"
          className="rounded-2xl border border-amber-400/30 bg-amber-500/10 backdrop-blur p-4 text-sm text-amber-100"
        >
          <p className="font-medium">Notification service is warming up</p>
          <p className="text-amber-200/80 mt-1">
            We couldn&apos;t load your preferences yet
            {errorMessage ? ` (${errorMessage})` : ''}. Your defaults are shown below &mdash;
            saving will retry as soon as the backend is ready.
          </p>
        </div>
      )}

      <NotificationPreferencesForm initial={data} />
    </div>
  )
}
