'use client'

import React, { useState } from 'react'
import { submitSupportEnquiry } from '@/app/(app)/support/actions'
import { Headphones, Send, CheckCircle2, AlertTriangle } from 'lucide-react'

export default function SupportForm() {
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    const res = await submitSupportEnquiry(formData)
    
    setLoading(false)
    if (res.success) {
      setSuccess(true)
    } else {
      setError(res.error || 'Something went wrong')
    }
  }

  return (
    <div className="w-full flex flex-col justify-center">
      {success ? (
        <div className="p-12 rounded-[2.5rem] bg-[#0b0b0e] border border-white/[0.04] text-center space-y-6 shadow-2xl animate-in fade-in duration-500 max-w-md mx-auto w-full">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto shadow-inner">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="font-serif text-2xl text-white">Ticket Submitted</h3>
            <p className="text-white/40 text-xs leading-relaxed">
              Your support request has been logged in our secure telemetry table. An agent will respond shortly.
            </p>
          </div>
          <button 
            onClick={() => setSuccess(false)}
            className="px-5 py-2.5 bg-white/[0.02] border border-white/5 hover:border-accent/40 rounded-xl text-white/60 hover:text-white font-black text-[9px] uppercase tracking-widest transition-all cursor-pointer"
          >
            Submit New Ticket
          </button>
        </div>
      ) : (
        <div className="p-8 rounded-[2.5rem] bg-[#0b0b0e] border border-white/[0.04] text-left shadow-2xl relative overflow-hidden space-y-8 w-full">
          <div className="absolute right-0 top-0 w-80 h-80 bg-accent/[0.015] rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0">
              <Headphones className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h3 className="font-serif text-2xl text-white tracking-wide">
                Contact <span className="text-accent italic">Support</span>
              </h3>
              <p className="text-[9px] text-white/30 font-black uppercase tracking-widest font-mono">24/7 client operations queue</p>
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2 font-medium">
              <AlertTriangle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-wider text-white/40 font-mono">First Name *</label>
                <input 
                  name="firstName"
                  type="text" 
                  required
                  className="w-full h-11 bg-white/[0.01] border border-white/5 rounded-xl px-4 text-xs text-white outline-none focus:border-accent transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-wider text-white/40 font-mono">Last Name *</label>
                <input 
                  name="lastName"
                  type="text" 
                  required
                  className="w-full h-11 bg-white/[0.01] border border-white/5 rounded-xl px-4 text-xs text-white outline-none focus:border-accent transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-wider text-white/40 font-mono">Contact Email *</label>
                <input 
                  name="contactEmail"
                  type="email" 
                  required
                  className="w-full h-11 bg-white/[0.01] border border-white/5 rounded-xl px-4 text-xs text-white outline-none focus:border-accent transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-wider text-white/40 font-mono">Contact Number</label>
                <input 
                  name="contactNumber"
                  type="text" 
                  className="w-full h-11 bg-white/[0.01] border border-white/5 rounded-xl px-4 text-xs text-white outline-none focus:border-accent transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-wider text-white/40 font-mono">Error Type</label>
                <div className="relative">
                  <select
                    name="errorType"
                    className="w-full h-11 pl-4 pr-8 bg-white/[0.01] border border-white/5 rounded-xl text-[10px] font-black tracking-wider uppercase text-white/60 outline-none focus:border-accent transition-all appearance-none cursor-pointer"
                  >
                    <option value="General" className="bg-[#0b0b0e] text-white">General Inquiry</option>
                    <option value="Transaction" className="bg-[#0b0b0e] text-white">Transaction Issue</option>
                    <option value="Dispute" className="bg-[#0b0b0e] text-white">Task Dispute</option>
                    <option value="SLA" className="bg-[#0b0b0e] text-white">SLA/Delivery Dispute</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/30">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-wider text-white/40 font-mono">Relevant Links (PR, Task ID)</label>
                <input 
                  name="relevantLinks"
                  type="text" 
                  className="w-full h-11 bg-white/[0.01] border border-white/5 rounded-xl px-4 text-xs text-white outline-none focus:border-accent transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-wider text-white/40 font-mono">Message Description *</label>
              <textarea 
                name="message"
                required
                rows={4}
                className="w-full bg-white/[0.01] border border-white/5 rounded-xl p-4 text-xs text-white outline-none focus:border-accent transition-all resize-none"
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="h-11 w-full text-[10px] font-black uppercase tracking-widest rounded-xl bg-gradient-to-b from-accent to-[#d97706] hover:translate-y-[1px] hover:shadow-[0_4px_15px_rgba(255,122,0,0.25)] transition-all text-[#050505] flex items-center justify-center gap-2 cursor-pointer font-bold disabled:opacity-55 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting ticket...' : (
                <>
                  <Send className="w-3.5 h-3.5 stroke-[2.5px]" /> Submit Ticket
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
