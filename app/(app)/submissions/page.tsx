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
import { tasks, submissions, users } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { getSubmissionsByDeveloper } from '@/lib/db/queries/tasks'
import Link from 'next/link'
import { Clock, GitPullRequest, ChevronRight, CheckCircle2, AlertCircle, Inbox, Wallet, User, Eye } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

// ─── Types ──────────────────────────────────────────────────────────────────

type DevSubmissionItem = Awaited<ReturnType<typeof getSubmissionsByDeveloper>>[number]

interface OwnerSubmissionItem {
  taskId: string
  taskTitle: string
  taskBudget: number
  developerName: string | null
  githubLink: string
  note: string | null
  status: 'pending' | 'approved' | 'rejected'
  submittedAt: Date
}

// ─── Owner Row ──────────────────────────────────────────────────────────────

function OwnerSubmissionRow({ item }: { item: OwnerSubmissionItem }) {
  const budgetInRupees = Math.floor(item.taskBudget / 100)
  const statusConfig = {
    pending:  { label: 'Awaiting Review', color: 'bg-amber-500/10 border-amber-500/20 text-amber-400' },
    approved: { label: 'Approved',        color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' },
    rejected: { label: 'Revision Sent',   color: 'bg-red-500/10 border-red-500/20 text-red-400' },
  }
  const s = statusConfig[item.status]

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-white/[0.018] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-white/[0.14] transition-colors group select-none">
      <div className="flex-grow space-y-2 min-w-0 text-left">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h4 className="text-sm font-medium text-white truncate">{item.taskTitle}</h4>
          <span className={cn('px-1.5 py-0.5 text-[11px] font-medium rounded border shrink-0', s.color)}>
            {s.label}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-[var(--color-text-muted)]">
          <div className="flex items-center gap-1.5 text-accent font-medium tabular-nums">
            <Wallet className="w-3.5 h-3.5" />
            ₹{budgetInRupees.toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" />
            {item.developerName || 'Unknown'}
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {new Date(item.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </div>
          <div className="flex items-center gap-1.5 truncate max-w-[250px]">
            <GitPullRequest className="w-3.5 h-3.5" />
            {item.githubLink.replace('https://github.com/', '')}
          </div>
        </div>
        {item.note && (
          <p className="text-[13px] text-white/45 italic line-clamp-1 max-w-md">&ldquo;{item.note}&rdquo;</p>
        )}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <Link
          href={`/tasks/${item.taskId}`}
          className="h-9 px-3.5 text-[13px] font-medium rounded-lg ui-btn-primary transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5" /> Review <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  )
}

// ─── Developer Row ──────────────────────────────────────────────────────────

function DevSubmissionRow({ item }: { item: DevSubmissionItem }) {
  const budgetInRupees = Math.floor(item.taskBudget / 100)
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-white/[0.018] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-white/[0.14] transition-colors group select-none">
      <div className="flex-grow space-y-2 min-w-0 text-left">
        <h4 className="text-sm font-medium text-white truncate">{item.taskTitle}</h4>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-[var(--color-text-muted)]">
          <div className="flex items-center gap-1.5 text-accent font-medium tabular-nums">
            <Wallet className="w-3.5 h-3.5" />
            ₹{budgetInRupees.toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {new Date(item.submission.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </div>
          <div className="flex items-center gap-1.5 truncate max-w-[250px]">
            <GitPullRequest className="w-3.5 h-3.5" />
            {item.submission.githubLink.replace('https://github.com/', '')}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4 shrink-0">
        <Link
          href={`/tasks/${item.submission.taskId}`}
          className="h-9 px-3.5 text-[13px] font-medium rounded-lg ui-btn-secondary transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          View task <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  )
}

// ─── Section wrappers ───────────────────────────────────────────────────────

function OwnerSection({ title, items, icon: Icon, colorClass, statusLabel, badgeColor }: {
  title: string; items: OwnerSubmissionItem[]; icon: React.ComponentType<any>; colorClass: string; statusLabel: string; badgeColor: string
}) {
  return (
    <section className="space-y-3 text-left">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center border', colorClass)}>
            <Icon className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-medium text-white">{title}</h3>
        </div>
        <span className={cn('px-2 py-0.5 text-[11px] font-medium rounded-full tabular-nums', badgeColor)}>
          {items.length} {items.length === 1 ? 'entry' : 'entries'}
        </span>
      </div>
      {items.length > 0 ? (
        <div className="grid grid-cols-1 gap-3">
          {items.map((s, i) => <OwnerSubmissionRow key={`${s.taskId}-${i}`} item={s} />)}
        </div>
      ) : (
        <div className="p-8 border border-dashed border-[var(--color-border)] rounded-xl flex flex-col items-center text-center gap-2 bg-white/[0.01]">
          <Inbox className="w-5 h-5 text-[var(--color-text-muted)]" />
          <p className="text-[13px] text-[var(--color-text-muted)]">No {statusLabel} submissions</p>
        </div>
      )}
    </section>
  )
}

function DevSection({ title, items, icon: Icon, colorClass, statusLabel, badgeColor }: {
  title: string; items: DevSubmissionItem[]; icon: React.ComponentType<any>; colorClass: string; statusLabel: string; badgeColor: string
}) {
  return (
    <section className="space-y-3 text-left">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center border', colorClass)}>
            <Icon className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-medium text-white">{title}</h3>
        </div>
        <span className={cn('px-2 py-0.5 text-[11px] font-medium rounded-full tabular-nums', badgeColor)}>
          {items.length} {items.length === 1 ? 'entry' : 'entries'}
        </span>
      </div>
      {items.length > 0 ? (
        <div className="grid grid-cols-1 gap-3">
          {items.map((s) => <DevSubmissionRow key={s.submission.id} item={s} />)}
        </div>
      ) : (
        <div className="p-8 border border-dashed border-[var(--color-border)] rounded-xl flex flex-col items-center text-center gap-2 bg-white/[0.01]">
          <Inbox className="w-5 h-5 text-[var(--color-text-muted)]" />
          <p className="text-[13px] text-[var(--color-text-muted)]">No {statusLabel} submissions</p>
        </div>
      )}
    </section>
  )
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default async function SubmissionsPage() {
  const session = await auth()
  const user = session?.user as { id: string; role: 'developer' | 'owner' } | undefined

  if (!user) return null

  const isOwner = user.role === 'owner'

  // ─── Owner View: All developer submissions to owner's tasks ──────────
  if (isOwner) {
    let ownerSubmissions: OwnerSubmissionItem[] = []
    try {
      const rows = await db
        .select({
          taskId: tasks.id,
          taskTitle: tasks.title,
          taskBudget: tasks.budget,
          developerName: users.name,
          githubLink: submissions.githubLink,
          note: submissions.note,
          status: submissions.status,
          submittedAt: submissions.createdAt,
        })
        .from(submissions)
        .innerJoin(tasks, eq(submissions.taskId, tasks.id))
        .innerJoin(users, eq(submissions.developerId, users.id))
        .where(eq(tasks.clientId, user.id))
        .orderBy(desc(submissions.createdAt))

      ownerSubmissions = rows as OwnerSubmissionItem[]
    } catch (e) {
      console.error('Failed to query owner submissions:', e)
    }

    const pending  = ownerSubmissions.filter(s => s.status === 'pending')
    const approved = ownerSubmissions.filter(s => s.status === 'approved')
    const rejected = ownerSubmissions.filter(s => s.status === 'rejected')

    return (
      <div className="flex flex-col h-full bg-transparent text-white font-sans">
        <TopBar title="Submissions" />
        <div className="flex-grow overflow-y-auto">
         <div className="mx-auto max-w-5xl px-5 md:px-8 py-6 md:py-8 space-y-6 w-full select-none">

          <div className="space-y-1 text-left">
            <h2 className="text-xl md:text-2xl font-medium text-white tracking-tight">
              Incoming submissions
            </h2>
            <p className="text-sm text-[var(--color-text-muted)] max-w-xl leading-relaxed">
              Review work submitted by developers on your tasks. Approve or request revisions from here.
            </p>
          </div>

          {/* Summary strip */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Awaiting review', count: pending.length, color: 'text-amber-400', bg: 'bg-amber-500/[0.07] border-amber-500/20' },
              { label: 'Approved',        count: approved.length, color: 'text-emerald-400', bg: 'bg-emerald-500/[0.07] border-emerald-500/20' },
              { label: 'Revision sent',   count: rejected.length, color: 'text-red-400', bg: 'bg-red-500/[0.07] border-red-500/20' },
            ].map(({ label, count, color, bg }) => (
              <div key={label} className={cn('p-4 rounded-xl border text-left', bg)}>
                <p className="text-xs text-white/50">{label}</p>
                <h4 className={cn('text-2xl font-semibold tabular-nums mt-1', color)}>{count}</h4>
              </div>
            ))}
          </div>

          <div className="space-y-8 pt-2 pb-16">
            <OwnerSection
              title="Awaiting your review"
              items={pending}
              icon={Clock}
              colorClass="bg-amber-500/10 border-amber-500/20 text-amber-400"
              statusLabel="pending review"
              badgeColor="bg-amber-500/10 border border-amber-500/20 text-amber-400"
            />
            <OwnerSection
              title="Revision requested"
              items={rejected}
              icon={AlertCircle}
              colorClass="bg-red-500/10 border-red-500/20 text-red-400"
              statusLabel="revision"
              badgeColor="bg-red-500/10 border border-red-500/20 text-red-400"
            />
            <OwnerSection
              title="Approved & settled"
              items={approved}
              icon={CheckCircle2}
              colorClass="bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              statusLabel="completed"
              badgeColor="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
            />
          </div>
         </div>
        </div>
      </div>
    )
  }

  // ─── Developer View ──────────────────────────────────────────────────────
  const devSubmissions = await getSubmissionsByDeveloper(user.id)
  const pending  = devSubmissions.filter(s => s.submission.status === 'pending')
  const approved = devSubmissions.filter(s => s.submission.status === 'approved')
  const rejected = devSubmissions.filter(s => s.submission.status === 'rejected')

  return (
    <div className="flex flex-col h-full bg-transparent text-white font-sans">
      <TopBar title="Submissions" />
      <div className="flex-grow overflow-y-auto">
        <div className="mx-auto max-w-5xl px-5 md:px-8 py-6 md:py-8 space-y-6 w-full select-none">

        <div className="space-y-1 text-left">
          <h2 className="text-xl md:text-2xl font-medium text-white tracking-tight">
            Submission history
          </h2>
          <p className="text-sm text-[var(--color-text-muted)] max-w-xl leading-relaxed">
            Track status, review cycles, and completed payouts for all your claimed tasks.
          </p>
        </div>

        <div className="space-y-8 pt-2 pb-16">
          <DevSection
            title="Active reviews"
            items={pending}
            icon={Clock}
            colorClass="bg-amber-500/10 border-amber-500/20 text-amber-400"
            statusLabel="pending"
            badgeColor="bg-amber-500/10 border border-amber-500/20 text-amber-400"
          />
          <DevSection
            title="Revision requested"
            items={rejected}
            icon={AlertCircle}
            colorClass="bg-red-500/10 border-red-500/20 text-red-400"
            statusLabel="revision"
            badgeColor="bg-red-500/10 border border-red-500/20 text-red-400"
          />
          <DevSection
            title="Completed work"
            items={approved}
            icon={CheckCircle2}
            colorClass="bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
            statusLabel="completed"
            badgeColor="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
          />
        </div>
        </div>
      </div>
    </div>
  )
}
