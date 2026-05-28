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
    <div className="bg-[#0b0b0e] border border-white/[0.04] rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-accent/30 transition-all shadow-lg relative overflow-hidden group select-none">
      <div className="absolute inset-0 bg-gradient-to-r from-accent/[0.005] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      <div className="flex-grow space-y-3 min-w-0 text-left relative z-10">
        <div className="flex items-start gap-3 flex-wrap">
          <h4 className="text-base font-serif text-white truncate">{item.taskTitle}</h4>
          <span className={cn('px-2 py-0.5 text-[8px] font-black font-mono rounded uppercase tracking-wider border shrink-0', s.color)}>
            {s.label}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[10px] font-black uppercase tracking-wider text-white/40 font-mono">
          <div className="flex items-center gap-1.5 text-accent font-bold">
            <Wallet className="w-3.5 h-3.5" />
            ₹{budgetInRupees.toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" />
            {item.developerName || 'Unknown Dev'}
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
          <p className="text-[10px] text-white/40 font-light italic line-clamp-1 max-w-md">"{item.note}"</p>
        )}
      </div>

      <div className="flex items-center gap-3 relative z-10 shrink-0">
        <Link
          href={`/tasks/${item.taskId}`}
          className="h-10 px-4 text-[9px] font-black uppercase tracking-widest border border-accent/20 rounded-xl bg-accent/5 text-accent hover:bg-accent hover:text-[#050505] transition-all flex items-center gap-1.5 cursor-pointer font-bold"
        >
          <Eye className="w-3.5 h-3.5" /> Review <ChevronRight className="w-3.5 h-3.5 stroke-[3px]" />
        </Link>
      </div>
    </div>
  )
}

// ─── Developer Row ──────────────────────────────────────────────────────────

function DevSubmissionRow({ item }: { item: DevSubmissionItem }) {
  const budgetInRupees = Math.floor(item.taskBudget / 100)
  return (
    <div className="bg-[#0b0b0e] border border-white/[0.04] rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-accent/30 transition-all shadow-lg relative overflow-hidden group select-none">
      <div className="absolute inset-0 bg-gradient-to-r from-accent/[0.005] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      <div className="flex-grow space-y-3 min-w-0 text-left relative z-10">
        <h4 className="text-lg font-serif text-white truncate">{item.taskTitle}</h4>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[10px] font-black uppercase tracking-wider text-white/40 font-mono">
          <div className="flex items-center gap-1.5 text-accent font-bold">
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
      <div className="flex items-center gap-4 relative z-10 shrink-0">
        <Link
          href={`/tasks/${item.submission.taskId}`}
          className="h-10 px-4 text-[9px] font-black uppercase tracking-widest border border-accent/20 rounded-xl bg-accent/5 text-accent hover:bg-accent hover:text-[#050505] transition-all flex items-center gap-1.5 cursor-pointer font-bold"
        >
          View Task <ChevronRight className="w-3.5 h-3.5 stroke-[3px]" />
        </Link>
      </div>
    </div>
  )
}

// ─── Section wrappers ───────────────────────────────────────────────────────

function OwnerSection({ title, items, icon: Icon, colorClass, statusLabel, badgeColor }: {
  title: string; items: OwnerSubmissionItem[]; icon: React.ElementType; colorClass: string; statusLabel: string; badgeColor: string
}) {
  return (
    <section className="space-y-6 text-left">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center border', colorClass)}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-serif text-white tracking-wide">{title}</h3>
            <p className="text-[9px] text-white/30 font-black uppercase tracking-widest mt-0.5 font-mono">{statusLabel} queue</p>
          </div>
        </div>
        <span className={cn('px-3 py-1 text-[9px] font-black font-mono rounded-full uppercase tracking-widest', badgeColor)}>
          {items.length} {items.length === 1 ? 'Entry' : 'Entries'}
        </span>
      </div>
      {items.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {items.map((s, i) => <OwnerSubmissionRow key={`${s.taskId}-${i}`} item={s} />)}
        </div>
      ) : (
        <div className="p-12 border border-white/[0.04] rounded-[2rem] flex flex-col items-center text-center gap-3 bg-[#0b0b0e]/50">
          <Inbox className="w-6 h-6 text-white/20" />
          <p className="text-[9px] font-black uppercase tracking-[0.25em] text-white/20 font-mono">No {statusLabel} submissions</p>
        </div>
      )}
    </section>
  )
}

function DevSection({ title, items, icon: Icon, colorClass, statusLabel, badgeColor }: {
  title: string; items: DevSubmissionItem[]; icon: React.ElementType; colorClass: string; statusLabel: string; badgeColor: string
}) {
  return (
    <section className="space-y-6 text-left">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center border', colorClass)}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-serif text-white tracking-wide">{title}</h3>
            <p className="text-[9px] text-white/30 font-black uppercase tracking-widest mt-0.5 font-mono">{statusLabel} operations queue</p>
          </div>
        </div>
        <span className={cn('px-3 py-1 text-[9px] font-black font-mono rounded-full uppercase tracking-widest', badgeColor)}>
          {items.length} {items.length === 1 ? 'Entry' : 'Entries'}
        </span>
      </div>
      {items.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {items.map((s) => <DevSubmissionRow key={s.submission.id} item={s} />)}
        </div>
      ) : (
        <div className="p-12 border border-white/[0.04] rounded-[2rem] flex flex-col items-center text-center gap-3 bg-[#0b0b0e]/50">
          <Inbox className="w-6 h-6 text-white/20" />
          <p className="text-[9px] font-black uppercase tracking-[0.25em] text-white/20 font-mono">No {statusLabel} submissions</p>
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
      <div className="flex flex-col h-full bg-[#060608] text-white font-sans">
        <TopBar title="Developer Submissions" />
        <div className="flex-grow p-6 md:p-8 overflow-y-auto space-y-12 max-w-5xl mx-auto w-full select-none">

          <div className="space-y-3 text-left">
            <h2 className="font-serif text-3xl md:text-5xl text-white tracking-tight">
              Incoming <span className="text-accent italic">Submissions</span>
            </h2>
            <p className="text-white/50 text-xs md:text-sm font-light max-w-xl leading-relaxed">
              Review work submitted by developers on your missions. Approve, request revisions, or dispute submissions from this command panel.
            </p>
          </div>

          {/* Summary strip */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Awaiting Review', count: pending.length, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
              { label: 'Approved',        count: approved.length, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
              { label: 'Revision Sent',   count: rejected.length, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
            ].map(({ label, count, color, bg }) => (
              <div key={label} className={cn('p-4 rounded-2xl border text-left', bg)}>
                <p className="text-[8px] font-black uppercase tracking-widest font-mono text-white/40">{label}</p>
                <h4 className={cn('text-2xl font-mono font-bold mt-1', color)}>{count}</h4>
              </div>
            ))}
          </div>

          <div className="space-y-12 pt-2 pb-16">
            <OwnerSection
              title="Awaiting Your Review"
              items={pending}
              icon={Clock}
              colorClass="bg-amber-500/10 border-amber-500/20 text-amber-400"
              statusLabel="pending review"
              badgeColor="bg-amber-500/10 border border-amber-500/20 text-amber-400"
            />
            <OwnerSection
              title="Revision Requested"
              items={rejected}
              icon={AlertCircle}
              colorClass="bg-red-500/10 border-red-500/20 text-red-400"
              statusLabel="revision"
              badgeColor="bg-red-500/10 border border-red-500/20 text-red-400"
            />
            <OwnerSection
              title="Approved & Settled"
              items={approved}
              icon={CheckCircle2}
              colorClass="bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              statusLabel="completed"
              badgeColor="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
            />
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
    <div className="flex flex-col h-full bg-[#060608] text-white font-sans">
      <TopBar title="My Submissions" />
      <div className="flex-grow p-6 md:p-8 overflow-y-auto space-y-12 max-w-5xl mx-auto w-full select-none">

        <div className="space-y-3 text-left">
          <h2 className="font-serif text-3xl md:text-5xl text-white tracking-tight">
            Submission <span className="text-accent italic">History</span>
          </h2>
          <p className="text-white/50 text-xs md:text-sm font-light max-w-xl leading-relaxed">
            Track status, review cycles, and completed payouts for all your claimed missions.
          </p>
        </div>

        <div className="space-y-12 pt-2 pb-16">
          <DevSection
            title="Active Reviews"
            items={pending}
            icon={Clock}
            colorClass="bg-amber-500/10 border-amber-500/20 text-amber-400"
            statusLabel="pending"
            badgeColor="bg-amber-500/10 border border-amber-500/20 text-amber-400"
          />
          <DevSection
            title="Revision Requested"
            items={rejected}
            icon={AlertCircle}
            colorClass="bg-red-500/10 border-red-500/20 text-red-400"
            statusLabel="revision"
            badgeColor="bg-red-500/10 border border-red-500/20 text-red-400"
          />
          <DevSection
            title="Completed Work"
            items={approved}
            icon={CheckCircle2}
            colorClass="bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
            statusLabel="completed"
            badgeColor="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
          />
        </div>
      </div>
    </div>
  )
}
