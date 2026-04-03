'use client'
import { useEffect, useState } from 'react'

interface Post { id: string; title: string; slug: string; published: boolean; createdAt: string }

const SITE_CONTENT_KEYS = [
  { key: 'hero_title', label: 'Hero Title', placeholder: 'Show up every day.' },
  { key: 'hero_subtitle', label: 'Hero Subtitle', placeholder: 'The rest follows.' },
  { key: 'hero_description', label: 'Hero Description', placeholder: 'A simple system that tracks what you do...' },
  { key: 'stats_users', label: 'Stat: Active Users', placeholder: '18,000+' },
  { key: 'stats_habits', label: 'Stat: Habits Tracked', placeholder: '250,000+' },
  { key: 'stats_streaks', label: 'Stat: Avg Completion Rate', placeholder: '78%' },
]

export default function AdminCmsPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)

  // AI generation state
  const [showAiModal, setShowAiModal] = useState(false)
  const [aiTopic, setAiTopic] = useState('')
  const [aiTone, setAiTone] = useState('educational')
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiPreview, setAiPreview] = useState<any>(null)
  const [aiError, setAiError] = useState('')
  const [aiSaving, setAiSaving] = useState(false)

  const load = () => {
    setLoading(true)
    fetch('/api/admin/blog').then(r => r.json()).then(d => setPosts(d.posts || [])).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(d => {
        const flat: Record<string, string> = {}
        for (const [k, v] of Object.entries(d.settings || {})) {
          flat[k] = typeof v === 'string' ? v : JSON.stringify(v)
        }
        setSettings(flat)
      })
      .catch(() => {})
  }, [])

  const create = async () => {
    if (!newTitle.trim()) return
    setCreating(true)
    await fetch('/api/admin/blog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle }),
    })
    setNewTitle('')
    setCreating(false)
    load()
  }

  const toggleStatus = async (post: Post) => {
    await fetch('/api/admin/blog', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: post.id, published: !post.published }),
    })
    load()
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this post?')) return
    await fetch('/api/admin/blog', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    load()
  }

  async function saveSetting(key: string) {
    setSaving(key)
    await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value: settings[key] ?? '' }),
    })
    setSaving(null)
    setSaved(key)
    setTimeout(() => setSaved(null), 2000)
  }

  // AI generation handlers
  const generateWithAI = async () => {
    if (!aiTopic.trim()) return
    setAiGenerating(true)
    setAiError('')
    setAiPreview(null)
    try {
      const res = await fetch('/api/admin/blog/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: aiTopic, tone: aiTone }),
      })
      const data = await res.json()
      if (data.error) { setAiError(data.error); return }
      setAiPreview(data.post)
    } catch (e) { setAiError('Generation failed. Try again.') }
    finally { setAiGenerating(false) }
  }

  const saveAiPost = async () => {
    if (!aiPreview) return
    setAiSaving(true)
    try {
      // Create the post first
      const createRes = await fetch('/api/admin/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: aiPreview.title }),
      })
      const created = await createRes.json()
      // Update with generated content
      await fetch('/api/admin/blog', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: created.id,
          title: aiPreview.title,
          content: aiPreview.body,
          excerpt: aiPreview.excerpt,
        }),
      })
      setShowAiModal(false)
      setAiPreview(null)
      setAiTopic('')
      load()
    } catch { setAiError('Failed to save post') }
    finally { setAiSaving(false) }
  }

  return (
    <div className="p-8 space-y-8">
      {/* Blog CMS */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Blog / CMS</h1>
          <p className="text-gray-400 text-sm mt-1">Manage published content and blog posts</p>
        </div>
        <button onClick={() => setShowAiModal(true)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2">
          <span>&#x1F916;</span> Generate Blog Post
        </button>
      </div>

      <div className="flex gap-3">
        <input
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && create()}
          placeholder="New post title..."
          className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
        />
        <button
          onClick={create}
          disabled={creating || !newTitle.trim()}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium disabled:opacity-50 transition-colors"
        >
          {creating ? 'Creating...' : '+ New Post'}
        </button>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Title</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Slug</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Created</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Loading...</td></tr>
            ) : posts.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No posts yet. Create your first post above.</td></tr>
            ) : posts.map(post => (
              <tr key={post.id} className="hover:bg-gray-800/40 transition-colors">
                <td className="px-6 py-4 text-white font-medium">{post.title}</td>
                <td className="px-6 py-4 text-gray-400 font-mono text-xs">{post.slug}</td>
                <td className="px-6 py-4">
                  <button onClick={() => toggleStatus(post)} className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    post.published ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-700 text-gray-400'
                  }`}>
                    {post.published ? 'published' : 'draft'}
                  </button>
                </td>
                <td className="px-6 py-4 text-gray-500">{new Date(post.createdAt).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  <button onClick={() => remove(post.id)} className="text-red-400 hover:text-red-300 text-xs transition-colors">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Site Content */}
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Site Content</h2>
        <p className="text-gray-400 text-sm mb-6">Edit hero text and front page content. Leave blank to use defaults.</p>
        <div className="space-y-4">
          {SITE_CONTENT_KEYS.map(({ key, label, placeholder }) => (
            <div key={key} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={settings[key] ?? ''}
                  onChange={(e) => setSettings((prev) => ({ ...prev, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="flex-1 bg-gray-950 border border-gray-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
                <button
                  onClick={() => saveSetting(key)}
                  disabled={saving === key}
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium disabled:opacity-50 transition-colors"
                >
                  {saved === key ? 'Saved!' : saving === key ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Generation Modal */}
      {showAiModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => !aiGenerating && setShowAiModal(false)}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-xl font-bold text-white">Generate Blog Post with AI</h2>
              <p className="text-sm text-gray-400 mt-1">Enter a topic and tone to generate a blog post about habits, productivity, or wellness.</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Topic</label>
                <input value={aiTopic} onChange={e => setAiTopic(e.target.value)}
                  placeholder="e.g. How to build a morning routine that sticks"
                  className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Tone</label>
                <select value={aiTone} onChange={e => setAiTone(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-2 text-white text-sm">
                  <option value="educational">Educational</option>
                  <option value="inspirational">Inspirational</option>
                  <option value="scientific">Scientific</option>
                </select>
              </div>
              {!aiPreview && (
                <button onClick={generateWithAI} disabled={aiGenerating || !aiTopic.trim()}
                  className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-medium disabled:opacity-50 transition-colors">
                  {aiGenerating ? 'Generating...' : 'Generate with AI'}
                </button>
              )}
              {aiError && <p className="text-red-400 text-sm">{aiError}</p>}

              {/* Preview */}
              {aiPreview && (
                <div className="space-y-3 border border-gray-800 rounded-xl p-4 bg-gray-950">
                  <h3 className="font-bold text-white">{aiPreview.title}</h3>
                  <p className="text-sm text-gray-400 italic">{aiPreview.excerpt}</p>
                  <div className="flex gap-1 flex-wrap">
                    {(aiPreview.tags || []).map((t: string) => (
                      <span key={t} className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full text-xs">{t}</span>
                    ))}
                  </div>
                  <pre className="text-xs text-gray-300 whitespace-pre-wrap max-h-60 overflow-y-auto bg-gray-900 p-3 rounded-lg border border-gray-800">{aiPreview.body?.slice(0, 800)}...</pre>
                  <div className="flex gap-3">
                    <button onClick={saveAiPost} disabled={aiSaving}
                      className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium disabled:opacity-50 transition-colors">
                      {aiSaving ? 'Saving...' : 'Save as Draft'}
                    </button>
                    <button onClick={() => { setAiPreview(null); setAiError('') }}
                      className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm font-medium transition-colors">
                      Regenerate
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-800 flex justify-end">
              <button onClick={() => { setShowAiModal(false); setAiPreview(null); setAiError('') }}
                className="px-4 py-2 text-gray-400 hover:text-white text-sm transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
