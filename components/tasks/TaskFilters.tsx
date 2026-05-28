'use client'

import React from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { SKILL_TAGS } from '@/constants'
import { cn } from '@/lib/utils/cn'
import { X } from 'lucide-react'

const BUDGET_OPTIONS = [
  { label: 'Any budget', value: '' },
  { label: 'Under ₹300', value: '30000' },
  { label: 'Under ₹600', value: '60000' },
  { label: 'Under ₹1,000', value: '100000' },
  { label: 'Under ₹2,500', value: '250000' },
]

export default function TaskFilters({ isOwner = false }: { isOwner?: boolean }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentTags = searchParams.getAll('tag')
  const currentMaxBudget = isOwner ? '' : (searchParams.get('maxBudget') || '')

  const updateFilters = (newTags: string[], newMaxBudget: string) => {
    const params = new URLSearchParams()
    newTags.forEach(tag => params.append('tag', tag))
    if (newMaxBudget && !isOwner) params.set('maxBudget', newMaxBudget)
    
    // Using simple router push to trigger server-side re-fetch
    router.push(`${pathname}?${params.toString()}`)
  }

  const toggleTag = (tag: string) => {
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag]
    updateFilters(newTags, currentMaxBudget)
  }

  const clearFilters = () => {
    router.push(pathname)
  }

  const hasFilters = currentTags.length > 0 || currentMaxBudget !== ''

  if (isOwner) {
    const currentTag = currentTags[0] || ''
    const hasOwnerFilters = currentTag !== ''

    return (
      <div className="ui-surface p-6 rounded-2xl text-left select-none max-w-sm">
        <div className="flex items-end gap-3">
          <div className="flex-grow space-y-3">
            <h4 className="ui-label">Filter by Skill</h4>
            <div className="relative">
              <select
                value={currentTag}
                onChange={(e) => updateFilters(e.target.value ? [e.target.value] : [], '')}
                className="w-full h-11 pl-4 pr-10 bg-white/[0.01] border border-white/5 rounded-xl text-[10px] font-semibold tracking-[0.1em] uppercase text-white/70 outline-none focus:border-accent transition-all appearance-none cursor-pointer"
              >
                <option value="" className="bg-[#0b0b0e] text-white">All Skills</option>
                {SKILL_TAGS.map((tag) => (
                  <option key={tag} value={tag} className="bg-[#0b0b0e] text-white">
                    {tag}
                  </option>
                ))}
              </select>
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-white/30">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {hasOwnerFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center justify-center gap-1.5 text-[9px] font-semibold text-accent hover:text-[#ffe3c5] transition-colors h-11 px-4 border border-accent/25 rounded-xl bg-accent/10 hover:bg-accent/15 cursor-pointer tracking-[0.12em] uppercase shrink-0 animate-in fade-in zoom-in-95 duration-250"
            >
              <X className="w-3.5 h-3.5 stroke-[3px]" />
              CLEAR
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 ui-surface p-6 rounded-2xl text-left select-none">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Skill Tags */}
        <div className="flex-grow space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="ui-label">Filter by Skill</h4>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="lg:hidden flex items-center gap-1 text-[10px] font-black text-accent hover:underline mb-1"
              >
                Clear all
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {SKILL_TAGS.map((tag) => {
              const isActive = currentTags.includes(tag)
              return (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-xl text-[10px] font-semibold uppercase tracking-[0.1em] border transition-all duration-200 cursor-pointer",
                    isActive
                      ? "bg-accent border-accent text-[#050505] shadow-[0_0_12px_rgba(255,122,0,0.2)]"
                      : "bg-white/[0.01] border-white/5 text-white/40 hover:border-accent/45 hover:text-white"
                  )}
                >
                  {tag}
                </button>
              )
            })}
          </div>
        </div>

        {/* Budget & Clear */}
        <div className="flex items-end gap-3 shrink-0">
          <div className="space-y-3 w-full sm:w-48">
            <h4 className="ui-label">Max Budget</h4>
            <div className="relative">
              <select
                value={currentMaxBudget}
                onChange={(e) => updateFilters(currentTags, e.target.value)}
                className="w-full h-11 pl-3 pr-8 bg-white/[0.01] border border-white/5 rounded-xl text-[10px] font-semibold tracking-[0.1em] uppercase text-white/70 outline-none focus:border-accent transition-all appearance-none cursor-pointer"
              >
                {BUDGET_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-[#0b0b0e] text-white">
                    {opt.label}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/30">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="hidden lg:flex items-center gap-1.5 text-[9px] font-semibold text-accent hover:text-[#ffe3c5] transition-colors h-11 px-3 border border-accent/25 rounded-xl bg-accent/10 hover:bg-accent/15 cursor-pointer tracking-[0.12em] uppercase"
            >
              <X className="w-3.5 h-3.5 stroke-[3px]" />
              CLEAR
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
