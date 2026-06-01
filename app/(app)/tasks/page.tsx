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
  searchParams: Promise<{ tag?: string | string[]; maxBudget?: string; q?: string }>
}) {
  const session = await auth()
  const user = session?.user as { id: string; xp: number; role?: 'developer' | 'owner' } | undefined
  const isOwner = user?.role === 'owner'
  const userLevel = getLevelFromXp(user?.xp || 0)
  const params = await searchParams

  const tags = typeof params.tag === 'string' ? [params.tag] : params.tag
  const maxBudget = params.maxBudget ? parseInt(params.maxBudget) : undefined
  const q = params.q || ''

  const tasks = await getOpenTasks({ skillTags: tags, maxBudget, q, includeClaimed: isOwner })

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      <TopBar title="Tasks" />
      <div className="flex-grow overflow-y-auto">
        <div className="mx-auto max-w-6xl px-5 md:px-8 py-6 md:py-8 space-y-6 select-none w-full">
          <div className="flex flex-wrap items-end justify-between gap-4 text-left">
            <div className="min-w-0">
              <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-white">
                {isOwner ? 'All tasks' : 'Browse tasks'}
              </h2>
              <p className="text-sm text-[var(--color-text-muted)] mt-1 max-w-2xl">
                {isOwner
                  ? 'Every active task on the platform. Post a new one to attract developers.'
                  : 'Find work that matches your skills, claim it, ship it, and get paid.'}
              </p>
            </div>

            {isOwner && (
              <Link
                href="/post-task"
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg ui-btn-primary text-sm whitespace-nowrap transition-colors"
              >
                <Plus className="w-4 h-4" />
                Post task
              </Link>
            )}
          </div>

          <div className="space-y-6">
            <TaskFilters isOwner={isOwner} />

            <Suspense fallback={<TaskFeedSkeleton />}>
              <TaskFeed tasks={tasks} userLevel={userLevel} isOwner={isOwner} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}

function TaskFeedSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="h-52 rounded-xl border border-[var(--color-border)] bg-white/[0.018] animate-pulse relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent -translate-x-full animate-shimmer" />
        </div>
      ))}
    </div>
  )
}
