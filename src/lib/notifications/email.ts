/**
 * HabitOS M4 — Email dispatcher via Resend.
 *
 * Lazy-initialises the Resend client on first use so builds without
 * RESEND_API_KEY succeed. If the key is missing, `sendEmailReminder`
 * returns `{ ok: false, error: 'missing_resend_key' }` without throwing.
 *
 * Contract:
 *   - `reactTemplate` is any `React.ReactElement`. The designer owns the
 *     actual email templates in `src/emails/*`. **This file does not import
 *     anything from `src/emails/*`** — callers pass the rendered element in.
 *   - We render via `@react-email/render`'s `render()` which returns HTML
 *     as a string.
 */

import type { ReactElement } from 'react'

export interface SendEmailInput {
  to: string
  subject: string
  reactTemplate: ReactElement
  tags?: Array<{ name: string; value: string }>
  from?: string
}

export interface SendEmailResult {
  id: string | null
  ok: boolean
  error?: string
}

let resendClient: unknown = null
let resendInitTried = false

async function getResendClient(): Promise<any | null> {
  if (resendInitTried) return resendClient as any
  resendInitTried = true
  const key = process.env.RESEND_API_KEY
  if (!key) {
    resendClient = null
    return null
  }
  try {
    const mod: any = await import('resend')
    const ResendCtor = mod.Resend ?? mod.default?.Resend
    if (!ResendCtor) {
      resendClient = null
      return null
    }
    resendClient = new ResendCtor(key)
    return resendClient as any
  } catch (err) {
    console.error('[notifications/email] failed to init Resend client', err)
    resendClient = null
    return null
  }
}

export async function sendEmailReminder(
  input: SendEmailInput
): Promise<SendEmailResult> {
  const { to, subject, reactTemplate, tags, from } = input

  const client = await getResendClient()
  if (!client) {
    return { id: null, ok: false, error: 'missing_resend_key' }
  }

  let html: string
  try {
    const renderMod: any = await import('@react-email/render')
    const rendered = await renderMod.render(reactTemplate)
    html = typeof rendered === 'string' ? rendered : String(rendered)
  } catch (err) {
    console.error('[notifications/email] render failed', err)
    return { id: null, ok: false, error: 'render_failed' }
  }

  const sender =
    from ??
    process.env.RESEND_FROM ??
    process.env.RESEND_FROM_EMAIL ??
    'HabitOS <coach@habitos.ai>'

  try {
    const { data, error } = await client.emails.send({
      from: sender,
      to,
      subject,
      html,
      tags,
    })
    if (error) {
      return { id: null, ok: false, error: String(error?.message ?? error) }
    }
    return { id: data?.id ?? null, ok: true }
  } catch (err) {
    console.error('[notifications/email] send failed', err)
    return { id: null, ok: false, error: (err as Error).message }
  }
}
