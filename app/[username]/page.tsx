import { db } from '@/lib/db'
import { users, owners, tasks } from '@/lib/db/schema'
import { eq, desc, sql } from 'drizzle-orm'
import { getLevelFromXp, getLevelTitle } from '@/lib/utils/xp'
import { Globe, Mail, Phone, Shield, Calendar, ArrowLeft, ExternalLink, Award, Terminal } from 'lucide-react'
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
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" width="16" height="16">
      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
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

  // Fetch tasks portfolio (e.g. up to 5 tasks claimed or posted)
  const portfolioTasks = await db
    .select()
    .from(tasks)
    .where(isOwner ? eq(tasks.clientId, dbUser.id) : eq(tasks.claimantId, dbUser.id))
    .orderBy(desc(tasks.createdAt))
    .limit(5)

  const level = getLevelFromXp(dbUser?.xp || 0)

  return (
    <div className="min-h-screen bg-[#0A0A0A] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900 via-[#0A0A0A] to-[#0A0A0A] text-white font-sans flex flex-col">
      {/* Public Header */}
      <header className="border-b border-white/5 bg-[#0A0A0A]/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
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
                className="h-9 px-4 rounded-lg bg-[#ff8a00] border border-[#ff8a00] hover:bg-[#ff8a00]/90 transition-all text-xs font-black text-[#0A0A0A] flex items-center gap-1.5 cursor-pointer"
              >
                Join Forke
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center py-10 px-5 relative overflow-hidden">
        {/* Futuristic Grid Lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

        <div className="max-w-4xl w-full space-y-6 relative z-10">
          {/* Main Profile Card */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.015] backdrop-blur-xl p-6 md:p-8 space-y-6 text-left">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Avatar Circle with Neon Ring */}
              <div className="relative shrink-0 select-none">
                <div className="absolute inset-0 rounded-full bg-[#ff8a00]/25 blur-md" />
                <div className="w-20 h-20 rounded-full bg-accent/15 border-2 border-[#ff8a00] flex items-center justify-center text-accent text-3xl font-black relative overflow-hidden">
                  {dbUser?.image ? (
                    <img src={dbUser.image} alt={dbUser.name} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    dbUser?.name?.[0]?.toUpperCase() || 'F'
                  )}
                </div>
              </div>

              {/* Profile Info */}
              <div className="flex-1 min-w-0 text-center sm:text-left space-y-2.5">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                  <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
                    {isOwner ? (ownerDetails?.companyName || 'Acme Labs') : dbUser?.name}
                  </h1>
                  
                  {isOwner ? (
                    <span className="px-2 py-0.5 rounded-lg bg-accent/10 border border-accent/25 text-accent text-[11px] font-bold">
                      Verified Employer
                    </span>
                  ) : (
                    dbUser?.username && (
                      <CopyProfileButton username={dbUser.username} />
                    )
                  )}
                </div>

                <p className="text-sm text-white/60 max-w-lg leading-relaxed">
                  {isOwner
                    ? `Managed by ${ownerDetails?.firstName || ''} ${ownerDetails?.lastName || ''} (${ownerDetails?.designation || 'Founder'})`
                    : (dbUser?.bio || "Developer building products on the Forke network.")}
                </p>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-2 pt-1.5 text-xs text-white/40 font-medium">
                  <div className="flex items-center gap-1.5 hover:text-white transition-colors">
                    <Mail className="w-4 h-4 text-[#ff8a00]/70" />
                    <span>{isOwner ? ownerDetails?.contactEmail : dbUser?.email}</span>
                  </div>
                  {ownerDetails?.contactNumber && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-4 h-4 text-[#ff8a00]/70" />
                      <span>{ownerDetails.contactNumber}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-[#ff8a00]/70" />
                    <span>Joined {new Date(dbUser?.createdAt || Date.now()).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Info Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              {/* Profile Details Block */}
              <div className="rounded-xl bg-white/[0.01] border border-white/5 divide-y divide-white/[0.03] text-sm">
                <div className="px-4 py-3 bg-white/[0.01] font-bold text-white/90">
                  Profile Details
                </div>
                {isOwner ? (
                  <>
                    <div className="flex justify-between items-center px-4 py-3">
                      <span className="text-white/45">Designation</span>
                      <span className="text-white font-medium">{ownerDetails?.designation}</span>
                    </div>
                    <div className="flex justify-between items-center px-4 py-3">
                      <span className="text-white/45">Company website</span>
                      {ownerDetails?.companyWebsite ? (
                        <a href={ownerDetails.companyWebsite} target="_blank" rel="noreferrer" className="text-accent hover:underline flex items-center gap-1.5 font-bold">
                          <Globe className="w-3.5 h-3.5" /> Visit site
                        </a>
                      ) : (
                        <span className="text-white/20">—</span>
                      )}
                    </div>
                    <div className="flex justify-between items-center px-4 py-3">
                      <span className="text-white/45">LinkedIn</span>
                      {ownerDetails?.personalLinkedIn ? (
                        <a href={ownerDetails.personalLinkedIn} target="_blank" rel="noreferrer" className="text-accent hover:underline flex items-center gap-1.5 font-bold">
                          <LinkedinIcon className="w-3.5 h-3.5" /> View LinkedIn
                        </a>
                      ) : (
                        <span className="text-white/20">—</span>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between items-center px-4 py-3">
                      <span className="text-white/45">Level & Rank</span>
                      <span className="text-[#ff8a00] font-black flex items-center gap-1.5">
                        <Award className="w-4 h-4" />
                        Lvl {level} ({getLevelTitle(level)})
                      </span>
                    </div>
                    <div className="flex justify-between items-center px-4 py-3">
                      <span className="text-white/45">Experience Points</span>
                      <span className="text-white font-mono font-bold tabular-nums">{dbUser?.xp} XP</span>
                    </div>
                    <div className="flex justify-between items-center px-4 py-3 font-mono">
                      <span className="text-white/45">GitHub Handle</span>
                      {dbUser?.githubUrl ? (
                        <a href={dbUser.githubUrl} target="_blank" rel="noreferrer" className="text-accent hover:underline flex items-center gap-1.5 font-bold">
                          <Terminal className="w-3.5 h-3.5" />
                          {dbUser.githubUrl.replace('https://github.com/', '')}
                        </a>
                      ) : (
                        <span className="text-white/20">Not linked</span>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Statistics & Platform Status Block */}
              <div className="rounded-xl bg-white/[0.01] border border-white/5 divide-y divide-white/[0.03] text-sm">
                <div className="px-4 py-3 bg-white/[0.01] font-bold text-white/90">
                  Platform Status
                </div>
                <div className="flex justify-between items-center px-4 py-3">
                  <span className="text-white/45">Account Status</span>
                  <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Active Secure
                  </span>
                </div>
                <div className="flex justify-between items-center px-4 py-3">
                  <span className="text-white/45">Current Tier</span>
                  <span className="text-white font-bold">{isOwner ? 'Verified Client' : 'Active Developer'}</span>
                </div>
                <div className="flex justify-between items-center px-4 py-3">
                  <span className="text-white/45">{isOwner ? 'Missions Launched' : 'Missions Undertaken'}</span>
                  <span className="text-white font-black font-mono tabular-nums">{totalTasks}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Portfolio: Tasks Timeline */}
          {portfolioTasks.length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.015] backdrop-blur-xl p-6 text-left space-y-4">
              <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                <Terminal className="w-5 h-5 text-[#ff8a00]" />
                {isOwner ? 'Recent Mission Board' : 'Completed & Active Bounties'}
              </h2>
              
              <div className="divide-y divide-white/[0.03]">
                {portfolioTasks.map((t) => {
                  const budgetInRupees = Math.floor(t.budget / 100)
                  return (
                    <div key={t.id} className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-white/90 truncate">
                          {t.title}
                        </h4>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {t.skillTags?.slice(0, 3).map((tag) => (
                            <span key={tag} className="px-1.5 py-0.5 bg-white/[0.02] border border-white/5 text-[10px] text-white/40 rounded font-medium">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-black text-[#ff8a00] font-mono">
                          ₹{budgetInRupees.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-white/35 uppercase font-bold mt-1">
                          {t.status}
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
      <footer className="border-t border-white/5 py-6 bg-[#0A0A0A]">
        <div className="max-w-6xl mx-auto px-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/30 font-medium">
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
