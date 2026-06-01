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
      <div className="rounded-xl border border-[var(--color-border)] bg-white/[0.018] p-4 text-left select-none max-w-sm">
        <div className="flex items-end gap-2.5">
          <div className="flex-grow space-y-2">
            <h4 className="text-xs font-medium text-[var(--color-text-muted)]">Filter by skill</h4>
            <div className="relative">
              <select
                value={currentTag}
                onChange={(e) => updateFilters(e.target.value ? [e.target.value] : [], '')}
                className="w-full h-9 pl-3 pr-9 bg-white/[0.02] border border-[var(--color-border)] rounded-lg text-[13px] text-white/80 outline-none focus:border-accent transition-colors appearance-none cursor-pointer"
              >
                <option value="" className="bg-[#0b0b0e] text-white">All skills</option>
                {SKILL_TAGS.map((tag) => (
                  <option key={tag} value={tag} className="bg-[#0b0b0e] text-white">
                    {tag}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-text-muted)]">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {hasOwnerFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg text-[13px] font-medium ui-btn-secondary cursor-pointer shrink-0"
            >
              <X className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-white/[0.018] p-4 text-left select-none">
      <div className="flex flex-col sm:flex-row sm:items-end gap-4">
        {/* Skill dropdown */}
        <div className="space-y-2.5 flex-1 sm:max-w-xs">
          <h4 className="text-xs font-medium text-[var(--color-text-muted)]">Filter by skill</h4>
          <div className="relative">
            <select
              value={currentTags[0] || ''}
              onChange={(e) => updateFilters(e.target.value ? [e.target.value] : [], currentMaxBudget)}
              className="w-full h-9 pl-3 pr-8 bg-white/[0.02] border border-[var(--color-border)] rounded-lg text-[13px] text-white/80 outline-none focus:border-accent transition-colors appearance-none cursor-pointer"
            >
              <option value="" className="bg-[#0b0b0e] text-white">All skills</option>
              {SKILL_TAGS.map((tag) => (
                <option key={tag} value={tag} className="bg-[#0b0b0e] text-white">
                  {tag}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-text-muted)]">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Budget dropdown */}
        <div className="space-y-2.5 flex-1 sm:max-w-xs">
          <h4 className="text-xs font-medium text-[var(--color-text-muted)]">Max budget</h4>
          <div className="relative">
            <select
              value={currentMaxBudget}
              onChange={(e) => updateFilters(currentTags, e.target.value)}
              className="w-full h-9 pl-3 pr-8 bg-white/[0.02] border border-[var(--color-border)] rounded-lg text-[13px] text-white/80 outline-none focus:border-accent transition-colors appearance-none cursor-pointer"
            >
              {BUDGET_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-[#0b0b0e] text-white">
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-text-muted)]">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Clear filters trigger */}
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center justify-center gap-1.5 h-9 px-4 rounded-lg text-[13px] font-medium ui-btn-secondary cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5" />
            Clear Filters
          </button>
        )}
      </div>
    </div>
  )
}
