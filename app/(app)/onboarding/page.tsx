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

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { completeOnboarding, checkUsernameAvailabilityAction } from '@/lib/auth-actions'
import { Button } from '@/components/ui/Button'
import { Loader } from '@/components/ui/Loader'
import { Info, ArrowRight, Eye, EyeOff } from 'lucide-react'
import Image from 'next/image'

export default function OnboardingPage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  
  const [step, setStep] = useState<1 | 2>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signin')
    } else if (status === 'authenticated') {
      const isDeveloper = session.user.role === 'developer'
      const hasUsername = !!session.user.username
      
      if (!isDeveloper || hasUsername) {
        router.push('/dashboard')
      }
    }
  }, [status, session, router])

  if (status === 'loading') {
    return <Loader />
  }

  const handleNextStep = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const cleanUsername = username.trim().toLowerCase()
    if (!cleanUsername) {
      setError('Username is required.')
      setIsSubmitting(false)
      return
    }

    if (cleanUsername.length > 30) {
      setError('Username must be 30 characters or less.')
      setIsSubmitting(false)
      return
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(cleanUsername)) {
      setError('Username can only contain letters, numbers, hyphens (-), and underscores (_).')
      setIsSubmitting(false)
      return
    }

    const res = await checkUsernameAvailabilityAction(cleanUsername)
    if (!res.success) {
      setError(res.error || 'Failed to check username availability.')
      setIsSubmitting(false)
      return
    }

    if (!res.isAvailable) {
      setError('This username is already taken. Please choose another.')
      setIsSubmitting(false)
      return
    }

    // Go to step 2
    setStep(2)
    setIsSubmitting(false)
  }

  const handleCompleteOnboarding = async (setupPassword?: boolean) => {
    setIsSubmitting(true)
    setError(null)

    const cleanUsername = username.trim().toLowerCase()
    const data: Record<string, string> = { username: cleanUsername }

    if (setupPassword) {
      if (!password || !confirmPassword) {
        setError('Please fill out both password fields.')
        setIsSubmitting(false)
        return
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match.')
        setIsSubmitting(false)
        return
      }

      if (password.length < 8) {
        setError('Password must be at least 8 characters long.')
        setIsSubmitting(false)
        return
      }

      data.password = password
    }

    const result = await completeOnboarding(data)
    if (result.success) {
      await update({ username: cleanUsername })
      // Hard navigation so the server layout re-runs with the fresh session
      // (now that the username is set) and renders the sidebar.
      window.location.href = '/dashboard'
    } else {
      setError(result.error || 'Failed to complete onboarding')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[420px] animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col items-center mb-7">
          <Image
            src="/forke-assets/forke_logo.png"
            alt="Forke Logo"
            width={72}
            height={72}
            className="mb-4"
          />
          <h1 className="text-xl font-medium text-white tracking-tight">
            {step === 1 ? 'Choose your username' : 'Set up a password (optional)'}
          </h1>
          <p className="text-[13px] text-[var(--color-text-muted)] mt-1.5 text-center max-w-xs">
            {step === 1 
              ? "You're almost there — just a few more details to set up your workspace."
              : 'Add a password to log in directly via username/password in the future.'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/[0.07] border border-red-500/20 flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2">
            <Info className="w-4 h-4 text-red-400 shrink-0" />
            <p className="text-[13px] text-red-400 leading-relaxed">{error}</p>
          </div>
        )}

        <div className="p-6 rounded-xl bg-white/[0.018] border border-[var(--color-border)] space-y-5">
          {step === 1 ? (
            <form onSubmit={handleNextStep} className="space-y-5">
              <div className="space-y-0.5">
                <label className="text-xs font-medium text-[var(--color-text-muted)] ml-0.5">Username</label>
                <input
                  required
                  name="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  type="text"
                  placeholder="cool-dev_123"
                  className="w-full h-10 bg-white/[0.02] border border-[var(--color-border)] rounded-lg px-3 text-[13px] text-white placeholder:text-white/20 focus:outline-none focus:border-accent transition-colors"
                />
                <p className="text-[11px] text-[var(--color-text-muted)] ml-0.5">
                  Max 30 chars. Only letters, numbers, hyphens (-), and underscores (_) allowed.
                </p>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || !username.trim()}
                className="w-full h-10 text-[13px] font-medium rounded-lg ui-btn-primary disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2 justify-center">
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    Checking availability...
                  </div>
                ) : (
                  <div className="flex items-center gap-2 justify-center">
                    Next step <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </Button>
            </form>
          ) : (
            <div className="space-y-5">
              <div className="space-y-4">
                <div className="space-y-0.5">
                  <label className="text-xs font-medium text-[var(--color-text-muted)] ml-0.5">Password</label>
                  <div className="relative">
                    <input
                      name="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="w-full h-10 bg-white/[0.02] border border-[var(--color-border)] rounded-lg pl-3 pr-10 text-[13px] text-white placeholder:text-white/20 focus:outline-none focus:border-accent transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-0.5">
                  <label className="text-xs font-medium text-[var(--color-text-muted)] ml-0.5">Confirm Password</label>
                  <div className="relative">
                    <input
                      name="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="w-full h-10 bg-white/[0.02] border border-[var(--color-border)] rounded-lg pl-3 pr-10 text-[13px] text-white placeholder:text-white/20 focus:outline-none focus:border-accent transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => handleCompleteOnboarding(false)}
                  disabled={isSubmitting}
                  className="flex-1 h-10 text-[13px] font-medium rounded-lg border border-[var(--color-border)] bg-transparent text-white hover:bg-white/5 transition-colors"
                >
                  Skip
                </Button>
                <Button
                  onClick={() => handleCompleteOnboarding(true)}
                  disabled={isSubmitting || !password || !confirmPassword}
                  className="flex-1 h-10 text-[13px] font-medium rounded-lg ui-btn-primary disabled:opacity-40 disabled:pointer-events-none transition-colors"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2 justify-center">
                      <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      Saving...
                    </div>
                  ) : (
                    'Save & Finish'
                  )}
                </Button>
              </div>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-center text-xs text-[var(--color-text-muted)] hover:text-white transition-colors pt-2"
              >
                Go back to username
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
