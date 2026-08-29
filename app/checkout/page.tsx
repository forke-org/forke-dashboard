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

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Lock, Eye, EyeOff } from 'lucide-react'

export default function CheckoutPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      const data = await res.json()

      if (data.success) {
        router.push('/')
        router.refresh()
      } else {
        setError(data.message || 'Incorrect password.')
        setIsLoading(false)
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[20%] left-[30%] w-[600px] h-[600px] bg-accent/[0.03] rounded-full blur-[120px]" />
        <div className="absolute bottom-[20%] right-[30%] w-[500px] h-[500px] bg-accent/[0.02] rounded-full blur-[150px]" />
      </div>

      <div className="w-full max-w-[360px] space-y-8 relative z-10">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center h-20 relative mb-4">
            <div className="w-32 h-32 absolute bottom-0" style={{ animation: 'pulse-slow 5s ease-in-out infinite' }}>
              <Image 
                src="/forke-assets/forke_logo.png" 
                alt="Forke Logo" 
                fill
                className="object-contain drop-shadow-[0_0_20px_rgba(255,122,0,0.5)] select-none pointer-events-none"
                draggable={false}
              />
            </div>
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-serif text-white tracking-tight leading-tight">Access <span className="text-accent italic">Portal</span></h1>
            <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.4em]">Authorized Personnel Only</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 rounded-[2rem] bg-black/70 border border-white/10 space-y-6 backdrop-blur-[50px] shadow-[0_32px_64px_-16px_rgba(0,0,0,1)] relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold text-center" style={{ animation: 'shake 0.3s ease-in-out' }}>
              {error}
            </div>
          )}

          <div className="space-y-2 relative z-10">
            <label className="text-[9px] text-white/40 font-black uppercase tracking-widest ml-1 flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-accent" /> Password
            </label>
            <div className="relative">
              <input 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
                type={showPassword ? "text" : "password"} 
                className="w-full h-12 bg-white/[0.02] border border-white/10 rounded-xl pl-5 pr-12 text-sm text-white placeholder:text-white/10 focus:outline-none focus:border-accent/40 focus:bg-accent/[0.03] transition-all" 
                placeholder="••••••••" 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full h-14 text-sm font-black uppercase tracking-[0.15em] rounded-xl bg-accent hover:bg-accent/90 text-white shadow-xl shadow-accent/20 transition-all active:scale-[0.98] relative z-10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span>Verifying...</span>
              </div>
            ) : (
              'Enter'
            )}
          </button>
        </form>
      </div>

      <style jsx global>{`
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1); opacity: 1; filter: brightness(1); }
          50% { transform: scale(1.05); opacity: 0.9; filter: brightness(1.2); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
      `}</style>
    </div>
  )
}
