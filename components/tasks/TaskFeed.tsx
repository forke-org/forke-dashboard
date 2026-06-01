'use client'

import React, { useState, useEffect } from 'react'
import TaskCard from './TaskCard'
import { useRouter } from 'next/navigation'
import { PlusCircle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

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
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 9

  // Reset page when tasks array changes
  useEffect(() => {
    setCurrentPage(1)
  }, [tasks])

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center rounded-xl border border-dashed border-[var(--color-border)] bg-white/[0.01]">
        <div className="w-10 h-10 bg-white/[0.02] rounded-full border border-[var(--color-border)] flex items-center justify-center mb-4">
          <PlusCircle className="w-5 h-5 text-[var(--color-text-muted)]" />
        </div>
        <h3 className="text-sm font-medium text-white mb-1.5">
          {isOwner ? 'No open tasks on the feed' : 'No tasks match your filters'}
        </h3>
        <p className="text-[13px] text-[var(--color-text-muted)] max-w-sm mx-auto mb-4 leading-relaxed">
          {isOwner
            ? 'Post a new task to attract talented developers to your project.'
            : 'New tasks are posted every day — check back soon or try clearing your filters.'}
        </p>
        <button
          onClick={() => router.push(isOwner ? '/post-task' : '/tasks')}
          className="inline-flex items-center h-8 px-3.5 rounded-lg text-[13px] font-medium ui-btn-secondary transition-colors"
        >
          {isOwner ? 'Post a task' : 'Clear filters'}
        </button>
      </div>
    )
  }

  const totalPages = Math.ceil(tasks.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedTasks = tasks.slice(startIndex, startIndex + itemsPerPage)

  return (
    <div className="space-y-8 select-none">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
        {paginatedTasks.map(({ task, clientName }) => (
          <TaskCard
            key={task.id}
            task={task}
            clientName={clientName}
            userLevel={userLevel}
            isOwner={isOwner}
          />
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 font-mono select-none pt-4">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="h-8 px-3.5 rounded-lg text-xs font-semibold border border-[var(--color-border)] bg-white/[0.02] text-[var(--color-text-muted)] hover:border-white/20 hover:text-white disabled:opacity-30 disabled:hover:border-[var(--color-border)] disabled:hover:text-[var(--color-text-muted)] transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalPages }).map((_, index) => {
              const pageNumber = index + 1
              const isActive = pageNumber === currentPage
              return (
                <button
                  key={pageNumber}
                  onClick={() => setCurrentPage(pageNumber)}
                  className={cn(
                    "w-8 h-8 rounded-lg text-xs font-bold border transition-all cursor-pointer",
                    isActive
                      ? "bg-accent border-accent text-[#0a0a0a] shadow-[0_0_10px_rgba(255,122,0,0.15)]"
                      : "border-[var(--color-border)] bg-white/[0.02] text-[var(--color-text-muted)] hover:border-white/20 hover:text-white"
                  )}
                >
                  {pageNumber}
                </button>
              )
            })}
          </div>

          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="h-8 px-3.5 rounded-lg text-xs font-semibold border border-[var(--color-border)] bg-white/[0.02] text-[var(--color-text-muted)] hover:border-white/20 hover:text-white disabled:opacity-30 disabled:hover:border-[var(--color-border)] disabled:hover:text-[var(--color-text-muted)] transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
