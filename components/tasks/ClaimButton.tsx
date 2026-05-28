'use client'

import React, { useTransition } from 'react'
import { claimTask } from '@/lib/actions/tasks'
import { Button } from '@/components/ui/Button'
import { CheckCircle2, AlertCircle, Lock } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface ClaimButtonProps {
  taskId: string
  isLocked: boolean
  requiredLevel: number
}

export default function ClaimButton({ taskId, isLocked, requiredLevel }: ClaimButtonProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = React.useState<string | null>(null)

  const handleClaim = () => {
    setError(null)
    startTransition(async () => {
      try {
        await claimTask(taskId)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.'
        setError(message)
      }
    })
  }

  if (isLocked) {
    return (
      <Button disabled className="w-full h-12 text-[10px] font-black uppercase tracking-widest bg-white/[0.01] text-white/20 border border-white/5 cursor-not-allowed shadow-none flex items-center justify-center gap-2">
        <Lock className="w-4 h-4 text-white/20" />
        Unlock at LVL {requiredLevel}
      </Button>
    )
  }

  return (
    <div className="space-y-3">
      <Button 
        onClick={handleClaim} 
        disabled={isPending}
        className="w-full h-12 text-[10px] font-black uppercase tracking-widest bg-gradient-to-b from-accent to-[#d97706] text-[#050505] hover:shadow-[0_0_12px_rgba(255,122,0,0.2)] active:translate-y-[1px] transition-all cursor-pointer rounded-xl font-bold"
      >
        {isPending ? (
          <span className="flex items-center gap-2 justify-center">
            <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            Claiming...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 stroke-[2.5px]" />
            Claim This Task
          </span>
        )}
      </Button>
      
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}
      
      <p className="text-[8px] text-white/20 font-black uppercase tracking-wider text-center font-mono">
        By claiming, you commit to delivering quality work by the deadline.
      </p>
    </div>
  )
}
