'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Template = {
  id: string
  name: string
  description: string
  category: string
  frequency: string
  icon: string
  color: string
  packName: string
  difficulty: string
  benefits: string[]
}

const CATEGORIES = ['general', 'health', 'fitness', 'mindfulness', 'learning', 'nutrition', 'sleep', 'social', 'creativity', 'productivity']
const COLORS = ['#10b981', '#6366f1', '#ec4899', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6', '#f97316']

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: 'bg-emerald-500/20 text-emerald-400',
  intermediate: 'bg-amber-500/20 text-amber-400',
  advanced: 'bg-red-500/20 text-red-400',
}

export default function NewHabitPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('general')
  const [frequency, setFrequency] = useState('daily')
  const [color, setColor] = useState('#10b981')
  const [loading, setLoading] = useState(false)

  // Templates state
  const [packs, setPacks] = useState<Record<string, Template[]>>({})
  const [loadingTemplates, setLoadingTemplates] = useState(true)
  const [adoptingId, setAdoptingId] = useState<string | null>(null)
  const [showTemplates, setShowTemplates] = useState(true)

  useEffect(() => {
    fetch('/api/templates')
      .then((res) => res.json())
      .then((data) => setPacks(data.packs || {}))
      .catch(() => setPacks({}))
      .finally(() => setLoadingTemplates(false))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    const res = await fetch('/api/habits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, category, frequency, color }),
    })
    if (res.ok) router.push('/dashboard')
    else setLoading(false)
  }

  const handleUseTemplate = (t: Template) => {
    setName(t.name)
    setDescription(t.description || '')
    setCategory(t.category)
    setFrequency(t.frequency)
    setColor(t.color)
    setShowTemplates(false)
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleAdoptTemplate = async (templateId: string) => {
    setAdoptingId(templateId)
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId }),
      })
      if (res.ok) {
        router.push('/dashboard')
      }
    } finally {
      setAdoptingId(null)
    }
  }

  const packEntries = Object.entries(packs)
  const hasTemplates = packEntries.length > 0

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-6">New Habit</h1>

      {/* Browse Templates Section */}
      {hasTemplates && (
        <div className="mb-8">
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="flex items-center gap-2 text-sm font-medium text-emerald-400 hover:text-emerald-300 mb-4 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition-transform ${showTemplates ? 'rotate-90' : ''}`}
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
            Browse Templates
            <span className="text-gray-500 text-xs font-normal">
              ({Object.values(packs).flat().length} available)
            </span>
          </button>

          {showTemplates && (
            <div className="space-y-6">
              {loadingTemplates ? (
                <div className="text-gray-500 text-sm py-4">Loading templates...</div>
              ) : (
                packEntries.map(([packName, templates]) => (
                  <div key={packName}>
                    <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                      <span className="text-emerald-400 text-xs">&#9632;</span>
                      {packName}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {templates.map((t) => (
                        <div
                          key={t.id}
                          className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 hover:border-gray-600 transition-colors group"
                        >
                          <div className="flex items-start gap-3 mb-2">
                            <span
                              className="text-2xl flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg"
                              style={{ backgroundColor: t.color + '20' }}
                            >
                              {t.icon}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="text-white text-sm font-medium truncate">
                                {t.name}
                              </div>
                              <div className="text-gray-500 text-xs mt-0.5 line-clamp-2">
                                {t.description}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-xs text-gray-500 capitalize">{t.frequency}</span>
                            <span className="text-gray-700">&#183;</span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                                DIFFICULTY_COLORS[t.difficulty] || 'bg-gray-700 text-gray-300'
                              }`}
                            >
                              {t.difficulty}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleUseTemplate(t)}
                              className="flex-1 py-1.5 rounded-lg text-xs font-medium bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                            >
                              Customize
                            </button>
                            <button
                              onClick={() => handleAdoptTemplate(t.id)}
                              disabled={adoptingId === t.id}
                              className="flex-1 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                            >
                              {adoptingId === t.id ? 'Adding...' : 'Use Template'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Divider */}
      {hasTemplates && (
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-gray-800" />
          <span className="text-xs text-gray-500 uppercase tracking-wider">Or create your own</span>
          <div className="flex-1 h-px bg-gray-800" />
        </div>
      )}

      {/* Manual Create Form */}
      <form onSubmit={handleSubmit} className="card space-y-5">
        <div>
          <label className="text-sm text-gray-400">Habit Name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} required maxLength={100}
            placeholder="e.g., Meditate for 10 minutes"
            className="input-field w-full mt-1" />
        </div>
        <div>
          <label className="text-sm text-gray-400">Description (optional)</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} maxLength={500}
            className="input-field w-full mt-1 resize-none" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-400">Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="input-field w-full mt-1">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-400">Frequency</label>
            <select value={frequency} onChange={e => setFrequency(e.target.value)}
              className="input-field w-full mt-1">
              <option value="daily">Daily</option>
              <option value="weekdays">Weekdays</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-sm text-gray-400 mb-2 block">Color</label>
          <div className="flex gap-2">
            {COLORS.map(c => (
              <button key={c} type="button" onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-full transition-all ${color === c ? 'ring-2 ring-white scale-110' : 'hover:scale-105'}`}
                style={{ backgroundColor: c }} />
            ))}
          </div>
        </div>
        <button type="submit" disabled={loading}
          className="btn-primary w-full disabled:opacity-50 justify-center">
          {loading ? 'Creating...' : 'Create Habit'}
        </button>
      </form>
    </div>
  )
}
