'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Referral {
  userName: string
  activatedAt: string | null
  rewardGranted: boolean
}

interface ReferralStats {
  code: string | null
  link: string | null
  clicks: number
  referrals: Referral[]
  totalReferred: number
  totalRewarded: number
}

export default function ReferralPage() {
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function init() {
      try {
        await fetch('/api/referral/generate', { method: 'POST' })
        const res = await fetch('/api/referral/stats')
        if (!res.ok) throw new Error('Failed')
        setStats(await res.json())
      } catch {
        setError('Failed to load referral data.')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  const copyLink = async () => {
    if (!stats?.link) return
    await navigator.clipboard.writeText(stats.link).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return (
    <div className="max-w-2xl mx-auto space-y-4 animate-pulse">
      <div className="h-8 bg-zinc-800 rounded w-1/3" />
      <div className="h-32 bg-zinc-800 rounded-xl" />
    </div>
  )

  if (error) return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6">
        <p className="text-red-400">{error}</p>
      </div>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/settings" className="text-sm text-zinc-400 hover:text-emerald-400 transition">← Back to Settings</Link>

      <div>
        <h1 className="text-2xl font-bold text-white">Invite Friends</h1>
        <p className="text-zinc-400 mt-1">Share HabitOS and earn 1 free month of Pro for each friend who joins.</p>
      </div>

      {/* Link */}
      <div className="card space-y-4">
        <h2 className="text-lg font-semibold text-white">Your Referral Link</h2>
        {stats?.link && (
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-300 truncate font-mono">
              {stats.link}
            </div>
            <button onClick={copyLink} className="shrink-0 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition text-sm">
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4">Stats</h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Link Clicks', value: stats?.clicks ?? 0 },
            { label: 'Friends Joined', value: stats?.totalReferred ?? 0 },
            { label: 'Months Earned', value: stats?.totalRewarded ?? 0 },
          ].map(s => (
            <div key={s.label} className="text-center p-4 bg-zinc-900 rounded-xl">
              <p className="text-2xl font-bold text-emerald-400">{s.value}</p>
              <p className="text-xs text-zinc-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Referred list */}
      {stats?.referrals && stats.referrals.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">Referred Friends</h2>
          <div className="divide-y divide-zinc-800">
            {stats.referrals.map((r, i) => (
              <div key={i} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-white font-medium text-sm">{r.userName}</p>
                  {r.activatedAt && <p className="text-xs text-zinc-500">{new Date(r.activatedAt).toLocaleDateString()}</p>}
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${r.rewardGranted ? 'bg-emerald-500/20 text-emerald-400' : r.activatedAt ? 'bg-blue-500/20 text-blue-400' : 'bg-zinc-700 text-zinc-400'}`}>
                  {r.rewardGranted ? 'Rewarded' : r.activatedAt ? 'Activated' : 'Pending'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* How it works */}
      <div className="card space-y-4">
        <h2 className="text-lg font-semibold text-white">How It Works</h2>
        {[
          'Share your unique referral link with friends',
          'They sign up and get a 14-day extended free trial',
          'When they log their first habit check-in, you earn 1 free month of Pro',
        ].map((text, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm font-bold shrink-0">{i + 1}</div>
            <p className="text-zinc-400 text-sm pt-1">{text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
