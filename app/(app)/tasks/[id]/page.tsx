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
import TopBar from '@/components/shared/TopBar'
import { Calendar, User, Clock, ArrowLeft, AlertCircle, CheckCircle2, Coins } from 'lucide-react'

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
    <div className="flex flex-col h-full bg-[#060608] text-white font-sans">
      <TopBar title="Mission Control" />
      
      <div className="flex-grow p-6 md:p-8 overflow-y-auto space-y-8 select-none max-w-6xl mx-auto w-full">
        {/* Back Link */}
        <div className="text-left">
          <Link href="/tasks" className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors text-[9px] font-black uppercase tracking-widest group font-mono">
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform stroke-[2.5px]" />
            Back to Missions
          </Link>
        </div>

        {/* State Banner - Top Level */}
        {task.status === 'submitted' && (isClaimedByMe || currentUser?.role === 'owner') && (
          <div className="p-6 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-3xl flex items-center gap-4 text-left shadow-lg animate-in fade-in duration-500">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-base font-serif text-white tracking-tight leading-tight">Work Submitted</h3>
              <p className="text-xs text-amber-400/80 font-light">Under review by the client. Verification node active.</p>
            </div>
          </div>
        )}

        {task.status === 'approved' && (
          <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 rounded-3xl flex items-center justify-between gap-4 text-left shadow-lg animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-base font-serif text-white tracking-tight leading-tight">Task Approved</h3>
                <p className="text-xs text-emerald-400/80 font-light">Audit complete. Payout disbursed successfully.</p>
              </div>
            </div>
            <span className="px-3.5 py-1 text-[8.5px] font-black font-mono rounded bg-emerald-500/15 border border-emerald-500/20 text-emerald-450 uppercase tracking-wider">
              Completed
            </span>
          </div>
        )}

        {/* Form Section - When Claimed by Me and not submitted */}
        {isClaimedByMe && task.status === 'claimed' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start text-left">
             <div className="lg:col-span-7 space-y-8">
                {revisionRequest && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-[2rem] p-6 space-y-4">
                    <div className="flex items-center gap-2 text-red-400 font-black uppercase tracking-widest text-[9px] font-mono">
                      <AlertCircle className="w-4 h-4" />
                      Revision Requested
                    </div>
                    <div className="p-5 bg-white/[0.005] rounded-2xl border border-red-500/15 italic text-white/80 text-xs">
                      &ldquo;{revisionRequest.clientNote}&rdquo;
                    </div>
                  </div>
                )}
                
                <div className="space-y-6">
                  <h1 className="font-serif text-3xl md:text-5xl text-white leading-tight tracking-tight">
                    {task.title}
                  </h1>
                  <p className="text-white/60 leading-relaxed text-xs md:text-sm font-light whitespace-pre-wrap">
                    {task.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-6 border-t border-white/[0.04]">
                    {task.skillTags?.map(tag => (
                      <span key={tag} className="px-2.5 py-1 bg-accent/10 border border-accent/15 text-accent text-[9px] font-bold rounded uppercase tracking-wider font-mono">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
             </div>

             <div className="lg:col-span-5">
               <div className="bg-[#0b0b0e] border border-white/[0.04] rounded-[2.5rem] p-6 md:p-8 shadow-2xl space-y-8">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-serif text-white tracking-tight">Submit Your Work</h2>
                    <ul className="space-y-2">
                       <li className="flex items-center gap-2 text-[10px] font-black uppercase text-white/30 tracking-wider font-mono">
                         <CheckCircle2 className="w-3.5 h-3.5 text-accent" /> Source code pushed to GitHub
                       </li>
                       <li className="flex items-center gap-2 text-[10px] font-black uppercase text-white/30 tracking-wider font-mono">
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start text-left">
            <div className="lg:col-span-2 space-y-6">
              <h1 className="font-serif text-3xl md:text-5xl text-white leading-tight tracking-tight">
                {task.title}
              </h1>

              <p className="text-white/70 leading-relaxed text-xs md:text-sm font-light whitespace-pre-wrap">
                {task.description}
              </p>

              <div className="flex flex-wrap gap-1.5 pt-6 border-t border-white/[0.04]">
                {task.skillTags?.map(tag => (
                  <span key={tag} className="px-2.5 py-1 bg-accent/10 border border-accent/15 text-accent text-[9px] font-bold rounded uppercase tracking-wider font-mono">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <aside className="space-y-6">
               <div className="bg-[#0b0b0e] border border-white/[0.04] rounded-[2.5rem] p-6 md:p-8 space-y-6 sticky top-24 shadow-2xl">
                  <div className="space-y-1">
                     <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.25em] font-mono">Bounty</span>
                     <div className="text-4xl font-mono font-bold text-accent flex items-baseline gap-1">
                       <span className="text-xl">₹</span>
                       {Math.floor(task.budget / 100).toLocaleString()}
                     </div>
                  </div>

                  <div className="space-y-4 text-xs font-mono">
                    <div className="flex items-center gap-3.5 p-2 rounded-2xl bg-white/[0.005] border border-white/[0.03]">
                      <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                        <User className="w-4.5 h-4.5 text-accent" />
                      </div>
                      <div className="flex flex-col text-left leading-none">
                        <span className="text-[7.5px] uppercase tracking-widest text-white/20 font-black">Client</span>
                        <span className="text-white/80 font-bold mt-1 text-[11px]">{clientName}</span>
                      </div>
                    </div>
                    
                    {task.deadline && (
                      <div className="flex items-center gap-3.5 p-2 rounded-2xl bg-white/[0.005] border border-white/[0.03]">
                        <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                          <Calendar className="w-4.5 h-4.5 text-accent" />
                        </div>
                        <div className="flex flex-col text-left leading-none">
                          <span className="text-[7.5px] uppercase tracking-widest text-white/20 font-black">Deadline</span>
                          <span className="text-white/80 font-bold mt-1 text-[11px]">{new Date(task.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-3.5 p-2 rounded-2xl bg-white/[0.005] border border-white/[0.03]">
                      <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                        <Clock className="w-4.5 h-4.5 text-accent" />
                      </div>
                      <div className="flex flex-col text-left leading-none">
                        <span className="text-[7.5px] uppercase tracking-widest text-white/20 font-black">Posted</span>
                        <span className="text-white/80 font-bold mt-1 text-[11px]">{timeAgo(task.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {task.status === 'open' && isDeveloper && (
                    <div className="pt-6 border-t border-white/[0.04]">
                      <ClaimButton 
                        taskId={task.id} 
                        isLocked={isLevelLocked} 
                        requiredLevel={requiredLevel} 
                      />
                    </div>
                  )}

                  {isClaimedByOther && (
                    <div className="pt-5 border-t border-white/[0.04] flex items-center gap-2 text-amber-500 font-black text-[9px] uppercase tracking-widest font-mono">
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
  )
}
