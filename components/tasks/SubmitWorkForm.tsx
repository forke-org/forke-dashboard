'use client'

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
      <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl animate-in fade-in slide-in-from-bottom-4 duration-700 select-none text-left">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center text-emerald-450 shadow-inner">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-serif text-white tracking-tight">Work Submitted!</h3>
            <p className="text-xs text-emerald-450/80 font-light">Waiting for client review. Great job!</p>
          </div>
          <div className="w-full p-4 bg-white/[0.005] rounded-2xl border border-white/[0.03] space-y-3">
            <div className="flex items-center justify-between text-[8px] font-mono font-black text-emerald-450 uppercase tracking-widest">
              <span>Your Submission</span>
              <span>{state.submittedAt ? new Date(state.submittedAt).toLocaleTimeString() : ''}</span>
            </div>
            <div className="flex items-center gap-3 text-white/80 font-mono text-xs break-all">
              <GitPullRequest className="w-4 h-4 shrink-0 text-accent" />
              {state.githubLink || ''}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <form action={action} className="space-y-6 text-left">
      <input type="hidden" name="taskId" value={taskId} />

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="githubLink" className="text-[9px] font-black text-white/40 uppercase tracking-widest font-mono pl-1">
            Your submission link
          </label>
          <div className="flex items-center gap-2">
            {isValidUrl === true && (
              <span className="text-[8px] font-black font-mono text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> VALID URL
              </span>
            )}
            {isValidUrl === false && (
              <span className="text-[8px] font-black font-mono text-red-400 flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5" /> INVALID URL
              </span>
            )}
          </div>
        </div>
        
        <div className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-accent transition-colors">
            <LinkIcon className="w-4.5 h-4.5" />
          </div>
          <input
            id="githubLink"
            name="githubLink"
            type="text"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://github.com/username/repo-link"
            className="w-full bg-white/[0.01] border border-white/5 rounded-xl py-3.5 pl-12 pr-6 text-xs text-white placeholder-white/20 outline-none focus:border-accent transition-all"
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="note" className="text-[9px] font-black text-white/40 uppercase tracking-widest font-mono pl-1">
            Note to client
          </label>
          <span className="text-[9px] font-black font-mono text-white/20 uppercase tracking-wider">
            Optional note
          </span>
        </div>
        <textarea
          id="note"
          name="note"
          rows={4}
          maxLength={300}
          placeholder="Briefly explain what you built, any decisions you made, or anything the client should know."
          className="w-full bg-white/[0.01] border border-white/5 rounded-xl py-3.5 px-4 text-xs text-white placeholder-white/20 outline-none focus:border-accent transition-all resize-none leading-relaxed"
        />
      </div>

      {state?.error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2.5 text-red-400 animate-in fade-in slide-in-from-top-1 font-medium text-xs">
          <XCircle className="w-4.5 h-4.5 shrink-0" />
          <p>{state.error}</p>
        </div>
      )}

      <Button
        type="submit"
        disabled={isPending || isValidUrl !== true}
        className="w-full h-12 text-[10px] font-black uppercase tracking-widest rounded-xl bg-gradient-to-b from-accent to-[#d97706] text-[#050505] hover:shadow-[0_0_12px_rgba(255,122,0,0.2)] active:translate-y-[1px] transition-all cursor-pointer font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
      >
        {isPending ? (
          <>
            <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            SUBMITTING...
          </>
        ) : (
          <>
            SUBMIT FOR REVIEW
            <Send className="w-4 h-4 stroke-[2.5px] group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </>
        )}
      </Button>
    </form>
  )
}
