import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About - HabitOS AI',
  description: 'Learn about HabitOS AI — intelligent habit tracking with streaks, AI coaching, and behavior change science. Part of the HumanOS ecosystem by PeeTeeAI.',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h1 className="text-4xl font-bold text-white mb-6">
          About <span className="text-emerald-400">HabitOS AI</span>
        </h1>

        <div className="prose prose-invert prose-emerald max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-white mt-10 mb-4">What is HabitOS AI?</h2>
            <p className="text-gray-300 leading-relaxed">
              HabitOS AI is an intelligent habit tracking platform that helps you build lasting habits through
              streak tracking, personalized AI coaching, and science-backed behavior change techniques. Whether
              you want to exercise daily, read more, meditate, or build any positive routine, HabitOS gives you
              the tools and motivation to make it stick.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-10 mb-4">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-6 mt-6">
              {[
                {
                  title: 'Track Habits',
                  description: 'Log your daily habits with a simple tap. Visual streaks and progress charts keep you motivated.',
                },
                {
                  title: 'AI Coaching',
                  description: 'Get personalized coaching powered by AI that adapts to your patterns, strengths, and challenges.',
                },
                {
                  title: 'Build Streaks',
                  description: 'Maintain your momentum with streak tracking, milestone celebrations, and smart reminders.',
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="bg-gray-900 border border-emerald-500/20 rounded-xl p-6"
                >
                  <h3 className="text-emerald-400 font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-gray-400 text-sm">{feature.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-10 mb-4">Part of the HumanOS Ecosystem</h2>
            <p className="text-gray-300 leading-relaxed">
              HabitOS AI is part of the HumanOS ecosystem &mdash; a suite of AI-powered tools designed to help
              you optimize every aspect of your life. From focus and productivity to breathing, memory, and
              relationships, HumanOS apps work together to support your growth.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-6">
              {[
                { name: 'FocusFlow AI', href: 'https://focusflow.peeteeai.com', desc: 'Deep work & focus' },
                { name: 'HabitOS AI', href: 'https://habitos.peeteeai.com', desc: 'Habit tracking' },
                { name: 'BreathMaster AI', href: 'https://breathmaster.peeteeai.com', desc: 'Breathing exercises' },
                { name: 'MemoryForge AI', href: 'https://memoryforge.peeteeai.com', desc: 'Memory training' },
                { name: 'HarmonyMap AI', href: 'https://harmonymap.peeteeai.com', desc: 'Relationship mapping' },
                { name: 'SeeneyU', href: 'https://seeneyu.com', desc: 'Social platform' },
              ].map((app) => (
                <a
                  key={app.name}
                  href={app.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-900 border border-gray-800 hover:border-emerald-500/40 rounded-lg p-4 transition-colors"
                >
                  <p className="text-white font-medium text-sm">{app.name}</p>
                  <p className="text-gray-500 text-xs">{app.desc}</p>
                </a>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-10 mb-4">Built by PeeTeeAI</h2>
            <p className="text-gray-300 leading-relaxed">
              HabitOS AI is built by{' '}
              <a href="https://peeteeai.com" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">
                PeeTeeAI
              </a>
              , the company behind the HumanOS ecosystem. We believe in using AI to help humans become the
              best version of themselves &mdash; one habit at a time.
            </p>
          </section>

          <div className="mt-12 flex gap-4">
            <Link
              href="/login"
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Get Started
            </Link>
            <Link
              href="/contact"
              className="border border-gray-700 hover:border-emerald-500/40 text-gray-300 px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
