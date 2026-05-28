'use client'

import React, { useState, useTransition } from 'react'
import { approveSubmission, requestRevision } from '@/lib/actions/tasks'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'
import { CheckCircle2, GitPullRequest, ExternalLink, MessageCircle, Clock, User, Star } from 'lucide-react'

import { cn } from '@/lib/utils/cn'
import { LevelUpModal } from '@/components/ui/LevelUpModal'

interface ReviewCardProps {
  task: {
    id: string
    title: string
    budget: number
  }
  submission: {
    id: string
    githubLink: string
    note: string | null
    createdAt: Date
  }
  claimantName: string
}

export default function ReviewCard({ task, submission, claimantName }: ReviewCardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showRevisionInput, setShowRevisionInput] = useState(false)
  const [revisionNote, setRevisionNote] = useState('')
  const [rating, setRating] = useState<number | null>(null)
  const [hovered, setHovered] = useState<number | null>(null)
  const [newLevelInfo, setNewLevelInfo] = useState<number | null>(null)

  const handleApprove = async (selectedRating: number) => {
    if (!confirm(`Are you sure you want to approve this work with a ${selectedRating}-star rating?`)) return
    
    startTransition(async () => {
      try {
        const result = await approveSubmission(task.id, selectedRating)
        if (result && result.leveledUp) {
          setNewLevelInfo(result.newLevel)
        } else {
          router.refresh()
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to approve submission.'
        alert(message)
      }
    })
  }

  const handleRevision = async () => {
    if (!revisionNote) return
    
    startTransition(async () => {
      try {
        await requestRevision(task.id, revisionNote)
        router.refresh()
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to request revision.'
        alert(message)
      }
    })
  }

  return (
    <div className="ui-surface rounded-3xl p-8 space-y-8 hover:border-accent/40 transition-all duration-300 group relative overflow-hidden text-left select-none">
      <div className="absolute inset-0 bg-gradient-to-r from-accent/[0.005] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
        <div className="space-y-4 flex-1">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent border border-accent/20 shadow-[0_0_15px_rgba(255,122,0,0.15)]">
               <GitPullRequest className="w-6 h-6" />
             </div>
             <div>
               <h3 className="text-xl font-serif text-white leading-none tracking-tight">
                 {task.title}
               </h3>
               <div className="flex items-center gap-2 mt-2.5 text-[9px] font-semibold text-white/40 uppercase tracking-[0.12em] leading-none">
                 <User className="w-3.5 h-3.5 text-accent" />
                 Submitted by <span className="text-white font-bold">{claimantName}</span>
               </div>
             </div>
          </div>
          
          <div className="flex items-center gap-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {new Date(submission.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="w-1 h-1 rounded-full bg-white/10" />
            <div className="text-accent font-bold">₹ {Math.floor(task.budget / 100).toLocaleString()}</div>
          </div>
        </div>

        <a 
          href={submission.githubLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-4 px-5 py-3 bg-white/[0.01] border border-white/5 hover:border-accent/40 rounded-2xl transition-all group/link shrink-0 cursor-pointer"
        >
          <div className="flex flex-col text-left">
            <span className="text-[8px] font-semibold text-white/35 uppercase tracking-[0.12em] leading-none mb-1.5">Source Code</span>
            <span className="text-xs text-white/80 group-hover/link:text-accent transition-colors truncate max-w-[200px]">
              {submission.githubLink.replace('https://', '')}
            </span>
          </div>
          <ExternalLink className="w-4 h-4 text-white/30 group-hover/link:text-accent group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-all" />
        </a>
      </div>

      {submission.note && (
        <div className="relative p-6 bg-accent/5 border-l-4 border-accent rounded-r-2xl text-left z-10">
          <MessageCircle className="absolute -top-3 -right-3 w-8 h-8 text-accent/15" />
          <p className="text-white/80 leading-relaxed italic text-xs font-medium font-sans">
            &ldquo;{submission.note}&rdquo;
          </p>
        </div>
      )}

      {showRevisionInput ? (
        <div className="space-y-4 animate-in slide-in-from-top-2 duration-300 relative z-10">
           <div className="space-y-2 text-left">
             <label className="text-[9px] font-semibold text-white/40 uppercase tracking-[0.12em] pl-1">What needs to be fixed?</label>
             <textarea 
               autoFocus
               value={revisionNote}
               onChange={(e) => setRevisionNote(e.target.value)}
               placeholder="Be specific. e.g. 'The API endpoint returns 404 for empty results, should return 200 []'"
               className="w-full bg-white/[0.01] border border-white/5 rounded-2xl p-4 text-xs font-medium text-white placeholder:text-white/20 transition-all focus:outline-none focus:border-accent min-h-[100px] resize-none"
             />
           </div>
           <div className="flex gap-3">
             <Button 
               onClick={handleRevision} 
               disabled={isPending || !revisionNote}
               className="flex-1 h-12 text-[10px] font-semibold uppercase tracking-[0.12em] rounded-xl ui-btn-primary transition-all cursor-pointer"
             >
               SEND REVISION REQUEST
             </Button>
             <Button 
               variant="outline" 
               onClick={() => setShowRevisionInput(false)}
               className="px-6 h-12 text-[10px] font-semibold uppercase tracking-[0.12em] rounded-xl ui-btn-secondary transition-all cursor-pointer"
             >
               CANCEL
             </Button>
           </div>
         </div>
      ) : (
        <div className="space-y-8 relative z-10">
          <div className="p-6 bg-white/[0.005] rounded-[2rem] border border-white/[0.03] space-y-4 text-center">
            <div className="flex items-center justify-between">
              <label className="text-[9px] font-semibold text-white/35 uppercase tracking-[0.12em]">Quality Rating</label>
              {rating && (
                <span className="text-[9px] font-semibold text-accent uppercase tracking-[0.12em] animate-in fade-in slide-in-from-right-1">
                  {['', 'Needs work', 'Below average', 'Good', 'Great', 'Outstanding'][rating]}
                </span>
              )}
            </div>
            <div className="flex items-center justify-center gap-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => setRating(star)}
                  className="p-1.5 transition-transform hover:scale-125 active:scale-95 duration-200 cursor-pointer"
                  aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                >
                  <svg
                    width="36" height="36" viewBox="0 0 24 24"
                    className="transition-colors duration-300"
                    fill={(hovered ?? rating ?? 0) >= star ? 'var(--color-accent)' : 'none'}
                    stroke={(hovered ?? rating ?? 0) >= star ? 'var(--color-accent)' : 'rgba(255,255,255,0.08)'}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              onClick={() => handleApprove(rating!)} 
              disabled={isPending || !rating}
              className={cn(
                "h-13 rounded-xl text-[10px] font-semibold uppercase tracking-[0.12em] transition-all cursor-pointer flex items-center justify-center gap-1.5",
                rating 
                  ? "ui-btn-primary" 
                  : "bg-white/[0.01] text-white/20 border border-white/5 cursor-not-allowed shadow-none"
              )}
            >
              <CheckCircle2 className="w-4 h-4 stroke-[2.5px]" />
              {rating ? 'APPROVE WORK' : 'RATE TO APPROVE'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowRevisionInput(true)}
              disabled={isPending}
              className="h-13 rounded-xl ui-btn-secondary transition-all font-semibold text-[10px] uppercase tracking-[0.12em] cursor-pointer flex items-center justify-center gap-1.5"
            >
              <GitPullRequest className="w-4 h-4" />
              REQUEST REVISION
            </Button>
          </div>
        </div>
      )}

      <LevelUpModal 
        newLevel={newLevelInfo} 
        onClose={() => setNewLevelInfo(null)} 
      />
    </div>
  )
}
