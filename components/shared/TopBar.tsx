import { auth } from '@/auth'
import Image from 'next/image'
import Link from 'next/link'
import { Bell, Wallet, Plus, Zap, ShieldCheck } from 'lucide-react'
import MobileMenuTrigger from '../dashboard/MobileMenuTrigger'
import { db } from '@/lib/db'
import { tasks } from '@/lib/db/schema'
import { eq, and, ne, sql } from 'drizzle-orm'

interface TopBarProps {
  title: string
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
          <p className="text-[8px] text-white/20 font-black uppercase tracking-[0.2em] mt-1.5 font-mono">
            {isOwner ? 'Console Node: Owner' : 'Console Node: Developer'}
          </p>
        </div>
      </div>
      
      {/* Right Stats & Profile */}
      <div className="flex items-center gap-4 md:gap-6">
        
        {/* Live Stats Box (Financials & Missions) */}
        <div className="hidden sm:flex items-center gap-4 py-1.5 px-3 rounded-2xl bg-white/[0.01] border border-white/[0.03]">
          
          {/* Escrow/Earnings metric */}
          <div className="flex items-center gap-2 px-2.5 py-1 border-r border-white/[0.04]">
            <Wallet className="w-3.5 h-3.5 text-accent" />
            <div className="text-left leading-none">
              <span className="text-[7.5px] font-black uppercase text-white/30 tracking-widest font-mono block">
                {isOwner ? 'Escrow Capital' : 'Claimed Value'}
              </span>
              <span className="text-xs font-mono font-bold text-white mt-1 block">
                ₹{financialMetric.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Active Missions */}
          <div className="flex items-center gap-2 px-2.5 py-1">
            <Zap className="w-3.5 h-3.5 text-accent" />
            <div className="text-left leading-none">
              <span className="text-[7.5px] font-black uppercase text-white/30 tracking-widest font-mono block">
                Missions
              </span>
              <span className="text-xs font-mono font-bold text-white mt-1 block">
                {activeCount} Active
              </span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        {isOwner ? (
          <Link 
            href="/post-task"
            className="h-10 px-4 text-[9px] font-black uppercase tracking-widest rounded-xl bg-gradient-to-b from-accent to-[#d97706] hover:translate-y-[1px] hover:shadow-[0_0_15px_rgba(255,122,0,0.2)] transition-all text-[#050505] flex items-center gap-1.5 font-bold cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3px]" />
            <span className="hidden md:inline">Launch Mission</span>
          </Link>
        ) : (
          <Link 
            href="/tasks"
            className="h-10 px-4 text-[9px] font-black uppercase tracking-widest rounded-xl bg-white/[0.02] border border-white/5 hover:border-accent/40 text-white transition-all flex items-center gap-1.5 font-bold cursor-pointer shrink-0"
          >
            <Zap className="w-3.5 h-3.5 text-accent fill-accent" />
            <span className="hidden md:inline">Find Missions</span>
          </Link>
        )}

        {/* Divider */}
        <div className="h-6 w-[1px] bg-white/[0.04]" />

        {/* Notification Bell */}
        <button className="text-white/40 hover:text-white transition-colors relative p-2 rounded-xl bg-white/[0.01] border border-white/[0.03] cursor-pointer group">
          <Bell className="w-4 h-4" />
          {actionRequiredCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full animate-ping" />
          )}
          {actionRequiredCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full" />
          )}
        </button>
        
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
            <span className="text-accent font-bold text-sm uppercase">{initials}</span>
          )}
        </div>
      </div>
    </header>
  )
}
