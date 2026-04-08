'use client'

import { useState } from 'react'
import PersonaPicker, { type Persona } from '@/components/coach/persona-picker'

type PlanSlug = 'free' | 'starter' | 'pro' | 'premium'

type Props = {
  personas: Persona[]
  userPlanSlug: PlanSlug
  initialCurrentPersonaSlug: string | null
}

export default function PersonaPickerClient({
  personas,
  userPlanSlug,
  initialCurrentPersonaSlug,
}: Props) {
  const [currentSlug, setCurrentSlug] = useState<string | null>(initialCurrentPersonaSlug)

  const handleSelect = async (slug: string) => {
    const target = personas.find((p) => p.slug === slug)
    if (!target) {
      throw new Error('Coach not found.')
    }

    const res = await fetch('/api/coach/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ personaId: target.id }),
    })

    if (!res.ok) {
      let message = 'Could not save your coach. Please try again.'
      try {
        const data = (await res.json()) as { error?: string; message?: string }
        if (data?.error) message = data.error
        else if (data?.message) message = data.message
      } catch {
        // ignore parse failure
      }
      throw new Error(message)
    }

    setCurrentSlug(slug)
  }

  return (
    <PersonaPicker
      personas={personas}
      userPlanSlug={userPlanSlug}
      currentPersonaSlug={currentSlug}
      onSelect={handleSelect}
    />
  )
}
