'use client'

/**
 * @fileoverview Forke Platform
 * @copyright (c) 2026 Forke Inc. (https://www.forke.space/)
 *
 * Source-Available License (Non-Commercial / Fair Source).
 * This source code is open for inspection, learning, and personal development.
 * Commercial use, hosting, or resale as a paid service without an explicit
 * commercial license from Forke Inc. is strictly prohibited.
 */

import React, { useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, KeyRound } from 'lucide-react'
import AuthShell, { ErrorNote, Eyebrow, Field, fieldClass, primaryBtn } from '@/components/auth/AuthShell'

/** Early-access gate: the key from the Forke team unlocks sign in and sign up while the waitlist is on. */
export default function CheckoutPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!password.trim()) {
      setError('Enter the access key you were given.')
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (data.success) {
        // full reload so the navbar and middleware pick up the new access cookie
        window.location.href = '/signin'
      } else {
        setError(data.message || 'That key did not work.')
        setIsLoading(false)
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <AuthShell caption="Early access opens in batches.">
      <Eyebrow>Early access</Eyebrow>
      <h1 className="text-[30px] font-medium leading-tight tracking-[-0.035em] text-white">Got an access key?</h1>
      <p className="mt-2 text-[14.5px] text-white/50">Enter it to unlock sign in and sign up before Forke opens to everyone.</p>

      <form onSubmit={handleSubmit} noValidate className="mt-8 flex flex-col gap-4">
        <Field label="Access key">
          <span className="relative">
            <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              autoComplete="off"
              spellCheck={false}
              placeholder="••••••••"
              className={`${fieldClass} pl-10 pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide key' : 'Show key'}
              className="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-white/45 hover:bg-white/[0.06] hover:text-white"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </span>
        </Field>
        {error && <ErrorNote>{error}</ErrorNote>}
        <button type="submit" disabled={isLoading} className={`${primaryBtn} mt-1`}>
          {isLoading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" /> : 'Unlock'}
        </button>
      </form>

      <p className="mt-8 text-[14px] text-white/50">
        No key yet?{' '}
        <Link href="/waitlist" className="text-white underline decoration-white/20 underline-offset-4 hover:decoration-accent">
          Join the waitlist
        </Link>
      </p>
    </AuthShell>
  )
}
