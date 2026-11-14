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

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ArrowUpRight,
  BadgeCheck,
  BarChart3,
  Building2,
  ClipboardList,
  FileCheck,
  Flame,
  Headphones,
  LayoutDashboard,
  LogOut,
  Mail,
  Settings,
  ShieldCheck,
  User,
  Users,
  Wallet,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useDashboard } from '@/components/dashboard/DashboardContext'
import { getLevelProgress, getLevelTitle } from '@/lib/utils/xp'

interface SidebarProps {
  user: {
    name?: string | null
    email?: string | null
    username?: string | null
    image?: string | null
    level?: number
    xp?: number
    currentStreak?: number
    role?: 'developer' | 'owner'
    companyName?: string
  }
  pendingSubmissionsCount?: number
  unreadMessagesCount?: number
}

const OWNER_LEVEL_TITLES: Record<number, string> = {
  1: 'Initiator',
  2: 'Vanguard',
  3: 'Patron',
  4: 'Pioneer',
  5: 'Director',
  6: 'Strategist',
  7: 'Founder',
  8: 'Venture Partner',
  9: 'Titan',
  10: 'Syndicate',
  11: 'Sovereign',
}

type NavItem = { label: string; href: string; icon: React.ComponentType<{ className?: string }>; badge?: number }

export default function Sidebar({ user, pendingSubmissionsCount = 0, unreadMessagesCount = 0 }: SidebarProps) {
  const pathname = usePathname()
  const { isMobileOpen, setIsMobileOpen } = useDashboard()
  const isCollapsed = false // the collapse toggle was removed; the sidebar always shows labels

  const isOwner = user.role === 'owner'
  const levelTitle = isOwner ? (OWNER_LEVEL_TITLES[user.level || 1] ?? 'Owner') : getLevelTitle(user.level || 1)
  const progress = Math.round(getLevelProgress(user.xp ?? 0))

  const groups: { title: string; items: NavItem[] }[] = isOwner
    ? [
        {
          title: 'Work',
          items: [
            { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
            { label: 'Tasks', href: '/tasks', icon: ClipboardList },
            { label: 'Submissions', href: '/submissions', icon: FileCheck, badge: pendingSubmissionsCount },
            { label: 'Developers', href: '/developers', icon: Users },
            { label: 'Messages', href: '/messages', icon: Mail, badge: unreadMessagesCount },
          ],
        },
        {
          title: 'Company',
          items: [
            { label: 'Escrow', href: '/escrow', icon: ShieldCheck },
            { label: 'Analytics', href: '/analytics', icon: BarChart3 },
            { label: 'Company profile', href: '/profile', icon: Building2 },
            { label: 'Settings', href: '/settings', icon: Settings },
          ],
        },
      ]
    : [
        {
          title: 'Work',
          items: [
            { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
            { label: 'Tasks', href: '/tasks', icon: ClipboardList },
            { label: 'Submissions', href: '/submissions', icon: FileCheck },
            { label: 'Messages', href: '/messages', icon: Mail, badge: unreadMessagesCount },
          ],
        },
        {
          title: 'You',
          items: [
            { label: 'Profile', href: '/profile', icon: User },
            { label: 'Earnings', href: '/earnings', icon: Wallet },
            { label: 'Settings', href: '/settings', icon: Settings },
          ],
        },
      ]

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname === href || pathname.startsWith(`${href}/`) || (href === '/tasks' && pathname === '/post-task')

  return (
    <>
      {/* phone backdrop */}
      {isMobileOpen && <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden" onClick={() => setIsMobileOpen(false)} />}

      <aside
        className={cn(
          'fixed left-0 top-0 z-50 flex h-screen select-none flex-col border-r border-[var(--color-border)] bg-[#121111] transition-all duration-300 md:sticky',
          isCollapsed ? 'w-[72px]' : 'w-[248px]',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        )}
      >
        {/* brand */}
        <div className="flex h-14 shrink-0 items-center justify-between px-5">
          <Link href="/dashboard" className="whitespace-nowrap text-[19px] font-semibold tracking-[-0.04em] text-white">
            {isCollapsed ? 'f' : 'forke'}
            <span className="text-accent">*</span>
          </Link>
          {!isCollapsed && (
            <span className="hidden rounded-full border border-[var(--color-border)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-white/40 md:inline">
              {isOwner ? 'Owner' : 'Dev'}
            </span>
          )}
          <button className="p-1.5 text-white/50 hover:text-white md:hidden" aria-label="Close menu" onClick={() => setIsMobileOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* who */}
        <div className={cn('px-4', isCollapsed && 'px-3')}>
          <div className={cn('rounded-xl border border-[var(--color-border)] bg-white/[0.02]', isCollapsed ? 'flex justify-center p-2' : 'p-3')}>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-accent/25 bg-accent/10">
                {user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.image} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="font-mono text-xs font-semibold text-accent">{user.name?.[0]?.toUpperCase()}</span>
                )}
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <p className="flex items-center gap-1 truncate text-[13.5px] text-white">
                    <span className="truncate">{isOwner ? user.companyName || user.name : user.name}</span>
                    <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-accent" />
                  </p>
                  <p className="truncate font-mono text-[11px] text-white/40">{user.username ? `@${user.username}` : levelTitle}</p>
                </div>
              )}
            </div>
            {!isCollapsed && (
              <>
                <div className="mt-3 flex justify-between font-mono text-[10.5px] text-white/40">
                  <span>
                    Lvl {user.level ?? 1} · {levelTitle}
                  </span>
                  {!isOwner && <span>{progress}%</span>}
                </div>
                {!isOwner && (
                  <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/[0.08]">
                    <div className="h-full rounded-full bg-[linear-gradient(90deg,#a03a02,#FF7A00,#FFA347)]" style={{ width: `${progress}%` }} />
                  </div>
                )}
                {(user.currentStreak ?? 0) > 1 && (
                  <p className="mt-2.5 flex items-center gap-1 font-mono text-[10.5px] text-accent-text">
                    <Flame className="h-3 w-3" /> {user.currentStreak} day streak
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {/* nav */}
        <nav className="mt-5 flex-1 space-y-6 overflow-y-auto px-4 pb-4">
          {groups.map((g) => (
            <div key={g.title}>
              {!isCollapsed && <p className="px-3 font-mono text-[10.5px] uppercase tracking-[0.14em] text-white/30">{g.title}</p>}
              <ul className={cn('space-y-0.5', !isCollapsed && 'mt-2')}>
                {g.items.map((it) => {
                  const active = isActive(it.href)
                  const Icon = it.icon
                  return (
                    <li key={it.href}>
                      <Link
                        href={it.href}
                        onClick={() => setIsMobileOpen(false)}
                        className={cn(
                          'group relative flex h-9 items-center gap-3 rounded-lg px-3 text-[14px] transition-colors',
                          active ? 'bg-white/[0.06] text-white' : 'text-white/55 hover:bg-white/[0.03] hover:text-white',
                          isCollapsed && 'md:justify-center md:px-0',
                        )}
                      >
                        {active && <span className="absolute -left-4 top-2 h-5 w-[3px] rounded-r bg-accent" />}
                        <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-accent' : 'text-white/40 group-hover:text-white/70')} />
                        <span className={cn(isCollapsed && 'md:hidden')}>{it.label}</span>
                        {it.badge ? (
                          <span className={cn('ml-auto rounded-full bg-accent/15 px-1.5 font-mono text-[11px] text-accent-text', isCollapsed && 'md:absolute md:right-1 md:top-1 md:ml-0')}>{it.badge}</span>
                        ) : null}
                        {isCollapsed && (
                          <span className="pointer-events-none absolute left-14 z-50 hidden whitespace-nowrap rounded-lg border border-white/10 bg-[#1A1919] px-2.5 py-1.5 text-xs text-white opacity-0 shadow-xl transition-opacity group-hover:opacity-100 md:block">
                            {it.label}
                          </span>
                        )}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* footer */}
        <div className="shrink-0 space-y-0.5 border-t border-dashed border-[var(--color-border)] px-4 py-3">
          <Link href="/support" className={cn('flex h-9 items-center gap-3 rounded-lg px-3 text-[13.5px] text-white/45 hover:text-white', isCollapsed && 'md:justify-center md:px-0')}>
            <Headphones className="h-4 w-4" /> <span className={cn(isCollapsed && 'md:hidden')}>Support</span>
          </Link>
          <a href="https://www.forke.space" className={cn('flex h-9 items-center gap-3 rounded-lg px-3 text-[13.5px] text-white/45 hover:text-white', isCollapsed && 'md:justify-center md:px-0')}>
            <ArrowUpRight className="h-4 w-4" /> <span className={cn(isCollapsed && 'md:hidden')}>forke.space</span>
          </a>
          <a
            href="/api/auth/logout"
            onClick={(e) => {
              e.preventDefault()
              window.location.href = '/api/auth/logout'
            }}
            className="flex h-9 items-center gap-3 rounded-lg px-3 text-[13.5px] text-white/45 hover:text-red-300"
          >
            <LogOut className="h-4 w-4" /> <span>Sign out</span>
          </a>
        </div>
      </aside>
    </>
  )
}
