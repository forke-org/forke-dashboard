import sharp from 'sharp'
import { resolveAvatarUrl } from '@/lib/utils/avatar'
import { defaultAvatarUrl } from './dither'

const cache = new Map<string, boolean>()
const OAUTH_HOSTS = /(^|\.)(githubusercontent\.com|googleusercontent\.com)$/

/**
 * True when a GitHub or Google photo is the provider's placeholder (GitHub identicon, Google letter tile).
 * Those are almost entirely two flat colours, real photos never are. Cached per URL; errors count as "real photo".
 */
export async function isPlaceholderPhoto(url: string): Promise<boolean> {
  let host: string
  try {
    host = new URL(url).hostname
  } catch {
    return false
  }
  if (!OAUTH_HOSTS.test(host)) return false
  if (cache.has(url)) return cache.get(url)!
  let result = false
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) })
    if (res.ok) {
      const N = 40
      const { data } = await sharp(Buffer.from(await res.arrayBuffer()))
        .resize(N, N, { fit: 'fill', kernel: 'nearest' })
        .removeAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true })
      const px = (x: number, y: number) => [data[(y * N + x) * 3], data[(y * N + x) * 3 + 1], data[(y * N + x) * 3 + 2]]
      const near = (a: number[], b: number[], t: number) => Math.abs(a[0] - b[0]) < t && Math.abs(a[1] - b[1]) < t && Math.abs(a[2] - b[2]) < t
      const counts = new Map<number, number>()
      let grey = 0
      let white = 0
      let mirror = 0
      for (let y = 0; y < N; y++)
        for (let x = 0; x < N; x++) {
          const p = px(x, y)
          const k = ((p[0] >> 5) << 6) | ((p[1] >> 5) << 3) | (p[2] >> 5)
          counts.set(k, (counts.get(k) || 0) + 1)
          if (near(p, [240, 240, 240], 10)) grey++
          if (p[0] > 235 && p[1] > 235 && p[2] > 235) white++
          if (x < N / 2 && near(p, px(N - 1 - x, y), 24)) mirror++
        }
      const total = N * N
      const top = [...counts.values()].sort((a, b) => b - a)
      const twoTone = (top[0] + (top[1] || 0)) / total
      // GitHub identicon: two flat colours on #F0F0F0, mirrored left to right
      const identicon = host.endsWith('githubusercontent.com') && twoTone > 0.97 && mirror / (total / 2) > 0.97 && grey / total > 0.2
      // Google letter tile: one flat colour with a white letter on it
      const letterTile = host.endsWith('googleusercontent.com') && twoTone > 0.85 && white / total > 0.03 && white / total < 0.4
      result = identicon || letterTile
    }
  } catch {
    result = false
  }
  if (cache.size > 2000) cache.clear()
  cache.set(url, result)
  return result
}

/** Stored avatar → URL to show. No photo, or a provider placeholder, becomes a generated Forke avatar. */
export async function resolveAvatar(image: string | null | undefined, seed: string): Promise<string> {
  const url = resolveAvatarUrl(image)
  if (!url) return defaultAvatarUrl(seed)
  if (await isPlaceholderPhoto(url)) return defaultAvatarUrl(seed)
  return url
}
