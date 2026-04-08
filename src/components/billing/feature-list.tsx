/**
 * HabitOS M6 — Feature list.
 *
 * Bulleted check-mark list used inside TierCard and elsewhere on the
 * pricing surface. Pure presentational, accepts an array of strings.
 */

export type FeatureListSize = 'sm' | 'md'

export interface FeatureListProps {
  features: string[]
  size?: FeatureListSize
  iconColor?: string
  className?: string
}

const SIZE_CLASSES: Record<
  FeatureListSize,
  { text: string; icon: string; gap: string; row: string }
> = {
  sm: {
    text: 'text-xs',
    icon: 'w-3.5 h-3.5',
    gap: 'gap-2',
    row: 'py-1',
  },
  md: {
    text: 'text-sm',
    icon: 'w-4 h-4',
    gap: 'gap-2.5',
    row: 'py-1.5',
  },
}

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
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 12.5l4.5 4.5L19 7"
      />
    </svg>
  )
}

export function FeatureList({
  features,
  size = 'md',
  iconColor = 'text-emerald-400',
  className = '',
}: FeatureListProps) {
  const s = SIZE_CLASSES[size]
  if (!features || features.length === 0) return null
  return (
    <ul role="list" className={`flex flex-col ${className}`}>
      {features.map((feature, idx) => (
        <li
          key={`${idx}-${feature}`}
          className={`flex items-start ${s.gap} ${s.row} ${s.text} text-zinc-200`}
        >
          <span
            className={`mt-0.5 inline-flex shrink-0 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-500/10 p-0.5 ${iconColor}`}
            aria-hidden="true"
          >
            <CheckIcon className={s.icon} />
          </span>
          <span className="leading-snug">{feature}</span>
        </li>
      ))}
    </ul>
  )
}

export default FeatureList
