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

import { useEffect, useRef, useState } from 'react'

type Box = { x: number; y: number; s: number } // in displayed pixels

/**
 * Free square crop: drag the square to move it, drag any corner to resize it (it stays square).
 * Call the returned `crop()` through the ref to get a 640px square PNG blob.
 */
export default function SquareCrop({ src, onReady }: { src: string; onReady: (crop: () => Promise<Blob | null>) => void }) {
  const wrap = useRef<HTMLDivElement>(null)
  const img = useRef<HTMLImageElement>(null)
  const [dim, setDim] = useState<{ w: number; h: number } | null>(null)
  const [box, setBox] = useState<Box>({ x: 0, y: 0, s: 0 })
  const drag = useRef<{ mode: 'move' | 'nw' | 'ne' | 'sw' | 'se'; px: number; py: number; start: Box } | null>(null)

  function onLoad() {
    const el = img.current!
    const w = el.clientWidth
    const h = el.clientHeight
    const s = Math.round(Math.min(w, h) * 0.8)
    setDim({ w, h })
    setBox({ x: Math.round((w - s) / 2), y: Math.round((h - s) / 2), s })
  }

  useEffect(() => {
    onReady(async () => {
      const el = img.current
      if (!el || !dim) return null
      const k = el.naturalWidth / dim.w
      const out = document.createElement('canvas')
      out.width = out.height = 640
      const ctx = out.getContext('2d')!
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(el, box.x * k, box.y * k, box.s * k, box.s * k, 0, 0, 640, 640)
      return new Promise((r) => out.toBlob((b) => r(b), 'image/png'))
    })
  }, [box, dim, onReady])

  function down(mode: NonNullable<typeof drag.current>['mode']) {
    return (e: React.PointerEvent) => {
      e.preventDefault()
      e.stopPropagation()
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
      drag.current = { mode, px: e.clientX, py: e.clientY, start: box }
    }
  }

  function move(e: React.PointerEvent) {
    const d = drag.current
    if (!d || !dim) return
    const dx = e.clientX - d.px
    const dy = e.clientY - d.py
    const b = d.start
    const MIN = 48
    if (d.mode === 'move') {
      setBox({ ...b, x: Math.max(0, Math.min(dim.w - b.s, b.x + dx)), y: Math.max(0, Math.min(dim.h - b.s, b.y + dy)) })
      return
    }
    // resize from a corner, the opposite corner stays put
    const right = d.mode === 'ne' || d.mode === 'se'
    const bottom = d.mode === 'sw' || d.mode === 'se'
    const ax = right ? b.x : b.x + b.s // anchor
    const ay = bottom ? b.y : b.y + b.s
    const want = Math.max(right ? dx : -dx, bottom ? dy : -dy) + b.s
    const room = Math.min(right ? dim.w - ax : ax, bottom ? dim.h - ay : ay)
    const s = Math.max(MIN, Math.min(room, want))
    setBox({ s, x: right ? ax : ax - s, y: bottom ? ay : ay - s })
  }

  const up = () => (drag.current = null)
  const corner = 'absolute h-5 w-5 rounded-full border-2 border-white bg-accent shadow-[0_2px_8px_rgba(0,0,0,0.5)] touch-none'

  return (
    <div ref={wrap} className="relative mx-auto w-fit select-none" onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={img} src={src} alt="" onLoad={onLoad} draggable={false} className="block max-h-[340px] max-w-full rounded-xl" />
      {dim && (
        <div
          onPointerDown={down('move')}
          className="absolute cursor-move touch-none rounded-[4px] outline outline-2 outline-white/90"
          style={{ left: box.x, top: box.y, width: box.s, height: box.s, boxShadow: '0 0 0 9999px rgba(10,9,9,0.68)' }}
        >
          {/* avatar circle guide + thirds */}
          <span className="pointer-events-none absolute inset-0 rounded-full border border-dashed border-white/60" />
          <span className="pointer-events-none absolute inset-y-0 left-1/3 w-px bg-white/20" />
          <span className="pointer-events-none absolute inset-y-0 left-2/3 w-px bg-white/20" />
          <span className="pointer-events-none absolute inset-x-0 top-1/3 h-px bg-white/20" />
          <span className="pointer-events-none absolute inset-x-0 top-2/3 h-px bg-white/20" />
          <span onPointerDown={down('nw')} className={`${corner} -left-2.5 -top-2.5 cursor-nwse-resize`} />
          <span onPointerDown={down('ne')} className={`${corner} -right-2.5 -top-2.5 cursor-nesw-resize`} />
          <span onPointerDown={down('sw')} className={`${corner} -bottom-2.5 -left-2.5 cursor-nesw-resize`} />
          <span onPointerDown={down('se')} className={`${corner} -bottom-2.5 -right-2.5 cursor-nwse-resize`} />
        </div>
      )}
    </div>
  )
}
