'use client'

/**
 * Widget "Notifications" — repris du slot "Alertes IA" du HTML reference.
 * Affiche les 3 plus récentes notifications non-lues, avec un bouton de
 * marquage par clic et un lien "Tout marquer comme lu".
 */

import { useMemo } from 'react'
import type { Notification, NotificationType } from '@/lib/v3-types'

const ICON_META: Record<
  NotificationType,
  { color: string; bg: string; svg: React.ReactNode }
> = {
  new_decision: {
    color: '#B45309',
    bg: 'rgba(245,158,11,0.20)',
    svg: (
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
        <path
          d="M6.5 2L1.5 11h10L6.5 2zM6.5 5.5v2.5M6.5 9.5h.01"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  vote_result: {
    color: '#15803D',
    bg: 'rgba(34,197,94,0.16)',
    svg: (
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
        <path
          d="M3 6.5l2.5 2.5 5-5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  task_assigned: {
    color: '#1D4ED8',
    bg: 'rgba(59,130,246,0.16)',
    svg: (
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
        <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M6.5 4v3M6.5 9h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  timer_reminder: {
    color: '#7C3AED',
    bg: 'rgba(124,58,237,0.16)',
    svg: (
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
        <circle cx="6.5" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M6.5 4.5v2.5l1.6 1.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  rule_change: {
    color: '#0E7490',
    bg: 'rgba(6,182,212,0.16)',
    svg: (
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
        <rect x="2" y="3" width="9" height="7" stroke="currentColor" strokeWidth="1.5" />
        <path d="M4.5 6.5h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  member_joined: {
    color: '#0E7490',
    bg: 'rgba(6,182,212,0.16)',
    svg: (
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
        <circle cx="6.5" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M2 11c0-2 2-3.5 4.5-3.5s4.5 1.5 4.5 3.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  team_invite: {
    color: '#7C3AED',
    bg: 'rgba(124,58,237,0.16)',
    svg: (
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
        <circle cx="6.5" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M2 11c0-2 2-3.5 4.5-3.5s4.5 1.5 4.5 3.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
}

const DEFAULT_META = ICON_META.new_decision

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(ms / 60_000)
  if (minutes < 1) return "à l'instant"
  if (minutes < 60) return `il y a ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `il y a ${hours}h`
  const days = Math.floor(hours / 24)
  return `il y a ${days}j`
}

export function NotificationsWidget({
  notifications,
  unreadCount,
  markRead,
  markAllRead,
}: {
  notifications: Notification[]
  unreadCount: number
  markRead: (id: string) => void
  markAllRead: () => void
}) {
  const recent = useMemo(
    () =>
      notifications
        .slice()
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 3),
    [notifications]
  )

  return (
    <div className="widget w-span-4 ai">
      <div className="w-head">
        <div className="w-title">
          <span className="ico">
            <svg viewBox="0 0 14 14" fill="none">
              <rect x="3" y="4" width="8" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="5.5" cy="7.5" r=".7" fill="currentColor" />
              <circle cx="8.5" cy="7.5" r=".7" fill="currentColor" />
              <path d="M7 2v2M5 9.5h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </span>
          Notifications
        </div>
        <span className="tag ai">
          {unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}` : 'à jour'}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {recent.length === 0 && (
          <div
            style={{
              padding: 12,
              fontSize: 13,
              color: 'rgba(236,236,236,0.6)',
              fontWeight: 500,
            }}
          >
            Aucune notification pour le moment.
          </div>
        )}

        {recent.map((n) => {
          const meta = ICON_META[n.type] ?? DEFAULT_META
          return (
            <button
              type="button"
              key={n.id}
              onClick={() => markRead(n.id)}
              style={{
                display: 'flex',
                gap: 12,
                padding: 12,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 12,
                cursor: 'pointer',
                textAlign: 'left',
                opacity: n.readAt ? 0.55 : 1,
              }}
            >
              <span
                style={{
                  flexShrink: 0,
                  width: 26,
                  height: 26,
                  borderRadius: 7,
                  background: meta.bg,
                  color: meta.color,
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                {meta.svg}
              </span>
              <div
                style={{
                  fontSize: 13,
                  lineHeight: 1.5,
                  color: 'rgba(236,236,236,0.85)',
                  fontWeight: 500,
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <b style={{ color: '#ECECEC' }}>{n.title}</b>
                {n.body ? ` · ${n.body}` : ''}
                <div
                  style={{
                    fontSize: 11,
                    color: 'rgba(236,236,236,0.45)',
                    marginTop: 2,
                  }}
                >
                  {timeAgo(n.createdAt)}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {unreadCount > 0 && (
        <button
          type="button"
          className="w-link"
          onClick={markAllRead}
          style={{ background: 'none', border: 'none', textAlign: 'left', padding: 0 }}
        >
          Tout marquer comme lu →
        </button>
      )}
    </div>
  )
}
