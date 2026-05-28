import { auth } from '@/auth'
import Image from 'next/image'
import Link from 'next/link'
import { Bell, Wallet, Zap } from 'lucide-react'
import MobileMenuTrigger from '../dashboard/MobileMenuTrigger'
import { db } from '@/lib/db'
import { tasks } from '@/lib/db/schema'
import { eq, and, ne, sql } from 'drizzle-orm'

interface TopBarProps {
  title: string
}

function formatRelativeTime(value: Date | null | undefined) {
  if (!value) return 'just now'
  const now = Date.now()
  const diffMs = now - new Date(value).getTime()
  const minute = 60_000
  const hour = 60 * minute
  const day = 24 * hour

  if (diffMs < hour) return `${Math.max(1, Math.floor(diffMs / minute))}m ago`
  if (diffMs < day) return `${Math.floor(diffMs / hour)}h ago`
  return `${Math.floor(diffMs / day)}d ago`
}

export default async function TopBar({ title }: TopBarProps) {
  const session = await auth()
  const user = session?.user as { id: string; name: string; role: 'developer' | 'owner'; image?: string } | undefined

  if (!user) return null

  const initials = user.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
    : '?'

  const isOwner = user.role === 'owner'

  // Fetch real-time metrics for TopBar
  let activeCount = 0
  let financialMetric = 0
  let actionRequiredCount = 0
  let liveNotifications: Array<{
    id: string
    title: string
    status: string
    createdAt: Date | null
    href: string
  }> = []

  try {
    if (isOwner) {
      // Owners: Get active tasks count and total active budget (escrowed)
      const stats = await db
        .select({
          count: sql<number>`count(*)::int`,
          totalBudget: sql<number>`sum(${tasks.budget})::int`,
        })
        .from(tasks)
        .where(and(
          eq(tasks.clientId, user.id),
          ne(tasks.status, 'approved')
        ))
        .then(rows => rows[0] || { count: 0, totalBudget: 0 })

      activeCount = stats.count || 0
      financialMetric = stats.totalBudget ? Math.floor(stats.totalBudget / 100) : 0

      // Owners: Pending reviews count
      actionRequiredCount = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(tasks)
        .where(and(
          eq(tasks.clientId, user.id),
          eq(tasks.status, 'submitted')
        ))
        .then(rows => rows[0]?.count || 0)

      liveNotifications = await db
        .select({
          id: tasks.id,
          title: tasks.title,
          status: tasks.status,
          createdAt: tasks.createdAt,
          href: sql<string>`('/submissions')`,
        })
        .from(tasks)
        .where(and(
          eq(tasks.clientId, user.id),
          ne(tasks.status, 'open')
        ))
        .orderBy(sql`${tasks.createdAt} desc`)
        .limit(6)

    } else {
      // Developers: Get claimed active tasks and potential earnings
      const stats = await db
        .select({
          count: sql<number>`count(*)::int`,
          potentialEarnings: sql<number>`sum(${tasks.budget})::int`,
        })
        .from(tasks)
        .where(and(
          eq(tasks.claimantId, user.id),
          ne(tasks.status, 'approved')
        ))
        .then(rows => rows[0] || { count: 0, potentialEarnings: 0 })

      activeCount = stats.count || 0
      financialMetric = stats.potentialEarnings ? Math.floor(stats.potentialEarnings / 100) : 0

      // Developers: Pending approval count
      actionRequiredCount = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(tasks)
        .where(and(
          eq(tasks.claimantId, user.id),
          eq(tasks.status, 'submitted')
        ))
        .then(rows => rows[0]?.count || 0)

      liveNotifications = await db
        .select({
          id: tasks.id,
          title: tasks.title,
          status: tasks.status,
          createdAt: tasks.createdAt,
          href: sql<string>`('/tasks/' || ${tasks.id}::text)`,
        })
        .from(tasks)
        .where(and(
          eq(tasks.claimantId, user.id),
          ne(tasks.status, 'open')
        ))
        .orderBy(sql`${tasks.createdAt} desc`)
        .limit(6)
    }
  } catch (e) {
    console.error('Failed to query TopBar live statistics:', e)
  }

  return (
    <header className="h-20 border-b border-white/[0.04] bg-[#070709]/85 backdrop-blur-md px-6 md:px-8 flex items-center justify-between sticky top-0 z-30 select-none">
      
      {/* Left Title & Mobile Menu */}
      <div className="flex items-center gap-4">
        <MobileMenuTrigger />
        <div className="text-left">
          <h1 className="font-serif text-lg md:text-xl text-white tracking-wide leading-none">{title}</h1>
          <p className="text-[9px] text-white/35 font-semibold uppercase tracking-[0.16em] mt-1.5">
            {isOwner ? 'Console Node: Owner' : 'Console Node: Developer'}
          </p>
        </div>
      </div>
      
      {/* Right Stats & Profile */}
      <div className="flex items-center gap-4 md:gap-6">
        
        {/* Live Stats Box (Financials & Missions) */}
        <div className="hidden sm:flex items-center gap-3 py-1.5 px-3 rounded-2xl bg-white/[0.01] border border-white/[0.04] shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
          
          {/* Escrow/Earnings metric */}
          <div className="flex items-center gap-2 px-2.5 py-1 border-r border-white/[0.05]">
            <Wallet className="w-3.5 h-3.5 text-accent" />
            <div className="text-left leading-none">
              <span className="text-[8px] font-semibold uppercase text-white/40 tracking-[0.12em] block">
                {isOwner ? 'Escrow Capital' : 'Claimed Value'}
              </span>
              <span className="text-sm font-semibold text-white mt-1 block">
                ₹{financialMetric.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Active Missions */}
          <div className="flex items-center gap-2 px-2.5 py-1">
            <Zap className="w-3.5 h-3.5 text-accent" />
            <div className="text-left leading-none">
              <span className="text-[8px] font-semibold uppercase text-white/40 tracking-[0.12em] block">
                Missions
              </span>
              <span className="text-sm font-semibold text-white mt-1 block">
                {activeCount} Active
              </span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-6 w-[1px] bg-white/[0.04]" />

        {/* Notification Bell */}
        <details className="relative group">
          <summary className="list-none text-white/45 hover:text-white transition-colors relative p-2 rounded-xl bg-white/[0.01] border border-white/[0.04] cursor-pointer">
            <Bell className="w-4 h-4" />
            {actionRequiredCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full animate-ping" />
            )}
            {actionRequiredCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full" />
            )}
          </summary>
          <div className="absolute right-0 mt-2 w-[320px] rounded-2xl border border-white/[0.06] bg-[#0b0b0e] shadow-2xl p-3 z-40">
            <div className="flex items-center justify-between px-2 py-1 border-b border-white/[0.05] mb-2">
              <p className="text-[10px] uppercase tracking-[0.14em] text-white/55 font-semibold">Notifications</p>
              <p className="text-[10px] text-accent font-semibold">{actionRequiredCount} pending</p>
            </div>
            <div className="max-h-72 overflow-auto space-y-1">
              {liveNotifications.length === 0 ? (
                <p className="text-xs text-white/45 px-2 py-3">No recent task updates.</p>
              ) : (
                liveNotifications.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="block rounded-xl px-2.5 py-2 hover:bg-white/[0.03] transition-colors"
                  >
                    <p className="text-xs text-white truncate">{item.title}</p>
                    <p className="text-[10px] text-white/45 mt-0.5 capitalize">
                      {item.status} · {formatRelativeTime(item.createdAt)}
                    </p>
                  </Link>
                ))
              )}
            </div>
          </div>
        </details>
        
        {/* User Avatar */}
        <div className="relative w-10 h-10 rounded-full overflow-hidden border border-white/[0.06] bg-accent/10 flex items-center justify-center shadow-inner shrink-0">
          {user.image ? (
            <Image 
              src={user.image} 
              alt={user.name || 'User'} 
              fill 
              className="object-cover select-none pointer-events-none"
              draggable={false}
            />
          ) : (
            <span className="text-accent font-semibold text-sm uppercase">{initials}</span>
          )}
        </div>
      </div>
    </header>
  )
}
