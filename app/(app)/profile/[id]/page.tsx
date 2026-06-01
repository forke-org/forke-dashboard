import { db } from '@/lib/db'
import { users, owners, tasks } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'
import { getLevelFromXp, getLevelTitle } from '@/lib/utils/xp'
import { Globe, Mail, Phone, Shield, Calendar, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import TopBar from '@/components/shared/TopBar'
import CopyProfileButton from '@/components/shared/CopyProfileButton'

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" width="16" height="16">
      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
    </svg>
  )
}

export default async function ProfileDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // Fetch target user record
  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, id)
  })

  if (!dbUser) notFound()

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

  const level = getLevelFromXp(dbUser?.xp || 0)

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg)] text-white font-sans">
      <TopBar title={isOwner ? "Owner Profile" : "Developer Profile"} />

      <div className="flex-grow overflow-y-auto">
        <div className="mx-auto max-w-4xl px-5 md:px-8 py-6 md:py-8 space-y-6 select-none w-full">
          {/* Back Link */}
          <div className="text-left">
            <Link href="/tasks" className="inline-flex items-center gap-1.5 text-[var(--color-text-muted)] hover:text-white transition-colors text-[13px] group">
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              Back to tasks
            </Link>
          </div>

          {/* Profile Header */}
          <div className="p-6 rounded-xl bg-white/[0.018] border border-[var(--color-border)] text-left">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              {/* Avatar Circle */}
              <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center text-accent text-2xl font-medium shrink-0 overflow-hidden">
                {dbUser?.image ? (
                  <img src={dbUser.image} alt={dbUser.name} className="w-full h-full object-cover rounded-full" />
                ) : (
                  dbUser?.name?.[0]?.toUpperCase() || 'F'
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-1 min-w-0 text-center sm:text-left space-y-2">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                  <h3 className="text-lg md:text-xl font-semibold text-white tracking-tight">
                    {isOwner ? (ownerDetails?.companyName || 'Acme Labs') : dbUser?.name}
                  </h3>
                  {isOwner ? (
                    <span className="px-2 py-0.5 rounded bg-accent/10 border border-accent/20 text-accent text-[11px] font-medium">
                      Verified employer
                    </span>
                  ) : (
                    dbUser?.username && (
                      <CopyProfileButton username={dbUser.username} />
                    )
                  )}
                </div>

                <p className="text-[13px] text-white/50 max-w-md leading-relaxed">
                  {isOwner
                    ? `Managed by ${ownerDetails?.firstName || ''} ${ownerDetails?.lastName || ''} (${ownerDetails?.designation || 'Founder'})`
                    : (dbUser?.bio || "Developer building products on the Forke network.")}
                </p>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1.5 pt-1 text-[11px] text-[var(--color-text-muted)]">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            {/* Left Block: Details */}
            <div className="rounded-xl bg-white/[0.018] border border-[var(--color-border)]">
              <div className="px-4 py-3 border-b border-[var(--color-border)]">
                <h4 className="text-sm font-semibold text-white">Details</h4>
              </div>
              <div className="divide-y divide-[var(--color-border)] text-[13px]">
                {isOwner ? (
                  <>
                    <div className="flex justify-between items-center px-4 py-3">
                      <span className="text-[var(--color-text-muted)]">Designation</span>
                      <span className="text-white font-medium">{ownerDetails?.designation}</span>
                    </div>
                    <div className="flex justify-between items-center px-4 py-3">
                      <span className="text-[var(--color-text-muted)]">Company website</span>
                      {ownerDetails?.companyWebsite ? (
                        <a href={ownerDetails.companyWebsite} target="_blank" rel="noreferrer" className="text-accent hover:underline flex items-center gap-1">
                          <Globe className="w-3.5 h-3.5" /> Visit site
                        </a>
                      ) : (
                        <span className="text-white/25">—</span>
                      )}
                    </div>
                    <div className="flex justify-between items-center px-4 py-3">
                      <span className="text-[var(--color-text-muted)]">LinkedIn</span>
                      {ownerDetails?.personalLinkedIn ? (
                        <a href={ownerDetails.personalLinkedIn} target="_blank" rel="noreferrer" className="text-accent hover:underline flex items-center gap-1">
                          <LinkedinIcon className="w-3.5 h-3.5" /> View
                        </a>
                      ) : (
                        <span className="text-white/25">—</span>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between items-center px-4 py-3">
                      <span className="text-[var(--color-text-muted)]">Developer level</span>
                      <span className="text-white font-medium">Lvl {level} ({getLevelTitle(level)})</span>
                    </div>
                    <div className="flex justify-between items-center px-4 py-3">
                      <span className="text-[var(--color-text-muted)]">Experience</span>
                      <span className="text-white font-medium tabular-nums">{dbUser?.xp} XP</span>
                    </div>
                    <div className="flex justify-between items-center px-4 py-3">
                      <span className="text-[var(--color-text-muted)]">GitHub</span>
                      {dbUser?.githubUrl ? (
                        <a href={dbUser.githubUrl} target="_blank" rel="noreferrer" className="text-accent hover:underline truncate max-w-[200px]">
                          {dbUser.githubUrl.replace('https://github.com/', '')}
                        </a>
                      ) : (
                        <span className="text-white/25">Not linked</span>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Right Block: Account */}
            <div className="rounded-xl bg-white/[0.018] border border-[var(--color-border)]">
              <div className="px-4 py-3 border-b border-[var(--color-border)]">
                <h4 className="text-sm font-semibold text-white">Account</h4>
              </div>
              <div className="divide-y divide-[var(--color-border)] text-[13px]">
                <div className="flex justify-between items-center px-4 py-3">
                  <span className="text-[var(--color-text-muted)]">Current plan</span>
                  <span className="px-2 py-0.5 rounded bg-accent/10 border border-accent/20 text-accent font-medium text-[11px]">
                    {isOwner ? 'Starter' : 'Standard'}
                  </span>
                </div>
                <div className="flex justify-between items-center px-4 py-3">
                  <span className="text-[var(--color-text-muted)]">Security</span>
                  <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" /> Secure
                  </span>
                </div>
                <div className="flex justify-between items-center px-4 py-3">
                  <span className="text-[var(--color-text-muted)]">Total tasks</span>
                  <span className="text-white font-medium tabular-nums">{totalTasks}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
