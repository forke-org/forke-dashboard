import sharp from 'sharp'
import { AVATAR_COLORS, AVATAR_PATTERNS, GRID, hash, hexToRgb, paperFor, renderBits, type AvatarPattern } from '@/lib/avatar/dither'

const SCALE = 6 // 64 logical pixels → 384px, crisp on the 3D card too

/** Generated dithered avatar as a PNG. Same input, same image, so it caches forever. */
export async function GET(_req: Request, { params }: { params: Promise<{ pattern: string; color: string; seed: string }> }) {
  const { pattern, color, seed } = await params
  const s = seed.replace(/\.png$/, '').slice(0, 32)
  const h = hash(s)
  // retired or unknown names fall back to this seed's default, so old links never break
  const p = AVATAR_PATTERNS.find((x) => x.key === pattern) ?? AVATAR_PATTERNS[h % AVATAR_PATTERNS.length]
  const c = AVATAR_COLORS.find((x) => x.key === color) ?? AVATAR_COLORS[(h >>> 8) % AVATAR_COLORS.length]

  const bits = renderBits(p.key as AvatarPattern, s)
  const ink = hexToRgb(c.ink)
  const paper = paperFor(c.ink)
  const size = GRID * SCALE
  const raw = Buffer.alloc(size * size * 3)
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const on = bits[Math.floor(y / SCALE) * GRID + Math.floor(x / SCALE)]
      const col = on ? ink : paper
      const i = (y * size + x) * 3
      raw[i] = col[0]
      raw[i + 1] = col[1]
      raw[i + 2] = col[2]
    }
  const png = await sharp(raw, { raw: { width: size, height: size, channels: 3 } }).png({ palette: true, colours: 2, compressionLevel: 9 }).toBuffer()
  return new Response(new Uint8Array(png), {
    headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=31536000, immutable' },
  })
}
