'use client'

import React from 'react'
import Link from 'next/link'
import { Clock, User, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface TaskCardProps {
  task: {
    id: string
    title: string
    budget: number
    skillTags: string[] | null
    createdAt: Date
    status: string
    claimantId?: string | null
    claimedAt?: Date | null
  }
  clientName: string
  userLevel?: number
  isOwner?: boolean
  claimantName?: string | null
  claimantUsername?: string | null
}

function timeAgo(date: Date) {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  
  let interval = seconds / 31536000
  if (interval > 1) return Math.floor(interval) + 'y ago'
  interval = seconds / 2592000
  if (interval > 1) return Math.floor(interval) + 'mo ago'
  interval = seconds / 86400
  if (interval > 1) return Math.floor(interval) + 'd ago'
  interval = seconds / 3600
  if (interval > 1) return Math.floor(interval) + 'h ago'
  interval = seconds / 60
  return Math.floor(interval) + 'm ago'
}

export default function TaskCard({
  task,
  clientName,
  userLevel,
  isOwner = false,
  claimantName,
  claimantUsername,
}: TaskCardProps) {
  const budgetInRupees = Math.floor(task.budget / 100)

  return (
    <div className="group rounded-xl border border-[var(--color-border)] bg-white/[0.018] p-5 transition-colors hover:border-white/[0.14] flex flex-col h-full text-left">

      <div className="flex justify-between items-start gap-3 mb-3">
        <h3 className="text-sm font-medium text-white line-clamp-2 leading-snug flex-grow group-hover:text-accent transition-colors">
          {task.title}
        </h3>
        <div className="text-[13px] font-medium tabular-nums text-accent px-2 py-0.5 bg-accent/10 border border-accent/20 rounded shrink-0">
          ₹{budgetInRupees.toLocaleString()}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-5">
        {task.skillTags?.map((tag) => (
          <span
            key={tag}
            className="px-1.5 py-0.5 bg-white/[0.04] border border-[var(--color-border)] text-[var(--color-text-muted)] text-[11px] font-medium rounded"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-auto space-y-3.5">
        {/* Claimant Info if Claimed and viewed by Owner */}
        {isOwner && task.status !== 'open' && claimantName && (
          <div className="flex items-center justify-between text-[11px] border-t border-[var(--color-border)] pt-3.5">
            <div className="flex items-center gap-1.5 text-amber-500 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
              <span>
                Claimed by{' '}
                <Link
                  href={claimantUsername ? `/${claimantUsername}` : `/profile/${task.claimantId || ''}`}
                  className="text-white hover:text-accent font-semibold transition-colors underline decoration-white/20 hover:decoration-accent/40"
                >
                  {claimantName}
                </Link>
              </span>
            </div>
            <span className="text-[var(--color-text-muted)] font-mono text-[10px]">
              {timeAgo(task.claimedAt || task.createdAt)}
            </span>
          </div>
        )}

        {/* Default Client/Created row (only if not claimed or developer is viewing) */}
        {(!isOwner || task.status === 'open') && (
          <div className={cn(
            "flex items-center justify-between text-[11px] text-[var(--color-text-muted)] border-t border-[var(--color-border)] pt-3.5",
            isOwner && "justify-end"
          )}>
            {!isOwner && (
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                <span>by <span className="text-white/70">{clientName}</span></span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>{timeAgo(task.createdAt)}</span>
            </div>
          </div>
        )}

        <Link
          href={`/tasks/${task.id}`}
          className={cn(
            "flex items-center justify-center gap-1.5 w-full h-9 rounded-lg text-[13px] font-medium transition-colors",
            isOwner
              ? "ui-btn-secondary"
              : "ui-btn-primary"
          )}
        >
          View details
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  )
}
