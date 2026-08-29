/**
 * @fileoverview Forke Platform
 * @copyright (c) 2026 Forke Inc. (https://www.forke.space/)
 *
 * Source-Available License (Non-Commercial / Fair Source).
 * This source code is open for inspection, learning, and personal development.
 * Commercial use, hosting, or resale as a paid service without an explicit
 * commercial license from Forke Inc. is strictly prohibited.
 */

import { ImageResponse } from 'next/og'
import { db } from '@/lib/db'
import { users, tasks, submissions } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { getLevelFromXp, getLevelTitle } from '@/lib/utils/xp'
import { resolveAvatarUrl } from '@/lib/utils/avatar'
import { headers } from 'next/headers'

export const runtime = 'nodejs'
// Always render from live DB data — never serve a stale statically-cached image
// (so avatar/name/headline edits show up immediately).
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const alt = 'Forke Developer Profile'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

async function fetchAvatarBase64(url: string | null, origin: string): Promise<string | null> {
  if (!url) return null
  try {
    let absoluteUrl = url
    if (url.startsWith('/')) {
      absoluteUrl = `${origin}${url}`
    }
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 2000)
    const res = await fetch(absoluteUrl, { signal: controller.signal })
    clearTimeout(timeoutId)
    if (!res.ok) return null
    const buffer = await res.arrayBuffer()
    const contentType = res.headers.get('content-type') || 'image/png'
    const base64 = Buffer.from(buffer).toString('base64')
    return `data:${contentType};base64,${base64}`
  } catch (e) {
    console.error('Failed to fetch avatar for OG image:', e)
    return null
  }
}

let fontPromise: Promise<ArrayBuffer | null> | null = null

function getFontData(): Promise<ArrayBuffer | null> {
  if (!fontPromise) {
    fontPromise = fetch('https://fonts.gstatic.com/s/instrumentserif/v5/jizHRFtNs2ka5fXjeivQ4LroWlx-6zATiw.ttf')
      .then((res) => (res.ok ? res.arrayBuffer() : null))
      .catch((e) => {
        console.error('Failed to load Instrument Serif Italic font:', e)
        return null
      })
  }
  return fontPromise
}

// Geist Sans — matches the live profile card / dashboard. Satori needs the raw
// font file, so we fetch the static TTFs (CSS variables aren't available here).
const geistUrls: Record<number, string> = {
  300: 'https://cdn.jsdelivr.net/fontsource/fonts/geist-sans@latest/latin-300-normal.ttf',
  400: 'https://cdn.jsdelivr.net/fontsource/fonts/geist-sans@latest/latin-400-normal.ttf',
  700: 'https://cdn.jsdelivr.net/fontsource/fonts/geist-sans@latest/latin-700-normal.ttf',
}
const geistPromises: Record<number, Promise<ArrayBuffer | null>> = {}

function getGeist(weight: 300 | 400 | 700): Promise<ArrayBuffer | null> {
  if (!geistPromises[weight]) {
    geistPromises[weight] = fetch(geistUrls[weight])
      .then((res) => (res.ok ? res.arrayBuffer() : null))
      .catch((e) => {
        console.error(`Failed to load Geist Sans ${weight}:`, e)
        return null
      })
  }
  return geistPromises[weight]
}

// Builds the Satori `fonts` array, including Geist weights that loaded ok.
function buildFonts(
  serif: ArrayBuffer | null,
  geist: { weight: 300 | 400 | 700; data: ArrayBuffer | null }[]
) {
  const fonts: any[] = []
  // Geist FIRST so any unmatched text falls back to sans (never the serif).
  for (const g of geist) {
    if (g.data) fonts.push({ name: 'Geist', data: g.data, style: 'normal', weight: g.weight })
  }
  if (serif) fonts.push({ name: 'Instrument Serif', data: serif, style: 'italic', weight: 400 })
  return fonts
}

export default async function Image({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params

  // Pre-load font data (serif for the wordmark fallback, Geist for everything else)
  const [fontData, geist300, geist400, geist700] = await Promise.all([
    getFontData(),
    getGeist(300),
    getGeist(400),
    getGeist(700),
  ])
  const fonts = buildFonts(fontData, [
    { weight: 300, data: geist300 },
    { weight: 400, data: geist400 },
    { weight: 700, data: geist700 },
  ])

  // Resolve the request origin so we can fetch local /public assets as base64
  // (Satori can't load a not-yet-deployed prod URL when running on localhost).
  const headersList = await headers()
  const host = headersList.get('host') || 'www.forke.space'
  const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https'
  const origin = `${protocol}://${host}`
  const faviconBase64 = await fetchAvatarBase64('/forke-assets/favicon.png', origin)

  // 1. Fetch user data from DB
  const dbUser = await db.query.users.findFirst({
    where: eq(users.username, username),
  })

  // 2. Generate dynamic organic dot pattern circles programmatically for the main background
  const dots: React.ReactNode[] = []
  let dotCounter = 0
  for (let x = 20; x < 1200; x += 35) {
    for (let y = 20; y < 630; y += 35) {
      const val = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453
      const rand = val - Math.floor(val)
      if (rand > 0.35) {
        const offsetX = (rand - 0.5) * 8
        const offsetY = (Math.cos(x + y) - 0.5) * 8
        dots.push(
          <circle
            key={`dot-${dotCounter++}`}
            cx={x + offsetX}
            cy={y + offsetY}
            r={1.2}
            fill="#ff8a00"
            opacity={0.15}
          />
        )
      }
    }
  }

  // 3. Fallback View if User is Not Found
  if (!dbUser) {
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '1200px',
            height: '630px',
            background: '#070709',
            backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255, 138, 0, 0.05) 0%, transparent 70%)',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontFamily: 'Geist, sans-serif',
            position: 'relative',
          }}
        >
          <svg
            width="1200"
            height="630"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              zIndex: 0,
              pointerEvents: 'none',
            }}
          >
            {dots}
          </svg>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#0a0a0a',
              border: '2px solid rgba(255, 122, 0, 0.25)',
              padding: '60px 80px',
              borderRadius: '28px',
              boxShadow: '0 30px 60px rgba(0,0,0,0.8)',
              zIndex: 10,
            }}
          >
            {faviconBase64 && (
              <img
                src={faviconBase64}
                width={130}
                height={130}
                style={{ width: '130px', height: '130px', objectFit: 'contain', marginBottom: '24px' }}
              />
            )}
            <h1 style={{ fontSize: '64px', fontFamily: 'Instrument Serif', fontStyle: 'italic', margin: 0, fontWeight: 400 }}>Forke</h1>
            <p style={{ fontSize: '20px', color: '#ff8a00', marginTop: '12px', letterSpacing: '1px', fontWeight: 'bold' }}>
              Ship Real Work, Get Paid
            </p>
          </div>
        </div>
      ),
      { ...size, fonts: fonts.length ? fonts : undefined }
    )
  }

  // 4. Fetch stats
  const isOwner = dbUser.role === 'owner'
  let shipped = 0
  let avgRating: number | null = null

  if (isOwner) {
    const rows = await db
      .select({ id: tasks.id })
      .from(tasks)
      .where(and(eq(tasks.clientId, dbUser.id), eq(tasks.status, 'approved')))
    shipped = rows.length
  } else {
    const rows = await db
      .select({ id: submissions.id, rating: submissions.rating })
      .from(submissions)
      .innerJoin(tasks, eq(submissions.taskId, tasks.id))
      .where(and(eq(submissions.developerId, dbUser.id), eq(submissions.status, 'approved')))
    shipped = rows.length
    const ratings = rows.map((r) => r.rating).filter((r): r is number => typeof r === 'number')
    avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null
  }

  // 5. Resolve variables
  const name = dbUser.name
  const xp = dbUser.xp || 0
  const level = getLevelFromXp(xp)
  const levelTitle = getLevelTitle(level)
  const initial = (name?.[0] || 'F').toUpperCase()
  const avatarUrl = resolveAvatarUrl(dbUser.image)

  // For long names keep only first + last (drop middle names); single name as-is.
  const nameParts = name.trim().split(/\s+/).filter(Boolean)
  const firstName = nameParts[0] || 'Forke'
  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : ''

  // Avatar fetched here (origin + favicon already resolved above).
  const avatarBase64 = await fetchAvatarBase64(avatarUrl, origin)




  // 8. Render OG Image Card
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          width: '1200px',
          height: '630px',
          background: '#070709',
          backgroundImage: 'radial-gradient(circle at 35% 50%, rgba(255, 138, 0, 0.05) 0%, transparent 70%)',
          color: 'white',
          padding: '40px 50px',
          fontFamily: 'Geist, sans-serif',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxSizing: 'border-box',
          position: 'relative',
        }}
      >
        {/* Dynamic Organic Dot Pattern Background Layer */}
        <svg
          width="1200"
          height="630"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 0,
            pointerEvents: 'none',
          }}
        >
          {dots}
        </svg>

        {/* Left Side: Exact ID Card Replica */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '340px',
            height: '510px',
            background: '#0a0a0a',
            border: '2px solid rgba(255, 122, 0, 0.25)',
            borderRadius: '28px',
            boxShadow: '0 30px 60px rgba(0,0,0,0.8)',
            overflow: 'hidden',
            boxSizing: 'border-box',
            position: 'relative',
            zIndex: 10,
          }}
        >
          {/* Card Header: slanted dots + url */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '20px 24px 16px 24px',
              borderBottom: '1px solid rgba(255,255,255,0.15)',
              width: '100%',
              boxSizing: 'border-box',
              zIndex: 2,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'row', gap: '5px' }}>
              <span style={{ width: '6px', height: '13px', borderRadius: '3px', background: 'white', transform: 'rotate(25deg)' }} />
              <span style={{ width: '6px', height: '13px', borderRadius: '3px', background: 'white', transform: 'rotate(25deg)' }} />
              <span style={{ width: '6px', height: '13px', borderRadius: '3px', background: 'white', transform: 'rotate(25deg)' }} />
            </div>
            <span style={{ color: '#ff8a00', fontSize: '15px', fontWeight: 'bold', fontFamily: 'monospace' }}>
              forke.space
            </span>
          </div>

          {/* Card Body Area */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              flexGrow: 1,
              width: '100%',
              zIndex: 2,
            }}
          >
            {/* Tilted Photo container */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '280px',
                position: 'relative',
              }}
            >
              <div
                style={{
                  width: '210px',
                  height: '270px',
                  transform: 'rotate(25deg)',
                  borderRadius: '105px',
                  border: '3px solid #ff8a00',
                  overflow: 'hidden',
                  background: '#161616',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {avatarBase64 ? (
                  <img
                    src={avatarBase64}
                    width={290}
                    height={290}
                    style={{
                      width: '290px',
                      height: '290px',
                      transform: 'rotate(-25deg)',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <span
                    style={{
                      fontSize: '110px',
                      fontWeight: 'light',
                      color: 'rgba(255,255,255,0.8)',
                      transform: 'rotate(-25deg)',
                    }}
                  >
                    {initial}
                  </span>
                )}
              </div>
            </div>

            {/* Overlapping Stacked Name */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                position: 'absolute',
                left: '24px',
                bottom: '44px',
                zIndex: 10,
              }}
            >
              <h2
                style={{
                  fontSize: '40px',
                  fontFamily: 'Instrument Serif',
                  fontStyle: 'italic',
                  color: 'white',
                  lineHeight: '0.85',
                  letterSpacing: '-1.5px',
                  margin: 0,
                }}
              >
                {firstName}
              </h2>
              {lastName && (
                <h2
                  style={{
                    fontSize: '40px',
                    fontFamily: 'Instrument Serif',
                    fontStyle: 'italic',
                    color: 'white',
                    lineHeight: '0.85',
                    letterSpacing: '-1.5px',
                    margin: 0,
                  }}
                >
                  {lastName}
                </h2>
              )}
            </div>

            {/* Level Title / Role Right */}
            <div
              style={{
                display: 'flex',
                position: 'absolute',
                right: '24px',
                bottom: '48px',
                zIndex: 10,
              }}
            >
              <span style={{ fontSize: '18px', fontFamily: 'Geist', color: 'rgba(255,255,255,0.85)', letterSpacing: '-0.5px' }}>
                {levelTitle}
              </span>
            </div>
          </div>

          {/* Card Footer Divider & Info */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              padding: '16px 24px 24px 24px',
              borderTop: '1px solid rgba(255,255,255,0.15)',
              width: '100%',
              boxSizing: 'border-box',
              zIndex: 2,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', fontFamily: 'Geist', fontWeight: 700, color: 'white' }}>
                Level {level} Builder
              </span>
              <span style={{ fontSize: '16px', color: '#ff8a00', fontWeight: 'bold', fontFamily: 'monospace' }}>
                @{dbUser.username}
              </span>
            </div>
            <span
              style={{
                fontSize: '11px',
                fontFamily: 'Geist',
                color: 'rgba(255,255,255,0.45)',
                marginTop: '6px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {dbUser.headline || dbUser.bio || 'Developer Network'}
            </span>
          </div>
        </div>

        {/* Right Side: Profile Info (Name, Headline, stats, QR) */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '710px',
            height: '510px',
            justifyContent: 'space-between',
            paddingLeft: '40px',
            boxSizing: 'border-box',
            zIndex: 10,
          }}
        >
          {/* Top Info */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h1 style={{ fontSize: '64px', fontFamily: 'Instrument Serif', fontStyle: 'italic', fontWeight: 400, color: 'white', margin: 0, letterSpacing: '-1px', lineHeight: '1.05' }}>
              {name}
            </h1>
            <div style={{ display: 'flex', flexDirection: 'row', fontSize: '24px', margin: '10px 0 0 0', fontFamily: 'Geist', fontWeight: 700 }}>
              <span style={{ color: 'white' }}>forke.space/</span>
              <span style={{ color: '#ff8a00' }}>@{dbUser.username}</span>
            </div>
            {/* Headline/Bio section */}
            <p style={{ fontSize: '20px', fontFamily: 'Geist', color: 'rgba(255,255,255,0.7)', margin: '16px 0 0 0', lineHeight: '1.4' }}>
              {dbUser.headline || dbUser.bio || 'Building real, verified work on Forke.'}
            </p>
          </div>

          {/* Bottom section: Stats + QR + Forke Logo */}
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', width: '100%' }}>
            
            {/* Stats Cards */}
            <div style={{ display: 'flex', flexDirection: 'row', gap: '16px' }}>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '16px 24px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '16px',
                  minWidth: '150px',
                }}
              >
                <span style={{ fontSize: '32px', fontWeight: '900', color: 'white', fontFamily: 'monospace', lineHeight: '1' }}>
                  {shipped}
                </span>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '6px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>
                  Shipped
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '16px 24px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '16px',
                  minWidth: '150px',
                }}
              >
                <span style={{ fontSize: '32px', fontWeight: '900', color: 'white', fontFamily: 'monospace', lineHeight: '1' }}>
                  {avgRating ? `${avgRating.toFixed(1)}★` : '—'}
                </span>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '6px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>
                  Avg Rating
                </span>
              </div>
            </div>

            {/* Forke favicon mark, bottom-right, sized to match the stat-card height */}
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <img
                src={faviconBase64 || ''}
                width={82}
                height={82}
                style={{ width: '82px', height: '82px', objectFit: 'contain' }}
              />
            </div>

          </div>
        </div>
      </div>
    ),
    {
      ...size,
      // Geist (300/400/700) for all UI text; Instrument Serif (italic) for names.
      fonts,
    }
  )
}
