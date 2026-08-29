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
import { Button } from '@/components/ui/Button'
import { signInWithGoogle, signInWithGitHub } from '@/lib/auth-actions'
import { Eye, EyeOff, ArrowLeft, Info } from 'lucide-react'
import Image from 'next/image'
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
        window.location.href = '/dashboard'
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="h-screen w-full bg-[#0A0A0A] flex flex-col md:flex-row overflow-hidden selection:bg-accent selection:text-white fixed inset-0">
      
      {/* Left Panel: Manga Artwork */}
      <div className="relative w-full md:w-1/2 h-[40vh] md:h-full bg-[#050505] overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/forke-assets/auth-assets/manga-panel-desktop.png"
            alt="Manga Artwork"
            fill
            className="object-contain object-top opacity-95 transition-all duration-700 hover:scale-[1.02]"
            priority
          />
        </div>
        
        {/* Reduced Fade Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#0A0A0A]/40 hidden md:block" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/40 via-transparent to-transparent md:hidden" />
      </div>

      {/* Right Panel: Elegant Orangish Auth */}
      <div className="w-full md:w-1/2 h-full flex flex-col items-center justify-between relative bg-[#0A0A0A] px-6 py-8 md:py-12 overflow-y-auto">
        
        {/* Back to Site Button */}
        <Link 
          href="/" 
          className="absolute top-8 right-8 z-20 flex items-center gap-2 text-[10px] text-white/20 hover:text-accent font-black uppercase tracking-[0.2em] transition-all group"
        >
          <ArrowLeft className="w-3 h-3 transition-transform group-hover:-translate-x-1" />
          Back to site
        </Link>

        {/* Subtle Ambient Orbs */}
        <div className="absolute top-1/4 -right-20 w-64 h-64 bg-accent/10 blur-[100px] rounded-full" />
        <div className="absolute bottom-1/4 -left-20 w-48 h-48 bg-accent/5 blur-[80px] rounded-full" />

        <div className="w-full max-w-[400px] space-y-8 relative z-10 my-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Brand Header */}
          <div className="flex flex-col items-center">
             <div className="h-[90px] flex items-center justify-center relative mb-4">
                <Link href="/" className="group relative z-10">
                  <div className="absolute inset-0 bg-accent/20 blur-3xl rounded-full scale-0 group-hover:scale-150 transition-transform duration-500" />
                  <Image 
                    src="/forke-assets/forke_logo.png" 
                    alt="Forke Logo" 
                    width={140} 
                    height={140} 
                    className="relative z-10 drop-shadow-[0_0_25px_rgba(255,122,0,0.6)] transition-transform group-hover:rotate-12"
                  />
                </Link>
             </div>
             <div className="text-center space-y-2">
                <h1 className="text-3xl md:text-4xl font-medium text-white tracking-[-0.03em]">Welcome back to <span className="font-serif italic font-normal text-accent">Forke.</span></h1>
                <p className="ui-eyebrow">{'//'} the developer marketplace, reimagined</p>
             </div>
          </div>

          <div className="space-y-6">
            {/* Social Logins */}
            <div className="grid grid-cols-1 gap-3">
              <div className="relative group">
                {lastUsed === 'google' && (
                  <div className="absolute -top-2.5 right-4 z-20">
                    <span className="bg-accent text-[9px] text-white px-3 py-0.5 rounded-full font-black tracking-tighter uppercase shadow-lg shadow-accent/20 border border-white/10">Last Used</span>
                  </div>
                )}
                <Button 
                  variant="outline" 
                  className="w-full h-12 md:h-14 gap-4 border-white/5 bg-white/[0.03] hover:bg-white/[0.06] hover:border-accent/40 text-sm font-bold rounded-2xl transition-all text-white/80 hover:text-white group"
                  onClick={() => handleSocialClick('google')}
                >
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 48 48">
                    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
                  </svg>
                  Continue with Google
                </Button>
              </div>

              <div className="relative group">
                {lastUsed === 'github' && (
                  <div className="absolute -top-2.5 right-4 z-20">
                    <span className="bg-accent text-[9px] text-white px-3 py-0.5 rounded-full font-black tracking-tighter uppercase shadow-lg shadow-accent/20 border border-white/10">Last Used</span>
                  </div>
                )}
                <Button 
                  variant="outline" 
                  className="w-full h-12 md:h-14 gap-4 border-white/5 bg-white/[0.03] hover:bg-white/[0.06] hover:border-accent/40 text-sm font-bold rounded-2xl transition-all text-white/80 hover:text-white group"
                  onClick={() => handleSocialClick('github')}
                >
                  <svg className="w-5 h-5 fill-white shrink-0" viewBox="0 0 24 24">
                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                  </svg>
                  Continue with GitHub
                </Button>
              </div>
            </div>

            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/5" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-[#0A0A0A] px-4 text-[10px] text-white/20 font-black uppercase tracking-[0.4em]">or credentials</span>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                <div className="w-8 h-8 rounded-full border border-red-500/20 flex items-center justify-center bg-red-500/10 shrink-0">
                  <Info className="w-4 h-4 text-red-400" />
                </div>
                <p className="text-xs text-red-400 font-medium leading-relaxed">{error}</p>
              </div>
            )}

            {/* Elegant Form Fields */}
            <form onSubmit={handleCredentialsSubmit} className="space-y-4" noValidate>
              <div className="space-y-0.5">
                <label className="text-[10px] text-white/40 font-black uppercase tracking-widest ml-1">Email or Username</label>
                <input 
                  name="email"
                  type="text" 
                  placeholder="name@example.com or username"
                  className="w-full h-12 md:h-14 bg-white/[0.02] border border-white/5 rounded-2xl px-6 text-sm text-white placeholder:text-white/10 focus:outline-none focus:border-accent/40 focus:bg-accent/[0.02] transition-all"
                />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[10px] text-white/40 font-black uppercase tracking-widest">Password</label>
                  <button type="button" className="text-[10px] text-accent/60 hover:text-accent font-black uppercase tracking-widest transition-colors whitespace-nowrap">Forgot Your Password?</button>
                </div>
                <div className="relative">
                  <input 
                    name="password"
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••"
                    className="w-full h-12 md:h-14 bg-white/[0.02] border border-white/5 rounded-2xl px-6 text-sm text-white placeholder:text-white/10 focus:outline-none focus:border-accent/40 focus:bg-accent/[0.02] transition-all pr-12"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-6 top-1/2 -translate-y-1/2 text-white/10 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full h-12 md:h-14 text-sm font-black uppercase tracking-widest rounded-2xl bg-accent hover:bg-accent/90 text-white shadow-xl shadow-accent/20 active:scale-[0.98] transition-all !mt-6">
                {isSubmitting ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>
          </div>

          <div className="text-center pt-2">
             <p className="text-sm text-white/30 font-medium">
              Don't have an account? <Link href="/register" className="text-white hover:text-accent transition-colors font-bold underline underline-offset-8 decoration-white/10 hover:decoration-accent/40">Join the movement</Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}

export default function SignInContent() {
  return (
    <Suspense fallback={<Loader fullScreen />}>
      <SignInContentInner />
    </Suspense>
  )
}
