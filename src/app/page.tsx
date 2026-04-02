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
    <div className="bg-[#1c1c22]/80 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-5 sm:p-6">
      {/* Header row */}
      <div className="grid grid-cols-[140px_repeat(7,1fr)] gap-1.5 mb-1.5">
        <div />
        {DAYS.map((d) => (
          <div key={d} className="text-center text-zinc-500 text-xs font-medium">
            {d}
          </div>
        ))}
      </div>

      {/* Habit rows */}
      {HABITS.map((habit) => (
        <div key={habit.name} className="grid grid-cols-[140px_repeat(7,1fr)] gap-1.5 mb-1.5 items-center">
          <div className="text-zinc-300 text-sm truncate pr-2">{habit.name}</div>
          {habit.checks.map((done, j) => (
            <div key={j} className="flex justify-center">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium transition-all ${
                  done
                    ? 'bg-gradient-to-br from-emerald-500 to-teal-400 text-white shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                    : 'bg-white/5 text-zinc-600 border border-white/[0.06]'
                }`}
              >
                {done ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2.5 7L5.5 10L11.5 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <span className="block w-2 h-2 rounded-full bg-zinc-700" />
                )}
              </div>
            </div>
          ))}
        </div>
      ))}

      {/* Streak + Recovery row */}
      <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-sm">
        <span className="text-amber-400 font-bold">
          12-day streak
        </span>
        <span className="text-emerald-400 text-xs bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
          Missed &rarr; Recovered
        </span>
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0c0c0f] flex flex-col">
      {/* Nav */}
      <nav className="border-b border-white/[0.06] px-6 py-4 bg-[#0c0c0f]/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center text-white font-semibold text-xs">
              H
            </div>
            <span className="text-white font-medium text-base">HabitOS</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-zinc-500 hover:text-white text-sm transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="bg-gradient-to-r from-emerald-500 to-teal-400 hover:shadow-[0_0_25px_rgba(16,185,129,0.3)] text-white px-5 py-1.5 rounded-full text-sm font-medium transition-all"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        {/* ── Hero ── */}
        <section className="px-4 py-24 relative">
          {/* Subtle radial gradient background */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.08),transparent_50%)] pointer-events-none" />
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative">
            {/* Left: text */}
            <div>
              <p className="text-emerald-400/80 text-sm mb-4 tracking-wide uppercase font-medium">
                Habit tracking, structured
              </p>
              <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight mb-6">
                Show up every day.
                <br />
                <span className="text-gradient">The rest follows.</span>
              </h1>
              <p className="text-zinc-400 text-lg leading-relaxed mb-10 max-w-md">
                A simple system that tracks what you do, notices when you slip,
                and helps you get back on track. No hype. Just consistency.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/signup"
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] text-white px-7 py-3 rounded-full text-sm font-semibold transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                >
                  Build your first weekly routine
                </Link>
                <a
                  href="#habit-board"
                  className="bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-300 hover:text-white px-7 py-3 rounded-full text-sm transition-all"
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
            <p className="text-emerald-400/80 text-sm mb-3 tracking-wide uppercase font-medium">
              Behavioral mechanics
            </p>
            <h2 className="text-3xl font-bold text-white mb-16">
              How habits actually stick
            </h2>

            {/* Block 1: Repeat */}
            <div className="mb-20">
              <h3 className="text-xl font-semibold text-white mb-2">Repeat</h3>
              <p className="text-zinc-400 mb-6">Set it. See it. Do it.</p>
              <div className="bg-[#1c1c22]/80 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-5">
                <p className="text-zinc-500 text-xs mb-3 uppercase tracking-wide">Frequency</p>
                <div className="flex gap-2 mb-4">
                  {['Daily', 'Weekdays', 'Mon / Wed / Fri', 'Custom'].map((opt, i) => (
                    <button
                      key={opt}
                      className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                        i === 0
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.1)]'
                          : 'bg-white/5 text-zinc-500 border border-white/10 hover:bg-white/10'
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
                      className="h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs"
                    >
                      {d}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Block 2: Recover */}
            <div className="mb-20">
              <h3 className="text-xl font-semibold text-white mb-2">Recover</h3>
              <p className="text-zinc-400 mb-6">Miss a day? Get a recovery prompt.</p>
              <div className="bg-[#1c1c22]/80 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-amber-400 mt-2 shrink-0 shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
                  <div>
                    <p className="text-zinc-300 text-sm mb-1">
                      You missed <span className="text-white font-medium">Meditation</span> yesterday.
                    </p>
                    <p className="text-zinc-500 text-sm mb-4">
                      Resume with a 5-minute session?
                    </p>
                    <div className="flex gap-2">
                      <button className="px-3 py-1.5 rounded-full text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors">
                        Resume now
                      </button>
                      <button className="px-3 py-1.5 rounded-full text-xs bg-white/5 text-zinc-500 border border-white/10 hover:bg-white/10 transition-colors">
                        Skip today
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Block 3: Reinforce */}
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">Reinforce</h3>
              <p className="text-zinc-400 mb-6">Watch the pattern emerge.</p>
              <div className="bg-[#1c1c22]/80 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-5">
                <p className="text-zinc-500 text-xs mb-3 uppercase tracking-wide">
                  30-day completion
                </p>
                <div className="grid grid-cols-10 gap-1.5">
                  {[
                    1,0,1,0,0,1,1,0,1,1,
                    1,1,0,1,1,1,0,1,1,1,
                    1,1,1,1,0,1,1,1,1,1,
                  ].map((filled, i) => (
                    <div
                      key={i}
                      className={`w-full aspect-square rounded-md transition-all ${
                        filled ? 'bg-gradient-to-br from-emerald-500/70 to-teal-400/70 shadow-[0_0_6px_rgba(16,185,129,0.2)]' : 'bg-white/5 border border-white/[0.06]'
                      }`}
                    />
                  ))}
                </div>
                <div className="flex items-center justify-between mt-3 text-xs text-zinc-500">
                  <span>Day 1</span>
                  <span>Day 30</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 3: What a week looks like ── */}
        <section className="px-4 py-24 bg-[#16161a]/50">
          <div className="max-w-3xl mx-auto">
            <p className="text-emerald-400/80 text-sm mb-3 tracking-wide uppercase font-medium">
              Product demo
            </p>
            <h2 className="text-3xl font-bold text-white mb-12">
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
                    <span className="text-white text-sm font-medium">{entry.day}</span>
                  </div>
                  <span className="text-zinc-400 text-sm">{entry.status}</span>
                  {entry.mark === 'done' && (
                    <svg
                      className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5"
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
            <p className="text-emerald-400/80 text-sm mb-3 tracking-wide uppercase font-medium">
              Case study
            </p>
            <h2 className="text-3xl font-bold text-white mb-10">
              One person, six weeks
            </h2>

            <div className="bg-[#1c1c22]/80 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 sm:p-8">
              <p className="text-zinc-300 leading-relaxed mb-8">
                James, a software engineer, started with 3 habits. After 6 weeks,
                he maintained a 91% completion rate. His morning routine went from
                &ldquo;chaotic&rdquo; to &ldquo;automatic.&rdquo;
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 border border-white/[0.06] rounded-2xl p-4">
                  <p className="text-zinc-500 text-xs uppercase tracking-wide mb-1">Week 1</p>
                  <p className="text-2xl font-bold text-zinc-300">47%</p>
                  <p className="text-zinc-500 text-xs mt-0.5">completion</p>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
                  <p className="text-zinc-500 text-xs uppercase tracking-wide mb-1">Week 6</p>
                  <p className="text-2xl font-bold text-gradient">91%</p>
                  <p className="text-zinc-500 text-xs mt-0.5">completion</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 5: CTA ── */}
        <section className="px-4 py-24 relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_rgba(16,185,129,0.06),transparent_60%)] pointer-events-none" />
          <div className="max-w-2xl mx-auto text-center relative">
            <h2 className="text-3xl font-bold text-white mb-4">
              Your habits don&apos;t need motivation.
              <br />
              <span className="text-gradient">They need a system.</span>
            </h2>
            <p className="text-zinc-500 mb-10">
              Start with one habit. Build from there.
            </p>
            <Link
              href="/signup"
              className="inline-block bg-gradient-to-r from-emerald-500 to-teal-400 hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] text-white px-8 py-3 rounded-full text-sm font-semibold transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]"
            >
              Start building
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-8 text-center text-zinc-600 text-sm">
        <p>
          HabitOS AI -- Part of the{' '}
          <span className="text-gradient font-medium">HumanOS</span> ecosystem
        </p>
        <p className="mt-1.5">&copy; {new Date().getFullYear()} HumanOS. All rights reserved.</p>
      </footer>
    </div>
  )
}
