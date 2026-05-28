import { auth } from '@/auth'
import TopBar from '@/components/shared/TopBar'
import { db } from '@/lib/db'
import { escrow, tasks } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { ShieldCheck, ArrowUpRight, Coins, ShieldAlert, BadgeInfo } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export default async function EscrowPage() {
  const session = await auth()
  const sessionUser = session?.user as { id: string; role: 'developer' | 'owner' } | undefined

  if (!sessionUser) return null

  // Fetch escrow records for current user
  let escrowRecords: Array<{
    id: string
    amount: number
    status: 'held' | 'released' | 'refunded'
    createdAt: Date
    taskTitle: string
  }> = []
  try {
    if (sessionUser.role === 'owner') {
      escrowRecords = await db
        .select({
          id: escrow.id,
          amount: escrow.amount,
          status: escrow.status,
          createdAt: escrow.createdAt,
          taskTitle: tasks.title,
        })
        .from(escrow)
        .innerJoin(tasks, eq(escrow.taskId, tasks.id))
        .where(eq(tasks.clientId, sessionUser.id))
        .orderBy(desc(escrow.createdAt))
    } else {
      escrowRecords = await db
        .select({
          id: escrow.id,
          amount: escrow.amount,
          status: escrow.status,
          createdAt: escrow.createdAt,
          taskTitle: tasks.title,
        })
        .from(escrow)
        .innerJoin(tasks, eq(escrow.taskId, tasks.id))
        .where(eq(tasks.claimantId, sessionUser.id))
        .orderBy(desc(escrow.createdAt))
    }
  } catch (e) {
    console.error('Failed to query escrow records:', e)
  }

  const isOwner = sessionUser.role === 'owner'

  // Calculate totals
  const totalHeld = escrowRecords
    .filter(r => r.status === 'held')
    .reduce((sum, r) => sum + r.amount, 0)

  const totalReleased = escrowRecords
    .filter(r => r.status === 'released')
    .reduce((sum, r) => sum + r.amount, 0)

  return (
    <div className="flex flex-col h-full bg-[#060608] text-white font-sans">
      <TopBar title={isOwner ? "Escrow Vault" : "Active Claims"} />
      
      <div className="flex-grow p-6 md:p-8 overflow-y-auto space-y-8 select-none max-w-5xl mx-auto w-full">
        {/* Header Banner */}
        <div className="space-y-3 text-left">
          <h2 className="font-serif text-3xl md:text-5xl text-white tracking-tight">
            Financial <span className="text-accent italic">Ledger</span>
          </h2>
          <p className="text-white/50 text-xs md:text-sm font-light max-w-xl leading-relaxed">
            Verify funded contracts, track funds held in escrow, and audit cryptographic payouts on the developer board.
          </p>
        </div>

        {/* Tactile Mini stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
          {/* Card 1: Total Held */}
          <div className="p-6 rounded-[2rem] bg-[#0b0b0e] border border-white/[0.04] text-left relative overflow-hidden shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-white/30 font-black uppercase tracking-widest font-mono">Funds Held</span>
              <Coins className="w-4 h-4 text-accent/50" />
            </div>
            <div className="mt-4 leading-none">
              <h3 className="text-2xl font-mono font-bold text-white">₹{Math.floor(totalHeld / 100).toLocaleString()}</h3>
              <p className="text-[8px] text-white/20 font-black uppercase tracking-wider mt-1 font-mono">Secured Vault Balance</p>
            </div>
          </div>

          {/* Card 2: Total Settled */}
          <div className="p-6 rounded-[2rem] bg-[#0b0b0e] border border-white/[0.04] text-left relative overflow-hidden shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-white/30 font-black uppercase tracking-widest font-mono">Funds Settled</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400/50" />
            </div>
            <div className="mt-4 leading-none">
              <h3 className="text-2xl font-mono font-bold text-white">₹{Math.floor(totalReleased / 100).toLocaleString()}</h3>
              <p className="text-[8px] text-white/20 font-black uppercase tracking-wider mt-1 font-mono">Released to builders</p>
            </div>
          </div>

          {/* Card 3: Security Nodes */}
          <div className="p-6 rounded-[2rem] bg-[#0b0b0e] border border-white/[0.04] text-left relative overflow-hidden shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-white/30 font-black uppercase tracking-widest font-mono">Escrow Node</span>
              <ShieldCheck className="w-4 h-4 text-accent/50 animate-pulse" />
            </div>
            <div className="mt-4 leading-none">
              <h3 className="text-xs font-black uppercase text-emerald-400 tracking-wider font-mono">active & secure</h3>
              <p className="text-[8px] text-white/20 font-black uppercase tracking-wider mt-1.5 font-mono">100% SLA verification</p>
            </div>
          </div>
        </div>

        {/* Ledger Table Section */}
        <div className="space-y-4 pt-4 text-left">
          <h4 className="text-xs font-black uppercase text-white/30 tracking-widest font-mono">Transaction Log</h4>
          
          {escrowRecords.length > 0 ? (
            <div className="border border-white/[0.04] rounded-2xl overflow-hidden bg-[#0b0b0e] shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.04] text-[9.5px] font-black uppercase tracking-widest text-white/40 font-mono bg-white/[0.005]">
                      <th className="py-4 px-6">Transaction Node ID</th>
                      <th className="py-4 px-6">Associated Mission</th>
                      <th className="py-4 px-6">Vault Status</th>
                      <th className="py-4 px-6 text-right">Value (INR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03]">
                    {escrowRecords.map((row) => (
                      <tr key={row.id} className="text-xs hover:bg-white/[0.005] transition-colors">
                        <td className="py-4 px-6 font-mono text-[10px] text-accent font-semibold uppercase">
                          {row.id.split('-')[0]}-{row.id.split('-')[1]}
                        </td>
                        <td className="py-4 px-6 text-white/80 font-serif max-w-[200px] truncate">
                          {row.taskTitle}
                        </td>
                        <td className="py-4 px-6">
                          <span className={cn(
                            "px-2 py-0.5 text-[8.5px] font-black font-mono rounded uppercase tracking-wider",
                            row.status === 'held' && "bg-amber-500/10 border border-amber-500/20 text-amber-400",
                            row.status === 'released' && "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400",
                            row.status === 'refunded' && "bg-white/5 border border-white/10 text-white/40"
                          )}>
                            {row.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right font-mono font-bold text-white">
                          ₹{Math.floor(row.amount / 100).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-16 border border-white/[0.04] rounded-[2.5rem] flex flex-col items-center justify-center text-center gap-4 bg-[#0b0b0e] shadow-xl">
              <BadgeInfo className="w-8 h-8 text-white/20" />
              <div className="space-y-1">
                <p className="text-white font-serif text-lg">No Financial Transactions</p>
                <p className="text-white/40 text-xs leading-relaxed max-w-sm">
                  There are no escrows recorded. Once tasks are posted or claimed, active contracts will appear in the vault logs.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
