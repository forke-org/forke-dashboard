import { auth } from '@/auth'
import TopBar from '@/components/shared/TopBar'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { getLevelFromXp, getLevelTitle } from '@/lib/utils/xp'
import { Star, Award, Shield, UserCheck } from 'lucide-react'

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" width="16" height="16">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482C19.138 20.164 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
    </svg>
  )
}

export default async function DevelopersPage() {
  const session = await auth()
  const sessionUser = session?.user

  if (!sessionUser) return null

  // Fetch all users with role 'developer' ordered by level desc, xp desc
  const developersList = await db
    .select()
    .from(users)
    .where(eq(users.role, 'developer'))
    .orderBy(desc(users.level), desc(users.xp))

  return (
    <div className="flex flex-col h-full bg-[#060608] text-white font-sans">
      <TopBar title="Developers" />
      
      <div className="flex-grow p-6 md:p-8 overflow-y-auto space-y-8 select-none max-w-6xl mx-auto w-full">
        {/* Title Section */}
        <div className="space-y-3 text-left">
          <h2 className="font-serif text-3xl md:text-5xl text-white tracking-tight">
            Developer <span className="text-accent italic">Vanguard</span>
          </h2>
          <p className="text-white/50 text-xs md:text-sm font-light max-w-xl leading-relaxed">
            Browse the leaderboard of certified developers on the Forke network, sorted by reputation levels and XP.
          </p>
        </div>

        {/* Developers Grid */}
        {developersList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2 pb-16">
            {developersList.map((dev) => {
              const devLevel = getLevelFromXp(dev.xp || 0)
              const levelTitle = getLevelTitle(devLevel)

              return (
                <div key={dev.id} className="group bg-[#0b0b0e] border border-white/[0.04] rounded-2xl p-6 transition-all duration-300 hover:border-accent/30 hover:shadow-2xl hover:shadow-accent/[0.01] flex flex-col justify-between min-h-[220px] text-left relative overflow-hidden">
                  
                  {/* Subtle edge overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-accent/[0.005] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                  <div className="space-y-4">
                    {/* Header: Avatar, Name, Level Title */}
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-accent/15 border border-accent/20 flex items-center justify-center text-accent text-lg font-serif shrink-0">
                        {dev.image ? (
                          <img src={dev.image} alt={dev.name} className="w-full h-full object-cover rounded-full" />
                        ) : (
                          dev.name?.[0]?.toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0 leading-tight space-y-1">
                        <h4 className="font-serif text-base text-white truncate group-hover:text-accent transition-colors">
                          {dev.name}
                        </h4>
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded bg-accent/10 border border-accent/20 text-accent font-black uppercase tracking-wider text-[8px] font-mono">
                            LVL {devLevel}
                          </span>
                          <span className="text-[9px] text-white/40 font-black uppercase tracking-widest font-mono">
                            {levelTitle}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Developer Bio */}
                    <p className="text-white/40 text-xs font-light leading-relaxed line-clamp-3">
                      {dev.bio || "No developer bio provided. Shipping clean code and resolving disputes on Forke."}
                    </p>
                  </div>

                  {/* Footer Stats & Actions */}
                  <div className="pt-5 mt-4 border-t border-white/[0.04] flex items-center justify-between">
                    {/* XP Tracker */}
                    <div className="text-left font-mono">
                      <span className="text-[8px] text-white/30 font-black uppercase tracking-wider block">Reputation</span>
                      <span className="text-[10px] text-white/70 font-bold block mt-0.5">{dev.xp} XP</span>
                    </div>

                    {/* GitHub Link */}
                    {dev.githubUrl ? (
                      <a 
                        href={dev.githubUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="h-8 px-3 text-[9px] font-black uppercase tracking-widest border border-white/5 bg-white/[0.01] hover:border-accent/40 rounded-lg text-white/60 hover:text-white transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <GithubIcon className="w-3.5 h-3.5 text-accent" />
                        <span>Node profile</span>
                      </a>
                    ) : (
                      <span className="text-[8px] text-white/20 font-black uppercase tracking-widest font-mono">
                        No GitHub Link
                      </span>
                    )}
                  </div>

                </div>
              )
            })}
          </div>
        ) : (
          <div className="p-16 border border-white/[0.04] rounded-[2.5rem] flex flex-col items-center justify-center text-center gap-4 bg-[#0b0b0e] max-w-md mx-auto">
            <UserCheck className="w-8 h-8 text-white/20" />
            <div className="space-y-1">
              <p className="text-white font-serif text-lg">No Developers Found</p>
              <p className="text-white/40 text-xs leading-relaxed">
                There are currently no registered developers on the network.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
