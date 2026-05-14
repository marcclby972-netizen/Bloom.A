'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { cn } from '@/lib/utils'

type NotificationRow = {
  id: string
  type: string
  title: string
  body: string | null
  action_payload: Record<string, unknown>
  read: boolean
  created_at: string
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationRow[]>([])
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications')
      if (!res.ok) return
      const data = await res.json()
      setNotifications(data.notifications || [])
    } catch {/* ignore */}
  }, [])

  // Initial load + poll every 30s
  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 30_000)
    return () => clearInterval(interval)
  }, [refresh])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const unreadCount = notifications.filter((n) => !n.read).length

  const handleRespond = async (inviteId: string, accept: boolean) => {
    await fetch('/api/notifications/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inviteId, accept }),
    })
    refresh()
  }

  const handleMarkRead = async (id: string) => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    refresh()
  }

  const handleMarkAllRead = async () => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAllRead: true }),
    })
    refresh()
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/notifications?id=${id}`, { method: 'DELETE' })
    refresh()
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="h-9 w-9 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors relative"
        aria-label="Notifications"
      >
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 8a5 5 0 0 1 10 0v3l1.5 3h-13L5 11V8Z" />
          <path d="M8 17a2 2 0 0 0 4 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-4 min-w-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-background border border-border rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className="text-xs text-primary hover:underline">
                Tout marquer lu
              </button>
            )}
          </div>
          <div className="max-h-[60vh] overflow-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                Aucune notification
              </div>
            ) : (
              notifications.map((n) => (
                <NotificationItem
                  key={n.id}
                  notif={n}
                  onRespond={handleRespond}
                  onMarkRead={handleMarkRead}
                  onDelete={handleDelete}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function NotificationItem({ notif, onRespond, onMarkRead, onDelete }: {
  notif: NotificationRow
  onRespond: (inviteId: string, accept: boolean) => void
  onMarkRead: (id: string) => void
  onDelete: (id: string) => void
}) {
  const isInvite = notif.type === 'project_invite'
  const inviteId = isInvite ? (notif.action_payload?.invite_id as string) : null
  const [responded, setResponded] = useState(false)
  const ago = relativeTime(notif.created_at)

  return (
    <div className={cn(
      'group px-4 py-3 border-b border-border last:border-b-0 relative',
      !notif.read && 'bg-primary/5'
    )}>
      <div className="flex items-start gap-2">
        {!notif.read && <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 mt-1.5" />}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{notif.title}</p>
          {notif.body && <p className="text-xs text-muted-foreground mt-0.5">{notif.body}</p>}
          <p className="text-[10px] text-muted-foreground mt-1">{ago}</p>

          {isInvite && inviteId && !responded && (
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => { onRespond(inviteId, true); setResponded(true) }}
                className="text-xs font-medium px-3 py-1 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Accepter
              </button>
              <button
                onClick={() => { onRespond(inviteId, false); setResponded(true) }}
                className="text-xs font-medium px-3 py-1 rounded-md bg-muted text-muted-foreground hover:bg-muted/80"
              >
                Refuser
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {!notif.read && (
            <button
              onClick={() => onMarkRead(notif.id)}
              title="Marquer lu"
              className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:bg-muted"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="6" cy="6" r="5" />
                <path d="M3.5 6L5 7.5L8.5 4" />
              </svg>
            </button>
          )}
          <button
            onClick={() => onDelete(notif.id)}
            title="Supprimer"
            className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:bg-red-50 hover:text-red-500"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h8M4 3V2.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5V3" />
              <path d="M3 3v7a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

function relativeTime(iso: string): string {
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (sec < 60) return 'à l\'instant'
  if (sec < 3600) return `il y a ${Math.floor(sec / 60)} min`
  if (sec < 86400) return `il y a ${Math.floor(sec / 3600)} h`
  if (sec < 7 * 86400) return `il y a ${Math.floor(sec / 86400)} j`
  return new Date(iso).toLocaleDateString('fr-FR')
}
