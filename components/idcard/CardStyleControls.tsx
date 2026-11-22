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

import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { Check } from 'lucide-react'
import { WAYS, paintFront, paintPhoto, type CardColor, type CardData, type PhotoFilter } from './paint'
import { CARD_COLORS, PHOTO_FILTERS, twoLines, type CardStyle } from './style'

const COLOR_COPY: Record<CardColor, string> = { black: 'Quiet, works everywhere', white: 'Clean, high contrast', orange: 'Loud, very Forke' }
const FILTER_COPY: Record<PhotoFilter, string> = { orange: 'Forke orange tone', bw: 'Black and white', normal: 'Your photo as it is' }
const AVATAR_FILTER: Record<PhotoFilter, string> = {
  orange: 'grayscale(1) sepia(1) saturate(4) hue-rotate(-12deg) brightness(0.95)',
  bw: 'grayscale(1) contrast(1.1)',
  normal: 'none',
}

type Data = Omit<CardData, 'quote'>
const keyOf = (c: CardColor, f: PhotoFilter) => `${c}:${f}`

/**
 * Paints flat card fronts for every colour and photo combo, so hovering an option can show it instantly.
 * Repaints (debounced) when the line or the person's data changes.
 */
function useThumbs(data: Data, line: string) {
  const [thumbs, setThumbs] = useState<Record<string, string>>({})
  const dataKey = JSON.stringify(data)

  useEffect(() => {
    let alive = true
    const t = setTimeout(async () => {
      const full: CardData = { ...data, quote: twoLines(line) }
      const next: Record<string, string> = {}
      for (const c of CARD_COLORS) {
        for (const f of PHOTO_FILTERS) {
          const canvas = await paintFront(WAYS[c.key], full, f.key)
          if (!alive) return
          next[keyOf(c.key, f.key)] = canvas.toDataURL('image/png')
        }
      }
      setThumbs(next)
    }, 250)
    return () => {
      alive = false
      clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataKey, line])

  return thumbs
}

function MiniCard({ src, className }: { src?: string; className?: string }) {
  return (
    <span className={clsx('block aspect-[380/536] overflow-hidden rounded-[10px] bg-white/[0.04] shadow-[0_18px_40px_rgba(0,0,0,0.55)]', className)}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="block h-full w-full animate-pulse bg-white/[0.04]" />
      )}
    </span>
  )
}

/** Small floating card shown above an option while it is hovered or focused. */
function HoverCard({ src, label, show }: { src?: string; label: string; show: boolean }) {
  return (
    <span
      aria-hidden
      className={clsx(
        'pointer-events-none absolute bottom-[calc(100%+10px)] left-1/2 z-30 w-[132px] -translate-x-1/2 rounded-[14px] border border-white/10 bg-[#1A1919]/95 p-2 backdrop-blur transition-all duration-150',
        show ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0',
      )}
    >
      <MiniCard src={src} />
      <span className="mt-1.5 block text-center font-mono text-[10.5px] text-white/50">{label}</span>
    </span>
  )
}

/** The person's photo run through each card treatment, painted once per photo. */
function usePhotoTiles(url: string | null | undefined) {
  const [tiles, setTiles] = useState<Partial<Record<PhotoFilter, string>>>({})
  useEffect(() => {
    let alive = true
    Promise.all(PHOTO_FILTERS.map(async (f) => [f.key, await paintPhoto(url, f.key, 200)] as const)).then((all) => {
      if (alive) setTiles(Object.fromEntries(all.filter(([, v]) => v)) as Partial<Record<PhotoFilter, string>>)
    })
    return () => {
      alive = false
    }
  }, [url])
  return tiles
}

function Tick() {
  return (
    <span className="absolute right-2 top-2 z-10 grid h-5 w-5 place-items-center rounded-full border-2 border-[#1A1919] bg-accent text-black">
      <Check className="h-2.5 w-2.5" strokeWidth={3.5} />
    </span>
  )
}

export default function CardStyleControls({ data, value, onChange, defaultLine }: { data: Data; value: CardStyle; onChange: (patch: Partial<CardStyle>) => void; defaultLine: string }) {
  const thumbs = useThumbs(data, value.line.trim() || defaultLine)
  const photos = usePhotoTiles(data.avatarUrl)
  const [hover, setHover] = useState<string | null>(null)

  return (
    <div className="space-y-7">
      <div>
        <p className="text-[13px] text-white/60">Card colour</p>
        <div className="mt-3 grid grid-cols-3 gap-3">
          {CARD_COLORS.map((c) => {
            const on = value.color === c.key
            return (
              <button
                key={c.key}
                type="button"
                aria-pressed={on}
                onClick={() => onChange({ color: c.key })}
                className={clsx('group relative flex flex-col items-center rounded-[16px] border px-3 pb-3 pt-4 transition-colors', on ? 'border-accent bg-accent/[0.06]' : 'border-white/10 hover:border-white/25 hover:bg-white/[0.02]')}
              >
                {on && <Tick />}
                <span className="block w-full max-w-[112px] transition-transform duration-200 group-hover:-translate-y-1">
                  <MiniCard src={thumbs[keyOf(c.key, value.filter)]} />
                </span>
                <span className="mt-3 block text-[13px] capitalize text-white/85">{c.key}</span>
                <span className="hidden text-center text-[11.5px] leading-4 text-white/40 sm:block">{COLOR_COPY[c.key]}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <p className="text-[13px] text-white/60">Photo on the card</p>
        <div className="mt-3 grid grid-cols-3 gap-3">
          {PHOTO_FILTERS.map((f) => {
            const on = value.filter === f.key
            const id = `f-${f.key}`
            const tile = photos[f.key]
            return (
              <button
                key={f.key}
                type="button"
                aria-pressed={on}
                onClick={() => onChange({ filter: f.key })}
                onMouseEnter={() => setHover(id)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(id)}
                onBlur={() => setHover(null)}
                className={clsx('group relative flex flex-col items-center rounded-[16px] border px-3 pb-3 pt-4 transition-colors', on ? 'border-accent bg-accent/[0.06]' : 'border-white/10 hover:border-white/25 hover:bg-white/[0.02]')}
              >
                <HoverCard src={thumbs[keyOf(value.color, f.key)]} label={on ? 'Current' : `${f.label} on your card`} show={hover === id} />
                {on && <Tick />}
                <span className="block aspect-square w-full max-w-[96px] overflow-hidden rounded-full bg-white/[0.04] shadow-[0_10px_24px_rgba(0,0,0,0.45)] transition-transform duration-200 group-hover:-translate-y-1">
                  {tile ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={tile} alt="" className="h-full w-full object-cover" />
                  ) : data.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={data.avatarUrl} alt="" className="h-full w-full object-cover" style={{ filter: AVATAR_FILTER[f.key] }} />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center font-mono text-2xl text-accent">{data.first[0]}</span>
                  )}
                </span>
                <span className="mt-3 block text-[13px] text-white/85">{f.label}</span>
                <span className="hidden text-center text-[11.5px] leading-4 text-white/40 sm:block">{FILTER_COPY[f.key]}</span>
              </button>
            )
          })}
        </div>
      </div>

      <label className="block">
        <span className="flex items-center justify-between text-[13px] text-white/60">
          Card line <span className="font-mono text-[11px] text-white/30">{value.line.length}/22</span>
        </span>
        <input value={value.line} maxLength={22} onChange={(e) => onChange({ line: e.target.value })} placeholder={defaultLine} className="app-field mt-2 h-10 w-full px-3 text-[13.5px]" />
        <span className="mt-1.5 block text-[12px] text-white/35">Sits beside your name on the front. Write your own, or leave it empty to keep your Forke line.</span>
      </label>
    </div>
  )
}
