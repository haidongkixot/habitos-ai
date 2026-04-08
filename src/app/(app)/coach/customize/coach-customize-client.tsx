'use client'

/**
 * HabitOS M6 — Coach customize client form.
 *
 * Backed by PUT /api/coach/settings (existing M2 endpoint — body shape:
 * { personaId?, customName?, customGender?, outfitPack?, accent?,
 *   relationshipStyle?, customSystemAdd? }). The backend enforces
 * Premium-only on outfitPack + accent per DEC-008. We mirror that in the
 * UI: non-premium users see a locked card instead of the inputs.
 *
 * Designer primitives (outfit-pack-picker, accent-picker) land in
 * parallel; we lazy-import them via inline stubs so tsc stays clean.
 */

import { useState } from 'react'
import Link from 'next/link'
import PremiumBadge from '@/components/billing/premium-badge'

// ---------- Types ----------
export interface CoachSettingsInitial {
  personaId: string | null
  customName: string
  customGender: string
  outfitPack: string
  accent: string
  relationshipStyle: string
  customSystemAdd: string
}

type TierSlug = 'free' | 'starter' | 'pro' | 'premium'

interface Props {
  initial: CoachSettingsInitial
  tierSlug: TierSlug
  canCustomizeCoach: boolean
}

interface SettingsPutResponse {
  settings?: unknown
  error?: string
}

// ---------- Constant options ----------
const GENDER_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '', label: 'Persona default' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'nonbinary', label: 'Non-binary' },
]

const RELATIONSHIP_STYLES: Array<{ value: string; label: string; hint: string }> = [
  { value: '', label: 'Persona default', hint: 'Keep the persona as-is' },
  { value: 'mentor', label: 'Mentor', hint: 'Warm, experienced, patient' },
  { value: 'friend', label: 'Friend', hint: 'Casual, encouraging, peer-like' },
  { value: 'therapist', label: 'Therapist', hint: 'Reflective, gentle, probing' },
  {
    value: 'drill_sergeant',
    label: 'Drill Sergeant',
    hint: 'Tough, direct, no-nonsense',
  },
]

const OUTFIT_PACKS: Array<{ value: string; label: string }> = [
  { value: '', label: 'Default' },
  { value: 'casual', label: 'Casual' },
  { value: 'athletic', label: 'Athletic' },
  { value: 'formal', label: 'Formal' },
  { value: 'cozy', label: 'Cozy' },
  { value: 'retro', label: 'Retro' },
]

const ACCENTS: Array<{ value: string; label: string }> = [
  { value: '', label: 'Default' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'british', label: 'British' },
  { value: 'australian', label: 'Australian' },
  { value: 'southern_us', label: 'Southern US' },
  { value: 'irish', label: 'Irish' },
]

const MAX_CUSTOM_SYSTEM_ADD = 500

// ---------- Inline stub: OutfitPackPicker ----------
// TODO: replace with `import { OutfitPackPicker } from '@/components/coach/customize/outfit-pack-picker'`
function OutfitPackPickerStub({
  value,
  onChange,
  disabled,
}: {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {OUTFIT_PACKS.map((opt) => {
        const selected = value === opt.value
        return (
          <button
            key={opt.value || 'default'}
            type="button"
            onClick={() => onChange(opt.value)}
            disabled={disabled}
            className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
              selected
                ? 'border-amber-400/60 bg-amber-500/15 text-amber-100'
                : 'border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

// ---------- Inline stub: AccentPicker ----------
// TODO: replace with `import { AccentPicker } from '@/components/coach/customize/accent-picker'`
function AccentPickerStub({
  value,
  onChange,
  disabled,
}: {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {ACCENTS.map((opt) => {
        const selected = value === opt.value
        return (
          <button
            key={opt.value || 'default'}
            type="button"
            onClick={() => onChange(opt.value)}
            disabled={disabled}
            className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
              selected
                ? 'border-amber-400/60 bg-amber-500/15 text-amber-100'
                : 'border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

// ---------- Main form ----------
export default function CoachCustomizeClient({
  initial,
  tierSlug,
  canCustomizeCoach,
}: Props) {
  const [form, setForm] = useState<CoachSettingsInitial>(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successAt, setSuccessAt] = useState<number | null>(null)

  const setField = <K extends keyof CoachSettingsInitial>(
    key: K,
    value: CoachSettingsInitial[K]
  ) => {
    setForm((f) => ({ ...f, [key]: value }))
    setSuccessAt(null)
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccessAt(null)
    try {
      // Build payload. Send null for empty-string fields so the server can
      // clear them; never send premium-only fields if the user is not
      // premium (backend would reject anyway — belt + suspenders).
      const body: Record<string, string | null> = {
        customName: form.customName.trim() || null,
        customGender: form.customGender || null,
        relationshipStyle: form.relationshipStyle || null,
        customSystemAdd: form.customSystemAdd.trim() || null,
      }
      if (form.personaId) body.personaId = form.personaId
      if (canCustomizeCoach) {
        body.outfitPack = form.outfitPack || null
        body.accent = form.accent || null
      }

      const res = await fetch('/api/coach/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        let message = `Save failed (${res.status})`
        try {
          const json = (await res.json()) as SettingsPutResponse
          if (json?.error) message = json.error
        } catch {
          // ignore
        }
        throw new Error(message)
      }
      setSuccessAt(Date.now())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save changes')
    } finally {
      setSaving(false)
    }
  }

  const charCount = form.customSystemAdd.length
  const charsOver = charCount > MAX_CUSTOM_SYSTEM_ADD

  return (
    <div className="space-y-6">
      {/* Section 1: Persona link */}
      <section className="rounded-2xl border border-white/[0.06] bg-[#1c1c22]/60 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-white">Coach persona</h2>
            <p className="text-xs text-zinc-400 mt-1 max-w-md">
              The character archetype that shapes your coach&apos;s voice and
              style. Pick one from our persona library.
            </p>
          </div>
          <Link
            href="/coach/personas"
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/10 transition-colors"
          >
            Choose persona
          </Link>
        </div>
      </section>

      {/* Section 2: Custom name */}
      <section className="rounded-2xl border border-white/[0.06] bg-[#1c1c22]/60 p-5">
        <label htmlFor="customName" className="block">
          <span className="text-sm font-semibold text-white">Custom name</span>
          <span className="block text-xs text-zinc-400 mt-1">
            What should your coach call themselves? Leave blank to use the
            persona&apos;s default name.
          </span>
        </label>
        <input
          id="customName"
          type="text"
          maxLength={40}
          placeholder="e.g. Alex, Coach M, Sam"
          value={form.customName}
          onChange={(e) => setField('customName', e.target.value)}
          disabled={saving}
          className="mt-3 w-full px-3 py-2 rounded-lg bg-[#0c0c0f]/80 border border-white/10 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/60 disabled:opacity-50"
        />
      </section>

      {/* Section 3: Gender */}
      <section className="rounded-2xl border border-white/[0.06] bg-[#1c1c22]/60 p-5">
        <label htmlFor="customGender" className="block">
          <span className="text-sm font-semibold text-white">Gender presentation</span>
          <span className="block text-xs text-zinc-400 mt-1">
            How your coach presents. This only affects visual styling and
            pronouns &mdash; not the underlying persona.
          </span>
        </label>
        <select
          id="customGender"
          value={form.customGender}
          onChange={(e) => setField('customGender', e.target.value)}
          disabled={saving}
          className="mt-3 w-full px-3 py-2 rounded-lg bg-[#0c0c0f]/80 border border-white/10 text-sm text-white focus:outline-none focus:border-amber-500/60 disabled:opacity-50"
        >
          {GENDER_OPTIONS.map((opt) => (
            <option key={opt.value || 'default'} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </section>

      {/* Section 4: Relationship style */}
      <section className="rounded-2xl border border-white/[0.06] bg-[#1c1c22]/60 p-5">
        <div>
          <span className="text-sm font-semibold text-white">Relationship style</span>
          <span className="block text-xs text-zinc-400 mt-1">
            How your coach talks to you. You can change this any time.
          </span>
        </div>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {RELATIONSHIP_STYLES.map((opt) => {
            const selected = form.relationshipStyle === opt.value
            return (
              <button
                key={opt.value || 'default'}
                type="button"
                onClick={() => setField('relationshipStyle', opt.value)}
                disabled={saving}
                className={`text-left px-4 py-3 rounded-xl border transition-all ${
                  selected
                    ? 'border-amber-400/60 bg-amber-500/10'
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <div className="text-sm font-semibold text-white">
                  {opt.label}
                </div>
                <div className="text-[11px] text-zinc-400 mt-0.5">{opt.hint}</div>
              </button>
            )
          })}
        </div>
      </section>

      {/* Section 5: Custom system prompt addition */}
      <section className="rounded-2xl border border-white/[0.06] bg-[#1c1c22]/60 p-5">
        <label htmlFor="customSystemAdd" className="block">
          <span className="text-sm font-semibold text-white">
            Extra instructions for your coach
          </span>
          <span className="block text-xs text-zinc-400 mt-1">
            Add personal context (goals, constraints, preferences). Your coach
            will remember this every session. Max {MAX_CUSTOM_SYSTEM_ADD} characters.
          </span>
        </label>
        <textarea
          id="customSystemAdd"
          rows={4}
          maxLength={MAX_CUSTOM_SYSTEM_ADD + 50}
          value={form.customSystemAdd}
          onChange={(e) => setField('customSystemAdd', e.target.value)}
          disabled={saving}
          placeholder="e.g. I work shift nights — schedule habits around 7pm–3am. Please avoid caffeine suggestions after 6pm."
          className="mt-3 w-full px-3 py-2 rounded-lg bg-[#0c0c0f]/80 border border-white/10 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/60 disabled:opacity-50 resize-none"
        />
        <div
          className={`mt-1 text-[11px] text-right ${
            charsOver ? 'text-rose-400' : 'text-zinc-500'
          }`}
        >
          {charCount} / {MAX_CUSTOM_SYSTEM_ADD}
        </div>
      </section>

      {/* Section 6: Premium-only outfit + accent */}
      {canCustomizeCoach ? (
        <section className="rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-500/[0.06] via-transparent to-rose-500/[0.04] p-5 space-y-5">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-white">
              Appearance &amp; voice
            </h2>
            <PremiumBadge size="sm" />
          </div>

          <div>
            <div className="text-sm font-medium text-zinc-200 mb-2">
              Outfit pack
            </div>
            <OutfitPackPickerStub
              value={form.outfitPack}
              onChange={(v) => setField('outfitPack', v)}
              disabled={saving}
            />
          </div>

          <div>
            <div className="text-sm font-medium text-zinc-200 mb-2">
              Accent
            </div>
            <AccentPickerStub
              value={form.accent}
              onChange={(v) => setField('accent', v)}
              disabled={saving}
            />
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-500/[0.06] via-transparent to-rose-500/[0.04] p-6">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-base font-semibold text-white">
              Appearance &amp; voice
            </h2>
            <PremiumBadge size="sm" />
          </div>
          <p className="text-sm text-zinc-300 max-w-md">
            Dress your coach in custom outfit packs and switch their accent
            to match your vibe. Available on the Premium tier.
          </p>
          <p className="text-xs text-zinc-500 mt-1">
            Your current plan:{' '}
            <span className="text-zinc-300 capitalize">{tierSlug}</span>
          </p>
          <div className="mt-4">
            <Link
              href="/pricing?upgrade=customize"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-[#0c0c0f] transition-colors"
            >
              Upgrade to Premium
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </section>
      )}

      {/* Save bar */}
      <div className="sticky bottom-4 z-10">
        <div className="rounded-2xl border border-white/10 bg-[#16161a]/90 backdrop-blur-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-xs text-zinc-400">
            {error ? (
              <span className="text-rose-300">{error}</span>
            ) : successAt ? (
              <span className="text-emerald-300">Saved. Your coach has been updated.</span>
            ) : (
              <span>Changes are saved to your profile.</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {error && (
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || charsOver}
                className="px-3 py-2 rounded-lg text-xs font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 transition-colors disabled:opacity-50"
              >
                Retry
              </button>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || charsOver}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-[#0c0c0f] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              aria-busy={saving}
            >
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
