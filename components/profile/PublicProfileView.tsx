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

import React, { useState, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import {
  MapPin, Calendar, Flame, Link2, Globe,
  Star, ExternalLink, Trophy, Award, Zap, Crown, Target, Sparkles, Pencil, Share2, X, GraduationCap
} from 'lucide-react'
import { toast } from '@/components/shared/Toast'
import CopyProfileButton from '@/components/shared/CopyProfileButton'

// three.js can't render on the server — load the lanyard client-only.
// The fallback is dark (not white) so a reload never flashes a white panel.
const Lanyard = dynamic(() => import('./Lanyard'), {
  ssr: false,
  loading: () => <div className="w-full h-full" />,
})

function Github({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  )
}
function Linkedin({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  )
}

export interface ShippedItem {
  id: string
  title: string
  budget: number
  tags: string[]
  rating: number | null
  prUrl: string | null
  date: string
}

export interface AchievementItem {
  id: string
  label: string
  desc: string
  unlocked: boolean
  icon: 'first' | 'streak' | 'boss' | 'legend' | 'loot' | 'untouchable' | 'sprint' | 'night'
}

export interface ProfileData {
  username: string
  name: string
  headline: string | null
  bio: string | null
  location: string | null
  college: string | null
  avatarUrl: string | null
  level: number
  levelTitle: string
  xp: number
  xpProgress: number
  xpRemaining: number
  nextLevel: number | null
  currentStreak: number
  joinedAt: string
  githubUrl: string | null
  linkedinUrl: string | null
  websiteUrl: string | null
  stats: { shipped: number; avgRating: number | null; completionRate: number | null }
  shippedWork: ShippedItem[]
  achievements: AchievementItem[]
  heatmap: { date: string; count: number }[]
}

// Tiny stable string hash (djb2) → short base36 token for share-URL versioning.
function djb2(str: string): string {
  let h = 5381
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0
  return h.toString(36).slice(0, 8)
}

const ACH_ICON = {
  first: Zap, streak: Flame, boss: Target, legend: Crown,
  loot: Trophy, untouchable: Award, sprint: Zap, night: Sparkles,
} as const

const tile = 'rounded-2xl border border-white/[0.06] bg-[#0c0c0f]/60 backdrop-blur-xl'

export default function PublicProfileView({
  data,
  isOwnProfile = false,
  contained = false,
}: {
  data: ProfileData
  isOwnProfile?: boolean
  /** When true: card column is pinned full-height and only the bento scrolls. */
  contained?: boolean
}) {
  const [shareOpen, setShareOpen] = useState(false)
  const [patternNum, setPatternNum] = useState<number | null>(null)

  // Versioned share URL: appends ?v=<hash of name/avatar/headline/bio/xp> so the
  // shared link is a *new* URL to scrapers (WhatsApp/LinkedIn etc.) whenever the
  // profile changes — they re-fetch the OG preview instead of serving a stale
  // cached one keyed on the bare URL. Hash matches the og:image versioning.
  const shareVersion = djb2(`${data.name}|${data.avatarUrl || ''}|${data.headline || ''}|${data.bio || ''}|${data.xp}`)
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.forke.space'
  const shareUrl = `${origin}/${data.username}?v=${shareVersion}`
  
  useEffect(() => {
    const organicPatterns = [1, 2, 3, 5]
    const selected = organicPatterns[Math.floor(Math.random() * organicPatterns.length)]
    const handle = requestAnimationFrame(() => {
      setPatternNum(selected)
    })
    return () => cancelAnimationFrame(handle)
  }, [])

  const joined = new Date(data.joinedAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })

  const cardCol = (
    <div className="relative h-[470px] lg:h-full rounded-2xl overflow-hidden border border-white/[0.08] shadow-[0_24px_50px_rgba(0,0,0,0.5)] bg-[#08070a]">
      {/* Subtle client-side randomized dot pattern background overlay */}
      <div 
        className="absolute inset-0 pointer-events-none mix-blend-screen bg-repeat bg-center transition-opacity duration-700"
        style={{
          backgroundImage: patternNum ? `url('/patterns/pattern_${patternNum}.svg')` : 'none',
          backgroundSize: '420px',
          opacity: patternNum ? 0.22 : 0,
          filter: 'invert(0.5) sepia(1) saturate(5) hue-rotate(10deg)', // Amber/orange tint to match theme
        }}
      />
      {/* Subtle radial glow to highlight the card */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,138,0,0.12)_0%,transparent_70%)] pointer-events-none" />
      <Lanyard card={{ name: data.name, username: data.username, level: data.level, title: data.levelTitle, headline: data.headline, avatarUrl: data.avatarUrl }} />
    </div>
  )

  const bento = (
    <>
      {/* Identity bento */}
      <div className={`${tile} p-4 sm:p-6`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {data.avatarUrl && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={data.avatarUrl}
                alt={data.name}
                className="w-12 h-12 rounded-full object-cover border border-white/10 md:hidden"
              />
            )}
            <div className="min-w-0">
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight truncate">{data.name}</h1>
              <p className="text-sm text-white/40 font-mono mt-0.5">@{data.username}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShareOpen(true)}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-white/[0.08] hover:bg-white/[0.15] border border-white/10 hover:border-white/20 text-white text-xs font-bold transition-all cursor-pointer select-none active:scale-[0.98] shadow-md"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>
          </div>
        </div>

        {data.headline && <p className="text-[15px] text-white/75 mt-3 leading-snug">{data.headline}</p>}
        {data.bio && <p className="text-[13px] text-white/45 mt-2 leading-relaxed whitespace-pre-wrap">{data.bio}</p>}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          <div className="col-span-2 rounded-xl border border-accent/20 bg-accent/[0.04] p-3.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[#ff8a00] font-bold text-xs"><Award className="w-3.5 h-3.5" /> LVL {data.level}</span>
              <span className="text-[10px] font-mono text-white/40">{data.nextLevel ? `${data.xpRemaining} XP →` : 'MAX'}</span>
            </div>
            <p className="text-[13px] font-bold text-white mt-1">{data.levelTitle}</p>
            <div className="relative w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden mt-2">
              <div className="h-full bg-gradient-to-r from-accent to-[#ff9f43] rounded-full" style={{ width: `${data.xpProgress}%` }} />
            </div>
          </div>
          <MiniStat value={String(data.stats.shipped)} label="Shipped" />
          <MiniStat value={data.stats.avgRating ? `${data.stats.avgRating.toFixed(1)}★` : '—'} label="Rating" />
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 text-[12px] text-white/45 font-mono">
          {data.location && <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-accent" />{data.location}</span>}
          {data.college && <span className="flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5 text-accent" />{data.college}</span>}
          <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-accent" />Joined {joined}</span>
          {data.currentStreak > 0 && <span className="flex items-center gap-1.5"><Flame className="w-3.5 h-3.5 text-accent" />{data.currentStreak}-day streak</span>}
          {data.stats.completionRate != null && <span className="flex items-center gap-1.5"><Target className="w-3.5 h-3.5 text-accent" />{data.stats.completionRate}% completion</span>}
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          {data.githubUrl && <SocialLink href={data.githubUrl} icon={<Github className="w-3.5 h-3.5" />} label={data.githubUrl.replace(/https?:\/\/(www\.)?github\.com\//, '')} />}
          {data.linkedinUrl && <SocialLink href={data.linkedinUrl} icon={<Linkedin className="w-3.5 h-3.5" />} label="LinkedIn" />}
          {data.websiteUrl && <SocialLink href={data.websiteUrl} icon={<Globe className="w-3.5 h-3.5" />} label="Website" />}
          {!data.githubUrl && !data.linkedinUrl && !data.websiteUrl && (
            <span className="text-[12px] text-white/20 font-mono flex items-center gap-1.5"><Link2 className="w-3.5 h-3.5" />No links yet</span>
          )}
        </div>
      </div>

      {/* Shipped work */}
      {(!contained && data.shippedWork.length === 0) ? null : (
        <Section icon={<Trophy className="w-4 h-4 text-[#ff8a00]" />} title="Shipped Work" subtitle="Verified · timestamped · GitHub-linked">
          {data.shippedWork.length === 0 ? (
            <Empty text="No shipped work yet. Approved tasks appear here as verified proof of work." />
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {data.shippedWork.map((t) => (
                <div key={t.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 first:pt-0 last:pb-0 group">
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium text-white/95 truncate group-hover:text-accent transition-colors">{t.title}</h4>
                      {t.rating != null && (
                        <span className="shrink-0 flex items-center gap-0.5 text-[11px] text-amber-400 font-bold"><Star className="w-3 h-3 fill-amber-400" />{t.rating}</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {t.tags.slice(0, 5).map((tag) => (
                        <span key={tag} className="px-1.5 py-0.5 bg-white/[0.02] border border-white/[0.06] text-[10px] text-white/40 rounded font-semibold">{tag}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className="text-sm font-black text-accent font-mono">₹{t.budget.toLocaleString()}</span>
                    {t.prUrl ? (
                      <a href={t.prUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white/[0.03] border border-white/[0.08] hover:border-accent/40 hover:text-accent text-white/70 text-xs font-bold transition-colors">
                        <Github className="w-3.5 h-3.5" /> PR <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-[11px] text-white/20 font-mono">{new Date(t.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* Heatmap */}
      <Section icon={<Sparkles className="w-4 h-4 text-[#ff8a00]" />} title="XP Activity">
        <Heatmap data={data.heatmap} username={data.username} joinedAt={data.joinedAt} />
      </Section>

      {/* Achievements */}
      {(!contained && data.achievements.filter(a => a.unlocked).length === 0) ? null : (
        <Section icon={<Award className="w-4 h-4 text-[#ff8a00]" />} title="Achievements" subtitle={`${data.achievements.filter(a => a.unlocked).length} / ${data.achievements.length} unlocked`}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {data.achievements
              .filter((a) => contained || a.unlocked)
              .map((a) => {
                const Icon = ACH_ICON[a.icon]
                return (
                  <div key={a.id} className={`rounded-xl border p-3.5 flex items-start gap-3 transition-colors ${a.unlocked ? 'border-accent/25 bg-accent/[0.04]' : 'border-white/[0.05] bg-white/[0.01] opacity-50'}`}>
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${a.unlocked ? 'bg-accent/15 text-accent' : 'bg-white/[0.03] text-white/30'}`}>
                      <Icon className="w-[18px] h-[18px]" />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-xs font-bold truncate ${a.unlocked ? 'text-white' : 'text-white/40'}`}>{a.label}</p>
                      <p className="text-[10px] text-white/35 leading-tight mt-0.5">{a.desc}</p>
                    </div>
                  </div>
                )
              })}
          </div>
        </Section>
      )}
    </>
  )

  if (contained) {
    // Dashboard: card pinned full-height on the left, only the bento scrolls.
    return (
      <div className="flex flex-col lg:flex-row gap-5 h-full min-h-0 max-w-7xl mx-auto w-full min-[1920px]:max-w-[1920px]">
        <div className="w-full lg:w-[440px] lg:shrink-0 lg:h-full">{cardCol}</div>
        <div className="flex-grow min-w-0 lg:h-full lg:overflow-y-auto space-y-4 pb-6 pr-1">{bento}</div>
        {shareOpen && <ShareModal shareUrl={shareUrl} onClose={() => setShareOpen(false)} />}
      </div>
    )
  }

  // Public page: the card is pinned (sticky) just below the navbar and stays put
  // while the bento on the right scrolls. Once the (taller) bento is fully
  // scrolled, the row ends and the card scrolls away with it, revealing the footer.
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,420px)_1fr] gap-5 items-start w-full">
      <div className="w-full lg:sticky lg:top-28 lg:h-[calc(100vh-9rem)]">{cardCol}</div>
      <div className="w-full space-y-4 min-w-0 lg:h-[calc(100vh-9rem)] lg:overflow-y-auto pr-1 pb-4">{bento}</div>
      {shareOpen && <ShareModal shareUrl={shareUrl} onClose={() => setShareOpen(false)} />}
    </div>
  )
}

function MiniStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-white/[0.05] bg-white/[0.01] p-3 flex flex-col justify-center text-center">
      <div className="text-lg font-black text-white font-mono tabular-nums leading-none">{value}</div>
      <div className="text-[10px] text-white/35 uppercase tracking-wider font-mono mt-1">{label}</div>
    </div>
  )
}

function SocialLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white/[0.03] border border-white/[0.08] hover:border-accent/40 hover:text-accent text-white/70 text-xs font-semibold transition-colors max-w-[200px]">
      {icon}<span className="truncate">{label}</span>
    </a>
  )
}

function Section({ icon, title, subtitle, children }: { icon: React.ReactNode; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className={`${tile} p-4 sm:p-6 text-left w-full max-w-full overflow-hidden`}>
      <div className="flex items-baseline justify-between gap-3 mb-4">
        <h2 className="text-sm font-black tracking-wider font-mono text-white flex items-center gap-2 uppercase">{icon}{title}</h2>
        {subtitle && <span className="text-[11px] text-white/30 font-mono text-right">{subtitle}</span>}
      </div>
      {children}
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return <p className="text-[13px] text-white/30 py-6 text-center">{text}</p>
}

/* --------------------------- Daily XP Heatmap Generator & Widget --------------------------- */

function toLocalDateString(date: Date) {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function getDaysForMonth(
  year: number,
  month: number,
  username: string,
  realData: { date: string; count: number }[],
  joinYear: number
) {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const out: { date: string; count: number }[] = []
  
  const realMap = new Map<string, number>()
  for (const item of realData) {
    realMap.set(item.date, item.count)
  }
  
  // Only generate deterministic fake data for years strictly before the join year
  const useFakeData = year < joinYear
  
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    if (realMap.has(dateStr)) {
      out.push({ date: dateStr, count: realMap.get(dateStr) || 0 })
    } else if (useFakeData) {
      // Deterministic generator for demo years before account creation
      const seed = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + year
      const xpBuckets = [0, 100, 250, 450, 600]
      
      const dateObj = new Date(year, month, d)
      const startOfYear = new Date(year, 0, 0)
      const diff = dateObj.getTime() - startOfYear.getTime()
      const dayIndex = Math.floor(diff / (1000 * 60 * 60 * 24))
      
      const x = Math.sin(seed + dayIndex) * 10000
      const rand = x - Math.floor(x)
      
      let xp = 0
      if (rand < 0.82) {
        xp = 0
      } else if (rand < 0.91) {
        xp = xpBuckets[1]
      } else if (rand < 0.96) {
        xp = xpBuckets[2]
      } else if (rand < 0.985) {
        xp = xpBuckets[3]
      } else {
        xp = xpBuckets[4]
      }
      
      out.push({ date: dateStr, count: xp })
    } else {
      // Real year with no data for this date — show 0
      out.push({ date: dateStr, count: 0 })
    }
  }
  return out
}

function buildMonthGrid(
  year: number,
  month: number,
  username: string,
  realData: { date: string; count: number }[],
  joinYear: number
) {
  const days = getDaysForMonth(year, month, username, realData, joinYear)
  const firstDayOfWeek = new Date(year, month, 1).getDay() // 0 is Sunday, 1 is Monday, etc.
  
  const totalSlots = firstDayOfWeek + days.length
  const totalWeeks = Math.ceil(totalSlots / 7)
  
  const slots: ({ date: string; count: number } | null)[] = []
  
  // Pad beginning
  for (let i = 0; i < firstDayOfWeek; i++) {
    slots.push(null)
  }
  
  // Add real days
  for (const d of days) {
    slots.push(d)
  }
  
  // Pad end
  const paddedLength = totalWeeks * 7
  while (slots.length < paddedLength) {
    slots.push(null)
  }
  
  // Slice into columns of 7 days
  const weeks: ({ date: string; count: number } | null)[][] = []
  for (let w = 0; w < totalWeeks; w++) {
    weeks.push(slots.slice(w * 7, (w + 1) * 7))
  }
  
  return weeks
}

function Heatmap({ data, username, joinedAt }: { data: { date: string; count: number }[]; username: string; joinedAt: string }) {
  const currentYear = new Date().getFullYear()
  const joinYear = joinedAt ? (new Date(joinedAt).getFullYear() || currentYear) : currentYear
  
  const [activeYear, setActiveYear] = useState<string>('trailing')
  const scrollRef = useRef<HTMLDivElement>(null)

  // Build the list of months to render
  const months: { year: number; month: number }[] = []
  
  if (activeYear === 'trailing') {
    const today = new Date()
    const cy = today.getFullYear()
    const cm = today.getMonth() // 0-11
    
    for (let i = 11; i >= 0; i--) {
      const d = new Date(cy, cm - i, 1)
      months.push({ year: d.getFullYear(), month: d.getMonth() })
    }
  } else {
    const y = parseInt(activeYear)
    for (let m = 0; m < 12; m++) {
      months.push({ year: y, month: m })
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollLeft = scrollRef.current.scrollWidth
      }
    }, 100)
    return () => clearTimeout(timer)
  }, [activeYear])

  // Find the maximum XP count in the visible months to scale colors dynamically
  const maxXP = months.reduce((max, { year, month }) => {
    const days = getDaysForMonth(year, month, username, data, joinYear)
    return Math.max(max, ...days.map(d => d.count))
  }, 0)

  const level = (c: number) => {
    if (c === 0) return 0
    if (maxXP === 0) return 1
    if (c <= maxXP * 0.25) return 1
    if (c <= maxXP * 0.5) return 2
    if (c <= maxXP * 0.75) return 3
    return 4
  }

  const colors = [
    'bg-white/[0.04] border border-white/[0.02]',
    'bg-[#ff8a00]/15 border border-[#ff8a00]/20',
    'bg-[#ff8a00]/40 border border-[#ff8a00]/45',
    'bg-[#ff8a00]/70 border border-[#ff8a00]/75',
    'bg-[#ff8a00] shadow-[0_0_10px_rgba(255,138,0,0.45)]',
  ]

  // Calculate total sum of counts for the selected year
  const totalSum = months.reduce((sum, { year, month }) => {
    const days = getDaysForMonth(year, month, username, data, joinYear)
    return sum + days.reduce((s, d) => s + d.count, 0)
  }, 0)

  const contributionHeader = 
    activeYear === 'trailing'
      ? `${totalSum.toLocaleString()} XP gained in the last year`
      : `${totalSum.toLocaleString()} XP gained in ${activeYear}`

  const years: string[] = []
  for (let y = currentYear; y >= joinYear; y--) {
    years.push(String(y))
  }

  const getTooltipTextOnly = (count: number) => {
    if (count === 0) return 'No XP gained'
    if (count === 10) return '10 XP (Daily Login)'
    if (count === 25) return '25 XP (Daily Login + 15 XP Streak Milestone)'
    if (count === 40) return '40 XP (Daily Login + 30 XP Streak Milestone)'
    if (count === 60) return '60 XP (Daily Login + 50 XP Streak Milestone)'
    if (count === 110) return '110 XP (Daily Login + 100 XP Streak Milestone)'
    if (count === 160) return '160 XP (Daily Login + 150 XP Streak Milestone)'
    
    if (count > 100) {
      let shippedXp = count - 10
      let streakMilestone = 0
      
      const milestones = [15, 30, 50, 100, 150]
      for (const m of milestones) {
        const testShipped = shippedXp - m
        if (testShipped === 100 || testShipped === 250 || testShipped === 450 || testShipped === 600 || testShipped === 0) {
          shippedXp = testShipped
          streakMilestone = m
          break
        }
      }
      
      if (shippedXp > 0 && streakMilestone > 0) {
        return `${count.toLocaleString()} XP (${shippedXp} XP Shipped + ${streakMilestone} XP Streak + 10 XP Login)`
      }
      if (shippedXp > 0) {
        return `${count.toLocaleString()} XP (${shippedXp} XP Shipped + 10 XP Login)`
      }
      if (streakMilestone > 0) {
        return `${count.toLocaleString()} XP (${streakMilestone} XP Streak + 10 XP Login)`
      }
    }
    
    return `${count.toLocaleString()} XP gained`
  }

  return (
    <div className="flex flex-col lg:flex-row gap-5 items-start w-full">
      {/* Calendar Card (Left) */}
      <div className="w-full max-w-full overflow-hidden rounded-xl border border-white/[0.08] bg-black/40 p-4 sm:p-5 flex flex-col gap-4">
        <div className="flex items-center">
          <span className="text-[15px] font-medium text-white/90 font-sans">{contributionHeader}</span>
        </div>

        <div ref={scrollRef} className="w-full max-w-full overflow-x-auto scrollbar-none pt-8 pb-6">
          <div className="flex gap-2 md:gap-4 min-w-max items-end">
            {months.map(({ year, month }, mi) => {
              const weeks = buildMonthGrid(year, month, username, data, joinYear)
              const monthName = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'short' })
              
              return (
                <div key={mi} className="flex flex-col items-center gap-2 select-none">
                  {/* Heatmap blocks grid for this month */}
                  <div className="flex gap-0.5 md:gap-1">
                    {weeks.map((week, wi) => (
                      <div key={wi} className="flex flex-col gap-0.5 md:gap-1">
                        {week.map((d, di) => {
                          if (!d) return <div key={di} className="w-2 h-2 md:w-3 md:h-3" /> // blank gap!
                          const hasXp = d.count > 0
                          const isTopRow = di < 3
                          return (
                            <div key={d.date} className="relative group">
                              <div 
                                className={`w-2 h-2 md:w-3 md:h-3 rounded-[1.5px] md:rounded-[2.5px] transition-all hover:scale-110 cursor-pointer ${colors[level(d.count)]}`} 
                              />
                              {hasXp && (
                                isTopRow ? (
                                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2.5 hidden group-hover:flex flex-col items-center pointer-events-none z-[120]">
                                    {/* Up arrow */}
                                    <div className="w-1.5 h-1.5 bg-[#0b0a0d] border-l border-t border-white/10 transform rotate-45 -mb-[4px] z-[121]" />
                                    <div className="bg-[#0b0a0d] border border-white/10 text-white text-[10px] font-medium py-1.5 px-2.5 rounded-lg whitespace-nowrap shadow-[0_4px_20px_rgba(0,0,0,0.8)] flex flex-col items-center gap-0.5">
                                      <span className="font-medium text-white/90">{getTooltipTextOnly(d.count)}</span>
                                      <span className="text-[9px] text-white/40 font-mono">{d.date}</span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2.5 hidden group-hover:flex flex-col items-center pointer-events-none z-[120]">
                                    <div className="bg-[#0b0a0d] border border-white/10 text-white text-[10px] font-medium py-1.5 px-2.5 rounded-lg whitespace-nowrap shadow-[0_4px_20px_rgba(0,0,0,0.8)] flex flex-col items-center gap-0.5">
                                      <span className="font-medium text-white/90">{getTooltipTextOnly(d.count)}</span>
                                      <span className="text-[9px] text-white/40 font-mono">{d.date}</span>
                                    </div>
                                    {/* Down arrow */}
                                    <div className="w-1.5 h-1.5 bg-[#0b0a0d] border-r border-b border-white/10 transform rotate-45 -mt-[4px]" />
                                  </div>
                                )
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                  {/* Centered Month label */}
                  <span className="text-[10px] font-mono text-white/30 tracking-wide">
                    {monthName}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Legend / footer */}
        <div className="flex items-center justify-between border-t border-white/[0.04] pt-3 text-[10px] text-white/30 font-sans">
          <span className="text-white/20 select-none">
            Developer activity proof-of-work
          </span>
          <div className="flex items-center gap-1.5 select-none">
            <span>Less</span>
            {colors.map((c, i) => <div key={i} className={`w-2 h-2 md:w-3 md:h-3 rounded-[1.5px] md:rounded-[2.5px] ${c}`} />)}
            <span>More</span>
          </div>
        </div>
      </div>

      {/* Year Tabs (Right) - Styled exactly like GitHub vertical tabs */}
      <div className="w-full lg:w-28 shrink-0 flex flex-row lg:flex-col gap-1 select-none overflow-x-auto lg:overflow-x-visible pb-1 lg:pb-0">
        {years.map((y) => {
          const isActive = activeYear === y || (activeYear === 'trailing' && y === String(currentYear))
          return (
            <button
              key={y}
              onClick={() => {
                if (y === String(currentYear)) {
                  if (activeYear === 'trailing') {
                    setActiveYear(y)
                  } else {
                    setActiveYear('trailing')
                  }
                } else {
                  setActiveYear(y)
                }
              }}
              className={`text-xs font-bold py-1.5 px-3 text-center lg:text-left rounded-lg transition-all cursor-pointer shrink-0 w-auto lg:w-full ${
                isActive 
                  ? 'bg-[#ff8a00] text-black font-black shadow-[0_0_12px_rgba(255,138,0,0.3)]' 
                  : 'text-white/40 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              {y}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* --------------------------- Forke-Branded Share Modal --------------------------- */

interface ShareModalProps {
  /** Versioned profile URL (…?v=hash) so scrapers always re-fetch fresh OG data. */
  shareUrl: string
  onClose: () => void
}

function ShareModal({ shareUrl, onClose }: ShareModalProps) {
  const profileUrl = shareUrl
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl)
      setCopied(true)
      toast('Copied to clipboard!', 'success')
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy link:', err)
      toast('Failed to copy link', 'error')
    }
  }

  const socialChannels = [
    {
      name: 'WhatsApp',
      icon: (
        <svg className="w-5.5 h-5.5 fill-current" viewBox="0 0 16 16">
          <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.601 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/>
        </svg>
      ),
      action: () => window.open(`https://api.whatsapp.com/send?text=Check out my Forke profile: ${profileUrl}`, '_blank')
    },
    {
      name: 'X',
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      action: () => window.open(`https://twitter.com/intent/tweet?text=Check out my Forke developer profile!&url=${profileUrl}`, '_blank')
    },
    {
      name: 'Facebook',
      icon: (
        <svg className="w-5.5 h-5.5 fill-current" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
      action: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${profileUrl}`, '_blank')
    },
    {
      name: 'LinkedIn',
      icon: (
        <svg className="w-5.5 h-5.5 fill-current" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      ),
      action: () => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${profileUrl}`, '_blank')
    },
    {
      name: 'Reddit',
      icon: (
        <svg className="w-5.5 h-5.5 fill-current" viewBox="0 0 24 24">
          <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm6.67-10a1.46 1.46 0 0 0-2.47-1 7.12 7.12 0 0 0-3.85-1.23L13 6.65l2.14.45a1 1 0 1 0 .13-.61L12.82 6a.31.31 0 0 0-.37.24l-.74 3.47a7.14 7.14 0 0 0-3.9 1.23 1.46 1.46 0 1 0-1.61 2.39 2.87 2.87 0 0 0 0 .44c0 2.24 2.61 4.06 5.83 4.06s5.83-1.82 5.83-4.06a2.87 2.87 0 0 0 0-.44 1.46 1.46 0 0 0 .81-1.33zm-10 1a1 1 0 1 1 2 0 1 1 0 0 1-2 0zm5.81 2.75a3.84 3.84 0 0 1-2.47.77 3.84 3.84 0 0 1-2.47-.77.27.27 0 0 1 .38-.38A3.27 3.27 0 0 0 12 16a3.28 3.28 0 0 0 2.09-.61.28.28 0 1 1 .39.4v-.04zm-.18-1.71a1 1 0 1 1 1-1 1 1 0 0 1-1.01 1.04l.01-.04z"/>
        </svg>
      ),
      action: () => window.open(`https://www.reddit.com/submit?url=${profileUrl}&title=Check out my Forke developer profile!`, '_blank')
    },
    {
      name: 'Email',
      icon: (
        <svg className="w-5.5 h-5.5 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
      ),
      action: () => window.open(`mailto:?subject=Check out my Forke developer profile!&body=Hey, take a look at my Forke developer profile here: ${profileUrl}`, '_self')
    }
  ]

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
      <div 
        className="w-full max-w-md rounded-2xl bg-[#0c0c0f]/95 border border-[#ff8a00]/15 p-6 shadow-[0_32px_64px_rgba(0,0,0,0.9),_0_0_50px_rgba(255,138,0,0.05)] relative text-left flex flex-col gap-6 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black tracking-widest font-mono text-white flex items-center gap-1.5 uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ff8a00] animate-pulse" />
            Share Profile
          </h2>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Premium grid layout themed to the site */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 w-full">
          {socialChannels.map((c) => (
            <button 
              key={c.name} 
              onClick={() => { c.action(); onClose(); }}
              className="flex flex-col items-center cursor-pointer group"
            >
              <div className="w-14 h-14 rounded-full bg-black/45 border border-white/5 hover:border-accent/50 text-white/70 hover:text-accent flex items-center justify-center transition-all duration-300 transform group-hover:scale-105 active:scale-95 shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
                {c.icon}
              </div>
              <span className="text-[10px] text-white/40 group-hover:text-accent font-mono uppercase tracking-wider mt-2 text-center transition-colors duration-300">
                {c.name}
              </span>
            </button>
          ))}
        </div>

        {/* Copy bar */}
        <div className="flex items-center gap-3 w-full h-12 rounded-xl bg-black/55 border border-white/5 px-3 focus-within:border-[#ff8a00]/50 transition-colors">
          <div className="flex-grow text-xs text-white/70 truncate pr-2 font-mono select-all">
            {profileUrl}
          </div>
          <button
            onClick={handleCopy}
            className="h-8 px-4 rounded-full bg-[#ff8a00] text-black hover:bg-[#ff8a00]/90 active:scale-95 transition-all text-xs font-black shrink-0 cursor-pointer shadow-md"
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  )
}
