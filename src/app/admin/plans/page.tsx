import { prisma } from '@/lib/prisma'

export default async function AdminPlansPage() {
  const plans = await prisma.plan.findMany({ orderBy: { createdAt: 'asc' } })
  const subscriptionCounts = await prisma.subscription.groupBy({
    by: ['planId'],
    _count: { id: true },
    where: { status: 'active' },
  })
  const countMap = Object.fromEntries(subscriptionCounts.map(s => [s.planId, s._count.id]))

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Plans</h1>
        <p className="text-gray-400 text-sm mt-1">Manage subscription plans and pricing</p>
      </div>

      {plans.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <div className="text-4xl mb-3">💳</div>
          <p className="text-gray-400">No plans configured yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map(plan => {
            const monthly = (plan.priceMonthly / 100).toFixed(2)
            const features = plan.features ? plan.features.split('\n').filter(Boolean) : []
            return (
              <div key={plan.id} className={`bg-gray-900 border rounded-xl p-6 ${plan.isActive ? 'border-emerald-500/30' : 'border-gray-800 opacity-60'}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${plan.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-800 text-gray-500'}`}>
                    {plan.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                  <span className="text-xs text-gray-500">{countMap[plan.id] || 0} subscribers</span>
                </div>
                <h3 className="text-lg font-bold text-white capitalize">{plan.name}</h3>
                <p className="text-3xl font-bold text-emerald-400 mt-2">
                  ${monthly}<span className="text-sm text-gray-500">/mo</span>
                </p>
                {plan.description && <p className="text-sm text-gray-400 mt-1">{plan.description}</p>}
                {features.length > 0 && (
                  <div className="mt-4 space-y-1">
                    {features.slice(0, 5).map((f, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-gray-300">
                        <span className="text-emerald-400">✓</span> {f}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
