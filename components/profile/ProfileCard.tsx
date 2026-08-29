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

import React from 'react'

interface ProfileCardProps {
  name: string
  username?: string | null
  level: number
  levelTitle: string
  headline?: string | null
  avatarUrl?: string | null
}

/**
 * Pure CSS/DOM lanyard card — crystal-clear native text & images (no WebGL
 * texture). Gently swings like it's hanging, and periodically flips front↔back.
 */
export default function ProfileCard({ name, username, level, levelTitle, headline, avatarUrl }: ProfileCardProps) {
  const initial = (name?.[0] || 'F').toUpperCase()
  const desc = headline || 'Building real, verified work.'
  // Stable credential serial derived from the username (e.g. FRK-7C3A-021)
  const serial = makeSerial(username || name || 'forke', level)

  return (
    <div className="relative w-full h-full flex items-center justify-center select-none overflow-hidden">
      <div className="lanyard-root flex flex-col items-center" style={{ perspective: '1600px', transformOrigin: 'top center' }}>
        {/* Strap */}
        <div className="relative w-7 h-24 overflow-hidden rounded-t-sm shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
          <div className="absolute inset-0 bg-gradient-to-b from-[#ff8a00] to-[#c2620a]" />
          <div className="absolute inset-0 flex flex-col items-center justify-around py-2 text-[7px] font-black tracking-[0.2em] text-black/35">
            <span>FORKE</span><span>FORKE</span><span>FORKE</span>
          </div>
        </div>
        {/* Clasp */}
        <div className="w-9 h-3.5 rounded-b-md bg-gradient-to-b from-neutral-200 to-neutral-500 shadow-md -mt-px z-10" />
        <div className="w-4 h-4 rounded-full border-[3px] border-neutral-400 bg-neutral-800 -mt-2 shadow-inner z-0" />

        {/* Flipping card */}
        <div className="lanyard-card relative w-[300px] h-[424px] mt-1.5" style={{ transformStyle: 'preserve-3d' }}>
          {/* FRONT */}
          <CardFace>
            {/* Laminated light sweep */}
            <div className="lanyard-sheen pointer-events-none absolute inset-0 z-20" />
            {/* Holographic foil edge under the header */}
            <div className="pointer-events-none absolute top-[52px] left-5 right-5 h-px bg-gradient-to-r from-transparent via-[#ff8a00]/60 to-transparent" />

            {/* Header — logo lockup + live credential tag */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/forke-assets/forke_logo.png" alt="" className="w-5 h-5 object-contain" draggable={false} />
                <span className="text-white font-mono font-black text-base tracking-tight">FORKE<span className="text-[#ff8a00]">//</span></span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md border border-[#ff8a00]/25 bg-[#ff8a00]/[0.06]">
                <span className="lanyard-pulse w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
                <span className="text-white/55 font-mono font-bold text-[8px] tracking-[0.18em]">DEV ID</span>
              </div>
            </div>

            {/* Hero avatar with conic glow ring + verified badge + level coin */}
            <div className="flex-1 flex flex-col items-center justify-center gap-5">
              <div className="relative">
                <div className="lanyard-ring absolute -inset-[6px] rounded-full opacity-80 blur-[1px]" />
                <div className="relative w-28 h-28 rounded-full overflow-hidden border-2 border-[#ff8a00]/80 bg-gradient-to-br from-[#ff8a00]/15 to-transparent flex items-center justify-center shadow-[0_0_30px_rgba(255,138,0,0.25)]">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt={name} className="w-full h-full object-cover" draggable={false} />
                  ) : (
                    <span className="text-5xl font-black text-[#ff8a00]">{initial}</span>
                  )}
                </div>
                {/* Verified check badge */}
                <div className="absolute -bottom-0.5 -right-0.5 w-7 h-7 rounded-full bg-[#ff8a00] border-[3px] border-[#0a0708] flex items-center justify-center shadow-lg">
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="#0a0708" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                </div>
                {/* Level coin */}
                <div className="absolute -top-1 -left-1 w-9 h-9 rounded-full bg-[#0a0708] border border-[#ff8a00]/50 flex flex-col items-center justify-center shadow-[0_0_12px_rgba(255,138,0,0.25)]">
                  <span className="text-[6px] font-mono text-white/40 leading-none tracking-wider">LVL</span>
                  <span className="text-sm font-black text-[#ff8a00] leading-none -mt-px">{level}</span>
                </div>
              </div>

              {/* Identity block */}
              <div className="w-full text-center space-y-2">
                <div>
                  <h3 className="font-bold text-white text-[19px] leading-tight tracking-tight">{name}</h3>
                  <p className="font-mono text-[11px] text-white/40 tracking-wide mt-0.5">@{username || 'forke'}</p>
                </div>

                {/* Rank chip */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#ff8a00]/30 bg-gradient-to-r from-[#ff8a00]/[0.12] to-[#ff8a00]/[0.04]">
                  <Sparkle />
                  <span className="font-mono font-bold text-[#ff8a00] text-[12px] tracking-wide uppercase">{levelTitle}</span>
                </div>

                <p className="text-white/55 text-[12px] italic leading-snug px-3 pt-0.5">&ldquo;{desc}&rdquo;</p>
              </div>
            </div>

            {/* Footer — serial + barcode + chip glyph */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[8px] text-white/35 tracking-[0.15em]">SERIAL · {serial}</span>
                {/* NFC / contactless glyph */}
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-[#ff8a00]/60" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 8.8a8 8 0 0 1 0 6.4M9.5 7a12 12 0 0 1 0 10M13 5.2a16 16 0 0 1 0 13.6" /></svg>
              </div>
              <div className="flex items-end gap-[2px] h-7 opacity-30">
                {BARS.map((w, i) => (
                  <span key={i} className="bg-white" style={{ width: w, height: '100%' }} />
                ))}
              </div>
              <p className="text-[7.5px] font-mono text-white/25 tracking-[0.16em] text-center">VERIFIED · PROOF OF WORK · FORKE.SPACE</p>
            </div>
          </CardFace>

          {/* BACK */}
          <CardFace back>
            <div className="flex items-center justify-between">
              <span className="text-white/30 font-mono font-bold text-[9px] tracking-[0.15em]">FORKE NETWORK</span>
              <span className="text-[#ff8a00] font-mono font-black text-base">// </span>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/forke-assets/forky_clean_transparent.png" alt="Forky" className="w-44 h-44 object-contain drop-shadow-[0_0_20px_rgba(255,138,0,0.15)]" draggable={false} />
              <span className="text-[#ff8a00] font-mono font-black text-xl">@{username || 'forke'}</span>
            </div>
            <p className="text-center text-[8px] font-mono text-white/25 tracking-[0.18em]">FORKE // DEVELOPER NETWORK</p>
          </CardFace>
        </div>
      </div>

      <style>{`
        @keyframes lanyardDrop {
          0% { opacity: 0; transform: translateY(-26px) rotate(-6deg); }
          100% { opacity: 1; transform: translateY(0) rotate(-2.2deg); }
        }
        @keyframes lanyardSwing {
          0%, 100% { transform: rotate(-2.2deg); }
          50% { transform: rotate(2.2deg); }
        }
        @keyframes lanyardFlip {
          0%, 60%   { transform: rotateY(0deg); }
          64%, 88%  { transform: rotateY(180deg); }
          92%, 100% { transform: rotateY(360deg); }
        }
        .lanyard-root {
          transform-origin: top center;
          animation: lanyardDrop 0.9s cubic-bezier(0.22,1,0.36,1) both,
                     lanyardSwing 3.6s ease-in-out 0.9s infinite;
        }
        .lanyard-card { animation: lanyardFlip 30s ease-in-out 1.2s infinite; }

        /* Conic glow ring behind the avatar — slow rotating aurora */
        @keyframes lanyardRingSpin { to { transform: rotate(360deg); } }
        .lanyard-ring {
          background: conic-gradient(from 0deg, #ff8a00, #ffcf6b, #ff5a00, #ff8a00);
          animation: lanyardRingSpin 8s linear infinite;
        }
        /* Laminated light sweep across the front face */
        @keyframes lanyardSheen {
          0%, 70% { transform: translateX(-160%) rotate(8deg); }
          100% { transform: translateX(160%) rotate(8deg); }
        }
        .lanyard-sheen {
          background: linear-gradient(100deg, transparent 30%, rgba(255,255,255,0.10) 48%, rgba(255,255,255,0.16) 50%, transparent 70%);
          animation: lanyardSheen 6s ease-in-out 1.5s infinite;
        }
        /* Live status dot */
        @keyframes lanyardPulse { 0%,100% { opacity:1; } 50% { opacity:0.35; } }
        .lanyard-pulse { animation: lanyardPulse 1.8s ease-in-out infinite; }

        @media (prefers-reduced-motion: reduce) {
          .lanyard-root, .lanyard-card, .lanyard-ring, .lanyard-sheen, .lanyard-pulse { animation: none; }
        }
      `}</style>
    </div>
  )
}

const BARS = ['2px', '4px', '2px', '6px', '3px', '2px', '5px', '2px', '3px', '7px', '2px', '4px', '2px', '5px', '3px', '2px', '6px', '2px', '4px', '3px', '2px', '5px', '7px', '2px', '3px', '4px', '2px', '6px', '2px', '3px', '5px', '2px', '4px', '2px', '7px', '3px', '2px', '5px', '2px', '4px']

function CardFace({ children, back = false }: { children: React.ReactNode; back?: boolean }) {
  return (
    <div
      className="absolute inset-0 rounded-[20px] overflow-hidden border border-white/[0.09] p-5 flex flex-col bg-gradient-to-b from-[#151013] via-[#0d0a0c] to-[#0a0708] shadow-[0_24px_60px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.04)]"
      style={{
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        transform: back ? 'rotateY(180deg)' : undefined,
      }}
    >
      {/* ember glow */}
      <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 w-56 h-56 rounded-full bg-[#ff8a00]/15 blur-3xl" />
      {/* faint diagonal guilloché lines for a security-paper texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 1px, transparent 7px)' }}
      />
      {/* top inner highlight */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/[0.06] to-transparent" />
      <div className="relative flex flex-col h-full">{children}</div>
    </div>
  )
}

// Small sparkle/star mark for the rank chip
function Sparkle() {
  return (
    <svg viewBox="0 0 24 24" className="w-3 h-3 text-[#ff8a00]" fill="currentColor">
      <path d="M12 2l1.8 6.5L20 10l-6.2 1.5L12 18l-1.8-6.5L4 10l6.2-1.5L12 2z" />
    </svg>
  )
}

// Deterministic credential serial like FRK-7C3A-003 from a seed string + level.
function makeSerial(seed: string, level: number): string {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0
  }
  const block = h.toString(16).toUpperCase().padStart(4, '0').slice(0, 4)
  return `FRK-${block}-${String(level).padStart(3, '0')}`
}
