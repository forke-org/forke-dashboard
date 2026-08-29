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

import React, { useState, useActionState, useEffect } from 'react'
import { submitWork } from '@/lib/actions/tasks'
import { Button } from '@/components/ui/Button'
import { CheckCircle2, XCircle, GitPullRequest, Link as LinkIcon, Send, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import { toast } from '@/components/shared/Toast'

interface SubmitWorkFormProps {
  taskId: string
}

export default function SubmitWorkForm({ taskId }: SubmitWorkFormProps) {
  const router = useRouter()
  const [url, setUrl] = useState('')

  const [state, action, isPending] = useActionState(submitWork, null)

  // Calculate validity during render to avoid cascading renders
  let isValidUrl: boolean | null = null
  if (url !== '') {
    try {
      const parsedUrl = new URL(url)
      isValidUrl = parsedUrl.protocol === 'https:' && url.length > 10
    } catch {
      isValidUrl = false
    }
  }

  useEffect(() => {
    if (state?.success) {
      toast('Work submitted successfully under review!', 'success')
      router.refresh()
    }
  }, [state, router])

  if (state?.success) {
    return (
      <div className="p-5 bg-emerald-500/[0.07] border border-emerald-500/20 rounded-xl animate-in fade-in slide-in-from-bottom-4 duration-500 select-none text-left">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-11 h-11 rounded-lg bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-medium text-white">Work submitted</h3>
            <p className="text-[13px] text-emerald-400/80">Waiting for client review. Great job!</p>
          </div>
          <div className="w-full p-3.5 bg-white/[0.01] rounded-lg border border-[var(--color-border)] space-y-2.5">
            <div className="flex items-center justify-between text-[11px] text-emerald-400">
              <span>Your submission</span>
              <span className="tabular-nums">{state.submittedAt ? new Date(state.submittedAt).toLocaleTimeString() : ''}</span>
            </div>
            <div className="flex items-center gap-2.5 text-white/80 text-[13px] break-all">
              <GitPullRequest className="w-4 h-4 shrink-0 text-accent" />
              {state.githubLink || ''}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <form action={action} className="space-y-4 text-left">
      <input type="hidden" name="taskId" value={taskId} />

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="githubLink" className="text-xs font-medium text-[var(--color-text-muted)] pl-0.5">
            Your submission link
          </label>
          <div className="flex items-center gap-2">
            {isValidUrl === true && (
              <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Valid URL
              </span>
            )}
            {isValidUrl === false && (
              <span className="text-[11px] text-red-400 flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5" /> Invalid URL
              </span>
            )}
          </div>
        </div>

        <div className="relative group">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] group-focus-within:text-accent transition-colors">
            <LinkIcon className="w-4 h-4" />
          </div>
          <input
            id="githubLink"
            name="githubLink"
            type="text"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://github.com/username/repo-link"
            className="w-full bg-white/[0.02] border border-[var(--color-border)] rounded-lg py-2.5 pl-10 pr-4 text-[13px] text-white placeholder-white/25 outline-none focus:border-accent transition-colors"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="note" className="text-xs font-medium text-[var(--color-text-muted)] pl-0.5">
            Note to client
          </label>
          <span className="text-[11px] text-[var(--color-text-muted)]">
            Optional
          </span>
        </div>
        <textarea
          id="note"
          name="note"
          rows={4}
          maxLength={300}
          placeholder="Briefly explain what you built, any decisions you made, or anything the client should know."
          className="w-full bg-white/[0.02] border border-[var(--color-border)] rounded-lg py-2.5 px-3 text-[13px] text-white placeholder-white/25 outline-none focus:border-accent transition-colors resize-none leading-relaxed"
        />
      </div>

      {state?.error && (
        <div className="p-3 bg-red-500/[0.07] border border-red-500/20 rounded-lg flex items-start gap-2 text-red-400 animate-in fade-in slide-in-from-top-1 text-[13px]">
          <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>{state.error}</p>
        </div>
      )}

      <Button
        type="submit"
        disabled={isPending || isValidUrl !== true}
        className="w-full h-10 text-[13px] font-medium rounded-lg ui-btn-primary transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
      >
        {isPending ? (
          <>
            <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            Submitting...
          </>
        ) : (
          <>
            Submit for review
            <Send className="w-4 h-4" />
          </>
        )}
      </Button>
    </form>
  )
}
