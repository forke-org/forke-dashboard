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
import { signInWithGoogle, signInWithGitHub, registerDeveloperWithCredentials } from '@/lib/auth-actions'
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Eye, EyeOff, GitMerge, Mail, Plus, ShieldCheck } from 'lucide-react'
import { RiGithubFill, RiGoogleFill } from '@remixicon/react'
import AuthShell, { Divider, ErrorNote, Eyebrow, Field, fieldClass, ghostBtn, primaryBtn } from './AuthShell'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

import { submitOwnerApplication } from '@/lib/owner-actions'
import { deleteCurrentUser } from '@/lib/actions/user-actions'
import { useSession, signIn, signOut } from 'next-auth/react'
import { Loader } from '@/components/ui/Loader'

function RegisterContentInner() {
  const { data: session, status: sessionStatus } = useSession()
  const searchParams = useSearchParams()
  const [role, setRole] = useState<'developer' | 'owner' | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [lastUsed, setLastUsed] = useState<string | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [devUsername, setDevUsername] = useState('')
  const [promoChecked, setPromoChecked] = useState(true)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    contactNumber: '',
    contactEmail: '',
    companyName: '',
    companyWebsite: '',
    personalLinkedIn: '',
    companyLinkedIn: '',
    designation: '',
    otherLinks: '',
    message: ''
  })

  // Auto-verify if session exists
  const isGoogleAuthenticated = sessionStatus === 'authenticated'
  const isAlreadyDeveloper = session?.user?.role === 'developer'

  // Load persisted data on mount
  useEffect(() => {
    const savedData = localStorage.getItem('forke_client_app_draft')
    if (savedData) {
      try {
        setFormData(JSON.parse(savedData))
      } catch (e) {
        console.error('Failed to parse form draft')
      }
    }
  }, [])

  // Persist data whenever it changes
  const updateField = (name: string, value: string) => {
    const newDraft = { ...formData, [name]: value }
    setFormData(newDraft)
    localStorage.setItem('forke_client_app_draft', JSON.stringify(newDraft))
  }

  useEffect(() => {
    const saved = localStorage.getItem('forke_last_auth')
    if (saved) setLastUsed(saved)

    const roleParam = searchParams.get('role')
    if (roleParam === 'developer') {
      setRole('developer')
    } else if (roleParam === 'owner' || roleParam === 'client') {
      setRole('owner')
    }
  }, [searchParams])

  const handleSocialClick = async (provider: 'google' | 'github') => {
    if (!role) return
    localStorage.setItem('forke_last_auth', provider)
    
    const isProdDomain = typeof window !== 'undefined' && window.location.hostname.endsWith('forke.space')
    const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL || (isProdDomain ? 'https://dashboard.forke.space' : 'http://localhost:3001')
    // For clients, we want to redirect back here to finish the form
    const redirectTo = role === 'owner' ? '/register?role=owner' : `${dashboardUrl}/dashboard`
    
    if (provider === 'google') {
      await signInWithGoogle(role, redirectTo)
    } else {
      await signInWithGitHub(role, redirectTo)
    }
  }

  const handleClientSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!isGoogleAuthenticated) return
    setIsSubmitting(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const data = {
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      contactNumber: formData.get('contactNumber') as string,
      contactEmail: formData.get('contactEmail') as string,
      companyName: formData.get('companyName') as string,
      companyWebsite: formData.get('companyWebsite') as string,
      personalLinkedIn: formData.get('personalLinkedIn') as string,
      companyLinkedIn: formData.get('companyLinkedIn') as string,
      designation: formData.get('designation') as string,
      otherLinks: formData.get('otherLinks') as string,
      message: formData.get('message') as string,
      receivePromotions: promoChecked,
    }

    if (!data.firstName || !data.lastName || !data.contactEmail || !data.companyName || !data.designation) {
      setError('Please fill out all required fields.')
      setIsSubmitting(false)
      return
    }

    const result = await submitOwnerApplication(data)
    if (result.success) {
      setIsSubmitted(true)
      localStorage.removeItem('forke_client_app_draft') // Clear on success
    } else {
      setError(result.error || 'Submission failed')
    }
    setIsSubmitting(false)
  }

  const handleDeveloperSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    const data = {
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      confirmPassword: formData.get('confirmPassword') as string,
      username: devUsername,
      receivePromotions: promoChecked,
    }

    if (!data.firstName || !data.lastName || !data.email || !data.password || !data.confirmPassword || !data.username) {
      setError('Please fill out all required fields including username.')
      setIsSubmitting(false)
      return
    }

    const result = await registerDeveloperWithCredentials(data)
    if (result.success) {
      const isProdDomain = typeof window !== 'undefined' && window.location.hostname.endsWith('forke.space')
      const domainAttr = isProdDomain ? '; domain=.forke.space' : ''
      document.cookie = `forke_role=developer; path=/; max-age=3600${domainAttr}`
      const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL || (isProdDomain ? 'https://dashboard.forke.space' : 'http://localhost:3001')
      await signIn('credentials', {
        email: data.email,
        password: data.password,
        callbackUrl: `${dashboardUrl}/dashboard`
      })
    } else {
      setError(result.error || 'Registration failed')
      setIsSubmitting(false)
    }
  }

  const pickRole = (r: 'developer' | 'owner') => {
    setRole(r)
    document.cookie = `forke_role=${r}; path=/; max-age=3600`
  }

  const social = (provider: 'google' | 'github', label: string, Icon: typeof RiGoogleFill) => (
    <button type="button" onClick={() => handleSocialClick(provider)} className={ghostBtn}>
      <Icon className="h-[18px] w-[18px]" />
      {label}
      {lastUsed === provider && (
        <span className="absolute -top-2 right-4 rounded-full bg-accent px-2 py-0.5 font-mono text-[10px] text-[#1a0a00]">last used</span>
      )}
    </button>
  )

  const password = (name: string, label: string, shown: boolean, toggle: () => void, auto: string) => (
    <Field label={label}>
      <span className="relative">
        <input required name={name} type={shown ? 'text' : 'password'} autoComplete={auto} placeholder="••••••••" className={`${fieldClass} pr-11`} />
        <button
          type="button"
          onClick={toggle}
          aria-label={shown ? 'Hide password' : 'Show password'}
          className="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-white/45 hover:bg-white/[0.06] hover:text-white"
        >
          {shown ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </span>
    </Field>
  )

  const consent = (
    <div className="space-y-2.5">
      <label className="flex items-start gap-3 text-[13px] leading-5 text-white/55">
        <input type="checkbox" checked readOnly onClick={(e) => e.preventDefault()} className="mt-0.5 h-4 w-4 shrink-0 accent-[#FF7A00]" />
        <span>
          I agree to the <Link href="/terms" className="text-white underline decoration-white/20 underline-offset-2 hover:decoration-accent">Terms</Link> and{' '}
          <Link href="/privacy" className="text-white underline decoration-white/20 underline-offset-2 hover:decoration-accent">Privacy Policy</Link>.
        </span>
      </label>
      <label className="flex items-start gap-3 text-[13px] leading-5 text-white/55">
        <input type="checkbox" checked={promoChecked} onChange={(e) => setPromoChecked(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-[#FF7A00]" />
        <span>Send me product updates now and then.</span>
      </label>
    </div>
  )

  const backToRoles = (
    <button type="button" onClick={() => setRole(null)} className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-white/45 transition-colors hover:text-white">
      <ArrowLeft className="h-4 w-4" /> Change role
    </button>
  )

  // ── after an owner application is sent ──
  if (isSubmitted) {
    return (
      <AuthShell caption="We read every application ourselves.">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/15 text-accent">
          <CheckCircle2 className="h-6 w-6" />
        </span>
        <h1 className="mt-6 text-[30px] font-medium leading-tight tracking-[-0.035em] text-white">Application received.</h1>
        <p className="mt-3 text-[15px] leading-7 text-white/55">
          Thanks for applying to post tasks on Forke. We check every company so developers only see real work. Expect an email from us within 24 to 48 hours.
        </p>
        <div className="mt-6 flex items-center gap-2 rounded-[12px] border border-white/10 bg-white/[0.03] px-4 py-3 text-[13.5px] text-white/65">
          <Mail className="h-4 w-4 text-accent" /> Watch {formData.contactEmail || 'your inbox'} for the decision.
        </div>
        <Link href="/" className={`${ghostBtn} mt-8`}>Back to forke.space</Link>
      </AuthShell>
    )
  }

  // ── step 1: pick a role ──
  if (!role) {
    const roles = [
      {
        key: 'developer' as const,
        eyebrow: 'For developers',
        title: 'Ship tasks. Get paid.',
        points: ['Claim scoped tasks from real codebases', 'Your PR is reviewed, then merged', 'Escrowed bounty lands in your UPI'],
        chip: (
          <span className="inline-flex self-start items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 font-mono text-[11px] text-emerald-300">
            <GitMerge className="h-3.5 w-3.5" /> PR #412 merged
          </span>
        ),
      },
      {
        key: 'owner' as const,
        eyebrow: 'For repo owners',
        title: 'Post tasks. Get them shipped.',
        points: ['Turn your backlog into scoped bounties', 'Pay only when you approve the merge', 'Verified developers, reviewed work'],
        chip: (
          <span className="inline-flex self-start items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 font-mono text-[11px] text-accent-text">
            <Plus className="h-3.5 w-3.5" /> task posted · escrow funded
          </span>
        ),
      },
    ]
    return (
      <AuthShell wide caption={<>Two sides of the same merge.</>}>
        <Eyebrow>Create your account</Eyebrow>
        <h1 className="text-[32px] font-medium leading-tight tracking-[-0.035em] text-white">How will you use Forke?</h1>
        <p className="mt-2 text-[14.5px] text-white/50">Pick one. You can&rsquo;t switch roles on the same account later.</p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {roles.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => pickRole(r.key)}
              className="group flex flex-col rounded-[18px] border border-white/[0.1] bg-white/[0.02] p-5 text-left transition-colors hover:border-accent/60 hover:bg-accent/[0.04]"
            >
              {r.chip}
              <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.12em] text-white/40">{r.eyebrow}</p>
              <p className="mt-1.5 text-[20px] font-medium leading-snug tracking-[-0.025em] text-white">{r.title}</p>
              <ul className="mt-4 space-y-2 text-[13.5px] text-white/55">
                {r.points.map((p) => (
                  <li key={p} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" /> {p}
                  </li>
                ))}
              </ul>
              <span className="mt-auto inline-flex items-center gap-1.5 pt-6 text-[14px] text-white/80 group-hover:text-white">
                Continue <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </button>
          ))}
        </div>
        <p className="mt-8 text-[14px] text-white/50">
          Already have an account?{' '}
          <Link href="/signin" className="text-white underline decoration-white/20 underline-offset-4 hover:decoration-accent">
            Sign in
          </Link>
        </p>
      </AuthShell>
    )
  }

  // ── step 2a: repo owner application ──
  if (role === 'owner') {
    const text = (name: keyof typeof formData, label: string, placeholder: string, opts: { type?: string; optional?: boolean; span?: boolean } = {}) => (
      <div className={opts.span ? 'sm:col-span-2' : ''}>
        <Field label={label} hint={opts.optional ? <span className="text-[12px] font-normal text-white/30">optional</span> : undefined}>
          <input
            name={name}
            required={!opts.optional}
            type={opts.type ?? 'text'}
            value={formData[name]}
            onChange={(e) => updateField(name, e.target.value)}
            placeholder={placeholder}
            className={fieldClass}
          />
        </Field>
      </div>
    )
    return (
      <AuthShell wide caption="Your tasks only go live once you are approved.">
        {backToRoles}
        <Eyebrow>Repo owner application</Eyebrow>
        <h1 className="text-[30px] font-medium leading-tight tracking-[-0.035em] text-white">Tell us about your team.</h1>
        <p className="mt-2 text-[14.5px] text-white/50">We review every company so developers only see real work.</p>

        <form onSubmit={handleClientSubmit} noValidate className="mt-8 space-y-8">
          {/* 1 · identity */}
          <section className="rounded-[16px] border border-white/[0.1] p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="flex items-center gap-2 text-[14.5px] font-medium text-white">
                  <ShieldCheck className="h-4 w-4 text-accent" /> Verify with Google
                </p>
                <p className="mt-0.5 text-[13px] text-white/45">
                  {sessionStatus === 'loading' ? 'Checking…' : isGoogleAuthenticated ? session?.user?.email : 'We use it to confirm who is applying.'}
                </p>
              </div>
              {isGoogleAuthenticated && !isAlreadyDeveloper && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-400/10 px-2.5 py-1 text-[12px] text-emerald-300">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Verified
                </span>
              )}
            </div>
            {isAlreadyDeveloper ? (
              <div className="mt-4">
                <ErrorNote>
                  This Google account is already a developer account. Use a different one to apply as an owner.{' '}
                  <button type="button" onClick={() => { window.location.href = '/api/auth/logout?callbackUrl=' + encodeURIComponent('/register?role=owner') }} className="underline">
                    Switch account
                  </button>
                </ErrorNote>
              </div>
            ) : isGoogleAuthenticated ? (
              <button
                type="button"
                onClick={async () => {
                  await deleteCurrentUser()
                  window.location.href = '/api/auth/logout?callbackUrl=' + encodeURIComponent('/register?role=owner')
                }}
                className="mt-3 text-[12.5px] text-white/40 underline-offset-2 hover:text-white hover:underline"
              >
                Use a different account
              </button>
            ) : (
              <button
                type="button"
                disabled={sessionStatus === 'loading'}
                onClick={() => {
                  document.cookie = 'forke_role=owner; path=/; max-age=3600'
                  signIn('google', { callbackUrl: '/register?role=owner' })
                }}
                className={`${ghostBtn} mt-4`}
              >
                <RiGoogleFill className="h-[18px] w-[18px]" /> Continue with Google
              </button>
            )}
          </section>

          {/* 2 · you */}
          <section>
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-white/40">You</p>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              {text('firstName', 'First name', 'Aarav')}
              {text('lastName', 'Last name', 'Mehta')}
              {text('designation', 'Role', 'CTO, founder, engineering lead…')}
              {text('contactNumber', 'Phone', '+91 98765 43210', { type: 'tel' })}
              {text('contactEmail', 'Work email', 'you@company.com', { type: 'email', span: true })}
              {text('personalLinkedIn', 'Your LinkedIn', 'linkedin.com/in/…', { type: 'url', span: true })}
            </div>
          </section>

          {/* 3 · company */}
          <section>
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-white/40">Company</p>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              {text('companyName', 'Company name', 'Acme Labs')}
              {text('companyWebsite', 'Website', 'https://acme.dev', { type: 'url', optional: true })}
              {text('companyLinkedIn', 'Company LinkedIn', 'linkedin.com/company/…', { type: 'url', span: true })}
              {text('otherLinks', 'Other links', 'GitHub org, press, portfolio…', { optional: true, span: true })}
              <div className="sm:col-span-2">
                <Field label="What will you post?" hint={<span className="text-[12px] font-normal text-white/30">optional</span>}>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={(e) => updateField('message', e.target.value)}
                    rows={3}
                    placeholder="A few examples of tasks from your backlog."
                    className={`${fieldClass} h-auto resize-none py-3`}
                  />
                </Field>
              </div>
            </div>
          </section>

          {consent}
          {error && <ErrorNote>{error}</ErrorNote>}
          <button type="submit" disabled={!isGoogleAuthenticated || isAlreadyDeveloper || isSubmitting} className={primaryBtn}>
            {isSubmitting ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" /> : 'Submit application'}
          </button>
          {!isGoogleAuthenticated && <p className="-mt-4 text-center text-[12.5px] text-white/35">Verify with Google first to submit.</p>}
        </form>
      </AuthShell>
    )
  }

  // ── step 2b: developer sign up ──
  return (
    <AuthShell caption={<>&ldquo;Ship real work. Get paid the day it merges.&rdquo;</>}>
      {backToRoles}
      <Eyebrow>Developer account</Eyebrow>
      <h1 className="text-[30px] font-medium leading-tight tracking-[-0.035em] text-white">Create your account</h1>
      <p className="mt-2 text-[14.5px] text-white/50">Takes a minute. Your first task is waiting.</p>

      <div className="mt-8 grid grid-cols-2 gap-3">
        {social('google', 'Google', RiGoogleFill)}
        {social('github', 'GitHub', RiGithubFill)}
      </div>

      <Divider>or with email</Divider>

      <form onSubmit={handleDeveloperSubmit} noValidate className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name">
            <input required name="firstName" autoComplete="given-name" placeholder="Riya" className={fieldClass} />
          </Field>
          <Field label="Last name">
            <input required name="lastName" autoComplete="family-name" placeholder="Sharma" className={fieldClass} />
          </Field>
        </div>
        <Field label="Email">
          <input required name="email" type="email" autoComplete="email" placeholder="you@email.com" className={fieldClass} />
        </Field>
        <Field label="Username" hint={<span className="font-mono text-[11.5px] font-normal text-white/30">forke.space/{devUsername || 'you'}</span>}>
          <input
            required
            name="username"
            value={devUsername}
            onChange={(e) => setDevUsername(e.target.value.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 39))}
            autoComplete="username"
            placeholder="riyabuilds"
            className={fieldClass}
          />
        </Field>
        {password('password', 'Password', showPassword, () => setShowPassword(!showPassword), 'new-password')}
        {password('confirmPassword', 'Confirm password', showConfirmPassword, () => setShowConfirmPassword(!showConfirmPassword), 'new-password')}
        {consent}
        {error && <ErrorNote>{error}</ErrorNote>}
        <button type="submit" disabled={isSubmitting} className={`${primaryBtn} mt-1`}>
          {isSubmitting ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" /> : 'Create account'}
        </button>
      </form>

      <p className="mt-8 text-[14px] text-white/50">
        Already have an account?{' '}
        <Link href="/signin" className="text-white underline decoration-white/20 underline-offset-4 hover:decoration-accent">
          Sign in
        </Link>
      </p>
    </AuthShell>
  )
}

export default function RegisterContent() {
  return (
    <Suspense fallback={<Loader fullScreen />}>
      <RegisterContentInner />
    </Suspense>
  )
}
