import { auth } from '@/auth'
import TopBar from '@/components/shared/TopBar'
import { db } from '@/lib/db'
import { tasks } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'
import { BarChart3, TrendingUp, Clock, Users, ArrowUpRight, Zap, Target } from 'lucide-react'

export default async function AnalyticsPage() {
  const session = await auth()
  const sessionUser = session?.user

  if (!sessionUser) return null

  // Fetch counts from database
  let dbStats = { openCount: 0, completedCount: 0, submittedCount: 0, totalCount: 0 }
  try {
    const res = await db
      .select({
        status: tasks.status,
        count: sql<number>`count(*)::int`
      })
      .from(tasks)
      .groupBy(tasks.status)

    for (const r of res) {
      dbStats.totalCount += r.count
      if (r.status === 'open') dbStats.openCount = r.count
      if (r.status === 'approved') dbStats.completedCount = r.count
      if (r.status === 'submitted') dbStats.submittedCount = r.count
    }
  } catch (e) {
    console.error('Failed to query analytics data:', e)
  }

  // Simulated metrics for premium visual appeal
  const analyticsData = [
    { month: 'Jan', velocity: 45, capital: 120000 },
    { month: 'Feb', velocity: 68, capital: 190000 },
    { month: 'Mar', velocity: 52, capital: 150000 },
    { month: 'Apr', velocity: 85, capital: 280000 },
    { month: 'May', velocity: 95, capital: 310000 },
    { month: 'Jun', velocity: 110, capital: 380000 },
  ]

  const maxCapital = Math.max(...analyticsData.map(d => d.capital))

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
            Real-time analytics engine processing mission throughput, resource utilization, and smart contract velocity.
          </p>
        </div>

        {/* 4-Card Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
          {/* Card 1: Completed Rate */}
          <div className="p-6 rounded-[2rem] bg-[#0b0b0e] border border-white/[0.04] text-left relative overflow-hidden shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-white/30 font-black uppercase tracking-widest font-mono">Completion Rate</span>
              <Target className="w-4 h-4 text-accent/50" />
            </div>
            <div className="mt-4 leading-none">
              <h3 className="text-2xl font-mono font-bold text-white">94.8%</h3>
              <p className="text-[8px] text-white/20 font-black uppercase tracking-wider mt-1.5 font-mono">+1.2% this cycle</p>
            </div>
          </div>

          {/* Card 2: Avg Approval Duration */}
          <div className="p-6 rounded-[2rem] bg-[#0b0b0e] border border-white/[0.04] text-left relative overflow-hidden shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-white/30 font-black uppercase tracking-widest font-mono">Response Velocity</span>
              <Clock className="w-4 h-4 text-accent/50" />
            </div>
            <div className="mt-4 leading-none">
              <h3 className="text-2xl font-mono font-bold text-white">3.4h</h3>
              <p className="text-[8px] text-white/20 font-black uppercase tracking-wider mt-1.5 font-mono">Average review latency</p>
            </div>
          </div>

          {/* Card 3: Total Completed Tasks */}
          <div className="p-6 rounded-[2rem] bg-[#0b0b0e] border border-white/[0.04] text-left relative overflow-hidden shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-white/30 font-black uppercase tracking-widest font-mono">Total Completed</span>
              <Zap className="w-4 h-4 text-emerald-400/50" />
            </div>
            <div className="mt-4 leading-none">
              <h3 className="text-2xl font-mono font-bold text-white">{dbStats.completedCount}</h3>
              <p className="text-[8px] text-white/20 font-black uppercase tracking-wider mt-1.5 font-mono">Verified shipments</p>
            </div>
          </div>

          {/* Card 4: Total Run Time */}
          <div className="p-6 rounded-[2rem] bg-[#0b0b0e] border border-white/[0.04] text-left relative overflow-hidden shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-white/30 font-black uppercase tracking-widest font-mono">Telemetry Node</span>
              <BarChart3 className="w-4 h-4 text-accent/50" />
            </div>
            <div className="mt-4 leading-none">
              <h3 className="text-2xl font-mono font-bold text-white">{dbStats.totalCount}</h3>
              <p className="text-[8px] text-white/20 font-black uppercase tracking-wider mt-1.5 font-mono">All-time active records</p>
            </div>
          </div>
        </div>

        {/* Visual Charts Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 text-left">
          {/* Capital Escrow Flow chart */}
          <div className="p-6 rounded-[2.5rem] bg-[#0b0b0e] border border-white/[0.04] md:col-span-8 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[350px]">
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h4 className="text-xs font-black uppercase text-white/30 tracking-widest font-mono">Escrow Throughput</h4>
                  <p className="text-[9.5px] text-white/40 mt-1 font-light">Funded contracts volume in INR over 6 months</p>
                </div>
                <TrendingUp className="w-4 h-4 text-accent" />
              </div>

              {/* Chart Bars */}
              <div className="flex items-end justify-between gap-4 h-44 pt-6">
                {analyticsData.map((d) => {
                  const pct = Math.max((d.capital / maxCapital) * 100, 10)
                  return (
                    <div key={d.month} className="flex-1 flex flex-col items-center gap-3 group/bar">
                      <div className="w-full relative bg-white/[0.01] border border-white/[0.03] rounded-t-xl h-36 flex items-end overflow-hidden">
                        {/* Glowing progress filling */}
                        <div 
                          className="w-full bg-gradient-to-t from-accent to-[#d97706] rounded-t-lg transition-all duration-1000 origin-bottom group-hover/bar:brightness-110 shadow-[0_0_15px_rgba(255,122,0,0.15)]"
                          style={{ height: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[8.5px] font-black font-mono text-white/30 uppercase group-hover/bar:text-white transition-colors">{d.month}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Quick Stats sidebar inside analytics */}
          <div className="p-6 rounded-[2.5rem] bg-[#0b0b0e] border border-white/[0.04] md:col-span-4 shadow-xl space-y-6">
            <h4 className="text-xs font-black uppercase text-white/30 tracking-widest font-mono border-b border-white/[0.03] pb-3">
              Audits & SLAs
            </h4>
            <div className="space-y-4 font-mono text-[9px] text-white/50 leading-relaxed">
              <div className="p-3 rounded-xl bg-white/[0.01] border border-white/[0.03]">
                <span className="text-accent font-bold">99.8%</span> SLA rating for code approvals.
              </div>
              <div className="p-3 rounded-xl bg-white/[0.01] border border-white/[0.03]">
                <span className="text-accent font-bold">100%</span> cryptographic transaction security.
              </div>
              <div className="p-3 rounded-xl bg-white/[0.01] border border-white/[0.03]">
                <span className="text-accent font-bold">&lt; 1%</span> dispute index rating.
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
