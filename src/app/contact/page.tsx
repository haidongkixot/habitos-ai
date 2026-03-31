'use client'

import { useState } from 'react'
import type { Metadata } from 'next'

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' })
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h1 className="text-4xl font-bold text-white mb-4">
          Contact <span className="text-emerald-400">Us</span>
        </h1>
        <p className="text-gray-400 mb-12 max-w-2xl">
          Have questions about HabitOS AI? Want to share feedback or report an issue? We&apos;d love to hear
          from you. Reach out and our team will get back to you as soon as possible.
        </p>

        <div className="grid md:grid-cols-2 gap-12">
          <div>
            {submitted ? (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-8 text-center">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">Message Sent</h3>
                <p className="text-gray-400 text-sm">
                  Thank you for reaching out. We&apos;ll get back to you soon.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-1">Subject</label>
                  <input
                    id="subject"
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
                    placeholder="What is this about?"
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-1">Message</label>
                  <textarea
                    id="message"
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                    placeholder="Your message..."
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-3 rounded-lg transition-colors"
                >
                  Send Message
                </button>
              </form>
            )}
          </div>

          <div className="space-y-8">
            <div>
              <h3 className="text-emerald-400 font-semibold text-sm uppercase tracking-wider mb-3">Email</h3>
              <a href="mailto:hai@eagodi.com" className="text-white hover:text-emerald-400 transition-colors">
                hai@eagodi.com
              </a>
            </div>
            <div>
              <h3 className="text-emerald-400 font-semibold text-sm uppercase tracking-wider mb-3">Company</h3>
              <p className="text-gray-300">PeeTeeAI</p>
              <p className="text-gray-500 text-sm mt-1">Building the HumanOS Ecosystem</p>
            </div>
            <div>
              <h3 className="text-emerald-400 font-semibold text-sm uppercase tracking-wider mb-3">Follow Us</h3>
              <div className="flex gap-4">
                <a href="https://github.com/haidongkixot" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-emerald-400 transition-colors">
                  GitHub
                </a>
                <a href="https://peeteeai.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-emerald-400 transition-colors">
                  Website
                </a>
              </div>
            </div>
            <div className="bg-gray-900 border border-emerald-500/20 rounded-xl p-6">
              <h3 className="text-white font-semibold mb-2">HabitOS AI</h3>
              <p className="text-gray-400 text-sm">
                A PeeTeeAI product, part of the HumanOS Ecosystem. Intelligent habit tracking with AI coaching
                to help you build lasting positive habits.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
