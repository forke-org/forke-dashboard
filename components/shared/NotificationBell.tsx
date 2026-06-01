'use client'

import React, { useState, useEffect, useRef, useTransition } from 'react'
import { Bell, Check, X, CheckCheck, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  deleteAllNotifications,
} from '@/app/(app)/notifications/actions'
import Link from 'next/link'

interface Notification {
  id: string
  userId: string
  type: string
  title: string
  body: string
  link: string | null
  isRead: boolean
  createdAt: Date
}

interface NotificationBellProps {
  userId: string
  initialUnreadCount?: number
}

function timeAgo(date: Date): string {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function NotificationBell({ userId, initialUnreadCount = 0 }: NotificationBellProps) {
  const [open, setOpen] = useState(false)
  const [notifs, setNotifs] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const modalRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Poll for unread count every 15s
  useEffect(() => {
    const refresh = async () => {
      const res = await getNotifications(userId)
      if (res.success) {
        setNotifs(res.notifications as Notification[])
        setUnreadCount(res.notifications.filter(n => !n.isRead).length)
      }
    }
    refresh()
    const interval = setInterval(refresh, 15000)
    return () => clearInterval(interval)
  }, [userId])

  const handleOpen = async () => {
    setOpen(v => !v)
    // Refresh list on open
    const res = await getNotifications(userId)
    if (res.success) {
      setNotifs(res.notifications as Notification[])
      setUnreadCount(res.notifications.filter(n => !n.isRead).length)
    }
  }

  const handleMarkRead = (id: string) => {
    startTransition(async () => {
      await markNotificationRead(id, userId)
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
    })
  }

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteNotification(id, userId)
      const deleted = notifs.find(n => n.id === id)
      setNotifs(prev => prev.filter(n => n.id !== id))
      if (deleted && !deleted.isRead) setUnreadCount(prev => Math.max(0, prev - 1))
    })
  }

  const handleMarkAllRead = () => {
    startTransition(async () => {
      await markAllNotificationsRead(userId)
      setNotifs(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
    })
  }

  const handleDeleteAll = () => {
    startTransition(async () => {
      await deleteAllNotifications(userId)
      setNotifs([])
      setUnreadCount(0)
    })
  }

  return (
    <div className="fixed bottom-6 right-6 z-50" ref={modalRef}>
      {/* Floating Bell Button */}
      <button
        onClick={handleOpen}
        className={cn(
          'relative w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 cursor-pointer',
          'bg-[#111114] border border-[var(--color-border)] hover:border-accent/40 hover:bg-[#18181b]',
          open && 'border-accent/40 bg-[#18181b]'
        )}
        title="Notifications"
      >
        <Bell className={cn('w-5 h-5 transition-colors', unreadCount > 0 ? 'text-accent' : 'text-white/50')} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-[#0a0a0a] text-[10px] font-bold flex items-center justify-center leading-none shadow">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Modal */}
      {open && (
        <div className="absolute bottom-14 right-0 w-80 rounded-xl border border-[var(--color-border)] bg-[#0f0f11] shadow-[0_12px_40px_rgba(0,0,0,0.6)] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
            <div className="flex items-center gap-2">
              <h4 className="text-[13px] font-semibold text-white">Notifications</h4>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold bg-accent/15 text-accent px-1.5 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {notifs.some(n => !n.isRead) && (
                <button
                  onClick={handleMarkAllRead}
                  disabled={isPending}
                  title="Mark all as read"
                  className="flex items-center gap-1 text-[11px] text-white/40 hover:text-emerald-400 transition-colors px-2 py-1 rounded cursor-pointer disabled:opacity-50"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  All read
                </button>
              )}
              {notifs.length > 0 && (
                <button
                  onClick={handleDeleteAll}
                  disabled={isPending}
                  title="Delete all"
                  className="flex items-center gap-1 text-[11px] text-white/40 hover:text-red-400 transition-colors px-2 py-1 rounded cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-[var(--color-border)]">
            {notifs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Bell className="w-5 h-5 text-white/20" />
                <p className="text-[12px] text-white/30">No notifications yet</p>
              </div>
            ) : (
              notifs.map(notif => (
                <div
                  key={notif.id}
                  onMouseEnter={() => setHoveredId(notif.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className={cn(
                    'flex items-start gap-3 px-4 py-3 relative transition-colors',
                    !notif.isRead ? 'bg-accent/[0.03]' : 'bg-transparent',
                    'hover:bg-white/[0.02]'
                  )}
                >
                  {/* Unread dot */}
                  {!notif.isRead && (
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                  )}
                  {notif.isRead && <span className="mt-1.5 w-1.5 h-1.5 shrink-0" />}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {notif.link ? (
                      <Link
                        href={notif.link}
                        onClick={() => { setOpen(false); if (!notif.isRead) handleMarkRead(notif.id) }}
                        className="block"
                      >
                        <p className={cn('text-[12px] font-medium leading-snug', notif.isRead ? 'text-white/60' : 'text-white')}>{notif.title}</p>
                        <p className="text-[11px] text-white/40 mt-0.5 leading-snug line-clamp-2">{notif.body}</p>
                      </Link>
                    ) : (
                      <>
                        <p className={cn('text-[12px] font-medium leading-snug', notif.isRead ? 'text-white/60' : 'text-white')}>{notif.title}</p>
                        <p className="text-[11px] text-white/40 mt-0.5 leading-snug line-clamp-2">{notif.body}</p>
                      </>
                    )}
                    <p className="text-[10px] text-white/25 mt-1 font-mono">{timeAgo(notif.createdAt)}</p>
                  </div>

                  {/* Hover actions */}
                  <div className={cn(
                    'absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 transition-all duration-150',
                    hoveredId === notif.id ? 'opacity-100' : 'opacity-0 pointer-events-none'
                  )}>
                    {!notif.isRead && (
                      <button
                        onClick={() => handleMarkRead(notif.id)}
                        disabled={isPending}
                        title="Mark as read"
                        className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center hover:bg-emerald-500/20 transition-colors cursor-pointer"
                      >
                        <Check className="w-3 h-3 text-emerald-400" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(notif.id)}
                      disabled={isPending}
                      title="Delete"
                      className="w-6 h-6 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center hover:bg-red-500/20 transition-colors cursor-pointer"
                    >
                      <X className="w-3 h-3 text-red-400" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
