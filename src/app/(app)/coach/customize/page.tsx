/**
 * HabitOS M6 — Coach Customize page (server shell).
 *
 * Premium-gated per DEC-008. This shell:
 *   1. Requires an authenticated session (redirects to /login).
 *   2. Fetches GET /api/billing/current.
 *   3. If !canEditBasicCoachFields (Free tier), redirects to
 *      /pricing?upgrade=customize so the upsell path is explicit.
 *   4. Otherwise renders the client form, passing the entitlement flags
 *      so the UI can gate the Premium-only outfit/accent section.
 *
 * Actual form state + PUT /api/coach/settings lives in
 * coach-customize-client.tsx. Persona picker itself continues to live at
 * /coach/personas — we link to it rather than re-render it here.
 */

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import CoachCustomizeClient, {
  type CoachSettingsInitial,
} from './coach-customize-client'

export const dynamic = 'force-dynamic'

type TierSlug = 'free' | 'starter' | 'pro' | 'premium'

interface BillingCurrentResponse {
  tier?: { slug?: TierSlug; name?: string }
  subscription?: {
    id: string
    status: string
    currentPeriodEnd: string | null
    cancelAtPeriodEnd: boolean
    stripeSubId: string
  } | null
  canCustomizeCoach?: boolean
  canEditBasicCoachFields?: boolean
}

interface CoachSettingsResponse {
  settings?: {
    personaId?: string | null
    customName?: string | null
    customGender?: string | null
    outfitPack?: string | null
    accent?: string | null
    relationshipStyle?: string | null
    customSystemAdd?: string | null
  } | null
}

async function fetchJsonWithCookies<T>(
  path: string
): Promise<{ data: T | null; ok: boolean; errorMessage: string | null }> {
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
    const res = await fetch(`${proto}://${host}${path}`, {
      cache: 'no-store',
      headers: { cookie },
    })
    if (!res.ok) {
      return {
        data: null,
        ok: false,
        errorMessage: `${path} returned ${res.status}.`,
      }
    }
    const data = (await res.json()) as T
    return { data, ok: true, errorMessage: null }
  } catch (e) {
    return {
      data: null,
      ok: false,
      errorMessage: e instanceof Error ? e.message : 'Unknown error',
    }
  }
}

export default async function CoachCustomizePage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    redirect('/login?callbackUrl=/coach/customize')
  }

  const { data: billing, ok: billingOk, errorMessage: billingError } =
    await fetchJsonWithCookies<BillingCurrentResponse>('/api/billing/current')

  // Graceful degrade: if /api/billing/current is not ready yet, we do NOT
  // redirect away — we render a warning banner and assume "free" gating
  // (locks Premium section but still shows basic fields so the UI is not
  // hostile during parallel dev). The server API will still reject any
  // write that exceeds the user's real entitlement.
  const tierSlug: TierSlug = (billing?.tier?.slug ?? 'free') as TierSlug
  const canEditBasicCoachFields = billing?.canEditBasicCoachFields ?? false
  const canCustomizeCoach = billing?.canCustomizeCoach ?? false

  // Hard redirect for confirmed Free users (backend contract clean).
  if (billingOk && !canEditBasicCoachFields) {
    redirect('/pricing?upgrade=customize')
  }

  const { data: settings } = await fetchJsonWithCookies<CoachSettingsResponse>(
    '/api/coach/settings'
  )

  const initial: CoachSettingsInitial = {
    personaId: settings?.settings?.personaId ?? null,
    customName: settings?.settings?.customName ?? '',
    customGender: settings?.settings?.customGender ?? '',
    outfitPack: settings?.settings?.outfitPack ?? '',
    accent: settings?.settings?.accent ?? '',
    relationshipStyle: settings?.settings?.relationshipStyle ?? '',
    customSystemAdd: settings?.settings?.customSystemAdd ?? '',
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
            <Link href="/coach/personas" className="hover:text-zinc-300 transition-colors">
              Coach
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-zinc-300">Customize</li>
        </ol>
      </nav>

      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Customize your coach
        </h1>
        <p className="text-sm text-zinc-400 max-w-2xl">
          Fine-tune how your AI coach shows up for you &mdash; their name,
          tone, and style. Premium members can dress them in custom outfits
          and switch accents.
        </p>
      </header>

      {!billingOk && (
        <div
          role="status"
          className="rounded-2xl border border-amber-400/30 bg-amber-500/10 backdrop-blur p-4 text-sm text-amber-100"
        >
          <p className="font-medium">Billing service is warming up</p>
          <p className="text-amber-200/80 mt-1">
            We couldn&apos;t confirm your plan yet
            {billingError ? ` (${billingError})` : ''}. Premium features are
            locked until we can verify &mdash; refresh in a moment.
          </p>
        </div>
      )}

      <CoachCustomizeClient
        initial={initial}
        tierSlug={tierSlug}
        canCustomizeCoach={canCustomizeCoach}
      />
    </div>
  )
}
