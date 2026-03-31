import Link from 'next/link'

const HABITS = [
  { name: 'Morning Run', checks: [true, true, true, false, true, true, true] },
  { name: 'Read 20 Pages', checks: [true, true, false, true, true, true, true] },
  { name: 'Meditate', checks: [true, true, true, true, true, false, true] },
  { name: 'Drink Water', checks: [true, true, true, true, true, true, true] },
  { name: 'Journal', checks: [false, true, true, true, true, true, true] },
]

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const WEEK_LOG = [
  { day: 'Monday', status: '5/5 habits completed', mark: 'done' },
  { day: 'Tuesday', status: '4/5 -- missed evening journal', mark: 'partial' },
  { day: 'Wednesday', status: '5/5 -- streak recovered', mark: 'done' },
  { day: 'Thursday', status: '5/5', mark: 'done' },
  { day: 'Friday', status: '3/5 -- adjusted goals', mark: 'partial' },
  { day: 'Saturday', status: 'Rest day configured', mark: 'rest' },
  { day: 'Sunday', status: 'Rest day configured', mark: 'rest' },
]

function HabitBoard() {
  return (
    <div className="bg-neutral-900/60 border border-neutral-800/50 rounded-xl p-5 sm:p-6">
      {/* Header row */}
      <div className="grid grid-cols-[140px_repeat(7,1fr)] gap-1.5 mb-1.5">
        <div />
        {DAYS.map((d) => (
          <div key={d} className="text-center text-neutral-500 text-xs font-medium">
            {d}
          </div>
        ))}
      </div>

      {/* Habit rows */}
      {HABITS.map((habit, i) => (
        <div key={habit.name} className="grid grid-cols-[140px_repeat(7,1fr)] gap-1.5 mb-1.5 items-center">
          <div className="text-neutral-300 text-sm truncate pr-2">{habit.name}</div>
          {habit.checks.map((done, j) => (
            <div key={j} className="flex justify-center">
              <div
                className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-medium ${
                  done
                    ? 'bg-emerald-500/80 text-white'
                    : 'bg-neutral-800 text-neutral-600'
                }`}
              >
                {done ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2.5 7L5.5 10L11.5 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <span className="block w-2 h-2 rounded-full bg-neutral-600" />
                )}
              </div>
            </div>
          ))}
        </div>
      ))}

      {/* Streak + Recovery row */}
      <div className="mt-4 pt-3 border-t border-neutral-800/50 flex items-center justify-between text-sm">
        <span className="text-neutral-400">
          12-day streak
        </span>
        <span className="text-emerald-500/90 text-xs bg-emerald-500/10 px-2.5 py-1 rounded-md">
          Missed &rarr; Recovered
        </span>
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0f0f12] flex flex-col">
      {/* Nav */}
      <nav className="border-b border-neutral-800/60 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-emerald-500 flex items-center justify-center text-white font-semibold text-xs">
              H
            </div>
            <span className="text-neutral-200 font-medium text-base">HabitOS</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-neutral-500 hover:text-neutral-300 text-sm transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-1.5 rounded-lg text-sm transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        {/* ── Hero ── */}
        <section className="px-4 py-24">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left: text */}
            <div>
              <p className="text-neutral-500 text-sm mb-4 tracking-wide uppercase">
                Habit tracking, structured
              </p>
              <h1 className="text-4xl sm:text-5xl font-semibold text-neutral-100 leading-tight mb-6">
                Show up every day.
                <br />
                <span className="text-emerald-400">The rest follows.</span>
              </h1>
              <p className="text-neutral-400 text-lg leading-relaxed mb-10 max-w-md">
                A simple system that tracks what you do, notices when you slip,
                and helps you get back on track. No hype. Just consistency.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/signup"
                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
                >
                  Build your first weekly routine
                </Link>
                <a
                  href="#habit-board"
                  className="border border-neutral-700 hover:border-neutral-500 text-neutral-400 hover:text-neutral-200 px-6 py-2.5 rounded-lg text-sm transition-colors"
                >
                  See a sample habit system
                </a>
              </div>
            </div>

            {/* Right: habit board mockup */}
            <div>
              <HabitBoard />
            </div>
          </div>
        </section>

        {/* ── Section 2: How habits actually stick ── */}
        <section className="px-4 py-24" id="habit-board">
          <div className="max-w-3xl mx-auto">
            <p className="text-neutral-500 text-sm mb-3 tracking-wide uppercase">
              Behavioral mechanics
            </p>
            <h2 className="text-3xl font-semibold text-neutral-100 mb-16">
              How habits actually stick
            </h2>

            {/* Block 1: Repeat */}
            <div className="mb-20">
              <h3 className="text-xl font-medium text-neutral-200 mb-2">Repeat</h3>
              <p className="text-neutral-400 mb-6">Set it. See it. Do it.</p>
              <div className="bg-neutral-900/60 border border-neutral-800/50 rounded-xl p-5">
                <p className="text-neutral-500 text-xs mb-3 uppercase tracking-wide">Frequency</p>
                <div className="flex gap-2 mb-4">
                  {['Daily', 'Weekdays', 'Mon / Wed / Fri', 'Custom'].map((opt, i) => (
                    <button
                      key={opt}
                      className={`px-3 py-1.5 rounded-md text-xs transition-colors ${
                        i === 0
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-neutral-800 text-neutral-500 border border-neutral-700/50'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1.5">
                  {DAYS.map((d) => (
                    <div
                      key={d}
                      className="h-9 rounded-md bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs"
                    >
                      {d}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Block 2: Recover */}
            <div className="mb-20">
              <h3 className="text-xl font-medium text-neutral-200 mb-2">Recover</h3>
              <p className="text-neutral-400 mb-6">Miss a day? Get a recovery prompt.</p>
              <div className="bg-neutral-900/60 border border-neutral-800/50 rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-amber-400 mt-2 shrink-0" />
                  <div>
                    <p className="text-neutral-300 text-sm mb-1">
                      You missed <span className="text-neutral-100 font-medium">Meditation</span> yesterday.
                    </p>
                    <p className="text-neutral-500 text-sm mb-4">
                      Resume with a 5-minute session?
                    </p>
                    <div className="flex gap-2">
                      <button className="px-3 py-1.5 rounded-md text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Resume now
                      </button>
                      <button className="px-3 py-1.5 rounded-md text-xs bg-neutral-800 text-neutral-500 border border-neutral-700/50">
                        Skip today
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Block 3: Reinforce */}
            <div>
              <h3 className="text-xl font-medium text-neutral-200 mb-2">Reinforce</h3>
              <p className="text-neutral-400 mb-6">Watch the pattern emerge.</p>
              <div className="bg-neutral-900/60 border border-neutral-800/50 rounded-xl p-5">
                <p className="text-neutral-500 text-xs mb-3 uppercase tracking-wide">
                  30-day completion
                </p>
                <div className="grid grid-cols-10 gap-1.5">
                  {/* Deterministic pattern: sparse early, dense later */}
                  {[
                    1,0,1,0,0,1,1,0,1,1,
                    1,1,0,1,1,1,0,1,1,1,
                    1,1,1,1,0,1,1,1,1,1,
                  ].map((filled, i) => (
                    <div
                      key={i}
                      className={`w-full aspect-square rounded-sm ${
                        filled ? 'bg-emerald-500/70' : 'bg-neutral-800'
                      }`}
                    />
                  ))}
                </div>
                <div className="flex items-center justify-between mt-3 text-xs text-neutral-500">
                  <span>Day 1</span>
                  <span>Day 30</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 3: What a week looks like ── */}
        <section className="px-4 py-24 bg-neutral-900/30">
          <div className="max-w-3xl mx-auto">
            <p className="text-neutral-500 text-sm mb-3 tracking-wide uppercase">
              Product demo
            </p>
            <h2 className="text-3xl font-semibold text-neutral-100 mb-12">
              What a week looks like
            </h2>

            <div className="space-y-0">
              {WEEK_LOG.map((entry) => (
                <div
                  key={entry.day}
                  className="flex items-start gap-4 py-4 border-l-2 pl-5 -ml-0.5"
                  style={{
                    borderColor:
                      entry.mark === 'done'
                        ? 'rgb(16 185 129 / 0.6)'
                        : entry.mark === 'partial'
                        ? 'rgb(245 158 11 / 0.5)'
                        : 'rgb(64 64 64 / 0.5)',
                  }}
                >
                  <div className="min-w-[100px]">
                    <span className="text-neutral-200 text-sm font-medium">{entry.day}</span>
                  </div>
                  <span className="text-neutral-400 text-sm">{entry.status}</span>
                  {entry.mark === 'done' && (
                    <svg
                      className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5"
                      fill="none"
                      viewBox="0 0 16 16"
                    >
                      <path
                        d="M3 8L6.5 11.5L13 5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Section 4: User story ── */}
        <section className="px-4 py-24">
          <div className="max-w-3xl mx-auto">
            <p className="text-neutral-500 text-sm mb-3 tracking-wide uppercase">
              Case study
            </p>
            <h2 className="text-3xl font-semibold text-neutral-100 mb-10">
              One person, six weeks
            </h2>

            <div className="bg-neutral-900/60 border border-neutral-800/50 rounded-xl p-6 sm:p-8">
              <p className="text-neutral-300 leading-relaxed mb-8">
                James, a software engineer, started with 3 habits. After 6 weeks,
                he maintained a 91% completion rate. His morning routine went from
                &ldquo;chaotic&rdquo; to &ldquo;automatic.&rdquo;
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-neutral-800/60 border border-neutral-700/40 rounded-lg p-4">
                  <p className="text-neutral-500 text-xs uppercase tracking-wide mb-1">Week 1</p>
                  <p className="text-2xl font-semibold text-neutral-300">47%</p>
                  <p className="text-neutral-500 text-xs mt-0.5">completion</p>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
                  <p className="text-neutral-500 text-xs uppercase tracking-wide mb-1">Week 6</p>
                  <p className="text-2xl font-semibold text-emerald-400">91%</p>
                  <p className="text-neutral-500 text-xs mt-0.5">completion</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 5: CTA ── */}
        <section className="px-4 py-24 bg-neutral-900/30">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-semibold text-neutral-100 mb-4">
              Your habits don&apos;t need motivation.
              <br />
              They need a system.
            </h2>
            <p className="text-neutral-500 mb-10">
              Start with one habit. Build from there.
            </p>
            <Link
              href="/signup"
              className="inline-block bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-lg text-sm font-medium transition-colors"
            >
              Start building
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-800/60 py-8 text-center text-neutral-600 text-sm">
        <p>
          HabitOS AI -- Part of the{' '}
          <span className="text-emerald-500/70">HumanOS</span> ecosystem
        </p>
        <p className="mt-1.5">&copy; {new Date().getFullYear()} HumanOS. All rights reserved.</p>
      </footer>
    </div>
  )
}
