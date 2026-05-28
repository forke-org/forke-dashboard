import React from 'react'
import { auth } from '@/auth'
import PostTaskForm from '@/components/tasks/PostTaskForm'
import Link from 'next/link'
import { Search, AlertCircle, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import TopBar from '@/components/shared/TopBar'

export default async function PostTaskPage() {
  const session = await auth()
  const user = session?.user as { id: string; role: 'developer' | 'owner' } | undefined

  if (user?.role === 'developer') {
    return (
      <div className="flex flex-col h-full bg-[#060608] text-white font-sans">
        <TopBar title="Post Mission" />
        <div className="flex-grow flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto space-y-8 select-none">
          <div className="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/20 text-accent flex items-center justify-center shadow-lg">
            <AlertCircle className="w-10 h-10" />
          </div>
          <div className="space-y-4">
            <h1 className="text-3xl font-serif text-white tracking-tight">Clients Only</h1>
            <p className="text-white/60 text-sm max-w-md mx-auto leading-relaxed font-light">
              Mission dispatch is reserved for authorized clients. As a developer, your path is to claim open missions and ship code.
            </p>
          </div>
          <div className="pt-4">
            <Link href="/tasks">
              <Button variant="outline" className="gap-2 border-white/10 text-white/80 hover:text-white hover:bg-white/5 bg-transparent rounded-xl px-6 h-11 text-xs">
                <Search className="w-4 h-4" />
                Browse Open Missions
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-[#060608] text-white font-sans">
      <TopBar title="Post Mission" />
      
      <div className="flex-grow p-6 md:p-8 overflow-y-auto space-y-8 select-none max-w-5xl mx-auto w-full">
        {/* Back Link */}
        <div className="text-left">
          <Link href="/tasks" className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors text-[9px] font-black uppercase tracking-widest group font-mono">
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform stroke-[2.5px]" />
            Back to Missions
          </Link>
        </div>

        {/* Title and Intro */}
        <div className="space-y-3 text-left">
          <h2 className="font-serif text-3xl md:text-5xl text-white tracking-tight">
            Launch New <span className="text-accent italic">Mission</span>
          </h2>
          <p className="text-white/50 text-xs md:text-sm font-light max-w-xl leading-relaxed">
            Specify the objective parameters, set the bounty pool, and dispatch your request to the developer network.
          </p>
        </div>

        <PostTaskForm />
      </div>
    </div>
  )
}
