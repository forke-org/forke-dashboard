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

import React, { useState, useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { SKILL_TAGS } from '@/constants'
import { createTask, CreateTaskState } from '@/lib/actions/tasks'
import { Button } from '@/components/ui/Button'
import { IndianRupee, Calendar, Tag, AlertCircle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const initialState: CreateTaskState = {
  message: null,
  errors: {},
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button
      type="submit"
      disabled={pending}
      className={cn(
        "w-full md:w-auto min-w-[180px] h-10 text-[13px] font-medium ui-btn-primary rounded-lg cursor-pointer transition-colors",
        pending && "opacity-80"
      )}
    >
      {pending ? (
        <span className="flex items-center gap-2 justify-center">
          <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
          Posting...
        </span>
      ) : (
        'Post task'
      )}
    </Button>
  )
}

export default function PostTaskForm() {
  const [state, formAction] = useActionState(createTask, initialState)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [budget, setBudget] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [customTagInput, setCustomTagInput] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag))
    } else if (selectedTags.length < 5) {
      setSelectedTags([...selectedTags, tag])
    }
  }

  const removeTag = (tag: string) => {
    setSelectedTags((prev) => prev.filter((t) => t !== tag))
  }

  const addCustomTag = () => {
    const trimmed = customTagInput.trim()
    if (!trimmed || selectedTags.includes(trimmed) || selectedTags.length >= 5) return
    setSelectedTags((prev) => [...prev, trimmed])
    setCustomTagInput('')
    setShowCustomInput(false)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-12 select-none">
      <form action={formAction} className="lg:col-span-2 space-y-6 text-left">
        {state.message && (
          <div className="p-3 rounded-lg flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2 duration-300 bg-red-500/[0.07] text-red-400 border border-red-500/20 text-[13px]">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <p>{state.message}</p>
          </div>
        )}

        {/* Task Title */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-end">
            <label htmlFor="title" className="text-xs font-medium text-[var(--color-text-muted)]">
              Task title
            </label>
            <span className={cn(
              "text-[11px] tabular-nums",
              title.length > 90 ? "text-red-400" : "text-white/30"
            )}>
              {title.length}/100
            </span>
          </div>
          <input
            id="title"
            name="title"
            type="text"
            required
            placeholder="e.g. Build a landing page with Tailwind"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={cn(
              "w-full h-10 px-3 rounded-lg bg-white/[0.02] border transition-colors outline-none text-[13px] text-white placeholder-white/25",
              state.errors?.title ? "border-red-500/30 focus:border-red-500" : "border-[var(--color-border)] focus:border-accent"
            )}
          />
          {state.errors?.title && (
            <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> {state.errors.title[0]}
            </p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-end">
            <label htmlFor="description" className="text-xs font-medium text-[var(--color-text-muted)]">
              Description
            </label>
            <span className={cn(
              "text-[11px] tabular-nums",
              description.length > 900 ? "text-red-400" : "text-white/30"
            )}>
              {description.length}/1000
            </span>
          </div>
          <textarea
            id="description"
            name="description"
            required
            rows={6}
            placeholder="Describe the task, requirements, and deliverables..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={cn(
              "w-full px-3 py-2.5 rounded-lg bg-white/[0.02] border transition-colors outline-none text-[13px] text-white placeholder-white/25 resize-none min-h-[120px] leading-relaxed",
              state.errors?.description ? "border-red-500/30 focus:border-red-500" : "border-[var(--color-border)] focus:border-accent"
            )}
          />
          {state.errors?.description && (
            <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> {state.errors.description[0]}
            </p>
          )}
        </div>

        {/* Skill Tags */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <Tag className="w-3.5 h-3.5 text-accent" />
            <label className="text-xs font-medium text-[var(--color-text-muted)]">
              Skill tags (1–5)
            </label>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {SKILL_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-[13px] font-medium border transition-colors cursor-pointer',
                  selectedTags.includes(tag)
                    ? 'bg-accent text-[#0a0a0a] border-accent'
                    : 'bg-white/[0.02] border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-white/20 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed'
                )}
                disabled={!selectedTags.includes(tag) && selectedTags.length >= 5}
              >
                {tag}
              </button>
            ))}

            {/* Custom tags already added */}
            {selectedTags
              .filter((t) => !(SKILL_TAGS as readonly string[]).includes(t))
              .map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[13px] font-medium bg-accent text-[#0a0a0a] border border-accent"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-0.5 hover:opacity-75 text-base leading-none cursor-pointer"
                    aria-label={`Remove ${tag}`}
                  >
                    ×
                  </button>
                </span>
              ))}

            {/* The "+" button */}
            {selectedTags.length < 5 && !showCustomInput && (
              <button
                key="custom-add-btn"
                type="button"
                onClick={() => setShowCustomInput(true)}
                className="px-2.5 py-1 rounded-lg text-[13px] font-medium border border-dashed border-white/15 text-[var(--color-text-muted)] hover:border-accent hover:text-accent transition-colors cursor-pointer"
              >
                + Custom
              </button>
            )}

            {/* Inline custom tag input */}
            {showCustomInput && (
              <div key="custom-input-wrap" className="flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
                <input
                  type="text"
                  value={customTagInput}
                  onChange={(e) => setCustomTagInput(e.target.value.slice(0, 20))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addCustomTag()
                    }
                    if (e.key === 'Escape') {
                      setShowCustomInput(false)
                      setCustomTagInput('')
                    }
                  }}
                  placeholder="e.g. Prisma…"
                  autoFocus
                  className="w-32 h-8 px-3 text-[13px] border border-accent rounded-lg outline-none bg-[#0b0b0e] text-white ring-1 ring-accent/20 placeholder-white/20"
                  maxLength={20}
                />
                <div className="flex gap-2 text-[13px] font-medium">
                  <button
                    type="button"
                    onClick={addCustomTag}
                    className="text-accent hover:underline cursor-pointer"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowCustomInput(false); setCustomTagInput('') }}
                    className="text-white/40 hover:underline cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Hidden Inputs for Form Submission */}
          {selectedTags.map((tag) => (
            <input key={tag} type="hidden" name="skillTags" value={tag} />
          ))}
          {state.errors?.skillTags && (
            <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> {state.errors.skillTags[0]}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Budget */}
          <div className="space-y-1.5">
            <label htmlFor="budget" className="text-xs font-medium text-[var(--color-text-muted)]">
              Budget (rupees)
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
                <IndianRupee className="w-4 h-4" />
              </div>
              <input
                id="budget"
                name="budget"
                type="number"
                required
                min={100}
                max={100000}
                placeholder="500"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className={cn(
                  "w-full h-10 pl-9 pr-3 rounded-lg bg-white/[0.02] border transition-colors outline-none text-[13px] text-white placeholder-white/25",
                  state.errors?.budget ? "border-red-500/30 focus:border-red-500" : "border-[var(--color-border)] focus:border-accent"
                )}
              />
            </div>
            <p className="text-[11px] text-[var(--color-text-muted)]">Minimum ₹100 · Maximum ₹1,00,000</p>
            {state.errors?.budget && (
              <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {state.errors.budget[0]}
              </p>
            )}
          </div>

          {/* Deadline */}
          <div className="space-y-1.5">
            <label htmlFor="deadline" className="text-xs font-medium text-[var(--color-text-muted)]">
              Deadline (optional)
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
                <Calendar className="w-4 h-4" />
              </div>
              <input
                id="deadline"
                name="deadline"
                type="date"
                className="w-full h-10 pl-9 pr-3 rounded-lg bg-white/[0.02] border border-[var(--color-border)] focus:border-accent transition-colors outline-none text-[13px] text-white/70 appearance-none cursor-pointer"
              />
            </div>
            {state.errors?.deadline && (
              <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {state.errors.deadline[0]}
              </p>
            )}
          </div>
        </div>

        <div className="pt-5 border-t border-[var(--color-border)]">
          <SubmitButton />
        </div>
      </form>

      {/* Live Preview */}
      <div className="lg:col-span-1 text-left">
        <div className="sticky top-20 space-y-3">
          <h3 className="text-xs font-medium text-[var(--color-text-muted)] pl-0.5">Live preview</h3>
          <div className="rounded-xl border border-[var(--color-border)] bg-white/[0.018] p-4 space-y-4">
            <div className="flex justify-between items-start gap-3">
              <h4 className="text-sm font-medium text-white break-words min-h-[1.25em] leading-snug">
                {title || 'Your task title'}
              </h4>
              <div className="bg-accent/10 border border-accent/20 px-2 py-0.5 rounded text-accent font-medium text-[13px] tabular-nums whitespace-nowrap shrink-0">
                ₹{(budget ? Number(budget) : 0).toLocaleString()}
              </div>
            </div>

            <p className="text-[13px] text-white/45 line-clamp-3 min-h-[4em] leading-relaxed">
              {description || 'Your task description will appear here as you type…'}
            </p>

            <div className="flex flex-wrap gap-1.5">
              {selectedTags.length > 0 ? (
                selectedTags.map(tag => (
                  <span key={tag} className="px-1.5 py-0.5 bg-white/[0.04] border border-[var(--color-border)] text-[var(--color-text-muted)] text-[11px] font-medium rounded">
                    {tag}
                  </span>
                ))
              ) : (
                <span className="text-[11px] text-white/30">No tags selected</span>
              )}
            </div>

            <div className="pt-3.5 border-t border-[var(--color-border)] flex items-center justify-between text-[11px] text-[var(--color-text-muted)]">
              <span>Status: Open</span>
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Expires soon</span>
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-white/[0.02] border border-[var(--color-border)] rounded-xl">
            <div className="flex gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <p className="text-[13px] text-white/60 leading-relaxed">
                <span className="font-medium text-white">Tip:</span> Clear instructions attract better-quality developers. Be specific about your deliverables.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
