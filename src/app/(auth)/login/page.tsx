'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await signIn('credentials', { email, password, redirect: false })
    if (res?.error) { setError('Invalid credentials'); setLoading(false) }
    else router.push('/dashboard')
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-bold text-lg mx-auto mb-3">H</div>
        <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
        <p className="text-gray-400 text-sm mt-1">Continue building your habits</p>
      </div>
      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-3 mb-4 text-sm">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm text-gray-400">Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:border-emerald-500 focus:outline-none" />
        </div>
        <div>
          <label className="text-sm text-gray-400">Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:border-emerald-500 focus:outline-none" />
        </div>
        <button type="submit" disabled={loading} className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white py-2.5 rounded-lg font-medium transition-colors">
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
      <p className="text-center text-gray-400 text-sm mt-4">
        New here? <Link href="/signup" className="text-emerald-400 hover:underline">Create account</Link>
      </p>
    </div>
  )
}