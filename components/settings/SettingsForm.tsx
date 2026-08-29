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
import { updateProfileSettings, updateTelemetrySettings, setupPasswordAction, scheduleAccountDeletionAction, updatePromotionalSubscriptionAction, changePasswordAction } from '@/app/(app)/settings/actions'
import { Save, Sliders, Bell, Laptop, AlertTriangle, CheckCircle2, Link2, Check, Lock, Key, Trash2, Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { toast } from '@/components/shared/Toast'
import { signIn, signOut } from 'next-auth/react'

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  )
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

interface SettingsFormProps {
  userId: string
  role: 'developer' | 'owner'
  initialName: string
  initialBio?: string | null
  initialGithubUrl?: string | null
  initialCompanyName?: string | null
  initialCompanyWebsite?: string | null
  initialDesignation?: string | null
  initialContactNumber?: string | null
  initialContactEmail?: string | null
  initialPersonalLinkedIn?: string | null
  initialEmailAlerts: boolean
  initialSlackWebhooks: boolean
  systemSpecs: {
    databaseState: string
    dbLatencyMs: number
    runtimeVersion: string
  }
  connectedAccounts?: string[]
  hasPassword: boolean
  initialSubscribedToPromotions: boolean
}

export default function SettingsForm({
  userId,
  role,
  initialName,
  initialBio,
  initialGithubUrl,
  initialCompanyName,
  initialCompanyWebsite,
  initialDesignation,
  initialContactNumber,
  initialContactEmail,
  initialPersonalLinkedIn,
  initialEmailAlerts,
  initialSlackWebhooks,
  systemSpecs,
  connectedAccounts = [],
  hasPassword,
  initialSubscribedToPromotions
}: SettingsFormProps) {
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [emailAlerts, setEmailAlerts] = useState(initialEmailAlerts)
  const [slackWebhooks, setSlackWebhooks] = useState(initialSlackWebhooks)
  const [promoSubscribed, setPromoSubscribed] = useState(initialSubscribedToPromotions)
  const [sslActive, setSslActive] = useState(false)
  const isOwner = role === 'owner'

  // New features state
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showOldPass, setShowOldPass] = useState(false)
  const [showNewPass, setShowNewPass] = useState(false)
  const [showConfirmNewPass, setShowConfirmNewPass] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [passSubmitting, setPassSubmitting] = useState(false)
  const [hasLocalPassword, setHasLocalPassword] = useState(hasPassword)

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)

  const isGoogleConnected = connectedAccounts.includes('google')
  const isGithubConnected = connectedAccounts.includes('github')

  const handleConnectGoogle = () => {
    signIn('google', { callbackUrl: window.location.href })
  }

  const handleConnectGithub = () => {
    signIn('github', { callbackUrl: window.location.href })
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSslActive(window.location.protocol === 'https:')
    }
  }, [])

  const handleToggle = async (type: 'emailAlerts' | 'slackWebhooks') => {
    const targetState = type === 'emailAlerts' ? !emailAlerts : !slackWebhooks
    if (type === 'emailAlerts') {
      setEmailAlerts(targetState)
    } else {
      setSlackWebhooks(targetState)
    }

    const res = await updateTelemetrySettings(userId, type, targetState)
    if (!res.success) {
      setError(res.error || 'Failed to update telemetry settings')
      toast(res.error || 'Failed to update telemetry settings', 'error')
      // Rollback UI state
      if (type === 'emailAlerts') {
        setEmailAlerts(!targetState)
      } else {
        setSlackWebhooks(!targetState)
      }
    } else {
      toast(`${type === 'emailAlerts' ? 'Email alert' : 'Slack integration'} updated!`, 'success')
    }
  }

  const handleTogglePromo = async () => {
    const targetState = !promoSubscribed
    setPromoSubscribed(targetState)
    const res = await updatePromotionalSubscriptionAction(userId, targetState)
    if (!res.success) {
      toast(res.error || 'Failed to update subscription status', 'error')
      setPromoSubscribed(!targetState)
    } else {
      toast(targetState ? 'Subscribed to promotional emails!' : 'Unsubscribed from promotional emails!', 'success')
    }
  }

  const handleSetupPassword = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!newPassword || !confirmPassword) {
      toast('Please fill out all password fields.', 'error')
      return
    }
    if (newPassword !== confirmPassword) {
      toast('Passwords do not match.', 'error')
      return
    }
    if (newPassword.length < 8) {
      toast('Password must be at least 8 characters long.', 'error')
      return
    }

    setPassSubmitting(true)
    try {
      const res = await setupPasswordAction(userId, newPassword)
      if (res.success) {
        toast('Password set up successfully! You can now log in using credentials.', 'success')
        setHasLocalPassword(true)
        setNewPassword('')
        setConfirmPassword('')
      } else {
        toast(res.error || 'Failed to setup password.', 'error')
      }
    } catch (err: any) {
      console.error(err)
      toast(err.message || 'An error occurred.', 'error')
    } finally {
      setPassSubmitting(false)
    }
  }

  const handleChangePassword = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast('Please fill out all password fields.', 'error')
      return
    }
    if (newPassword !== confirmPassword) {
      toast('Passwords do not match.', 'error')
      return
    }
    if (newPassword.length < 8) {
      toast('Password must be at least 8 characters long.', 'error')
      return
    }

    setPassSubmitting(true)
    try {
      const res = await changePasswordAction(userId, oldPassword, newPassword)
      if (res.success) {
        toast('Password updated successfully!', 'success')
        setOldPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        toast(res.error || 'Failed to update password.', 'error')
      }
    } catch (err: any) {
      console.error(err)
      toast(err.message || 'An error occurred.', 'error')
    } finally {
      setPassSubmitting(false)
    }
  }

  const handleDeleteAccount = async () => {
    setDeleteSubmitting(true)
    try {
      const res = await scheduleAccountDeletionAction(userId)
      if (res.success) {
        toast('Account scheduled for deletion. Signing out...', 'success')
        setTimeout(async () => {
          await signOut({ callbackUrl: '/?toast=deletion_scheduled' })
        }, 1500)
      } else {
        toast(res.error || 'Failed to schedule deletion', 'error')
      }
    } catch (err: any) {
      console.error(err)
      toast(err.message || 'An error occurred', 'error')
    } finally {
      setDeleteSubmitting(false)
      setShowDeleteModal(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    const formData = new FormData(e.currentTarget)
    const res = await updateProfileSettings(userId, role, formData)

    setLoading(false)
    if (res.success) {
      setSuccess(true)
      toast('Profile credentials updated successfully!', 'success')
    } else {
      setError(res.error || 'Failed to save settings')
      toast(res.error || 'Failed to save settings', 'error')
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-left pb-16">
      {/* Left Block: settings forms */}
      <form onSubmit={handleSubmit} className="space-y-4 md:col-span-12">
        {success && (
          <div className="p-3 rounded-lg flex items-center gap-2.5 bg-emerald-500/[0.07] border border-emerald-500/20 text-emerald-400 text-[13px] animate-in fade-in slide-in-from-top-2 duration-300">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <p>Settings saved successfully.</p>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg flex items-center gap-2 bg-red-500/[0.07] border border-red-500/20 text-red-400 text-[13px] animate-in fade-in slide-in-from-top-2 duration-300">
            <AlertTriangle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Notification settings */}
        <div className="p-5 rounded-xl bg-white/[0.018] border border-[var(--color-border)] space-y-5">
          <h4 className="text-sm font-medium text-white border-b border-[var(--color-border)] pb-3 flex items-center gap-2">
            <Bell className="w-4 h-4 text-accent" /> Notifications
          </h4>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-[var(--color-border)]">
              <div>
                <h5 className="text-[13px] font-medium text-white">Email alerts</h5>
                <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">Emails for task updates &amp; approvals</p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('emailAlerts')}
                className={cn(
                  "w-9 h-5 rounded-full flex items-center px-0.5 cursor-pointer transition-colors border",
                  emailAlerts ? "bg-accent/20 border-accent/40" : "bg-white/5 border-white/10"
                )}
              >
                <span className={cn(
                  "w-4 h-4 rounded-full transition-transform",
                  emailAlerts ? "bg-accent translate-x-4" : "bg-white/30 translate-x-0"
                )} />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-[var(--color-border)]">
              <div>
                <h5 className="text-[13px] font-medium text-white">Promotional emails</h5>
                <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">Receive news, promotions, and updates (unsubscribe to only receive important/transactional emails)</p>
              </div>
              <button
                type="button"
                onClick={handleTogglePromo}
                className={cn(
                  "w-9 h-5 rounded-full flex items-center px-0.5 cursor-pointer transition-colors border",
                  promoSubscribed ? "bg-accent/20 border-accent/40" : "bg-white/5 border-white/10"
                )}
              >
                <span className={cn(
                  "w-4 h-4 rounded-full transition-transform",
                  promoSubscribed ? "bg-accent translate-x-4" : "bg-white/30 translate-x-0"
                )} />
              </button>
            </div>
          </div>
        </div>

        {/* Connected Accounts (Developer only) */}
        {!isOwner && (
          <div className="p-5 rounded-xl bg-white/[0.018] border border-[var(--color-border)] space-y-5">
            <h4 className="text-sm font-medium text-white border-b border-[var(--color-border)] pb-3 flex items-center gap-2">
              <Link2 className="w-4 h-4 text-accent" /> Connected Accounts
            </h4>
            
            <p className="text-[11px] text-[var(--color-text-muted)] -mt-2 leading-relaxed">
              Link your third-party social accounts to enable one-click secure sign-ins, synchronize profile metadata, and gain authorization to claim and ship developer tasks.
            </p>

            <div className="space-y-3">
              {/* Google */}
              <div className="flex items-center justify-between p-3.5 rounded-lg bg-white/[0.02] border border-[var(--color-border)]">
                <div className="flex items-center gap-3">
                  <GoogleIcon className="w-5 h-5 shrink-0" />
                  <div className="min-w-0">
                    <h5 className="text-[13px] font-medium text-white">Google Connection</h5>
                    <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">Use Google to sign in to your Forke account.</p>
                  </div>
                </div>
                <div>
                  {isGoogleConnected ? (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full select-none">
                      <Check className="w-3.5 h-3.5 text-emerald-455" /> Connected
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleConnectGoogle}
                      className="h-7 px-3.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold text-white/90 transition-all cursor-pointer select-none"
                    >
                      Connect
                    </button>
                  )}
                </div>
              </div>

              {/* GitHub */}
              <div className="flex items-center justify-between p-3.5 rounded-lg bg-white/[0.02] border border-[var(--color-border)]">
                <div className="flex items-center gap-3">
                  <GithubIcon className="w-5 h-5 shrink-0 text-white" />
                  <div className="min-w-0">
                    <h5 className="text-[13px] font-medium text-white">GitHub Connection</h5>
                    <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">Required to claim tasks and verify pull request submissions.</p>
                  </div>
                </div>
                <div>
                  {isGithubConnected ? (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full select-none">
                      <Check className="w-3.5 h-3.5 text-emerald-455" /> Connected
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleConnectGithub}
                      className="h-7 px-3.5 rounded-lg bg-[#ff8a00] hover:bg-[#ff8a00]/90 text-xs font-black text-[#0a0a0a] transition-all cursor-pointer select-none"
                    >
                      Connect
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Local Password Setup */}
        {!hasLocalPassword && (
          <div className="p-5 rounded-xl bg-white/[0.018] border border-[var(--color-border)] space-y-5">
            <h4 className="text-sm font-medium text-white border-b border-[var(--color-border)] pb-3 flex items-center gap-2">
              <Key className="w-4 h-4 text-accent" /> Set Up Local Password
            </h4>
            
            <p className="text-[11px] text-[var(--color-text-muted)] -mt-2 leading-relaxed">
              Add a password to log in directly via username/email and password in the future.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1 text-left relative">
                <label className="text-xs font-medium text-[var(--color-text-muted)]">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full h-10 bg-white/[0.02] border border-white/5 rounded-xl px-4 pr-10 text-xs text-white placeholder:text-white/10 focus:outline-none focus:border-accent/40 focus:bg-accent/[0.02] transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1 text-left relative">
                <label className="text-xs font-medium text-[var(--color-text-muted)]">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirmNewPass ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full h-10 bg-white/[0.02] border border-white/5 rounded-xl px-4 pr-10 text-xs text-white placeholder:text-white/10 focus:outline-none focus:border-accent/40 focus:bg-accent/[0.02] transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmNewPass(!showConfirmNewPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  >
                    {showConfirmNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleSetupPassword}
                disabled={passSubmitting || !newPassword || !confirmPassword}
                className="h-8 px-4 rounded-lg bg-[#ff8a00] hover:bg-[#ff8a00]/90 text-xs font-black text-[#0a0a0a] transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none select-none"
              >
                {passSubmitting ? 'Saving...' : 'Set Password'}
              </button>
            </div>
          </div>
        )}

        {/* Change Local Password */}
        {hasLocalPassword && (
          <div className="p-5 rounded-xl bg-white/[0.018] border border-[var(--color-border)] space-y-5">
            <h4 className="text-sm font-medium text-white border-b border-[var(--color-border)] pb-3 flex items-center gap-2">
              <Key className="w-4 h-4 text-accent" /> Change Password
            </h4>
            
            <p className="text-[11px] text-[var(--color-text-muted)] -mt-2 leading-relaxed">
              Update your account password. You will need to enter your current password.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1 text-left relative">
                <label className="text-xs font-medium text-[var(--color-text-muted)]">Current Password</label>
                <div className="relative">
                  <input
                    type={showOldPass ? 'text' : 'password'}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full h-10 bg-white/[0.02] border border-white/5 rounded-xl px-4 pr-10 text-xs text-white placeholder:text-white/10 focus:outline-none focus:border-accent/40 focus:bg-accent/[0.02] transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPass(!showOldPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  >
                    {showOldPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1 text-left relative">
                <label className="text-xs font-medium text-[var(--color-text-muted)]">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full h-10 bg-white/[0.02] border border-white/5 rounded-xl px-4 pr-10 text-xs text-white placeholder:text-white/10 focus:outline-none focus:border-accent/40 focus:bg-accent/[0.02] transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1 text-left relative">
                <label className="text-xs font-medium text-[var(--color-text-muted)]">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirmNewPass ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full h-10 bg-white/[0.02] border border-white/5 rounded-xl px-4 pr-10 text-xs text-white placeholder:text-white/10 focus:outline-none focus:border-accent/40 focus:bg-accent/[0.02] transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmNewPass(!showConfirmNewPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  >
                    {showConfirmNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleChangePassword}
                disabled={passSubmitting || !oldPassword || !newPassword || !confirmPassword}
                className="h-8 px-4 rounded-lg bg-[#ff8a00] hover:bg-[#ff8a00]/90 text-xs font-black text-[#0a0a0a] transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none select-none"
              >
                {passSubmitting ? 'Saving...' : 'Change Password'}
              </button>
            </div>
          </div>
        )}

        {/* Danger Zone */}
        <div className="p-5 rounded-xl bg-red-500/[0.01] border border-red-500/10 space-y-5">
          <h4 className="text-sm font-semibold text-red-400 border-b border-red-500/10 pb-3 flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-red-400" /> Danger Zone
          </h4>
          
          <div className="p-4 rounded-lg bg-red-500/[0.02] border border-red-500/10 space-y-3">
            <h5 className="text-[13px] font-medium text-white">Delete Account</h5>
            <p className="text-[11px] text-white/50 leading-relaxed">
              Once you delete your account, your profile, active listings, and completed works will be scheduled for permanent erasure. 
              Your account will be deleted in <strong>30 days</strong> from our database. Logging back in at any time before the 30-day window expires will cancel the deletion request.
            </p>
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="h-8 px-4 rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 select-none"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Account</span>
            </button>
          </div>
        </div>
      </form>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="bg-[#0b0b0e] border border-red-500/20 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-white">Confirm Account Deletion</h3>
            </div>
            
            <p className="text-xs text-white/60 leading-relaxed">
              Are you absolutely sure you want to schedule your account for deletion? 
              Your data will be held for <strong>30 days</strong>, after which it will be permanently deleted.
              <br /><br />
              <strong>Logging back in at any time within 30 days will cancel the deletion.</strong>
            </p>
            
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteSubmitting}
                className="h-9 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-white/80 transition-all cursor-pointer font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteSubmitting}
                className="h-9 px-4 rounded-xl bg-red-500 hover:bg-red-650 text-xs text-white font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                {deleteSubmitting ? (
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>Confirm Deletion</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
