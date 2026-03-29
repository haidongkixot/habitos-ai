import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <nav className="border-b border-emerald-500/20 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-bold text-sm">H</div>
            <span className="text-white font-semibold text-lg">HabitOS</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-gray-400 hover:text-white text-sm transition-colors">Sign In</Link>
            <Link href="/signup" className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm transition-colors">Get Started</Link>
          </div>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center">
        <div className="max-w-3xl space-y-8">
          <div className="inline-block px-4 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 text-sm">
            Part of the HumanOS Ecosystem
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold">
            Build <span className="text-emerald-400">Habits</span><br />
            That <span className="text-emerald-400">Last</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Science-backed habit tracking with AI coaching. Build positive routines,
            break bad patterns, and transform your daily life one habit at a time.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/signup" className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-xl text-lg font-medium transition-colors">
              Start Building Habits
            </Link>
            <Link href="/login" className="border border-gray-700 hover:border-emerald-400 text-gray-300 px-8 py-3 rounded-xl text-lg transition-colors">
              Sign In
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-12">
            {[
              { icon: '📋', title: 'Track Daily', desc: 'Simple check-ins for all your habits' },
              { icon: '🤖', title: 'AI Coach', desc: 'Personalized tips to stay on track' },
              { icon: '📈', title: 'See Growth', desc: 'Streaks, stats, and beautiful charts' },
            ].map(f => (
              <div key={f.title} className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-left">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="text-white font-semibold mb-1">{f.title}</h3>
                <p className="text-gray-400 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-800 py-6 text-center text-gray-500 text-sm">
        HabitOS — A HumanOS App by PeeTeeAI
      </footer>
    </div>
  )
}