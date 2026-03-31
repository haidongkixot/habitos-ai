import { prisma } from '@/lib/prisma'

export default async function AdminLogsPage() {
  const logs = await prisma.errorLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  const levelColors: Record<string, string> = {
    error: 'bg-red-500/20 text-red-400',
    warn: 'bg-yellow-500/20 text-yellow-400',
    info: 'bg-blue-500/20 text-blue-400',
    debug: 'bg-gray-700 text-gray-400',
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Error Logs</h1>
        <p className="text-gray-400 text-sm mt-1">System error and warning logs (last 100)</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Level</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Message</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Source</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800 font-mono">
            {logs.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">No logs found</td></tr>
            ) : logs.map(log => (
              <tr key={log.id} className="hover:bg-gray-800/30 transition-colors">
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${levelColors[log.level] || levelColors.debug}`}>
                    {log.level.toUpperCase()}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-300 text-xs max-w-md truncate">{log.message}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{log.source || '—'}</td>
                <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
