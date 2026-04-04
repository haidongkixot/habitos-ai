'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

type Chapter = {
  id: string
  slug: string
  title: string
  subtitle: string
  body: string
  category: string
  readTimeMin: number
  keyTakeaways: string[]
  minPlanSlug: string
  quizData: { questions: { question: string; options: string[]; correctAnswer: number }[] } | null
  locked: boolean
  progress: { completed: boolean; readPercent: number; quizScore: number | null; quizPassed: boolean } | null
}

function renderMarkdown(md: string) {
  return md
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold text-white mt-6 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold text-white mt-8 mb-3">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold text-white mt-8 mb-4">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 text-zinc-400">$1</li>')
    .replace(/(<li.*<\/li>\n?)+/g, '<ul class="list-disc space-y-1 my-3">$&</ul>')
    .replace(/^(?!<[hulo])(.*\S.*)$/gm, '<p class="text-zinc-400 leading-relaxed mb-3">$1</p>')
}

export default function ChapterPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [chapter, setChapter] = useState<Chapter | null>(null)
  const [loading, setLoading] = useState(true)
  const [locked, setLocked] = useState(false)
  const [lockedInfo, setLockedInfo] = useState<any>(null)
  const [scrollPct, setScrollPct] = useState(0)
  const contentRef = useRef<HTMLDivElement>(null)

  // Quiz state
  const [answers, setAnswers] = useState<number[]>([])
  const [quizResult, setQuizResult] = useState<{ score: number; passed: boolean; correct: number; total: number } | null>(null)
  const [submittingQuiz, setSubmittingQuiz] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/academy/${slug}`)
      .then(async (r) => {
        const data = await r.json()
        if (r.status === 403) {
          setLocked(true)
          setLockedInfo(data.chapter)
        } else if (r.ok) {
          setChapter(data)
          if (data.quizData?.questions) {
            setAnswers(new Array(data.quizData.questions.length).fill(-1))
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [slug])

  const handleScroll = useCallback(() => {
    if (!contentRef.current) return
    const el = contentRef.current
    const scrollTop = window.scrollY - el.offsetTop
    const scrollHeight = el.scrollHeight - window.innerHeight
    const pct = Math.min(100, Math.max(0, Math.round((scrollTop / scrollHeight) * 100)))
    setScrollPct(pct)
  }, [])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  // Save progress on scroll
  useEffect(() => {
    if (!chapter || scrollPct === 0) return
    const timer = setTimeout(() => {
      fetch(`/api/academy/${slug}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ readPercent: scrollPct }),
      }).catch(() => {})
    }, 1000)
    return () => clearTimeout(timer)
  }, [scrollPct, slug, chapter])

  const submitQuiz = async () => {
    if (!chapter?.quizData) return
    setSubmittingQuiz(true)
    try {
      const res = await fetch(`/api/academy/${slug}/quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      })
      const data = await res.json()
      setQuizResult(data)
    } catch {}
    finally { setSubmittingQuiz(false) }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-white/5 rounded w-64" />
          <div className="h-4 bg-white/5 rounded w-96" />
          <div className="h-64 bg-white/5 rounded-xl" />
        </div>
      </div>
    )
  }

  if (locked && lockedInfo) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center">
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0c0c0f]/90 backdrop-blur-sm z-10" />
          <div className="relative z-20">
            <div className="text-5xl mb-4">🔒</div>
            <h1 className="text-2xl font-bold text-white mb-2">{lockedInfo.title}</h1>
            <p className="text-zinc-400 mb-6">{lockedInfo.subtitle}</p>
            <p className="text-sm text-zinc-500 mb-6">
              This chapter requires the <span className="font-semibold text-purple-400">{lockedInfo.minPlanSlug}</span> plan.
            </p>
            <Link href="/pricing" className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-medium transition-colors">
              Upgrade to Unlock
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!chapter) {
    return <div className="max-w-3xl mx-auto py-12 text-center text-zinc-500">Chapter not found</div>
  }

  return (
    <div className="max-w-3xl mx-auto py-12">
      {/* Scroll Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-white/[0.06]">
        <div className="h-full bg-emerald-500 transition-all duration-150" style={{ width: `${scrollPct}%` }} />
      </div>

      {/* Back nav */}
      <Link href="/academy" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-emerald-400 mb-8 transition-colors">
        &larr; Back to Academy
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <span className="px-3 py-1 rounded-full text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{chapter.category}</span>
          <span className="text-sm text-zinc-500">{chapter.readTimeMin} min read</span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">{chapter.title}</h1>
        {chapter.subtitle && <p className="text-lg text-zinc-400">{chapter.subtitle}</p>}
      </div>

      {/* Body */}
      <div ref={contentRef} className="prose-like mb-12" dangerouslySetInnerHTML={{ __html: renderMarkdown(chapter.body) }} />

      {/* Key Takeaways */}
      {chapter.keyTakeaways.length > 0 && (
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-6 mb-12">
          <h3 className="font-semibold text-emerald-400 mb-4">Key Takeaways</h3>
          <ul className="space-y-2">
            {chapter.keyTakeaways.map((t, i) => (
              <li key={i} className="flex items-start gap-2 text-zinc-300 text-sm">
                <span className="text-emerald-400 mt-0.5">&#10003;</span>
                {t}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Quiz Section */}
      {chapter.quizData?.questions && chapter.quizData.questions.length > 0 && (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6 mb-12">
          <h3 className="text-xl font-bold text-white mb-6">Knowledge Check</h3>

          {quizResult ? (
            <div className="text-center py-8">
              <div className="text-5xl mb-4">
                {quizResult.passed ? '🎉' : '📚'}
              </div>
              <h4 className="text-2xl font-bold text-white mb-2">
                {quizResult.passed ? 'Great job!' : 'Keep learning!'}
              </h4>
              <p className="text-zinc-400 mb-2">
                You got {quizResult.correct} of {quizResult.total} correct ({quizResult.score}%)
              </p>
              {quizResult.passed ? (
                <p className="text-emerald-400 text-sm">+50 XP earned!</p>
              ) : (
                <button onClick={() => { setQuizResult(null); setAnswers(new Array(chapter.quizData!.questions.length).fill(-1)) }} className="mt-4 text-emerald-400 hover:underline">
                  Try again
                </button>
              )}
            </div>
          ) : (
            <>
              {chapter.quizData.questions.map((q, qi) => (
                <div key={qi} className="mb-6">
                  <p className="font-medium text-white mb-3">{qi + 1}. {q.question}</p>
                  <div className="space-y-2">
                    {q.options.map((opt, oi) => (
                      <button
                        key={oi}
                        onClick={() => { const a = [...answers]; a[qi] = oi; setAnswers(a) }}
                        className={`w-full text-left px-4 py-3 rounded-lg border transition-colors text-sm ${
                          answers[qi] === oi
                            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                            : 'border-white/[0.06] hover:border-emerald-500/30 text-zinc-400'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <button
                onClick={submitQuiz}
                disabled={submittingQuiz || answers.some((a) => a === -1)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-3 rounded-xl font-medium transition-colors"
              >
                {submittingQuiz ? 'Submitting...' : 'Submit Answers'}
              </button>
            </>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Link href="/academy" className="text-emerald-400 hover:underline">&larr; All Chapters</Link>
      </div>
    </div>
  )
}
