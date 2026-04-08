'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

export type WizardGoal = {
  id: string
  title: string
  description?: string | null
  category: string
  framework: string
  targetDate?: string | null
}

type InputType = 'text' | 'longtext' | 'select' | 'multiselect' | 'scale'

type WizardStep = {
  id: string
  title: string
  subtitle: string
  inputType: InputType
  required: boolean
  placeholder?: string
  helpText?: string
  options?: string[]
  minWords?: number
  scaleMin?: number
  scaleMax?: number
  scaleLow?: string
  scaleHigh?: string
}

// TODO(phase3-backend): these step definitions should ultimately be fetched from the backend's
// src/lib/coaching/frameworks.ts once backend-engineer publishes that module. Keeping them
// hardcoded inline for now so the UI can ship independently of the API shape.
const FRAMEWORK_STEPS: Record<string, WizardStep[]> = {
  GROW: [
    {
      id: 'goal',
      title: 'What does success look like?',
      subtitle: 'Paint the picture. Specific, sensory, measurable.',
      inputType: 'longtext',
      required: true,
      placeholder: 'When I hit this goal, I will...',
      helpText: 'The clearer you are now, the better your plan will be.',
      minWords: 15,
    },
    {
      id: 'goalMetric',
      title: 'How will you know you reached it?',
      subtitle: 'A single measurable signal.',
      inputType: 'text',
      required: true,
      placeholder: 'e.g. Running a 10K in under 55 minutes',
    },
    {
      id: 'reality',
      title: 'Where are you right now?',
      subtitle: 'Honestly. This sets the starting line.',
      inputType: 'longtext',
      required: true,
      placeholder: 'Currently I can / have / do...',
      helpText: 'No judgment — just facts.',
      minWords: 10,
    },
    {
      id: 'resources',
      title: 'What resources do you already have?',
      subtitle: 'Time, skills, people, tools.',
      inputType: 'multiselect',
      required: false,
      options: [
        'Flexible schedule',
        'Supportive people',
        'Money to invest',
        'Relevant experience',
        'Physical energy',
        'Dedicated space',
        'Mentors or community',
      ],
    },
    {
      id: 'options',
      title: 'What are your options?',
      subtitle: 'List 3+ paths you could take.',
      inputType: 'longtext',
      required: true,
      placeholder: '1. ...\n2. ...\n3. ...',
      minWords: 15,
    },
    {
      id: 'obstacle',
      title: 'What\u2019s the biggest obstacle?',
      subtitle: 'The one thing most likely to derail you.',
      inputType: 'longtext',
      required: true,
      placeholder: 'The thing that usually stops me is...',
      minWords: 8,
    },
    {
      id: 'commitment',
      title: 'On a scale of 1\u201310, how committed are you?',
      subtitle: 'Be honest. We\u2019ll design the plan around your real commitment.',
      inputType: 'scale',
      required: true,
      scaleMin: 1,
      scaleMax: 10,
      scaleLow: 'Just curious',
      scaleHigh: 'All in',
    },
  ],
  WOOP: [
    {
      id: 'wish',
      title: 'What do you wish for?',
      subtitle: 'One sentence. Challenging but feasible.',
      inputType: 'text',
      required: true,
      placeholder: 'I wish to...',
    },
    {
      id: 'outcome',
      title: 'Imagine the best outcome. What\u2019s the feeling?',
      subtitle: 'Close your eyes for a moment. Feel it.',
      inputType: 'longtext',
      required: true,
      placeholder: 'When this happens I\u2019ll feel...',
      helpText: 'Mental contrasting works best when you can taste the reward.',
      minWords: 12,
    },
    {
      id: 'obstacle',
      title: 'Now the obstacle. What inside you stands in the way?',
      subtitle: 'Not external. Internal \u2014 a thought, habit, fear.',
      inputType: 'longtext',
      required: true,
      placeholder: 'My obstacle is...',
      helpText: 'Oettingen found internal obstacles matter more than external ones.',
      minWords: 10,
    },
    {
      id: 'obstacleCue',
      title: 'When is that obstacle most likely to show up?',
      subtitle: 'Time, place, mood, trigger.',
      inputType: 'text',
      required: true,
      placeholder: 'e.g. Weeknights after work when I\u2019m exhausted',
    },
    {
      id: 'plan',
      title: 'Implementation intention: "If X, then I will Y"',
      subtitle: 'Write one concrete if-then plan.',
      inputType: 'longtext',
      required: true,
      placeholder: 'If [obstacle], then I will [specific action]',
      helpText: 'Gollwitzer\u2019s research shows if-then plans 2\u20133x likelihood of follow-through.',
      minWords: 12,
    },
    {
      id: 'confidence',
      title: 'How confident are you in this plan?',
      subtitle: '1 = not really, 10 = rock solid.',
      inputType: 'scale',
      required: true,
      scaleMin: 1,
      scaleMax: 10,
      scaleLow: 'Shaky',
      scaleHigh: 'Rock solid',
    },
  ],
  IDENTITY: [
    {
      id: 'identity',
      title: 'Who do you want to become?',
      subtitle: 'Not what you want to do. Who you want to BE.',
      inputType: 'text',
      required: true,
      placeholder: 'I am the kind of person who...',
      helpText: 'Clear\u2019s research: identity is the deepest layer of change.',
    },
    {
      id: 'why',
      title: 'Why does this identity matter to you?',
      subtitle: 'Dig past the surface reason.',
      inputType: 'longtext',
      required: true,
      placeholder: 'This matters because...',
      minWords: 15,
    },
    {
      id: 'evidence',
      title: 'What tiny actions would a person with this identity take?',
      subtitle: 'List 3\u20135. Each should take under 2 minutes.',
      inputType: 'longtext',
      required: true,
      placeholder: '1. ...\n2. ...\n3. ...',
      helpText: 'Every tiny action is a vote for the identity you want.',
      minWords: 15,
    },
    {
      id: 'environment',
      title: 'What in your environment supports this?',
      subtitle: 'Cues, spaces, people.',
      inputType: 'multiselect',
      required: false,
      options: [
        'Morning routine',
        'Dedicated space',
        'Accountability partner',
        'Visible cues (notes, tools)',
        'Calendar blocks',
        'Phone reminders',
        'Community or group',
      ],
    },
    {
      id: 'friction',
      title: 'What friction do you need to remove?',
      subtitle: 'The tiny resistance that makes you quit.',
      inputType: 'longtext',
      required: true,
      placeholder: 'Friction I need to remove...',
      minWords: 10,
    },
    {
      id: 'identityStrength',
      title: 'How strongly do you identify with this already?',
      subtitle: '1 = totally new, 10 = already me.',
      inputType: 'scale',
      required: true,
      scaleMin: 1,
      scaleMax: 10,
      scaleLow: 'Totally new',
      scaleHigh: 'Already me',
    },
  ],
}

type AnswerValue = string | string[] | number | null

function countWords(value: string): number {
  return value.trim().split(/\s+/).filter(Boolean).length
}

function isAnswerValid(step: WizardStep, value: AnswerValue): boolean {
  if (!step.required) return true
  if (value === null || value === undefined) return false
  if (step.inputType === 'text' || step.inputType === 'longtext') {
    if (typeof value !== 'string') return false
    if (!value.trim()) return false
    if (step.minWords && countWords(value) < step.minWords) return false
    return true
  }
  if (step.inputType === 'select') {
    return typeof value === 'string' && value.length > 0
  }
  if (step.inputType === 'multiselect') {
    return Array.isArray(value) && value.length > 0
  }
  if (step.inputType === 'scale') {
    return typeof value === 'number'
  }
  return false
}

const DEFAULT_AVATAR =
  'https://api.dicebear.com/7.x/personas/svg?seed=alex-default&backgroundColor=f59e0b'

type PersonaSettings = {
  persona?: {
    name?: string
    avatarUrl?: string
  }
}

export default function WizardRunner({ goal }: { goal: WizardGoal }) {
  const router = useRouter()
  const framework = goal.framework.toUpperCase()
  const steps = useMemo(
    () => FRAMEWORK_STEPS[framework] ?? FRAMEWORK_STEPS.GROW,
    [framework],
  )

  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string>(DEFAULT_AVATAR)
  const [coachName, setCoachName] = useState<string>('your coach')

  useEffect(() => {
    let cancelled = false
    fetch('/api/coach/settings', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: PersonaSettings | null) => {
        if (cancelled || !data) return
        if (data.persona?.avatarUrl) setAvatarUrl(data.persona.avatarUrl)
        if (data.persona?.name) setCoachName(data.persona.name)
      })
      .catch(() => {
        // fallback to default — silent
      })
    return () => {
      cancelled = true
    }
  }, [])

  const currentStep = steps[currentIndex]
  const currentValue = answers[currentStep.id] ?? null
  const canAdvance = isAnswerValid(currentStep, currentValue)
  const isLastStep = currentIndex === steps.length - 1
  const progress = Math.round(((currentIndex + 1) / steps.length) * 100)

  const updateAnswer = (value: AnswerValue) => {
    setAnswers((prev) => ({ ...prev, [currentStep.id]: value }))
  }

  const handleNext = async () => {
    if (!canAdvance || submitting) return
    if (!isLastStep) {
      setCurrentIndex((i) => Math.min(steps.length - 1, i + 1))
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      // Normalize wizard answers for the backend. The wizard intentionally
      // captures a richer superset than any single framework schema demands —
      // we inject the required identity field and pass the rest through.
      const normalizedAnswers: Record<string, unknown> = { ...answers }
      if (framework === 'GROW') {
        // Schema requires `goal` — wizard already uses that key.
        // Category comes from the goal record, not the wizard.
        normalizedAnswers.category = goal.category
      } else if (framework === 'WOOP') {
        // Schema requires `wish` — wizard has no `wish` step, derive from goal title.
        if (!normalizedAnswers.wish) normalizedAnswers.wish = goal.title
      } else if (framework === 'IDENTITY') {
        // Schema requires `identity` — wizard already uses that key.
      }

      const res = await fetch('/api/coaching-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalId: goal.id,
          framework,
          answers: normalizedAnswers,
        }),
      })
      if (!res.ok) {
        let message = 'Could not generate your plan. Try again.'
        try {
          const data = (await res.json()) as { error?: string; message?: string }
          if (data?.error) message = data.error
          else if (data?.message) message = data.message
        } catch {
          // ignore
        }
        throw new Error(message)
      }
      const data = (await res.json()) as {
        coachingPlan?: { id?: string }
        id?: string
        plan?: { id?: string }
      }
      const planId = data?.coachingPlan?.id ?? data?.id ?? data?.plan?.id
      if (!planId) {
        throw new Error('Plan created but no ID returned.')
      }
      router.push(`/plan/${planId}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
      setSubmitting(false)
    }
  }

  const handleBack = () => {
    if (submitting) return
    setCurrentIndex((i) => Math.max(0, i - 1))
  }

  if (submitting) {
    return (
      <div className="rounded-3xl border border-amber-400/30 bg-gradient-to-br from-amber-500/10 to-orange-500/5 backdrop-blur p-12 text-center">
        <div className="mx-auto w-28 h-28 rounded-full overflow-hidden border-2 border-amber-400/60 shadow-[0_0_60px_rgba(245,158,11,0.35)] animate-pulse">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={avatarUrl} alt={`${coachName} avatar`} className="w-full h-full object-cover" />
        </div>
        <h2 className="mt-6 text-2xl font-bold text-white tracking-tight">
          {coachName} is writing your plan
        </h2>
        <p className="mt-3 text-zinc-300 max-w-md mx-auto leading-relaxed">
          Weaving your answers into a 66-day plan of tiny, stackable habits using research from
          Lally, Fogg, Clear, and Gollwitzer. This usually takes 10&ndash;30 seconds.
        </p>
        <div className="mt-8 flex justify-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-2 h-2 rounded-full bg-amber-300 animate-pulse"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Progress */}
      <div>
        <div className="flex items-center justify-between text-xs text-zinc-500 mb-2">
          <span>
            Step {currentIndex + 1} of {steps.length}
          </span>
          <span className="text-amber-300">{framework}</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-orange-400 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Goal reminder */}
      <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur px-4 py-3">
        <p className="text-[10px] uppercase tracking-wider text-zinc-500">Your goal</p>
        <p className="text-sm text-zinc-200 mt-0.5 truncate">{goal.title}</p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-2xl border border-rose-400/30 bg-rose-500/10 backdrop-blur p-4 text-sm text-rose-100"
        >
          <p className="font-medium">Something broke</p>
          <p className="text-rose-200/80 mt-1">{error}</p>
          <button
            type="button"
            onClick={() => setError(null)}
            className="mt-3 inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-rose-400/30 bg-rose-500/15 text-rose-100 hover:bg-rose-500/25 transition-colors"
          >
            Try again
          </button>
        </div>
      )}

      {/* Step card */}
      <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-6 sm:p-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          {currentStep.title}
        </h2>
        <p className="text-zinc-400 mt-2">{currentStep.subtitle}</p>

        <div className="mt-6">
          <StepInput step={currentStep} value={currentValue} onChange={updateAnswer} />
        </div>

        {currentStep.helpText && (
          <p className="text-xs text-zinc-500 mt-3 italic">{currentStep.helpText}</p>
        )}

        {currentStep.minWords && typeof currentValue === 'string' && (
          <p
            className={`text-xs mt-2 ${
              countWords(currentValue) >= currentStep.minWords
                ? 'text-emerald-400'
                : 'text-zinc-500'
            }`}
          >
            {countWords(currentValue)} / {currentStep.minWords} words minimum
          </p>
        )}
      </div>

      {/* Nav */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleBack}
          disabled={currentIndex === 0}
          className="inline-flex items-center gap-1.5 text-sm px-4 py-2 rounded-full border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="w-4 h-4"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Back
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={!canAdvance}
          className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-400 text-[#1c1c22] font-semibold text-sm shadow-[0_0_24px_rgba(245,158,11,0.25)] hover:shadow-[0_0_32px_rgba(245,158,11,0.4)] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isLastStep ? 'Generate plan' : 'Next'}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            className="w-4 h-4"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  )
}

function StepInput({
  step,
  value,
  onChange,
}: {
  step: WizardStep
  value: AnswerValue
  onChange: (v: AnswerValue) => void
}) {
  if (step.inputType === 'text') {
    const v = typeof value === 'string' ? value : ''
    return (
      <input
        type="text"
        value={v}
        onChange={(e) => onChange(e.target.value)}
        placeholder={step.placeholder}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-500 focus:border-amber-400/50 focus:outline-none transition-colors"
      />
    )
  }

  if (step.inputType === 'longtext') {
    const v = typeof value === 'string' ? value : ''
    return (
      <textarea
        value={v}
        onChange={(e) => onChange(e.target.value)}
        rows={6}
        placeholder={step.placeholder}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-500 focus:border-amber-400/50 focus:outline-none transition-colors resize-none"
      />
    )
  }

  if (step.inputType === 'select' && step.options) {
    const v = typeof value === 'string' ? value : ''
    return (
      <div className="flex flex-wrap gap-2">
        {step.options.map((opt) => {
          const active = v === opt
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              aria-pressed={active}
              className={`text-sm px-4 py-2 rounded-full border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 ${
                active
                  ? 'bg-amber-500/20 text-amber-200 border-amber-400/40'
                  : 'bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10'
              }`}
            >
              {opt}
            </button>
          )
        })}
      </div>
    )
  }

  if (step.inputType === 'multiselect' && step.options) {
    const current = Array.isArray(value) ? value : []
    const toggle = (opt: string) => {
      if (current.includes(opt)) {
        onChange(current.filter((x) => x !== opt))
      } else {
        onChange([...current, opt])
      }
    }
    return (
      <div className="flex flex-wrap gap-2">
        {step.options.map((opt) => {
          const active = current.includes(opt)
          return (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              aria-pressed={active}
              className={`text-sm px-4 py-2 rounded-full border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 ${
                active
                  ? 'bg-amber-500/20 text-amber-200 border-amber-400/40'
                  : 'bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10'
              }`}
            >
              {active ? '\u2713 ' : ''}
              {opt}
            </button>
          )
        })}
      </div>
    )
  }

  if (step.inputType === 'scale') {
    const min = step.scaleMin ?? 1
    const max = step.scaleMax ?? 10
    const v = typeof value === 'number' ? value : Math.floor((min + max) / 2)
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-500">{step.scaleLow ?? min}</span>
          <span className="text-3xl font-bold text-amber-300 tabular-nums">{v}</span>
          <span className="text-xs text-zinc-500">{step.scaleHigh ?? max}</span>
        </div>
        <input
          type="range"
          min={min}
          max={max}
          value={v}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full accent-amber-400"
          aria-label={step.title}
        />
        <div className="flex justify-between text-[10px] text-zinc-600">
          {Array.from({ length: max - min + 1 }, (_, i) => min + i).map((n) => (
            <span key={n} className={v === n ? 'text-amber-300 font-semibold' : ''}>
              {n}
            </span>
          ))}
        </div>
      </div>
    )
  }

  return null
}
