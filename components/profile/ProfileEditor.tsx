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

import React, { useRef, useState, useEffect } from 'react'
import { Eye, EyeOff, Save, Upload, Loader2, Globe, Camera, X, GraduationCap } from 'lucide-react'
import { updateProfile, uploadAvatar, getLinkedAvatars } from '@/lib/actions/profile-actions'

function Github({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  )
}

function Linkedin({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
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

import { toast } from '@/components/shared/Toast'
import PublicProfileView, { ProfileData } from './PublicProfileView'

export default function ProfileEditor({ data }: { data: ProfileData }) {
  const [preview, setPreview] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [avatarModalOpen, setAvatarModalOpen] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    name: data.name || '',
    headline: data.headline || '',
    bio: data.bio || '',
    location: data.location || '',
    college: data.college || '',
    githubUrl: data.githubUrl || '',
    linkedinUrl: data.linkedinUrl || '',
    websiteUrl: data.websiteUrl || '',
  })
  const [avatarUrl, setAvatarUrl] = useState<string | null>(data.avatarUrl)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  // Live preview merges edits over the computed base data.
  const previewData: ProfileData = { ...data, ...form, avatarUrl }

  const bioCharCount = (form.bio || '').length
  const isBioOverLimit = bioCharCount > 2500

  async function handleSave() {
    setSaving(true)
    const res = await updateProfile({ ...form, avatarUrl })
    if (res.success) toast('Profile saved!', 'success')
    else toast(res.error || 'Could not save profile', 'error')
    setSaving(false)
  }

  async function handleAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setAvatarModalOpen(false)
    const fd = new FormData()
    fd.append('file', file)
    const res = await uploadAvatar(fd)
    if (res.success && res.url) {
      setAvatarUrl(res.url)
      toast('Avatar uploaded! Click Save to apply.', 'success')
    } else {
      toast(res.error || 'Upload failed', 'error')
    }
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  function handleSelectOAuthAvatar(url: string) {
    setAvatarUrl(url)
    setAvatarModalOpen(false)
    toast('Avatar selected! Click Save to apply.', 'success')
  }

  return (
    <div className="flex flex-col gap-4 lg:h-full lg:min-h-0 max-w-7xl mx-auto w-full min-[1920px]:max-w-[1920px]">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap shrink-0">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight">{preview ? 'Public preview' : 'Edit your profile'}</h1>
          <p className="text-[13px] text-white/40 mt-0.5">
            {preview ? 'This is exactly what visitors see at your public link.' : 'Fill in your details, then hit the eye to preview your public profile.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPreview((p) => !p)}
            className="h-9 px-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-xs font-bold text-white flex items-center gap-2 cursor-pointer"
            title="Toggle public preview"
          >
            {preview ? <><EyeOff className="w-4 h-4" /> Back to editing</> : <><Eye className="w-4 h-4" /> Preview public</>}
          </button>
        </div>
      </div>

      <div className="lg:flex-grow lg:min-h-0">
      {preview ? (
        <PublicProfileView data={previewData} contained />
      ) : (
        <div className="rounded-2xl border border-white/[0.06] bg-[#0c0c0f]/60 backdrop-blur-xl p-6 md:p-8 space-y-6 lg:h-full lg:overflow-y-auto">
          {/* Avatar */}
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => setAvatarModalOpen(true)}
              className="relative w-24 h-24 rounded-full border border-[#ff8a00]/40 bg-accent/10 overflow-hidden shrink-0 group cursor-pointer"
            >
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="w-full h-full flex items-center justify-center text-3xl font-black text-accent">
                  {form.name?.[0]?.toUpperCase() || 'F'}
                </span>
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                {uploading ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Camera className="w-5 h-5 text-white" />}
              </div>
            </button>
            <div>
              <p className="text-sm font-medium text-white">Profile photo</p>
              <p className="text-[12px] text-white/40 mt-0.5">PNG, JPG, WebP or GIF · up to 5MB</p>
              <button onClick={() => setAvatarModalOpen(true)} className="mt-2 h-8 px-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold text-white/80 cursor-pointer transition-colors">
                Change photo
              </button>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleAvatar} className="hidden" />
            </div>
          </div>

          {/* Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Display name" value={form.name} onChange={set('name')} placeholder="Your name" />
            <Field label="Location" value={form.location} onChange={set('location')} placeholder="e.g. Bengaluru, India" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Headline" value={form.headline} onChange={set('headline')} placeholder="One line that describes you" maxLength={25} />
            <Field label="College / University" value={form.college} onChange={set('college')} placeholder="e.g. Stanford University" icon={<GraduationCap className="w-4 h-4" />} />
          </div>
          <Field label="Bio" value={form.bio} onChange={set('bio')} placeholder="A few sentences about what you build…" textarea charLimit={2500} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="GitHub URL" value={form.githubUrl} onChange={set('githubUrl')} placeholder="https://github.com/you" icon={<Github className="w-4 h-4" />} />
            <Field label="LinkedIn URL" value={form.linkedinUrl} onChange={set('linkedinUrl')} placeholder="https://linkedin.com/in/you" icon={<Linkedin className="w-4 h-4" />} />
          </div>
          <Field label="Website" value={form.websiteUrl} onChange={set('websiteUrl')} placeholder="https://yoursite.com" icon={<Globe className="w-4 h-4" />} />

          <div className="flex justify-end pt-2 border-t border-white/[0.05]">
            <button
              onClick={handleSave}
              disabled={saving || isBioOverLimit}
              className="h-9 px-5 rounded-lg bg-[#ff8a00] hover:bg-[#ff8a00]/90 transition-all text-xs font-black text-[#0a0a0a] flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save changes
            </button>
          </div>
        </div>
      )}
      </div>

      {/* Avatar Source Picker Modal */}
      {avatarModalOpen && (
        <AvatarPickerModal
          currentAvatar={avatarUrl}
          onSelectOAuth={handleSelectOAuthAvatar}
          onUpload={() => fileRef.current?.click()}
          onClose={() => setAvatarModalOpen(false)}
        />
      )}
    </div>
  )
}

/* ----------------------------- Avatar Picker Modal ----------------------------- */

function AvatarPickerModal({
  currentAvatar,
  onSelectOAuth,
  onUpload,
  onClose,
}: {
  currentAvatar: string | null
  onSelectOAuth: (url: string) => void
  onUpload: () => void
  onClose: () => void
}) {
  const [loading, setLoading] = useState(true)
  const [githubAvatar, setGithubAvatar] = useState<string | null>(null)
  const [googleAvatar, setGoogleAvatar] = useState<string | null>(null)

  useEffect(() => {
    getLinkedAvatars().then(({ github, google }) => {
      setGithubAvatar(github)
      setGoogleAvatar(google)
      setLoading(false)
    })
  }, [])

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-[#0c0c0f]/95 border border-[#ff8a00]/15 p-6 shadow-[0_32px_64px_rgba(0,0,0,0.9),_0_0_50px_rgba(255,138,0,0.05)] relative text-left flex flex-col gap-5 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black tracking-widest font-mono text-white flex items-center gap-1.5 uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ff8a00] animate-pulse" />
            Change Photo
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current avatar preview */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full border-2 border-[#ff8a00]/40 bg-accent/10 overflow-hidden">
            {currentAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={currentAvatar} alt="Current" className="w-full h-full object-cover" />
            ) : (
              <span className="w-full h-full flex items-center justify-center text-2xl font-black text-accent">?</span>
            )}
          </div>
        </div>

        {/* Source options */}
        <div className="flex flex-col gap-2.5">
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 text-white/40 animate-spin" />
            </div>
          ) : (
            <>
              {githubAvatar && (
                <button
                  onClick={() => onSelectOAuth(githubAvatar)}
                  className="flex items-center gap-3.5 w-full p-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:border-[#ff8a00]/40 hover:bg-white/[0.04] transition-all cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={githubAvatar} alt="GitHub" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-[13px] font-bold text-white group-hover:text-[#ff8a00] transition-colors">Use GitHub photo</p>
                    <p className="text-[11px] text-white/35 font-mono truncate">From linked GitHub account</p>
                  </div>
                  <Github className="w-4 h-4 text-white/25 group-hover:text-[#ff8a00] transition-colors shrink-0" />
                </button>
              )}

              {googleAvatar && (
                <button
                  onClick={() => onSelectOAuth(googleAvatar)}
                  className="flex items-center gap-3.5 w-full p-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:border-[#ff8a00]/40 hover:bg-white/[0.04] transition-all cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={googleAvatar} alt="Google" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-[13px] font-bold text-white group-hover:text-[#ff8a00] transition-colors">Use Google photo</p>
                    <p className="text-[11px] text-white/35 font-mono truncate">From linked Google account</p>
                  </div>
                  <GoogleIcon className="w-4 h-4 shrink-0" />
                </button>
              )}

              {!githubAvatar && !googleAvatar && (
                <p className="text-[12px] text-white/30 text-center py-2 font-mono">No linked accounts found</p>
              )}
            </>
          )}

          {/* Upload option — always available */}
          <button
            onClick={() => { onUpload(); onClose() }}
            className="flex items-center gap-3.5 w-full p-3.5 rounded-xl border border-dashed border-white/10 bg-white/[0.01] hover:border-[#ff8a00]/40 hover:bg-white/[0.04] transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center shrink-0">
              <Upload className="w-4 h-4 text-white/40 group-hover:text-[#ff8a00] transition-colors" />
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-[13px] font-bold text-white group-hover:text-[#ff8a00] transition-colors">Upload custom photo</p>
              <p className="text-[11px] text-white/35 font-mono">PNG, JPG, WebP or GIF · up to 5MB</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}

/* ----------------------------- Field component ----------------------------- */

function Field({
  label, value, onChange, placeholder, textarea, icon, maxLength, charLimit,
}: {
  label: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  placeholder?: string
  textarea?: boolean
  icon?: React.ReactNode
  maxLength?: number
  charLimit?: number
}) {
  return (
    <label className="block space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-xs font-medium text-white/60">{label}</span>
        {maxLength && (
          <span className="text-[10px] text-white/30 font-mono">
            {value.length}/{maxLength}
          </span>
        )}
        {charLimit && (
          <span className={`text-[10px] font-mono ${value.length > charLimit ? 'text-red-500 font-black' : 'text-white/30'}`}>
            {value.length}/{charLimit} characters
          </span>
        )}
      </div>
      <div className="relative">
        {icon && <span className="absolute left-3 top-3 text-white/30">{icon}</span>}
        {textarea ? (
          <textarea
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            rows={6}
            maxLength={maxLength}
            className="w-full bg-white/[0.02] border border-white/[0.08] rounded-lg px-3 py-2.5 text-[13px] text-white placeholder:text-white/25 focus:outline-none focus:border-accent/50 transition-colors resize-none"
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            maxLength={maxLength}
            className={`w-full h-10 bg-white/[0.02] border border-white/[0.08] rounded-lg ${icon ? 'pl-9' : 'pl-3'} pr-3 text-[13px] text-white placeholder:text-white/25 focus:outline-none focus:border-accent/50 transition-colors`}
          />
        )}
      </div>
    </label>
  )
}
