/**
 * @fileoverview Forke Platform
 * @copyright (c) 2026 Forke Inc. (https://www.forke.space/)
 *
 * Source-Available License (Non-Commercial / Fair Source).
 * This source code is open for inspection, learning, and personal development.
 * Commercial use, hosting, or resale as a paid service without an explicit
 * commercial license from Forke Inc. is strictly prohibited.
 */

import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { Metadata } from 'next'
import Sidebar from '@/components/shared/Sidebar'
import { DashboardProvider } from '@/components/dashboard/DashboardContext'
import { getLevelFromXp } from '@/lib/utils/xp'
import LevelUpCelebration from '@/components/shared/LevelUpCelebration'
import PendingApproval from '@/components/auth/PendingApproval'
import { db } from '@/lib/db'
import { owners, tasks, messages, users } from '@/lib/db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { ensureMessagesTable } from '@/app/(app)/messages/actions'
import ToastContainer from '@/components/shared/Toast'

import MobileMenuTrigger from '@/components/dashboard/MobileMenuTrigger'
import { resolveAvatarUrl } from '@/lib/utils/avatar'
import DotPatternBackground from '@/components/shared/DotPatternBackground'

export const metadata: Metadata = {
  title: 'Sandbox Workspace | Forke',
  description: 'Repository review and task workspace for Forke owners and developers.',
  robots: { index: false, follow: false },
}

export default async function SandboxLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect('/')
  }

  const sessionUser = session.user
  const dbUser = await db.query.users.findFirst({ where: eq(users.id, sessionUser.id) })
  if (!dbUser) {
    redirect('/signin')
  }
  const user = dbUser
  
  if (user.isBanned) {
    redirect('/auth-error?error=AccessDenied')
  }
  
  // Handle Client Approval
  if (user.role === 'owner' && !user.isApproved) {
    return <PendingApproval userEmail={user.email} />
  }

  const userLevel = getLevelFromXp(user.xp || 0)
  const resolvedAvatarUrl = resolveAvatarUrl(user.image)

  let companyName = ''
  let pendingSubmissionsCount = 0
  let unreadMessagesCount = 0

  // Fetch received messages count for the logged-in user dynamically
  try {
    await ensureMessagesTable()
    const messageStats = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(messages)
      .where(eq(messages.receiverId, user.id))
      .then((rows) => rows[0])
    unreadMessagesCount = messageStats?.count || 0
  } catch (e) {
    console.error('Failed to query messages layout statistics:', e)
  }

  if (user.role === 'owner') {
    try {
      const ownerData = await db
        .select({ companyName: owners.companyName })
        .from(owners)
        .where(eq(owners.id, user.id))
        .limit(1)
        .then((rows) => rows[0])
      companyName = ownerData?.companyName || ''

      const submissionStats = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(tasks)
        .where(and(
          eq(tasks.clientId, user.id),
          eq(tasks.status, 'submitted')
        ))
        .then((rows) => rows[0])
      pendingSubmissionsCount = submissionStats?.count || 0
    } catch (e) {
      console.error('Failed to query owner layout statistics:', e)
    }
  }

  // If developer has not completed onboarding (no username), hide the sidebar.
  if (user.role === 'developer' && !user.username) {
    return (
      <DashboardProvider>
        <div className="flex h-screen bg-[#070709] overflow-hidden theme-ember relative">
          <DotPatternBackground />
          <main className="flex-grow flex flex-col min-w-0 overflow-y-auto relative z-10">
            {children}
          </main>
        </div>
        <ToastContainer />
      </DashboardProvider>
    )
  }

  return (
    <DashboardProvider>
      <div className="flex h-screen bg-[var(--color-bg-surface)] overflow-hidden theme-ember relative">
        <DotPatternBackground />

        <Sidebar
          user={{
            name: user.name,
            image: resolvedAvatarUrl,
            username: user.username,
            level: userLevel,
            xp: user.xp,
            currentStreak: user.currentStreak,
            role: user.role,
            companyName: companyName || undefined
          }} 
          pendingSubmissionsCount={pendingSubmissionsCount}
          unreadMessagesCount={unreadMessagesCount}
        />
        <main className="flex-grow flex flex-col min-w-0 overflow-y-auto relative z-10">
          {/* Floating Mobile Trigger */}
          <MobileMenuTrigger />
          {children}
        </main>
      </div>
      <LevelUpCelebration />
      <ToastContainer />
    </DashboardProvider>
  )
}
