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
      className="block rounded-xl border border-[var(--color-border)] bg-white/[0.018] p-4 hover:border-white/[0.14] transition-colors group select-none text-left"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={cn(
              'px-1.5 py-0.5 rounded text-[10px] font-medium border leading-none',
              config.color
            )}>
              {config.label}
            </span>
          </div>

          <h4 className="text-sm font-medium text-white truncate group-hover:text-accent transition-colors">
            {task.title}
          </h4>

          <div className="text-[13px] text-accent font-medium tabular-nums mt-1.5">
            ₹{Math.floor(task.budget / 100).toLocaleString()}
          </div>
        </div>

        <ChevronRight className="w-4 h-4 text-[var(--color-text-muted)] group-hover:text-white transition-colors shrink-0" />
      </div>
    </Link>
  )
}
