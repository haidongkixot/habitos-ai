import Link from 'next/link'
import { headers } from 'next/headers'
import WizardRunner, { type WizardGoal } from '@/components/wizard/wizard-runner'

export const dynamic = 'force-dynamic'

async function fetchGoal(id: string): Promise<{
  goal: WizardGoal | null
  ok: boolean
  errorMessage: string | null
}> {
  try {
    const h = headers()
    const host = h.get('x-forwarded-host') ?? h.get('host')
    const proto = h.get('x-forwarded-proto') ?? 'https'
    if (!host) {
      return { goal: null, ok: false, errorMessage: 'Could not determine host.' }
    }
    const cookie = h.get('cookie') ?? ''
    const res = await fetch(`${proto}://${host}/api/goals/${id}`, {
      cache: 'no-store',
      headers: { cookie },
    })
    if (!res.ok) {
      return {
        goal: null,
        ok: false,
        errorMessage: `Goal API returned ${res.status}.`,
      }
    }
    const data = (await res.json()) as WizardGoal | { goal?: WizardGoal }
    const goal: WizardGoal | null =
      data && typeof data === 'object' && 'id' in data
        ? (data as WizardGoal)
        : ((data as { goal?: WizardGoal }).goal ?? null)
    return { goal, ok: true, errorMessage: null }
  } catch (e) {
    return {
      goal: null,
      ok: false,
      errorMessage: e instanceof Error ? e.message : 'Unknown error',
    }
  }
}

export default async function WizardPage({
  params,
}: {
  params: { id: string }
}) {
  const { goal, ok, errorMessage } = await fetchGoal(params.id)

  return (
    <div className="space-y-8">
      <nav aria-label="Breadcrumb" className="text-xs text-zinc-500">
        <ol className="flex items-center gap-2">
          <li>
            <Link href="/dashboard" className="hover:text-zinc-300">
              Dashboard
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/goals" className="hover:text-zinc-300">
              Goals
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href={`/goals/${params.id}`} className="hover:text-zinc-300">
              {goal?.title ?? 'Goal'}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-zinc-300">Wizard</li>
        </ol>
      </nav>

      {!ok || !goal ? (
        <div
          role="status"
          className="rounded-2xl border border-amber-400/30 bg-amber-500/10 backdrop-blur p-6 text-sm text-amber-100"
        >
          <p className="font-medium">Wizard is warming up</p>
          <p className="text-amber-200/80 mt-1">
            We couldn&apos;t load your goal yet
            {errorMessage ? ` (${errorMessage})` : ''}. Refresh once the backend is ready.
          </p>
          <div className="mt-4">
            <Link
              href={`/goals/${params.id}`}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-full border border-amber-400/40 bg-amber-500/20 text-amber-100 hover:bg-amber-500/30 transition-colors"
            >
              Back to goal
            </Link>
          </div>
        </div>
      ) : (
        <WizardRunner goal={goal} />
      )}
    </div>
  )
}
