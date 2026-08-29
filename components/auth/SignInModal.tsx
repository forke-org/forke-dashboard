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
import { useAuthModal } from './AuthContext'
import { Button } from '@/components/ui/Button'
import { signInWithGoogle } from '@/lib/auth-actions'
import { Eye, EyeOff } from 'lucide-react'
import Image from 'next/image'

function GithubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  )
}

export default function SignInModal() {
  const { isSignInModalOpen, closeSignInModal } = useAuthModal()
  const [showPassword, setShowPassword] = useState(false)

  if (!isSignInModalOpen) return null

  const handleSignIn = async (role: 'developer' | 'owner') => {
    await signInWithGoogle(role)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/90 backdrop-blur-md transition-opacity duration-300" 
        onClick={closeSignInModal}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-[1000px] bg-bg border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row transform transition-transform duration-300 scale-100">
        
        {/* Left Panel: Manga Panel */}
        <div className="relative w-full md:w-1/2 h-[300px] md:h-auto overflow-hidden">
          <Image
            src="/forke-assets/auth-assets/manga-panel-desktop.png"
            alt="Manga Panel"
            fill
            className="object-cover"
            priority
          />
          {/* Subtle Overlay to blend with the dark theme if needed */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-bg/10" />
        </div>

        {/* Right Panel: Auth Form */}
        <div className="w-full md:w-1/2 p-10 md:p-14 flex flex-col items-center justify-center space-y-10 bg-[#0A0A0A]">
          
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 relative">
               <svg viewBox="0 0 24 24" className="w-full h-full text-accent fill-current">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" />
                <path d="M2 17L12 22L22 17M2 12L12 17L22 12" />
               </svg>
            </div>
            <span className="text-2xl font-semibold tracking-[-0.04em] text-white">forke<span className="text-accent">*</span></span>
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-white tracking-tight">Welcome back</h2>
            <p className="text-muted text-sm font-medium">
              Ship real work. Earn <span className="text-[#A855F7]">XP</span>. Get <span className="text-[#10B981]">paid</span>.
            </p>
          </div>

          <div className="w-full space-y-6">
            {/* Social Logins */}
            <div className="grid grid-cols-2 gap-4 relative">
              <div className="absolute -top-3 left-[25%] -translate-x-1/2 z-10">
                <span className="bg-[#6366F1] text-[10px] text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Last Used</span>
              </div>
              <Button 
                variant="outline" 
                className="w-full gap-3 py-6 border-white/10 bg-white/[0.02] hover:bg-white/5 text-sm font-semibold rounded-xl"
                onClick={() => handleSignIn('developer')}
              >
                <Image src="/forke-assets/landing-assets/google-icon.svg" alt="Google" width={20} height={20} />
                Google
              </Button>
              <Button 
                variant="outline" 
                className="w-full gap-3 py-6 border-white/10 bg-white/[0.02] hover:bg-white/5 text-sm font-semibold rounded-xl"
              >
                <GithubIcon className="w-5 h-5 text-white" />
                GitHub
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/5" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#0A0A0A] px-2 text-muted font-bold tracking-widest">OR</span>
              </div>
            </div>

            {/* Credentials Form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <input 
                  type="email" 
                  placeholder="Email" 
                  className="w-full bg-[#1A1A1A] border border-white/5 rounded-xl px-5 py-4 text-white placeholder:text-white/20 focus:outline-none focus:border-accent/30 transition-all"
                />
              </div>
              <div className="space-y-2 relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Password" 
                  className="w-full bg-[#1A1A1A] border border-white/5 rounded-xl px-5 py-4 text-white placeholder:text-white/20 focus:outline-none focus:border-accent/30 transition-all"
                />
                <button 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button className="w-full py-7 text-lg font-bold rounded-xl bg-[#6366F1] hover:bg-[#5558E6] text-white shadow-lg shadow-indigo-500/10">
              Continue
            </Button>
          </div>

          <div className="text-center space-y-4 pt-4">
            <p className="text-xs text-muted font-medium">
              Forgot your password? <button className="text-white hover:underline">Reset Your Password</button>
            </p>
            <p className="text-xs text-muted font-medium">
              Don't have an account? <button className="text-white hover:underline">Register</button>
            </p>
          </div>

          <p className="text-[10px] text-muted/50 text-center max-w-[280px]">
            By continuing, you agree to our <button className="hover:text-white">Terms of Service</button> and <button className="hover:text-white">Privacy Policy</button>.
          </p>

        </div>

        {/* Close Button */}
        <button 
          onClick={closeSignInModal}
          className="absolute top-6 right-6 text-white/20 hover:text-white transition-colors z-20"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

      </div>
    </div>
  )
}
