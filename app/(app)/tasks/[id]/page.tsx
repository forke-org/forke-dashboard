import React from 'react'
import { auth } from '@/auth'
import { getTaskById, getLatestRevisionRequest } from '@/lib/db/queries/tasks'
import { 
  getLevelFromXp, 
  getRequiredLevel 
} from '@/lib/utils/xp'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ClaimButton from '@/components/tasks/ClaimButton'
import SubmitWorkForm from '@/components/tasks/SubmitWorkForm'
import DeleteTaskButton from '@/components/tasks/DeleteTaskButton'
import TopBar from '@/components/shared/TopBar'
import { Calendar, User, Clock, ArrowLeft, AlertCircle, CheckCircle2, Coins, ChevronRight } from 'lucide-react'

function timeAgo(date: Date) {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  
  let interval = seconds / 31536000
  if (interval > 1) return Math.floor(interval) + ' years ago'
  interval = seconds / 2592000
  if (interval > 1) return Math.floor(interval) + ' months ago'
  interval = seconds / 86400
  if (interval > 1) return Math.floor(interval) + ' days ago'
  interval = seconds / 3600
  if (interval > 1) return Math.floor(interval) + ' hours ago'
  interval = seconds / 60
  return Math.floor(interval) + ' minutes ago'
}

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  const currentUser = session?.user as { id: string; role: 'developer' | 'owner'; level: number; xp: number } | undefined
  const taskResult = await getTaskById(id)

  if (!taskResult) notFound()

  const { task, clientName, claimantName } = taskResult
  const isClaimedByMe = task.claimantId === currentUser?.id
  const isClaimedByOther = task.status !== 'open' && !isClaimedByMe
  const isDeveloper = currentUser?.role === 'developer'
  
  const userLevel = getLevelFromXp(currentUser?.xp || 0)
  const requiredLevel = getRequiredLevel(task.skillTags ?? [])
  const isLevelLocked = isDeveloper && userLevel < requiredLevel
  const revisionRequest = isClaimedByMe && task.status === 'claimed' ? await getLatestRevisionRequest(task.id) : null

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg)] text-white font-sans">
      <TopBar title="Task" />

      <div className="flex-grow overflow-y-auto">
       <div className="mx-auto max-w-5xl px-5 md:px-8 py-6 md:py-8 space-y-6 select-none w-full">
        {/* Back Link */}
        <div className="text-left">
          <Link href="/tasks" className="inline-flex items-center gap-1.5 text-[var(--color-text-muted)] hover:text-white transition-colors text-[13px] group">
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back to tasks
          </Link>
        </div>

        {/* State Banner - Top Level */}
        {task.status === 'submitted' && (isClaimedByMe || currentUser?.role === 'owner') && (
          <div className="p-4 bg-amber-500/[0.07] border border-amber-500/20 rounded-xl flex items-center gap-3 text-left">
            <div className="w-9 h-9 rounded-lg bg-amber-500/15 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <Clock className="w-[18px] h-[18px]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white leading-tight">Work submitted</h3>
              <p className="text-[13px] text-amber-400/80 mt-0.5">Under review by the client.</p>
            </div>
          </div>
        )}

        {task.status === 'approved' && (
          <div className="p-4 bg-emerald-500/[0.07] border border-emerald-500/20 rounded-xl flex items-center justify-between gap-3 text-left">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <CheckCircle2 className="w-[18px] h-[18px]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white leading-tight">Task approved</h3>
                <p className="text-[13px] text-emerald-400/80 mt-0.5">Payout released successfully.</p>
              </div>
            </div>
            <span className="px-2.5 py-1 text-[11px] font-medium rounded bg-emerald-500/15 border border-emerald-500/20 text-emerald-400">
              Completed
            </span>
          </div>
        )}

        {/* Form Section - When Claimed by Me and not submitted */}
        {isClaimedByMe && task.status === 'claimed' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-left">
             <div className="lg:col-span-7 rounded-xl border border-[var(--color-border)] bg-white/[0.018] p-6 space-y-6">
                 {revisionRequest && (
                   <div className="bg-red-500/[0.07] border border-red-500/20 rounded-xl p-4 space-y-3">
                     <div className="flex items-center gap-2 text-red-400 font-medium text-[13px]">
                       <AlertCircle className="w-4 h-4" />
                       Revision requested
                     </div>
                     <div className="p-3.5 bg-white/[0.01] rounded-lg border border-red-500/15 text-white/80 text-[13px]">
                       &ldquo;{revisionRequest.clientNote}&rdquo;
                     </div>
                   </div>
                 )}

                 <div className="space-y-3">
                   <span className="text-[11px] uppercase tracking-wider text-accent font-semibold px-2 py-0.5 rounded bg-accent/10 border border-accent/20">
                     Active Quest
                   </span>
                   <h1 className="text-xl md:text-2xl font-semibold text-white leading-tight tracking-tight pt-2">
                     {task.title}
                   </h1>
                 </div>

                 <div className="space-y-2 border-t border-white/5 pt-5">
                   <h3 className="text-xs uppercase tracking-wider text-[var(--color-text-muted)] font-medium">
                     Description
                   </h3>
                   <p className="text-[13px] md:text-sm text-white/65 leading-relaxed whitespace-pre-wrap">
                     {task.description}
                   </p>
                 </div>

                 <div className="space-y-3 border-t border-white/5 pt-5">
                   <h3 className="text-xs uppercase tracking-wider text-[var(--color-text-muted)] font-medium">
                     Skill tags
                   </h3>
                   <div className="flex flex-wrap gap-1.5">
                     {task.skillTags?.map(tag => (
                       <span key={tag} className="px-2 py-1 bg-white/[0.04] border border-[var(--color-border)] text-white/80 text-[11px] font-medium rounded-lg">
                         {tag}
                       </span>
                     ))}
                   </div>
                 </div>
             </div>

              <div className="lg:col-span-5 space-y-4">
                {/* Owner Profile Card */}
                <Link
                  href={`/profile/${task.clientId}`}
                  className="group flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.018] border border-[var(--color-border)] hover:border-accent/40 hover:bg-accent/[0.03] transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0 group-hover:bg-accent/20 transition-colors">
                      <User className="w-4 h-4 text-accent" />
                    </div>
                    <div className="flex flex-col text-left leading-tight">
                      <span className="text-[11px] text-[var(--color-text-muted)] font-mono uppercase tracking-wider">Client</span>
                      <span className="text-white/85 font-medium text-[13px] group-hover:text-accent transition-colors font-semibold">
                        {clientName}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-accent/70 group-hover:text-accent transition-colors font-medium">
                    <span>Profile</span>
                    <ChevronRight className="w-3.5 h-3.5 translate-x-0 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Link>

                {/* Submit Work Form */}
                <div className="rounded-xl border border-[var(--color-border)] bg-white/[0.018] p-5 space-y-5">
                   <div className="space-y-2.5">
                     <h2 className="text-base font-semibold text-white">Submit your work</h2>
                     <ul className="space-y-1.5">
                        <li className="flex items-center gap-2 text-[13px] text-[var(--color-text-muted)]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-accent" /> Source code pushed to GitHub
                        </li>
                        <li className="flex items-center gap-2 text-[13px] text-[var(--color-text-muted)]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-accent" /> All requirements met
                        </li>
                     </ul>
                   </div>

                   <SubmitWorkForm taskId={task.id} />
                </div>
              </div>
           </div>
        )}

        {/* Standard Layout - Otherwise */}
        {(task.status !== 'claimed' || !isClaimedByMe) && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start text-left">
            <div className="lg:col-span-2 rounded-xl border border-[var(--color-border)] bg-white/[0.018] p-6 space-y-6">
              <div className="space-y-3">
                <span className="text-[11px] uppercase tracking-wider text-accent font-semibold px-2 py-0.5 rounded bg-accent/10 border border-accent/20">
                  Mission Briefing
                </span>
                <h1 className="text-xl md:text-2xl font-semibold text-white leading-tight tracking-tight pt-2">
                  {task.title}
                </h1>
              </div>

              <div className="space-y-2 border-t border-white/5 pt-5">
                <h3 className="text-xs uppercase tracking-wider text-[var(--color-text-muted)] font-medium">
                  Objective & Description
                </h3>
                <p className="text-[13px] md:text-sm text-white/70 leading-relaxed whitespace-pre-wrap">
                  {task.description}
                </p>
              </div>

              <div className="space-y-3 border-t border-white/5 pt-5">
                <h3 className="text-xs uppercase tracking-wider text-[var(--color-text-muted)] font-medium">
                  Required Skillset
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {task.skillTags?.map(tag => (
                    <span key={tag} className="px-2 py-1 bg-white/[0.04] border border-[var(--color-border)] text-white/80 text-[11px] font-medium rounded-lg">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <aside className="space-y-4">
               <div className="rounded-xl border border-[var(--color-border)] bg-white/[0.018] p-5 space-y-5 sticky top-20">
                  <div className="space-y-1">
                     <span className="text-xs text-[var(--color-text-muted)]">Budget</span>
                     <div className="text-3xl font-semibold tabular-nums text-accent flex items-baseline gap-0.5">
                       <span className="text-lg">₹</span>
                       {Math.floor(task.budget / 100).toLocaleString()}
                     </div>
                  </div>

                  <div className="space-y-2 text-[13px]">
                    {/* For Developer: show Owner (Client) profile */}
                    {isDeveloper && (
                      <Link
                        href={`/profile/${task.clientId}`}
                        className="group flex items-center justify-between px-2.5 py-2.5 rounded-lg bg-white/[0.02] border border-[var(--color-border)] hover:border-accent/40 hover:bg-accent/[0.03] transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0 group-hover:bg-accent/20 transition-colors">
                            <User className="w-4 h-4 text-accent" />
                          </div>
                          <div className="flex flex-col text-left leading-tight">
                            <span className="text-[11px] text-[var(--color-text-muted)] font-mono uppercase tracking-wider">Client</span>
                            <span className="text-white/85 font-medium text-[13px] group-hover:text-accent transition-colors font-semibold">
                              {clientName}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-accent/70 group-hover:text-accent transition-colors font-medium">
                          <span>Profile</span>
                          <ChevronRight className="w-3.5 h-3.5 translate-x-0 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </Link>
                    )}

                    {/* For Owner: show Developer profile if claimed */}
                    {!isDeveloper && task.claimantId && claimantName && (
                      <Link
                        href={`/profile/${task.claimantId}`}
                        className="group flex items-center justify-between px-2.5 py-2.5 rounded-lg bg-white/[0.02] border border-[var(--color-border)] hover:border-accent/40 hover:bg-accent/[0.03] transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0 group-hover:bg-accent/20 transition-colors">
                            <User className="w-4 h-4 text-accent" />
                          </div>
                          <div className="flex flex-col text-left leading-tight">
                            <span className="text-[11px] text-[var(--color-text-muted)] font-mono uppercase tracking-wider">Developer</span>
                            <span className="text-white/85 font-medium text-[13px] group-hover:text-accent transition-colors font-semibold">
                              {claimantName}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-accent/70 group-hover:text-accent transition-colors font-medium">
                          <span>Profile</span>
                          <ChevronRight className="w-3.5 h-3.5 translate-x-0 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </Link>
                    )}

                    {task.deadline && (
                      <div className="flex items-center gap-3 px-2.5 py-2 rounded-lg bg-white/[0.02] border border-[var(--color-border)]">
                        <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                          <Calendar className="w-4 h-4 text-accent" />
                        </div>
                        <div className="flex flex-col text-left leading-none">
                          <span className="text-[11px] text-[var(--color-text-muted)]">Deadline</span>
                          <span className="text-white/85 font-medium mt-1 text-[13px]">{new Date(task.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3 px-2.5 py-2 rounded-lg bg-white/[0.02] border border-[var(--color-border)]">
                      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                        <Clock className="w-4 h-4 text-accent" />
                      </div>
                      <div className="flex flex-col text-left leading-none">
                        <span className="text-[11px] text-[var(--color-text-muted)]">Posted</span>
                        <span className="text-white/85 font-medium mt-1 text-[13px]">{timeAgo(task.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {task.status === 'open' && isDeveloper && (
                    <div className="pt-4 border-t border-[var(--color-border)]">
                      <ClaimButton
                        taskId={task.id}
                        isLocked={false}
                        requiredLevel={0}
                      />
                    </div>
                  )}

                  {task.clientId === currentUser?.id && (
                    <div className="pt-4 border-t border-[var(--color-border)]">
                      <DeleteTaskButton
                        taskId={task.id}
                        isClaimed={task.status !== 'open'}
                      />
                    </div>
                  )}

                  {isClaimedByOther && (
                    <div className="pt-4 border-t border-[var(--color-border)] flex items-center gap-2 text-amber-500 font-medium text-[13px]">
                       <AlertCircle className="w-4 h-4" />
                       Claimed by {claimantName?.split(' ')[0]}
                    </div>
                  )}
               </div>
            </aside>
          </div>
        )}
       </div>
      </div>
    </div>
  )
}
