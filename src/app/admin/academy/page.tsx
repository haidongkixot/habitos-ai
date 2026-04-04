'use client'

import { useEffect, useState } from 'react'

type Chapter = {
  id?: string
  slug: string
  title: string
  subtitle: string
  body: string
  category: string
  orderIndex: number
  imageUrl: string
  readTimeMin: number
  keyTakeaways: string[]
  isActive: boolean
  minPlanSlug: string
  quizData: any
  _count?: { progress: number }
}

const CATEGORIES = ['wellness', 'productivity', 'learning'] as const
const PLANS = ['free', 'starter', 'pro', 'premium'] as const

const PLAN_COLORS: Record<string, string> = {
  free: 'bg-gray-700 text-gray-300',
  starter: 'bg-blue-900 text-blue-300',
  pro: 'bg-purple-900 text-purple-300',
  premium: 'bg-amber-900 text-amber-300',
}

const emptyChapter: Chapter = {
  slug: '',
  title: '',
  subtitle: '',
  body: '',
  category: 'wellness',
  orderIndex: 0,
  imageUrl: '',
  readTimeMin: 5,
  keyTakeaways: [],
  isActive: true,
  minPlanSlug: 'free',
  quizData: null,
}

export default function AdminAcademyPage() {
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<Chapter>({ ...emptyChapter })
  const [takeawayInput, setTakeawayInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Quiz builder
  const [quizQuestions, setQuizQuestions] = useState<{ question: string; options: string[]; correctAnswer: number }[]>([])

  // AI generation
  const [aiTitle, setAiTitle] = useState('')
  const [aiCategory, setAiCategory] = useState('wellness')
  const [aiGenerating, setAiGenerating] = useState(false)

  const fetchChapters = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/academy')
      const data = await res.json()
      setChapters(data.chapters || [])
    } catch { setChapters([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchChapters() }, [])

  const openCreate = () => {
    setEditingId(null)
    setForm({ ...emptyChapter })
    setQuizQuestions([])
    setShowForm(true)
  }

  const openEdit = (ch: Chapter) => {
    setEditingId(ch.id || null)
    setForm({ ...ch })
    setQuizQuestions(ch.quizData?.questions || [])
    setShowForm(true)
  }

  const handleSave = async () => {
    setSaving(true)
    const payload = {
      ...form,
      id: editingId,
      quizData: quizQuestions.length > 0 ? { questions: quizQuestions } : null,
    }
    try {
      const res = await fetch('/api/admin/academy', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        setShowForm(false)
        fetchChapters()
      }
    } catch {}
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/admin/academy?id=${id}`, { method: 'DELETE' })
    setDeletingId(null)
    fetchChapters()
  }

  const toggleActive = async (ch: Chapter) => {
    await fetch('/api/admin/academy', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: ch.id, isActive: !ch.isActive, slug: ch.slug, title: ch.title, body: ch.body, category: ch.category }),
    })
    fetchChapters()
  }

  const addTakeaway = () => {
    if (!takeawayInput.trim()) return
    setForm({ ...form, keyTakeaways: [...form.keyTakeaways, takeawayInput.trim()] })
    setTakeawayInput('')
  }

  const removeTakeaway = (i: number) => {
    setForm({ ...form, keyTakeaways: form.keyTakeaways.filter((_, idx) => idx !== i) })
  }

  const addQuizQuestion = () => {
    setQuizQuestions([...quizQuestions, { question: '', options: ['', '', '', ''], correctAnswer: 0 }])
  }

  const updateQuizQuestion = (idx: number, field: string, value: any) => {
    const updated = [...quizQuestions]
    if (field === 'question') updated[idx].question = value
    else if (field === 'correctAnswer') updated[idx].correctAnswer = value
    else if (field.startsWith('option')) {
      const optIdx = parseInt(field.replace('option', ''))
      updated[idx].options[optIdx] = value
    }
    setQuizQuestions(updated)
  }

  const removeQuizQuestion = (idx: number) => {
    setQuizQuestions(quizQuestions.filter((_, i) => i !== idx))
  }

  const handleAiGenerate = async () => {
    if (!aiTitle.trim()) return
    setAiGenerating(true)
    try {
      const res = await fetch('/api/admin/academy/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: aiTitle, category: aiCategory }),
      })
      const data = await res.json()
      if (data.result) {
        setForm({
          ...form,
          title: aiTitle,
          slug: aiTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
          category: aiCategory,
          subtitle: data.result.subtitle || '',
          body: data.result.body || '',
          keyTakeaways: data.result.keyTakeaways || [],
          readTimeMin: data.result.readTimeMin || 5,
        })
        if (data.result.quizData?.questions) {
          setQuizQuestions(data.result.quizData.questions)
        }
        setShowForm(true)
      }
    } catch {}
    finally { setAiGenerating(false) }
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Academy</h1>
          <p className="text-gray-400">Manage educational chapters and quizzes</p>
        </div>
        <button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
          + Add Chapter
        </button>
      </div>

      {/* AI Generate Section */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="font-semibold text-white mb-4">Generate with AI</h3>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-sm text-gray-400 mb-1">Chapter Title</label>
            <input value={aiTitle} onChange={(e) => setAiTitle(e.target.value)} placeholder="e.g. The Habit Loop" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Category</label>
            <select value={aiCategory} onChange={(e) => setAiCategory(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <button onClick={handleAiGenerate} disabled={aiGenerating || !aiTitle.trim()} className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-medium transition-colors whitespace-nowrap">
            {aiGenerating ? 'Generating...' : 'Generate'}
          </button>
        </div>
      </div>

      {/* Chapters Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-800 bg-gray-950">
            <tr>
              <th className="text-left px-6 py-4 text-gray-400 font-medium">Order</th>
              <th className="text-left px-6 py-4 text-gray-400 font-medium">Title</th>
              <th className="text-left px-6 py-4 text-gray-400 font-medium">Category</th>
              <th className="text-left px-6 py-4 text-gray-400 font-medium">Plan</th>
              <th className="text-left px-6 py-4 text-gray-400 font-medium">Read Time</th>
              <th className="text-left px-6 py-4 text-gray-400 font-medium">Active</th>
              <th className="text-right px-6 py-4 text-gray-400 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">Loading...</td></tr>
            ) : chapters.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">No chapters yet</td></tr>
            ) : chapters.map((ch) => (
              <tr key={ch.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                <td className="px-6 py-4 text-gray-300">{ch.orderIndex}</td>
                <td className="px-6 py-4">
                  <div className="font-medium text-white">{ch.title}</div>
                  <div className="text-xs text-gray-500">{ch.slug}</div>
                </td>
                <td className="px-6 py-4"><span className="px-2 py-1 rounded-full text-xs bg-emerald-900 text-emerald-300">{ch.category}</span></td>
                <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs ${PLAN_COLORS[ch.minPlanSlug] || PLAN_COLORS.free}`}>{ch.minPlanSlug}</span></td>
                <td className="px-6 py-4 text-gray-400">{ch.readTimeMin} min</td>
                <td className="px-6 py-4">
                  <button onClick={() => toggleActive(ch)} className={`w-10 h-5 rounded-full transition-colors ${ch.isActive ? 'bg-emerald-500' : 'bg-gray-600'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${ch.isActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => openEdit(ch)} className="text-emerald-400 hover:underline mr-3">Edit</button>
                  {deletingId === ch.id ? (
                    <span>
                      <button onClick={() => handleDelete(ch.id!)} className="text-red-400 hover:underline mr-2">Confirm</button>
                      <button onClick={() => setDeletingId(null)} className="text-gray-500 hover:underline">Cancel</button>
                    </span>
                  ) : (
                    <button onClick={() => setDeletingId(ch.id!)} className="text-red-400 hover:underline">Delete</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 bg-black/70 overflow-auto">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-xl w-full max-w-3xl mx-4 mb-10">
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">{editingId ? 'Edit Chapter' : 'Create Chapter'}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-white">X</button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Title</label>
                  <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Slug</label>
                  <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Subtitle</label>
                <input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Category</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white">
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Min Plan</label>
                  <select value={form.minPlanSlug} onChange={(e) => setForm({ ...form, minPlanSlug: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white">
                    {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Order Index</label>
                  <input type="number" value={form.orderIndex} onChange={(e) => setForm({ ...form, orderIndex: parseInt(e.target.value) || 0 })} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Body (Markdown)</label>
                <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={12} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white font-mono text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Key Takeaways</label>
                <div className="flex gap-2 mb-2">
                  <input value={takeawayInput} onChange={(e) => setTakeawayInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTakeaway())} placeholder="Add a takeaway..." className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500" />
                  <button onClick={addTakeaway} className="bg-emerald-600 text-white px-4 py-2 rounded-lg">Add</button>
                </div>
                {form.keyTakeaways.map((t, i) => (
                  <div key={i} className="flex items-center gap-2 mb-1">
                    <span className="flex-1 text-sm text-gray-300 bg-gray-800 px-3 py-1 rounded">{t}</span>
                    <button onClick={() => removeTakeaway(i)} className="text-red-400 hover:text-red-300 text-sm">Remove</button>
                  </div>
                ))}
              </div>

              {/* Quiz Builder */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-400">Quiz Questions</label>
                  <button onClick={addQuizQuestion} className="text-emerald-400 text-sm hover:underline">+ Add Question</button>
                </div>
                {quizQuestions.map((q, qi) => (
                  <div key={qi} className="border border-gray-700 rounded-lg p-4 mb-3 bg-gray-800">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs font-medium text-gray-500">Question {qi + 1}</span>
                      <button onClick={() => removeQuizQuestion(qi)} className="text-red-400 text-xs hover:underline">Remove</button>
                    </div>
                    <input value={q.question} onChange={(e) => updateQuizQuestion(qi, 'question', e.target.value)} placeholder="Question text" className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 mb-2 text-sm text-white" />
                    {q.options.map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-2 mb-1">
                        <input type="radio" name={`q${qi}`} checked={q.correctAnswer === oi} onChange={() => updateQuizQuestion(qi, 'correctAnswer', oi)} />
                        <input value={opt} onChange={(e) => updateQuizQuestion(qi, `option${oi}`, e.target.value)} placeholder={`Option ${oi + 1}`} className="flex-1 bg-gray-900 border border-gray-700 rounded px-3 py-1 text-sm text-white" />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-gray-700">
              <button onClick={() => setShowForm(false)} className="px-6 py-2 border border-gray-700 rounded-lg text-gray-400 hover:bg-gray-800">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.title || !form.slug || !form.body} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg font-medium">
                {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
