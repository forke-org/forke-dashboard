'use client'

/**
 * @fileoverview Forke Platform
 * @copyright (c) 2026 Forke Inc. (https://www.forke.space/)
 *
 * Source-Available License (Non-Commercial / Fair Source).
 * This source code is open for inspection, learning, and personal development.
 * Commercial use, hosting, or resale as a paid service without an explicit
 * commercial license from Forke Inc. is strictly prohibited.
 */

import React, { useState, useTransition } from 'react'
import { approveSubmission, requestRevision } from '@/lib/actions/tasks'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'
import { CheckCircle2, GitPullRequest, ExternalLink, Clock, User } from 'lucide-react'

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
    <div className="rounded-xl border border-[var(--color-border)] bg-white/[0.018] p-5 space-y-5 hover:border-white/[0.14] transition-colors text-left select-none">

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="space-y-2.5 flex-1 min-w-0">
          <div className="flex items-center gap-2.5">
             <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center text-accent border border-accent/20 shrink-0">
               <GitPullRequest className="w-[18px] h-[18px]" />
             </div>
             <div className="min-w-0">
               <h3 className="text-sm font-medium text-white leading-tight truncate">
                 {task.title}
               </h3>
               <div className="flex items-center gap-1.5 mt-1 text-xs text-[var(--color-text-muted)]">
                 <User className="w-3.5 h-3.5" />
                 Submitted by <span className="text-white font-medium">{claimantName}</span>
               </div>
             </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)] pl-0.5">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {new Date(submission.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="w-1 h-1 rounded-full bg-white/15" />
            <span className="text-accent font-medium tabular-nums">₹{Math.floor(task.budget / 100).toLocaleString()}</span>
          </div>
        </div>

        <a
          href={submission.githubLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 px-3 py-2 bg-white/[0.02] border border-[var(--color-border)] hover:border-white/[0.16] rounded-lg transition-colors group/link shrink-0 cursor-pointer"
        >
          <div className="flex flex-col text-left">
            <span className="text-[11px] text-[var(--color-text-muted)] leading-none mb-1">Source</span>
            <span className="text-xs text-white/85 group-hover/link:text-accent transition-colors truncate max-w-[180px]">
              {submission.githubLink.replace('https://', '')}
            </span>
          </div>
          <ExternalLink className="w-4 h-4 text-[var(--color-text-muted)] group-hover/link:text-accent transition-colors" />
        </a>
      </div>

      {submission.note && (
        <div className="p-3.5 bg-white/[0.02] border-l-2 border-accent rounded-r-lg text-left">
          <p className="text-[13px] text-white/80 leading-relaxed">
            &ldquo;{submission.note}&rdquo;
          </p>
        </div>
      )}

      {showRevisionInput ? (
        <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
           <div className="space-y-1.5 text-left">
             <label className="text-xs text-[var(--color-text-muted)] pl-0.5">What needs to be fixed?</label>
             <textarea
               autoFocus
               value={revisionNote}
               onChange={(e) => setRevisionNote(e.target.value)}
               placeholder="Be specific. e.g. 'The API endpoint returns 404 for empty results, should return 200 []'"
               className="w-full bg-white/[0.02] border border-[var(--color-border)] rounded-lg p-3 text-[13px] text-white placeholder:text-white/25 transition-colors focus:outline-none focus:border-accent min-h-[90px] resize-none"
             />
           </div>
           <div className="flex gap-2.5">
             <Button
               onClick={handleRevision}
               disabled={isPending || !revisionNote}
               className="flex-1 h-10 text-[13px] font-medium rounded-lg ui-btn-primary transition-colors cursor-pointer"
             >
               Send revision request
             </Button>
             <Button
               variant="outline"
               onClick={() => setShowRevisionInput(false)}
               className="px-5 h-10 text-[13px] font-medium rounded-lg ui-btn-secondary transition-colors cursor-pointer"
             >
               Cancel
             </Button>
           </div>
         </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-white/[0.01] rounded-lg border border-[var(--color-border)] flex items-center justify-between gap-4">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => setRating(star)}
                  className="p-0.5 transition-transform hover:scale-110 active:scale-95 duration-150 cursor-pointer"
                  aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                >
                  <svg
                    width="24" height="24" viewBox="0 0 24 24"
                    className="transition-colors duration-200"
                    fill={(hovered ?? rating ?? 0) >= star ? 'var(--color-accent)' : 'none'}
                    stroke={(hovered ?? rating ?? 0) >= star ? 'var(--color-accent)' : 'rgba(255,255,255,0.18)'}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </button>
              ))}
            </div>
            <span className="text-xs text-[var(--color-text-muted)]">
              {rating ? ['', 'Needs work', 'Below average', 'Good', 'Great', 'Outstanding'][rating] : 'Rate the work'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            <Button
              onClick={() => handleApprove(rating!)}
              disabled={isPending || !rating}
              className={cn(
                'h-10 rounded-lg text-[13px] font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5',
                rating
                  ? 'ui-btn-primary'
                  : 'bg-white/[0.02] text-white/30 border border-[var(--color-border)] cursor-not-allowed'
              )}
            >
              <CheckCircle2 className="w-4 h-4" />
              {rating ? 'Approve work' : 'Rate to approve'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowRevisionInput(true)}
              disabled={isPending}
              className="h-10 rounded-lg ui-btn-secondary transition-colors font-medium text-[13px] cursor-pointer flex items-center justify-center gap-1.5"
            >
              <GitPullRequest className="w-4 h-4" />
              Request revision
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
