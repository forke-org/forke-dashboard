import React from 'react'
import { auth } from '@/auth'
import SandboxWorkspace from '@/components/sandbox/SandboxWorkspace'
import Link from 'next/link'
import { Search, AlertCircle, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import TopBar from '@/components/shared/TopBar'

export default async function PostTaskPage() {
  const session = await auth()
  const user = session?.user as { id: string; role: 'developer' | 'owner' } | undefined

  if (user?.role === 'developer') {
    return (
      <div className="flex flex-col h-full bg-transparent text-white font-sans">
        <TopBar title="Post task" />
        <div className="flex-grow flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto space-y-5 select-none">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-accent flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-medium text-white tracking-tight">Clients only</h1>
            <p className="text-[13px] text-white/60 max-w-md mx-auto leading-relaxed">
              Posting tasks is reserved for clients. As a developer, your path is to claim open tasks and ship code.
            </p>
          </div>
          <Link href="/tasks">
            <Button variant="outline" className="gap-2 ui-btn-secondary rounded-lg px-4 h-9 text-[13px]">
              <Search className="w-4 h-4" />
              Browse open tasks
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-transparent text-white font-sans">
      <TopBar title="Post task" />

      <div className="flex-grow overflow-y-auto">
        <div className="mx-auto max-w-6xl px-5 md:px-8 py-6 md:py-8 space-y-6 select-none w-full">
        {/* Back Link */}
        <div className="text-left">
          <Link href="/tasks" className="inline-flex items-center gap-1.5 text-[var(--color-text-muted)] hover:text-white transition-colors text-[13px] group">
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back to tasks
          </Link>
        </div>

        {/* Title and Intro */}
        <div className="space-y-1 text-left">
          <h2 className="text-xl md:text-2xl font-medium text-white tracking-tight">
            Post a new task
          </h2>
          <p className="text-sm text-[var(--color-text-muted)] max-w-xl leading-relaxed">
            Describe the work, set a budget, and publish it to the developer network.
          </p>
        </div>

        <SandboxWorkspace presetRole="owner" />
        </div>
      </div>
    </div>
  )
}
