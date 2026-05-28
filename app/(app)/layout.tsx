import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { Metadata } from 'next'
import Sidebar from '@/components/shared/Sidebar'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Manage your tasks, track your earnings, and level up your career on Forke.',
  robots: {
    index: false, // Don't index the dashboard app pages
    follow: false,
  }
}
import { DashboardProvider } from '@/components/dashboard/DashboardContext'
import { getLevelFromXp } from '@/lib/utils/xp'
import LevelUpCelebration from '@/components/shared/LevelUpCelebration'
import PendingApproval from '@/components/auth/PendingApproval'
import { db } from '@/lib/db'
import { owners, tasks } from '@/lib/db/schema'
import { eq, and, sql } from 'drizzle-orm'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect('/')
  }

  const user = session.user
  
  if (user.isBanned) {
    redirect('/auth-error?error=AccessDenied')
  }
  
  // Handle Client Approval
  if (user.role === 'owner' && !user.isApproved) {
    return <PendingApproval userEmail={user.email} />
  }

  const userLevel = getLevelFromXp(user.xp || 0)

  let companyName = ''
  let pendingSubmissionsCount = 0

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

  return (
    <DashboardProvider>
      <div className="flex h-screen bg-[var(--color-bg-surface)] overflow-hidden theme-ember">
        <Sidebar 
          user={{ 
            name: user.name, 
            image: user.image, 
            level: userLevel,
            xp: user.xp,
            currentStreak: user.currentStreak,
            role: user.role,
            companyName: companyName || undefined
          }} 
          pendingSubmissionsCount={pendingSubmissionsCount}
        />
        <main className="flex-grow flex flex-col min-w-0 overflow-hidden">
          {children}
        </main>
      </div>
      <LevelUpCelebration />
    </DashboardProvider>
  )
}
