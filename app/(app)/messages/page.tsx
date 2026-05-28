import { auth } from '@/auth'
import TopBar from '@/components/shared/TopBar'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq, ne } from 'drizzle-orm'
import { getMessagesBetweenUsers } from './actions'
import ChatConsole from '@/components/messages/ChatConsole'

export default async function MessagesPage() {
  const session = await auth()
  const sessionUser = session?.user

  if (!sessionUser) return null

  // Fetch registered contacts from DB (excluding current user)
  const contacts = await db
    .select({
      id: users.id,
      name: users.name,
      image: users.image,
      role: users.role,
    })
    .from(users)
    .where(ne(users.id, sessionUser.id))
    .limit(10)

  // Fetch initial message thread for first contact
  let initialMessages: any[] = []
  if (contacts.length > 0) {
    const res = await getMessagesBetweenUsers(sessionUser.id, contacts[0].id)
    if (res.success) {
      initialMessages = res.messages
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#060608] text-white font-sans">
      <TopBar title="Communications Channel" />
      
      <div className="flex-grow p-6 md:p-8 select-none max-w-5xl mx-auto w-full">
        <ChatConsole 
          contacts={contacts} 
          currentUserId={sessionUser.id}
          initialMessages={initialMessages}
        />
      </div>
    </div>
  )
}
