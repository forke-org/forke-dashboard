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

import React, { useEffect, useState } from 'react'
import clsx from 'clsx'
import { Camera, Check, ExternalLink, Eye, Globe, GraduationCap, Loader2, MapPin, PenLine, RotateCcw } from 'lucide-react'
import { updateProfile, uploadAvatar } from '@/lib/actions/profile-actions'
import { saveCardStyle } from '@/lib/actions/card-actions'
import { toast } from '@/components/shared/Toast'
import { Field } from './ProfileEditor'
import AvatarStudio from './AvatarStudio'
import { isGeneratedAvatar } from '@/lib/avatar/dither'
import ProfileView, { GithubIcon, LinkedinIcon } from './b/ProfileView'
import type { DevProfile } from './b/types'
import CardStyleControls from '@/components/idcard/CardStyleControls'
import { DEFAULT_CARD_STYLE, type CardStyle } from '@/components/idcard/style'
import type { CardData } from '@/components/idcard/paint'

type SectionId = 'basics' | 'about' | 'links' | 'id-card'

function Section({ id, title, hint, children, right }: { id: SectionId; title: string; hint: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <section id={id} data-section={id} className="scroll-mt-4 rounded-[18px] border border-[var(--color-border)] bg-white/[0.02]">
      <header className="flex items-start justify-between gap-4 border-b border-[var(--color-border)] px-4 py-4 sm:px-5 md:px-6">
        <div>
          <h2 className="text-[15.5px] font-medium text-white/90">{title}</h2>
          <p className="mt-0.5 text-[13px] text-white/40">{hint}</p>
        </div>
        {right}
      </header>
      <div className="space-y-5 p-4 sm:p-5 md:p-6">{children}</div>
    </section>
  )
}

export default function DevProfileEditor({ profile, card, initialCard }: { profile: DevProfile; card: Omit<CardData, 'quote'>; initialCard: CardStyle }) {
  const [mode, setMode] = useState<'edit' | 'preview'>('edit')
  const [saving, setSaving] = useState(false)
  const [avatarModalOpen, setAvatarModalOpen] = useState(false)

  const initialForm = {
    name: profile.name || '',
    headline: profile.headline || '',
    bio: profile.bio || '',
    location: profile.location || '',
    college: profile.college || '',
    githubUrl: profile.githubUrl || '',
    linkedinUrl: profile.linkedinUrl || '',
    websiteUrl: profile.websiteUrl || '',
  }
  const [savedForm, setSavedForm] = useState(initialForm)
  const [form, setForm] = useState(initialForm)
  const [savedAvatar, setSavedAvatar] = useState<string | null>(profile.avatarUrl)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile.avatarUrl)
  const [savedCard, setSavedCard] = useState<CardStyle>(initialCard)
  const [cardStyle, setCardStyle] = useState<CardStyle>(initialCard)

  const profileDirty = JSON.stringify(form) !== JSON.stringify(savedForm) || avatarUrl !== savedAvatar
  const cardDirty = JSON.stringify(cardStyle) !== JSON.stringify(savedCard)
  const dirty = profileDirty || cardDirty
  const bioOver = form.bio.length > 2500

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }))

  // live data for the preview and the card
  const name = form.name.trim() || profile.name
  const liveProfile: DevProfile = {
    ...profile,
    ...form,
    name,
    headline: form.headline || null,
    bio: form.bio || null,
    location: form.location || null,
    college: form.college || null,
    githubUrl: form.githubUrl || null,
    linkedinUrl: form.linkedinUrl || null,
    websiteUrl: form.websiteUrl || null,
    avatarUrl,
  }
  const liveCard = { ...card, first: name.split(/\s+/)[0], full: name, avatarUrl }

  // open straight on a section when linked, e.g. /profile#id-card
  useEffect(() => {
    const hash = window.location.hash.slice(1)
    if (['basics', 'about', 'links', 'id-card'].includes(hash)) setTimeout(() => document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200)
  }, [])

  async function save() {
    setSaving(true)
    const [p, c] = await Promise.all([profileDirty ? updateProfile({ ...form, avatarUrl }) : null, cardDirty ? saveCardStyle(cardStyle) : null])
    const errors = [p && !p.success && (p.error || 'Could not save your profile'), c && !c.success && (c.error || 'Could not save your card')].filter(Boolean) as string[]
    if (p?.success) {
      setSavedForm(form)
      setSavedAvatar(avatarUrl)
    }
    if (c?.success) setSavedCard(cardStyle)
    if (errors.length) errors.forEach((e) => toast(e, 'error'))
    else toast('Profile saved.', 'success')
    setSaving(false)
  }

  function discard() {
    setForm(savedForm)
    setAvatarUrl(savedAvatar)
    setCardStyle(savedCard)
  }

  async function uploadFile(file: File) {
    const fd = new FormData()
    fd.append('file', file)
    const res = await uploadAvatar(fd)
    if (res.success && res.url) return res.url
    toast(res.error || 'Upload failed', 'error')
    return null
  }

  const btn = 'inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border px-3.5 text-[13.5px] transition-colors'

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-5 lg:h-full lg:min-h-0">
      {/* header */}
      <div className="flex shrink-0 flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent-text">Your profile</p>
          <h1 className="mt-1.5 text-[28px] font-medium leading-tight tracking-[-0.035em] md:text-[34px]">
            {mode === 'edit' ? 'Edit your profile' : 'Public preview'} {mode === 'preview' && <span className="text-white/40">as visitors see it.</span>}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="grid h-10 flex-1 grid-cols-2 rounded-lg border border-[var(--color-border-strong)] p-1 sm:flex sm:flex-none">
            {(['edit', 'preview'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                aria-pressed={mode === m}
                className={clsx('inline-flex items-center justify-center gap-1.5 rounded-md px-3 text-[13px] transition-colors', mode === m ? 'bg-white/[0.08] text-white' : 'text-white/50 hover:text-white')}
              >
                {m === 'edit' ? <PenLine className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                {m === 'edit' ? 'Edit' : 'Preview'}
              </button>
            ))}
          </div>
          {dirty && (
            <button type="button" onClick={discard} className={clsx(btn, 'border-[var(--color-border-strong)] text-white/70 hover:text-white max-sm:hidden')}>
              <RotateCcw className="h-4 w-4" /> Discard
            </button>
          )}
          <button
            type="button"
            onClick={save}
            disabled={!dirty || saving || bioOver}
            className={clsx(btn, 'min-w-[140px] border-accent bg-accent font-medium text-[#1a0a00] disabled:opacity-50 max-sm:hidden')}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {dirty ? 'Save changes' : 'Saved'}
          </button>
        </div>
      </div>

      {mode === 'preview' ? (
        <div className="overflow-hidden rounded-[18px] border border-[var(--color-border)] lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
          <div className="flex shrink-0 items-center gap-3 border-b border-[var(--color-border)] bg-white/[0.02] px-4 py-2.5">
            <span className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
            </span>
            <span className="min-w-0 flex-1 truncate rounded-md bg-white/[0.04] px-3 py-1 text-center font-mono text-[12px] text-white/45">forke.space/{profile.username}</span>
            <a href={`https://www.forke.space/${profile.username}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 font-mono text-[11.5px] text-white/40 hover:text-white">
              Open <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          {dirty && <p className="shrink-0 border-b border-[var(--color-border)] bg-accent/[0.06] px-4 py-2 text-[12.5px] text-accent-text">Showing your unsaved changes. Save to make them public.</p>}
          <div className="p-4 pb-28 sm:pb-5 md:p-8 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
            <ProfileView p={liveProfile} card={liveCard} cardStyle={cardStyle} />
          </div>
        </div>
      ) : (
        <div className="lg:min-h-0 lg:flex-1">
          {/* the form, scrolls on its own on laptops */}
          <div className="mx-auto max-w-[880px] space-y-4 pb-28 sm:space-y-5 sm:pb-10 lg:h-full lg:overflow-y-auto lg:px-1 [scrollbar-width:thin]">
            <Section id="basics" title="Basics" hint="Your photo, name and the one line people see first.">
              <div className="flex items-center gap-5">
                <button
                  type="button"
                  onClick={() => setAvatarModalOpen(true)}
                  className="group relative h-20 w-20 shrink-0 rounded-full border border-accent/40 bg-accent/10"
                  aria-label="Change look"
                >
                  <span className="absolute -bottom-0.5 -right-0.5 z-10 grid h-7 w-7 place-items-center rounded-full border-2 border-[#1A1919] bg-accent text-[#1a0a00]">
                    <Camera className="h-3.5 w-3.5" />
                  </span>
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt="" className="h-full w-full rounded-full object-cover" style={isGeneratedAvatar(avatarUrl) ? { imageRendering: 'pixelated' } : undefined} />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-2xl font-medium text-accent">{name[0]?.toUpperCase()}</span>
                  )}
                  <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                    <Camera className="h-5 w-5" />
                  </span>
                </button>
                <div>
                  <p className="text-[14px] text-white/85">Profile photo</p>
                  <p className="mt-0.5 text-[12.5px] text-white/40">Also used on your ID card. Pick a Forke pattern or use your own photo.</p>
                  <button type="button" onClick={() => setAvatarModalOpen(true)} className="mt-2.5 inline-flex h-8 items-center rounded-lg border border-[var(--color-border-strong)] px-3 text-[12.5px] text-white/75 hover:text-white">
                    Change look
                  </button>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Display name" value={form.name} onChange={set('name')} placeholder="Your name" />
                <Field label="Headline" value={form.headline} onChange={set('headline')} placeholder="One line that describes you" maxLength={25} />
              </div>
            </Section>

            <Section id="about" title="About" hint="This becomes the README on your profile.">
              <Field label="Bio" value={form.bio} onChange={set('bio')} placeholder="A few sentences about what you build" textarea charLimit={2500} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Location" value={form.location} onChange={set('location')} placeholder="e.g. Bengaluru, India" icon={<MapPin className="h-4 w-4" />} />
                <Field label="College / University" value={form.college} onChange={set('college')} placeholder="e.g. IIT Bombay" icon={<GraduationCap className="h-4 w-4" />} />
              </div>
            </Section>

            <Section id="links" title="Links" hint="Shown as buttons and in the details list.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="GitHub" value={form.githubUrl} onChange={set('githubUrl')} placeholder="https://github.com/you" icon={<GithubIcon className="h-4 w-4" />} />
                <Field label="LinkedIn" value={form.linkedinUrl} onChange={set('linkedinUrl')} placeholder="https://linkedin.com/in/you" icon={<LinkedinIcon className="h-3.5 w-3.5" />} />
              </div>
              <Field label="Website" value={form.websiteUrl} onChange={set('websiteUrl')} placeholder="https://yoursite.com" icon={<Globe className="h-4 w-4" />} />
            </Section>

            <Section
              id="id-card"
              title="ID card"
              hint="Hangs on your public profile. Hover a photo style to see it on your card."
              right={
                <button
                  type="button"
                  onClick={() => setCardStyle(DEFAULT_CARD_STYLE)}
                  className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-[var(--color-border-strong)] px-2.5 text-[12.5px] text-white/60 hover:text-white"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Default
                </button>
              }
            >
              <CardStyleControls data={liveCard} value={cardStyle} onChange={(patch) => setCardStyle((s) => ({ ...s, ...patch }))} />
              <button type="button" onClick={() => setMode('preview')} className="flex items-center gap-1.5 text-[13px] text-white/45 hover:text-white">
                <Eye className="h-4 w-4" /> See the 3D card on your profile
              </button>
            </Section>
          </div>
        </div>
      )}

      {/* phone: save bar pinned to the bottom, always in reach of the thumb */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-border)] bg-[#151414]/90 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl sm:hidden">
        <div className="flex items-center gap-2">
          <p className="min-w-0 flex-1 truncate text-[12.5px] text-white/45">{dirty ? 'Unsaved changes' : 'All changes saved'}</p>
          {dirty && (
            <button type="button" onClick={discard} className={clsx(btn, 'border-[var(--color-border-strong)] px-3 text-white/70')}>
              <RotateCcw className="h-4 w-4" />
              <span className="sr-only">Discard</span>
            </button>
          )}
          <button type="button" onClick={save} disabled={!dirty || saving || bioOver} className={clsx(btn, 'min-w-[132px] border-accent bg-accent font-medium text-[#1a0a00] disabled:opacity-50')}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {dirty ? 'Save' : 'Saved'}
          </button>
        </div>
      </div>

      {avatarModalOpen && (
        <AvatarStudio
          current={avatarUrl}
          seed={profile.username}
          onUse={(url) => {
            setAvatarUrl(url)
            setAvatarModalOpen(false)
          }}
          onUploadFile={uploadFile}
          onClose={() => setAvatarModalOpen(false)}
        />
      )}
    </div>
  )
}
