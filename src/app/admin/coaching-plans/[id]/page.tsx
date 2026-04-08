/**
 * HabitOS M5 — Admin coaching plan detail (server shell).
 *
 * Gates access and passes the route param down to the client component
 * which owns all data fetching (matches the admin/users/[id] pattern).
 */

import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import CoachingPlanDetailClient from './coaching-plan-detail-client'

export default async function AdminCoachingPlanDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== 'admin') {
    redirect('/login')
  }

  return <CoachingPlanDetailClient planId={params.id} />
}
