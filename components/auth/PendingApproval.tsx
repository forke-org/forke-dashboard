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

import React from 'react'
import { CheckCircle2, Zap, Mail, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { signOutAction } from '@/lib/auth-actions'
import Image from 'next/image'

export default function PendingApproval({ userEmail }: { userEmail?: string | null }) {
  return (
    <div className="h-screen w-full bg-[#0A0A0A] flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
      {/* Ambient Orbs */}
      <div className="absolute top-1/4 -right-20 w-64 h-64 bg-accent/10 blur-[100px] rounded-full" />
      <div className="absolute bottom-1/4 -left-20 w-48 h-48 bg-accent/5 blur-[80px] rounded-full" />

      <div className="w-full max-w-[500px] space-y-8 relative z-10 animate-in fade-in zoom-in duration-700">
        <div className="flex justify-center mb-6">
          <div className="h-[120px] flex items-center justify-center relative">
            <div className="absolute inset-0 bg-accent/20 blur-3xl rounded-full scale-150 animate-pulse" />
            <Image 
              src="/forke-assets/forke_logo.png" 
              alt="Forke Logo" 
              width={160} 
              height={160} 
              className="relative z-10 drop-shadow-[0_0_25px_rgba(255,122,0,0.6)]"
            />
          </div>
        </div>
        
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent relative">
            <CheckCircle2 className="w-10 h-10" />
          </div>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-4xl font-medium text-white tracking-[-0.03em]">Application <span className="font-serif italic font-normal text-accent">Under Review</span></h2>
          <div className="space-y-6 text-white/50 leading-relaxed max-w-[400px] mx-auto text-sm">
            <p>
              Thank you for your interest in joining the Forke network. Our team is currently reviewing your professional credentials to maintain our platform's quality standards.
            </p>
            
            <div className="grid grid-cols-1 gap-3">
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
                <p className="text-white/80 font-bold flex items-center justify-center gap-2 text-xs uppercase tracking-widest">
                  <Zap className="w-3 h-3 text-accent" /> Review Timeline
                </p>
                <p className="text-[12px]">Your profile will be vetted within <span className="text-white font-bold">24-48 hours</span>.</p>
              </div>
              
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
                <p className="text-white/80 font-bold flex items-center justify-center gap-2 text-xs uppercase tracking-widest">
                  <Mail className="w-3 h-3 text-accent" /> Notification
                </p>
                <p className="text-[12px]">An email will be sent to <span className="text-white font-bold">{userEmail || 'your inbox'}</span> once approved.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col items-center gap-4">
          <Button 
            onClick={() => signOutAction()}
            variant="outline" 
            className="rounded-full px-8 py-3 border-white/10 text-white/40 hover:text-white transition-all uppercase tracking-widest text-[10px] font-black flex items-center gap-2"
          >
            <LogOut className="w-3 h-3" /> Sign Out
          </Button>
          <p className="text-[9px] text-white/10 font-bold uppercase tracking-[0.2em]">Restricted Access Unit // Forke Nexus</p>
        </div>
      </div>
    </div>
  )
}
