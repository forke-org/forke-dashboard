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
import { ArrowRight, Eye, EyeOff } from 'lucide-react'
import AuthShell, { ErrorNote, Eyebrow, Field, fieldClass, ghostBtn, primaryBtn } from '@/components/auth/AuthShell'

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
    <AuthShell>
      <Eyebrow>Early access</Eyebrow>
      <h1 className="text-[30px] font-medium leading-tight tracking-[-0.035em] text-[#f4f4f5]">Got an access key?</h1>
      <p className="mt-2 text-sm text-[#8e8e93]">Enter it to unlock sign in and sign up before Forke opens to everyone.</p>

      <form onSubmit={handleSubmit} noValidate className="mt-8 flex flex-col gap-4">
        <Field label="Access key">
          <span className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              autoComplete="off"
              spellCheck={false}
              placeholder="••••••••"
              className={`${fieldClass} pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide key' : 'Show key'}
              className="absolute right-1.5 top-1/2 grid h-7 w-7 -translate-y-1/2 cursor-pointer place-items-center rounded-[5px] text-[#8e8e93] transition-colors hover:bg-white/[0.06] hover:text-[#f4f4f5]"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </span>
        </Field>
        {error && <ErrorNote>{error}</ErrorNote>}
        <button type="submit" disabled={isLoading} className={`${primaryBtn} mt-1`}>
          {isLoading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" /> : <>Unlock<ArrowRight className="h-4 w-4" /></>}
        </button>
      </form>

      <div className="mt-6 flex items-center gap-3 text-xs text-[#5f5c5a]"><span className="h-px flex-1 bg-[rgba(240,227,222,0.09)]" />No key yet?<span className="h-px flex-1 bg-[rgba(240,227,222,0.09)]" /></div>
      <Link href="/waitlist" className={`${ghostBtn} mt-4`}>Join the waitlist</Link>
    </AuthShell>
  )
}
