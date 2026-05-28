import { auth } from '@/auth'
import TopBar from '@/components/shared/TopBar'
import { db } from '@/lib/db'
import { users, owners } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { Settings, Save, ShieldAlert, Bell, Sliders, Laptop } from 'lucide-react'

export default async function SettingsPage() {
  const session = await auth()
  const sessionUser = session?.user

  if (!sessionUser) return null

  // Fetch full user record
  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, sessionUser.id)
  })

  let ownerDetails = null
  if (sessionUser.role === 'owner') {
    ownerDetails = await db.query.owners.findFirst({
      where: eq(owners.id, sessionUser.id)
    })
  }

  const isOwner = sessionUser.role === 'owner'

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

        {/* Tactile grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 text-left pb-16">
          
          {/* Left Block: settings forms */}
          <div className="md:col-span-8 space-y-6">
            
            {/* Form card 1 */}
            <div className="p-6 rounded-[2.5rem] bg-[#0b0b0e] border border-white/[0.04] space-y-6">
              <h4 className="text-xs font-black uppercase text-white/30 tracking-widest font-mono border-b border-white/[0.03] pb-3 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-accent" /> Profile Credentials
              </h4>

              <div className="space-y-4">
                {isOwner ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-wider text-white/40 font-mono">Company Name</label>
                      <input 
                        type="text" 
                        defaultValue={ownerDetails?.companyName || ''} 
                        className="w-full h-11 bg-white/[0.01] border border-white/5 rounded-xl px-4 text-xs text-white outline-none focus:border-accent transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-wider text-white/40 font-mono">Company Website</label>
                      <input 
                        type="text" 
                        defaultValue={ownerDetails?.companyWebsite || ''} 
                        className="w-full h-11 bg-white/[0.01] border border-white/5 rounded-xl px-4 text-xs text-white outline-none focus:border-accent transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-wider text-white/40 font-mono">Company Designation</label>
                      <input 
                        type="text" 
                        defaultValue={ownerDetails?.designation || ''} 
                        className="w-full h-11 bg-white/[0.01] border border-white/5 rounded-xl px-4 text-xs text-white outline-none focus:border-accent transition-all"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-wider text-white/40 font-mono">Profile Name</label>
                      <input 
                        type="text" 
                        defaultValue={dbUser?.name || ''} 
                        className="w-full h-11 bg-white/[0.01] border border-white/5 rounded-xl px-4 text-xs text-white outline-none focus:border-accent transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-wider text-white/40 font-mono">Bio Details</label>
                      <textarea 
                        defaultValue={dbUser?.bio || ''} 
                        rows={3}
                        className="w-full bg-white/[0.01] border border-white/5 rounded-xl p-4 text-xs text-white outline-none focus:border-accent transition-all resize-none"
                      />
                    </div>
                  </>
                )}
                
                <button className="h-10 px-4 text-[9px] font-black uppercase tracking-widest rounded-xl bg-gradient-to-b from-accent to-[#d97706] text-[#050505] hover:shadow-[0_0_12px_rgba(255,122,0,0.2)] transition-all flex items-center gap-1.5 cursor-pointer font-bold mt-4">
                  <Save className="w-3.5 h-3.5 stroke-[2.5px]" /> Save Changes
                </button>
              </div>
            </div>

            {/* Notification node configurations */}
            <div className="p-6 rounded-[2.5rem] bg-[#0b0b0e] border border-white/[0.04] space-y-6">
              <h4 className="text-xs font-black uppercase text-white/30 tracking-widest font-mono border-b border-white/[0.03] pb-3 flex items-center gap-2">
                <Bell className="w-4 h-4 text-accent" /> Telemetry Notifications
              </h4>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.005] border border-white/[0.03]">
                  <div>
                    <h5 className="text-xs font-bold text-white">Email dispatch alerts</h5>
                    <p className="text-[9px] text-white/30 font-light mt-0.5">Receive emails for waitlist updates & contract signoffs</p>
                  </div>
                  <span className="w-9 h-5 rounded-full bg-accent/20 border border-accent/40 flex items-center px-0.5 cursor-pointer">
                    <span className="w-4 h-4 rounded-full bg-accent translate-x-4 transition-transform" />
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.005] border border-white/[0.03]">
                  <div>
                    <h5 className="text-xs font-bold text-white">Slack Webhook integrations</h5>
                    <p className="text-[9px] text-white/30 font-light mt-0.5">Push log alerts directly into your organization workspace</p>
                  </div>
                  <span className="w-9 h-5 rounded-full bg-white/5 border border-white/10 flex items-center px-0.5 cursor-pointer">
                    <span className="w-4 h-4 rounded-full bg-white/30 translate-x-0 transition-transform" />
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: system spec sidebar */}
          <div className="md:col-span-4 space-y-6">
            
            {/* System config card */}
            <div className="p-6 rounded-[2.5rem] bg-[#0b0b0e] border border-white/[0.04] space-y-6 shadow-xl">
              <h4 className="text-xs font-black uppercase text-white/30 tracking-widest font-mono border-b border-white/[0.03] pb-3 flex items-center gap-2">
                <Laptop className="w-4 h-4 text-accent" /> System Spec
              </h4>

              <div className="space-y-3 font-mono text-[9px] text-white/50">
                <div className="flex justify-between items-center py-1">
                  <span>Runtime Host:</span>
                  <span className="text-accent uppercase">nextjs v15</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span>Database State:</span>
                  <span className="text-emerald-400 uppercase">connected</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span>Telemetry SSL:</span>
                  <span className="text-emerald-400 uppercase">active</span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  )
}
