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
import { Loader } from '@/components/ui/Loader'
import { usePathname } from 'next/navigation'

/**
 * Page transition: the line-drawn Forky shows briefly, then fades as the page slides in.
 * Timers and CSS transitions (not animation frames) drive it, so a page opened in a
 * background tab is never stuck behind the loader.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isBypassed = pathname === '/waitlist' || pathname === '/checkout'
  const [phase, setPhase] = useState<'loading' | 'leaving' | 'done'>(isBypassed ? 'done' : 'loading')

  useEffect(() => {
    if (isBypassed) return
    window.scrollTo(0, 0)
    const leave = setTimeout(() => setPhase('leaving'), 450)
    const done = setTimeout(() => setPhase('done'), 900)
    return () => {
      clearTimeout(leave)
      clearTimeout(done)
    }
  }, [isBypassed])

  if (isBypassed) return <>{children}</>

  return (
    <div className="relative min-h-screen">
      {phase !== 'done' && (
        <div
          className="fixed inset-0 z-[9999] bg-[#151414] transition-[opacity,transform] duration-[400ms] ease-[cubic-bezier(.65,0,.35,1)]"
          style={{ opacity: phase === 'leaving' ? 0 : 1, transform: phase === 'leaving' ? 'translateY(-40px)' : 'none' }}
        >
          <Loader fullScreen text="Loading forke" />
        </div>
      )}
      <div
        className="transition-[opacity,transform] duration-500 ease-out"
        style={{ opacity: phase === 'loading' ? 0 : 1, transform: phase === 'loading' ? 'translateY(40px)' : 'none' }}
      >
        {children}
      </div>
    </div>
  )
}
