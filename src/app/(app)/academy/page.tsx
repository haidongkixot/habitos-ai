'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Chapter = {
  id: string
  slug: string
  title: string
  subtitle: string
  category: string
  readTimeMin: number
  keyTakeaways: string[]
  minPlanSlug: string
  hasQuiz: boolean
  locked: boolean
  progress: {
    completed: boolean
    readPercent: number
    quizScore: number | null
    quizPassed: boolean
  } | null
}

const CATEGORY_ICONS: Record<string, string> = {
  wellness: '🌱',
  productivity: '🚀',
  learning: '🧠',
}

export default function AcademyPage() {
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [loading, setLoading] = useState(true)
  const [userPlan, setUserPlan] = useState('free')

  useEffect(() => {
    fetch('/api/academy')
      .then((r) => r.json())
      .then((d) => {
        setChapters(d.chapters || [])
        setUserPlan(d.userPlan || 'free')
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const completed = chapters.filter((c) => c.progress?.completed).length
  const total = chapters.length
  const progressPct = total > 0 ? Math.round((completed / total) * 100) : 0

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-white/5 rounded w-48" />
          <div className="h-4 bg-white/5 rounded w-96" />
          <div className="grid md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-48 bg-white/5 rounded-xl" />)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto py-12">
      {/* Hero */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-white mb-3">Academy</h1>
        <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
          Master the science of habits. Learn evidence-based strategies to build lasting routines and transform your life.
        </p>
      </div>

      {/* Progress Bar */}
      {total > 0 && (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-zinc-400">Your Progress</span>
            <span className="text-sm text-zinc-500">{completed} of {total} chapters completed</span>
          </div>
          <div className="w-full h-3 bg-white/[0.06] rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      )}

      {/* Chapter Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {chapters.map((ch, idx) => (
          <Link
            key={ch.id}
            href={ch.locked ? '/pricing' : `/academy/${ch.slug}`}
            className={`group relative bg-white/[0.03] border border-white/[0.06] rounded-xl p-6 transition-all hover:bg-white/[0.06] hover:border-emerald-500/30 ${ch.locked ? 'opacity-75' : ''}`}
          >
            {/* Status Badge */}
            <div className="absolute top-4 right-4">
              {ch.locked ? (
                <span className="px-2 py-1 rounded-full text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {ch.minPlanSlug} plan
                </span>
              ) : ch.progress?.completed ? (
                <span className="px-2 py-1 rounded-full text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Completed
                </span>
              ) : ch.progress?.readPercent ? (
                <span className="px-2 py-1 rounded-full text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {ch.progress.readPercent}%
                </span>
              ) : null}
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/[0.06] flex items-center justify-center text-2xl shrink-0">
                {ch.locked ? '🔒' : CATEGORY_ICONS[ch.category] || '📚'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-zinc-500 mb-1">Chapter {idx + 1} &middot; {ch.readTimeMin} min read</div>
                <h3 className="font-semibold text-white mb-1 group-hover:text-emerald-400 transition-colors">{ch.title}</h3>
                {ch.subtitle && <p className="text-sm text-zinc-400 line-clamp-2">{ch.subtitle}</p>}
                <div className="flex items-center gap-2 mt-3">
                  <span className="px-2 py-0.5 text-xs rounded-full bg-white/[0.06] text-zinc-400">{ch.category}</span>
                  {ch.hasQuiz && <span className="px-2 py-0.5 text-xs rounded-full bg-white/[0.06] text-zinc-400">Quiz</span>}
                </div>
              </div>
            </div>

            {/* Progress indicator */}
            {ch.progress && !ch.progress.completed && ch.progress.readPercent > 0 && (
              <div className="mt-4 w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${ch.progress.readPercent}%` }} />
              </div>
            )}
          </Link>
        ))}
      </div>

      {/* Interactive Tools */}
      <div className="mt-12 mb-10">
        <h2 className="text-2xl font-bold text-white mb-2">Interactive Tools</h2>
        <p className="text-zinc-400 text-sm mb-6">Research-driven exercises to deepen your practice and accelerate habit formation.</p>
        <div className="grid md:grid-cols-2 gap-4">
          <Link
            href="/academy/automaticity"
            className="group bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 hover:bg-white/[0.06] hover:border-emerald-500/30 transition-all"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-xl">&#x1F4CA;</div>
              <h3 className="font-semibold text-white group-hover:text-emerald-400 transition-colors">Automaticity Assessment</h3>
            </div>
            <p className="text-sm text-zinc-400">Rate how automatic each habit has become using the Self-Report Habit Index.</p>
          </Link>
          <Link
            href="/academy/intentions"
            className="group bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 hover:bg-white/[0.06] hover:border-emerald-500/30 transition-all"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-xl">&#x1F3AF;</div>
              <h3 className="font-semibold text-white group-hover:text-emerald-400 transition-colors">Intention Builder</h3>
            </div>
            <p className="text-sm text-zinc-400">Create implementation intentions using Gollwitzer&apos;s when-where-how formula.</p>
          </Link>
          <Link
            href="/academy/identity"
            className="group bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 hover:bg-white/[0.06] hover:border-emerald-500/30 transition-all"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-xl">&#x1F4DD;</div>
              <h3 className="font-semibold text-white group-hover:text-emerald-400 transition-colors">Identity Journal</h3>
            </div>
            <p className="text-sm text-zinc-400">Daily identity-based reflections inspired by James Clear&apos;s habit philosophy.</p>
          </Link>
          <Link
            href="/academy/environment"
            className="group bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 hover:bg-white/[0.06] hover:border-emerald-500/30 transition-all"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-xl">&#x1F3E0;</div>
              <h3 className="font-semibold text-white group-hover:text-emerald-400 transition-colors">Environment Audit</h3>
            </div>
            <p className="text-sm text-zinc-400">Audit cue visibility, friction, and temptations using Wood &amp; Neal&apos;s framework.</p>
          </Link>
        </div>
      </div>

      {chapters.length === 0 && !loading && (
        <div className="text-center py-16 text-zinc-500">
          <p className="text-lg mb-2">No chapters available yet</p>
          <p className="text-sm">Check back soon for new educational content!</p>
        </div>
      )}
    </div>
  )
}
