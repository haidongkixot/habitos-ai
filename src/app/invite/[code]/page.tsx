import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import InviteTracker from './invite-tracker'

interface Props {
  params: Promise<{ code: string }>
}

export default async function InvitePage({ params }: Props) {
  const { code } = await params

  const referralCode = await prisma.referralCode.findUnique({
    where: { code },
    include: {
      user: { select: { name: true } },
    },
  })

  // If invalid code, show generic landing
  if (!referralCode) {
    return (
      <div className="min-h-screen bg-[#0c0c0f] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-8">
          <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto text-3xl">
            ✅
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">HabitOS AI</h1>
            <p className="text-white/60 mt-3 text-lg">
              Build habits that actually stick
            </p>
          </div>
          <Link
            href="/signup"
            className="inline-block px-8 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-full shadow-sm transition"
          >
            Sign Up Free
          </Link>
        </div>
      </div>
    )
  }

  const referrerName = referralCode.user.name || 'A friend'

  return (
    <div className="min-h-screen bg-[#0c0c0f] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Logo */}
        <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto text-3xl">
          ✅
        </div>

        {/* Card */}
        <div className="bg-white/5 border border-white/10 rounded-[1.5rem] p-8 space-y-6 backdrop-blur-sm">
          <div className="space-y-3">
            <p className="text-emerald-400 font-medium text-sm uppercase tracking-wide">
              You&apos;ve been invited
            </p>
            <h1 className="text-2xl font-bold text-white">
              {referrerName} invited you to HabitOS AI
            </h1>
            <p className="text-white/60 text-base leading-relaxed">
              Start your habit journey with a <span className="font-semibold text-emerald-400">14-day extended trial</span>.
              Build lasting habits with AI coaching backed by behavioral science.
            </p>
          </div>

          {/* Benefits */}
          <div className="space-y-3 text-left">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-white/70 text-sm">AI habit coach and accountability system</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-white/70 text-sm">66-day automaticity tracking</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-white/70 text-sm">Habit templates from behavioral science</p>
            </div>
          </div>

          {/* CTA */}
          <Link
            href={`/signup?ref=${code}`}
            className="block w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-full shadow-sm transition text-center"
          >
            Accept Invitation
          </Link>

          <p className="text-xs text-white/30">
            Free to join. No credit card required.
          </p>
        </div>
      </div>

      {/* Track the click */}
      <InviteTracker code={code} />
    </div>
  )
}
