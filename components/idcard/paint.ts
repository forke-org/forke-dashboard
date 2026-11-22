/**
 * @fileoverview Forke Platform
 * @copyright (c) 2026 Forke Inc. (https://www.forke.space/)
 *
 * Source-Available License (Non-Commercial / Fair Source).
 * This source code is open for inspection, learning, and personal development.
 * Commercial use, hosting, or resale as a paid service without an explicit
 * commercial license from Forke Inc. is strictly prohibited.
 */

// Paints the ID card, its QR back, the strap and the hologram mask onto canvases,
// which become the textures of the 3D lanyard.
import { LOADER_SHAPES } from '@/components/loader/forky-loader-data'
import { QUIET, bauQR } from './qrShapes'

export type CardColor = 'black' | 'white' | 'orange'
export type PhotoFilter = 'orange' | 'bw' | 'normal'
export type Way = { key: CardColor; name: string; base: string; block: string; ink: string; soft: string; mark: string }

const ORANGE = '#FF7A00'
const BLACK = '#151414'
const PAPER = '#F7EFE9'

export const WAYS: Record<CardColor, Way> = {
  black: { key: 'black', name: 'Black', base: BLACK, block: ORANGE, ink: PAPER, soft: 'rgba(247,239,233,0.62)', mark: ORANGE },
  white: { key: 'white', name: 'White', base: PAPER, block: ORANGE, ink: BLACK, soft: 'rgba(21,20,20,0.6)', mark: ORANGE },
  orange: { key: 'orange', name: 'Orange', base: ORANGE, block: BLACK, ink: BLACK, soft: 'rgba(21,20,20,0.66)', mark: BLACK },
}

export type CardData = {
  first: string
  full: string
  username: string
  level: number
  title: string
  shipped: number
  rating: number
  id: string
  issued: string
  quote: [string, string]
  avatarUrl?: string | null
}

const W = 380
const H = 536
const U = 62
const PX = 1024 / W // textures are 1024 wide

type Ctx = CanvasRenderingContext2D
type Spaced = Ctx & { letterSpacing?: string }

function canvas(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return { c, ctx: c.getContext('2d') as Ctx }
}

function fonts() {
  const body = getComputedStyle(document.body)
  const sans = body.fontFamily || 'system-ui, sans-serif'
  const mono = (body.getPropertyValue('--font-geist-mono') || '').trim() || 'ui-monospace, monospace'
  return { sans, mono }
}

/** Largest font size (from `max` down to `min`) at which `s` fits in `room` px, letter spacing scaled with the size. */
function fitSize(ctx: Ctx, s: string, room: number, weight: string, family: string, max: number, min: number, spacingAtMax = 0) {
  for (let size = max; size > min; size -= 1) {
    ctx.font = `${weight} ${size}px ${family}`
    const spacing = (spacingAtMax * size) / max
    if (ctx.measureText(s).width + spacing * Math.max(0, s.length - 1) <= room) return size
  }
  return min
}

function text(ctx: Ctx, s: string, x: number, y: number, font: string, color: string, align: CanvasTextAlign = 'left', spacing = 0) {
  ctx.font = font
  ctx.fillStyle = color
  ctx.textAlign = align
  ctx.textBaseline = 'alphabetic'
  // letterSpacing is not in every browser; the layout still works without it
  ;(ctx as Spaced).letterSpacing = `${spacing}px`
  ctx.fillText(s, x, y)
  ;(ctx as Spaced).letterSpacing = '0px'
}

/** Forke's asterisk, taken straight from the brand typeface and centred on (cx, cy). */
function asterisk(ctx: Ctx, cx: number, cy: number, size: number, color: string, sans: string, opts: { rotate?: number; outline?: number } = {}) {
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(((opts.rotate ?? 0) * Math.PI) / 180)
  ctx.font = `700 ${size}px ${sans}`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  const m = ctx.measureText('*')
  const x = -(m.actualBoundingBoxRight - m.actualBoundingBoxLeft) / 2
  const y = (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2
  if (opts.outline) {
    ctx.strokeStyle = color
    ctx.lineWidth = opts.outline
    ctx.lineJoin = 'round'
    ctx.strokeText('*', x, y)
  } else {
    ctx.fillStyle = color
    ctx.fillText('*', x, y)
  }
  ctx.restore()
}

/** The line-drawn Forky (the page loader's mascot), fitted into a `size` box centred on (cx, cy). */
function forky(ctx: Ctx, cx: number, cy: number, size: number, stroke: string, weight = 1, fill?: string) {
  const m = LOADER_SHAPES.mascot
  const k = size / Math.max(m.w, m.h)
  ctx.save()
  ctx.translate(cx - (m.w * k) / 2, cy - (m.h * k) / 2 - m.top * k)
  ctx.scale(k, k)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  m.parts.forEach((p: { d: string }, i: number) => {
    const path = new Path2D(p.d)
    if (fill && i === 0) {
      ctx.fillStyle = fill
      ctx.fill(path)
    }
    ctx.strokeStyle = stroke
    ctx.lineWidth = ((i === 0 ? 1.3 : 1) * weight) / k
    ctx.stroke(path)
  })
  ctx.restore()
}

/** Forke's logo mark: a rounded tile with Forky on it. */
function logoMark(ctx: Ctx, cx: number, cy: number, size: number, tile: string, line: string) {
  ctx.fillStyle = tile
  ctx.beginPath()
  ctx.roundRect(cx - size / 2, cy - size / 2, size, size, size * 0.24)
  ctx.fill()
  forky(ctx, cx, cy + size * 0.02, size * 0.7, line, size * 0.028)
}

function wordmark(ctx: Ctx, x: number, y: number, size: number, way: Way, sans: string, align: CanvasTextAlign = 'left') {
  const font = `700 ${size}px ${sans}`
  const sp = -size * 0.05
  ctx.font = font
  ;(ctx as Spaced).letterSpacing = `${sp}px`
  const wWord = ctx.measureText('forke').width
  const wStar = ctx.measureText('*').width
  const left = align === 'center' ? x - (wWord + wStar) / 2 : align === 'right' ? x - wWord - wStar : x
  text(ctx, 'forke', left, y, font, way.ink, 'left', sp)
  text(ctx, '*', left + wWord, y, font, way.mark, 'left', sp)
}

const imageCache = new Map<string, Promise<HTMLImageElement | null>>()

/** One load per URL, shared by every paint (the card options paint the same photo many times at once). */
function loadImage(url: string): Promise<HTMLImageElement | null> {
  let p = imageCache.get(url)
  if (!p) {
    p = fetchImage(url).then((img) => {
      if (!img) imageCache.delete(url) // let a later paint retry
      return img
    })
    imageCache.set(url, p)
  }
  return p
}

function fetchImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    // Avatars live on other hosts (GitHub, Google). Going through Next's image route keeps the
    // request same-origin, so the canvas stays readable, and it also serves a small WebP.
    const external = /^https?:\/\//.test(url) && !url.startsWith(location.origin)
    img.src = external ? `/_next/image?url=${encodeURIComponent(url)}&w=640&q=80` : url
  })
}

const DUO: [number, number, number][] = [
  [26, 10, 0],
  [255, 122, 0],
  [255, 226, 194],
]

/** The photo, cover-fitted, with the chosen treatment. Null when the pixels can't be read. */
function tonePhoto(img: HTMLImageElement, w: number, h: number, filter: PhotoFilter): HTMLCanvasElement | null {
  const { c, ctx } = canvas(Math.round(w), Math.round(h))
  const s = Math.max(c.width / img.width, c.height / img.height)
  ctx.drawImage(img, (c.width - img.width * s) / 2, (c.height - img.height * s) * 0.3, img.width * s, img.height * s)
  if (filter === 'normal') return c
  try {
    const d = ctx.getImageData(0, 0, c.width, c.height)
    const px = d.data
    for (let i = 0; i < px.length; i += 4) {
      const g = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]
      const v = Math.max(0, Math.min(255, (g - 128) * 1.15 + 128))
      if (filter === 'bw') {
        px[i] = px[i + 1] = px[i + 2] = v
      } else {
        // orange duotone: shadows → near black, mids → Forke orange, highlights → pale peach
        const t = v / 255
        const [a, b, k] = t < 0.55 ? [DUO[0], DUO[1], t / 0.55] : [DUO[1], DUO[2], (t - 0.55) / 0.45]
        px[i] = a[0] + (b[0] - a[0]) * k
        px[i + 1] = a[1] + (b[1] - a[1]) * k
        px[i + 2] = a[2] + (b[2] - a[2]) * k
      }
    }
    ctx.putImageData(d, 0, 0)
    return c
  } catch {
    return null
  }
}

export async function paintFront(way: Way, d: CardData, filter: PhotoFilter): Promise<HTMLCanvasElement> {
  const { sans, mono } = fonts()
  await Promise.all([document.fonts.load(`700 40px ${sans}`), document.fonts.load(`400 12px ${mono}`)]).catch(() => {})
  const { c, ctx } = canvas(1024, Math.round(H * PX))
  ctx.scale(PX, PX)
  const { base, block, ink, soft } = way
  const top = U * 5

  ctx.fillStyle = base
  ctx.fillRect(0, 0, W, H)
  // photo zone
  ctx.fillStyle = block
  ctx.fillRect(0, 0, U * 4, top)
  const img = d.avatarUrl ? await loadImage(d.avatarUrl) : null
  const photo = img ? tonePhoto(img, U * 4 * PX, top * PX, filter) : null
  if (photo) ctx.drawImage(photo, 0, 0, U * 4, top)
  else text(ctx, d.first[0] || 'F', U * 2, top * 0.72, `700 190px ${sans}`, base, 'center')
  // base-coloured notches cut into the photo zone
  ctx.fillStyle = base
  ;[
    [U, 0, U, U],
    [U * 3, U, U, U * 3],
    [U, U * 4, U, U],
  ].forEach(([x, y, w, h]) => ctx.fillRect(x, y, w, h))
  // right column: wordmark and Forke's asterisks
  const cx = U * 4 + (W - U * 4) / 2
  wordmark(ctx, cx, 42, 23, way, sans, 'center')
  asterisk(ctx, cx, 128, 250, way.mark, sans)
  asterisk(ctx, cx, 240, 250, way.mark, sans, { rotate: 36, outline: 3 })

  // text zone
  // the big first name shrinks to fit beside the quote, so long names never run under it or off the card
  ctx.font = `600 16px ${sans}`
  const quoteW = Math.max(ctx.measureText(`“${d.quote[0]}`).width, ctx.measureText(`${d.quote[1]}”`).width)
  const nameSize = fitSize(ctx, d.first, W - 24 - quoteW - 14 - 22, '700', sans, 80, 34, -4.5)
  text(ctx, d.first, 22, top + 82, `700 ${nameSize}px ${sans}`, ink, 'left', (-4.5 * nameSize) / 80)
  text(ctx, `“${d.quote[0]}`, W - 24, top + 42, `600 16px ${sans}`, ink, 'right', -0.3)
  text(ctx, `${d.quote[1]}”`, W - 24, top + 60, `600 16px ${sans}`, ink, 'right', -0.3)
  text(ctx, d.full, 24, top + 110, `400 ${fitSize(ctx, d.full, W - 48, '400', sans, 19, 12, -0.4)}px ${sans}`, ink, 'left', -0.4)
  text(ctx, `Level ${d.level}`, 24, top + 150, `400 13.5px ${sans}`, soft)
  text(ctx, d.title, 24, top + 167, `400 13.5px ${sans}`, soft)
  text(ctx, `@${d.username}`, W - 24, top + 150, `400 13.5px ${sans}`, soft, 'right')
  text(ctx, `${d.shipped} shipped · ${d.rating}★`, W - 24, top + 167, `400 13.5px ${sans}`, soft, 'right')
  text(ctx, d.id, 24, H - 20, `400 10px ${mono}`, soft)
  text(ctx, `forke.space/${d.username}`, W - 24, H - 20, `400 10px ${mono}`, soft, 'right')
  return c
}

export function drawQR(ctx: Ctx, x: number, y: number, size: number, value: string) {
  const { n, bg, shapes, mascot } = bauQR(value, { bg: PAPER })
  const s = size / (n + QUIET * 2)
  ctx.save()
  ctx.translate(x + QUIET * s, y + QUIET * s)
  ctx.scale(s, s)
  ctx.fillStyle = bg
  ctx.fillRect(-QUIET, -QUIET, n + QUIET * 2, n + QUIET * 2)
  for (const sh of shapes) {
    ctx.fillStyle = sh.fill
    ctx.fill(new Path2D(sh.d))
  }
  ctx.translate(mascot.tx, mascot.ty)
  ctx.scale(mascot.k, mascot.k)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  mascot.parts.forEach((p, i) => {
    const path = new Path2D(p.d)
    if (i === 0) {
      ctx.fillStyle = mascot.fill
      ctx.fill(path)
    } else {
      ctx.strokeStyle = mascot.line
      ctx.lineWidth = p.w
      ctx.stroke(path)
    }
  })
  ctx.restore()
}

export async function paintBack(way: Way, d: CardData): Promise<HTMLCanvasElement> {
  const { sans, mono } = fonts()
  const { c, ctx } = canvas(1024, Math.round(H * PX))
  ctx.scale(PX, PX)
  const { base, ink, soft } = way
  ctx.fillStyle = base
  ctx.fillRect(0, 0, W, H)
  const size = 316
  const x = (W - size) / 2
  const y = 58
  ctx.save()
  ctx.beginPath()
  ctx.roundRect(x, y, size, size, 22)
  ctx.clip()
  drawQR(ctx, x, y, size, `https://www.forke.space/${d.username}`)
  ctx.restore()
  text(ctx, 'Scan me', 23, H - 64, `700 36px ${sans}`, ink, 'left', -1.8)
  ctx.font = `700 36px ${sans}`
  asterisk(ctx, 23 + ctx.measureText('Scan me').width + 4, H - 86, 46, way.mark, sans)
  wordmark(ctx, W - 24, H - 64, 20, way, sans, 'right')
  text(ctx, `ID ${d.id} · Issued ${d.issued}`, 24, H - 24, `400 10px ${mono}`, soft)
  text(ctx, `forke.space/${d.username}`, W - 24, H - 24, `400 10px ${mono}`, soft, 'right')
  return c
}

/** One repeat of the strap, drawn sideways (x runs along the strap): logo, wordmark, asterisk. */
export function paintStrap(way: Way): HTMLCanvasElement {
  const { sans } = fonts()
  const T = 192
  const { c, ctx } = canvas(T * 5, T)
  ctx.fillStyle = way.base
  ctx.fillRect(0, 0, c.width, T)
  // logo mark, turned so Forky stands upright when the strap hangs
  ctx.save()
  ctx.translate(T * 0.62, T / 2)
  ctx.rotate(-Math.PI / 2)
  logoMark(ctx, 0, 0, 128, way.mark, way.base)
  ctx.restore()
  // wordmark along the strap
  wordmark(ctx, T * 2.45, T / 2 + 40, 116, way, sans, 'center')
  // asterisk
  asterisk(ctx, T * 4.3, T / 2, 300, way.mark, sans)
  return c
}

/**
 * Hologram mask, the size of a card face (white = foil): one big outlined Forky, thick lines,
 * tilted to the left and half cut off at the bottom-right corner.
 */
export function paintFoilMask(): HTMLCanvasElement {
  const w = 512
  const h = Math.round((w * H) / W)
  const { c, ctx } = canvas(w, h)
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, w, h)
  ctx.save()
  ctx.translate(w * 0.86, h * 0.9)
  ctx.rotate((-32 * Math.PI) / 180)
  forky(ctx, 0, 0, w * 1.05, '#fff', 11)
  ctx.restore()
  return c
}

/** A square crop of the person's photo with a card treatment, for the option tiles. Null without a readable photo. */
export async function paintPhoto(url: string | null | undefined, filter: PhotoFilter, size = 160): Promise<string | null> {
  if (!url) return null
  const img = await loadImage(url)
  const c = img ? tonePhoto(img, size, size, filter) : null
  return c ? c.toDataURL('image/png') : null
}
