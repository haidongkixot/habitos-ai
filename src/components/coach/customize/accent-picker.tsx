'use client'

/**
 * HabitOS M6 — Accent picker.
 *
 * Premium-gated per DEC-008 (UserCoachSettings.accent — closest to "voice").
 * Pure presentational radio cards with flag emoji + label.
 *
 * Default options mirror the schema comment on prisma/schema.prisma:699.
 */

export interface AccentOption {
  slug: string
  label: string
  flag?: string
}

export interface AccentPickerProps {
  value: string | null
  onChange: (v: string) => void
  disabled?: boolean
  options?: AccentOption[]
  className?: string
}

export const DEFAULT_ACCENTS: AccentOption[] = [
  { slug: 'us', label: 'American', flag: '🇺🇸' },
  { slug: 'uk', label: 'British', flag: '🇬🇧' },
  { slug: 'aus', label: 'Australian', flag: '🇦🇺' },
  { slug: 'ind', label: 'Indian', flag: '🇮🇳' },
  { slug: 'generic', label: 'Neutral', flag: '🌐' },
]

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12.5l4.5 4.5L19 7" />
    </svg>
  )
}

export function AccentPicker({
  value,
  onChange,
  disabled = false,
  options = DEFAULT_ACCENTS,
  className = '',
}: AccentPickerProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Coach accent"
      aria-disabled={disabled}
      className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 ${className}`}
    >
      {options.map((opt) => {
        const selected = value === opt.slug
        return (
          <button
            key={opt.slug}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={`Accent: ${opt.label}`}
            disabled={disabled}
            onClick={() => onChange(opt.slug)}
            className={`group relative flex items-center gap-3 rounded-2xl border bg-white/5 backdrop-blur p-3 text-left transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 ${
              selected
                ? 'border-amber-400/60 shadow-[0_0_22px_rgba(245,158,11,0.2)]'
                : 'border-white/10 hover:border-white/20 hover:-translate-y-0.5'
            } ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
          >
            <span className="text-2xl leading-none" aria-hidden="true">
              {opt.flag ?? '🌐'}
            </span>
            <span className="flex-1 min-w-0">
              <span
                className={`block text-sm font-medium truncate ${
                  selected ? 'text-amber-100' : 'text-zinc-200'
                }`}
              >
                {opt.label}
              </span>
              <span className="block text-[10px] uppercase tracking-wider text-zinc-500">
                {opt.slug}
              </span>
            </span>
            {selected && (
              <span
                className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/90 text-zinc-900 shrink-0"
                aria-hidden="true"
              >
                <CheckIcon className="w-3 h-3" />
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export default AccentPicker
