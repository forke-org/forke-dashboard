'use client'

import React, { useState, useEffect } from 'react'
import { updateProfileSettings, updateTelemetrySettings } from '@/app/(app)/settings/actions'
import { Save, Sliders, Bell, Laptop, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { toast } from '@/components/shared/Toast'

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
  systemSpecs
}: SettingsFormProps) {
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [emailAlerts, setEmailAlerts] = useState(initialEmailAlerts)
  const [slackWebhooks, setSlackWebhooks] = useState(initialSlackWebhooks)
  const [sslActive, setSslActive] = useState(false)
  const isOwner = role === 'owner'

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
      <form onSubmit={handleSubmit} className={cn("space-y-4", isOwner ? "md:col-span-12" : "md:col-span-8")}>
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

        {/* Form card 1 */}
        <div className="p-5 rounded-xl bg-white/[0.018] border border-[var(--color-border)] space-y-5">
          <h4 className="text-sm font-semibold text-white border-b border-[var(--color-border)] pb-3 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-accent" /> Profile
          </h4>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-[var(--color-text-muted)]">Full name</label>
              <input 
                name="name"
                type="text" 
                required
                defaultValue={initialName} 
                className="w-full h-10 bg-white/[0.02] border border-[var(--color-border)] rounded-lg px-3 text-[13px] text-white outline-none focus:border-accent transition-colors"
              />
            </div>

            {isOwner ? (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[var(--color-text-muted)]">Company name</label>
                  <input 
                    name="companyName"
                    type="text" 
                    defaultValue={initialCompanyName || ''} 
                    className="w-full h-10 bg-white/[0.02] border border-[var(--color-border)] rounded-lg px-3 text-[13px] text-white outline-none focus:border-accent transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[var(--color-text-muted)]">Company website</label>
                  <input 
                    name="companyWebsite"
                    type="text" 
                    defaultValue={initialCompanyWebsite || ''} 
                    className="w-full h-10 bg-white/[0.02] border border-[var(--color-border)] rounded-lg px-3 text-[13px] text-white outline-none focus:border-accent transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[var(--color-text-muted)]">Designation</label>
                  <input 
                    name="designation"
                    type="text" 
                    defaultValue={initialDesignation || ''} 
                    className="w-full h-10 bg-white/[0.02] border border-[var(--color-border)] rounded-lg px-3 text-[13px] text-white outline-none focus:border-accent transition-colors"
                  />
                </div>

                <div className="border-t border-[var(--color-border)] pt-4 mt-4 space-y-4">
                  <h5 className="text-xs font-medium text-[var(--color-text-muted)]">Contact details</h5>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-[var(--color-text-muted)]">Contact email</label>
                    <input 
                      name="contactEmail"
                      type="email" 
                      defaultValue={initialContactEmail || ''} 
                      className="w-full h-10 bg-white/[0.02] border border-[var(--color-border)] rounded-lg px-3 text-[13px] text-white outline-none focus:border-accent transition-colors"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-[var(--color-text-muted)]">Contact number</label>
                    <input 
                      name="contactNumber"
                      type="text" 
                      defaultValue={initialContactNumber || ''} 
                      className="w-full h-10 bg-white/[0.02] border border-[var(--color-border)] rounded-lg px-3 text-[13px] text-white outline-none focus:border-accent transition-colors"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-[var(--color-text-muted)]">Personal LinkedIn</label>
                    <input 
                      name="personalLinkedIn"
                      type="text" 
                      defaultValue={initialPersonalLinkedIn || ''} 
                      className="w-full h-10 bg-white/[0.02] border border-[var(--color-border)] rounded-lg px-3 text-[13px] text-white outline-none focus:border-accent transition-colors"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[var(--color-text-muted)]">Bio</label>
                  <textarea
                    name="bio"
                    defaultValue={initialBio || ''}
                    rows={3}
                    className="w-full bg-white/[0.02] border border-[var(--color-border)] rounded-lg p-3 text-[13px] text-white outline-none focus:border-accent transition-colors resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-[var(--color-text-muted)]">GitHub URL</label>
                  <input 
                    name="githubUrl"
                    type="text" 
                    defaultValue={initialGithubUrl || ''} 
                    placeholder="https://github.com/username"
                    className="w-full h-10 bg-white/[0.02] border border-[var(--color-border)] rounded-lg px-3 text-[13px] text-white outline-none focus:border-accent transition-colors"
                  />
                </div>
              </>
            )}
            
            <button
              type="submit"
              disabled={loading}
              className="h-9 px-4 text-[13px] font-medium rounded-lg ui-btn-primary transition-colors flex items-center gap-1.5 cursor-pointer mt-4 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" /> {loading ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </div>

        {/* Notification settings */}
        <div className="p-5 rounded-xl bg-white/[0.018] border border-[var(--color-border)] space-y-5">
          <h4 className="text-sm font-semibold text-white border-b border-[var(--color-border)] pb-3 flex items-center gap-2">
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
                <h5 className="text-[13px] font-medium text-white">Slack integration</h5>
                <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">Push alerts into your workspace</p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('slackWebhooks')}
                className={cn(
                  "w-9 h-5 rounded-full flex items-center px-0.5 cursor-pointer transition-colors border",
                  slackWebhooks ? "bg-accent/20 border-accent/40" : "bg-white/5 border-white/10"
                )}
              >
                <span className={cn(
                  "w-4 h-4 rounded-full transition-transform",
                  slackWebhooks ? "bg-accent translate-x-4" : "bg-white/30 translate-x-0"
                )} />
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Right Column: system spec sidebar */}
      {!isOwner && (
        <div className="md:col-span-4 space-y-4">
          <div className="rounded-xl bg-white/[0.018] border border-[var(--color-border)]">
            <div className="px-4 py-3 border-b border-[var(--color-border)]">
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                <Laptop className="w-4 h-4 text-accent" /> System
              </h4>
            </div>

            <div className="divide-y divide-[var(--color-border)] text-[13px]">
              <div className="flex justify-between items-center px-4 py-2.5">
                <span className="text-[var(--color-text-muted)]">Runtime</span>
                <span className="text-white font-medium font-mono text-[12px]">{systemSpecs.runtimeVersion}</span>
              </div>
              <div className="flex justify-between items-center px-4 py-2.5">
                <span className="text-[var(--color-text-muted)]">Database</span>
                <span className={cn("font-medium capitalize", systemSpecs.databaseState === 'connected' ? "text-emerald-400" : "text-rose-500")}>
                  {systemSpecs.databaseState} {systemSpecs.dbLatencyMs > 0 && `(${systemSpecs.dbLatencyMs}ms)`}
                </span>
              </div>
              <div className="flex justify-between items-center px-4 py-2.5">
                <span className="text-[var(--color-text-muted)]">SSL</span>
                <span className={cn("font-medium capitalize", sslActive ? "text-emerald-400" : "text-amber-500")}>
                  {sslActive ? 'active' : 'inactive'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
