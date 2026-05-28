'use client'

import React, { useState, useEffect, useRef } from 'react'
import { getMessagesBetweenUsers, sendMessageAction } from '@/app/(app)/messages/actions'
import { Send, CheckCheck, Smile, Paperclip, Mail, ShieldAlert } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface Contact {
  id: string
  name: string | null
  image: string | null
  role: string
}

interface Message {
  id: string
  senderId: string
  receiverId: string
  content: string
  createdAt: Date
}

interface ChatConsoleProps {
  contacts: Contact[]
  currentUserId: string
  initialMessages: Message[]
}

export default function ChatConsole({ contacts, currentUserId, initialMessages }: ChatConsoleProps) {
  const [activeContactId, setActiveContactId] = useState<string>(contacts[0]?.id || '')
  const [messagesList, setMessagesList] = useState<Message[]>(initialMessages)
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const activeContact = contacts.find(c => c.id === activeContactId) || contacts[0]

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messagesList])

  // Poll for new messages every 3 seconds to make it feel real-time!
  useEffect(() => {
    if (!activeContactId) return
    const interval = setInterval(async () => {
      const res = await getMessagesBetweenUsers(currentUserId, activeContactId)
      if (res.success) {
        setMessagesList(res.messages)
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [currentUserId, activeContactId])

  const handleSelectContact = async (contactId: string) => {
    setActiveContactId(contactId)
    const res = await getMessagesBetweenUsers(currentUserId, contactId)
    if (res.success) {
      setMessagesList(res.messages)
    }
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() || !activeContactId) return
    
    const text = inputText
    setInputText('')

    // Optimistic UI update
    const optimisticMessage: Message = {
      id: Math.random().toString(),
      senderId: currentUserId,
      receiverId: activeContactId,
      content: text,
      createdAt: new Date()
    }
    setMessagesList(prev => [...prev, optimisticMessage])

    const res = await sendMessageAction(currentUserId, activeContactId, text)
    if (!res.success) {
      // Remove optimistic message and show alert if failed
      setMessagesList(prev => prev.filter(m => m.id !== optimisticMessage.id))
      alert(res.error || 'Failed to send message')
    } else {
      // Re-fetch message logs to get canonical id/timestamp
      const fetchRes = await getMessagesBetweenUsers(currentUserId, activeContactId)
      if (fetchRes.success) {
        setMessagesList(fetchRes.messages)
      }
    }
  }

  return (
    <div className="flex-grow flex items-stretch gap-6 overflow-hidden h-[calc(100vh-140px)] select-none">
      {/* Left Column: Contact threads */}
      <div className="w-80 rounded-3xl bg-[#0b0b0e] border border-white/[0.04] p-4 flex flex-col gap-4 shrink-0 shadow-lg">
        <div className="px-2 text-left">
          <h4 className="text-xs font-black uppercase text-white/30 tracking-widest font-mono">Conversations</h4>
          <p className="text-[9px] text-white/20 uppercase tracking-wider font-mono mt-0.5 font-black">Active Telemetry channels</p>
        </div>

        <div className="flex-grow overflow-y-auto space-y-2 pr-1">
          {contacts.map((c) => {
            const isActive = c.id === activeContactId
            return (
              <button 
                key={c.id}
                onClick={() => handleSelectContact(c.id)}
                className={cn(
                  "w-full flex items-center gap-3.5 p-3.5 rounded-2xl border transition-all text-left group cursor-pointer",
                  isActive 
                    ? "bg-gradient-to-r from-accent/15 to-accent/[0.01] border-accent/20 text-accent shadow-md shadow-accent/[0.01]"
                    : "bg-white/[0.005] border-white/[0.03] text-white/40 hover:bg-white/[0.02] hover:border-white/5 hover:text-white"
                )}
              >
                <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-sm font-serif shrink-0">
                  {c.image ? (
                    <img src={c.image} alt={c.name || ''} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    c.name?.[0]?.toUpperCase() || '?'
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <h5 className={cn("text-xs font-bold truncate transition-colors", isActive ? "text-white" : "text-white/80 group-hover:text-accent")}>
                      {c.name}
                    </h5>
                  </div>
                  <p className="text-[9.5px] text-white/40 truncate mt-1">
                    {c.role === 'owner' ? 'Client Node' : 'Developer Node'}
                  </p>
                </div>
              </button>
            )})}
        </div>
      </div>

      {/* Right Column: Active thread console */}
      <div className="flex-1 rounded-3xl bg-[#0b0b0e] border border-white/[0.04] flex flex-col overflow-hidden shadow-lg">
        {activeContact ? (
          <>
            {/* Header */}
            <div className="h-16 border-b border-white/[0.04] bg-white/[0.005] px-6 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 text-left">
                <div className="w-8 h-8 rounded-full bg-accent/15 border border-accent/25 flex items-center justify-center text-accent text-xs font-serif shrink-0">
                  {activeContact.image ? (
                    <img src={activeContact.image} alt={activeContact.name || ''} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    activeContact.name?.[0]?.toUpperCase() || '?'
                  )}
                </div>
                <div>
                  <h5 className="text-xs font-bold text-white leading-none">{activeContact.name}</h5>
                  <span className="text-[7.5px] font-black uppercase text-emerald-400 tracking-wider font-mono mt-1 block">active channel</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
              </div>
            </div>

            {/* Messages list (scrollable) */}
            <div className="flex-grow p-6 overflow-y-auto space-y-4">
              {messagesList.length > 0 ? (
                messagesList.map((m) => {
                  const isSender = m.senderId === currentUserId
                  return (
                    <div 
                      key={m.id} 
                      className={cn(
                        "flex items-end gap-3 max-w-[75%] text-left",
                        isSender ? "ml-auto justify-end text-right" : "justify-start"
                      )}
                    >
                      {!isSender && (
                        <div className="w-7 h-7 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-[10px] font-serif shrink-0">
                          {activeContact.name?.[0]?.toUpperCase() || '?'}
                        </div>
                      )}
                      <div className={cn(
                        "p-3.5 rounded-2xl text-xs leading-relaxed relative text-left",
                        isSender 
                          ? "bg-gradient-to-r from-accent/25 to-accent/10 border border-accent/15 text-white" 
                          : "bg-white/[0.01] border border-white/[0.03] text-white/80"
                      )}>
                        {m.content}
                        <span className="absolute bottom-1 right-2 flex items-center gap-1 text-[7px] text-white/20 font-mono">
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {isSender && <CheckCheck className="w-3 h-3 text-accent" />}
                        </span>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="h-full flex flex-col items-center justify-center gap-2 text-center opacity-40">
                  <Mail className="w-6 h-6 text-white/20" />
                  <p className="text-[9px] font-mono font-black uppercase tracking-[0.2em] text-white/20">No messages in channel</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input field */}
            <form onSubmit={handleSend} className="p-4 border-t border-white/[0.04] bg-white/[0.005] flex items-center gap-3 shrink-0">
              <button type="button" className="p-2.5 text-white/35 hover:text-white rounded-xl hover:bg-white/[0.01] cursor-pointer">
                <Paperclip className="w-4 h-4" />
              </button>
              <input 
                type="text" 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Send secure command..." 
                className="flex-1 h-11 bg-white/[0.01] border border-white/5 rounded-xl px-4 text-xs text-white placeholder-white/20 outline-none focus:border-accent transition-all"
              />
              <button type="submit" className="p-2.5 text-[#050505] bg-accent hover:shadow-[0_0_12px_rgba(255,122,0,0.2)] rounded-xl cursor-pointer">
                <Send className="w-4 h-4 stroke-[2.5px]" />
              </button>
            </form>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center gap-4 text-center p-12">
            <ShieldAlert className="w-8 h-8 text-white/25" />
            <div className="space-y-1">
              <p className="text-white font-serif text-lg">No Active Channel</p>
              <p className="text-white/40 text-xs leading-relaxed max-w-xs">
                You must have other users registered in the database to initiate communications.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
