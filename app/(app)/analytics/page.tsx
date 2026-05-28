import { auth } from '@/auth'
import TopBar from '@/components/shared/TopBar'
import { db } from '@/lib/db'
import { tasks, submissions } from '@/lib/db/schema'
import { eq, sql, and, gte } from 'drizzle-orm'
import { BarChart3, TrendingUp, Clock, CheckCircle2, Zap, Target, AlertTriangle } from 'lucide-react'

export default async function AnalyticsPage() {
  const session = await auth()
  const sessionUser = session?.user as { id: string; role: 'developer' | 'owner' } | undefined

  if (!sessionUser) return null

  const isOwner = sessionUser.role === 'owner'

  // ─── Fetch real counts ────────────────────────────────────────────────────
  let dbStats = { openCount: 0, completedCount: 0, submittedCount: 0, claimedCount: 0, totalCount: 0 }

  // Monthly task creation counts for last 6 months
  type MonthBucket = { month: string; count: number; budget: number }
  let monthlyData: MonthBucket[] = []

  try {
    const whereClause = isOwner
      ? eq(tasks.clientId, sessionUser.id)
      : eq(tasks.claimantId, sessionUser.id)

    const res = await db
      .select({
        status: tasks.status,
        count: sql<number>`count(*)::int`,
      })
      .from(tasks)
      .where(whereClause)
      .groupBy(tasks.status)

    for (const r of res) {
      dbStats.totalCount += r.count
      if (r.status === 'open')      dbStats.openCount      = r.count
      if (r.status === 'approved')  dbStats.completedCount = r.count
      if (r.status === 'submitted') dbStats.submittedCount = r.count
      if (r.status === 'claimed')   dbStats.claimedCount   = r.count
    }

    // Monthly breakdown – last 6 months
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
    sixMonthsAgo.setDate(1)
    sixMonthsAgo.setHours(0, 0, 0, 0)

    const monthlyRes = await db
      .select({
        month: sql<string>`to_char(created_at, 'Mon')`,
        monthNum: sql<number>`extract(month from created_at)::int`,
        count: sql<number>`count(*)::int`,
        budget: sql<number>`coalesce(sum(budget),0)::int`,
      })
      .from(tasks)
      .where(and(whereClause, gte(tasks.createdAt, sixMonthsAgo)))
      .groupBy(sql`to_char(created_at, 'Mon'), extract(month from created_at)`)
      .orderBy(sql`extract(month from created_at)`)

    monthlyData = monthlyRes.map(r => ({ month: r.month, count: r.count, budget: r.budget }))
  } catch (e) {
    console.error('Failed to query analytics data:', e)
  }

  // Fill missing months with 0
  const currentMonth = new Date().getMonth() + 1
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const last6Months: MonthBucket[] = []
  for (let i = 5; i >= 0; i--) {
    let m = currentMonth - i
    if (m <= 0) m += 12
    const label = MONTHS[m - 1]
    const found = monthlyData.find(x => x.month === label)
    last6Months.push(found ?? { month: label, count: 0, budget: 0 })
  }

  const maxBudget = Math.max(...last6Months.map(d => d.budget), 1)
  const maxCount  = Math.max(...last6Months.map(d => d.count),  1)

  const completionRate = dbStats.totalCount > 0
    ? Math.round((dbStats.completedCount / dbStats.totalCount) * 100)
    : 0

  const pendingReviewCount = dbStats.submittedCount

  return (
    <div className="flex flex-col h-full bg-[#060608] text-white font-sans">
      <TopBar title="Analytics Node" />
      
      <div className="flex-grow p-6 md:p-8 overflow-y-auto space-y-8 select-none max-w-5xl mx-auto w-full">
        {/* Header Banner */}
        <div className="space-y-3 text-left">
          <h2 className="font-serif text-3xl md:text-5xl text-white tracking-tight">
            Performance <span className="text-accent italic">Telemetry</span>
          </h2>
          <p className="text-white/50 text-xs md:text-sm font-light max-w-xl leading-relaxed">
            {isOwner
              ? 'Real-time insights on your mission throughput, escrow capital flow, and developer response metrics.'
              : 'Track your task activity, earnings throughput, and approval velocity across all claimed missions.'}
          </p>
        </div>

        {/* 4-Card Stats Grid — all dynamic */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
          <div className="p-6 rounded-[2rem] bg-[#0b0b0e] border border-white/[0.04] text-left relative overflow-hidden shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-white/30 font-black uppercase tracking-widest font-mono">
                {isOwner ? 'Completion Rate' : 'Tasks Completed'}
              </span>
              <Target className="w-4 h-4 text-accent/50" />
            </div>
            <div className="mt-4 leading-none">
              <h3 className="text-2xl font-mono font-bold text-white">
                {isOwner ? `${completionRate}%` : dbStats.completedCount}
              </h3>
              <p className="text-[8px] text-white/20 font-black uppercase tracking-wider mt-1.5 font-mono">
                {isOwner ? 'Of all posted missions' : 'Verified shipments'}
              </p>
            </div>
          </div>

          <div className="p-6 rounded-[2rem] bg-[#0b0b0e] border border-white/[0.04] text-left relative overflow-hidden shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-white/30 font-black uppercase tracking-widest font-mono">
                {isOwner ? 'Pending Reviews' : 'Active Missions'}
              </span>
              <Clock className="w-4 h-4 text-amber-400/50" />
            </div>
            <div className="mt-4 leading-none">
              <h3 className="text-2xl font-mono font-bold text-white">
                {isOwner ? pendingReviewCount : dbStats.claimedCount}
              </h3>
              <p className="text-[8px] text-white/20 font-black uppercase tracking-wider mt-1.5 font-mono">
                {isOwner ? 'Awaiting your action' : 'Currently in progress'}
              </p>
            </div>
          </div>

          <div className="p-6 rounded-[2rem] bg-[#0b0b0e] border border-white/[0.04] text-left relative overflow-hidden shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-white/30 font-black uppercase tracking-widest font-mono">
                {isOwner ? 'Total Missions' : 'Total Claimed'}
              </span>
              <Zap className="w-4 h-4 text-emerald-400/50" />
            </div>
            <div className="mt-4 leading-none">
              <h3 className="text-2xl font-mono font-bold text-white">{dbStats.totalCount}</h3>
              <p className="text-[8px] text-white/20 font-black uppercase tracking-wider mt-1.5 font-mono">
                {isOwner ? 'All-time posted' : 'Lifetime missions taken'}
              </p>
            </div>
          </div>

          <div className="p-6 rounded-[2rem] bg-[#0b0b0e] border border-white/[0.04] text-left relative overflow-hidden shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-white/30 font-black uppercase tracking-widest font-mono">
                {isOwner ? 'Open Missions' : 'Submissions Pending'}
              </span>
              <BarChart3 className="w-4 h-4 text-accent/50" />
            </div>
            <div className="mt-4 leading-none">
              <h3 className="text-2xl font-mono font-bold text-white">
                {isOwner ? dbStats.openCount : dbStats.submittedCount}
              </h3>
              <p className="text-[8px] text-white/20 font-black uppercase tracking-wider mt-1.5 font-mono">
                {isOwner ? 'Awaiting developers' : 'Awaiting client review'}
              </p>
            </div>
          </div>
        </div>

        {/* Visual Charts Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 text-left">
          {/* Real monthly bar chart */}
          <div className="p-6 rounded-[2.5rem] bg-[#0b0b0e] border border-white/[0.04] md:col-span-8 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[350px]">
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h4 className="text-xs font-black uppercase text-white/30 tracking-widest font-mono">
                    {isOwner ? 'Mission Activity' : 'Task Activity'}
                  </h4>
                  <p className="text-[9.5px] text-white/40 mt-1 font-light">
                    {isOwner ? 'Tasks posted per month (last 6 months)' : 'Tasks claimed per month (last 6 months)'}
                  </p>
                </div>
                <TrendingUp className="w-4 h-4 text-accent" />
              </div>

              {/* Chart Bars */}
              <div className="flex items-end justify-between gap-4 h-44 pt-6">
                {last6Months.map((d) => {
                  const pct = Math.max((d.count / maxCount) * 100, d.count > 0 ? 10 : 2)
                  return (
                    <div key={d.month} className="flex-1 flex flex-col items-center gap-3 group/bar">
                      {/* Count label on hover */}
                      <div className="relative w-full h-36 bg-white/[0.01] border border-white/[0.03] rounded-t-xl flex items-end overflow-hidden">
                        <div
                          className="w-full bg-gradient-to-t from-accent to-[#d97706] rounded-t-lg transition-all duration-1000 origin-bottom group-hover/bar:brightness-110 shadow-[0_0_15px_rgba(255,122,0,0.15)]"
                          style={{ height: `${pct}%` }}
                        />
                        {/* Count badge on hover */}
                        {d.count > 0 && (
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/bar:opacity-100 transition-opacity">
                            <span className="text-[9px] font-black font-mono text-white bg-black/60 rounded px-1.5 py-0.5">
                              {d.count}
                            </span>
                          </div>
                        )}
                      </div>
                      <span className="text-[8.5px] font-black font-mono text-white/30 uppercase group-hover/bar:text-white transition-colors">{d.month}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* No data indicator */}
            {dbStats.totalCount === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0b0b0e]/80">
                <AlertTriangle className="w-6 h-6 text-white/20" />
                <p className="text-[9px] font-black uppercase tracking-widest text-white/20 font-mono">
                  No data yet — {isOwner ? 'post your first mission' : 'claim your first task'}
                </p>
              </div>
            )}
          </div>

          {/* Real dynamic stats sidebar */}
          <div className="p-6 rounded-[2.5rem] bg-[#0b0b0e] border border-white/[0.04] md:col-span-4 shadow-xl space-y-6">
            <h4 className="text-xs font-black uppercase text-white/30 tracking-widest font-mono border-b border-white/[0.03] pb-3">
              {isOwner ? 'Mission Breakdown' : 'Task Breakdown'}
            </h4>
            <div className="space-y-4 font-mono text-[9px] text-white/50 leading-relaxed">
              <div className="p-3 rounded-xl bg-white/[0.01] border border-white/[0.03] flex items-center justify-between">
                <span className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Completed</span>
                <span className="text-emerald-400 font-bold">{dbStats.completedCount}</span>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.01] border border-white/[0.03] flex items-center justify-between">
                <span className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-amber-400" /> {isOwner ? 'Under Review' : 'In Progress'}</span>
                <span className="text-amber-400 font-bold">{isOwner ? dbStats.submittedCount : dbStats.claimedCount}</span>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.01] border border-white/[0.03] flex items-center justify-between">
                <span className="flex items-center gap-2"><Zap className="w-3.5 h-3.5 text-accent" /> {isOwner ? 'Open' : 'Submitted'}</span>
                <span className="text-accent font-bold">{isOwner ? dbStats.openCount : dbStats.submittedCount}</span>
              </div>
              <div className="p-3 rounded-xl bg-accent/[0.02] border border-accent/10 flex items-center justify-between">
                <span className="flex items-center gap-2 text-accent"><BarChart3 className="w-3.5 h-3.5" /> Total</span>
                <span className="text-white font-bold">{dbStats.totalCount}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
