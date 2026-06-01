'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { SKILL_TAGS } from '@/constants'
import { cn } from '@/lib/utils/cn'
import { X, Search } from 'lucide-react'

const BUDGET_OPTIONS = [
  { label: 'Any budget', value: '' },
  { label: 'Under ₹300', value: '30000' },
  { label: 'Under ₹600', value: '60000' },
  { label: 'Under ₹1,000', value: '100000' },
  { label: 'Under ₹2,500', value: '250000' },
]

interface CustomSelectProps {
  label: string
  value: string
  options: { label: string; value: string }[]
  onChange: (value: string) => void
}

function CustomSelect({ label, value, options, onChange }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedOption = options.find((opt) => opt.value === value) || options[0]

  return (
    <div ref={containerRef} className="flex-1 relative select-none text-left">
      <h4 className="text-[11px] font-bold uppercase tracking-wider text-white/40 font-mono mb-2">
        {label}
      </h4>

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full h-10 px-3.5 bg-white/[0.02] border rounded-xl text-[13px] text-white/80 flex items-center justify-between cursor-pointer transition-all outline-none",
          isOpen
            ? "border-[#ff8a00] shadow-[0_0_12px_rgba(255,138,0,0.25)] text-white"
            : "border-white/10 hover:border-white/20"
        )}
      >
        <span className="truncate font-semibold">{selectedOption?.label || value}</span>
        <svg
          className={cn("w-4 h-4 text-white/40 transition-transform duration-300 shrink-0", isOpen && "rotate-180 text-[#ff8a00]")}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#0b0b0e] border border-white/10 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.9)] z-50 max-h-60 overflow-y-auto divide-y divide-white/[0.03] animate-in fade-in slide-in-from-top-1 duration-200">
          {options.map((opt) => {
            const isSelected = opt.value === value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value)
                  setIsOpen(false)
                }}
                className={cn(
                  "w-full px-4 py-2.5 text-[13px] text-left transition-colors flex items-center justify-between cursor-pointer",
                  isSelected
                    ? "bg-[#ff8a00]/10 text-[#ff8a00] font-black"
                    : "text-white/70 hover:bg-white/[0.04] hover:text-white"
                )}
              >
                <span>{opt.label}</span>
                {isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ff8a00] shadow-[0_0_6px_#ff8a00]" />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function TaskFilters({ isOwner = false }: { isOwner?: boolean }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentTags = searchParams.getAll('tag')
  const currentMaxBudget = isOwner ? '' : (searchParams.get('maxBudget') || '')
  const currentSearch = searchParams.get('q') || ''

  const [searchQuery, setSearchQuery] = useState(currentSearch)

  // Sync state with URL parameter (important for clearing)
  useEffect(() => {
    setSearchQuery(currentSearch)
  }, [currentSearch])

  // Debounce search input typing to avoid heavy query reload on each key press
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery !== currentSearch) {
        const params = new URLSearchParams(searchParams.toString())
        if (searchQuery) {
          params.set('q', searchQuery)
        } else {
          params.delete('q')
        }
        router.push(`${pathname}?${params.toString()}`)
      }
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery, currentSearch, pathname, router, searchParams])

  const updateFilters = (newTags: string[], newMaxBudget: string) => {
    const params = new URLSearchParams()
    newTags.forEach((tag) => params.append('tag', tag))
    if (newMaxBudget && !isOwner) params.set('maxBudget', newMaxBudget)
    if (searchQuery) params.set('q', searchQuery)

    router.push(`${pathname}?${params.toString()}`)
  }

  const clearFilters = () => {
    setSearchQuery('')
    router.push(pathname)
  }

  const hasFilters = currentTags.length > 0 || currentMaxBudget !== '' || currentSearch !== ''

  const skillOptions = [
    { label: 'All skills', value: '' },
    ...SKILL_TAGS.map((tag) => ({ label: tag, value: tag })),
  ]

  if (isOwner) {
    const currentTag = currentTags[0] || ''
    const hasOwnerFilters = currentTag !== '' || currentSearch !== ''

    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.015] p-5 text-left select-none space-y-4 max-w-md">
        {/* Search Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-white/40" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search missions..."
            className="block w-full pl-10 pr-4 h-10 bg-white/[0.02] border border-white/10 rounded-xl text-[13px] text-white/80 placeholder-white/30 focus:outline-none focus:border-[#ff8a00] focus:shadow-[0_0_12px_rgba(255,138,0,0.15)] transition-all font-semibold"
          />
        </div>

        <div className="flex items-end gap-3">
          <div className="flex-grow">
            <CustomSelect
              label="Filter by skill"
              value={currentTag}
              options={skillOptions}
              onChange={(val) => updateFilters(val ? [val] : [], '')}
            />
          </div>

          {hasOwnerFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl text-[13px] font-bold transition-all bg-white/5 border border-white/10 hover:bg-white/10 text-white cursor-pointer shrink-0"
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
    <div className="rounded-2xl border border-white/10 bg-white/[0.015] p-5 text-left select-none space-y-4">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-white/40" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search missions by title, description..."
          className="block w-full pl-10 pr-4 h-10 bg-white/[0.02] border border-white/10 rounded-xl text-[13px] text-white/80 placeholder-white/30 focus:outline-none focus:border-[#ff8a00] focus:shadow-[0_0_12px_rgba(255,138,0,0.15)] transition-all font-semibold"
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end gap-4">
        {/* Skill dropdown */}
        <div className="flex-1 sm:max-w-xs">
          <CustomSelect
            label="Filter by skill"
            value={currentTags[0] || ''}
            options={skillOptions}
            onChange={(val) => updateFilters(val ? [val] : [], currentMaxBudget)}
          />
        </div>

        {/* Budget dropdown */}
        <div className="flex-1 sm:max-w-xs">
          <CustomSelect
            label="Max budget"
            value={currentMaxBudget}
            options={BUDGET_OPTIONS}
            onChange={(val) => updateFilters(currentTags, val)}
          />
        </div>

        {/* Clear filters trigger */}
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl text-[13px] font-bold transition-all bg-white/5 border border-white/10 hover:bg-white/10 text-white cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5" />
            Clear Filters
          </button>
        )}
      </div>
    </div>
  )
}
