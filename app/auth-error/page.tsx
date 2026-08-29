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

import React, { Suspense, useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Loader } from '@/components/ui/Loader'
import { submitEnquiry } from '@/lib/actions/support-actions'
import { Info, ArrowLeft, Send, CheckCircle2, ShieldX, AlertTriangle, UserX, FileText, Search, ShieldAlert, Clock, ShieldCheck } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { signOut, useSession } from 'next-auth/react'

function GithubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  )
}

function ErrorContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const errorType = searchParams.get('error')
  const { data: session, status } = useSession()
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    contactNumber: '',
    contactEmail: '',
    message: '',
    relevantLinks: ''
  })
  const [isValid, setIsValid] = useState<boolean | null>(null)

  // Prepopulate form if session data is available
  useEffect(() => {
    if (session?.user) {
      const nameParts = (session.user.name || '').split(' ')
      setFormData(prev => ({
        ...prev,
        firstName: prev.firstName || nameParts[0] || '',
        lastName: prev.lastName || nameParts.slice(1).join(' ') || '',
        contactEmail: prev.contactEmail || session.user.email || '',
        relevantLinks: prev.relevantLinks || session.user.githubUrl || ''
      }))
    }
  }, [session])

  // Ensure they are fully signed out when hitting this page if they had a bad session
  useEffect(() => {
    if (status === 'loading') return

    const hasAuthCookie = document.cookie.includes('forke_auth_error=1')
    const isSessionBanned = session?.user?.isBanned === true

    // Access is valid if:
    // 1. We have a valid errorType
    // 2. AND (they have the handshake cookie OR they are logged in and banned)
    const isAccessValid = errorType && (hasAuthCookie || (errorType === 'AccessDenied' && isSessionBanned))

    if (!isAccessValid) {
      router.push('/')
      return
    }

    setIsValid(true)

    // Clear the cookie so they can't bypass security manually later,
    // but only if they got here via a standard auth flow with the cookie set
    if (hasAuthCookie) {
      document.cookie = "forke_auth_error=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    }
  }, [errorType, status, session, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitError(null)

    const result = await submitEnquiry({ ...formData, errorType })
    
    if (result.success) {
      setSuccess(true)
    } else {
      setSubmitError(result.error || 'Failed to submit enquiry.')
    }
    setIsSubmitting(false)
  }

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  let title = 'Authentication Error'
  let description = 'Something went wrong during the authentication process. Please try again or contact support.'
  let ErrorIcon = AlertTriangle
  let iconColor = 'text-accent'
  let bgColor = 'bg-accent/10'
  let titleColor = 'text-white'
  let imageSrc = '/forke-assets/error-assets/user_ban_forky.png'
  let theme = 'accent'

  if (errorType === 'AccessDenied') {
    title = 'Access Denied'
    description = 'Your account may have been suspended or you do not have permission to access this platform. If you believe this is a mistake, please submit an appeal below.'
    ErrorIcon = ShieldX
    iconColor = 'text-red-500'
    bgColor = 'bg-red-500/10'
    titleColor = 'text-red-400'
    imageSrc = '/forke-assets/error-assets/user_ban_forky.png'
    theme = 'red'
  } else if (errorType === 'GitHubIdentityMismatch') {
    title = 'Identity Conflict'
    description = 'The GitHub profile you are trying to link does not match the one registered to your account. This action was blocked to protect your identity. Please contact support to resolve this.'
    ErrorIcon = GithubIcon as any
    iconColor = 'text-accent'
    bgColor = 'bg-accent/10'
    titleColor = 'text-accent'
    imageSrc = '/forke-assets/error-assets/github_conflict_forky.png'
    theme = 'accent'
  } else if (errorType) {
    description = `An error occurred: ${errorType}. Please contact support.`
  }

  // Parse title to extract last word for italic accent styling
  const titleWords = title.split(' ')
  const mainTitlePart = titleWords.slice(0, -1).join(' ')
  const italicTitlePart = titleWords[titleWords.length - 1]

  if (!isValid) return null

  const renderForm = () => (
    <form onSubmit={handleSubmit} className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 space-y-4 glass shadow-2xl relative overflow-hidden group">
      <div className={`absolute inset-0 bg-gradient-to-br ${theme === 'accent' ? 'from-accent/[0.03]' : 'from-red-500/[0.03]'} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none`} />
      
      <div className="text-center pb-3 border-b border-white/5">
        <h2 className="text-xs font-black uppercase tracking-widest text-white">Contact Support</h2>
      </div>

      {submitError && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2">
          <Info className="w-3 h-3 text-red-400 shrink-0" />
          <p className="text-[10px] text-red-400 font-medium">{submitError}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 relative z-10">
        <div className="space-y-1">
          <label className="text-[10px] text-white/40 font-black uppercase tracking-widest ml-1">First Name</label>
          <input required value={formData.firstName} onChange={e => updateField('firstName', e.target.value)} type="text" className={`w-full h-10 bg-white/[0.02] border border-white/5 rounded-2xl px-4 text-sm text-white placeholder:text-white/10 focus:outline-none ${theme === 'accent' ? 'focus:border-accent/40 focus:bg-accent/[0.02]' : 'focus:border-red-500/40 focus:bg-red-500/[0.02]'} transition-all`} />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] text-white/40 font-black uppercase tracking-widest ml-1">Last Name</label>
          <input required value={formData.lastName} onChange={e => updateField('lastName', e.target.value)} type="text" className={`w-full h-10 bg-white/[0.02] border border-white/5 rounded-2xl px-4 text-sm text-white placeholder:text-white/10 focus:outline-none ${theme === 'accent' ? 'focus:border-accent/40 focus:bg-accent/[0.02]' : 'focus:border-red-500/40 focus:bg-red-500/[0.02]'} transition-all`} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 relative z-10">
        <div className="space-y-1">
          <label className="text-[10px] text-white/40 font-black uppercase tracking-widest ml-1">Email Address</label>
          <input required value={formData.contactEmail} onChange={e => updateField('contactEmail', e.target.value)} type="email" className={`w-full h-10 bg-white/[0.02] border border-white/5 rounded-2xl px-4 text-sm text-white placeholder:text-white/10 focus:outline-none ${theme === 'accent' ? 'focus:border-accent/40 focus:bg-accent/[0.02]' : 'focus:border-red-500/40 focus:bg-red-500/[0.02]'} transition-all`} />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] text-white/40 font-black uppercase tracking-widest ml-1">Contact Number</label>
          <input required value={formData.contactNumber} onChange={e => updateField('contactNumber', e.target.value)} type="tel" className={`w-full h-10 bg-white/[0.02] border border-white/5 rounded-2xl px-4 text-sm text-white placeholder:text-white/10 focus:outline-none ${theme === 'accent' ? 'focus:border-accent/40 focus:bg-accent/[0.02]' : 'focus:border-red-500/40 focus:bg-red-500/[0.02]'} transition-all`} />
        </div>
      </div>

      <div className="space-y-1 relative z-10">
        <label className="text-[10px] text-white/40 font-black uppercase tracking-widest ml-1">Message</label>
        <textarea required value={formData.message} onChange={e => updateField('message', e.target.value)} className={`w-full h-20 bg-white/[0.02] border border-white/5 rounded-2xl p-4 text-sm text-white placeholder:text-white/10 focus:outline-none ${theme === 'accent' ? 'focus:border-accent/40 focus:bg-accent/[0.02]' : 'focus:border-red-500/40 focus:bg-red-500/[0.02]'} transition-all resize-none`} placeholder="Please describe your issue..." />
      </div>

      <div className="space-y-1 relative z-10">
        <label className="text-[10px] text-white/40 font-black uppercase tracking-widest ml-1 flex justify-between">
          Relevant Links <span className="text-[8px] lowercase opacity-50 font-medium">optional</span>
        </label>
        <input value={formData.relevantLinks} onChange={e => updateField('relevantLinks', e.target.value)} type="text" className={`w-full h-10 bg-white/[0.02] border border-white/5 rounded-2xl px-4 text-sm text-white placeholder:text-white/10 focus:outline-none ${theme === 'accent' ? 'focus:border-accent/40 focus:bg-accent/[0.02]' : 'focus:border-red-500/40 focus:bg-red-500/[0.02]'} transition-all`} placeholder="GitHub profile, portfolio, etc." />
      </div>

      <Button 
        type="submit"
        disabled={isSubmitting}
        className={`w-full h-11 text-xs font-black uppercase tracking-widest rounded-2xl ${theme === 'accent' ? 'bg-accent hover:bg-accent/90 shadow-accent/20' : 'bg-red-500 hover:bg-red-600 shadow-red-500/20'} text-white shadow-xl disabled:opacity-30 disabled:pointer-events-none transition-all mt-2 relative z-10 active:scale-[0.98]`}
      >
        {isSubmitting ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            <span>Sending...</span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <span>Submit Enquiry</span> <Send className="w-3 h-3" />
          </div>
        )}
      </Button>

      <button 
        type="button" 
        onClick={() => signOut({ callbackUrl: '/' })} 
        className="w-full h-11 border border-white/5 bg-transparent hover:bg-white/[0.03] text-white/40 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-[0.98] transition-all mt-2 relative z-10 flex items-center justify-center gap-2"
      >
        <ArrowLeft className="w-3 h-3" /> Return Home
      </button>
    </form>
  )

  const renderSuccess = () => (
    <div className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 text-center space-y-4 glass shadow-2xl animate-in fade-in zoom-in duration-500">
      <div className="flex justify-center">
        <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-6 h-6" />
        </div>
      </div>
      <h2 className="text-xl font-serif text-white tracking-tight">Message Received</h2>
      <p className="text-xs text-white/50 leading-relaxed max-w-[320px] mx-auto">We have received your enquiry and will get back to you shortly via the provided email.</p>
      <Button onClick={() => signOut({ callbackUrl: '/' })} className="w-full h-12 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest active:scale-[0.98] transition-all">
        Return to Home
      </Button>
    </div>
  )

  return (
    <div className="h-screen w-full bg-[#0A0A0A] flex flex-col md:flex-row overflow-hidden selection:bg-accent selection:text-white fixed inset-0">
      {/* Left Panel: dynamic graphic background, text & progress tracker overlay */}
      <div className="w-full aspect-square md:w-auto md:h-full md:aspect-square shrink-0 bg-[#050505] flex flex-col justify-between relative overflow-hidden select-none py-6 md:py-12 border-b md:border-b-0 md:border-r border-white/5">
        
        {/* Subtle background ambient orb behind Forky */}
        <div className="absolute top-[15%] left-[10%] w-[80%] h-[30%] bg-accent/5 blur-[120px] rounded-full pointer-events-none" />

        {/* Mascot Image Illustration - Positioned absolutely as a background spanning the full left half */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <Image
            src={imageSrc}
            alt={title}
            fill
            className="object-cover object-center opacity-95 transition-all duration-700 hover:scale-[1.02]"
            priority
          />
        </div>

        {/* Top section: Back to Home button at top left of left panel */}
        <div className="w-full flex justify-start pl-4 md:pl-8 relative z-10">
          <button 
            onClick={() => signOut({ callbackUrl: '/' })}
            className={`flex items-center gap-2 text-[10px] text-white/40 ${theme === 'accent' ? 'hover:text-accent' : 'hover:text-red-500'} font-black uppercase tracking-[0.2em] transition-all group`}
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
            Back to Home
          </button>
        </div>

        {/* Spacer to push text and progress tracker overlay down on top of the bottom edge of the photo */}
        <div className="flex-grow pointer-events-none" />

        {/* Dynamic Text and Stepper Overlay - Hidden on mobile for aspect ratio optimization */}
        <div className="hidden md:flex flex-col items-center text-center px-8 w-full z-10 space-y-6 mt-auto pb-4">
          
          {/* Main Title and Dynamic Descriptions matching the screenshots */}
          <div className="space-y-3">
            {theme === 'accent' ? (
              <>
                <h2 className="text-3xl font-serif text-white tracking-tight leading-tight">
                  Identity <span className="text-accent italic">Conflict</span>
                </h2>
                <div className="text-xs text-white/50 space-y-1 font-medium leading-relaxed max-w-[380px] mx-auto">
                  <p>The GitHub profile you are trying to link does not match</p>
                  <p>the one registered to your account.</p>
                  <p>This action was blocked to <span className="text-accent font-bold">protect your identity.</span></p>
                  <p>Please contact support to resolve this.</p>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-3xl font-serif text-white tracking-tight leading-tight">
                  Your grind has been <span className="text-accent italic">paused.</span>
                </h2>
                <div className="text-xs text-white/50 space-y-1 font-medium leading-relaxed max-w-[380px] mx-auto">
                  <p>Every legend hits a setback.</p>
                  <p>Appeal your case and <span className="text-accent font-bold">get back to shipping.</span></p>
                </div>
              </>
            )}
          </div>

          {/* Dotted Stepper Progress Tracker pill card matching screenshot */}
          <div className="w-full max-w-[420px] bg-white/[0.02] border border-white/5 rounded-[24px] p-4 flex items-center justify-between relative backdrop-blur-md z-10 shadow-2xl">
            {/* Absolute dashed line centered vertically behind the node icon circle */}
            <div className="absolute top-[32px] left-[12%] right-[12%] h-[1px] border-t border-dashed border-white/10 z-0 pointer-events-none" />

            {(theme === 'accent' ? [
              { label: 'Issue Detected', icon: FileText, active: false },
              { label: 'Verification Required', icon: Search, active: true },
              { label: 'Security Check', icon: ShieldAlert, active: false },
              { label: 'Resolution', icon: CheckCircle2, active: false },
            ] : [
              { label: 'Report Received', icon: FileText, active: false },
              { label: 'Under Review', icon: Clock, active: true },
              { label: 'Moderator Check', icon: Search, active: false },
              { label: 'Decision', icon: ShieldCheck, active: false },
            ]).map((step, idx) => {
              const StepIcon = step.icon
              return (
                <div key={idx} className="flex flex-col items-center flex-1 relative z-10">
                  <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-500 ${
                    step.active 
                      ? 'bg-accent/10 border-accent/30 text-accent shadow-[0_0_15px_rgba(249,115,22,0.15)] scale-110' 
                      : 'bg-white/[0.01] border-white/5 text-white/30'
                  }`}>
                    <StepIcon className="w-4 h-4" />
                  </div>
                  <span className={`text-[8px] font-black uppercase tracking-wider mt-2.5 text-center transition-colors duration-500 max-w-[80px] leading-tight ${
                    step.active ? 'text-accent' : 'text-white/30'
                  }`}>
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>

        </div>

        {/* Elegant overlay fade to right side */}
        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-r from-transparent to-[#0A0A0A]/40 hidden md:block pointer-events-none z-20" />
      </div>

      {/* Right Panel: Orangish/Red elegant form */}
      <div className="flex-1 h-full flex flex-col items-center justify-between relative bg-[#0A0A0A] px-6 py-8 md:py-12 overflow-y-auto overflow-x-hidden">
        {/* Ambient Glows */}
        <div className={`absolute top-1/4 -right-20 w-64 h-64 ${theme === 'accent' ? 'bg-accent/10' : 'bg-red-500/10'} blur-[100px] rounded-full pointer-events-none`} />
        <div className={`absolute bottom-1/4 -left-20 w-48 h-48 ${theme === 'accent' ? 'bg-accent/5' : 'bg-red-500/5'} blur-[80px] rounded-full pointer-events-none`} />

        {/* Content Box */}
        <div className="w-full max-w-[420px] relative z-10 my-auto animate-in fade-in slide-in-from-bottom-4 duration-500 py-8 space-y-6">
          <div className="flex flex-col items-center text-center">
            <div className={`w-12 h-12 rounded-2xl ${theme === 'accent' ? 'bg-accent/10' : 'bg-red-500/10'} flex items-center justify-center mb-3`}>
              <ErrorIcon className={`w-6 h-6 ${iconColor}`} />
            </div>
            <h1 className="text-3xl font-serif text-white tracking-tight">
              {mainTitlePart} <span className={`italic ${theme === 'accent' ? 'text-accent' : 'text-red-500'}`}>{italicTitlePart}</span>
            </h1>
            <p className="text-xs text-white/50 mt-2 max-w-[360px] font-medium leading-relaxed">
              {description}
            </p>
          </div>

          {success ? renderSuccess() : renderForm()}
        </div>

        {/* Brand Legal Footer */}
        <div className="w-full max-w-[500px] text-center relative z-10 pt-4">
          <p className="text-[9px] md:text-[10px] text-white/20 font-bold uppercase tracking-widest leading-none whitespace-nowrap overflow-visible">
            By using Forke, you are agreeing to the <Link href="/terms" className={`text-white/40 ${theme === 'accent' ? 'hover:text-accent' : 'hover:text-red-500'} transition-colors underline underline-offset-4 decoration-white/5 ${theme === 'accent' ? 'hover:decoration-accent/40' : 'hover:decoration-red-500/40'}`}>Terms of Services</Link> and <Link href="/privacy" className={`text-white/40 ${theme === 'accent' ? 'hover:text-accent' : 'hover:text-red-500'} transition-colors underline underline-offset-4 decoration-white/5 ${theme === 'accent' ? 'hover:decoration-accent/40' : 'hover:decoration-red-500/40'}`}>Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<Loader text="LOADING ERROR DETAILS" />}>
      <ErrorContent />
    </Suspense>
  )
}
