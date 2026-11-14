// Geometry for the Forke QR: rounded modules, Forke eyes and the filled Forky in the middle.
import QRCode from 'qrcode'
import { LOADER_SHAPES } from '@/components/loader/forky-loader-data'

export const QUIET = 2
const INK = '#151414'
const WARM = '#B94700' // dark enough for scanners, still reads as Forke orange

const hash = (x: number, y: number) => {
  let h = (x * 73856093) ^ (y * 19349663)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return (h ^ (h >>> 16)) >>> 0
}
const rr = (x: number, y: number, w: number, h: number, r: number) =>
  `M${x + r} ${y}h${w - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${h - 2 * r}a${r} ${r} 0 0 1 ${-r} ${r}h${-(w - 2 * r)}a${r} ${r} 0 0 1 ${-r} ${-r}v${-(h - 2 * r)}a${r} ${r} 0 0 1 ${r} ${-r}Z`
const circle = (cx: number, cy: number, r: number) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`

/** One module as a square whose free corners are rounded, so neighbours melt into each other. */
function cell(x: number, y: number, tl: boolean, tr: boolean, br: boolean, bl: boolean) {
  const r = 0.5
  return (
    `M${x + (tl ? r : 0)} ${y}` +
    `H${x + 1 - (tr ? r : 0)}` + (tr ? `A${r} ${r} 0 0 1 ${x + 1} ${y + r}` : '') +
    `V${y + 1 - (br ? r : 0)}` + (br ? `A${r} ${r} 0 0 1 ${x + 1 - r} ${y + 1}` : '') +
    `H${x + (bl ? r : 0)}` + (bl ? `A${r} ${r} 0 0 1 ${x} ${y + 1 - r}` : '') +
    `V${y + (tl ? r : 0)}` + (tl ? `A${r} ${r} 0 0 1 ${x + r} ${y}` : '') +
    'Z'
  )
}

export type Shape = { d: string; fill: string }

/** Shapes in module units (0..n). Draw a `bg` square from -QUIET to n+QUIET behind them. */
export function bauQR(value: string, { bg = '#F7EFE9' } = {}) {
  const qr = QRCode.create(value, { errorCorrectionLevel: 'H' })
  const n = qr.modules.size
  const inEye = (x: number, y: number) => (x < 8 && y < 8) || (x >= n - 8 && y < 8) || (x < 8 && y >= n - 8)
  const hole = Math.floor(n * 0.28) | 1
  const h0 = (n - hole) / 2
  const inHole = (x: number, y: number) => x >= h0 && x < h0 + hole && y >= h0 && y < h0 + hole
  const on = (x: number, y: number) => x >= 0 && y >= 0 && x < n && y < n && !inEye(x, y) && !inHole(x, y) && qr.modules.data[y * n + x] === 1

  const shapes: Shape[] = []
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (!on(x, y)) continue
      const u = on(x, y - 1)
      const d = on(x, y + 1)
      const l = on(x - 1, y)
      const r = on(x + 1, y)
      const lonely = !u && !d && !l && !r
      // a sprinkle of warm single dots; everything else is ink
      const fill = lonely && hash(x, y) % 3 === 0 ? WARM : INK
      shapes.push({ fill, d: lonely ? circle(x + 0.5, y + 0.5, 0.46) : cell(x, y, !u && !l, !u && !r, !d && !r, !d && !l) })
    }
  }
  const eyes: [number, number][] = [[0, 0], [n - 7, 0], [0, n - 7]]
  for (const [ex, ey] of eyes) {
    shapes.push({ fill: INK, d: rr(ex, ey, 7, 7, 2.3) })
    shapes.push({ fill: bg, d: rr(ex + 1, ey + 1, 5, 5, 1.5) })
    shapes.push({ fill: WARM, d: rr(ex + 2, ey + 2, 3, 3, 1) })
  }
  const m = LOADER_SHAPES.mascot
  const box = hole - 1.2
  const k = Math.min(box / m.w, box / m.h)
  // Forky filled in ink, with its inner lines drawn back in the paper colour (like the original QR)
  const mascot = {
    k,
    tx: h0 + (hole - m.w * k) / 2,
    ty: h0 + (hole - m.h * k) / 2 - m.top * k,
    fill: INK,
    line: bg,
    parts: (m.parts as readonly { d: string }[]).map((p, i) => ({ d: p.d, w: (i === 0 ? 0.0 : 0.34) / k })),
  }
  return { n, bg, shapes, mascot }
}
