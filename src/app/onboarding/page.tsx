'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const GOALS = [
  { id: 'build-habits', label: 'Build Habits', icon: '🌱', desc: 'Develop consistent daily routines' },
  { id: 'improve-health', label: 'Improve Health', icon: '💪', desc: 'Exercise, nutrition, and wellness' },
  { id: 'boost-productivity', label: 'Boost Productivity', icon: '⚡', desc: 'Get more done with less stress' },
  { id: 'mindfulness', label: 'Mindfulness', icon: '🧘', desc: 'Meditation, journaling, and calm' },
]

const EXPERIENCE = [
  { id: 'beginner', label: 'Beginner', desc: 'New to habit tracking' },
  { id: 'intermediate', label: 'Intermediate', desc: 'Tried before, want to improve' },
  { id: 'advanced', label: 'Advanced', desc: 'Experienced habit builder' },
]

const TIMES = [
  { id: 'morning', label: 'Morning', icon: '🌅' },
  { id: 'afternoon', label: 'Afternoon', icon: '☀️' },
  { id: 'evening', label: 'Evening', icon: '🌙' },
  { id: 'flexible', label: 'Flexible', icon: '🔄' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [goal, setGoal] = useState('')
  const [experience, setExperience] = useState('')
  const [preferredTime, setPreferredTime] = useState('')
  const [saving, setSaving] = useState(false)

  const canNext = step === 0 ? !!goal : step === 1 ? !!experience : !!preferredTime

  const handleFinish = async () => {
    setSaving(true)
    try {
      await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal, experience, preferredTime }),
      })
      router.push('/dashboard')
    } catch {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        {/* Progress bar */}
        <div className="flex gap-2 mb-8">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? 'bg-emerald-500' : 'bg-gray-800'}`}
            />
          ))}
        </div>

        <div className="text-center mb-2">
          <span className="text-emerald-400 text-xs font-medium">Step {step + 1} of 3</span>
        </div>

        {/* Step 0: Goal */}
        {step === 0 && (
          <div>
            <h1 className="text-2xl font-bold text-white text-center mb-2">What is your main goal?</h1>
            <p className="text-gray-400 text-sm text-center mb-8">We will personalize your experience</p>
            <div className="space-y-3">
              {GOALS.map(g => (
                <button
                  key={g.id}
                  onClick={() => setGoal(g.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-colors text-left ${
                    goal === g.id
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-gray-800 bg-gray-900 hover:border-gray-700'
                  }`}
                >
                  <span className="text-2xl">{g.icon}</span>
                  <div>
                    <div className="text-white font-medium text-sm">{g.label}</div>
                    <div className="text-gray-400 text-xs">{g.desc}</div>
                  </div>
                  {goal === g.id && (
                    <svg className="w-5 h-5 text-emerald-400 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Experience */}
        {step === 1 && (
          <div>
            <h1 className="text-2xl font-bold text-white text-center mb-2">Your experience level?</h1>
            <p className="text-gray-400 text-sm text-center mb-8">This helps us set the right pace</p>
            <div className="space-y-3">
              {EXPERIENCE.map(e => (
                <button
                  key={e.id}
                  onClick={() => setExperience(e.id)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border transition-colors text-left ${
                    experience === e.id
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-gray-800 bg-gray-900 hover:border-gray-700'
                  }`}
                >
                  <div>
                    <div className="text-white font-medium text-sm">{e.label}</div>
                    <div className="text-gray-400 text-xs">{e.desc}</div>
                  </div>
                  {experience === e.id && (
                    <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Preferred Time */}
        {step === 2 && (
          <div>
            <h1 className="text-2xl font-bold text-white text-center mb-2">When do you prefer to build habits?</h1>
            <p className="text-gray-400 text-sm text-center mb-8">We will send reminders at the right time</p>
            <div className="grid grid-cols-2 gap-3">
              {TIMES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setPreferredTime(t.id)}
                  className={`flex flex-col items-center gap-2 p-6 rounded-xl border transition-colors ${
                    preferredTime === t.id
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-gray-800 bg-gray-900 hover:border-gray-700'
                  }`}
                >
                  <span className="text-3xl">{t.icon}</span>
                  <span className="text-white text-sm font-medium">{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-8">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 py-3 rounded-xl text-sm font-medium bg-gray-800 hover:bg-gray-700 text-white transition-colors"
            >
              Back
            </button>
          )}
          {step < 2 ? (
            <button
              onClick={() => canNext && setStep(step + 1)}
              disabled={!canNext}
              className="flex-1 py-3 rounded-xl text-sm font-medium bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:hover:bg-emerald-500 text-white transition-colors"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={!canNext || saving}
              className="flex-1 py-3 rounded-xl text-sm font-medium bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white transition-colors"
            >
              {saving ? 'Setting up...' : 'Get Started'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
