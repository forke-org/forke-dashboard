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

import React, { useState, useEffect } from 'react'
import { submitSupportEnquiry } from '@/app/(app)/support/actions'
import { Headphones, Send, CheckCircle2, AlertTriangle } from 'lucide-react'
import { useSession } from 'next-auth/react'

export default function SupportForm() {
  const { data: session } = useSession()
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    contactEmail: '',
    contactNumber: '',
    errorType: 'General',
    relevantLinks: '',
    message: ''
  })

  useEffect(() => {
    if (session?.user) {
      const nameParts = (session.user.name || '').split(' ')
      setFormData(prev => ({
        ...prev,
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        contactEmail: session.user.email || ''
      }))
    }
  }, [session])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    const form = new FormData(e.currentTarget)
    const res = await submitSupportEnquiry(form)
    
    setLoading(false)
    if (res.success) {
      setSuccess(true)
    } else {
      setError(res.error || 'Something went wrong')
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div className="w-full flex flex-col justify-center">
      {success ? (
        <div className="p-10 rounded-xl bg-white/[0.018] border border-[var(--color-border)] text-center space-y-5 animate-in fade-in duration-500 max-w-md mx-auto w-full">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-medium text-white">Ticket submitted</h3>
            <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">
              Your support request has been logged. An agent will respond shortly.
            </p>
            <p className="text-white/60 text-xs leading-relaxed pt-2">
              For further queries contact: <span className="text-accent font-semibold">support@forke.space</span>
            </p>
          </div>
          <button
            onClick={() => setSuccess(false)}
            className="inline-flex items-center h-9 px-4 rounded-lg ui-btn-secondary text-[13px] font-medium transition-colors cursor-pointer"
          >
            Submit new ticket
          </button>
        </div>
      ) : (
        <div className="p-6 rounded-xl bg-white/[0.018] border border-[var(--color-border)] text-left space-y-6 w-full">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-white tracking-tight">
                Contact support
              </h3>
              <p className="text-[13px] text-[var(--color-text-muted)]">We&apos;re available 24/7.</p>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/[0.07] border border-red-500/20 text-red-400 text-[13px] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-[var(--color-text-muted)]">First name *</label>
                <input 
                  name="firstName"
                  type="text" 
                  required
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="w-full h-10 bg-white/[0.02] border border-[var(--color-border)] rounded-lg px-3 text-[13px] text-white outline-none focus:border-accent transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-[var(--color-text-muted)]">Last name *</label>
                <input 
                  name="lastName"
                  type="text" 
                  required
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="w-full h-10 bg-white/[0.02] border border-[var(--color-border)] rounded-lg px-3 text-[13px] text-white outline-none focus:border-accent transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-[var(--color-text-muted)]">Contact email *</label>
                <input 
                  name="contactEmail"
                  type="email" 
                  required
                  value={formData.contactEmail}
                  onChange={handleInputChange}
                  className="w-full h-10 bg-white/[0.02] border border-[var(--color-border)] rounded-lg px-3 text-[13px] text-white outline-none focus:border-accent transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-[var(--color-text-muted)]">Contact number</label>
                <input 
                  name="contactNumber"
                  type="text" 
                  value={formData.contactNumber}
                  onChange={handleInputChange}
                  className="w-full h-10 bg-white/[0.02] border border-[var(--color-border)] rounded-lg px-3 text-[13px] text-white outline-none focus:border-accent transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-[var(--color-text-muted)]">Issue type</label>
                <div className="relative">
                  <select
                    name="errorType"
                    className="w-full h-10 pl-3 pr-8 bg-white/[0.02] border border-[var(--color-border)] rounded-lg text-[13px] text-white/80 outline-none focus:border-accent transition-colors appearance-none cursor-pointer"
                  >
                    <option value="General" className="bg-[#0b0b0e] text-white">General inquiry</option>
                    <option value="Transaction" className="bg-[#0b0b0e] text-white">Transaction issue</option>
                    <option value="Dispute" className="bg-[#0b0b0e] text-white">Task dispute</option>
                    <option value="SLA" className="bg-[#0b0b0e] text-white">SLA/delivery dispute</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-text-muted)]">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-[var(--color-text-muted)]">Relevant links (PR, task ID)</label>
                <input 
                  name="relevantLinks"
                  type="text" 
                  className="w-full h-10 bg-white/[0.02] border border-[var(--color-border)] rounded-lg px-3 text-[13px] text-white outline-none focus:border-accent transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-[var(--color-text-muted)]">Message *</label>
              <textarea
                name="message"
                required
                rows={4}
                className="w-full bg-white/[0.02] border border-[var(--color-border)] rounded-lg p-3 text-[13px] text-white outline-none focus:border-accent transition-colors resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="h-10 w-full text-[13px] font-medium rounded-lg ui-btn-primary transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting…' : (
                <>
                  <Send className="w-4 h-4" /> Submit ticket
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
