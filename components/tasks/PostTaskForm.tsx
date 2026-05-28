'use client'

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
        "w-full md:w-auto min-w-[200px] h-12 text-[10px] font-black uppercase tracking-widest bg-gradient-to-b from-accent to-[#d97706] text-[#050505] hover:shadow-[0_0_15px_rgba(255,122,0,0.2)] active:translate-y-[1px] rounded-xl font-bold cursor-pointer transition-all",
        pending && "opacity-80"
      )}
    >
      {pending ? (
        <span className="flex items-center gap-2 justify-center">
          <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
          Posting...
        </span>
      ) : (
        'Launch Mission'
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12 select-none">
      <form action={formAction} className="lg:col-span-2 space-y-8 text-left">
        {state.message && (
          <div className="p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 bg-red-500/10 text-red-400 border border-red-500/20 font-medium text-xs">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{state.message}</p>
          </div>
        )}

        {/* Task Title */}
        <div className="space-y-2">
          <div className="flex justify-between items-end">
            <label htmlFor="title" className="text-[10px] font-black uppercase tracking-wider text-white/40 font-mono">
              Task Title
            </label>
            <span className={cn(
              "text-[9px] tabular-nums font-mono font-black",
              title.length > 90 ? "text-red-400" : "text-white/20"
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
              "w-full h-12 px-4 rounded-xl bg-white/[0.01] border transition-all outline-none text-xs text-white placeholder-white/20",
              state.errors?.title ? "border-red-500/30 focus:border-red-500" : "border-white/5 focus:border-accent"
            )}
          />
          {state.errors?.title && (
            <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5" /> {state.errors.title[0]}
            </p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <div className="flex justify-between items-end">
            <label htmlFor="description" className="text-[10px] font-black uppercase tracking-wider text-white/40 font-mono">
              Description
            </label>
            <span className={cn(
              "text-[9px] tabular-nums font-mono font-black",
              description.length > 900 ? "text-red-400" : "text-white/20"
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
              "w-full px-4 py-3 rounded-xl bg-white/[0.01] border transition-all outline-none text-xs text-white placeholder-white/20 resize-none min-h-[120px]",
              state.errors?.description ? "border-red-500/30 focus:border-red-500" : "border-white/5 focus:border-accent"
            )}
          />
          {state.errors?.description && (
            <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5" /> {state.errors.description[0]}
            </p>
          )}
        </div>

        {/* Skill Tags */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-accent" />
            <label className="text-[10px] font-black uppercase tracking-wider text-white/40 font-mono">
              Skill Tags (1-5)
            </label>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {SKILL_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={cn(
                  'px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider font-mono border transition-all cursor-pointer',
                  selectedTags.includes(tag)
                    ? 'bg-accent text-[#050505] border-accent shadow-[0_0_12px_rgba(255,122,0,0.2)]'
                    : 'bg-white/[0.01] border-white/5 text-white/40 hover:border-accent hover:text-accent disabled:opacity-30 disabled:cursor-not-allowed'
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
                  className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider font-mono bg-accent text-[#050505] border border-accent shadow-[0_0_12px_rgba(255,122,0,0.2)]"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1 hover:opacity-75 text-lg leading-none cursor-pointer"
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
                className="px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider font-mono border border-dashed border-white/10 text-white/40 hover:border-accent hover:text-accent transition-colors cursor-pointer"
              >
                + custom
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
                  placeholder="e.g. Prisma..."
                  autoFocus
                  className="w-32 h-9 px-3.5 text-xs font-mono border border-accent rounded-xl outline-none bg-[#0b0b0e] text-white shadow-sm ring-1 ring-accent/20 placeholder-white/10"
                  maxLength={20}
                />
                <div className="flex gap-2 font-mono text-[9px] font-black tracking-widest">
                  <button
                    type="button"
                    onClick={addCustomTag}
                    className="text-accent hover:underline cursor-pointer"
                  >
                    ADD
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowCustomInput(false); setCustomTagInput('') }}
                    className="text-white/30 hover:underline cursor-pointer"
                  >
                    CANCEL
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
            <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5" /> {state.errors.skillTags[0]}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Budget */}
          <div className="space-y-2">
            <label htmlFor="budget" className="text-[10px] font-black uppercase tracking-wider text-white/40 font-mono">
              Budget (Rupees)
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
                <IndianRupee className="w-4 h-4" />
              </div>
              <input
                id="budget"
                name="budget"
                type="number"
                required
                min={100}
                max={5000}
                placeholder="500"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className={cn(
                  "w-full h-12 pl-10 pr-4 rounded-xl bg-white/[0.01] border transition-all outline-none text-xs text-white placeholder-white/20",
                  state.errors?.budget ? "border-red-500/30 focus:border-red-500" : "border-white/5 focus:border-accent"
                )}
              />
            </div>
            <p className="text-[9px] font-mono text-white/20 font-black uppercase tracking-wide">Minimum ₹100 · Maximum ₹5,000</p>
            {state.errors?.budget && (
              <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5" /> {state.errors.budget[0]}
              </p>
            )}
          </div>

          {/* Deadline */}
          <div className="space-y-2">
            <label htmlFor="deadline" className="text-[10px] font-black uppercase tracking-wider text-white/40 font-mono">
              Deadline (Optional)
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
                <Calendar className="w-4 h-4" />
              </div>
              <input
                id="deadline"
                name="deadline"
                type="date"
                className="w-full h-12 pl-10 pr-4 rounded-xl bg-white/[0.01] border border-white/5 focus:border-accent transition-all outline-none text-xs text-white/70 appearance-none cursor-pointer"
              />
            </div>
            {state.errors?.deadline && (
              <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5" /> {state.errors.deadline[0]}
              </p>
            )}
          </div>
        </div>

        <div className="pt-6 border-t border-white/[0.04]">
          <SubmitButton />
        </div>
      </form>

      {/* Live Preview */}
      <div className="lg:col-span-1 text-left">
        <div className="sticky top-24 space-y-4">
          <h3 className="text-[9px] font-black text-white/30 uppercase tracking-widest font-mono pl-1">Live Preview</h3>
          <div className="bg-[#0b0b0e] border border-accent/20 rounded-3xl p-6 shadow-2xl space-y-5 relative overflow-hidden group">
            {/* Gloss Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-transparent pointer-events-none" />
            
            <div className="flex justify-between items-start gap-4 relative">
              <h4 className="font-serif text-lg text-white break-words min-h-[1.5em] leading-tight">
                {title || 'Your Task Title'}
              </h4>
              <div className="bg-accent/10 border border-accent/25 px-2.5 py-0.5 rounded text-accent font-mono font-bold text-xs whitespace-nowrap shadow-sm shrink-0">
                ₹{(budget ? Number(budget) : 0).toLocaleString()}
              </div>
            </div>
            
            <p className="text-xs text-white/40 line-clamp-3 min-h-[4.5em] relative leading-relaxed font-light">
              {description || 'Your task description will appear here as you type...'}
            </p>

            <div className="flex flex-wrap gap-1.5 relative">
              {selectedTags.length > 0 ? (
                selectedTags.map(tag => (
                  <span key={tag} className="px-2 py-0.5 bg-accent/10 border border-accent/15 text-accent text-[9px] font-bold rounded uppercase tracking-wider font-mono">
                    {tag}
                  </span>
                ))
              ) : (
                <span className="text-[9px] font-mono text-white/20 uppercase tracking-wider">No tags selected</span>
              )}
            </div>

            <div className="pt-4 border-t border-white/[0.04] flex items-center justify-between text-[8px] font-mono font-black uppercase tracking-wider relative text-white/30">
              <span>STATUS: OPEN</span>
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Expires soon</span>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-accent/5 border border-accent/10 rounded-2xl">
            <div className="flex gap-3">
              <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <p className="text-[10px] text-white/60 leading-relaxed">
                <span className="font-bold text-white">Pro Tip:</span> Clear instructions attract better quality workers. Be specific about your deliverables.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
