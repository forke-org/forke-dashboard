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

import { useState, type ReactNode } from 'react'
import dynamic from 'next/dynamic'
import { BadgeCheck, Calendar, Check, Pencil, GitMerge, Globe, GraduationCap, Lock, MapPin, Pin, Search, Send, Share2, Star, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import Heatmap from './Heatmap'
import { githubHandle, type DevProfile, type ShippedWork } from './types'
import type { CardData } from '@/components/idcard/paint'
import type { CardStyle } from '@/components/idcard/style'

const CardLive = dynamic(() => import('@/components/idcard/CardLive'), { ssr: false, loading: () => <div className="h-[400px]" /> })

const mono = 'font-mono'
const line = 'border-[var(--color-border)]'

export function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.09.68-.22.68-.49l-.01-1.7c-2.78.62-3.37-1.36-3.37-1.36-.46-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.35 1.12 2.92.85.09-.66.35-1.12.63-1.37-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.04 1.03-2.76-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05A9.3 9.3 0 0 1 12 6.96c.85 0 1.71.12 2.51.34 1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.64 1.03 2.76 0 3.94-2.34 4.81-4.57 5.06.36.32.68.94.68 1.9l-.01 2.81c0 .27.18.59.69.49A10.26 10.26 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z" />
    </svg>
  )
}

export function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
    </svg>
  )
}

function Stars({ n }: { n: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-[13px] text-white/80">
      <Star className="h-3.5 w-3.5 fill-[#FFA347] text-[#FFA347]" /> {n.toFixed(1)}
    </span>
  )
}

function Tag({ children }: { children: ReactNode }) {
  return <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[11.5px] text-white/60">{children}</span>
}

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

function Empty({ children }: { children: ReactNode }) {
  return <p className={cn('rounded-2xl border border-dashed px-5 py-10 text-center text-[14px] text-white/40', line)}>{children}</p>
}

export type ProfileTab = 'overview' | 'shipped' | 'reviews' | 'achievements'
type Tab = ProfileTab

/** On the live page: where the main button goes, and its label. Without it (the dashboard preview) the buttons are static. */
export type ProfileActions = { primaryHref: string; primaryLabel: string; own: boolean }

/**
 * The public profile as visitors see it (layout B), fed with real data. Used on forke.space/username, as the live
 * preview in the dashboard, and in the landing page tour. Layout follows the component's own width (container
 * queries), so a fixed-width frame shows the desktop layout on any screen.
 * `tab`/`onTabChange` let a parent drive the tabs; `cardSlot` replaces the 3D card (the tour uses a light 2D one).
 */
export default function ProfileView({
  p,
  card,
  cardStyle,
  actions,
  tab: tabProp,
  onTabChange,
  cardSlot,
}: {
  p: DevProfile
  card: Omit<CardData, 'quote'>
  cardStyle: CardStyle
  actions?: ProfileActions
  tab?: Tab
  onTabChange?: (t: Tab) => void
  cardSlot?: ReactNode
}) {
  const [ownTab, setOwnTab] = useState<Tab>('overview')
  const tab = tabProp ?? ownTab
  const setTab = (t: Tab) => (onTabChange ? onTabChange(t) : setOwnTab(t))
  const [copied, setCopied] = useState(false)
  async function share() {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title: `${p.name} on Forke`, url })
        return
      } catch {
        // cancelled, or not allowed here: fall back to copying the link
      }
    }
    await navigator.clipboard?.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }
  const reviews = p.work.filter((w) => w.rating !== null)
  const unlocked = p.achievements.filter((a) => a.have >= a.need).length
  const active = p.heatmap.filter((d) => d.count > 0).length
  const gh = githubHandle(p.githubUrl)
  const first = p.name.split(/\s+/)[0]
  const joined = new Date(p.joinedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

  const tabs: { key: Tab; label: string; count: number | null }[] = [
    { key: 'overview', label: 'Overview', count: null },
    { key: 'shipped', label: 'Shipped', count: p.shipped },
    { key: 'reviews', label: 'Reviews', count: reviews.length },
    { key: 'achievements', label: 'Achievements', count: unlocked },
  ]

  return (
    <div className="@container">
    <div className="grid gap-8 px-1 py-2 @min-[960px]:grid-cols-[300px_minmax(0,1fr)] @min-[960px]:gap-12">
      {/* sidebar */}
      <aside className={cn("min-w-0 @min-[960px]:sticky @min-[960px]:self-start", actions ? "@min-[960px]:top-20" : "@min-[960px]:top-0")}>
        <div className="relative" data-tour="card">
          {cardSlot ?? <CardLive data={card} style={cardStyle} height={400} />}
          <p className="text-center font-mono text-[11px] text-white/30">drag it · tap to flip</p>
        </div>
        <div className="text-center @min-[960px]:text-left" data-tour="identity">
          <h1 className="mt-4 text-[32px] font-medium leading-tight tracking-[-0.03em] text-white @min-[960px]:text-[30px]">{p.name}</h1>
          <p className={`${mono} text-[14px] text-white/45`}>
            @{p.username} · Level {p.level} {p.levelTitle}
          </p>
          {p.headline && <p className="mx-auto mt-3 max-w-[340px] text-[15px] leading-6 text-white/70 @min-[960px]:mx-0">{p.headline}</p>}
        </div>

        <div className="mt-5 flex flex-wrap justify-center gap-2.5 @min-[960px]:justify-start">
          {actions ? (
            <>
              <a href={actions.primaryHref} className="inline-flex h-10 items-center gap-2 rounded-full border border-accent bg-accent px-4 text-[14px] font-medium text-[#1a0a00] transition-colors hover:bg-accent-hover">
                {actions.own ? <Pencil className="h-4 w-4" /> : <Send className="h-4 w-4" />} {actions.primaryLabel}
              </a>
              <button type="button" onClick={share} className="inline-flex h-10 items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 text-[14px] text-white/85 transition-colors hover:bg-white/[0.08] hover:text-white">
                {copied ? <Check className="h-4 w-4 text-accent" /> : <Share2 className="h-4 w-4" />} {copied ? 'Link copied' : 'Share'}
              </button>
            </>
          ) : (
            <>
              <span className="inline-flex h-10 items-center gap-2 rounded-full border border-accent bg-accent px-4 text-[14px] font-medium text-[#1a0a00]">
                <Send className="h-4 w-4" /> Invite to a task
              </span>
              <span className="inline-flex h-10 items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 text-[14px] text-white/85">
                <Share2 className="h-4 w-4" /> Share
              </span>
            </>
          )}
          {p.githubUrl && (
            <a href={p.githubUrl} target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-white/75 hover:text-white">
              <GithubIcon className="h-[18px] w-[18px]" />
            </a>
          )}
          {p.linkedinUrl && (
            <a href={p.linkedinUrl} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-white/75 hover:text-white">
              <LinkedinIcon className="h-[16px] w-[16px]" />
            </a>
          )}
        </div>

        <div className="mt-5 grid grid-cols-3 rounded-2xl border border-white/[0.08] @min-[960px]:hidden">
          {[
            ['Shipped', String(p.shipped)],
            ['Rating', p.avgRating ? p.avgRating.toFixed(1) : '–'],
            ['Streak', `${p.currentStreak}d`],
          ].map(([k, v], i) => (
            <div key={k} className={cn('py-3.5 text-center', i > 0 && 'border-l border-white/[0.08]')}>
              <p className="text-[22px] font-medium leading-none tracking-[-0.03em] text-white">{v}</p>
              <p className={`${mono} mt-1.5 text-[10.5px] uppercase tracking-[0.12em] text-white/35`}>{k}</p>
            </div>
          ))}
        </div>

        <ul className={`${mono} mt-5 flex flex-wrap justify-center gap-x-5 gap-y-2 text-[12.5px] text-white/50 @min-[960px]:mt-6 @min-[960px]:block @min-[960px]:space-y-2`}>
          {p.location && (
            <li className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5" /> {p.location}
            </li>
          )}
          {p.college && (
            <li className="flex items-center gap-2">
              <GraduationCap className="h-3.5 w-3.5" /> {p.college}
            </li>
          )}
          <li className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5" /> Joined {joined}
          </li>
          {gh && (
            <li className="flex items-center gap-2">
              <GithubIcon className="h-3.5 w-3.5" /> {gh}
            </li>
          )}
          {p.websiteUrl && (
            <li className="flex items-center gap-2">
              <Globe className="h-3.5 w-3.5" /> <span className="truncate">{p.websiteUrl.replace(/^https?:\/\//, '')}</span>
            </li>
          )}
        </ul>
        {p.stack.length > 0 && (
          <div className={cn('mt-6 hidden border-t pt-5 @min-[960px]:block', line)}>
            <p className="text-[13px] text-white/40">Stack</p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {p.stack.map((s) => (
                <Tag key={s}>{s}</Tag>
              ))}
            </div>
          </div>
        )}
      </aside>

      {/* main */}
      <div className="min-w-0">
        <nav data-tour="tabs" className={cn('flex gap-6 overflow-x-auto border-b text-[14px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden', line)}>
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              aria-current={tab === t.key ? 'page' : undefined}
              className={cn('-mb-px flex items-center gap-2 whitespace-nowrap border-b-2 pb-3 transition-colors', tab === t.key ? 'border-accent text-white' : 'border-transparent text-white/45 hover:text-white/80')}
            >
              {t.label}
              {t.count !== null && <span className={`${mono} rounded-full bg-white/[0.06] px-1.5 text-[11px] text-white/60`}>{t.count}</span>}
            </button>
          ))}
        </nav>

        {tab === 'overview' && (
          <>
            <div data-tour="readme" className="mt-6 overflow-hidden rounded-2xl border border-white/[0.08]">
              <div className={`${mono} flex items-center justify-between gap-3 border-b border-white/[0.08] bg-white/[0.02] px-4 py-3 text-[12px] text-white/50 @min-[600px]:px-5 @min-[600px]:text-[12.5px]`}>
                <span className="truncate">{p.username} / README.md</span>
                <span className="flex shrink-0 items-center gap-1.5 text-accent-text">
                  <BadgeCheck className="h-3.5 w-3.5" /> verified
                </span>
              </div>
              <div className="space-y-4 px-4 py-5 text-[15px] leading-7 text-white/65 @min-[600px]:px-6 @min-[600px]:py-6 @min-[600px]:text-[15.5px]">
                <p className="text-[22px] font-medium tracking-[-0.02em] text-white">Hi, I&rsquo;m {first}.</p>
                {p.bio ? <p className="whitespace-pre-line">{p.bio}</p> : <p className="text-white/35">No bio yet. Add a few lines about what you build.</p>}
                {p.stack.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 @min-[960px]:hidden">
                    {p.stack.map((s) => (
                      <Tag key={s}>{s}</Tag>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <p className="mt-10 text-[15px] text-white/70">Pinned work</p>
            {p.work.length === 0 ? (
              <div className="mt-3">
                <Empty>Your first merged task shows up here.</Empty>
              </div>
            ) : (
              <div data-tour="pinned" className="mt-3 grid gap-3 @min-[600px]:grid-cols-2">
                {p.work.slice(0, 4).map((w) => (
                  <div key={w.id} className="flex flex-col rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
                    <p className={`${mono} flex items-center gap-1.5 truncate text-[12.5px] text-accent-text`}>
                      <Pin className="h-3.5 w-3.5 shrink-0" /> {w.repo ?? w.company ?? 'Forke task'}
                    </p>
                    <p className="mt-2 text-[15px] leading-snug text-white/85">{w.title}</p>
                    <div className="mt-auto flex items-center gap-4 pt-4 text-[12.5px] text-white/50">
                      {w.tags[0] && (
                        <span className="flex items-center gap-1.5">
                          <span className="h-2.5 w-2.5 rounded-full bg-[#FF7A00]" /> {w.tags[0]}
                        </span>
                      )}
                      {w.rating !== null && <Stars n={w.rating} />}
                      <span className={`${mono} ml-auto text-accent-text`}>+{w.xp} XP</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-10" data-tour="heatmap">
              <p className="text-[15px] text-white/70">
                {active} active {active === 1 ? 'day' : 'days'} in the last year
              </p>
              <div className="mt-3 rounded-2xl border border-white/[0.08] p-4 @min-[600px]:p-5">
                <div className="overflow-x-auto [direction:rtl] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <div className="min-w-[640px] [direction:ltr]">
                    <Heatmap days={p.heatmap} />
                  </div>
                </div>
              </div>
            </div>

            {p.work.length > 0 && (
              <div className="mt-10">
                <p className="text-[15px] text-white/70">Merge log</p>
                <ol className={cn('relative mt-4 space-y-6 border-l pl-6', line)}>
                  {p.work.slice(0, 8).map((w) => (
                    <li key={w.id} className="relative">
                      <span className="absolute -left-[31px] top-1 h-[13px] w-[13px] rounded-full border-2 border-[#151414] bg-accent" />
                      <p className={`${mono} text-[12px] text-white/35`}>
                        {fmtDate(w.date)} · merged {w.repo ? `${w.repo}${w.pr ? `#${w.pr}` : ''}` : (w.company ?? 'on Forke')}
                      </p>
                      <p className="mt-1 text-[15.5px] text-white/85">{w.title}</p>
                      <p className="mt-1 flex flex-wrap items-center gap-3 text-[13px]">
                        <span className={`${mono} text-accent-text`}>+{w.xp} XP</span>
                        {w.rating !== null && <Stars n={w.rating} />}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </>
        )}
        {tab === 'shipped' && <ShippedTab work={p.work} total={p.shipped} />}
        {tab === 'reviews' && <ReviewsTab work={reviews} />}
        {tab === 'achievements' && <AchievementsTab list={p.achievements} />}
      </div>
    </div>
    </div>
  )
}

function ShippedTab({ work, total }: { work: ShippedWork[]; total: number }) {
  const [q, setQ] = useState('')
  const [tag, setTag] = useState('All')
  const [sort, setSort] = useState<'recent' | 'xp' | 'rating'>('recent')
  const tags = ['All', ...Array.from(new Set(work.flatMap((w) => w.tags)))]
  const list = work
    .filter((w) => (tag === 'All' || w.tags.includes(tag)) && `${w.title} ${w.repo ?? ''} ${w.company ?? ''}`.toLowerCase().includes(q.toLowerCase()))
    .sort((x, y) => (sort === 'xp' ? y.xp - x.xp : sort === 'rating' ? (y.rating ?? 0) - (x.rating ?? 0) : 0))
  if (!work.length)
    return (
      <div className="mt-6">
        <Empty>Nothing shipped yet. Merged tasks land here.</Empty>
      </div>
    )
  return (
    <div className="mt-6" data-tour="shipped">
      <div className="flex flex-col gap-3 @min-[600px]:flex-row @min-[600px]:items-center">
        <label className="flex h-10 flex-1 items-center gap-2 rounded-full border border-white/12 bg-white/[0.03] px-4 text-[14px] text-white/80 focus-within:border-white/30">
          <Search className="h-4 w-4 text-white/40" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search shipped work" className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-white/35" />
        </label>
        <div className="flex gap-1.5">
          {(['recent', 'xp', 'rating'] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setSort(k)}
              className={cn('inline-flex h-10 items-center rounded-full border px-3.5 text-[13px] transition-colors', sort === k ? 'border-accent bg-accent/15 text-white' : 'border-white/12 text-white/55 hover:text-white')}
            >
              {k === 'xp' ? 'Most XP' : k === 'rating' ? 'Top rated' : 'Recent'}
            </button>
          ))}
        </div>
      </div>
      {tags.length > 2 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTag(t)}
              className={cn('shrink-0 rounded-full border px-3 py-1 text-[12.5px] transition-colors', tag === t ? 'border-white/40 bg-white/10 text-white' : 'border-white/10 text-white/50 hover:text-white')}
            >
              {t}
            </button>
          ))}
        </div>
      )}
      <div className="mt-4">
        {list.length === 0 ? (
          <p className="py-16 text-center text-[14px] text-white/40">Nothing matches that yet.</p>
        ) : (
          list.map((w) => (
            <div key={w.id} className={cn('grid gap-3 border-b border-dashed py-5 @min-[600px]:grid-cols-[auto_minmax(0,1fr)_auto] @min-[600px]:items-center @min-[600px]:gap-4', line)}>
              <span className="hidden h-9 w-9 items-center justify-center rounded-full border border-accent/30 bg-accent/10 text-accent @min-[600px]:flex">
                <GitMerge className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className={`${mono} text-[12px] text-white/40`}>
                  {w.repo ?? w.company ?? 'Forke task'} {w.pr && <span className="text-white/25">#{w.pr}</span>} · merged {fmtDate(w.date)}
                </p>
                <p className="mt-1 text-[16px] font-medium tracking-[-0.01em] text-white/90">{w.title}</p>
                {w.tags.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    {w.tags.map((t) => (
                      <Tag key={t}>{t}</Tag>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4 @min-[600px]:flex-col @min-[600px]:items-end @min-[600px]:gap-1.5">
                <span className={`${mono} text-[15px] text-accent-text`}>+{w.xp} XP</span>
                {w.rating !== null && <Stars n={w.rating} />}
              </div>
            </div>
          ))
        )}
      </div>
      <p className={`${mono} mt-4 text-center text-[12px] text-white/30`}>
        Showing {list.length} of {total}
      </p>
    </div>
  )
}

function ReviewsTab({ work }: { work: ShippedWork[] }) {
  const [min, setMin] = useState(0)
  if (!work.length)
    return (
      <div className="mt-6">
        <Empty>No ratings yet. Repo owners rate every merged task.</Empty>
      </div>
    )
  const avg = work.reduce((a, r) => a + (r.rating ?? 0), 0) / work.length
  const bands = [5, 4, 3, 2, 1].map((s) => ({ s, n: work.filter((r) => Math.round(r.rating ?? 0) === s).length }))
  const list = work.filter((r) => (r.rating ?? 0) >= min)
  return (
    <div className="mt-6">
      <div data-tour="reviews" className="grid gap-6 rounded-2xl border border-white/[0.08] p-5 @min-[600px]:grid-cols-[180px_minmax(0,1fr)] @min-[600px]:p-6">
        <div>
          <p className="text-[48px] font-medium leading-none tracking-[-0.04em] text-white">{avg.toFixed(1)}</p>
          <p className="mt-2 flex gap-0.5">
            {Array.from({ length: 5 }, (_, i) => (
              <Star key={i} className={cn('h-4 w-4', i < Math.round(avg) ? 'fill-[#FFA347] text-[#FFA347]' : 'text-white/20')} />
            ))}
          </p>
          <p className="mt-2 text-[13px] text-white/45">
            {work.length} {work.length === 1 ? 'rating' : 'ratings'} from repo owners
          </p>
        </div>
        <div className="space-y-1.5">
          {bands.map((b) => (
            <button key={b.s} type="button" onClick={() => setMin(min === b.s ? 0 : b.s)} className="flex w-full items-center gap-3 text-left text-[12.5px] text-white/55 hover:text-white">
              <span className={`${mono} w-8`}>{b.s}★</span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                <span className="block h-full rounded-full bg-accent" style={{ width: `${(b.n / work.length) * 100}%` }} />
              </span>
              <span className={`${mono} w-6 text-right`}>{b.n}</span>
            </button>
          ))}
          {min > 0 && <p className="pt-1 text-[12px] text-accent-text">Showing {min}★ and up · tap again to clear</p>}
        </div>
      </div>
      <div className="mt-6 grid gap-3 @min-[600px]:grid-cols-2">
        {list.map((r) => (
          <figure key={r.id} className="flex flex-col rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
            <div className="flex items-center justify-between">
              <Stars n={r.rating ?? 0} />
              {r.tags[0] && <span className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[11.5px] text-white/50">{r.tags[0]}</span>}
            </div>
            <p className="mt-3 text-[15px] leading-6 text-white/80">{r.title}</p>
            <figcaption className="mt-auto pt-4 text-[12.5px] text-white/40">
              {r.company && <span className="text-white/70">{r.company}</span>}
              {r.company && ' · '}
              {fmtDate(r.date)}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  )
}

function AchievementsTab({ list }: { list: DevProfile['achievements'] }) {
  const groups = Array.from(new Set(list.map((a) => a.group)))
  const done = list.filter((a) => a.have >= a.need).length
  return (
    <div className="mt-6" data-tour="achievements">
      <div className="flex items-end justify-between gap-4">
        <p className="text-[15px] text-white/70">
          <span className="text-[28px] font-medium tracking-[-0.03em] text-white">{done}</span> of {list.length} unlocked
        </p>
        <div className="h-1.5 w-40 overflow-hidden rounded-full bg-white/[0.06]">
          <div className="h-full rounded-full bg-accent" style={{ width: `${(done / list.length) * 100}%` }} />
        </div>
      </div>
      {groups.map((g) => (
        <div key={g} className="mt-8">
          <p className={`${mono} text-[12px] uppercase tracking-[0.14em] text-white/35`}>{g}</p>
          <div className="mt-3 grid gap-3 @min-[600px]:grid-cols-2 @min-[1100px]:grid-cols-3">
            {list
              .filter((a) => a.group === g)
              .map((a) => {
                const ok = a.have >= a.need
                return (
                  <div key={a.label} className={cn('rounded-2xl border p-4', ok ? 'border-white/[0.08] bg-white/[0.03]' : 'border-dashed border-white/12')}>
                    <div className="flex items-center gap-3">
                      <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', ok ? 'bg-accent/15 text-accent' : 'bg-white/5 text-white/35')}>
                        {ok ? <Trophy className="h-[18px] w-[18px]" /> : <Lock className="h-[18px] w-[18px]" />}
                      </span>
                      <div className="min-w-0">
                        <p className={cn('text-[14.5px]', ok ? 'text-white/90' : 'text-white/60')}>{a.label}</p>
                        <p className="truncate text-[12.5px] text-white/40">{a.desc}</p>
                      </div>
                    </div>
                    <div className="mt-3.5 flex items-center gap-3">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                        <div className={cn('h-full rounded-full', ok ? 'bg-accent' : 'bg-white/30')} style={{ width: `${Math.min(100, (a.have / a.need) * 100)}%` }} />
                      </div>
                      <span className={`${mono} text-[11.5px] text-white/40`}>{ok ? 'Unlocked' : `${a.have}/${a.need}`}</span>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      ))}
    </div>
  )
}
