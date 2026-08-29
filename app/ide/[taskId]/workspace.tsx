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

import React, { useState, useEffect, useRef } from 'react'
import { signIn } from 'next-auth/react'
import {
  Folder,
  FileCode,
  CheckCircle2,
  Lock,
  Loader2,
  ExternalLink,
  AlertTriangle,
  ArrowRight,
  Play,
  Check,
  Terminal,
  Activity,
  Code
} from 'lucide-react'
import {
  inviteDeveloperToMirror,
  checkInvitationStatus,
  createWorkspaceBranchAndCodespace
} from '@/lib/actions/codespaces'

interface WorkspaceProps {
  taskId: string
  taskTitle: string
  taskBudget: number
  isGithubConnected: boolean
  devUsername: string | null
  developerUserId: string
  repoPath: string
  initialCodespaceUrl: string | null
  initialCodespaceName: string | null
  initialCodespaceStatus: string | null
}

type WorkspaceState =
  | 'OAUTH_REQUIRED'
  | 'INVITE_PENDING'
  | 'INVITE_CHECKING'
  | 'PROVISIONING'
  | 'PROVISION_FAILED'
  | 'ACTIVE'

export function Workspace({
  taskId,
  taskTitle,
  taskBudget,
  isGithubConnected,
  devUsername,
  developerUserId,
  repoPath,
  initialCodespaceUrl,
  initialCodespaceName,
  initialCodespaceStatus
}: WorkspaceProps) {
  // Determine initial state
  const getInitialState = (): WorkspaceState => {
    if (!isGithubConnected) return 'OAUTH_REQUIRED'
    if (initialCodespaceUrl && initialCodespaceStatus === 'available') return 'ACTIVE'
    return 'INVITE_PENDING'
  }

  const [state, setState] = useState<WorkspaceState>(getInitialState())
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [inviteUrl, setInviteUrl] = useState<string>(`https://github.com/${repoPath}/invitations`)
  const [consoleLogs, setConsoleLogs] = useState<string[]>([])
  const [codespaceUrl, setCodespaceUrl] = useState<string | null>(initialCodespaceUrl)
  const [codespaceName, setCodespaceName] = useState<string | null>(initialCodespaceName)

  const logIndexRef = useRef(0)

  // 1. Handle auto-invitation trigger on mount
  useEffect(() => {
    if (state === 'INVITE_PENDING' && isGithubConnected) {
      triggerInviteFlow()
    }
  }, [state])

  const triggerInviteFlow = async () => {
    try {
      addLogLine('INIT', 'Connecting to Forke workspace orchestrator...')
      const result = await inviteDeveloperToMirror(taskId, developerUserId)
      
      if (result.accepted) {
        addLogLine('SUCCESS', 'Collaborator privileges verified. Transitioning to provisioner...')
        setState('PROVISIONING')
      } else {
        if (result.htmlUrl) {
          setInviteUrl(result.htmlUrl)
        }
        addLogLine('INVITE', `Repository invitation generated. Awaiting developer acceptance on GitHub.`)
      }
    } catch (err: any) {
      console.error('Failed to trigger invite:', err)
      setErrorMessage(err.message || 'Failed to initiate collaborator access.')
      setState('PROVISION_FAILED')
    }
  }

  // 2. Handle invite acceptance check
  const handleCheckInvite = async () => {
    setState('INVITE_CHECKING')
    try {
      addLogLine('CHECKING', 'Checking GitHub collaboration list...')
      const { accepted } = await checkInvitationStatus(taskId, developerUserId)
      
      if (accepted) {
        addLogLine('SUCCESS', 'Collaboration accepted! Launching container builder...')
        setState('PROVISIONING')
      } else {
        addLogLine('WARNING', 'Invitation not accepted yet. Please visit GitHub and accept the invite first.')
        setState('INVITE_PENDING')
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Verification failed. Try again.')
      setState('INVITE_PENDING')
    }
  }

  // 3. Handle provisioning logs and API call
  useEffect(() => {
    if (state === 'PROVISIONING') {
      startProvisioning()
    }
  }, [state])

  const addLogLine = (tag: string, message: string) => {
    const time = new Date().toLocaleTimeString()
    setConsoleLogs((prev) => [...prev, `[${time}] [${tag}] ${message}`])
  }

  const startProvisioning = async () => {
    setConsoleLogs([])
    logIndexRef.current = 0
    
    // Setup rolling logs simulation
    const logsSequence = [
      { tag: 'SYSTEM', msg: 'Initiating developer workspace...' },
      { tag: 'GIT', msg: `Checking branch refs on mirror repo ${repoPath}...` },
      { tag: 'GIT', msg: `Branch refs verified. Provisioning new workspace branch dev-${devUsername}/task-${taskId}...` },
      { tag: 'VM', msg: 'Booting secure container container on GitHub Cloud...' },
      { tag: 'VM', msg: 'Allocating vCPU and memory (2 vCPUs, 4GB RAM configuration)...' },
      { tag: 'VM', msg: 'Initializing development runtimes (Node, Python, Go, Drizzle-Kit)...' },
      { tag: 'NETWORK', msg: 'Opening container WebSockets listener on port 3012...' },
      { tag: 'NETWORK', msg: 'Syncing VS Code settings and credentials from GitHub profile...' },
    ]

    const interval = setInterval(() => {
      if (logIndexRef.current < logsSequence.length) {
        const line = logsSequence[logIndexRef.current]
        addLogLine(line.tag, line.msg)
        logIndexRef.current++
      } else {
        clearInterval(interval)
      }
    }, 1500)

    try {
      const result = await createWorkspaceBranchAndCodespace(taskId, developerUserId)
      clearInterval(interval)
      
      addLogLine('SUCCESS', 'Codespace VM running successfully!')
      setCodespaceUrl(result.codespaceUrl)
      setCodespaceName(result.codespaceName)
      
      // Let it sit for a second so they see the success logs
      setTimeout(() => {
        setState('ACTIVE')
      }, 1000)
    } catch (err: any) {
      clearInterval(interval)
      console.error('Provisioning error:', err)
      setErrorMessage(err.message || 'Orchestrator timed out spinning up the Codespace.')
      setState('PROVISION_FAILED')
    }
  }

  useEffect(() => {
    const handleIframeMessage = (event: MessageEvent) => {
      // Catch submit task request from custom VS Code extension
      if (event.data && event.data.type === 'FORKE_SUBMIT_CLICKED') {
        console.log('[Forke IDE] Received submission message from embedded frame.')
        handleClaimSubmit()
      }
    }
    
    window.addEventListener('message', handleIframeMessage)
    return () => window.removeEventListener('message', handleIframeMessage)
  }, [])

  // Auto-redirect to full-screen Codespace workspace when active
  useEffect(() => {
    if (state === 'ACTIVE' && codespaceUrl) {
      window.location.replace(codespaceUrl)
    }
  }, [state, codespaceUrl])

  const handleClaimSubmit = () => {
    // Parent window catches submission, trigger normal submit pipeline
    alert('Submit Task modal will launch. We are pulling your commit changes from the Codespace mirror branch!')
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0D0F12] text-gray-200 overflow-hidden font-sans">
      
      {/* ─── Premium Main Header ─────────────────────────────────────── */}
      <header className="flex items-center justify-between px-6 py-4 bg-[#14181E] border-b border-[#222B36] z-10">
        <div className="flex items-center space-x-3">
          <span className="font-extrabold text-lg text-white tracking-wider flex items-center">
            <span className="text-[#FF7A00]">FORKE</span>
            <span className="text-gray-400 font-light mx-2">/</span>
            <span className="text-[#00C2FF] font-medium text-sm">IDE</span>
          </span>
          <div className="h-4 w-px bg-[#222B36]" />
          <span className="text-xs px-2 py-0.5 rounded-full bg-[#1C242E] text-gray-400 border border-[#2B384A]">
            Task #{taskId.slice(0, 5)}
          </span>
        </div>
        
        <div className="text-center">
          <span className="text-sm font-semibold text-white tracking-wide">{taskTitle}</span>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Bounty Escrow</span>
            <span className="text-sm font-bold text-[#FF7A00]">₹{taskBudget / 100} INR</span>
          </div>
          
          <button
            onClick={handleClaimSubmit}
            disabled={state !== 'ACTIVE'}
            className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center transition-all ${
              state === 'ACTIVE'
                ? 'bg-gradient-to-r from-[#FF7A00] to-[#FF9E40] text-white hover:shadow-[0_0_15px_rgba(255,122,0,0.4)] cursor-pointer'
                : 'bg-[#1C222B] text-gray-500 border border-[#2D3848] cursor-not-allowed'
            }`}
          >
            Submit Task
          </button>
        </div>
      </header>

      {/* ─── Workspace Editor Layout (Active Frame / Blurred Preview) ─── */}
      <div className="flex flex-1 relative overflow-hidden">
        
        {/* Mock Editor Canvas (Visible but blurred if not active) */}
        <div 
          className={`flex flex-1 h-full w-full transition-all duration-700 ${
            state !== 'ACTIVE' ? 'filter blur-[4px] grayscale-[50%] pointer-events-none opacity-40' : ''
          }`}
        >
          {/* File Explorer mock sidebar */}
          <div className="w-64 bg-[#11151B] border-r border-[#222B36] flex flex-col">
            <div className="px-4 py-3 border-b border-[#222B36] flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Workspace Files</span>
            </div>
            <div className="flex-1 p-2 space-y-1 overflow-y-auto text-sm text-gray-400">
              <div className="flex items-center space-x-2 p-1.5 rounded hover:bg-[#1A202C] cursor-pointer">
                <Folder size={16} className="text-[#00C2FF]" />
                <span>components</span>
              </div>
              <div className="pl-6 flex items-center space-x-2 p-1.5 rounded hover:bg-[#1A202C] cursor-pointer">
                <FileCode size={14} className="text-[#A78BFA]" />
                <span>Navbar.tsx</span>
              </div>
              <div className="pl-6 flex items-center space-x-2 p-1.5 rounded hover:bg-[#1A202C] cursor-pointer">
                <FileCode size={14} className="text-[#A78BFA]" />
                <span>MobileMenu.tsx</span>
              </div>
              <div className="flex items-center space-x-2 p-1.5 rounded hover:bg-[#1A202C] cursor-pointer">
                <Folder size={16} className="text-[#00C2FF]" />
                <span>styles</span>
              </div>
              <div className="pl-6 flex items-center space-x-2 p-1.5 rounded hover:bg-[#1A202C] cursor-pointer text-gray-200 bg-[#1E2633]">
                <FileCode size={14} className="text-[#60A5FA]" />
                <span>globals.css</span>
              </div>
              <div className="flex items-center space-x-2 p-1.5 rounded hover:bg-[#1A202C] cursor-pointer">
                <FileCode size={16} className="text-[#FBBF24]" />
                <span>package.json</span>
              </div>
              <div className="flex items-center space-x-2 p-1.5 rounded hover:bg-[#1A202C] cursor-pointer">
                <FileCode size={16} className="text-[#34D399]" />
                <span>tailwind.config.ts</span>
              </div>
            </div>
          </div>

          {/* Monaco Editor mock container */}
          <div className="flex-1 flex flex-col bg-[#0D0F12]">
            {/* Mock Tabs */}
            <div className="flex bg-[#11151B] border-b border-[#222B36] text-xs">
              <div className="px-4 py-3 bg-[#0D0F12] border-r border-[#222B36] border-t-2 border-[#FF7A00] flex items-center space-x-2 text-white">
                <FileCode size={14} className="text-[#60A5FA]" />
                <span>globals.css</span>
              </div>
              <div className="px-4 py-3 border-r border-[#222B36] flex items-center space-x-2 text-gray-400 hover:text-white cursor-pointer">
                <FileCode size={14} className="text-[#A78BFA]" />
                <span>Navbar.tsx</span>
              </div>
            </div>
            
            {/* Mock Code Line Content */}
            <div className="flex-1 p-6 font-mono text-sm overflow-y-auto leading-relaxed text-[#D4D4D4] select-none">
              <div className="flex"><span className="w-8 text-gray-600 text-right pr-4">1</span><span className="text-[#6A9955]">/* Tailwind mobile styles wrapper */</span></div>
              <div className="flex"><span className="w-8 text-gray-600 text-right pr-4">2</span><span>@layer base &#123;</span></div>
              <div className="flex"><span className="w-8 text-gray-600 text-right pr-4">3</span><span className="pl-4">body &#123;</span></div>
              <div className="flex"><span className="w-8 text-gray-600 text-right pr-4">4</span><span className="pl-8">@apply bg-[#0A0A0A] text-white;</span></div>
              <div className="flex"><span className="w-8 text-gray-600 text-right pr-4">5</span><span className="pl-4">&#125;</span></div>
              <div className="flex"><span className="w-8 text-gray-600 text-right pr-4">6</span><span>&#125;</span></div>
              <div className="flex"><span className="w-8 text-gray-600 text-right pr-4">7</span><span></span></div>
              <div className="flex"><span className="w-8 text-gray-600 text-right pr-4">8</span><span className="text-[#569CD6]">.navbar-mobile-overlay</span><span> &#123;</span></div>
              <div className="flex"><span className="w-8 text-gray-600 text-right pr-4">9</span><span className="pl-4 text-[#9CDCFE]">backdrop-filter</span><span>: blur(8px);</span></div>
              <div className="flex"><span className="w-8 text-gray-600 text-right pr-4">10</span><span className="pl-4 text-[#9CDCFE]">background</span><span>: rgba(13, 15, 18, 0.75);</span></div>
              <div className="flex"><span className="w-8 text-gray-600 text-right pr-4">11</span><span className="pl-4 text-[#9CDCFE]">transition</span><span>: all 0.3s ease-in-out;</span></div>
              <div className="flex"><span className="w-8 text-gray-600 text-right pr-4">12</span><span>&#125;</span></div>
            </div>

            {/* Mock Bottom Terminal Panel */}
            <div className="h-48 bg-[#080A0D] border-t border-[#222B36] flex flex-col">
              <div className="px-4 py-2 bg-[#10141A] border-b border-[#222B36] flex items-center space-x-2">
                <Terminal size={14} className="text-[#FF7A00]" />
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Terminal</span>
              </div>
              <div className="flex-1 p-4 font-mono text-xs text-green-500 overflow-y-auto leading-relaxed select-none">
                <div>$ npm run dev</div>
                <div className="text-gray-400">ready - started server on 0.0.0.0:3000, url: http://localhost:3000</div>
                <div className="text-gray-400">event - compiled client and server successfully in 321ms (18 modules)</div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── State-Driven Overlay Container ─────────────────────────── */}
        {state !== 'ACTIVE' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/45 z-20 transition-all duration-300">
            
            {/* State A: GitHub OAuth Connect Modal */}
            {state === 'OAUTH_REQUIRED' && (
              <div className="bg-[#14181F]/90 backdrop-blur-xl border border-[#2D3A4B] p-8 rounded-2xl max-w-md w-full text-center shadow-2xl animate-fade-in">
                <div className="mx-auto w-16 h-16 bg-gradient-to-tr from-[#FF7A00]/20 to-[#FF9E40]/20 rounded-full flex items-center justify-center border border-[#FF7A00]/30 mb-6">
                  <Lock className="text-[#FF7A00]" size={28} />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">GitHub Connection Required</h3>
                <p className="text-sm text-gray-400 mb-8 leading-relaxed">
                  To start coding inside the Forke secure sandbox, you must link your GitHub profile. We will automatically create your isolated task branch.
                </p>
                <button
                  onClick={() => signIn('github')}
                  className="w-full py-3 bg-gradient-to-r from-[#FF7A00] to-[#FF9E40] text-white font-bold rounded-xl hover:shadow-[0_0_20px_rgba(255,122,0,0.3)] transition-all cursor-pointer flex items-center justify-center space-x-2 text-sm"
                >
                  <span>Connect GitHub Profile</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            )}

            {/* State B: Collaborator Invite Acceptance Required */}
            {(state === 'INVITE_PENDING' || state === 'INVITE_CHECKING') && (
              <div className="bg-[#14181F]/90 backdrop-blur-xl border border-[#2D3A4B] p-8 rounded-2xl max-w-md w-full text-center shadow-2xl animate-fade-in">
                <div className="mx-auto w-16 h-16 bg-[#1D2B3F] rounded-full flex items-center justify-center border border-[#3E5C8A] mb-6 animate-pulse">
                  <Activity className="text-[#00C2FF]" size={28} />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Accept Collaborator Invite</h3>
                <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                  GitHub requires you to accept the collaborator invitation to the private mirror repository before a Codespace container can be launched.
                </p>
                
                <div className="space-y-4">
                  <a
                    href={inviteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 bg-[#1C2532] text-[#00C2FF] font-semibold border border-[#2B3D55] hover:bg-[#253347] transition-all rounded-xl flex items-center justify-center space-x-2 text-xs cursor-pointer"
                  >
                    <span>1. Accept Invite on GitHub</span>
                    <ExternalLink size={14} />
                  </a>

                  <button
                    onClick={handleCheckInvite}
                    disabled={state === 'INVITE_CHECKING'}
                    className="w-full py-3 bg-gradient-to-r from-[#FF7A00] to-[#FF9E40] text-white font-bold rounded-xl hover:shadow-[0_0_15px_rgba(255,122,0,0.3)] transition-all flex items-center justify-center space-x-2 text-sm cursor-pointer disabled:opacity-50"
                  >
                    {state === 'INVITE_CHECKING' ? (
                      <>
                        <Loader2 className="animate-spin" size={16} />
                        <span>Verifying Status...</span>
                      </>
                    ) : (
                      <>
                        <span>2. I Have Accepted Invitation</span>
                        <Check size={16} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* State C: Codespace Container Provisioner Console */}
            {state === 'PROVISIONING' && (
              <div className="bg-[#080A0D]/95 border border-[#222B36] p-6 rounded-xl max-w-2xl w-full shadow-2xl flex flex-col h-96 animate-fade-in font-mono">
                <div className="flex items-center space-x-2 border-b border-[#222B36] pb-3 mb-4">
                  <Loader2 className="animate-spin text-[#FF7A00]" size={16} />
                  <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Orchestrator Sandbox Builder</span>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-2 text-xs text-gray-400">
                  {consoleLogs.map((log, idx) => (
                    <div key={idx} className="whitespace-pre-wrap leading-relaxed animate-fade-in">
                      {log}
                    </div>
                  ))}
                  <div className="text-green-400 animate-pulse">_</div>
                </div>
              </div>
            )}

            {/* State D: Provisioner Failure Screen */}
            {state === 'PROVISION_FAILED' && (
              <div className="bg-[#14181F]/90 backdrop-blur-xl border border-red-500/30 p-8 rounded-2xl max-w-md w-full text-center shadow-2xl animate-fade-in">
                <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/30 mb-6">
                  <AlertTriangle className="text-red-500" size={28} />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Provisioning Failed</h3>
                <p className="text-sm text-gray-400 mb-8 leading-relaxed">
                  {errorMessage || 'An error occurred during build orchestrations.'}
                </p>
                <button
                  onClick={() => {
                    setState('INVITE_PENDING')
                    setErrorMessage('')
                  }}
                  className="w-full py-3 bg-[#1C2532] text-gray-300 font-bold border border-[#2B3D55] hover:bg-[#253347] transition-all rounded-xl text-sm cursor-pointer"
                >
                  Go Back & Retry
                </button>
              </div>
            )}

          </div>
        )}

        {/* ─── Direct Codespace Redirection Screen ────────────────────── */}
        {state === 'ACTIVE' && codespaceUrl && (
          <div className="flex-grow h-full w-full flex flex-col items-center justify-center bg-[#0D0F12] text-center p-8 select-none">
            <div className="mx-auto w-16 h-16 bg-gradient-to-tr from-[#00C2FF]/20 to-[#A78BFA]/20 rounded-full flex items-center justify-center border border-[#00C2FF]/30 mb-6 animate-pulse">
              <Code className="text-[#00C2FF]" size={28} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Redirecting to Workspace</h3>
            <p className="text-sm text-gray-400 mb-8 leading-relaxed max-w-sm">
              Opening your secure cloud environment in this window. If you are not redirected automatically within a few seconds, click the launch button.
            </p>
            <a
              href={codespaceUrl}
              className="px-6 py-3 bg-gradient-to-r from-[#FF7A00] to-[#FF9E40] text-white font-bold rounded-xl text-xs hover:shadow-[0_0_20px_rgba(255,122,0,0.3)] transition-all cursor-pointer flex items-center justify-center space-x-2 border border-[#FF7A00]/20 font-sans"
            >
              <span>Launch VS Code Workspace</span>
              <ExternalLink size={14} />
            </a>
          </div>
        )}

      </div>
    </div>
  )
}
