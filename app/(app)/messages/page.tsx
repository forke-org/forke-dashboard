import { auth } from '@/auth'
import TopBar from '@/components/shared/TopBar'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq, ne } from 'drizzle-orm'
import { Mail, Send, CheckCheck, Smile, Paperclip } from 'lucide-react'

export default async function MessagesPage() {
  const session = await auth()
  const sessionUser = session?.user

  if (!sessionUser) return null

  // Fetch developers to populate the contact list dynamically
  const contacts = await db
    .select({
      id: users.id,
      name: users.name,
      image: users.image,
      role: users.role,
    })
    .from(users)
    .where(ne(users.id, sessionUser.id))
    .limit(5)

  // Use a default name if database has no contacts
  const activeContact = contacts[0] || { id: 'demo-id', name: 'Dev Vanguard', image: null }

  return (
    <div className="flex flex-col h-full bg-[#060608] text-white font-sans">
      <TopBar title="Communications Channel" />
      
      {/* Outer Layout wrapper */}
      <div className="flex-grow p-6 md:p-8 flex items-stretch gap-6 overflow-hidden max-w-5xl mx-auto w-full select-none h-[calc(100vh-80px)]">
        
        {/* Left Column: Contact threads */}
        <div className="w-80 rounded-3xl bg-[#0b0b0e] border border-white/[0.04] p-4 flex flex-col gap-4 shrink-0 shadow-lg">
          <div className="px-2 text-left">
            <h4 className="text-xs font-black uppercase text-white/30 tracking-widest font-mono">Conversations</h4>
            <p className="text-[9px] text-white/20 uppercase tracking-wider font-mono mt-0.5">Active Telemetry channels</p>
          </div>

          <div className="flex-grow overflow-y-auto space-y-2">
            {contacts.map((c) => (
              <button 
                key={c.id}
                className="w-full flex items-center gap-3.5 p-3 rounded-2xl border border-transparent bg-white/[0.01] hover:bg-white/[0.02] hover:border-white/5 transition-all text-left group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-sm font-serif shrink-0">
                  {c.image ? (
                    <img src={c.image} alt={c.name} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    c.name?.[0]?.toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <h5 className="text-xs font-bold text-white truncate group-hover:text-accent transition-colors">{c.name}</h5>
                    <span className="text-[7.5px] font-bold text-white/20 font-mono">14:02</span>
                  </div>
                  <p className="text-[9.5px] text-white/40 truncate mt-1">Ready for review...</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Active thread console */}
        <div className="flex-1 rounded-3xl bg-[#0b0b0e] border border-white/[0.04] flex flex-col overflow-hidden shadow-lg">
          {/* Header */}
          <div className="h-16 border-b border-white/[0.04] bg-white/[0.005] px-6 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3 text-left">
              <div className="w-8 h-8 rounded-full bg-accent/15 border border-accent/25 flex items-center justify-center text-accent text-xs font-serif shrink-0">
                {activeContact.image ? (
                  <img src={activeContact.image} alt={activeContact.name} className="w-full h-full object-cover rounded-full" />
                ) : (
                  activeContact.name?.[0]?.toUpperCase()
                )}
              </div>
              <div>
                <h5 className="text-xs font-bold text-white leading-none">{activeContact.name}</h5>
                <span className="text-[7.5px] font-black uppercase text-emerald-400 tracking-wider font-mono mt-1 block">active channel</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          </div>

          {/* Messages list (scrollable) */}
          <div className="flex-grow p-6 overflow-y-auto space-y-4">
            {/* Sender message */}
            <div className="flex items-end gap-3 max-w-[70%] text-left">
              <div className="w-7 h-7 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-[10px] font-serif shrink-0">
                {activeContact.name?.[0]?.toUpperCase()}
              </div>
              <div className="p-3.5 rounded-2xl bg-white/[0.01] border border-white/[0.03] text-white/80 text-xs leading-relaxed relative">
                Hello! I have completed shipping the API connection scripts for the waitlist verification engine. Ready for your code review on the dashboard.
                <span className="absolute bottom-1 right-2 text-[7px] text-white/20 font-mono">13:58</span>
              </div>
            </div>

            {/* Recipient response */}
            <div className="flex items-end gap-3 max-w-[70%] ml-auto justify-end text-right">
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-accent/25 to-accent/10 border border-accent/15 text-white text-xs leading-relaxed relative">
                Excellent work. I am loading the telemetries now and will execute code audits shortly.
                <span className="absolute bottom-1 right-2 flex items-center gap-1 text-[7px] text-white/30 font-mono">
                  14:02 <CheckCheck className="w-3 h-3 text-accent" />
                </span>
              </div>
            </div>

            {/* System banner */}
            <div className="flex items-center justify-center py-2">
              <div className="px-3.5 py-1 rounded-full bg-accent/5 border border-accent/10 text-accent font-mono text-[7px] font-black uppercase tracking-[0.2em]">
                telemetry connection secure
              </div>
            </div>
          </div>

          {/* Input field */}
          <div className="p-4 border-t border-white/[0.04] bg-white/[0.005] flex items-center gap-3 shrink-0">
            <button className="p-2.5 text-white/35 hover:text-white rounded-xl hover:bg-white/[0.01] cursor-pointer">
              <Paperclip className="w-4 h-4" />
            </button>
            <input 
              type="text" 
              placeholder="Send secure command..." 
              className="flex-1 h-11 bg-white/[0.01] border border-white/5 rounded-xl px-4 text-xs text-white placeholder-white/20 outline-none focus:border-accent transition-all"
            />
            <button className="p-2.5 text-[#050505] bg-accent hover:shadow-[0_0_12px_rgba(255,122,0,0.2)] rounded-xl cursor-pointer">
              <Send className="w-4 h-4 stroke-[2.5px]" />
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
