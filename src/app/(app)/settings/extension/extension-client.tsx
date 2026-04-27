'use client'

import { useEffect, useState } from 'react'

export type PairedToken = {
  id: string
  extensionId: string
  userAgent: string | null
  issuedAt: string
  expiresAt: string
  lastUsedAt: string | null
}

type Props = {
  initialPaired: PairedToken[]
  initialSyncCheckins: boolean
  enabled: boolean
}

export default function ExtensionSettingsClient({
  initialPaired,
  initialSyncCheckins,
  enabled,
}: Props) {
  const [paired, setPaired] = useState<PairedToken[]>(initialPaired)
  const [code, setCode] = useState<string | null>(null)
  const [codeExpiresAt, setCodeExpiresAt] = useState<number | null>(null)
  const [secondsLeft, setSecondsLeft] = useState<number>(0)
  const [genLoading, setGenLoading] = useState(false)
  const [syncCheckins, setSyncCheckins] = useState<boolean>(initialSyncCheckins)
  const [syncSaving, setSyncSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!codeExpiresAt) return
    const tick = () => {
      const left = Math.max(0, Math.ceil((codeExpiresAt - Date.now()) / 1000))
      setSecondsLeft(left)
      if (left <= 0) {
        setCode(null)
        setCodeExpiresAt(null)
      }
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [codeExpiresAt])

  async function generateCode() {
    setError(null)
    setGenLoading(true)
    try {
      const res = await fetch('/api/extension/pair', { method: 'POST' })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || `HTTP ${res.status}`)
      }
      const j = (await res.json()) as { code: string; expiresInSeconds: number }
      setCode(j.code)
      setCodeExpiresAt(Date.now() + j.expiresInSeconds * 1000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate code')
    } finally {
      setGenLoading(false)
    }
  }

  async function revoke(id: string) {
    setError(null)
    // Optimistic update.
    const prev = paired
    setPaired((cur: PairedToken[]) => cur.filter((p: PairedToken) => p.id !== id))
    try {
      const res = await fetch(`/api/settings/extension/revoke?id=${encodeURIComponent(id)}`, {
        method: 'POST',
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || `HTTP ${res.status}`)
      }
    } catch (e) {
      setPaired(prev)
      setError(e instanceof Error ? e.message : 'Failed to revoke')
    }
  }

  async function toggleSync(next: boolean) {
    setError(null)
    setSyncSaving(true)
    setSyncCheckins(next)
    try {
      const res = await fetch('/api/settings/extension/preferences', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ syncCheckins: next }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || `HTTP ${res.status}`)
      }
    } catch (e) {
      setSyncCheckins(!next)
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSyncSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-4">
        <div>
          <h2 className="font-semibold text-white">Pair an extension</h2>
          <p className="text-sm text-zinc-400 mt-1">
            Click <strong>Generate Code</strong>, open the HabitOS extension, and paste the 6-digit
            code. Codes expire in 2 minutes.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={generateCode}
            disabled={!enabled || genLoading}
            className="rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-700 disabled:text-zinc-400 text-zinc-900 font-medium text-sm px-4 py-2 transition-colors"
          >
            {genLoading ? 'Generating…' : 'Generate Code'}
          </button>
          {code && (
            <div className="flex items-center gap-3">
              <span
                className="font-mono text-2xl tracking-[0.4em] text-emerald-300 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5"
                aria-label="Pairing code"
              >
                {code}
              </span>
              <span className="text-xs text-zinc-500" aria-live="polite">
                Expires in {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}
              </span>
            </div>
          )}
        </div>
        {error && (
          <p className="text-sm text-red-400" role="alert">
            {error}
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-4">
        <div>
          <h2 className="font-semibold text-white">Paired extensions</h2>
          <p className="text-sm text-zinc-400 mt-1">
            Each row is one browser profile that has paired with your account.
          </p>
        </div>
        {paired.length === 0 ? (
          <p className="text-sm text-zinc-500">No paired extensions yet.</p>
        ) : (
          <ul className="divide-y divide-zinc-800">
            {paired.map((p) => (
              <li key={p.id} className="py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm text-zinc-200 truncate" title={p.extensionId}>
                    {p.userAgent || 'Unknown browser'}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Paired {new Date(p.issuedAt).toLocaleString()}
                    {p.lastUsedAt
                      ? ` · last used ${new Date(p.lastUsedAt).toLocaleString()}`
                      : ' · never used'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => revoke(p.id)}
                  className="rounded-lg border border-red-500/40 text-red-300 hover:bg-red-500/10 text-xs font-medium px-3 py-1.5 transition-colors"
                >
                  Revoke
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-semibold text-white">Sync check-ins from extension</h2>
            <p className="text-sm text-zinc-400 mt-1">
              When ON, check-ins you make in the extension are saved to your HabitOS account. When
              OFF, the extension can still show your habits but check-ins stay local.
            </p>
          </div>
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={syncCheckins}
              disabled={syncSaving}
              onChange={(e) => toggleSync(e.target.checked)}
            />
            <span className="relative w-11 h-6 bg-zinc-700 rounded-full peer-checked:bg-emerald-500 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-transform peer-checked:after:translate-x-5" />
          </label>
        </div>
      </section>
    </div>
  )
}
