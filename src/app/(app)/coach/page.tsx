'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useRef, useState } from 'react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt?: string
}

const SUGGESTIONS = [
  'How can I build a morning routine?',
  'Why do I keep breaking my streak?',
  'What are keystone habits I should start with?',
  'How to stay motivated on tough days?',
]

export default function CoachPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [msgCount, setMsgCount] = useState(0)
  const [msgLimit] = useState(3)
  const [isPro, setIsPro] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/ai/chat')
      .then(r => r.json())
      .then(data => {
        if (data.messages) setMessages(data.messages)
        if (data.todayCount !== undefined) setMsgCount(data.todayCount)
        if (data.isPro) setIsPro(true)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const send = async (text?: string) => {
    const msg = text || input.trim()
    if (!msg || loading) return

    if (!isPro && msgCount >= msgLimit) return

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: msg }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg }),
      })
      const data = await res.json()
      if (data.error) {
        setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: data.error }])
      } else {
        setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: data.reply }])
        setMsgCount(data.todayCount ?? msgCount + 1)
      }
    } catch {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: 'Something went wrong. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  const limitReached = !isPro && msgCount >= msgLimit

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-white">AI Coach</h1>
          <p className="text-gray-400 text-sm">Your personal habit-building assistant</p>
        </div>
        {!isPro && (
          <div className="text-xs text-gray-400 bg-gray-900 border border-gray-800 rounded-lg px-3 py-1.5">
            {msgCount}/{msgLimit} messages today
          </div>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pb-4 scrollbar-thin">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-white mb-2">Chat with your Coach</h2>
            <p className="text-gray-400 text-sm mb-6 max-w-md">
              Ask about habit-building strategies, streak psychology, or get personalized advice based on your progress.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-left text-sm text-gray-300 bg-gray-900 border border-gray-800 hover:border-emerald-500/40 rounded-lg px-4 py-3 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(m => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-emerald-500 text-white rounded-br-md'
                  : 'bg-gray-900 border border-gray-800 text-gray-200 rounded-bl-md'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {limitReached && (
        <div className="bg-gray-900 border border-emerald-500/30 rounded-lg p-3 mb-3 text-center">
          <p className="text-gray-300 text-sm">You have used all {msgLimit} free messages today.</p>
          <a href="/pricing" className="text-emerald-400 text-sm font-medium hover:underline">
            Upgrade to Pro for unlimited coaching
          </a>
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder={limitReached ? 'Upgrade to Pro to continue...' : 'Ask your coach anything...'}
          disabled={limitReached || loading}
          className="flex-1 bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 disabled:opacity-50"
        />
        <button
          onClick={() => send()}
          disabled={!input.trim() || limitReached || loading}
          className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:hover:bg-emerald-500 text-white px-5 py-3 rounded-xl transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  )
}
