import Providers from '@/components/providers'
import Navbar from '@/components/navbar'
import GamificationBar from '@/components/gamification-bar'
import AssistantButton from '@/components/assistant-button'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <div className="min-h-screen bg-[#0c0c0f]">
        <Navbar />
        <GamificationBar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
        <AssistantButton />
      </div>
    </Providers>
  )
}
