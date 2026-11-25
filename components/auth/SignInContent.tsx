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

import React, { useState, useEffect, Suspense } from 'react'
import { signInWithGoogle, signInWithGitHub } from '@/lib/auth-actions'
import { ArrowRight, Eye, EyeOff } from 'lucide-react'
import { RiGithubFill, RiGoogleFill } from '@remixicon/react'
import AuthShell, { Divider, ErrorNote, Eyebrow, Field, fieldClass, ghostBtn, primaryBtn } from './AuthShell'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Loader } from '@/components/ui/Loader'

function SignInContentInner() {
  const searchParams = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [lastUsed, setLastUsed] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('forke_last_auth')
    if (saved) setLastUsed(saved)

    const err = searchParams.get('error')
    if (err === 'AccountNotFound') {
      setError('Account not found. Please sign up first before attempting to log in.')
    }
  }, [searchParams])

  const handleSocialClick = async (provider: 'google' | 'github') => {
    localStorage.setItem('forke_last_auth', provider)
    if (provider === 'google') {
      await signInWithGoogle()
    } else {
      await signInWithGitHub()
    }
  }

  const handleCredentialsSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!email || !password) {
      setError('Please enter both email and password.')
      setIsSubmitting(false)
      return
    }

    try {
      const { signIn } = await import('next-auth/react')
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid email or password.')
      } else if (result?.ok) {
        const isProdDomain = typeof window !== 'undefined' && window.location.hostname.endsWith('forke.space')
        const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL || (isProdDomain ? 'https://dashboard.forke.space' : 'http://localhost:3001')
        window.location.href = `${dashboardUrl}/dashboard`
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const social = (provider: 'google' | 'github', label: string, Icon: typeof RiGoogleFill) => (
    <button type="button" onClick={() => handleSocialClick(provider)} className={ghostBtn}>
      <Icon className="h-[18px] w-[18px]" />
      Continue with {label}
      {lastUsed === provider && (
        <span className="absolute -top-2 right-4 rounded-full bg-accent px-2 py-0.5 font-mono text-[10px] text-[#1a0a00]">last used</span>
      )}
    </button>
  )

  return (
    <AuthShell>
      <Eyebrow>Welcome back</Eyebrow>
      <h1 className="text-[30px] font-medium leading-tight tracking-[-0.035em] text-[#f4f4f5]">Sign in to Forke</h1>
      <p className="mt-2 text-sm text-[#8e8e93]">Pick up where you left off.</p>

      <div className="mt-8 flex flex-col gap-3">
        {social('google', 'Google', RiGoogleFill)}
        {social('github', 'GitHub', RiGithubFill)}
      </div>

      <Divider>or with email</Divider>

      <form onSubmit={handleCredentialsSubmit} noValidate className="flex flex-col gap-4">
        <Field label="Email">
          <input name="email" type="email" autoComplete="email" placeholder="you@email.com" className={fieldClass} />
        </Field>
        <Field label="Password" hint={<button type="button" className="text-[12.5px] font-normal text-white/45 hover:text-white">Forgot?</button>}>
          <span className="relative">
            <input name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="••••••••" className={`${fieldClass} pr-10`} />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-1.5 top-1/2 grid h-7 w-7 -translate-y-1/2 cursor-pointer place-items-center rounded-[5px] text-[#8e8e93] transition-colors hover:bg-white/[0.06] hover:text-[#f4f4f5]"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </span>
        </Field>
        {error && <ErrorNote>{error}</ErrorNote>}
        <button type="submit" disabled={isSubmitting} className={`${primaryBtn} mt-1`}>
          {isSubmitting ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" /> : <>Sign in<ArrowRight className="h-4 w-4" /></>}
        </button>
      </form>

      <div className="mt-6 flex items-center gap-3 text-xs text-[#5f5c5a]"><span className="h-px flex-1 bg-[rgba(240,227,222,0.09)]" />New to Forke?<span className="h-px flex-1 bg-[rgba(240,227,222,0.09)]" /></div>
      <Link href="/register" className={`${ghostBtn} mt-4`}>Create an account</Link>
    </AuthShell>
  )
}

export default function SignInContent() {
  return (
    <Suspense fallback={<Loader fullScreen />}>
      <SignInContentInner />
    </Suspense>
  )
}
