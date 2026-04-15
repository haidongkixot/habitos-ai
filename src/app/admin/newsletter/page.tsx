'use client'

import { useEffect, useState } from 'react'

interface Subscriber {
  id: string
  email: string
  status: string
  source: string | null
  createdAt: string
}

interface Stats {
  total: number
  active: number
  unsubscribed: number
  subscribers: Subscriber[]
}

export default function NewsletterAdminPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'subscribers' | 'compose'>('subscribers')

  // Compose state
  const [subject, setSubject] = useState('')
  const [html, setHtml] = useState('')
  const [sending, setSending] = useState(false)
  const [previewResult, setPreviewResult] = useState<any>(null)
  const [sendResult, setSendResult] = useState<any>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/admin/newsletter')
      .then(r => r.json())
      .then(d => { setStats(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function handlePreview() {
    setError('')
    setPreviewResult(null)
    setSendResult(null)
    if (!subject || !html) { setError('Subject and HTML body are required.'); return }
    setSending(true)
    try {
      const res = await fetch('/api/admin/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, html, previewOnly: true }),
      })
      const data = await res.json()
      if (!res.ok) setError(data.error || 'Preview failed')
      else setPreviewResult(data)
    } catch (e) { setError('Network error') }
    setSending(false)
  }

  async function handleSend() {
    if (!confirm(`Send to all active subscribers? This cannot be undone.`)) return
    setError('')
    setPreviewResult(null)
    setSendResult(null)
    if (!subject || !html) { setError('Subject and HTML body are required.'); return }
    setSending(true)
    try {
      const res = await fetch('/api/admin/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, html, previewOnly: false }),
      })
      const data = await res.json()
      if (!res.ok) setError(data.error || 'Send failed')
      else setSendResult(data)
    } catch (e) { setError('Network error') }
    setSending(false)
  }

  return (
    <div className="p-8 min-h-screen bg-gray-950 text-gray-100">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-1">Newsletter</h1>
        <p className="text-gray-400 text-sm mb-6">Manage subscribers and send broadcast emails.</p>

        {/* Stats row */}
        {loading ? (
          <div className="text-gray-500 mb-6">Loading stats...</div>
        ) : stats ? (
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Total Subscribers', value: stats.total },
              { label: 'Active', value: stats.active },
              { label: 'Unsubscribed', value: stats.unsubscribed },
            ].map(({ label, value }) => (
              <div key={label} className="bg-zinc-900 rounded-xl p-5 border border-zinc-800">
                <div className="text-3xl font-bold text-emerald-400">{value}</div>
                <div className="text-sm text-gray-400 mt-1">{label}</div>
              </div>
            ))}
          </div>
        ) : null}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-zinc-800">
          {(['subscribers', 'compose'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                tab === t
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              {t === 'subscribers' ? 'Subscribers' : 'Compose Broadcast'}
            </button>
          ))}
        </div>

        {/* Subscribers tab */}
        {tab === 'subscribers' && (
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="px-4 py-3 text-left text-gray-400 font-medium">Email</th>
                  <th className="px-4 py-3 text-left text-gray-400 font-medium">Status</th>
                  <th className="px-4 py-3 text-left text-gray-400 font-medium">Source</th>
                  <th className="px-4 py-3 text-left text-gray-400 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {stats?.subscribers.map(s => (
                  <tr key={s.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                    <td className="px-4 py-3 text-gray-200">{s.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        s.status === 'active'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-zinc-700 text-zinc-400'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{s.source ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {!stats?.subscribers.length && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-600">No subscribers yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Compose tab */}
        {tab === 'compose' && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Email subject line"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-gray-100 placeholder-gray-600 focus:outline-none focus:border-emerald-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">HTML Body</label>
              <textarea
                value={html}
                onChange={e => setHtml(e.target.value)}
                placeholder="<p>Your email content here...</p>"
                rows={12}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-gray-100 placeholder-gray-600 focus:outline-none focus:border-emerald-500 text-sm font-mono resize-y"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">{error}</div>
            )}

            {previewResult && (
              <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-sm space-y-1">
                <div className="text-emerald-400 font-medium">Preview — {previewResult.count} active subscribers would receive this.</div>
                <div className="text-gray-400">Sample recipients: {previewResult.sample?.join(', ') || 'none'}</div>
              </div>
            )}

            {sendResult && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-4 py-3 text-sm space-y-1">
                <div className="text-emerald-400 font-medium">Broadcast sent! {sendResult.sent} sent, {sendResult.failed} failed (of {sendResult.total} total).</div>
                {sendResult.errors?.length > 0 && (
                  <div className="text-red-400 text-xs mt-1">{sendResult.errors.join(', ')}</div>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handlePreview}
                disabled={sending}
                className="px-5 py-2.5 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-sm font-medium text-gray-200 transition-colors disabled:opacity-50"
              >
                {sending ? 'Working...' : 'Preview'}
              </button>
              <button
                onClick={handleSend}
                disabled={sending}
                className="px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-sm font-semibold text-white transition-colors disabled:opacity-50"
              >
                {sending ? 'Sending...' : 'Send Broadcast'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
