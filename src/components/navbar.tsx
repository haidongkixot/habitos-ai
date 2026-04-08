'use client'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useState, useEffect } from 'react'

export default function Navbar() {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const [userPlan, setUserPlan] = useState<string>('free')

  useEffect(() => {
    if (session) {
      fetch('/api/academy')
        .then(r => r.json())
        .then(d => { if (d.userPlan) setUserPlan(d.userPlan) })
        .catch(() => {})
    }
  }, [session])

  return (
    <nav className="bg-[#0c0c0f]/80 backdrop-blur-xl border-b border-white/[0.06] sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center text-white font-bold text-sm">H</div>
            <span className="text-white font-semibold text-lg">HabitOS</span>
            <span className="text-zinc-600 text-xs hidden sm:inline">by PeeTeeAI</span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link href="/about" className="text-zinc-400 hover:text-white transition-colors text-sm">About</Link>
            <Link href="/pricing" className="text-zinc-400 hover:text-white transition-colors text-sm">Pricing</Link>
            <Link href="/dashboard" className="text-zinc-400 hover:text-white transition-colors text-sm">Dashboard</Link>
            <Link href="/goals" className="text-zinc-400 hover:text-white transition-colors text-sm">Goals</Link>
            <Link href="/reminders" className="text-zinc-400 hover:text-white transition-colors text-sm flex items-center gap-1.5" aria-label="Reminders">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0a3 3 0 11-6 0" />
              </svg>
              <span>Reminders</span>
            </Link>
            <Link href="/habits" className="text-zinc-400 hover:text-white transition-colors text-sm">Habits</Link>
            <Link href="/progress" className="text-zinc-400 hover:text-white transition-colors text-sm">Progress</Link>
            <Link href="/academy" className="text-zinc-400 hover:text-white transition-colors text-sm">Academy</Link>
            <Link href="/settings/notifications" className="text-zinc-400 hover:text-white transition-colors text-sm flex items-center gap-1.5" aria-label="Settings">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Settings</span>
            </Link>
            {session ? (
              <>
                <Link href="/pricing" className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                  userPlan === 'pro' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                }`}>
                  {userPlan === 'pro' ? 'Pro' : 'Free'}
                </Link>
                <button onClick={() => signOut()} className="text-zinc-400 hover:text-white text-sm transition-colors">Sign Out</button>
              </>
            ) : (
              <Link href="/login" className="btn-primary text-sm !px-5 !py-2">Sign In</Link>
            )}
          </div>
          <button onClick={() => setOpen(!open)} className="md:hidden text-zinc-300">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={open ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  )
}
