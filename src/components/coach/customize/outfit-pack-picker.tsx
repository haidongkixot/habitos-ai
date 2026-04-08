'use client'

/**
 * HabitOS M6 — Outfit pack picker.
 *
 * Premium-gated per DEC-008 (UserCoachSettings.outfitPack). Pure presentational
 * grid of emoji + label cards. Builder owns the wrapping <LockedFeatureCard>
 * when the user isn't on Premium — this picker just renders `disabled` cards
 * when told to.
 *
 * Default options mirror the schema comment on prisma/schema.prisma:698.
 */

export interface OutfitPackOption {
  slug: string
  label: string
  emoji?: string
}

export interface OutfitPackPickerProps {
  value: string | null
  onChange: (v: string) => void
  disabled?: boolean
  options?: OutfitPackOption[]
  className?: string
}

export const DEFAULT_OUTFIT_PACKS: OutfitPackOption[] = [
  { slug: 'athletic', label: 'Athletic', emoji: '🏃' },
  { slug: 'business', label: 'Business', emoji: '💼' },
  { slug: 'casual', label: 'Casual', emoji: '👕' },
  { slug: 'zen_robe', label: 'Zen Robe', emoji: '🧘' },
  { slug: 'lab_coat', label: 'Lab Coat', emoji: '🥼' },
  { slug: 'streetwear', label: 'Streetwear', emoji: '🧢' },
  { slug: 'formal', label: 'Formal', emoji: '🎩' },
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

export function OutfitPackPicker({
  value,
  onChange,
  disabled = false,
  options = DEFAULT_OUTFIT_PACKS,
  className = '',
}: OutfitPackPickerProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Coach outfit pack"
      aria-disabled={disabled}
      className={`grid grid-cols-3 sm:grid-cols-4 gap-3 ${className}`}
    >
      {options.map((opt) => {
        const selected = value === opt.slug
        return (
          <button
            key={opt.slug}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={`Outfit pack: ${opt.label}`}
            disabled={disabled}
            onClick={() => onChange(opt.slug)}
            className={`group relative flex flex-col items-center justify-center gap-2 rounded-2xl border bg-white/5 backdrop-blur p-4 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 ${
              selected
                ? 'border-amber-400/60 scale-[1.03] shadow-[0_0_24px_rgba(245,158,11,0.22)]'
                : 'border-white/10 hover:border-white/20 hover:-translate-y-0.5'
            } ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
          >
            {selected && (
              <span
                className="absolute top-2 right-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/90 text-zinc-900"
                aria-hidden="true"
              >
                <CheckIcon className="w-3 h-3" />
              </span>
            )}
            <span className="text-3xl leading-none" aria-hidden="true">
              {opt.emoji ?? '👤'}
            </span>
            <span
              className={`text-xs font-medium ${
                selected ? 'text-amber-100' : 'text-zinc-200'
              }`}
            >
              {opt.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export default OutfitPackPicker
