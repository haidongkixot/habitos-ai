'use client'

import { useEffect, useState } from 'react'

type Template = {
  id?: string
  name: string
  description: string
  category: string
  frequency: string
  icon: string
  color: string
  packName: string
  difficulty: string
  benefits: string[]
  isActive?: boolean
  sortOrder?: number
}

const CATEGORIES = ['all', 'wellness', 'fitness', 'learning', 'health', 'productivity', 'mindfulness', 'social', 'creative'] as const
const CATEGORY_OPTIONS = CATEGORIES.filter((c) => c !== 'all')

const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const

const COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899']

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: 'bg-emerald-500/20 text-emerald-400',
  intermediate: 'bg-amber-500/20 text-amber-400',
  advanced: 'bg-red-500/20 text-red-400',
}

const CATEGORY_COLORS: Record<string, string> = {
  wellness: 'bg-blue-500/20 text-blue-400',
  fitness: 'bg-orange-500/20 text-orange-400',
  learning: 'bg-violet-500/20 text-violet-400',
  health: 'bg-emerald-500/20 text-emerald-400',
  productivity: 'bg-amber-500/20 text-amber-400',
  mindfulness: 'bg-purple-500/20 text-purple-400',
  social: 'bg-pink-500/20 text-pink-400',
  creative: 'bg-cyan-500/20 text-cyan-400',
  general: 'bg-gray-500/20 text-gray-400',
}

const emptyTemplate: Template = {
  name: '',
  description: '',
  category: 'wellness',
  frequency: 'daily',
  icon: '⭐',
  color: '#10B981',
  packName: 'General',
  difficulty: 'beginner',
  benefits: [],
}

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [filterCategory, setFilterCategory] = useState('all')
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)

  // Create/Edit form
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<Template>({ ...emptyTemplate })
  const [benefitInput, setBenefitInput] = useState('')
  const [saving, setSaving] = useState(false)

  // AI generation modal
  const [showAiModal, setShowAiModal] = useState(false)
  const [aiForm, setAiForm] = useState({ packName: 'Morning Routine', category: 'wellness', count: 5, theme: '' })
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiPreview, setAiPreview] = useState<Template[]>([])
  const [aiSaving, setAiSaving] = useState(false)

  // Delete confirm
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchTemplates = async () => {
    setLoading(true)
    try {
      const url =
        filterCategory === 'all'
          ? '/api/admin/templates'
          : `/api/admin/templates?category=${filterCategory}`
      const res = await fetch(url)
      const data = await res.json()
      setTemplates(data.templates || [])
    } catch {
      setTemplates([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTemplates()
  }, [filterCategory])

  const handleToggle = async (t: Template) => {
    if (!t.id) return
    setToggling(t.id)
    try {
      const res = await fetch('/api/admin/templates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: t.id, isActive: !t.isActive }),
      })
      if (res.ok) {
        setTemplates((prev) =>
          prev.map((x) => (x.id === t.id ? { ...x, isActive: !t.isActive } : x))
        )
      }
    } finally {
      setToggling(null)
    }
  }

  const openCreate = () => {
    setEditingId(null)
    setForm({ ...emptyTemplate })
    setBenefitInput('')
    setShowForm(true)
  }

  const openEdit = (t: Template) => {
    setEditingId(t.id || null)
    setForm({ ...t })
    setBenefitInput('')
    setShowForm(true)
  }

  const addBenefit = () => {
    const val = benefitInput.trim()
    if (val && !form.benefits.includes(val)) {
      setForm({ ...form, benefits: [...form.benefits, val] })
      setBenefitInput('')
    }
  }

  const removeBenefit = (b: string) => {
    setForm({ ...form, benefits: form.benefits.filter((x) => x !== b) })
  }

  const handleSave = async () => {
    if (!form.name || !form.description || !form.category) return
    setSaving(true)
    try {
      const method = editingId ? 'PATCH' : 'POST'
      const payload = editingId ? { id: editingId, ...form } : form
      const res = await fetch('/api/admin/templates', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        setShowForm(false)
        fetchTemplates()
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch('/api/admin/templates', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (res.ok) {
        setTemplates((prev) => prev.filter((t) => t.id !== id))
        setDeletingId(null)
      }
    } catch {
      /* ignore */
    }
  }

  // AI generation
  const handleGenerate = async () => {
    setAiGenerating(true)
    setAiPreview([])
    try {
      const res = await fetch('/api/admin/templates/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aiForm),
      })
      const data = await res.json()
      if (data.templates) {
        setAiPreview(data.templates)
      }
    } catch {
      /* ignore */
    } finally {
      setAiGenerating(false)
    }
  }

  const updateAiPreview = (index: number, field: keyof Template, value: string) => {
    setAiPreview((prev) =>
      prev.map((t, i) => (i === index ? { ...t, [field]: value } : t))
    )
  }

  const removeAiPreview = (index: number) => {
    setAiPreview((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSaveAllAi = async () => {
    setAiSaving(true)
    try {
      for (const t of aiPreview) {
        await fetch('/api/admin/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(t),
        })
      }
      setShowAiModal(false)
      setAiPreview([])
      fetchTemplates()
    } finally {
      setAiSaving(false)
    }
  }

  // Group templates by packName
  const grouped: Record<string, Template[]> = {}
  for (const t of templates) {
    const pack = t.packName || 'General'
    if (!grouped[pack]) grouped[pack] = []
    grouped[pack].push(t)
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Habit Templates</h1>
          <p className="text-gray-400 text-sm mt-1">
            Manage habit templates that users can browse and adopt
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setShowAiModal(true)
              setAiPreview([])
            }}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-purple-500/20 text-purple-400 border border-purple-500/40 hover:bg-purple-500/30 transition-colors"
          >
            Generate Pack with AI
          </button>
          <button
            onClick={openCreate}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30 transition-colors"
          >
            + Create Template
          </button>
        </div>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
              filterCategory === cat
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Templates grouped by pack */}
      {loading ? (
        <div className="text-center text-gray-500 py-16">Loading...</div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="text-center text-gray-500 py-16">
          No templates found. Create one or generate a pack with AI.
        </div>
      ) : (
        Object.entries(grouped).map(([packName, packTemplates]) => (
          <div key={packName} className="mb-8">
            <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <span className="text-emerald-400">&#9632;</span> {packName}
              <span className="text-xs text-gray-500 font-normal">
                ({packTemplates.length} template{packTemplates.length !== 1 ? 's' : ''})
              </span>
            </h2>
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Icon
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Difficulty
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Frequency
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Active
                      </th>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {packTemplates.map((t) => (
                      <tr key={t.id} className="hover:bg-gray-800/40 transition-colors">
                        <td className="px-5 py-3 text-xl">{t.icon}</td>
                        <td className="px-5 py-3">
                          <div className="text-white font-medium">{t.name}</div>
                          <div className="text-gray-500 text-xs mt-0.5 max-w-xs truncate">
                            {t.description}
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                              CATEGORY_COLORS[t.category] || 'bg-gray-700 text-gray-300'
                            }`}
                          >
                            {t.category}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                              DIFFICULTY_COLORS[t.difficulty] || 'bg-gray-700 text-gray-300'
                            }`}
                          >
                            {t.difficulty}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-gray-400 capitalize">{t.frequency}</td>
                        <td className="px-5 py-3">
                          <button
                            onClick={() => handleToggle(t)}
                            disabled={toggling === t.id}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
                              t.isActive ? 'bg-emerald-500' : 'bg-gray-600'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                t.isActive ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEdit(t)}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                            >
                              Edit
                            </button>
                            {deletingId === t.id ? (
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleDelete(t.id!)}
                                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/30 text-red-400 hover:bg-red-500/40"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => setDeletingId(null)}
                                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-700 text-gray-400 hover:bg-gray-600"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeletingId(t.id || null)}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))
      )}

      {/* Create/Edit form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-white mb-4">
              {editingId ? 'Edit Template' : 'Create Template'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                  placeholder="e.g., Morning Meditation"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400">Description *</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500 resize-none"
                  placeholder="Why this habit matters and how to do it"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400">Category *</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Frequency</label>
                  <select
                    value={form.frequency}
                    onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekdays">Weekdays</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400">Pack Name</label>
                  <input
                    type="text"
                    value={form.packName}
                    onChange={(e) => setForm({ ...form, packName: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                    placeholder="e.g., Morning Routine"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400">Difficulty</label>
                  <select
                    value={form.difficulty}
                    onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                  >
                    {DIFFICULTIES.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400">Icon (emoji)</label>
                  <input
                    type="text"
                    value={form.icon}
                    onChange={(e) => setForm({ ...form, icon: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                    placeholder="⭐"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Color</label>
                  <div className="flex gap-2 mt-1">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setForm({ ...form, color: c })}
                        className={`w-7 h-7 rounded-full transition-all ${
                          form.color === c ? 'ring-2 ring-white scale-110' : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-400">Benefits</label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="text"
                    value={benefitInput}
                    onChange={(e) => setBenefitInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addBenefit()
                      }
                    }}
                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                    placeholder="Add a benefit and press Enter"
                  />
                  <button
                    type="button"
                    onClick={addBenefit}
                    className="px-3 py-2 bg-gray-700 text-gray-300 rounded-lg text-sm hover:bg-gray-600"
                  >
                    Add
                  </button>
                </div>
                {form.benefits.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {form.benefits.map((b) => (
                      <span
                        key={b}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-800 text-gray-300 text-xs rounded-full"
                      >
                        {b}
                        <button
                          type="button"
                          onClick={() => removeBenefit(b)}
                          className="text-gray-500 hover:text-red-400"
                        >
                          x
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-800 text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !form.name || !form.description}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Generation Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-white mb-1">Generate Pack with AI</h2>
            <p className="text-gray-500 text-sm mb-5">
              Let AI create a pack of habit templates for you to review and save.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm text-gray-400">Pack Name</label>
                <input
                  type="text"
                  value={aiForm.packName}
                  onChange={(e) => setAiForm({ ...aiForm, packName: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
                  placeholder="e.g., Morning Routine"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400">Category</label>
                <select
                  value={aiForm.category}
                  onChange={(e) => setAiForm({ ...aiForm, category: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-400">Count (3-8)</label>
                <input
                  type="number"
                  min={3}
                  max={8}
                  value={aiForm.count}
                  onChange={(e) =>
                    setAiForm({ ...aiForm, count: Math.min(8, Math.max(3, Number(e.target.value))) })
                  }
                  className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400">Theme (optional)</label>
                <input
                  type="text"
                  value={aiForm.theme}
                  onChange={(e) => setAiForm({ ...aiForm, theme: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
                  placeholder="e.g., for busy professionals"
                />
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={aiGenerating || !aiForm.packName}
              className="w-full py-2.5 rounded-lg text-sm font-medium bg-purple-500/20 text-purple-400 border border-purple-500/40 hover:bg-purple-500/30 transition-colors disabled:opacity-50 mb-5"
            >
              {aiGenerating ? 'Generating...' : 'Generate Templates'}
            </button>

            {/* Preview generated templates */}
            {aiPreview.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-3">
                  Generated Templates ({aiPreview.length})
                </h3>
                <div className="space-y-3 mb-5">
                  {aiPreview.map((t, i) => (
                    <div
                      key={i}
                      className="bg-gray-800 border border-gray-700 rounded-xl p-4"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{t.icon}</span>
                          <input
                            type="text"
                            value={t.name}
                            onChange={(e) => updateAiPreview(i, 'name', e.target.value)}
                            className="bg-transparent text-white font-medium text-sm focus:outline-none border-b border-transparent hover:border-gray-600 focus:border-emerald-500"
                          />
                        </div>
                        <button
                          onClick={() => removeAiPreview(i)}
                          className="text-gray-500 hover:text-red-400 text-xs"
                        >
                          Remove
                        </button>
                      </div>
                      <textarea
                        value={t.description}
                        onChange={(e) => updateAiPreview(i, 'description', e.target.value)}
                        rows={2}
                        className="w-full bg-transparent text-gray-400 text-xs focus:outline-none resize-none border-b border-transparent hover:border-gray-600 focus:border-emerald-500"
                      />
                      <div className="flex gap-2 mt-2 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                            CATEGORY_COLORS[t.category] || 'bg-gray-700 text-gray-300'
                          }`}
                        >
                          {t.category}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                            DIFFICULTY_COLORS[t.difficulty] || 'bg-gray-700 text-gray-300'
                          }`}
                        >
                          {t.difficulty}
                        </span>
                        {t.benefits?.map((b, bi) => (
                          <span
                            key={bi}
                            className="px-2 py-0.5 rounded-full text-xs bg-gray-700 text-gray-400"
                          >
                            {b}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleSaveAllAi}
                  disabled={aiSaving}
                  className="w-full py-2.5 rounded-lg text-sm font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                >
                  {aiSaving ? 'Saving...' : `Save All ${aiPreview.length} Templates`}
                </button>
              </div>
            )}

            <div className="flex justify-end mt-4">
              <button
                onClick={() => {
                  setShowAiModal(false)
                  setAiPreview([])
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-800 text-gray-400 hover:text-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
