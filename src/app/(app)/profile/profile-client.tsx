'use client'

import Link from 'next/link'
import { useState } from 'react'
import { signOut } from 'next-auth/react'

export type ProfileSnapshot = {
  id: string
  name: string
  email: string
  hasPassword: boolean
  createdAt: string
  accounts: Array<{ id: string; provider: string; providerAccountId: string }>
  plan: {
    name: string
    slug: string
    status: string
    currentPeriodEnd: string
  } | null
}

function initialOf(name: string, email: string): string {
  const src = (name || email || '?').trim()
  return src.charAt(0).toUpperCase() || '?'
}

export default function ProfileClient({ initial }: { initial: ProfileSnapshot }) {
  const [name, setName] = useState(initial.name)
  const [savingName, setSavingName] = useState(false)
  const [nameMsg, setNameMsg] = useState<string | null>(null)
  const [nameErr, setNameErr] = useState<string | null>(null)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [pwMsg, setPwMsg] = useState<string | null>(null)
  const [pwErr, setPwErr] = useState<string | null>(null)

  const [showDelete, setShowDelete] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteErr, setDeleteErr] = useState<string | null>(null)

  async function saveName(e: { preventDefault: () => void }) {
    e.preventDefault()
    setSavingName(true)
    setNameMsg(null)
    setNameErr(null)
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(j.error || `Save failed (${res.status})`)
      }
      setNameMsg('Display name saved.')
    } catch (err) {
      setNameErr(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSavingName(false)
    }
  }

  async function changePassword(e: { preventDefault: () => void }) {
    e.preventDefault()
    setSavingPassword(true)
    setPwMsg(null)
    setPwErr(null)
    if (newPassword.length < 8) {
      setPwErr('New password must be at least 8 characters.')
      setSavingPassword(false)
      return
    }
    if (newPassword !== confirmPassword) {
      setPwErr('New password and confirmation do not match.')
      setSavingPassword(false)
      return
    }
    try {
      const res = await fetch('/api/user/password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(j.error || `Update failed (${res.status})`)
      }
      setPwMsg('Password updated.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setPwErr(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setSavingPassword(false)
    }
  }

  async function deleteAccount() {
    if (deleteConfirm !== 'DELETE') {
      setDeleteErr('Type DELETE to confirm.')
      return
    }
    setDeleting(true)
    setDeleteErr(null)
    try {
      const res = await fetch('/api/user/delete-account', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ confirm: 'DELETE' }),
      })
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(j.error || `Delete failed (${res.status})`)
      }
      await signOut({ callbackUrl: '/' })
    } catch (err) {
      setDeleteErr(err instanceof Error ? err.message : 'Delete failed')
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Identity */}
      <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center text-white text-2xl font-bold">
            {initialOf(initial.name, initial.email)}
          </div>
          <div className="min-w-0">
            <p className="text-white font-semibold truncate">
              {initial.name || initial.email}
            </p>
            <p className="text-zinc-500 text-sm truncate">{initial.email}</p>
            <p className="text-zinc-600 text-xs mt-1">
              Member since {new Date(initial.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </section>

      {/* Display name */}
      <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur p-6">
        <h2 className="text-white font-semibold">Display name</h2>
        <p className="text-zinc-500 text-xs mt-1">
          How HabitOS addresses you across the app.
        </p>
        <form onSubmit={saveName} className="mt-4 space-y-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
            placeholder="Your name"
          />
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs">
              {nameErr && <span className="text-rose-400">{nameErr}</span>}
              {nameMsg && <span className="text-emerald-400">{nameMsg}</span>}
            </div>
            <button
              type="submit"
              disabled={savingName || name.trim() === initial.name}
              className="rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-black text-sm font-semibold px-4 py-2 transition-colors"
            >
              {savingName ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </section>

      {/* Email (read-only) */}
      <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur p-6">
        <h2 className="text-white font-semibold">Email</h2>
        <p className="text-zinc-500 text-xs mt-1">
          Used to sign in. Contact support to change it.
        </p>
        <div className="mt-4 rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-sm text-zinc-300">
          {initial.email}
        </div>
      </section>

      {/* Plan */}
      <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-white font-semibold">Plan</h2>
            <p className="text-zinc-500 text-xs mt-1">
              {initial.plan
                ? `Active until ${new Date(initial.plan.currentPeriodEnd).toLocaleDateString()}.`
                : "No active subscription. You're on the free plan."}
            </p>
          </div>
          <div className="text-right">
            <span
              className={`text-xs font-semibold px-2 py-1 rounded-full border ${
                initial.plan
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : 'bg-zinc-800 text-zinc-400 border-zinc-700'
              }`}
            >
              {initial.plan?.name ?? 'Free'}
            </span>
          </div>
        </div>
        <div className="mt-4">
          <Link
            href="/settings/billing"
            className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            Manage in Settings &rarr; Billing
          </Link>
        </div>
      </section>

      {/* Password */}
      <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur p-6">
        <h2 className="text-white font-semibold">Password</h2>
        <p className="text-zinc-500 text-xs mt-1">
          {initial.hasPassword
            ? 'Update the password used for credential sign-in.'
            : 'Set a password to enable credential sign-in.'}
        </p>
        <form onSubmit={changePassword} className="mt-4 space-y-3">
          {initial.hasPassword && (
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
              placeholder="Current password"
            />
          )}
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
            className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
            placeholder="New password (min 8 chars)"
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
            className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
            placeholder="Confirm new password"
          />
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs">
              {pwErr && <span className="text-rose-400">{pwErr}</span>}
              {pwMsg && <span className="text-emerald-400">{pwMsg}</span>}
            </div>
            <button
              type="submit"
              disabled={savingPassword}
              className="rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-black text-sm font-semibold px-4 py-2 transition-colors"
            >
              {savingPassword ? 'Updating...' : 'Update password'}
            </button>
          </div>
        </form>
      </section>

      {/* Connected accounts */}
      <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur p-6">
        <h2 className="text-white font-semibold">Connected accounts</h2>
        <p className="text-zinc-500 text-xs mt-1">
          OAuth providers linked to this HabitOS account.
        </p>
        <div className="mt-4">
          {initial.accounts.length === 0 ? (
            <p className="text-sm text-zinc-500">No connected providers.</p>
          ) : (
            <ul className="space-y-2">
              {initial.accounts.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between rounded-xl bg-black/30 border border-white/10 px-3 py-2"
                >
                  <span className="text-sm text-white capitalize">{a.provider}</span>
                  <span className="text-xs text-zinc-500 truncate max-w-[60%]">
                    {a.providerAccountId}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Danger zone */}
      <section className="rounded-2xl border border-rose-500/30 bg-rose-500/5 backdrop-blur p-6">
        <h2 className="text-rose-300 font-semibold">Danger zone</h2>
        <p className="text-rose-200/70 text-xs mt-1">
          Deleting your account is permanent. All habits, check-ins, goals, and
          subscriptions will be removed.
        </p>
        {!showDelete ? (
          <button
            onClick={() => setShowDelete(true)}
            className="mt-4 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-sm font-semibold px-4 py-2 border border-rose-500/30 transition-colors"
          >
            Delete account
          </button>
        ) : (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-rose-200">
              Type <span className="font-mono font-bold">DELETE</span> to confirm.
            </p>
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              className="w-full rounded-xl bg-black/40 border border-rose-500/30 px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-400"
              placeholder="DELETE"
            />
            {deleteErr && <p className="text-xs text-rose-400">{deleteErr}</p>}
            <div className="flex items-center gap-2">
              <button
                onClick={deleteAccount}
                disabled={deleting || deleteConfirm !== 'DELETE'}
                className="rounded-xl bg-rose-500 hover:bg-rose-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2 transition-colors"
              >
                {deleting ? 'Deleting...' : 'Permanently delete'}
              </button>
              <button
                onClick={() => {
                  setShowDelete(false)
                  setDeleteConfirm('')
                  setDeleteErr(null)
                }}
                disabled={deleting}
                className="rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-sm font-semibold px-4 py-2 border border-white/10 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
