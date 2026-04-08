import Link from 'next/link'
import GoalCreateForm from './goal-create-form'

export const dynamic = 'force-dynamic'

export default function NewGoalPage() {
  return (
    <div className="space-y-8">
      <nav aria-label="Breadcrumb" className="text-xs text-zinc-500">
        <ol className="flex items-center gap-2">
          <li>
            <Link href="/dashboard" className="hover:text-zinc-300 transition-colors">
              Dashboard
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/goals" className="hover:text-zinc-300 transition-colors">
              Goals
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-zinc-300">New</li>
        </ol>
      </nav>

      <header className="space-y-2 max-w-2xl">
        <h1 className="text-3xl font-bold text-white tracking-tight">Set a new goal</h1>
        <p className="text-zinc-400">
          Tell us what you&apos;re reaching for. Then pick the coaching framework that fits how
          you think.
        </p>
      </header>

      <GoalCreateForm />
    </div>
  )
}
