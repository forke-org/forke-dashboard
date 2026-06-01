import { db } from '@/lib/db'
import { users, owners, tasks } from '@/lib/db/schema'
import { eq, desc, sql, and } from 'drizzle-orm'
import { getLevelFromXp, getLevelTitle, getLevelProgress, getXpForCurrentLevel, getXpForNextLevel } from '@/lib/utils/xp'
import { Globe, Mail, Phone, Shield, Calendar, ArrowLeft, ExternalLink, Award, Terminal, Trophy, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { auth } from '@/auth'
import CopyProfileButton from '@/components/shared/CopyProfileButton'

const RESERVED_KEYWORDS = [
  'admin', 'api', 'checkout', 'privacy', 'register', 'signin', 'terms', 'waitlist', 
  'auth-error', 'profile', 'dashboard', 'tasks', 'submissions', 'earnings', 
  'messages', 'settings', 'support', 'developers', 'onboarding', 'post-task'
]

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" width="14" height="14">
      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
    </svg>
  )
}

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" width="14" height="14">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z" />
    </svg>
  )
}

// Generate dynamic Open Graph preview metadata for social sharing cards
export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>
}): Promise<Metadata> {
  const { username } = await params

  if (RESERVED_KEYWORDS.includes(username.toLowerCase())) {
    return {}
  }

  const dbUser = await db.query.users.findFirst({
    where: eq(users.username, username),
  })

  if (!dbUser) return {}

  const level = getLevelFromXp(dbUser.xp || 0)
  const isOwner = dbUser.role === 'owner'
  
  let companyName = ''
  if (isOwner) {
    const ownerData = await db.query.owners.findFirst({
      where: eq(owners.id, dbUser.id)
    })
    companyName = ownerData?.companyName || ''
  }

  const title = `${dbUser.username || dbUser.name} - Overview`
  
  // Fetch statistics
  const countRes = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(tasks)
    .where(isOwner ? eq(tasks.clientId, dbUser.id) : eq(tasks.claimantId, dbUser.id))
  const totalTasks = countRes[0]?.count || 0

  const subtitle = isOwner 
    ? `Verified employer at ${companyName || 'Forke'}` 
    : `Level ${level} (${getLevelTitle(level)}) Developer`

  const description = `${dbUser.bio || 'Building products on the Forke network.'} ${subtitle} • ${totalTasks} ${isOwner ? 'tasks posted' : 'completed/active claims'}.`

  return {
    title: title,
    description: description,
    openGraph: {
      title: title,
      description: description,
      images: [
        {
          url: dbUser.image || 'https://www.forke.space/icon.png',
          width: 800,
          height: 800,
          alt: dbUser.name,
        },
      ],
      type: 'profile',
      username: dbUser.username || undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description,
      images: [dbUser.image || 'https://www.forke.space/icon.png'],
    },
  }
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params

  if (RESERVED_KEYWORDS.includes(username.toLowerCase())) {
    notFound()
  }

  // Fetch full user record
  const dbUser = await db.query.users.findFirst({
    where: eq(users.username, username)
  })

  if (!dbUser) notFound()

  const session = await auth()
  const loggedInUser = session?.user

  let ownerDetails = null
  let totalTasks = 0
  const isOwner = dbUser.role === 'owner'

  if (isOwner) {
    ownerDetails = await db.query.owners.findFirst({
      where: eq(owners.id, dbUser.id)
    })
    
    const countRes = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(tasks)
      .where(eq(tasks.clientId, dbUser.id))
    totalTasks = countRes[0]?.count || 0
  } else {
    const countRes = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(tasks)
      .where(eq(tasks.claimantId, dbUser.id))
    totalTasks = countRes[0]?.count || 0
  }

  // Fetch tasks portfolio (up to 5 tasks)
  const portfolioTasks = await db
    .select()
    .from(tasks)
    .where(isOwner ? eq(tasks.clientId, dbUser.id) : eq(tasks.claimantId, dbUser.id))
    .orderBy(desc(tasks.createdAt))
    .limit(5)

  // Query financial metrics
  let totalSpend = 0
  let totalEarnings = 0

  if (isOwner) {
    const spendRes = await db
      .select({ total: sql<number>`sum(budget)::int` })
      .from(tasks)
      .where(and(
        eq(tasks.clientId, dbUser.id),
        eq(tasks.status, 'approved')
      ))
    totalSpend = (spendRes[0]?.total || 0) / 100
  } else {
    const earningsRes = await db
      .select({ total: sql<number>`sum(budget)::int` })
      .from(tasks)
      .where(and(
        eq(tasks.claimantId, dbUser.id),
        eq(tasks.status, 'approved')
      ))
    totalEarnings = (earningsRes[0]?.total || 0) / 100
  }

  // XP level computations
  const userXp = dbUser?.xp || 0
  const level = getLevelFromXp(userXp)
  const levelTitle = getLevelTitle(level)
  const xpProgress = getLevelProgress(userXp)
  const currentLevelXp = getXpForCurrentLevel(level)
  const nextLevelXp = getXpForNextLevel(level)
  
  const xpRequiredForNext = nextLevelXp ? (nextLevelXp - currentLevelXp) : 1000
  const xpGainedInCurrent = userXp - currentLevelXp
  const xpRemaining = nextLevelXp ? (nextLevelXp - userXp) : 0

  return (
    <div className="min-h-screen bg-[#060608] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900 via-[#060608] to-[#060608] text-white font-sans flex flex-col antialiased">
      
      {/* Public Header */}
      <header className="border-b border-white/5 bg-[#060608]/80 backdrop-blur-md sticky top-0 z-50 transition-colors">
        <div className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 select-none group">
            <span className="text-base font-black tracking-widest text-[#ff8a00] font-mono group-hover:text-white transition-colors">
              FORKE //
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#ff8a00] animate-pulse" />
          </Link>

          <div>
            {loggedInUser ? (
              <Link
                href="/dashboard"
                className="h-9 px-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer"
              >
                Go to Dashboard
              </Link>
            ) : (
              <Link
                href="/"
                className="h-9 px-4 rounded-lg bg-[#ff8a00] border border-[#ff8a00] hover:bg-[#ff8a00]/90 transition-all text-xs font-black text-[#0a0a0a] flex items-center gap-1.5 cursor-pointer"
              >
                Join Forke
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center py-8 md:py-12 px-5 relative overflow-hidden">
        {/* Futuristic Grid Lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:28px_28px] pointer-events-none" />

        <div className="max-w-3xl w-full space-y-6 relative z-10">
          
          {/* Main Profile Card */}
          <div className="rounded-2xl border border-white/[0.06] bg-[#0c0c0f]/60 backdrop-blur-xl p-6 md:p-8 space-y-6 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.02),_0_8px_32px_rgba(0,0,0,0.6)]">
            
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Avatar Circle with Pulsing Ring */}
              <div className="relative shrink-0 select-none">
                <div className="absolute inset-0 rounded-full bg-[#ff8a00]/20 blur-md animate-pulse" />
                <div className="w-20 h-20 rounded-full bg-accent/10 border border-[#ff8a00]/60 flex items-center justify-center text-accent text-3xl font-black relative overflow-hidden ring-4 ring-[#ff8a00]/10 shadow-[0_0_20px_rgba(255,122,0,0.15)]">
                  {dbUser?.image ? (
                    <img src={dbUser.image} alt={dbUser.name} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    dbUser?.name?.[0]?.toUpperCase() || 'F'
                  )}
                </div>
              </div>

              {/* Profile Info */}
              <div className="flex-grow min-w-0 text-center sm:text-left space-y-2">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                  <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
                    {isOwner ? (ownerDetails?.companyName || 'Acme Labs') : dbUser?.name}
                  </h1>
                  
                  {isOwner ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-accent/15 border border-accent/25 text-accent text-[10px] font-bold tracking-wide uppercase">
                      Verified Employer
                    </span>
                  ) : (
                    dbUser?.username && (
                      <CopyProfileButton username={dbUser.username} />
                    )
                  )}
                </div>

                <p className="text-[13px] text-white/50 max-w-lg leading-relaxed">
                  {isOwner
                    ? `Managed by ${ownerDetails?.firstName || ''} ${ownerDetails?.lastName || ''} (${ownerDetails?.designation || 'Founder'})`
                    : (dbUser?.bio || "Developer building products on the Forke network.")}
                </p>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-2 pt-1.5 text-[11px] text-white/40 font-mono">
                  <div className="flex items-center gap-1.5 hover:text-white transition-colors">
                    <Mail className="w-3.5 h-3.5 text-accent" />
                    <span>{isOwner ? ownerDetails?.contactEmail : dbUser?.email}</span>
                  </div>
                  {ownerDetails?.contactNumber && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-accent" />
                      <span>{ownerDetails.contactNumber}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-accent" />
                    <span>Joined {new Date(dbUser?.createdAt || Date.now()).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Developer XP HUD Panel */}
            {!isOwner && (
              <div className="border-t border-white/[0.05] pt-5 space-y-2.5">
                <div className="flex justify-between items-baseline text-xs">
                  <span className="font-mono text-white/40 uppercase tracking-widest flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#ff8a00]" /> EXP PROGRESS
                  </span>
                  <span className="text-[11px] text-[var(--color-text-muted)] font-mono">
                    <span className="text-white font-bold">{xpGainedInCurrent}</span> / {xpRequiredForNext} XP 
                    {nextLevelXp && (
                      <span className="text-accent ml-1 font-semibold">({xpRemaining} XP to Lvl {level + 1})</span>
                    )}
                  </span>
                </div>
                
                {/* Visual Level Progress Bar */}
                <div className="relative w-full h-2 bg-white/[0.04] border border-white/[0.05] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-accent to-[#ff9f43] rounded-full transition-all duration-500 shadow-[0_0_10px_var(--color-accent)]" 
                    style={{ width: `${xpProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Character Sheet / Operations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            
            {/* Left Block: Specs / Details */}
            <div className="rounded-xl border border-white/[0.06] bg-[#0c0c0f]/40 backdrop-blur-xl overflow-hidden shadow-lg flex flex-col">
              <div className="px-4 py-3 border-b border-white/[0.05] bg-white/[0.01] flex items-center justify-between">
                <h4 className="text-xs font-bold font-mono uppercase tracking-widest text-white/50">
                  {isOwner ? 'OPERATIVE PROFILE' : 'CHARACTER SHEET'}
                </h4>
                <Terminal className="w-3.5 h-3.5 text-white/35" />
              </div>
              
              <div className="divide-y divide-white/[0.03] text-[13px] flex-grow">
                {isOwner ? (
                  <>
                    <div className="flex justify-between items-center px-4 py-3.5">
                      <span className="text-white/40 font-mono">DESIGNATION</span>
                      <span className="text-white font-medium">{ownerDetails?.designation || 'Employer'}</span>
                    </div>
                    <div className="flex justify-between items-center px-4 py-3.5">
                      <span className="text-white/40 font-mono">WEBSITE</span>
                      {ownerDetails?.companyWebsite ? (
                        <a 
                          href={ownerDetails.companyWebsite} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-accent hover:underline flex items-center gap-1 font-bold group"
                        >
                          <Globe className="w-3.5 h-3.5" />
                          <span>Visit Website</span>
                          <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                      ) : (
                        <span className="text-white/20 font-mono">—</span>
                      )}
                    </div>
                    <div className="flex justify-between items-center px-4 py-3.5">
                      <span className="text-white/40 font-mono">LINKEDIN</span>
                      {ownerDetails?.personalLinkedIn ? (
                        <a 
                          href={ownerDetails.personalLinkedIn} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-accent hover:underline flex items-center gap-1 font-bold group"
                        >
                          <LinkedinIcon className="w-3.5 h-3.5 text-accent" />
                          <span>View Profile</span>
                          <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                      ) : (
                        <span className="text-white/20 font-mono">—</span>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between items-center px-4 py-3.5">
                      <span className="text-white/40 font-mono">LEVEL & RANK</span>
                      <span className="text-[#ff8a00] font-black flex items-center gap-1.5">
                        <Award className="w-4 h-4" />
                        Lvl {level} ({levelTitle})
                      </span>
                    </div>
                    <div className="flex justify-between items-center px-4 py-3.5">
                      <span className="text-white/40 font-mono">EXPERIENCE</span>
                      <span className="text-white font-mono font-bold tabular-nums">{dbUser?.xp} XP</span>
                    </div>
                    <div className="flex justify-between items-center px-4 py-3.5">
                      <span className="text-white/40 font-mono">GITHUB REPO</span>
                      {dbUser?.githubUrl ? (
                        <a 
                          href={dbUser.githubUrl} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-accent hover:underline flex items-center gap-1 font-bold group font-mono"
                        >
                          <GithubIcon className="w-3.5 h-3.5 text-accent" />
                          <span>{dbUser.githubUrl.replace('https://github.com/', '')}</span>
                          <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        </a>
                      ) : (
                        <span className="text-white/20">Not linked</span>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Right Block: Telemetry / Status */}
            <div className="rounded-xl border border-white/[0.06] bg-[#0c0c0f]/40 backdrop-blur-xl overflow-hidden shadow-lg flex flex-col">
              <div className="px-4 py-3 border-b border-white/[0.05] bg-white/[0.01] flex items-center justify-between">
                <h4 className="text-xs font-bold font-mono uppercase tracking-widest text-white/50">
                  OPERATIVE TELEMETRY
                </h4>
                <Shield className="w-3.5 h-3.5 text-white/35" />
              </div>
              
              <div className="divide-y divide-white/[0.03] text-[13px] flex-grow">
                <div className="flex justify-between items-center px-4 py-3.5">
                  <span className="text-white/40 font-mono">CLEARANCE STATUS</span>
                  <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 font-bold text-[11px] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Active Secure
                  </span>
                </div>
                <div className="flex justify-between items-center px-4 py-3.5">
                  <span className="text-white/40 font-mono">TREATY SYSTEM CLASS</span>
                  <span className="text-white font-bold">{isOwner ? 'Verified Client' : 'Active Developer'}</span>
                </div>
                <div className="flex justify-between items-center px-4 py-3.5">
                  {isOwner ? (
                    <>
                      <span className="text-white/40 font-mono">MISSIONS LAUNCHED</span>
                      <span className="text-white font-bold font-mono tabular-nums">{totalTasks}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-white/40 font-mono">MISSIONS CLAIMED</span>
                      <span className="text-white font-bold font-mono tabular-nums">{totalTasks}</span>
                    </>
                  )}
                </div>
                
                {/* Financial Summary card */}
                <div className="flex justify-between items-center px-4 py-3.5 bg-accent/[0.015]">
                  {isOwner ? (
                    <>
                      <span className="text-accent/80 font-mono font-semibold">TOTAL PAYOUTS SECURED</span>
                      <span className="text-accent font-black font-mono tabular-nums text-sm">
                        ₹{totalSpend.toLocaleString()}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-accent/80 font-mono font-semibold">TOTAL REWARDS EARNED</span>
                      <span className="text-accent font-black font-mono tabular-nums text-sm">
                        ₹{totalEarnings.toLocaleString()}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* Portfolio: Bounty Board */}
          {portfolioTasks.length > 0 && (
            <div className="rounded-2xl border border-white/[0.06] bg-[#0c0c0f]/40 backdrop-blur-xl p-6 text-left space-y-4 shadow-lg">
              <h2 className="text-base font-black tracking-wider font-mono text-white flex items-center gap-2 uppercase">
                <Trophy className="w-4 h-4 text-[#ff8a00]" />
                {isOwner ? 'MISSION BOARD // LAUNCHED DIRECTIVES' : 'BOUNTY REPAIRS // COMPLETED OPERATIONS'}
              </h2>
              
              <div className="divide-y divide-white/[0.04]">
                {portfolioTasks.map((t) => {
                  const budgetInRupees = Math.floor(t.budget / 100)
                  return (
                    <div key={t.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 first:pt-0 last:pb-0 group">
                      <div className="min-w-0 space-y-1.5 text-left">
                        <h4 className="text-sm font-semibold text-white/95 truncate group-hover:text-accent transition-colors leading-snug">
                          {t.title}
                        </h4>
                        
                        <div className="flex flex-wrap gap-1.5">
                          {t.skillTags?.slice(0, 4).map((tag) => (
                            <span 
                              key={tag} 
                              className="px-1.5 py-0.5 bg-white/[0.02] border border-white/[0.06] text-[10px] text-white/40 rounded font-semibold tracking-wide"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-1.5 shrink-0">
                        <div className="text-sm font-black text-accent font-mono text-glow">
                          ₹{budgetInRupees.toLocaleString()}
                        </div>
                        
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[9px] text-white/35 font-bold uppercase tracking-wider">STATUS //</span>
                          <span className={`text-[10px] font-bold uppercase tracking-widest ${
                            t.status === 'open' 
                              ? 'text-emerald-400' 
                              : t.status === 'claimed' 
                              ? 'text-amber-400 animate-pulse' 
                              : t.status === 'submitted'
                              ? 'text-orange-400'
                              : 'text-emerald-500 font-black'
                          }`}>
                            {t.status === 'open' 
                              ? 'OPEN' 
                              : t.status === 'claimed' 
                              ? 'CLAIMED' 
                              : t.status === 'submitted'
                              ? 'UNDER REVIEW'
                              : 'COMPLETED'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Public Footer */}
      <footer className="border-t border-white/5 py-6 bg-[#060608]">
        <div className="max-w-5xl mx-auto px-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/30 font-medium font-mono">
          <div>© {new Date().getFullYear()} Forke Technology Group. All rights reserved.</div>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
