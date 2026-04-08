import { headers } from 'next/headers'
import PersonaPickerClient from './persona-picker-client'
import type { Persona } from '@/components/coach/persona-picker'

export const dynamic = 'force-dynamic'

type PlanSlug = 'free' | 'starter' | 'pro' | 'premium'

type PersonasResponse = {
  personas?: Persona[]
  userPlanSlug?: PlanSlug
  userCurrentPersonaSlug?: string | null
}

async function fetchPersonas(): Promise<{
  data: PersonasResponse
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
    const res = await fetch(`${proto}://${host}/api/coach/personas`, {
      cache: 'no-store',
      headers: {
        cookie,
      },
    })
    if (!res.ok) {
      return {
        data: {},
        ok: false,
        errorMessage: `Coach personas API returned ${res.status}.`,
      }
    }
    const data = (await res.json()) as PersonasResponse
    return { data, ok: true, errorMessage: null }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return { data: {}, ok: false, errorMessage: msg }
  }
}

export default async function CoachPersonasPage() {
  const { data, ok, errorMessage } = await fetchPersonas()

  const personas: Persona[] = Array.isArray(data.personas) ? data.personas : []
  const userPlanSlug: PlanSlug = data.userPlanSlug ?? 'free'
  const currentPersonaSlug: string | null = data.userCurrentPersonaSlug ?? null

  return (
    <div className="space-y-6">
      <nav aria-label="Breadcrumb" className="text-xs text-zinc-500">
        <ol className="flex items-center gap-2">
          <li>
            <a href="/dashboard" className="hover:text-zinc-300 transition-colors">
              Dashboard
            </a>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <a href="/coach" className="hover:text-zinc-300 transition-colors">
              Coach
            </a>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-zinc-300">Personas</li>
        </ol>
      </nav>

      {!ok && (
        <div
          role="status"
          className="rounded-2xl border border-amber-400/30 bg-amber-500/10 backdrop-blur p-4 text-sm text-amber-100"
        >
          <p className="font-medium">Coach service is warming up</p>
          <p className="text-amber-200/80 mt-1">
            We couldn&apos;t reach the persona service yet
            {errorMessage ? ` (${errorMessage})` : ''}. The picker will populate as soon as the
            backend is ready &mdash; refresh in a moment.
          </p>
        </div>
      )}

      <PersonaPickerClient
        personas={personas}
        userPlanSlug={userPlanSlug}
        initialCurrentPersonaSlug={currentPersonaSlug}
      />
    </div>
  )
}
