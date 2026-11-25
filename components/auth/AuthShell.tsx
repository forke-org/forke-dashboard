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

/**
 * Split auth layout shared by sign in, sign up, role choice and the access gate.
 * Same look as the Forke Mail and admin logins: the form on the left, the ASCII
 * mail globe on the right.
 */
import { useEffect, useRef, type ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft, XCircle } from 'lucide-react'
import { LAND_MASK } from '@/lib/globe-land'
import { mountMailGlobe } from '@/lib/mail-globe'
import { cn } from '@/lib/utils/cn'

function Globe() {
  const canvas = useRef<HTMLCanvasElement>(null)
  useEffect(() => (canvas.current ? mountMailGlobe(canvas.current, LAND_MASK) : undefined), [])
  return <canvas ref={canvas} aria-hidden className="absolute inset-0 block h-full w-full" />
}

export default function AuthShell({
  children,
  wide = false,
}: {
  children: ReactNode
  /** wider form column (role choice, owner details) */
  wide?: boolean
}) {
  return (
    <div className="grid min-h-[100svh] bg-[#151414] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="relative flex min-w-0 flex-col px-6 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-[18px] font-semibold tracking-[-0.04em] text-[#f4f4f5]">
            forke<span className="text-accent">*</span>
          </Link>
          <Link href="/" className="group flex items-center gap-1.5 text-xs text-[#8e8e93] transition-colors hover:text-[#f4f4f5]">
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
            <span className="hidden sm:inline">Back to forke.space</span>
            <span className="sm:hidden">Back</span>
          </Link>
        </div>
        <div className={cn('mx-auto flex w-full flex-1 flex-col justify-center py-12', wide ? 'max-w-[560px]' : 'max-w-[360px]')}>{children}</div>
        <p className="text-xs text-[#5f5c5a]">
          © 2026 forke &middot; <Link href="/privacy" className="transition-colors hover:text-[#f4f4f5]">Privacy</Link> &middot;{' '}
          <Link href="/terms" className="transition-colors hover:text-[#f4f4f5]">Terms</Link> &middot;{' '}
          <a href="https://status.forke.space" target="_blank" rel="noreferrer" className="transition-colors hover:text-[#f4f4f5]">Status</a>
        </p>
      </div>
      <div className="relative hidden overflow-hidden bg-[radial-gradient(120%_90%_at_0%_50%,#1d1310_0%,#120c0a_45%,#0d0908_100%)] lg:block">
        <Globe />
        <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-px [background-image:linear-gradient(rgba(240,227,222,0.16)_50%,transparent_50%)] [background-size:1px_32px]" />
      </div>
    </div>
  )
}

/* ── small shared pieces (same as Forke Mail's ui.tsx) ── */

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.08em] text-[#8e8e93]">
      <span className="h-1.5 w-1.5 rounded-[1.5px] bg-accent" />
      {children}
    </div>
  )
}

export const fieldClass =
  'h-10 w-full rounded-[6px] border border-[rgba(240,227,222,0.16)] bg-[color-mix(in_srgb,#f4f4f5_3%,#1a1919)] px-3 text-sm text-[#f4f4f5] outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-[#5f5c5a] hover:border-[color-mix(in_srgb,#f4f4f5_22%,transparent)] focus:border-accent focus:ring-3 focus:ring-accent/15 disabled:opacity-60'

export function Field({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-center justify-between text-[13px] font-medium text-[#c9c7c5]">
        {label}
        {hint}
      </span>
      {children}
    </label>
  )
}

export function Divider({ children = 'or' }: { children?: ReactNode }) {
  return (
    <div className="my-6 flex items-center gap-3 text-xs text-[#5f5c5a]">
      <span className="h-px flex-1 bg-[rgba(240,227,222,0.09)]" />
      {children}
      <span className="h-px flex-1 bg-[rgba(240,227,222,0.09)]" />
    </div>
  )
}

export function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="flex items-start gap-2 rounded-lg bg-[rgba(248,113,113,0.1)] px-3 py-2.5 text-[13px] text-[#f87171]">
      <XCircle className="mt-px h-4 w-4 shrink-0" />
      <span>{children}</span>
    </div>
  )
}

const btnBase =
  'relative inline-flex h-10 w-full cursor-pointer select-none items-center justify-center gap-2 whitespace-nowrap rounded-[6px] px-3.5 text-sm font-medium transition-[background-color,color,box-shadow,opacity] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0'

export const primaryBtn = `${btnBase} bg-accent text-[#1a0a00] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1),inset_0_1px_0_rgba(255,255,255,0.2),0_2px_10px_-4px_rgba(255,122,0,0.45)] hover:bg-[#ff8c24]`
export const ghostBtn = `${btnBase} bg-[color-mix(in_srgb,#f4f4f5_4%,#1a1919)] text-[#f4f4f5] shadow-[inset_0_0_0_1px_rgba(240,227,222,0.16)] hover:bg-[#262423]`

