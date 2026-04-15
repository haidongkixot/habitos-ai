const APPS = [
  { name: 'BreathMaster', emoji: '🫁', url: 'https://breathmaster-ai.vercel.app', current: false },
  { name: 'HabitOS', emoji: '✅', url: 'https://habitos-ai.vercel.app', current: true },
  { name: 'HarmonyMap', emoji: '✨', url: 'https://harmonymap-ai.vercel.app', current: false },
  { name: 'MemoryForge', emoji: '🧠', url: 'https://memoryforge-ai.vercel.app', current: false },
  { name: 'FocusFlow', emoji: '⚡', url: 'https://focusflow-ai-mauve.vercel.app', current: false },
]

export default function EcosystemBar() {
  return (
    <div className="bg-zinc-900 border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 h-9 overflow-x-auto scrollbar-hide">
          <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest shrink-0">
            HumanOS
          </span>
          <div className="w-px h-4 bg-zinc-700 shrink-0" />
          <div className="flex items-center gap-1">
            {APPS.map((app) =>
              app.current ? (
                <span
                  key={app.name}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold shrink-0"
                >
                  {app.emoji} {app.name}
                </span>
              ) : (
                <a
                  key={app.name}
                  href={app.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-zinc-400 hover:bg-zinc-800 text-[11px] transition shrink-0"
                >
                  {app.emoji} {app.name}
                </a>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
