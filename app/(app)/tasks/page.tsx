import React, { Suspense } from 'react'
import { auth } from '@/auth'
import { getOpenTasks } from '@/lib/db/queries/tasks'
import { getLevelFromXp } from '@/lib/utils/xp'
import TaskFilters from '@/components/tasks/TaskFilters'
import TaskFeed from '@/components/tasks/TaskFeed'
import { Metadata } from 'next'
import TopBar from '@/components/shared/TopBar'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Browse Tasks | Forke',
  description: 'Find micro-tasks that match your skills and level.',
}

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string | string[]; maxBudget?: string }>
}) {
  const session = await auth()
  const user = session?.user as { id: string; xp: number; role?: 'developer' | 'owner' } | undefined
  const isOwner = user?.role === 'owner'
  const userLevel = getLevelFromXp(user?.xp || 0)
  const params = await searchParams

  const tags = typeof params.tag === 'string' ? [params.tag] : params.tag
  const maxBudget = params.maxBudget ? parseInt(params.maxBudget) : undefined

  const tasks = await getOpenTasks({ skillTags: tags, maxBudget })

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      <TopBar title={isOwner ? 'Mission Feed' : 'Browse Tasks'} />
      <div className="flex-grow p-6 md:p-8 overflow-y-auto space-y-8 select-none max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 text-left">
          <div className="flex flex-col gap-3">
            <h2 className="font-serif text-3xl md:text-5xl text-white tracking-tight">
              {isOwner ? 'Active ' : 'Browse '}<span className="text-accent italic">{isOwner ? 'Mission Feed' : 'Missions'}</span>
            </h2>
            <p className="text-[var(--color-text-muted)] text-xs md:text-sm max-w-2xl font-light leading-relaxed">
              {isOwner
                ? 'Browse all active tasks on the platform. Post a new mission to attract top-tier developers.'
                : 'Find work that matches your skills. Claim it. Ship it. Get paid.'}
            </p>
          </div>

          {isOwner && (
            <Link
              href="/post-task"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl ui-btn-primary text-[10px] font-semibold uppercase tracking-[0.12em] whitespace-nowrap"
            >
              <Plus className="w-4 h-4 stroke-[2.8px]" />
              Launch Task
            </Link>
          )}
        </div>

        <div className="space-y-8 pt-2">
          <TaskFilters isOwner={isOwner} />

          <Suspense fallback={<TaskFeedSkeleton />}>
            <TaskFeed tasks={tasks} userLevel={userLevel} isOwner={isOwner} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

function TaskFeedSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="h-64 rounded-2xl ui-surface animate-pulse relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent -translate-x-full animate-shimmer" />
        </div>
      ))}
    </div>
  )
}
