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
 * Split auth layout shared by sign in, sign up, role choice and the access gate:
 * the form on the left, the ASCII Forky scene on the right (same as the admin login).
 */
import { useEffect, useRef, type ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { mountAsciiUser } from '@/lib/ascii-user'
import { cn } from '@/lib/utils/cn'

function AsciiScene() {
  const canvas = useRef<HTMLCanvasElement>(null)
  useEffect(() => (canvas.current ? mountAsciiUser(canvas.current) : undefined), [])
  return <canvas ref={canvas} aria-hidden className="absolute inset-0 block h-full w-full" />
}

export default function AuthShell({
  children,
  wide = false,
  caption,
}: {
  children: ReactNode
  /** wider form column (role choice, owner details) */
  wide?: boolean
  /** small line over the bottom of the ASCII panel */
  caption?: ReactNode
}) {
  return (
    <div className="grid min-h-[100svh] bg-[#151414] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="relative flex min-w-0 flex-col px-5 py-5 sm:px-10 sm:py-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-[19px] font-semibold tracking-[-0.04em] text-white">
            forke<span className="text-accent">*</span>
          </Link>
          <Link href="/" className="group flex items-center gap-1.5 text-[13px] text-white/50 transition-colors hover:text-white">
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            <span className="hidden sm:inline">Back to forke.space</span>
            <span className="sm:hidden">Back</span>
          </Link>
        </div>
        <div className={cn('mx-auto flex w-full flex-1 flex-col justify-center py-10', wide ? 'max-w-[560px]' : 'max-w-[380px]')}>{children}</div>
        <p className="text-[12px] text-white/30">© 2026 Forke · <Link href="/privacy" className="hover:text-white/60">Privacy</Link> · <Link href="/terms" className="hover:text-white/60">Terms</Link></p>
      </div>
      <div className="relative hidden overflow-hidden bg-[radial-gradient(70%_60%_at_50%_48%,#1d1310_0%,#120c0a_55%,#0d0908_100%)] lg:block">
        <AsciiScene />
        <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-px [background-image:linear-gradient(rgba(240,227,222,0.125)_50%,transparent_50%)] [background-size:1px_32px]" />
        {caption && <div className="absolute inset-x-10 bottom-10 text-[15px] leading-6 text-white/60">{caption}</div>}
      </div>
    </div>
  )
}

/* ── small shared pieces ── */

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.1em] text-white/45">
      <span className="h-1.5 w-1.5 rounded-[1.5px] bg-accent" />
      {children}
    </div>
  )
}

export const fieldClass =
  'h-11 w-full rounded-[10px] border border-white/[0.14] bg-white/[0.03] px-3.5 text-[14.5px] text-white outline-none transition-colors placeholder:text-white/25 focus:border-accent focus:bg-white/[0.02]'

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
    <div className="my-6 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.1em] text-white/30">
      <span className="h-px flex-1 bg-white/10" />
      {children}
      <span className="h-px flex-1 bg-white/10" />
    </div>
  )
}

export function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="flex items-start gap-2 rounded-[10px] bg-red-500/[0.08] px-3 py-2.5 text-[13px] text-red-300 shadow-[inset_0_0_0_1px_rgba(248,113,113,0.18)]">
      {children}
    </div>
  )
}

export const primaryBtn =
  'inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-accent bg-accent px-5 text-[14.5px] font-medium text-[#1a0a00] shadow-[0_1px_0_rgba(255,255,255,0.25)_inset,0_8px_24px_-8px_rgba(255,122,0,0.6)] transition-colors hover:bg-accent-hover disabled:opacity-60'
export const ghostBtn =
  'relative inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-full border border-white/[0.14] bg-white/[0.03] px-5 text-[14.5px] text-white/90 transition-colors hover:border-white/30 hover:bg-white/[0.06] disabled:opacity-60'
