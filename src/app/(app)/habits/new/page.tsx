'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const CATEGORIES = ['general', 'health', 'fitness', 'mindfulness', 'learning', 'nutrition', 'sleep', 'social', 'creativity', 'productivity']
const COLORS = ['#10b981', '#6366f1', '#ec4899', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6', '#f97316']

export default function NewHabitPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('general')
  const [frequency, setFrequency] = useState('daily')
  const [color, setColor] = useState('#10b981')
  const [loading, setLoading] = useState(false)

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

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-3xl font-bold text-white mb-6">New Habit</h1>
      <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5">
        <div>
          <label className="text-sm text-gray-400">Habit Name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} required maxLength={100}
            placeholder="e.g., Meditate for 10 minutes"
            className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:border-emerald-500 focus:outline-none" />
        </div>
        <div>
          <label className="text-sm text-gray-400">Description (optional)</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} maxLength={500}
            className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:border-emerald-500 focus:outline-none resize-none" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-400">Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:border-emerald-500 focus:outline-none">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-400">Frequency</label>
            <select value={frequency} onChange={e => setFrequency(e.target.value)}
              className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:border-emerald-500 focus:outline-none">
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
          className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white py-2.5 rounded-lg font-medium transition-colors">
          {loading ? 'Creating...' : 'Create Habit'}
        </button>
      </form>
    </div>
  )
}