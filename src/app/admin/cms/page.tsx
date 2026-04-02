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

  return (
    <div className="p-8 space-y-8">
      {/* Blog CMS */}
      <div>
        <h1 className="text-2xl font-bold text-white">Blog / CMS</h1>
        <p className="text-gray-400 text-sm mt-1">Manage published content and blog posts</p>
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
    </div>
  )
}
