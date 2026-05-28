'use client'

import React from 'react'
import Link from 'next/link'
import { Lock, Clock, User, ChevronRight } from 'lucide-react'
import { getRequiredLevel } from '@/lib/utils/xp'
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
  userLevel: number
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
  const requiredLevel = getRequiredLevel(task.skillTags ?? [])
  const isLocked = !isOwner && userLevel < requiredLevel
  const budgetInRupees = Math.floor(task.budget / 100)

  return (
    <div className="group bg-[#0b0b0e] border border-white/[0.04] rounded-2xl p-6 transition-all duration-300 hover:border-accent/30 hover:shadow-2xl hover:shadow-accent/[0.01] flex flex-col h-full text-left relative overflow-hidden">
      
      {/* Background accent glow on hover */}
      <div className="absolute inset-0 bg-gradient-to-tr from-accent/[0.01] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <div className="flex justify-between items-start gap-4 mb-3 relative z-10">
        <h3 className="font-serif text-lg text-white line-clamp-2 leading-tight flex-grow group-hover:text-accent transition-colors">
          {task.title}
        </h3>
        <div className="font-mono text-base font-bold text-accent px-2 py-0.5 bg-accent/10 border border-accent/20 rounded">
          ₹{budgetInRupees.toLocaleString()}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-6 relative z-10">
        {task.skillTags?.map((tag) => (
          <span 
            key={tag} 
            className="px-2 py-0.5 bg-accent/10 border border-accent/15 text-accent text-[9px] font-bold rounded uppercase tracking-wider font-mono"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-auto space-y-4 relative z-10">
        <div className="flex items-center justify-between text-[9px] text-white/40 font-black uppercase tracking-wider border-t border-white/[0.04] pt-4 font-mono">
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-accent" />
            <span>by <span className="text-white/60 font-black">{clientName}</span></span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>{timeAgo(task.createdAt)}</span>
          </div>
        </div>

        <Link 
          href={`/tasks/${task.id}`}
          className={cn(
            "flex items-center justify-center gap-2 w-full h-11 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
            isOwner
              ? "bg-white/[0.02] border border-white/5 text-white/60 hover:border-accent/40 hover:text-white"
              : isLocked 
                ? "bg-white/[0.01] text-white/30 border border-white/5 cursor-not-allowed"
                : "bg-gradient-to-b from-accent to-[#d97706] text-[#050505] hover:shadow-[0_0_15px_rgba(255,122,0,0.2)] active:translate-y-[1px]"
          )}
        >
          {isOwner ? (
            <>
              View Details
              <ChevronRight className="w-3.5 h-3.5 stroke-[3px]" />
            </>
          ) : isLocked ? (
            <>
              <Lock className="w-3.5 h-3.5 text-white/20" />
              Unlock at LVL {requiredLevel}
            </>
          ) : (
            <>
              Claim Task
              <ChevronRight className="w-3.5 h-3.5 stroke-[3px] group-hover:translate-x-0.5 transition-transform" />
            </>
          )}
        </Link>
      </div>
    </div>
  )
}
