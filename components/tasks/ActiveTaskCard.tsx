'use client'

import React from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface ActiveTaskCardProps {
  task: {
    id: string
    title: string
    budget: number
    status: string
  }
}

export default function ActiveTaskCard({ task }: ActiveTaskCardProps) {
  const statusConfig = {
    claimed: { label: 'CLAIMED', color: 'bg-white/[0.01] text-white/45 border-white/5' },
    submitted: { label: 'SUBMITTED', color: 'bg-accent/10 text-accent border-accent/20' },
    approved: { label: 'APPROVED', color: 'bg-emerald-500/10 text-emerald-450 border-emerald-500/20' },
  }

  const config = statusConfig[task.status as keyof typeof statusConfig] || { label: task.status.toUpperCase(), color: 'bg-white/[0.01] text-white/45 border-white/5' }

  return (
    <Link 
      href={`/tasks/${task.id}`}
      className="block ui-surface rounded-2xl p-6 hover:border-accent/35 hover:shadow-2xl hover:shadow-accent/[0.06] transition-all group relative overflow-hidden select-none text-left"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-accent/[0.005] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      <div className="flex items-center justify-between gap-4 relative z-10">
        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex items-center gap-3">
            <span className={cn(
              "px-2 py-0.5 rounded text-[8.5px] font-semibold border tracking-[0.12em] leading-none",
              config.color
            )}>
              {config.label}
            </span>
          </div>
          
          <h4 className="text-lg font-serif text-white truncate group-hover:text-accent transition-colors">
            {task.title}
          </h4>

          <div className="flex items-center gap-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">
            <div className="flex items-center gap-1.5 text-accent font-semibold">
               ₹ {Math.floor(task.budget / 100).toLocaleString()}
            </div>
          </div>
        </div>

        <div className="w-9 h-9 rounded-full border border-white/5 bg-white/[0.01] text-white/40 flex items-center justify-center group-hover:bg-accent group-hover:border-accent group-hover:text-[#050505] transition-all shrink-0">
          <ChevronRight className="w-4 h-4 stroke-[3px]" />
        </div>
      </div>
    </Link>
  )
}
