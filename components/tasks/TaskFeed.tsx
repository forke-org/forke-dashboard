'use client'

import React from 'react'
import TaskCard from './TaskCard'
import { useRouter } from 'next/navigation'
import { PlusCircle } from 'lucide-react'

interface TaskFeedProps {
  tasks: {
    task: {
      id: string
      title: string
      budget: number
      skillTags: string[] | null
      createdAt: Date
    }
    clientName: string
  }[]
  userLevel: number
  isOwner?: boolean
}

export default function TaskFeed({ tasks, userLevel, isOwner = false }: TaskFeedProps) {
  const router = useRouter()

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-[#0b0b0e] rounded-2xl border border-white/[0.04] shadow-sm">
        <div className="w-16 h-16 bg-white/[0.01] rounded-full flex items-center justify-center mb-6">
          <PlusCircle className="w-8 h-8 text-white/20" />
        </div>
        <h3 className="text-lg font-serif text-white mb-2">
          {isOwner ? 'No open missions on the feed' : 'No tasks match your filters right now'}
        </h3>
        <p className="text-white/40 text-xs max-w-sm mx-auto mb-6 leading-relaxed font-light">
          {isOwner
            ? 'Post a new mission to attract talented developers to your project.'
            : 'New tasks are posted every day — check back soon or try clearing your filters.'}
        </p>
        <button
          onClick={() => router.push(isOwner ? '/post-task' : '/tasks')}
          className="text-[10px] font-bold text-accent hover:text-amber-400 tracking-widest uppercase border-b border-accent transition-colors pb-0.5"
        >
          {isOwner ? 'Post a Mission' : 'Clear all filters'}
        </button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {tasks.map(({ task, clientName }) => (
        <TaskCard
          key={task.id}
          task={task}
          clientName={clientName}
          userLevel={userLevel}
          isOwner={isOwner}
        />
      ))}
    </div>
  )
}
