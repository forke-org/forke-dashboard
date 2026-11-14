// Forke generated avatars: two-tone, Bayer-dithered patterns. Pure code, safe on server and client.

export const AVATAR_PATTERNS = [
  { key: 'orb', label: 'Orb' },
  { key: 'moon', label: 'Moon' },
  { key: 'sunset', label: 'Sunset' },
  { key: 'waves', label: 'Waves' },
  { key: 'rings', label: 'Rings' },
  { key: 'moire', label: 'Moiré' },
  { key: 'spiral', label: 'Spiral' },
  { key: 'plasma', label: 'Plasma' },
  { key: 'static', label: 'Static' },
  { key: 'blobs', label: 'Blobs' },
  { key: 'dunes', label: 'Dunes' },
  { key: 'peaks', label: 'Peaks' },
  { key: 'grid', label: 'Grid' },
  { key: 'diamond', label: 'Diamond' },
  { key: 'burst', label: 'Burst' },
  { key: 'tunnel', label: 'Tunnel' },
  { key: 'halftone', label: 'Halftone' },
  { key: 'warp', label: 'Warp' },
  { key: 'zigzag', label: 'Zigzag' },
  { key: 'ripple', label: 'Ripple' },
  { key: 'aurora', label: 'Aurora' },
  { key: 'weave', label: 'Weave' },
  { key: 'vortex', label: 'Vortex' },
  { key: 'petals', label: 'Petals' },
  { key: 'eclipse', label: 'Eclipse' },
  { key: 'tide', label: 'Tide' },
  { key: 'cells', label: 'Cells' },
  { key: 'flow', label: 'Flow' },
  { key: 'contour', label: 'Contour' },
  { key: 'prism', label: 'Prism' },
  { key: 'comet', label: 'Comet' },
  { key: 'star', label: 'Star' },
] as const
export type AvatarPattern = (typeof AVATAR_PATTERNS)[number]['key']

export const AVATAR_COLORS = [
  { key: 'orange', label: 'Orange', ink: '#FF7A00' },
  { key: 'cream', label: 'Cream', ink: '#F0E3DE' },
  { key: 'coral', label: 'Coral', ink: '#FF5A4E' },
  { key: 'sky', label: 'Sky', ink: '#5AA9FF' },
  { key: 'mint', label: 'Mint', ink: '#45D69B' },
  { key: 'violet', label: 'Violet', ink: '#A78BFA' },
] as const
export type AvatarColor = (typeof AVATAR_COLORS)[number]['key']

export const AVATAR_PATH = '/api/avatar'

export function hash(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

/** URL for a generated avatar. The seed (usually the username) varies the pattern and picks the letter. */
export function avatarUrl(pattern: AvatarPattern, color: AvatarColor, seed: string) {
  const s = (seed || 'forke').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 32) || 'forke'
  return `${AVATAR_PATH}/${pattern}/${color}/${s}`
}

/** The avatar someone gets before they pick anything: stable per seed. */
export function defaultAvatarUrl(seed: string) {
  const h = hash(seed || 'forke')
  const pattern = AVATAR_PATTERNS[h % AVATAR_PATTERNS.length].key
  const color = AVATAR_COLORS[(h >>> 8) % AVATAR_COLORS.length].key
  return avatarUrl(pattern, color, seed)
}

export function parseAvatarUrl(url: string | null | undefined): { pattern: AvatarPattern; color: AvatarColor; seed: string } | null {
  const m = url?.match(/\/api\/avatar\/([a-z]+)\/([a-z]+)\/([a-z0-9_-]+)/)
  if (!m) return null
  if (!AVATAR_PATTERNS.some((p) => p.key === m[1]) || !AVATAR_COLORS.some((c) => c.key === m[2])) return null
  return { pattern: m[1] as AvatarPattern, color: m[2] as AvatarColor, seed: m[3] }
}

export const isGeneratedAvatar = (url: string | null | undefined) => !!parseAvatarUrl(url)

/* ── rendering ── */

export const GRID = 64 // logical pixels per side

const BAYER = [
  [0, 32, 8, 40, 2, 34, 10, 42],
  [48, 16, 56, 24, 50, 18, 58, 26],
  [12, 44, 4, 36, 14, 46, 6, 38],
  [60, 28, 52, 20, 62, 30, 54, 22],
  [3, 35, 11, 43, 1, 33, 9, 41],
  [51, 19, 59, 27, 49, 17, 57, 25],
  [15, 47, 7, 39, 13, 45, 5, 37],
  [63, 31, 55, 23, 61, 29, 53, 21],
]

const clamp = (v: number) => Math.max(0, Math.min(1, v))

function noise2(seed: number) {
  const r = (x: number, y: number) => {
    let h = (x * 374761393 + y * 668265263 + seed * 2246822519) >>> 0
    h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0
    return ((h ^ (h >>> 16)) >>> 0) / 4294967295
  }
  return (x: number, y: number) => {
    const xi = Math.floor(x)
    const yi = Math.floor(y)
    const fx = x - xi
    const fy = y - yi
    const sx = fx * fx * (3 - 2 * fx)
    const sy = fy * fy * (3 - 2 * fy)
    const a = r(xi, yi) + (r(xi + 1, yi) - r(xi, yi)) * sx
    const b = r(xi, yi + 1) + (r(xi + 1, yi + 1) - r(xi, yi + 1)) * sx
    return a + (b - a) * sy
  }
}

/** Brightness 0..1 for each logical pixel, before dithering. */
function field(pattern: AvatarPattern, seed: string): (x: number, y: number) => number {
  const h = hash(seed)
  const j = (n: number) => ((h >>> n) & 255) / 255 // 0..1 jitter from the seed
  switch (pattern) {
    case 'orb': {
      const cx = 0.5 + (j(0) - 0.5) * 0.12
      const cy = 0.52 + (j(8) - 0.5) * 0.12
      const r = 0.36
      return (x, y) => {
        const dx = (x - cx) / r
        const dy = (y - cy) / r
        const d = dx * dx + dy * dy
        if (d > 1) return clamp(0.1 - (Math.sqrt(d) - 1) * 0.3) // faint halo
        const z = Math.sqrt(1 - d)
        const light = clamp(-dx * 0.55 - dy * 0.6 + z * 0.6)
        return 0.12 + light * 0.88
      }
    }
    case 'sunset': {
      const sy = 0.42 + j(0) * 0.08
      return (x, y) => {
        const d = Math.hypot(x - 0.5, y - sy)
        if (y > 0.66) return clamp((y - 0.62) * 1.4 * (0.45 + 0.55 * Math.sin(x * 7 + y * 26)))
        if (d < 0.27) {
          // sun with retro bands cut into the lower half
          if (y > sy && Math.sin((y - sy) * 70) > 0.3 - (y - sy) * 4) return 0.05
          return clamp(1 - (y - (sy - 0.27)) * 0.9)
        }
        return clamp(0.2 - y * 0.25)
      }
    }
    case 'waves': {
      const f = 14 + j(0) * 8
      const ph = j(8) * 6.28
      return (x, y) => clamp(0.5 + 0.5 * Math.sin(y * f + Math.sin(x * 6 + ph) * 2.2) * (0.35 + y * 0.7) - (1 - y) * 0.25)
    }
    case 'rings': {
      const cx = 0.3 + j(0) * 0.4
      const cy = 0.3 + j(8) * 0.4
      return (x, y) => {
        const d = Math.hypot(x - cx, y - cy)
        return clamp(0.5 + 0.5 * Math.cos(d * 38) - d * 0.6)
      }
    }
    case 'static': {
      const n = noise2(h)
      return (x, y) => clamp((n(x * 5, y * 5) * 0.65 + n(x * 13, y * 13) * 0.35 - 0.25) * 1.6)
    }
    case 'moon': {
      const off = 0.12 + j(0) * 0.1
      const tilt = (j(8) - 0.5) * 0.2
      return (x, y) => {
        const d = Math.hypot(x - 0.5, y - 0.5)
        const cut = Math.hypot(x - 0.5 - off, y - 0.5 + tilt)
        if (d < 0.34 && cut > 0.3) return clamp(0.95 - (x - 0.16) * 0.9 + (0.5 - y) * 0.3)
        return d < 0.36 ? 0.08 : clamp(0.06 - d * 0.05) + (((x * 97 + y * 41 + j(16)) * 1000) % 1 > 0.985 ? 1 : 0) // a few stars
      }
    }
    case 'moire': {
      const a = [0.3 + j(0) * 0.15, 0.4]
      const b = [0.55 + j(8) * 0.15, 0.6]
      return (x, y) => clamp(0.5 + 0.5 * Math.cos(Math.hypot(x - a[0], y - a[1]) * 60) * Math.cos(Math.hypot(x - b[0], y - b[1]) * 60))
    }
    case 'spiral': {
      const arms = 2 + (h % 3)
      const dir = h & 1 ? 1 : -1
      return (x, y) => {
        const dx = x - 0.5
        const dy = y - 0.5
        const r = Math.hypot(dx, dy)
        const a = Math.atan2(dy, dx)
        return clamp((0.5 + 0.5 * Math.sin(arms * a + dir * Math.log(r + 0.02) * 9)) * (1.05 - r * 1.3))
      }
    }
    case 'plasma': {
      const p = [j(0) * 6, j(8) * 6, j(16) * 6]
      return (x, y) =>
        clamp(0.5 + 0.25 * (Math.sin(x * 9 + p[0]) + Math.sin((x + y) * 7 + p[1]) * 0.8 + Math.sin(Math.hypot(x - 0.5, y - 0.5) * 14 + p[2]) * 0.9) * 0.8)
    }
    case 'blobs': {
      const pts = Array.from({ length: 4 }, (_, i) => [0.2 + (((h >>> (i * 5)) & 31) / 31) * 0.6, 0.2 + (((h >>> (i * 5 + 3)) & 31) / 31) * 0.6])
      return (x, y) => {
        const f = pts.reduce((s, [px, py]) => s + 0.02 / ((x - px) ** 2 + (y - py) ** 2 + 0.004), 0)
        return clamp((f - 0.45) * 0.35)
      }
    }
    case 'dunes': {
      const ph = j(0) * 6
      return (x, y) => {
        for (let k = 0; k < 5; k++) {
          const ridge = 0.25 + k * 0.17 + Math.sin(x * (5 + k) + ph + k * 1.7) * 0.06
          if (y < ridge) return clamp(0.15 + k * 0.17 + (ridge - y) * 1.2 - 0.25)
        }
        return 0.9
      }
    }
    case 'peaks': {
      const seeds = [j(0), j(8), j(16)]
      return (x, y) => {
        for (let k = 2; k >= 0; k--) {
          const t = x * (3 + k * 2) + seeds[k] * 6
          const ridge = 0.35 + k * 0.17 - Math.abs(((t % 2) + 2) % 2 - 1) * (0.22 - k * 0.04)
          if (y > ridge) return k === 2 ? 0.95 : 0.3 + k * 0.25 - (x - 0.5) * 0.25 * (k + 1) * 0.3
        }
        return clamp(0.3 - y * 0.6) // sky
      }
    }
    case 'grid': {
      const hz = 0.48 + (j(0) - 0.5) * 0.1
      return (x, y) => {
        if (y < hz) {
          const sun = Math.hypot(x - 0.5, y - hz) < 0.22 ? 0.85 - (hz - y) * 1.2 : 0
          return clamp(Math.max(sun, (y - hz + 0.3) * 0.5))
        }
        const dep = 1 / (y - hz + 0.001)
        const X = (x - 0.5) * dep * 1.6
        const Z = dep * 0.6 + j(8)
        const fx = Math.abs(X - Math.round(X))
        const fz = Math.abs(Z - Math.round(Z))
        const line = fx < Math.min(0.3, 0.035 * dep) || fz < Math.min(0.3, 0.012 * dep * dep)
        return line ? clamp(1.1 - dep * 0.03) : clamp(0.1 - dep * 0.01)
      }
    }
    case 'diamond': {
      const cx = 0.5 + (j(0) - 0.5) * 0.2
      return (x, y) => {
        const d = Math.abs(x - cx) + Math.abs(y - 0.5)
        return clamp(0.5 + 0.5 * Math.cos(d * 34) - d * 0.5)
      }
    }
    case 'burst': {
      const rays = 10 + (h % 8)
      const cx = 0.5 + (j(0) - 0.5) * 0.3
      const cy = 0.5 + (j(8) - 0.5) * 0.3
      return (x, y) => {
        const a = Math.atan2(y - cy, x - cx)
        const r = Math.hypot(x - cx, y - cy)
        return clamp((0.5 + 0.5 * Math.cos(a * rays)) * (1 - r * 0.9) + (r < 0.07 ? 1 : 0))
      }
    }
    case 'tunnel': {
      const ph = j(0)
      return (x, y) => {
        const d = Math.max(Math.abs(x - 0.5), Math.abs(y - 0.5))
        return clamp((0.5 + 0.5 * Math.cos(Math.log(d + 0.02) * 14 + ph * 6.28)) * Math.min(1, 0.25 + d * 2.4))
      }
    }
    case 'halftone': {
      const ang = j(0) * 0.8
      return (x, y) => {
        const u = (x - 0.5) * Math.cos(ang) - (y - 0.5) * Math.sin(ang)
        const v = (x - 0.5) * Math.sin(ang) + (y - 0.5) * Math.cos(ang)
        const cell = 1 / 9
        const cu = Math.round(u / cell) * cell
        const cv = Math.round(v / cell) * cell
        const r = cell * 0.62 * clamp(1 - Math.hypot(x - 0.3, y - 0.3) * 1.2)
        return Math.hypot(u - cu, v - cv) < r ? 1 : 0
      }
    }
    case 'warp': {
      const k = 5 + (h % 3)
      return (x, y) => {
        const wx = x + Math.sin(y * 7 + j(0) * 6) * 0.08
        const wy = y + Math.sin(x * 7 + j(8) * 6) * 0.08
        const c = (Math.floor(wx * k) + Math.floor(wy * k)) & 1
        return c ? 0.9 - Math.hypot(x - 0.5, y - 0.5) * 0.6 : 0.06
      }
    }
    case 'zigzag': {
      const f = 7 + (h % 4)
      return (x, y) => {
        const t = y * f + Math.abs(((x * 6 + j(0)) % 1) - 0.5) * 2
        return clamp((Math.abs((t % 1) - 0.5) < 0.22 ? 1 : 0.05) * (0.4 + y * 0.7))
      }
    }
    case 'ripple': {
      const cx = 0.35 + j(0) * 0.3
      const cy = 0.35 + j(8) * 0.3
      return (x, y) => {
        const d = Math.hypot(x - cx, y - cy)
        return clamp(0.45 + 0.55 * Math.cos(d * 55) * Math.exp(-d * 3.2) + (d < 0.04 ? 0.6 : 0) - 0.15)
      }
    }
    case 'aurora': {
      const n = noise2(h)
      return (x, y) => {
        const band = Math.sin(x * 4 + n(x * 3, 0.5) * 4) * 0.12 + 0.38
        const curtain = 0.5 + 0.5 * Math.sin(x * 46 + n(x * 6, y) * 3)
        return clamp(Math.exp(-((y - band) ** 2) * 28) * (0.55 + curtain * 0.5) + (y > 0.85 ? 0.2 : 0))
      }
    }
    case 'weave': {
      const k = 6
      return (x, y) => {
        const cx = Math.floor(x * k)
        const cy = Math.floor(y * k)
        const fx = x * k - cx
        const fy = y * k - cy
        const over = (cx + cy) & 1
        const strand = over ? Math.sin(fy * Math.PI) : Math.sin(fx * Math.PI)
        return clamp(strand * 0.95 - 0.08)
      }
    }
    case 'vortex': {
      const tw = 6 + j(0) * 6
      return (x, y) => {
        const dx = x - 0.5
        const dy = y - 0.5
        const r = Math.hypot(dx, dy)
        const a = Math.atan2(dy, dx) + r * tw
        return clamp((0.5 + 0.5 * Math.sin(a * 6)) * (1 - r * 1.1) + 0.05)
      }
    }
    case 'petals': {
      const k = 3 + (h % 4)
      const rot = j(0) * 6
      return (x, y) => {
        const dx = x - 0.5
        const dy = y - 0.5
        const r = Math.hypot(dx, dy)
        const edge = 0.42 * Math.abs(Math.cos(k * (Math.atan2(dy, dx) + rot) / 2))
        return r < edge ? clamp(1.05 - (r / edge) * 0.55) : r < 0.07 ? 1 : 0.04
      }
    }
    case 'eclipse': {
      return (x, y) => {
        const d = Math.hypot(x - 0.5, y - 0.5)
        if (d < 0.25) return 0.02
        const a = Math.atan2(y - 0.5, x - 0.5)
        const rays = 0.5 + 0.5 * Math.cos(a * (14 + (h % 9)) + j(0) * 6)
        return clamp((d < 0.28 ? 1 : 0) + Math.exp(-(d - 0.27) * 9) * (0.35 + rays * 0.45))
      }
    }
    case 'tide': {
      const f = 16 + (h % 8)
      return (x, y) => clamp(0.5 + 0.5 * Math.sin(y * f + Math.sin(x * 3 + j(0) * 6) * 0.8) > 1 - y * 1.1 ? 0.95 : 0.04)
    }
    case 'cells': {
      const pts = Array.from({ length: 9 }, (_, i) => {
        return [0.08 + ((hash(`${seed}x${i}`) % 1000) / 1000) * 0.84, 0.08 + ((hash(`${seed}y${i}`) % 1000) / 1000) * 0.84]
      })
      return (x, y) => {
        const ds = pts.map(([px, py]) => Math.hypot(x - px, y - py)).sort((a, b) => a - b)
        return ds[1] - ds[0] < 0.018 ? 1 : clamp(0.5 - ds[0] * 3)
      }
    }
    case 'flow': {
      const n = noise2(h)
      return (x, y) => clamp(0.5 + 0.5 * Math.sin(n(x * 3, y * 3) * 26) - 0.05)
    }
    case 'contour': {
      const n = noise2(h)
      return (x, y) => {
        const v = n(x * 3, y * 3) * 0.7 + n(x * 7, y * 7) * 0.3
        const t = (v * 9) % 1
        return t < 0.16 ? 1 : clamp(v * 0.25 - 0.08)
      }
    }
    case 'prism': {
      const k = 5
      return (x, y) => {
        const u = x * k
        const v = y * k
        const row = Math.floor(v)
        const fu = (u + (row & 1) * 0.5) % 1
        const fv = v - row
        const up = fu > fv * 0.5 && fu < 1 - fv * 0.5
        return up ? clamp(0.25 + ((Math.floor(u) * 7 + row * 3 + (h % 5)) % 5) * 0.17) : 0.05
      }
    }
    case 'comet': {
      const hx = 0.62 + j(0) * 0.12
      const hy = 0.34 + j(8) * 0.12
      return (x, y) => {
        // tail runs from the head toward the bottom left
        const t = (hx - x) * 0.7 + (y - hy) * 0.7
        const off = Math.abs((hx - x) * 0.7 - (y - hy) * 0.7)
        const head = Math.hypot(x - hx, y - hy)
        if (head < 0.08) return 1
        if (t > 0 && off < 0.04 + t * 0.18) return clamp(0.95 - t * 1.4)
        return ((x * 131 + y * 71 + j(16)) * 997) % 1 > 0.99 ? 0.9 : 0.03
      }
    }
    case 'star': {
      const pts = 5 + (h % 3)
      const rot = j(0) * 6
      return (x, y) => {
        const dx = x - 0.5
        const dy = y - 0.5
        const r = Math.hypot(dx, dy)
        const a = Math.atan2(dy, dx) + rot
        const sector = Math.PI / pts
        const m = Math.abs(((a % (2 * sector)) + 2 * sector) % (2 * sector) - sector) / sector
        const edge = 0.18 + 0.24 * (1 - m)
        return r < edge ? clamp(1 - dx * 0.8 - dy * 0.8 - r) : clamp(0.08 - r * 0.05)
      }
    }
  }
}

/** Two-tone bitmap, GRID x GRID, row-major. 1 = ink. */
export function renderBits(pattern: AvatarPattern, seed: string): Uint8Array {
  const f = field(pattern, seed)
  const out = new Uint8Array(GRID * GRID)
  for (let y = 0; y < GRID; y++)
    for (let x = 0; x < GRID; x++) {
      const v = f((x + 0.5) / GRID, (y + 0.5) / GRID)
      out[y * GRID + x] = v * 64 > BAYER[y & 7][x & 7] + 0.5 ? 1 : 0
    }
  return out
}

export function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/** Background: the ink colour sunk deep into Forke black. */
export function paperFor(ink: string): [number, number, number] {
  const [r, g, b] = hexToRgb(ink)
  const base = [0x14, 0x12, 0x12]
  return [Math.round(base[0] + (r - base[0]) * 0.13), Math.round(base[1] + (g - base[1]) * 0.13), Math.round(base[2] + (b - base[2]) * 0.13)]
}
