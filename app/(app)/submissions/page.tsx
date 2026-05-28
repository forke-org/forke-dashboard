import { auth } from '@/auth'
import { getSubmissionsByDeveloper } from '@/lib/db/queries/tasks'
import TopBar from '@/components/shared/TopBar'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Clock, GitPullRequest, ChevronRight, CheckCircle2, AlertCircle, Inbox, Wallet } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

type SubmissionItem = Awaited<ReturnType<typeof getSubmissionsByDeveloper>>[number]

function SubmissionRow({ item }: { item: SubmissionItem }) {
  const budgetInRupees = Math.floor(item.taskBudget / 100)
  return (
    <div className="bg-[#0b0b0e] border border-white/[0.04] rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-accent/30 transition-all shadow-lg relative overflow-hidden group select-none">
      <div className="absolute inset-0 bg-gradient-to-r from-accent/[0.005] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      <div className="flex-grow space-y-3 min-w-0 text-left relative z-10">
        <h4 className="text-lg font-serif text-white truncate">
          {item.taskTitle}
        </h4>
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

function Section({ title, items, icon: Icon, colorClass, statusLabel, badgeColor }: { title: string, items: SubmissionItem[], icon: React.ElementType, colorClass: string, statusLabel: string, badgeColor: string }) {
  return (
    <section className="space-y-6 text-left">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center border", colorClass)}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-serif text-white tracking-wide">{title}</h3>
            <p className="text-[9px] text-white/30 font-black uppercase tracking-widest mt-0.5 font-mono">{statusLabel} operations queue</p>
          </div>
        </div>
        <span className={cn("px-3 py-1 text-[9px] font-black font-mono rounded-full uppercase tracking-widest", badgeColor)}>
          {items.length} Entries
        </span>
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {items.map((s) => <SubmissionRow key={s.submission.id} item={s} />)}
        </div>
      ) : (
        <div className="p-12 border border-white/[0.04] rounded-[2rem] flex flex-col items-center text-center gap-3 bg-[#0b0b0e]/50 relative overflow-hidden">
          <Inbox className="w-6 h-6 text-white/20" />
          <p className="text-[9px] font-black uppercase tracking-[0.25em] text-white/20 font-mono">No {statusLabel} submissions</p>
        </div>
      )}
    </section>
  )
}

export default async function SubmissionsPage() {
  const session = await auth()
  const user = session?.user as { id: string; role: 'developer' | 'owner' } | undefined

  if (!user || user.role === 'owner') {
    redirect('/dashboard')
  }

  const submissions = await getSubmissionsByDeveloper(user.id)

  const pending = submissions.filter(s => s.submission.status === 'pending')
  const approved = submissions.filter(s => s.submission.status === 'approved')
  const rejected = submissions.filter(s => s.submission.status === 'rejected')

  return (
    <div className="flex flex-col h-full bg-[#060608] text-white font-sans">
      <TopBar title="My Submissions" />
      <div className="flex-grow p-6 md:p-8 overflow-y-auto space-y-12 max-w-5xl mx-auto w-full select-none">
        
        {/* Hero title */}
        <div className="space-y-3 text-left">
          <h2 className="font-serif text-3xl md:text-5xl text-white tracking-tight">
            Submission <span className="text-accent italic">History</span>
          </h2>
          <p className="text-white/50 text-xs md:text-sm font-light max-w-xl leading-relaxed">
            Track status, review cycles, and completed payouts for all your claimed micro-tasks.
          </p>
        </div>

        <div className="space-y-12 pt-2 pb-16">
          <Section 
            title="Active Reviews" 
            items={pending} 
            icon={Clock} 
            colorClass="bg-amber-500/10 border-amber-500/20 text-amber-400"
            statusLabel="pending"
            badgeColor="bg-amber-500/10 border border-amber-500/20 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.05)]"
          />

          <Section 
            title="Revision Requested" 
            items={rejected} 
            icon={AlertCircle} 
            colorClass="bg-red-500/10 border-red-500/20 text-red-400"
            statusLabel="revision"
            badgeColor="bg-red-500/10 border border-red-500/20 text-red-400"
          />

          <Section 
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
