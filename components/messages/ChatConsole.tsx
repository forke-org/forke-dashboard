'use client'

import React, { useState, useEffect, useRef } from 'react'
import { getMessagesBetweenUsers, sendMessageAction, uploadChatFile } from '@/app/(app)/messages/actions'
import { Send, Check, CheckCheck, Paperclip, Mail, ShieldAlert, Loader2, ImageIcon, FileText, GitBranch } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface Contact {
  id: string
  name: string | null
  image: string | null
  role: string
  githubUrl?: string | null
}

interface Message {
  id: string
  senderId: string
  receiverId: string
  content: string
  createdAt: Date
  isReceived: boolean
  isSeen: boolean
  fileUrl?: string | null
  fileName?: string | null
}

interface ChatConsoleProps {
  contacts: Contact[]
  currentUserId: string
  initialMessages: Message[]
  defaultContactId?: string
}

export default function ChatConsole({ contacts, currentUserId, initialMessages, defaultContactId }: ChatConsoleProps) {
  const [activeContactId, setActiveContactId] = useState<string>(defaultContactId || contacts[0]?.id || '')
  const [messagesList, setMessagesList] = useState<Message[]>(initialMessages)
  const [inputText, setInputText] = useState('')
  const [activeContactOnline, setActiveContactOnline] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [showAttachMenu, setShowAttachMenu] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const attachMenuRef = useRef<HTMLDivElement>(null)

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
        setMessagesList(res.messages as Message[])
        setActiveContactOnline(!!res.isOnline)
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [currentUserId, activeContactId])

  // Close attach menu on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target as Node)) {
        setShowAttachMenu(false)
      }
    }
    if (showAttachMenu) document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [showAttachMenu])

  const handleSelectContact = async (contactId: string) => {
    setActiveContactId(contactId)
    const res = await getMessagesBetweenUsers(currentUserId, contactId)
    if (res.success) {
      setMessagesList(res.messages as Message[])
      setActiveContactOnline(!!res.isOnline)
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
      isReceived: false,
      isSeen: false,
      createdAt: new Date()
    }
    setMessagesList(prev => [...prev, optimisticMessage])

    const res = await sendMessageAction(currentUserId, activeContactId, text)
    if (!res.success) {
      setMessagesList(prev => prev.filter(m => m.id !== optimisticMessage.id))
      alert(res.error || 'Failed to send message')
    } else {
      const fetchRes = await getMessagesBetweenUsers(currentUserId, activeContactId)
      if (fetchRes.success) {
        setMessagesList(fetchRes.messages as Message[])
        setActiveContactOnline(!!fetchRes.isOnline)
      }
    }
  }

  const handleFileUpload = async (file: File) => {
    if (!file || !activeContactId) return
    setShowAttachMenu(false)
    setIsUploading(true)

    const formData = new FormData()
    formData.append('file', file)

    const uploadRes = await uploadChatFile(formData)
    if (!uploadRes.success || !uploadRes.fileUrl) {
      alert(uploadRes.error || 'File upload failed')
      setIsUploading(false)
      return
    }

    const optimisticMsg: Message = {
      id: Math.random().toString(),
      senderId: currentUserId,
      receiverId: activeContactId,
      content: `Sent a file: ${file.name}`,
      fileUrl: uploadRes.fileUrl,
      fileName: file.name,
      isReceived: false,
      isSeen: false,
      createdAt: new Date()
    }
    setMessagesList(prev => [...prev, optimisticMsg])

    const sendRes = await sendMessageAction(
      currentUserId,
      activeContactId,
      `Sent a file: ${file.name}`,
      uploadRes.fileUrl,
      file.name
    )

    setIsUploading(false)

    if (!sendRes.success) {
      setMessagesList(prev => prev.filter(m => m.id !== optimisticMsg.id))
      alert(sendRes.error || 'Failed to dispatch file message')
    } else {
      const fetchRes = await getMessagesBetweenUsers(currentUserId, activeContactId)
      if (fetchRes.success) {
        setMessagesList(fetchRes.messages as Message[])
        setActiveContactOnline(!!fetchRes.isOnline)
      }
    }
  }

  return (
    <div className="flex-grow flex items-stretch gap-4 overflow-hidden h-[calc(100vh-130px)] select-none">
      {/* Left Column: Contact threads */}
      <div className="w-72 rounded-xl bg-white/[0.018] border border-[var(--color-border)] p-3 flex flex-col gap-3 shrink-0">
        <div className="px-1.5 text-left">
          <h4 className="text-sm font-semibold text-white">Conversations</h4>
        </div>

        <div className="flex-grow overflow-y-auto space-y-1 pr-0.5">
          {contacts.map((c) => {
            const isActive = c.id === activeContactId
            return (
              <button
                key={c.id}
                onClick={() => handleSelectContact(c.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-2.5 rounded-lg border transition-colors text-left group cursor-pointer",
                  isActive
                    ? "bg-white/[0.05] border-[var(--color-border)] text-white"
                    : "bg-transparent border-transparent text-[var(--color-text-muted)] hover:bg-white/[0.03] hover:text-white"
                )}
              >
                <div className="w-9 h-9 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-[13px] font-medium shrink-0 overflow-hidden">
                  {c.image ? (
                    <img src={c.image} alt={c.name || ''} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    c.name?.[0]?.toUpperCase() || '?'
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className={cn("text-[13px] font-medium truncate transition-colors", isActive ? "text-white" : "text-white/80 group-hover:text-white")}>
                    {c.name}
                  </h5>
                  <p className="text-[11px] text-[var(--color-text-muted)] truncate mt-0.5 capitalize">
                    {c.role === 'owner' ? 'Client' : 'Developer'}
                  </p>
                </div>
              </button>
            )})}
        </div>
      </div>

      {/* Right Column: Active thread console */}
      <div className="flex-1 rounded-xl bg-white/[0.018] border border-[var(--color-border)] flex flex-col overflow-hidden">
        {activeContact ? (
          <>
            {/* Header */}
            <div className="h-14 border-b border-[var(--color-border)] px-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5 text-left">
                <div className="w-8 h-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-xs font-medium shrink-0 overflow-hidden">
                  {activeContact.image ? (
                    <img src={activeContact.image} alt={activeContact.name || ''} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    activeContact.name?.[0]?.toUpperCase() || '?'
                  )}
                </div>
                <div>
                  <h5 className="text-[13px] font-medium text-white leading-none">{activeContact.name}</h5>
                  <span className={cn("text-[11px] mt-1 block font-mono", activeContactOnline ? "text-emerald-400" : "text-white/40")}>
                    {activeContactOnline ? 'ONLINE' : 'OFFLINE'}
                  </span>
                </div>
              </div>
              <span className={cn("w-2 h-2 rounded-full transition-colors duration-300", activeContactOnline ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-white/20")} />
            </div>

            {/* Messages list (scrollable) */}
            <div className="flex-grow p-4 overflow-y-auto space-y-3">
              {messagesList.length > 0 ? (
                messagesList.map((m) => {
                  const isSender = m.senderId === currentUserId
                  return (
                    <div
                      key={m.id}
                      className={cn(
                        "flex items-end gap-2.5 max-w-[75%] text-left",
                        isSender ? "ml-auto justify-end text-right" : "justify-start"
                      )}
                    >
                      {!isSender && (
                        <div className="w-6 h-6 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-[10px] font-medium shrink-0">
                          {activeContact.name?.[0]?.toUpperCase() || '?'}
                        </div>
                      )}
                      <div className={cn(
                        "px-3 py-2 rounded-lg text-[13px] leading-relaxed relative text-left pb-5 min-w-[120px] max-w-full",
                        isSender
                          ? "bg-accent/15 border border-accent/20 text-white"
                          : "bg-white/[0.03] border border-[var(--color-border)] text-white/85"
                      )}>
                        
                        {/* File Attachment Render */}
                        {m.fileUrl ? (
                          <div className="mb-2">
                            {/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(m.fileUrl) ? (
                              <a 
                                href={m.fileUrl} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="block relative group rounded overflow-hidden border border-white/10 bg-[#0d0d0f]/50 p-0.5"
                              >
                                <img src={m.fileUrl} alt={m.fileName || 'Attached image'} className="max-h-36 object-cover rounded hover:opacity-90 transition-opacity" />
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-semibold text-white">
                                  View Image
                                </div>
                              </a>
                            ) : (
                              <a 
                                href={m.fileUrl} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="flex items-center gap-2 p-2 bg-[#0c0c0e] hover:bg-white/[0.04] border border-white/10 rounded-lg text-xs text-accent font-semibold transition-colors"
                              >
                                <Paperclip className="w-4 h-4 shrink-0" />
                                <span className="truncate max-w-[180px] text-white/80">{m.fileName || 'Attached File'}</span>
                              </a>
                            )}
                          </div>
                        ) : (
                          m.content
                        )}

                        {/* WhatsApp Ticks Status */}
                        <span className="absolute bottom-1 right-2 flex items-center gap-1 text-[9px] text-white/30 font-mono select-none">
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          
                          {isSender && (
                            <span className="shrink-0 flex ml-0.5">
                              {m.isSeen ? (
                                <CheckCheck className="w-3.5 h-3.5 text-sky-400" />
                              ) : m.isReceived ? (
                                <CheckCheck className="w-3.5 h-3.5 text-white/40" />
                              ) : (
                                <Check className="w-3.5 h-3.5 text-white/30" />
                              )}
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="h-full flex flex-col items-center justify-center gap-2 text-center">
                  <Mail className="w-5 h-5 text-[var(--color-text-muted)]" />
                  <p className="text-[13px] text-[var(--color-text-muted)]">No messages yet</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input field */}
            <form onSubmit={handleSend} className="p-3 border-t border-[var(--color-border)] flex items-center gap-2 shrink-0 relative">
              
              {/* Hidden photo input — images only */}
              <input
                type="file"
                ref={photoInputRef}
                accept="image/png,image/jpeg,image/jpg,image/gif,image/webp,image/svg+xml"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileUpload(file)
                  e.target.value = ''
                }}
                className="hidden"
              />

              {/* Hidden file input — documents */}
              <input
                type="file"
                ref={fileInputRef}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileUpload(file)
                  e.target.value = ''
                }}
                className="hidden"
              />

              {/* Attachment button + popover menu */}
              <div className="relative" ref={attachMenuRef}>
                <button
                  type="button"
                  onClick={() => setShowAttachMenu(prev => !prev)}
                  disabled={isUploading}
                  className={cn(
                    "p-2 rounded-lg transition-all cursor-pointer disabled:opacity-50",
                    showAttachMenu
                      ? "text-accent bg-accent/10"
                      : "text-[var(--color-text-muted)] hover:text-white hover:bg-white/[0.03]"
                  )}
                  title="Attach"
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-accent" />
                  ) : (
                    <Paperclip className="w-4 h-4" />
                  )}
                </button>

                {/* Popover */}
                {showAttachMenu && !isUploading && (
                  <div className="absolute bottom-full left-0 mb-2 w-44 rounded-lg border border-[var(--color-border)] bg-[#111113] shadow-lg overflow-hidden z-50 py-1">
                    <button
                      type="button"
                      onClick={() => { photoInputRef.current?.click() }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-white/80 hover:text-white hover:bg-white/[0.04] transition-colors cursor-pointer text-left"
                    >
                      <ImageIcon className="w-3.5 h-3.5 shrink-0 text-white/40" />
                      Photo
                    </button>
                    <button
                      type="button"
                      onClick={() => { fileInputRef.current?.click() }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-white/80 hover:text-white hover:bg-white/[0.04] transition-colors cursor-pointer text-left"
                    >
                      <FileText className="w-3.5 h-3.5 shrink-0 text-white/40" />
                      File
                    </button>
                    <a
                      href={activeContact?.githubUrl || 'https://github.com'}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setShowAttachMenu(false)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-white/80 hover:text-white hover:bg-white/[0.04] transition-colors cursor-pointer text-left block border-t border-[var(--color-border)] mt-1 pt-2"
                    >
                      <GitBranch className="w-3.5 h-3.5 shrink-0 text-white/40" />
                      GitHub
                    </a>
                  </div>
                )}
              </div>
              
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={isUploading ? "Uploading file..." : "Type a message…"}
                disabled={isUploading}
                className="flex-1 h-10 bg-white/[0.02] border border-[var(--color-border)] rounded-lg px-3 text-[13px] text-white placeholder-white/25 outline-none focus:border-accent transition-colors disabled:opacity-50"
              />
              
              <button 
                type="submit" 
                disabled={isUploading}
                className="p-2.5 text-[#0a0a0a] bg-accent hover:bg-accent-hover rounded-lg cursor-pointer transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-center p-10">
            <ShieldAlert className="w-6 h-6 text-[var(--color-text-muted)]" />
            <div className="space-y-1">
              <p className="text-white font-medium text-sm">No conversations</p>
              <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed max-w-xs">
                Other registered users will appear here so you can message them.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
