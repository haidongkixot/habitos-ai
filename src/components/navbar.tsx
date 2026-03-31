'use client'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useState } from 'react'

export default function Navbar() {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)

  return (
    <nav className="bg-gray-900 border-b border-emerald-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-bold text-sm">H</div>
            <span className="text-white font-semibold text-lg">HabitOS</span>
            <span className="text-gray-500 text-xs hidden sm:inline">by PeeTeeAI</span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link href="/about" className="text-gray-300 hover:text-emerald-400 transition-colors text-sm">About</Link>
            <Link href="/pricing" className="text-gray-300 hover:text-emerald-400 transition-colors text-sm">Pricing</Link>
            <Link href="/dashboard" className="text-gray-300 hover:text-emerald-400 transition-colors text-sm">Dashboard</Link>
            <Link href="/habits" className="text-gray-300 hover:text-emerald-400 transition-colors text-sm">Habits</Link>
            <Link href="/progress" className="text-gray-300 hover:text-emerald-400 transition-colors text-sm">Progress</Link>
            {session ? (
              <button onClick={() => signOut()} className="text-gray-400 hover:text-white text-sm">Sign Out</button>
            ) : (
              <Link href="/login" className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm transition-colors">Sign In</Link>
            )}
          </div>
          <button onClick={() => setOpen(!open)} className="md:hidden text-gray-300">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={open ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  )
}