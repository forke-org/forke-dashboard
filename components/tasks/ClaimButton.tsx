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

import React, { useTransition } from 'react'
import { claimTask } from '@/lib/actions/tasks'
import { Button } from '@/components/ui/Button'
import { CheckCircle2, AlertCircle, Lock } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useSession, signIn } from 'next-auth/react'

interface ClaimButtonProps {
  taskId: string
  isLocked: boolean
  requiredLevel: number
}

export default function ClaimButton({ taskId, isLocked, requiredLevel }: ClaimButtonProps) {
  const { data: session } = useSession()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = React.useState<string | null>(null)

  const isGithubConnected = session?.user?.isGithubConnected

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

  const handleConnectGithub = () => {
    signIn('github', { callbackUrl: window.location.href })
  }

  if (isLocked) {
    return (
      <Button disabled className="w-full h-10 text-[13px] font-medium bg-white/[0.02] text-white/30 border border-[var(--color-border)] cursor-not-allowed rounded-lg flex items-center justify-center gap-2">
        <Lock className="w-4 h-4" />
        Unlock at Lvl {requiredLevel}
      </Button>
    )
  }

  if (!isGithubConnected) {
    return (
      <div className="space-y-3">
        <Button
          onClick={handleConnectGithub}
          className="w-full h-10 text-[13px] font-medium bg-[#24292e] hover:bg-[#24292e]/90 text-white transition-colors cursor-pointer rounded-lg border border-white/10"
        >
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
            </svg>
            Connect GitHub to Claim
          </span>
        </Button>
        <p className="text-[11px] text-[var(--color-text-muted)] text-center">
          Connecting your GitHub login is required to claim and verify task completions.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <Button
        onClick={handleClaim}
        disabled={isPending}
        className="w-full h-10 text-[13px] font-medium ui-btn-primary transition-colors cursor-pointer rounded-lg"
      >
        {isPending ? (
          <span className="flex items-center gap-2 justify-center">
            <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            Claiming...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Claim this task
          </span>
        )}
      </Button>

      {error && (
        <div className="p-3 bg-red-500/[0.07] border border-red-500/20 text-red-400 rounded-lg flex items-center gap-2 text-[13px] animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <p className="text-[11px] text-[var(--color-text-muted)] text-center">
        By claiming, you commit to delivering quality work by the deadline.
      </p>
    </div>
  )
}
