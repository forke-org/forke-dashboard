import { auth } from '@/auth'
import TopBar from '@/components/shared/TopBar'
import { db } from '@/lib/db'
import { users, owners, tasks } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'
import { getLevelFromXp, getLevelTitle } from '@/lib/utils/xp'
import { Building2, Globe, Mail, Phone, User, Award, Shield, FileCheck, Calendar } from 'lucide-react'

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" width="16" height="16">
      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
    </svg>
  )
}

export default async function ProfilePage() {
  const session = await auth()
  const sessionUser = session?.user as { id: string; name: string; role: 'developer' | 'owner'; email: string } | undefined

  if (!sessionUser) return null

  // Fetch full user record
  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, sessionUser.id)
  })

  let ownerDetails = null
  let totalTasks = 0

  if (sessionUser.role === 'owner') {
    ownerDetails = await db.query.owners.findFirst({
      where: eq(owners.id, sessionUser.id)
    })
    
    const countRes = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(tasks)
      .where(eq(tasks.clientId, sessionUser.id))
    totalTasks = countRes[0]?.count || 0
  } else {
    const countRes = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(tasks)
      .where(eq(tasks.claimantId, sessionUser.id))
    totalTasks = countRes[0]?.count || 0
  }

  const level = getLevelFromXp(dbUser?.xp || 0)
  const isOwner = sessionUser.role === 'owner'

  return (
    <div className="flex flex-col h-full bg-[#060608] text-white font-sans">
      <TopBar title={isOwner ? "Company Profile" : "Developer Profile"} />
      
      <div className="flex-grow p-6 md:p-8 overflow-y-auto space-y-8 select-none max-w-4xl mx-auto w-full">
        
        {/* Profile Header */}
        <div className="p-8 rounded-[2.5rem] bg-[#0b0b0e] border border-white/[0.04] relative overflow-hidden text-left shadow-2xl">
          <div className="absolute right-0 top-0 w-80 h-80 bg-accent/[0.02] rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
            {/* Avatar Circle */}
            <div className="w-20 h-20 rounded-full bg-accent/10 border-2 border-accent/30 flex items-center justify-center text-accent text-3xl font-serif shadow-inner shrink-0">
              {dbUser?.image ? (
                <img src={dbUser.image} alt={dbUser.name} className="w-full h-full object-cover rounded-full" />
              ) : (
                dbUser?.name?.[0]?.toUpperCase() || 'F'
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 min-w-0 text-center sm:text-left space-y-2.5">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                <h3 className="font-serif text-2xl md:text-3xl text-white tracking-wide">
                  {isOwner ? (ownerDetails?.companyName || 'Acme Labs') : dbUser?.name}
                </h3>
                {isOwner && (
                  <span className="px-2.5 py-0.5 rounded-md bg-accent/10 border border-accent/20 text-accent text-[9px] font-black uppercase tracking-wider font-mono">
                    Verified Employer
                  </span>
                )}
              </div>

              <p className="text-white/40 text-xs max-w-md font-light leading-relaxed">
                {isOwner 
                  ? `Managed by ${ownerDetails?.firstName || ''} ${ownerDetails?.lastName || ''} (${ownerDetails?.designation || 'Founder'})`
                  : (dbUser?.bio || "Elite developer building next-gen web products on the Forke network.")}
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-6 gap-y-2 pt-2 text-[9.5px] font-black uppercase tracking-wider text-white/50 font-mono">
                <div className="flex items-center gap-1.5">
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
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
          
          {/* Left Block: Node Specifications */}
          <div className="p-6 rounded-[2rem] bg-[#0b0b0e] border border-white/[0.04] space-y-6">
            <h4 className="text-xs font-black uppercase text-white/30 tracking-widest font-mono border-b border-white/[0.03] pb-3">
              Node Details
            </h4>
            <div className="space-y-4">
              {isOwner ? (
                <>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/40 font-medium">Designation</span>
                    <span className="text-white font-bold">{ownerDetails?.designation}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/40 font-medium">Company Website</span>
                    {ownerDetails?.companyWebsite ? (
                      <a href={ownerDetails.companyWebsite} target="_blank" rel="noreferrer" className="text-accent hover:underline flex items-center gap-1">
                        <Globe className="w-3.5 h-3.5" /> Visit site
                      </a>
                    ) : (
                      <span className="text-white/20">—</span>
                    )}
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/40 font-medium">LinkedIn Profile</span>
                    {ownerDetails?.personalLinkedIn ? (
                      <a href={ownerDetails.personalLinkedIn} target="_blank" rel="noreferrer" className="text-accent hover:underline flex items-center gap-1">
                        <LinkedinIcon className="w-3.5 h-3.5" /> View LinkedIn
                      </a>
                    ) : (
                      <span className="text-white/20">—</span>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/40 font-medium">Developer Level</span>
                    <span className="text-white font-bold">Lvl {level} ({getLevelTitle(level)})</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/40 font-medium">Total Experience (XP)</span>
                    <span className="text-white font-bold">{dbUser?.xp} XP</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/40 font-medium">GitHub Node</span>
                    {dbUser?.githubUrl ? (
                      <a href={dbUser.githubUrl} target="_blank" rel="noreferrer" className="text-accent hover:underline truncate max-w-[200px]">
                        {dbUser.githubUrl.replace('https://github.com/', '')}
                      </a>
                    ) : (
                      <span className="text-white/20">Not Linked</span>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right Block: Stats & Security Status */}
          <div className="p-6 rounded-[2rem] bg-[#0b0b0e] border border-white/[0.04] space-y-6">
            <h4 className="text-xs font-black uppercase text-white/30 tracking-widest font-mono border-b border-white/[0.03] pb-3">
              Subscription & Telemetry
            </h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-white/40 font-medium">Current Tier</span>
                <span className="px-2 py-0.5 rounded bg-accent/10 border border-accent/20 text-accent font-black uppercase tracking-wider text-[9px] font-mono">
                  {isOwner ? 'Starter Plan' : 'Standard Developer'}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-white/40 font-medium">Security Status</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400/10" /> Secure Node
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-white/40 font-medium">Total Platform Missions</span>
                <span className="text-white font-bold font-mono">{totalTasks}</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
