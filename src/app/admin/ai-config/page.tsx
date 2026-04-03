'use client'
import { useEffect, useState } from 'react'

interface Config {
  id: string
  contentType: string
  model: string
  temperature: number
  maxTokens: number
  systemPrompt: string
  isActive: boolean
}

const DEFAULT_CONFIGS = [
  { contentType: 'habit_template', model: 'gpt-4o-mini', temperature: 0.9, maxTokens: 1000, systemPrompt: 'You are a habit science expert. Create evidence-based habit templates with clear descriptions, benefits, and actionable steps. Return ONLY valid JSON.', isActive: true },
  { contentType: 'blog_post', model: 'gpt-4o-mini', temperature: 0.8, maxTokens: 1500, systemPrompt: 'You are a productivity and habit science writer. Write engaging, research-backed blog posts about habit building, behavior change, and personal growth. Return ONLY valid JSON.', isActive: true },
]

const MODELS = ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo']

export default function AIConfigPage() {
  const [configs, setConfigs] = useState<Config[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [saving, setSaving] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Record<string, Partial<Config>>>({})

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/ai-config')
      const data = await res.json()
      setConfigs(data.configs || [])
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const seedDefaults = async () => {
    for (const cfg of DEFAULT_CONFIGS) {
      const existing = configs.find(c => c.contentType === cfg.contentType)
      if (!existing) {
        await fetch('/api/admin/ai-config', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cfg),
        })
      }
    }
    load()
  }

  const save = async (contentType: string) => {
    setSaving(contentType)
    const vals = editValues[contentType] || {}
    const existing = configs.find(c => c.contentType === contentType)
    await fetch('/api/admin/ai-config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contentType, ...existing, ...vals }),
    })
    setSaving(null)
    load()
  }

  const toggleActive = async (config: Config) => {
    await fetch('/api/admin/ai-config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contentType: config.contentType, isActive: !config.isActive }),
    })
    load()
  }

  const getEdit = (ct: string, field: keyof Config) => {
    const ev = editValues[ct]
    if (ev && ev[field] !== undefined) return ev[field]
    const cfg = configs.find(c => c.contentType === ct)
    return cfg ? cfg[field] : ''
  }

  const setEdit = (ct: string, field: keyof Config, value: any) => {
    setEditValues(prev => ({ ...prev, [ct]: { ...(prev[ct] || {}), [field]: value } }))
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">AI Configuration</h1>
          <p className="text-gray-400 text-sm mt-1">Manage AI model settings for each content type</p>
        </div>
        <button onClick={seedDefaults} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium transition-colors">
          Reset to Defaults
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : configs.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
          <p className="text-gray-400 mb-4">No AI configs found. Click below to seed defaults.</p>
          <button onClick={seedDefaults} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium transition-colors">
            Seed Default Configs
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {configs.map(config => (
            <div key={config.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              {/* Row header */}
              <div className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-gray-800/40 transition-colors"
                onClick={() => setExpanded(expanded === config.contentType ? null : config.contentType)}>
                <div className="flex-1">
                  <span className="font-medium text-white">{config.contentType}</span>
                </div>
                <span className="text-sm text-gray-400 font-mono">{config.model}</span>
                <span className="text-sm text-gray-400">temp: {config.temperature}</span>
                <span className="text-sm text-gray-400">tokens: {config.maxTokens}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleActive(config) }}
                  className={`px-3 py-1 rounded-full text-xs font-medium ${config.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-700 text-gray-500'}`}
                >
                  {config.isActive ? 'Active' : 'Disabled'}
                </button>
                <span className="text-gray-500 text-sm">{expanded === config.contentType ? '▲' : '▼'}</span>
              </div>

              {/* Expanded edit panel */}
              {expanded === config.contentType && (
                <div className="border-t border-gray-800 px-6 py-5 space-y-4 bg-gray-950">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Model</label>
                      <select
                        value={getEdit(config.contentType, 'model') as string}
                        onChange={e => setEdit(config.contentType, 'model', e.target.value)}
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                      >
                        {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Temperature ({getEdit(config.contentType, 'temperature')})</label>
                      <input
                        type="range" min="0" max="2" step="0.1"
                        value={getEdit(config.contentType, 'temperature') as number}
                        onChange={e => setEdit(config.contentType, 'temperature', parseFloat(e.target.value))}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Max Tokens</label>
                      <input
                        type="number" min="100" max="4000"
                        value={getEdit(config.contentType, 'maxTokens') as number}
                        onChange={e => setEdit(config.contentType, 'maxTokens', parseInt(e.target.value))}
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">System Prompt</label>
                    <textarea
                      rows={4}
                      value={getEdit(config.contentType, 'systemPrompt') as string}
                      onChange={e => setEdit(config.contentType, 'systemPrompt', e.target.value)}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white resize-y"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={() => save(config.contentType)}
                      disabled={saving === config.contentType}
                      className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium disabled:opacity-50 transition-colors"
                    >
                      {saving === config.contentType ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
