/**
 * HabitOS M5 — Admin coaching plans list (server shell).
 *
 * Gates admin access then defers all data fetching + rendering to the
 * client component so we can match the /admin/users interactive pattern
 * (filters, pagination, CSV export via query string).
 */

import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import CoachingPlansClient from './coaching-plans-client'

export default async function AdminCoachingPlansPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== 'admin') {
    redirect('/login')
  }

  return <CoachingPlansClient />
}
