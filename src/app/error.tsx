'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#0c0c0f]">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">&#x26A0;&#xFE0F;</div>
        <h2 className="text-2xl font-bold mb-2 text-white">Something went wrong</h2>
        <p className="text-gray-400 mb-6">
          An unexpected error occurred. This is usually temporary — please try again.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-2.5 bg-emerald-500 text-white rounded-full font-medium hover:bg-emerald-600 transition-colors"
          >
            Try again
          </button>
          <a
            href="/"
            className="px-6 py-2.5 border border-gray-600 text-white rounded-full font-medium hover:bg-gray-800 transition-colors"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  )
}
