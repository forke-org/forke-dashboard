import { auth } from '@/auth'
import TopBar from '@/components/shared/TopBar'
import { db } from '@/lib/db'
import { tasks } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { Wallet, CheckCircle2, Clock, ArrowUpRight, Coins, Inbox } from 'lucide-react'
import Link from 'next/link'

export default async function EarningsPage() {
  const session = await auth()
  const user = session?.user as { id: string; role: 'developer' | 'owner' } | undefined

  if (!user) return null

  // Fetch completed tasks (approved) for dev or owner
  let completedTasks: Array<{ id: string; title: string; budget: number; createdAt: Date }> = []
  let pendingTasks: Array<{ id: string; title: string; budget: number }> = []

  let totalEarned = 0
  let totalPending = 0

  try {
    if (user.role === 'developer') {
      const allClaimedTasks = await db
        .select({
          id: tasks.id,
          title: tasks.title,
          budget: tasks.budget,
          status: tasks.status,
          createdAt: tasks.createdAt,
        })
        .from(tasks)
        .where(eq(tasks.claimantId, user.id))
        .orderBy(desc(tasks.createdAt))

      for (const task of allClaimedTasks) {
        if (task.status === 'approved') {
          completedTasks.push({ id: task.id, title: task.title, budget: task.budget, createdAt: task.createdAt })
          totalEarned += task.budget
        } else if (task.status === 'claimed' || task.status === 'submitted') {
          pendingTasks.push({ id: task.id, title: task.title, budget: task.budget })
          totalPending += task.budget
        }
      }
    } else {
      // For owners — show total spent and active escrow
      const allTasks = await db
        .select({
          id: tasks.id,
          title: tasks.title,
          budget: tasks.budget,
          status: tasks.status,
          createdAt: tasks.createdAt,
        })
        .from(tasks)
        .where(eq(tasks.clientId, user.id))
        .orderBy(desc(tasks.createdAt))

      for (const task of allTasks) {
        if (task.status === 'approved') {
          completedTasks.push({ id: task.id, title: task.title, budget: task.budget, createdAt: task.createdAt })
          totalEarned += task.budget
        } else if (task.status === 'claimed' || task.status === 'submitted') {
          pendingTasks.push({ id: task.id, title: task.title, budget: task.budget })
          totalPending += task.budget
        }
      }
    }
  } catch (e) {
    console.error('Failed to query earnings data:', e)
  }

  const isDev = user.role === 'developer'
  const totalInRs = (n: number) => Math.floor(n / 100).toLocaleString()

  return (
    <div className="flex flex-col h-full bg-[#060608] text-white font-sans">
      <TopBar title={isDev ? 'Earnings Ledger' : 'Financial Overview'} />
      
      <div className="flex-grow p-6 md:p-8 overflow-y-auto space-y-8 select-none max-w-5xl mx-auto w-full">
        {/* Header */}
        <div className="space-y-3 text-left">
          <h2 className="font-serif text-3xl md:text-5xl text-white tracking-tight">
            {isDev ? 'My ' : 'Capital '}<span className="text-accent italic">{isDev ? 'Earnings' : 'Overview'}</span>
          </h2>
          <p className="text-white/50 text-xs md:text-sm font-light max-w-xl leading-relaxed">
            {isDev
              ? 'Track your accumulated yield from completed missions and monitor pending payouts awaiting client sign-off.'
              : 'Review disbursed funds and active escrow locks across all your posted missions.'}
          </p>
        </div>

        {/* 3-Card Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
          <div className="p-6 rounded-[2rem] bg-[#0b0b0e] border border-white/[0.04] text-left relative overflow-hidden shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-white/30 font-black uppercase tracking-widest font-mono">
                {isDev ? 'Total Earned' : 'Total Disbursed'}
              </span>
              <Wallet className="w-4 h-4 text-accent/50" />
            </div>
            <div className="mt-4 leading-none">
              <h3 className="text-2xl font-mono font-bold text-white">₹{totalInRs(totalEarned)}</h3>
              <p className="text-[8px] text-white/20 font-black uppercase tracking-wider mt-1.5 font-mono">
                {isDev ? 'Lifetime mission payouts' : 'Completed project spend'}
              </p>
            </div>
          </div>

          <div className="p-6 rounded-[2rem] bg-[#0b0b0e] border border-white/[0.04] text-left relative overflow-hidden shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-white/30 font-black uppercase tracking-widest font-mono">
                {isDev ? 'Pending Payout' : 'Active Escrow'}
              </span>
              <Clock className="w-4 h-4 text-amber-400/50" />
            </div>
            <div className="mt-4 leading-none">
              <h3 className="text-2xl font-mono font-bold text-white">₹{totalInRs(totalPending)}</h3>
              <p className="text-[8px] text-white/20 font-black uppercase tracking-wider mt-1.5 font-mono">
                {isDev ? 'Awaiting client approval' : 'Locked in secure vault'}
              </p>
            </div>
          </div>

          <div className="p-6 rounded-[2rem] bg-[#0b0b0e] border border-white/[0.04] text-left relative overflow-hidden shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-white/30 font-black uppercase tracking-widest font-mono">Missions Settled</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400/50" />
            </div>
            <div className="mt-4 leading-none">
              <h3 className="text-2xl font-mono font-bold text-white">{completedTasks.length}</h3>
              <p className="text-[8px] text-white/20 font-black uppercase tracking-wider mt-1.5 font-mono">Verified completions</p>
            </div>
          </div>
        </div>

        {/* Pending Missions Block */}
        {pendingTasks.length > 0 && (
          <div className="space-y-4 text-left">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <h4 className="text-sm font-serif text-white">Pending Confirmation</h4>
                <p className="text-[9px] text-white/30 font-black uppercase tracking-widest font-mono">
                  {isDev ? 'Awaiting client approval' : 'Active mission escrow'}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {pendingTasks.map(task => (
                <Link
                  key={task.id}
                  href={`/tasks/${task.id}`}
                  className="flex items-center justify-between p-4 rounded-2xl bg-[#0b0b0e] border border-amber-500/10 hover:border-amber-500/25 transition-all group"
                >
                  <div className="min-w-0">
                    <h5 className="text-xs font-bold text-white truncate group-hover:text-amber-300 transition-colors">{task.title}</h5>
                    <p className="text-[8px] font-mono text-white/30 mt-0.5 uppercase tracking-wider">Under review</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-mono font-bold text-amber-400">₹{totalInRs(task.budget)}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-white/20 group-hover:text-white transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Settled Payouts */}
        <div className="space-y-4 text-left">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Coins className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h4 className="text-sm font-serif text-white">Settled {isDev ? 'Payouts' : 'Disbursements'}</h4>
              <p className="text-[9px] text-white/30 font-black uppercase tracking-widest font-mono">
                Confirmed & released
              </p>
            </div>
          </div>

          {completedTasks.length > 0 ? (
            <div className="border border-white/[0.04] rounded-2xl overflow-hidden bg-[#0b0b0e] shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.04] text-[9px] font-black uppercase tracking-widest text-white/30 font-mono bg-white/[0.005]">
                      <th className="py-3 px-5">Mission Title</th>
                      <th className="py-3 px-5">Settled Date</th>
                      <th className="py-3 px-5 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03]">
                    {completedTasks.map(task => (
                      <tr key={task.id} className="hover:bg-white/[0.005] transition-colors group">
                        <td className="py-3.5 px-5">
                          <Link href={`/tasks/${task.id}`} className="text-xs text-white/80 hover:text-accent transition-colors font-medium flex items-center gap-1.5 group-hover:gap-2.5">
                            {task.title}
                            <ArrowUpRight className="w-3 h-3 text-white/20 group-hover:text-accent" />
                          </Link>
                        </td>
                        <td className="py-3.5 px-5 text-[10px] font-mono text-white/40">
                          {new Date(task.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="py-3.5 px-5 text-right font-mono font-bold text-emerald-400">
                          ₹{totalInRs(task.budget)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-12 border border-white/[0.04] rounded-[2rem] flex flex-col items-center justify-center text-center gap-4 bg-[#0b0b0e] shadow-xl">
              <Inbox className="w-7 h-7 text-white/20" />
              <div className="space-y-1">
                <p className="text-white font-serif text-base">No Settled Missions Yet</p>
                <p className="text-white/40 text-xs leading-relaxed max-w-xs">
                  {isDev
                    ? 'Claim and complete tasks to start earning. Your payouts will appear here once approved by clients.'
                    : 'Post missions and approve developer work to see your disbursement history here.'}
                </p>
              </div>
              <Link
                href={isDev ? '/tasks' : '/post-task'}
                className="px-5 py-2.5 bg-white/[0.02] border border-white/5 hover:border-accent/40 rounded-xl text-white/60 hover:text-white font-black text-[9px] uppercase tracking-widest transition-all"
              >
                {isDev ? 'Browse Missions' : 'Post a Mission'}
              </Link>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
