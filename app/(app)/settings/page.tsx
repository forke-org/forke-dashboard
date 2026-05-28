import { auth } from '@/auth'
import TopBar from '@/components/shared/TopBar'
import { db } from '@/lib/db'
import { users, owners } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import SettingsForm from '@/components/settings/SettingsForm'

export default async function SettingsPage() {
  const session = await auth()
  const sessionUser = session?.user

  if (!sessionUser) return null

  // Fetch full user record
  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, sessionUser.id)
  })

  if (!dbUser) return null

  let ownerDetails = null
  if (sessionUser.role === 'owner') {
    ownerDetails = await db.query.owners.findFirst({
      where: eq(owners.id, sessionUser.id)
    })
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
        />
      </div>
    </div>
  )
}
