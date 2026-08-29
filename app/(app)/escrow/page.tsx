/**
 * @fileoverview Forke Platform
 * @copyright (c) 2026 Forke Inc. (https://www.forke.space/)
 *
 * Source-Available License (Non-Commercial / Fair Source).
 * This source code is open for inspection, learning, and personal development.
 * Commercial use, hosting, or resale as a paid service without an explicit
 * commercial license from Forke Inc. is strictly prohibited.
 */

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
    <div className="flex flex-col h-full bg-transparent text-white font-sans">
      <TopBar title="Escrow" />

      <div className="flex-grow overflow-y-auto">
        <div className="mx-auto max-w-5xl px-5 md:px-8 py-6 md:py-8 space-y-6 select-none w-full">
        {/* Header */}
        <div className="space-y-1 text-left">
          <h2 className="text-xl md:text-2xl font-medium text-white tracking-tight">
            Escrow ledger
          </h2>
          <p className="text-sm text-[var(--color-text-muted)] max-w-xl leading-relaxed">
            Track funds held in escrow and review released payouts across your tasks.
          </p>
        </div>

        {/* Mini stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-[var(--color-border)] bg-white/[0.018] p-4 text-left">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--color-text-muted)]">Funds held</span>
              <Coins className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
            </div>
            <div className="mt-3">
              <h3 className="ui-kpi">₹{Math.floor(totalHeld / 100).toLocaleString()}</h3>
              <p className="text-[11px] text-[var(--color-text-muted)] mt-1">Secured in escrow</p>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--color-border)] bg-white/[0.018] p-4 text-left">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--color-text-muted)]">Funds released</span>
              <ShieldCheck className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
            </div>
            <div className="mt-3">
              <h3 className="ui-kpi">₹{Math.floor(totalReleased / 100).toLocaleString()}</h3>
              <p className="text-[11px] text-[var(--color-text-muted)] mt-1">Paid out to developers</p>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--color-border)] bg-white/[0.018] p-4 text-left">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--color-text-muted)]">Escrow status</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="mt-3">
              <h3 className="text-sm font-medium text-emerald-400">Active &amp; secure</h3>
              <p className="text-[11px] text-[var(--color-text-muted)] mt-1.5">Funds locked until approval</p>
            </div>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="space-y-3 text-left">
          <h4 className="text-sm font-medium text-white">Transactions</h4>

          {escrowRecords.length > 0 ? (
            <div className="border border-[var(--color-border)] rounded-xl overflow-hidden bg-white/[0.018]">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--color-border)] text-[11px] text-[var(--color-text-muted)]">
                      <th className="py-2.5 px-4 font-medium">ID</th>
                      <th className="py-2.5 px-4 font-medium">Task</th>
                      <th className="py-2.5 px-4 font-medium">Status</th>
                      <th className="py-2.5 px-4 text-right font-medium">Value (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {escrowRecords.map((row) => (
                      <tr key={row.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4 font-mono text-[12px] text-accent">
                          {row.id.split('-')[0]}-{row.id.split('-')[1]}
                        </td>
                        <td className="py-3 px-4 text-[13px] text-white/85 max-w-[200px] truncate">
                          {row.taskTitle}
                        </td>
                        <td className="py-3 px-4">
                          <span className={cn(
                            "px-1.5 py-0.5 text-[11px] font-medium rounded capitalize",
                            row.status === 'held' && "bg-amber-500/10 border border-amber-500/20 text-amber-400",
                            row.status === 'released' && "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400",
                            row.status === 'refunded' && "bg-white/5 border border-white/10 text-white/40"
                          )}>
                            {row.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-medium tabular-nums text-white">
                          ₹{Math.floor(row.amount / 100).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-10 border border-dashed border-[var(--color-border)] rounded-xl flex flex-col items-center justify-center text-center gap-3 bg-white/[0.01]">
              <BadgeInfo className="w-6 h-6 text-[var(--color-text-muted)]" />
              <div className="space-y-1">
                <p className="text-white font-medium text-sm">No transactions yet</p>
                <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed max-w-sm">
                  Once tasks are posted or claimed, active escrow contracts will appear here.
                </p>
              </div>
            </div>
          )}
        </div>

        </div>
      </div>
    </div>
  )
}
