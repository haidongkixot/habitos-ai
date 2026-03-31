import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Footer from '@/components/footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'HabitOS - Intelligent Habit Tracking',
  description: 'AI-powered habit tracking and behavior change. Build lasting habits with personalized coaching. Part of the HumanOS ecosystem.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-gray-950 text-gray-100 min-h-screen`}>{children}<Footer /></body>
    </html>
  )
}