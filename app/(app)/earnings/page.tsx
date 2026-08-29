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

  const statCards = [
    { label: isDev ? 'Total earned' : 'Total disbursed', value: `₹${totalInRs(totalEarned)}`, hint: isDev ? 'Lifetime payouts' : 'Completed project spend', icon: Wallet },
    { label: isDev ? 'Pending payout' : 'Active escrow', value: `₹${totalInRs(totalPending)}`, hint: isDev ? 'Awaiting client approval' : 'Locked in escrow', icon: Clock },
    { label: 'Tasks settled', value: `${completedTasks.length}`, hint: 'Verified completions', icon: CheckCircle2 },
  ]

  return (
    <div className="flex flex-col h-full bg-transparent text-white font-sans">
      <TopBar title={isDev ? 'Earnings' : 'Finances'} />

      <div className="flex-grow overflow-y-auto">
        <div className="mx-auto max-w-5xl px-5 md:px-8 py-6 md:py-8 space-y-6 select-none w-full">
        {/* Header */}
        <div className="space-y-1 text-left">
          <h2 className="text-xl md:text-2xl font-medium text-white tracking-tight">
            {isDev ? 'My earnings' : 'Financial overview'}
          </h2>
          <p className="text-sm text-[var(--color-text-muted)] max-w-xl leading-relaxed">
            {isDev
              ? 'Track payouts from completed tasks and monitor pending earnings awaiting client sign-off.'
              : 'Review disbursed funds and active escrow across all your posted tasks.'}
          </p>
        </div>

        {/* 3-Card Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {statCards.map((card) => {
            const Icon = card.icon
            return (
              <div key={card.label} className="rounded-xl border border-[var(--color-border)] bg-white/[0.018] p-4 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--color-text-muted)]">{card.label}</span>
                  <Icon className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                </div>
                <div className="mt-3">
                  <h3 className="ui-kpi">{card.value}</h3>
                  <p className="text-[11px] text-[var(--color-text-muted)] mt-1">{card.hint}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Pending Block */}
        {pendingTasks.length > 0 && (
          <div className="space-y-3 text-left">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <h4 className="text-sm font-medium text-white">Pending confirmation</h4>
            </div>

            <div className="space-y-2.5">
              {pendingTasks.map(task => (
                <Link
                  key={task.id}
                  href={`/tasks/${task.id}`}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-[var(--color-border)] bg-white/[0.018] hover:border-white/[0.14] transition-colors group"
                >
                  <div className="min-w-0">
                    <h5 className="text-sm font-medium text-white truncate group-hover:text-accent transition-colors">{task.title}</h5>
                    <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">Under review</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[13px] font-medium tabular-nums text-amber-400">₹{totalInRs(task.budget)}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-[var(--color-text-muted)] group-hover:text-white transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Settled Payouts */}
        <div className="space-y-3 text-left">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Coins className="w-4 h-4 text-emerald-400" />
            </div>
            <h4 className="text-sm font-medium text-white">Settled {isDev ? 'payouts' : 'disbursements'}</h4>
          </div>

          {completedTasks.length > 0 ? (
            <div className="border border-[var(--color-border)] rounded-xl overflow-hidden bg-white/[0.018]">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--color-border)] text-[11px] text-[var(--color-text-muted)]">
                      <th className="py-2.5 px-4 font-medium">Task</th>
                      <th className="py-2.5 px-4 font-medium">Settled date</th>
                      <th className="py-2.5 px-4 text-right font-medium">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {completedTasks.map(task => (
                      <tr key={task.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="py-3 px-4">
                          <Link href={`/tasks/${task.id}`} className="text-[13px] text-white/85 hover:text-accent transition-colors flex items-center gap-1.5">
                            {task.title}
                            <ArrowUpRight className="w-3 h-3 text-[var(--color-text-muted)] group-hover:text-accent" />
                          </Link>
                        </td>
                        <td className="py-3 px-4 text-[13px] text-[var(--color-text-muted)] tabular-nums">
                          {new Date(task.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="py-3 px-4 text-right font-medium tabular-nums text-emerald-400">
                          ₹{totalInRs(task.budget)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-10 border border-dashed border-[var(--color-border)] rounded-xl flex flex-col items-center justify-center text-center gap-3 bg-white/[0.01]">
              <Inbox className="w-6 h-6 text-[var(--color-text-muted)]" />
              <div className="space-y-1">
                <p className="text-white font-medium text-sm">No settled tasks yet</p>
                <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed max-w-xs">
                  {isDev
                    ? 'Claim and complete tasks to start earning. Approved payouts appear here.'
                    : 'Post tasks and approve developer work to see disbursements here.'}
                </p>
              </div>
              <Link
                href={isDev ? '/tasks' : '/post-task'}
                className="inline-flex items-center h-8 px-3.5 rounded-lg ui-btn-secondary text-[13px] font-medium transition-colors"
              >
                {isDev ? 'Browse tasks' : 'Post a task'}
              </Link>
            </div>
          )}
        </div>

        </div>
      </div>
    </div>
  )
}
