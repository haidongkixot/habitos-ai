'use client'
import { useEffect } from 'react'
export default function InviteTracker({ code }: { code: string }) {
  useEffect(() => {
    fetch('/api/referral/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    }).catch(() => {})
  }, [code])
  return null
}
