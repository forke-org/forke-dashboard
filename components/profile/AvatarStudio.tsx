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

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Crop, Loader2, Shuffle, Upload, X } from 'lucide-react'
import { getLinkedAvatars } from '@/lib/actions/profile-actions'
import { AVATAR_COLORS, AVATAR_PATTERNS, avatarUrl, parseAvatarUrl, type AvatarColor, type AvatarPattern } from '@/lib/avatar/dither'
import { GithubIcon } from './b/ProfileView'
import SquareCrop from './SquareCrop'

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

const pixel = { imageRendering: 'pixelated' as const }
const PER_PAGE = 8
const PAGES = Math.ceil(AVATAR_PATTERNS.length / PER_PAGE)
const pageOf = (p: AvatarPattern | undefined) => Math.max(0, Math.floor(AVATAR_PATTERNS.findIndex((x) => x.key === p) / PER_PAGE))
const btn = 'inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border px-4 text-[13.5px] transition-colors'

/**
 * "Pick your look": generated dithered avatars (pattern + colour), linked GitHub/Google photos,
 * or an upload with a square crop. Nothing is saved here; the choice goes back to the profile form.
 */
export default function AvatarStudio({
  current,
  seed,
  onUse,
  onUploadFile,
  onClose,
}: {
  current: string | null
  seed: string
  onUse: (url: string) => void
  onUploadFile: (file: File) => Promise<string | null>
  onClose: () => void
}) {
  const parsed = parseAvatarUrl(current)
  const [pattern, setPattern] = useState<AvatarPattern>(parsed?.pattern ?? 'orb')
  const [color, setColor] = useState<AvatarColor>(parsed?.color ?? 'orange')
  const [pick, setPick] = useState<string | null>(current)
  const [page, setPage] = useState(pageOf(parsed?.pattern))
  const swipe = useRef<number | null>(null)
  const [linked, setLinked] = useState<{ github: string | null; google: string | null } | null>(null)
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const cropFn = useRef<() => Promise<Blob | null>>(async () => null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    getLinkedAvatars().then(setLinked)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && (cropSrc ? setCropSrc(null) : onClose())
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, cropSrc])

  const pickGenerated = (p: AvatarPattern, c: AvatarColor) => {
    setPattern(p)
    setColor(c)
    setPick(avatarUrl(p, c, seed))
  }
  const shuffle = () => {
    const p = AVATAR_PATTERNS[Math.floor(Math.random() * AVATAR_PATTERNS.length)].key
    const c = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)].key
    setPage(pageOf(p))
    pickGenerated(p, c)
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (f) setCropSrc(URL.createObjectURL(f))
  }

  async function useCrop() {
    setUploading(true)
    const blob = await cropFn.current()
    const url = blob ? await onUploadFile(new File([blob], 'avatar.png', { type: 'image/png' })) : null
    setUploading(false)
    if (url) {
      setPick(url)
      if (cropSrc) URL.revokeObjectURL(cropSrc)
      setCropSrc(null)
    }
  }

  const setCropper = useCallback((fn: () => Promise<Blob | null>) => {
    cropFn.current = fn
  }, [])

  const isGen = !!parseAvatarUrl(pick)
  const ink = AVATAR_COLORS.find((c) => c.key === color)!.ink
  const photos = [
    linked?.github && { key: 'github', url: linked.github, label: 'GitHub photo', Icon: GithubIcon },
    linked?.google && { key: 'google', url: linked.google, label: 'Google photo', Icon: GoogleIcon },
  ].filter(Boolean) as { key: string; url: string; label: string; Icon: React.ComponentType<{ className?: string }> }[]
  const shown = AVATAR_PATTERNS.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE)
  const go = (n: number) => setPage((n + PAGES) % PAGES)

  if (!mounted) return null
  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/55 backdrop-blur-md sm:items-center sm:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal
        aria-label="Pick your look"
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-[92vh] w-full max-w-[640px] flex-col overflow-hidden rounded-t-[24px] border border-[var(--color-border-strong)] bg-[#1A1919] shadow-[0_40px_100px_rgba(0,0,0,0.75)] sm:rounded-[24px]"
      >
        <button
          type="button"
          onClick={cropSrc ? () => setCropSrc(null) : onClose}
          aria-label={cropSrc ? 'Back' : 'Close'}
          className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-black/30 text-white/70 backdrop-blur transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="h-[18px] w-[18px]" />
        </button>

        {cropSrc ? (
          <>
            <div className="border-b border-[var(--color-border)] px-6 pb-4 pt-6">
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent-text">Crop your photo</p>
              <p className="mt-1 text-[14px] text-white/50">Drag the square to move it. Pull a corner to resize.</p>
            </div>
            <div className="flex-1 overflow-y-auto bg-[#121111] px-6 py-6">
              <SquareCrop src={cropSrc} onReady={setCropper} />
            </div>
            <div className="flex items-center justify-between gap-2 border-t border-[var(--color-border)] px-6 py-4">
              <button type="button" onClick={() => setCropSrc(null)} className={clsx(btn, 'border-[var(--color-border-strong)] text-white/70 hover:text-white')}>
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button type="button" onClick={useCrop} disabled={uploading} className={clsx(btn, 'min-w-[140px] border-accent bg-accent font-medium text-[#1a0a00] disabled:opacity-60')}>
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crop className="h-4 w-4" />} Crop and use
              </button>
            </div>
          </>
        ) : (
          <>
            {/* hero */}
            <div className="relative overflow-hidden border-b border-[var(--color-border)] px-6 pb-6 pt-7">
              <div className="pointer-events-none absolute inset-0 transition-colors duration-500" style={{ background: `radial-gradient(60% 90% at 18% 0%, ${isGen ? ink : '#FF7A00'}26, transparent 70%)` }} />
              <div className="relative flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-6">
                <div className="h-[112px] w-[112px] shrink-0 overflow-hidden rounded-full border border-white/15 bg-white/[0.04] shadow-[0_0_0_6px_rgba(255,255,255,0.03),0_18px_40px_rgba(0,0,0,0.5)]">
                  {pick ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={pick} alt="" className="h-full w-full object-cover" style={isGen ? pixel : undefined} />
                  ) : (
                    <span className="block h-full w-full animate-pulse" />
                  )}
                </div>
                <div className="min-w-0 text-center sm:pr-10 sm:text-left">
                  <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent-text">Pick your look</p>
                  <p className="mt-1 text-[20px] font-medium leading-tight tracking-[-0.02em] text-white">A Forke pattern, or your own photo.</p>
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                    <button type="button" onClick={() => fileRef.current?.click()} className={clsx(btn, 'border-white/20 bg-white/[0.06] text-white hover:bg-white/[0.1]')}>
                      <Upload className="h-4 w-4" /> Upload photo
                    </button>
                    <button type="button" onClick={shuffle} className={clsx(btn, 'border-[var(--color-border-strong)] text-white/70 hover:text-white')}>
                      <Shuffle className="h-4 w-4" /> Shuffle
                    </button>
                    {photos.map(({ key, url, label, Icon }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setPick(url)}
                        title={label}
                        aria-label={label}
                        className={clsx('relative h-10 w-10 rounded-full border-2 transition-colors', pick === url ? 'border-accent' : 'border-white/15 hover:border-white/40')}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="" className="h-full w-full rounded-full object-cover" />
                        <span className="absolute -bottom-1 -right-1 grid h-[18px] w-[18px] place-items-center rounded-full border border-[#1A1919] bg-[#1A1919]">
                          <Icon className="h-3 w-3 text-white/80" />
                        </span>
                      </button>
                    ))}
                  </div>
                  <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={onFile} className="hidden" />
                </div>
              </div>
            </div>

            {/* patterns */}
            <div className="flex-1 overflow-y-auto px-6 pb-5 pt-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-[13.5px] text-white/75">
                  Forke patterns <span className="font-mono text-[11.5px] text-white/30">{AVATAR_PATTERNS.length}</span>
                </p>
                <div className="flex items-center gap-1" role="radiogroup" aria-label="Pattern colour">
                  {AVATAR_COLORS.map((c) => (
                    <button
                      key={c.key}
                      type="button"
                      role="radio"
                      aria-checked={color === c.key}
                      aria-label={c.label}
                      title={c.label}
                      onClick={() => pickGenerated(pattern, c.key)}
                      className={clsx('grid h-8 w-8 place-items-center rounded-full border-2 transition-colors', color === c.key ? 'border-white/80' : 'border-transparent hover:border-white/25')}
                    >
                      <span className="h-5 w-5 rounded-full" style={{ background: c.ink }} />
                    </button>
                  ))}
                </div>
              </div>
              <div
                key={page}
                onTouchStart={(e) => (swipe.current = e.touches[0].clientX)}
                onTouchEnd={(e) => {
                  if (swipe.current === null) return
                  const dx = e.changedTouches[0].clientX - swipe.current
                  if (Math.abs(dx) > 40) go(page + (dx < 0 ? 1 : -1))
                  swipe.current = null
                }}
                className="mx-auto mt-4 grid min-h-[236px] max-w-[560px] animate-[fadeIn_.25s_ease] grid-cols-4 content-start justify-items-center gap-x-3 gap-y-4"
              >
                {shown.map((p) => {
                  const url = avatarUrl(p.key, color, seed)
                  const on = pick === url
                  return (
                    <button key={p.key} type="button" onClick={() => pickGenerated(p.key, color)} aria-pressed={on} className="group flex w-full max-w-[96px] flex-col items-center gap-1.5">
                      <span className={clsx('relative block aspect-square w-full rounded-full p-[3px] transition-colors', on ? 'bg-accent' : 'bg-transparent group-hover:bg-white/20')}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="" loading="lazy" className="h-full w-full rounded-full border-2 border-[#1A1919] object-cover" style={pixel} />
                        {on && (
                          <span className="absolute bottom-0.5 right-0.5 grid h-5 w-5 place-items-center rounded-full border-2 border-[#1A1919] bg-accent text-black">
                            <Check className="h-2.5 w-2.5" strokeWidth={3.5} />
                          </span>
                        )}
                      </span>
                      <span className={clsx('font-mono text-[11px]', on ? 'text-white' : 'text-white/40 group-hover:text-white/70')}>{p.label}</span>
                    </button>
                  )
                })}
              </div>
              <div className="mt-4 flex items-center justify-center gap-3">
                <button type="button" onClick={() => go(page - 1)} aria-label="Previous patterns" className="grid h-9 w-9 place-items-center rounded-full border border-[var(--color-border-strong)] text-white/60 hover:text-white">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-1" role="tablist" aria-label="Pattern pages">
                  {Array.from({ length: PAGES }, (_, i) => (
                    <button key={i} type="button" role="tab" aria-selected={page === i} aria-label={`Page ${i + 1}`} onClick={() => setPage(i)} className="grid h-8 w-6 place-items-center">
                      <span className={clsx('block h-2 rounded-full transition-all', page === i ? 'w-5 bg-accent' : 'w-2 bg-white/25 hover:bg-white/50')} />
                    </button>
                  ))}
                </div>
                <button type="button" onClick={() => go(page + 1)} aria-label="Next patterns" className="grid h-9 w-9 place-items-center rounded-full border border-[var(--color-border-strong)] text-white/60 hover:text-white">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* footer */}
            <div className="flex items-center justify-between gap-3 border-t border-[var(--color-border)] px-6 py-4">
              <p className="hidden truncate text-[12.5px] text-white/35 sm:block">{isGen ? 'Unique to your username.' : 'Your photo.'} Save the profile to apply.</p>
              <div className="ml-auto flex gap-2">
                <button type="button" onClick={onClose} className={clsx(btn, 'border-[var(--color-border-strong)] text-white/70 hover:text-white')}>
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!pick || pick === current}
                  onClick={() => pick && onUse(pick)}
                  className={clsx(btn, 'min-w-[120px] border-accent bg-accent font-medium text-[#1a0a00] disabled:opacity-50')}
                >
                  <Check className="h-4 w-4" /> Use this
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  )
}
