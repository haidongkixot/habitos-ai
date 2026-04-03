'use client'
import { useEffect, useState } from 'react'

interface Log {
  id: string
  contentType: string
  action: string
  prompt: string
  result: any
  model: string
  tokensUsed: number | null
  durationMs: number | null
  status: string
  error: string | null
  adminId: string
  createdAt: string
}

export default function AILogsPage() {
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const load = async (p = page) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(p), limit: '20' })
      if (filterType) params.set('contentType', filterType)
      if (filterStatus) params.set('status', filterStatus)
      const res = await fetch(`/api/admin/ai-logs?${params}`)
      const data = await res.json()
      setLogs(data.logs || [])
      setTotal(data.total || 0)
      setPages(data.pages || 1)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load(1); setPage(1) }, [filterType, filterStatus])
  useEffect(() => { load() }, [page])

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">AI Generation Logs</h1>
        <p className="text-gray-400 text-sm mt-1">View all AI generation history ({total} total)</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-sm text-white">
          <option value="">All types</option>
          <option value="habit_template">habit_template</option>
          <option value="blog_post">blog_post</option>
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-sm text-white">
          <option value="">All statuses</option>
          <option value="success">success</option>
          <option value="error">error</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Type</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Action</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Model</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Tokens</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Duration</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Admin</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">No logs found</td></tr>
            ) : logs.map(log => (
              <tr key={log.id} className="hover:bg-gray-800/40 transition-colors cursor-pointer" onClick={() => setExpanded(expanded === log.id ? null : log.id)}>
                <td className="px-4 py-3 text-gray-400 text-xs">{new Date(log.createdAt).toLocaleString()}</td>
                <td className="px-4 py-3 text-white font-mono text-xs">{log.contentType}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{log.action}</td>
                <td className="px-4 py-3 text-gray-400 font-mono text-xs">{log.model}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{log.tokensUsed ?? '-'}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{log.durationMs ? `${log.durationMs}ms` : '-'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${log.status === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    {log.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs truncate max-w-[120px]">{log.adminId}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Expanded detail */}
        {expanded && logs.find(l => l.id === expanded) && (() => {
          const log = logs.find(l => l.id === expanded)!
          return (
            <div className="border-t border-gray-800 p-4 bg-gray-950 space-y-3">
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Prompt</h4>
                <pre className="text-xs text-gray-300 bg-gray-900 p-3 rounded-lg border border-gray-800 overflow-x-auto whitespace-pre-wrap max-h-48 overflow-y-auto">{log.prompt}</pre>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Result</h4>
                <pre className="text-xs text-gray-300 bg-gray-900 p-3 rounded-lg border border-gray-800 overflow-x-auto whitespace-pre-wrap max-h-48 overflow-y-auto">{JSON.stringify(log.result, null, 2)}</pre>
              </div>
              {log.error && (
                <div>
                  <h4 className="text-xs font-semibold text-red-400 uppercase mb-1">Error</h4>
                  <pre className="text-xs text-red-300 bg-red-900/20 p-3 rounded-lg border border-red-800 overflow-x-auto whitespace-pre-wrap">{log.error}</pre>
                </div>
              )}
            </div>
          )
        })()}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-3 py-1.5 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-400 hover:bg-gray-800 disabled:opacity-50 transition-colors">
            Previous
          </button>
          <span className="text-sm text-gray-400">Page {page} of {pages}</span>
          <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
            className="px-3 py-1.5 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-400 hover:bg-gray-800 disabled:opacity-50 transition-colors">
            Next
          </button>
        </div>
      )}
    </div>
  )
}
