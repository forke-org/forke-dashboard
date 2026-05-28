'use client'

import React, { useState, useEffect } from 'react'
import { updateProfileSettings, updateTelemetrySettings } from '@/app/(app)/settings/actions'
import { Save, Sliders, Bell, Laptop, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

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
      // Rollback UI state
      if (type === 'emailAlerts') {
        setEmailAlerts(!targetState)
      } else {
        setSlackWebhooks(!targetState)
      }
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
    } else {
      setError(res.error || 'Failed to save settings')
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 text-left pb-16">
      {/* Left Block: settings forms */}
      <form onSubmit={handleSubmit} className="md:col-span-8 space-y-6">
        {success && (
          <div className="p-4 rounded-2xl flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 text-xs font-medium animate-in fade-in slide-in-from-top-2 duration-300">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <p>Settings saved successfully!</p>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2 font-medium animate-in fade-in slide-in-from-top-2 duration-300">
            <AlertTriangle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Form card 1 */}
        <div className="p-6 rounded-[2.5rem] bg-[#0b0b0e] border border-white/[0.04] space-y-6">
          <h4 className="text-xs font-black uppercase text-white/30 tracking-widest font-mono border-b border-white/[0.03] pb-3 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-accent" /> Profile Credentials
          </h4>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-white/40 font-mono">Full Name</label>
              <input 
                name="name"
                type="text" 
                required
                defaultValue={initialName} 
                className="w-full h-11 bg-white/[0.01] border border-white/5 rounded-xl px-4 text-xs text-white outline-none focus:border-accent transition-all"
              />
            </div>

            {isOwner ? (
              <>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-white/40 font-mono">Company Name</label>
                  <input 
                    name="companyName"
                    type="text" 
                    defaultValue={initialCompanyName || ''} 
                    className="w-full h-11 bg-white/[0.01] border border-white/5 rounded-xl px-4 text-xs text-white outline-none focus:border-accent transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-white/40 font-mono">Company Website</label>
                  <input 
                    name="companyWebsite"
                    type="text" 
                    defaultValue={initialCompanyWebsite || ''} 
                    className="w-full h-11 bg-white/[0.01] border border-white/5 rounded-xl px-4 text-xs text-white outline-none focus:border-accent transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-white/40 font-mono">Company Designation</label>
                  <input 
                    name="designation"
                    type="text" 
                    defaultValue={initialDesignation || ''} 
                    className="w-full h-11 bg-white/[0.01] border border-white/5 rounded-xl px-4 text-xs text-white outline-none focus:border-accent transition-all"
                  />
                </div>

                <div className="border-t border-white/[0.03] pt-4 mt-4 space-y-4">
                  <h5 className="text-[9px] font-black text-white/30 uppercase tracking-widest font-mono">Contact Details</h5>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-white/40 font-mono">Contact Email</label>
                    <input 
                      name="contactEmail"
                      type="email" 
                      defaultValue={initialContactEmail || ''} 
                      className="w-full h-11 bg-white/[0.01] border border-white/5 rounded-xl px-4 text-xs text-white outline-none focus:border-accent transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-white/40 font-mono">Contact Number</label>
                    <input 
                      name="contactNumber"
                      type="text" 
                      defaultValue={initialContactNumber || ''} 
                      className="w-full h-11 bg-white/[0.01] border border-white/5 rounded-xl px-4 text-xs text-white outline-none focus:border-accent transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-white/40 font-mono">Personal LinkedIn</label>
                    <input 
                      name="personalLinkedIn"
                      type="text" 
                      defaultValue={initialPersonalLinkedIn || ''} 
                      className="w-full h-11 bg-white/[0.01] border border-white/5 rounded-xl px-4 text-xs text-white outline-none focus:border-accent transition-all"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-white/40 font-mono">Bio Details</label>
                  <textarea 
                    name="bio"
                    defaultValue={initialBio || ''} 
                    rows={3}
                    className="w-full bg-white/[0.01] border border-white/5 rounded-xl p-4 text-xs text-white outline-none focus:border-accent transition-all resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-white/40 font-mono">GitHub Node URL</label>
                  <input 
                    name="githubUrl"
                    type="text" 
                    defaultValue={initialGithubUrl || ''} 
                    placeholder="https://github.com/username"
                    className="w-full h-11 bg-white/[0.01] border border-white/5 rounded-xl px-4 text-xs text-white outline-none focus:border-accent transition-all"
                  />
                </div>
              </>
            )}
            
            <button 
              type="submit"
              disabled={loading}
              className="h-10 px-5 text-[9px] font-black uppercase tracking-widest rounded-xl bg-gradient-to-b from-accent to-[#d97706] text-[#050505] hover:shadow-[0_0_12px_rgba(255,122,0,0.2)] active:translate-y-[1px] transition-all flex items-center gap-1.5 cursor-pointer font-bold mt-4 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5 stroke-[2.5px]" /> {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Notification settings */}
        <div className="p-6 rounded-[2.5rem] bg-[#0b0b0e] border border-white/[0.04] space-y-6">
          <h4 className="text-xs font-black uppercase text-white/30 tracking-widest font-mono border-b border-white/[0.03] pb-3 flex items-center gap-2">
            <Bell className="w-4 h-4 text-accent" /> Telemetry Notifications
          </h4>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.005] border border-white/[0.03]">
              <div>
                <h5 className="text-xs font-bold text-white">Email dispatch alerts</h5>
                <p className="text-[9px] text-white/30 font-light mt-0.5">Receive emails for waitlist updates & contract signoffs</p>
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

            <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.005] border border-white/[0.03]">
              <div>
                <h5 className="text-xs font-bold text-white">Slack Webhook integrations</h5>
                <p className="text-[9px] text-white/30 font-light mt-0.5">Push log alerts directly into your organization workspace</p>
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
      <div className="md:col-span-4 space-y-6">
        <div className="p-6 rounded-[2.5rem] bg-[#0b0b0e] border border-white/[0.04] space-y-6 shadow-xl">
          <h4 className="text-xs font-black uppercase text-white/30 tracking-widest font-mono border-b border-white/[0.03] pb-3 flex items-center gap-2">
            <Laptop className="w-4 h-4 text-accent" /> System Spec
          </h4>

          <div className="space-y-3 font-mono text-[9px] text-white/50">
            <div className="flex justify-between items-center py-1">
              <span>Runtime Host:</span>
              <span className="text-accent uppercase font-bold">{systemSpecs.runtimeVersion}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span>Database State:</span>
              <span className={cn("uppercase font-bold transition-colors", systemSpecs.databaseState === 'connected' ? "text-emerald-400" : "text-rose-500")}>
                {systemSpecs.databaseState} {systemSpecs.dbLatencyMs > 0 && `(${systemSpecs.dbLatencyMs}ms)`}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span>Telemetry SSL:</span>
              <span className={cn("uppercase font-bold transition-colors", sslActive ? "text-emerald-400" : "text-amber-500")}>
                {sslActive ? 'active' : 'inactive'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
