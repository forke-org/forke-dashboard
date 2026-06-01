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
  }
  clientName: string
  userLevel?: number
  isOwner?: boolean
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

export default function TaskCard({ task, clientName, userLevel, isOwner = false }: TaskCardProps) {
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
