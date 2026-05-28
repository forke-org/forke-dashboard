import { auth } from '@/auth'
import TopBar from '@/components/shared/TopBar'
import { getTasksPendingReview, getTasksByClaimant } from '@/lib/db/queries/tasks'
import ReviewCard from '@/components/tasks/ReviewCard'
import ActiveTaskCard from '@/components/tasks/ActiveTaskCard'
import { 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  LayoutGrid, 
  Zap, 
  Coins, 
  BarChart3, 
  Award, 
  ArrowUpRight,
  Activity,
  Flame,
  ShieldCheck,
  Plus
} from 'lucide-react'
import Link from 'next/link'
import { db } from '@/lib/db'
import { tasks } from '@/lib/db/schema'
import { eq, and, ne, sql } from 'drizzle-orm'

import { getLevelFromXp, getLevelTitle } from '@/lib/utils/xp'

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
  12: 'Sovereign',
  13: 'Sovereign',
  14: 'Sovereign',
  15: 'Sovereign'
}

export default async function DashboardPage() {
  const session = await auth()
  const user = session?.user as { id: string; name: string; role: 'developer' | 'owner'; xp?: number; currentStreak?: number } | undefined
  const firstName = user?.name?.split(' ')[0] || 'there'

  const pendingReviews = user?.role === 'owner' ? await getTasksPendingReview(user.id) : []
  const activeTasks = user?.role === 'developer' ? await getTasksByClaimant(user.id) : []

  // Dynamic live statistics queries (Founder-grade dashboard stats)
  let ownerStats = { activeCount: 0, completedCount: 0, totalEscrow: 0, totalSpent: 0 }
  let devStats = { activeCount: 0, completedCount: 0, totalEscrow: 0, totalEarned: 0 }

  try {
    if (user?.role === 'owner') {
      const statsResult = await db
        .select({
          status: tasks.status,
          count: sql<number>`count(*)::int`,
          sumBudget: sql<number>`sum(${tasks.budget})::int`
        })
        .from(tasks)
        .where(eq(tasks.clientId, user.id))
        .groupBy(tasks.status)

      for (const row of statsResult) {
        if (row.status === 'approved') {
          ownerStats.completedCount += row.count
          ownerStats.totalSpent += row.sumBudget ? Math.floor(row.sumBudget / 100) : 0
        } else {
          ownerStats.activeCount += row.count
          ownerStats.totalEscrow += row.sumBudget ? Math.floor(row.sumBudget / 100) : 0
        }
      }
    } else if (user?.role === 'developer') {
      const statsResult = await db
        .select({
          status: tasks.status,
          count: sql<number>`count(*)::int`,
          sumBudget: sql<number>`sum(${tasks.budget})::int`
        })
        .from(tasks)
        .where(eq(tasks.claimantId, user.id))
        .groupBy(tasks.status)

      for (const row of statsResult) {
        if (row.status === 'approved') {
          devStats.completedCount += row.count
          devStats.totalEarned += row.sumBudget ? Math.floor(row.sumBudget / 100) : 0
        } else {
          devStats.activeCount += row.count
          devStats.totalEscrow += row.sumBudget ? Math.floor(row.sumBudget / 100) : 0
        }
      }
    }
  } catch (e) {
    console.error('Failed to load dashboard dynamic stats:', e)
  }

  const isOwner = user?.role === 'owner'
  const stats = isOwner ? ownerStats : devStats
  const financialTotal = isOwner ? ownerStats.totalSpent : devStats.totalEarned
  const userLevel = getLevelFromXp(user?.xp || 0)
  const userLevelTitle = isOwner 
    ? (OWNER_LEVEL_TITLES[userLevel] || 'Owner') 
    : getLevelTitle(userLevel)

  return (
    <div className="flex flex-col h-full font-sans bg-[#060608] text-white">
      <TopBar title="Dashboard" />
      
      <div className="flex-grow p-6 md:p-8 overflow-y-auto space-y-8 select-none">
        
        {/* Asymmetric Command Hero Section */}
        <div className="w-full rounded-[2.5rem] bg-[#0b0b0e] border border-white/[0.04] p-8 md:p-10 relative overflow-hidden group shadow-[0_24px_50px_rgba(0,0,0,0.6)] animate-in fade-in slide-in-from-bottom-4 duration-1000">
          {/* Subtle design gradients & grid lines */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.005)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.005)_1px,transparent_1px)] bg-[size:40px_40px] opacity-60" />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-accent/[0.03] rounded-full blur-[100px] group-hover:bg-accent/[0.05] transition-all duration-700" />
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            {/* Left Column: Contextual Copy */}
            <div className="lg:col-span-7 text-left space-y-4 md:space-y-6">
              <div className="flex items-center gap-2 bg-accent/[0.03] border border-accent/15 rounded-full px-3 py-1 w-fit">
                <ShieldCheck className="w-3.5 h-3.5 text-accent" />
                <span className="text-[8px] text-accent font-black uppercase tracking-[0.2em] font-mono">
                  {isOwner ? 'Patron Node Active' : 'Builder Session Secure'}
                </span>
              </div>

              <div className="space-y-3">
                <h2 className="font-serif text-3xl md:text-5xl text-white leading-tight tracking-tight">
                  Welcome back, <span className="text-accent italic font-normal">{firstName}</span>
                </h2>
                <p className="text-white/50 text-xs md:text-sm max-w-lg leading-relaxed font-light font-sans">
                  {isOwner 
                    ? "Launch missions, track code submissions, and accelerate execution with our vetted network of elite developers."
                    : "Claim micro-tasks, ship production code, build reputation, and unlock premium reward pools on the developer board."}
                </p>
              </div>

              {/* Action Buttons inside Hero */}
              <div className="flex flex-wrap gap-3.5 pt-2">
                {isOwner ? (
                  <>
                    <Link 
                      href="/post-task"
                      className="px-6 py-3.5 text-[10px] font-black uppercase tracking-widest rounded-xl bg-accent text-[#050505] shadow-[0_4px_15px_rgba(255,122,0,0.25)] hover:translate-y-[1px] hover:shadow-[0_4px_25px_rgba(255,122,0,0.35)] transition-all flex items-center gap-2 font-bold"
                    >
                      <Plus className="w-4 h-4 stroke-[3px]" /> Post a New Mission
                    </Link>
                    <Link 
                      href="/tasks"
                      className="px-6 py-3.5 text-[10px] font-black uppercase tracking-widest rounded-xl border border-white/5 bg-white/[0.02] text-white hover:bg-white/[0.06] hover:border-white/10 transition-all font-bold"
                    >
                      Browse Mission Feed
                    </Link>
                  </>
                ) : (
                  <>
                    <Link 
                      href="/tasks"
                      className="px-6 py-3.5 text-[10px] font-black uppercase tracking-widest rounded-xl bg-accent text-[#050505] shadow-[0_4px_15px_rgba(255,122,0,0.25)] hover:translate-y-[1px] hover:shadow-[0_4px_25px_rgba(255,122,0,0.35)] transition-all flex items-center gap-2 font-bold"
                    >
                      Browse Open Tasks
                    </Link>
                    <Link 
                      href="/earnings"
                      className="px-6 py-3.5 text-[10px] font-black uppercase tracking-widest rounded-xl border border-white/5 bg-white/[0.02] text-white hover:bg-white/[0.06] hover:border-white/10 transition-all font-bold"
                    >
                      View Financial Ledger
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Right Column: Abstract Visualization Graphic */}
            <div className="lg:col-span-5 h-44 lg:h-56 relative flex items-center justify-center pointer-events-none w-full">
              {/* Spinning technical orbital layout */}
              <div className="absolute w-44 h-44 rounded-full border border-white/[0.02] flex items-center justify-center animate-spin [animation-duration:20s]">
                <div className="w-32 h-32 rounded-full border border-dashed border-accent/15" />
                <div className="absolute top-0 w-2.5 h-2.5 rounded-full bg-accent shadow-[0_0_12px_var(--color-accent)] animate-pulse" />
              </div>
              <div className="absolute w-32 h-32 rounded-full border border-white/[0.02] flex items-center justify-center animate-reverse-spin [animation-duration:12s]">
                <div className="absolute bottom-0 w-2 h-2 rounded-full bg-white/30" />
              </div>
              <div className="w-20 h-20 rounded-2xl bg-white/[0.01] border border-white/[0.05] shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex flex-col items-center justify-center relative backdrop-blur-md">
                <Zap className="w-8 h-8 text-accent fill-accent/10 drop-shadow-[0_0_8px_rgba(255,122,0,0.3)] animate-pulse" />
                <div className="absolute -inset-[2px] rounded-2xl bg-gradient-to-tr from-accent/30 via-transparent to-transparent -z-10" />
              </div>

              {/* Micro specs labels */}
              <div className="absolute bottom-4 left-4 font-mono text-[7px] text-white/10 tracking-[0.3em] uppercase">SYSTEM telemetry v0.8</div>
              <div className="absolute top-4 right-4 font-mono text-[7px] text-accent/20 tracking-[0.3em] uppercase animate-pulse">sync complete</div>
            </div>
          </div>
        </div>

        {/* 4-Card Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-200">
          {/* Card 1: Active Count */}
          <div className="p-6 rounded-[2rem] bg-[#0b0b0e] border border-white/[0.04] hover:border-accent/30 transition-all duration-300 flex flex-col justify-between min-h-[140px] group shadow-lg hover:shadow-accent/[0.02]">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-white/30 font-black uppercase tracking-widest font-mono">Active Missions</span>
              <Activity className="w-4 h-4 text-accent/50 group-hover:text-accent transition-colors" />
            </div>
            <div className="text-left mt-4">
              <h3 className="text-3xl font-serif text-white tracking-tight">{stats.activeCount}</h3>
              <p className="text-[8.5px] text-white/20 font-black uppercase tracking-wider mt-1.5 font-mono">In-progress Telemetry</p>
            </div>
          </div>

          {/* Card 2: Completed Count */}
          <div className="p-6 rounded-[2rem] bg-[#0b0b0e] border border-white/[0.04] hover:border-accent/30 transition-all duration-300 flex flex-col justify-between min-h-[140px] group shadow-lg hover:shadow-accent/[0.02]">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-white/30 font-black uppercase tracking-widest font-mono">Completed Projects</span>
              <CheckCircle2 className="w-4 h-4 text-accent/50 group-hover:text-accent transition-colors" />
            </div>
            <div className="text-left mt-4">
              <h3 className="text-3xl font-serif text-white tracking-tight">{stats.completedCount}</h3>
              <p className="text-[8.5px] text-white/20 font-black uppercase tracking-wider mt-1.5 font-mono">Successfully Shipped</p>
            </div>
          </div>

          {/* Card 3: Escrow / Claimed */}
          <div className="p-6 rounded-[2rem] bg-[#0b0b0e] border border-white/[0.04] hover:border-accent/30 transition-all duration-300 flex flex-col justify-between min-h-[140px] group shadow-lg hover:shadow-accent/[0.02]">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-white/30 font-black uppercase tracking-widest font-mono">
                {isOwner ? 'Escrowed Funds' : 'Active Claims'}
              </span>
              <Coins className="w-4 h-4 text-accent/50 group-hover:text-accent transition-colors" />
            </div>
            <div className="text-left mt-4">
              <h3 className="text-3xl font-mono text-white tracking-tight font-bold">₹{stats.totalEscrow.toLocaleString()}</h3>
              <p className="text-[8.5px] text-white/20 font-black uppercase tracking-wider mt-1.5 font-mono">
                {isOwner ? 'Secured active capital' : 'Value of active claims'}
              </p>
            </div>
          </div>

          {/* Card 4: Total Spent / Earned */}
          <div className="p-6 rounded-[2rem] bg-[#0b0b0e] border border-white/[0.04] hover:border-accent/30 transition-all duration-300 flex flex-col justify-between min-h-[140px] group shadow-lg hover:shadow-accent/[0.02]">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-white/30 font-black uppercase tracking-widest font-mono">
                {isOwner ? 'Disbursed Capital' : 'Accumulated Yield'}
              </span>
              <BarChart3 className="w-4 h-4 text-accent/50 group-hover:text-accent transition-colors" />
            </div>
            <div className="text-left mt-4">
              <h3 className="text-3xl font-mono text-white tracking-tight font-bold">
                ₹{financialTotal.toLocaleString()}
              </h3>
              <p className="text-[8.5px] text-white/20 font-black uppercase tracking-wider mt-1.5 font-mono">
                {isOwner ? 'Disbursed payouts' : 'Lifetime payouts earned'}
              </p>
            </div>
          </div>
        </div>

        {/* Asymmetric Core Workspace: Primary List on Left, Side Panel on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Task Feed / Review Board */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Owner Section */}
            {isOwner && (
              <section className="space-y-6 text-left">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-accent/10 flex items-center justify-center text-accent border border-accent/20">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-serif text-white tracking-wide">
                        Pending <span className="text-accent italic">Reviews</span>
                      </h3>
                      <p className="text-[9.5px] text-white/30 font-black uppercase tracking-widest mt-1">Review developer submissions</p>
                    </div>
                  </div>
                  <span className="px-4 py-1.5 bg-accent/10 border border-accent/20 text-accent text-[9px] font-black rounded-full uppercase tracking-widest shadow-[0_0_15px_rgba(255,122,0,0.1)]">
                    {pendingReviews.length} Action Required
                  </span>
                </div>

                {pendingReviews.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6 animate-in fade-in duration-500">
                    {pendingReviews.map((item) => (
                      <ReviewCard 
                        key={item.task.id}
                        task={item.task}
                        submission={item.submission}
                        claimantName={item.claimantName}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="p-16 border border-white/[0.04] rounded-[2rem] flex flex-col items-center text-center gap-4 bg-[#0b0b0e] relative overflow-hidden group shadow-lg">
                    {/* Background noise and glows */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.003)_1px,transparent_1px)] bg-[size:20px_20px] opacity-40" />
                    <div className="absolute -bottom-10 w-44 h-44 bg-accent/[0.015] rounded-full blur-[80px]" />

                    <div className="w-16 h-16 rounded-full bg-white/[0.01] border border-white/[0.05] flex items-center justify-center text-white/30 relative group overflow-hidden shadow-inner">
                      <CheckCircle2 className="w-7 h-7 relative z-10 text-white/30 group-hover:text-accent transition-colors duration-300" />
                    </div>
                    <div className="space-y-1 relative z-10 max-w-sm">
                      <p className="text-white text-base font-serif tracking-wide">All Caught Up!</p>
                      <p className="text-white/40 text-xs leading-relaxed px-4">
                        No pending reviews. When developers submit work for your tasks, their submissions will appear here for review.
                      </p>
                    </div>
                    <Link 
                      href="/post-task" 
                      className="mt-2 px-5 py-2.5 bg-white/[0.02] border border-white/5 hover:border-accent/40 rounded-xl text-white/60 hover:text-white font-black text-[9px] uppercase tracking-widest transition-all cursor-pointer"
                    >
                      Post Another Task
                    </Link>
                  </div>
                )}
              </section>
            )}

            {/* Developer Section */}
            {!isOwner && (
              <section className="space-y-6 text-left">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-accent/10 flex items-center justify-center text-accent border border-accent/20">
                      <LayoutGrid className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-serif text-white tracking-wide">
                        Active <span className="text-accent italic">Tasks</span>
                      </h3>
                      <p className="text-[9.5px] text-white/30 font-black uppercase tracking-widest mt-1 font-mono">Developer Dashboard</p>
                    </div>
                  </div>
                  <span className="px-4 py-1.5 bg-accent/10 border border-accent/20 text-accent text-[9px] font-black rounded-full uppercase tracking-widest shadow-[0_0_15px_rgba(255,122,0,0.1)]">
                    {activeTasks.length} In Progress
                  </span>
                </div>

                {activeTasks.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-500">
                    {activeTasks.map((item) => (
                      <ActiveTaskCard 
                        key={item.task.id}
                        task={item.task}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="p-16 border border-white/[0.04] rounded-[2rem] flex flex-col items-center text-center gap-4 bg-[#0b0b0e] relative overflow-hidden group shadow-lg">
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.003)_1px,transparent_1px)] bg-[size:20px_20px] opacity-40" />
                    <div className="absolute -bottom-10 w-44 h-44 bg-accent/[0.015] rounded-full blur-[80px]" />

                    <div className="w-16 h-16 rounded-full bg-white/[0.01] border border-white/[0.05] flex items-center justify-center text-white/30 relative group overflow-hidden shadow-inner">
                      <AlertCircle className="w-7 h-7 relative z-10 text-white/30" />
                    </div>
                    <div className="space-y-1 relative z-10 max-w-sm">
                      <p className="text-white text-base font-serif tracking-wide">No Active Tasks</p>
                      <p className="text-white/40 text-xs leading-relaxed px-4">
                        You have not claimed any active tasks. Jump into the mission feed and discover your next challenge!
                      </p>
                    </div>
                    <Link 
                      href="/tasks" 
                      className="mt-2 px-5 py-2.5 bg-white/[0.02] border border-white/5 hover:border-accent/40 rounded-xl text-white/60 hover:text-white font-black text-[9px] uppercase tracking-widest transition-all cursor-pointer"
                    >
                      Browse Mission Feed
                    </Link>
                  </div>
                )}
              </section>
            )}
          </div>

          {/* Right Column: Premium Command Insights Sidepanel */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Gamified Streak & Milestones Widget */}
            <div className="p-6 rounded-[2.5rem] bg-[#0b0b0e] border border-white/[0.04] shadow-lg text-left relative overflow-hidden group">
              {/* Subtle top edge glow border */}
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-accent/20 to-transparent pointer-events-none" />

              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-black uppercase text-white/30 tracking-widest font-mono">Performance Node</h4>
                <Award className="w-4 h-4 text-accent/70" />
              </div>

              <div className="space-y-4">
                {/* Milestone Streaks */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-accent/5 border border-accent/15 flex items-center justify-center text-accent">
                    <Flame className="w-5 h-5 fill-accent/10" />
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-white uppercase tracking-wider leading-none">
                      {isOwner ? 'Review Streak' : 'Commit Streak'}
                    </h5>
                    <p className="text-[10px] text-white/40 font-bold mt-1 font-sans">
                      {isOwner ? 'Fast Review streak: 7 days' : `${user?.currentStreak || 0} consecutive activity days`}
                    </p>
                  </div>
                </div>

                {/* Micro Streaks bar */}
                <div className="w-full bg-white/[0.02] border border-white/[0.04] h-2 rounded-full overflow-hidden">
                  <div className="h-full bg-accent rounded-full shadow-[0_0_8px_var(--color-accent)]" style={{ width: isOwner ? '70%' : `${Math.min(((user?.currentStreak || 0) / 7) * 100, 100)}%` }} />
                </div>

                {/* Mini Milestones List */}
                <div className="space-y-2 pt-2 border-t border-white/[0.04]">
                  <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-white/40">
                    <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-accent" /> Creator Level</span>
                    <span className="text-white font-mono">LVL {userLevel} ({userLevelTitle})</span>
                  </div>
                  <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-white/40">
                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-accent" /> Review Speed</span>
                    <span className="text-emerald-400 font-mono">Avg &lt; 4 hrs</span>
                  </div>
                  <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-white/40">
                    <span className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-accent" /> Active Projects</span>
                    <span className="text-white font-mono">{stats.activeCount} running</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Operations Telemetry Log */}
            <div className="p-6 rounded-[2.5rem] bg-[#0b0b0e] border border-white/[0.04] shadow-lg text-left relative overflow-hidden group">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-black uppercase text-white/30 tracking-widest font-mono">Operational Logs</h4>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
                  <span className="text-[7.5px] font-black uppercase text-emerald-400 tracking-wider font-mono">Live</span>
                </div>
              </div>

              <div className="space-y-3.5 font-mono text-[9px] text-white/50 leading-relaxed">
                <div className="p-2 rounded-xl bg-white/[0.01] border border-white/[0.03]">
                  <span className="text-accent">[05:14:24]</span> Admin session authenticated. Telemetry node initialized.
                </div>
                <div className="p-2 rounded-xl bg-white/[0.01] border border-white/[0.03]">
                  <span className="text-accent">[05:14:15]</span> Database URL sync successfully established on port 5433.
                </div>
                {isOwner && pendingReviews.length > 0 && (
                  <div className="p-2 rounded-xl bg-accent/[0.02] border border-accent/15 text-accent">
                    <span className="text-accent font-bold">[WARN]</span> {pendingReviews.length} task submissions awaiting your review code verification.
                  </div>
                )}
                {activeTasks.length > 0 && !isOwner && (
                  <div className="p-2 rounded-xl bg-accent/[0.02] border border-accent/15 text-accent">
                    <span className="text-accent font-bold">[INFO]</span> You have {activeTasks.length} missions in progress. Review deadlines.
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  )
}
