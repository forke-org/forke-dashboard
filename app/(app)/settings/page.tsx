import { auth } from '@/auth'
import TopBar from '@/components/shared/TopBar'
import { db } from '@/lib/db'
import { users, owners } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import SettingsForm from '@/components/settings/SettingsForm'
import { ensureTelemetrySettingsColumns, getSystemSpecs } from '@/app/(app)/settings/actions'

export const maxDuration = 10;

export default async function SettingsPage() {
  const session = await auth()
  const sessionUser = session?.user

  if (!sessionUser) return null

  // Ensure telemetry database columns are present
  await ensureTelemetrySettingsColumns()
  
  // Fetch live system specs with timeout protection
  let systemSpecs = {
    databaseState: 'disconnected',
    dbLatencyMs: 0,
    runtimeVersion: `nextjs v15.5.15`
  }
  
  try {
    systemSpecs = await getSystemSpecs()
  } catch (e) {
    console.error('Failed to get system specs:', e)
  }

  // Fetch full user record
  let dbUser = null
  try {
    dbUser = await db.query.users.findFirst({
      where: eq(users.id, sessionUser.id)
    })
  } catch (e) {
    console.error('Failed to fetch user:', e)
    return <div className="text-white p-4">Failed to load user data</div>
  }

  if (!dbUser) return null

  let ownerDetails = null
  if (sessionUser.role === 'owner') {
    try {
      ownerDetails = await db.query.owners.findFirst({
        where: eq(owners.id, sessionUser.id)
      })
    } catch (e) {
      console.error('Failed to fetch owner details:', e)
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#060608] text-white font-sans">
      <TopBar title="Settings Console" />
      
      <div className="flex-grow p-6 md:p-8 overflow-y-auto space-y-8 select-none max-w-4xl mx-auto w-full">
        {/* Header Title */}
        <div className="space-y-3 text-left">
          <h2 className="font-serif text-3xl md:text-5xl text-white tracking-tight">
            System <span className="text-accent italic">Settings</span>
          </h2>
          <p className="text-white/50 text-xs md:text-sm font-light max-w-xl leading-relaxed">
            Configure authorization tokens, customize notification nodes, and update company profile settings.
          </p>
        </div>

        <SettingsForm 
          userId={dbUser.id}
          role={dbUser.role}
          initialName={dbUser.name}
          initialBio={dbUser.bio}
          initialGithubUrl={dbUser.githubUrl}
          initialCompanyName={ownerDetails?.companyName}
          initialCompanyWebsite={ownerDetails?.companyWebsite}
          initialDesignation={ownerDetails?.designation}
          initialContactNumber={ownerDetails?.contactNumber}
          initialContactEmail={ownerDetails?.contactEmail}
          initialPersonalLinkedIn={ownerDetails?.personalLinkedIn}
          initialEmailAlerts={dbUser.emailAlerts ?? true}
          initialSlackWebhooks={dbUser.slackWebhooks ?? false}
          systemSpecs={systemSpecs}
        />
      </div>
    </div>
  )
}
