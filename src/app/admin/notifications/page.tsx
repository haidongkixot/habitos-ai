import { prisma } from '@/lib/prisma'

export default async function AdminNotificationsPage() {
  const notifications = await prisma.notification.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { user: { select: { name: true, email: true } } },
  })

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Notifications</h1>
        <p className="text-gray-400 text-sm mt-1">{unreadCount} unread of {notifications.length} total (last 100)</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">User</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Title</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {notifications.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No notifications yet</td></tr>
            ) : notifications.map(n => (
              <tr key={n.id} className={`transition-colors ${n.read ? 'hover:bg-gray-800/20' : 'hover:bg-gray-800/40 bg-gray-900/50'}`}>
                <td className="px-4 py-3 text-gray-300 text-xs">{n.user.name || n.user.email}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded text-xs bg-gray-700 text-gray-300">{n.type}</span>
                </td>
                <td className="px-4 py-3 text-white text-xs">{n.title}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${n.read ? 'text-gray-500' : 'bg-emerald-500/20 text-emerald-400 font-medium'}`}>
                    {n.read ? 'read' : 'unread'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{new Date(n.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
