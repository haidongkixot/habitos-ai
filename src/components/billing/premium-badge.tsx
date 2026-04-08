/**
 * HabitOS M6 — Premium badge.
 *
 * Tiny gradient pill (amber -> rose) used to mark Premium-only features
 * across pricing, customize, and upsell surfaces. Pure presentational.
 *
 * Inline SVG sparkle (lucide-react is not in the dependency tree — see
 * persona-picker.tsx for the same pattern).
 */

export type PremiumBadgeSize = 'sm' | 'md' | 'lg'

export interface PremiumBadgeProps {
  size?: PremiumBadgeSize
  label?: string
  className?: string
}

const SIZE_CLASSES: Record<PremiumBadgeSize, { wrap: string; icon: string }> = {
  sm: {
    wrap: 'text-[10px] px-2 py-0.5 gap-1',
    icon: 'w-3 h-3',
  },
  md: {
    wrap: 'text-xs px-2.5 py-1 gap-1.5',
    icon: 'w-3.5 h-3.5',
  },
  lg: {
    wrap: 'text-sm px-3 py-1.5 gap-2',
    icon: 'w-4 h-4',
  },
}

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14z"
      />
    </svg>
  )
}

export function PremiumBadge({
  size = 'md',
  label = 'Premium',
  className = '',
}: PremiumBadgeProps) {
  const s = SIZE_CLASSES[size]
  return (
    <span
      className={`inline-flex items-center font-semibold uppercase tracking-wider rounded-full border border-amber-300/40 bg-gradient-to-r from-amber-400/25 via-amber-500/25 to-rose-500/25 text-amber-100 shadow-[0_0_18px_rgba(245,158,11,0.18)] ${s.wrap} ${className}`}
    >
      <SparkleIcon className={`${s.icon} text-amber-200`} />
      {label}
    </span>
  )
}

export default PremiumBadge
