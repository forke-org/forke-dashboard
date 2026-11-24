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
import { auth } from '@/auth'
import { Plus, Search } from 'lucide-react'
import NotificationBell from './NotificationBell'
import { getUnreadCount } from '@/app/(app)/notifications/actions'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface TopBarProps {
  title: string
  breadcrumbs?: BreadcrumbItem[]
}

export default async function TopBar({ title, breadcrumbs }: TopBarProps) {
  const session = await auth()
  const user = session?.user as { id: string; name: string; role: 'developer' | 'owner'; image?: string } | undefined

  if (!user) return null

  let unreadNotificationsCount = 0

  try {
    const notifRes = await getUnreadCount(user.id)
    unreadNotificationsCount = notifRes.count
  } catch (e) {
    console.error('Failed to query notifications count:', e)
  }

  const cta =
    user.role === 'owner'
      ? { href: '/post-task', label: 'Post a task' }
      : { href: '/tasks', label: 'Find a task' }

  return (
    <header className="sticky top-0 z-30 shrink-0 border-b border-[var(--color-border)] bg-[#151414]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-14 w-full max-w-[1280px] items-center gap-3 pl-16 pr-4 md:px-8">
        {/* breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 font-mono text-[12px]">
          <Link href="/dashboard" className="shrink-0 text-white/40 transition-colors hover:text-white">
            dashboard
          </Link>
          <span className="shrink-0 text-white/20">/</span>
          {breadcrumbs?.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {crumb.href ? (
                <Link href={crumb.href} className="shrink-0 lowercase text-white/40 transition-colors hover:text-white">
                  {crumb.label}
                </Link>
              ) : (
                <span className="shrink-0 lowercase text-white/40">{crumb.label}</span>
              )}
              <span className="shrink-0 text-white/20">/</span>
            </React.Fragment>
          ))}
          <span className="truncate lowercase text-white/80">{title}</span>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <NotificationBell userId={user.id} initialUnreadCount={unreadNotificationsCount} />
          <Link
            href={cta.href}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-accent bg-accent px-3.5 text-[13px] font-medium text-[#1a0a00] shadow-[0_1px_0_rgba(255,255,255,0.25)_inset,0_8px_24px_-8px_rgba(255,122,0,0.55)] transition-colors hover:bg-accent-hover"
          >
            {user.role === 'owner' ? <Plus className="h-4 w-4" /> : <Search className="h-4 w-4" />}
            <span className="hidden sm:inline">{cta.label}</span>
          </Link>
        </div>
      </div>
    </header>
  )
}
