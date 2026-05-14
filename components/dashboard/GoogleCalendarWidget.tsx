'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

type GEvent = {
  id: string
  title: string
  start: string
  end: string
  allDay: boolean
  htmlLink?: string
  location?: string
}

export function GoogleCalendarWidget() {
  const [events, setEvents] = useState<GEvent[]>([])
  const [connected, setConnected] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const fetchEvents = async () => {
      try {
        const res = await fetch('/api/google-calendar?days=7')
        if (!res.ok) {
          if (!cancelled) { setConnected(false); setLoading(false) }
          return
        }
        const data = await res.json()
        if (cancelled) return
        if (data.connected) {
          setConnected(true)
          setEvents(data.events || [])
        } else {
          setConnected(false)
        }
      } catch {
        if (!cancelled) setConnected(false)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchEvents()
    return () => { cancelled = true }
  }, [])

  if (loading) return null
  if (connected === false) return null // Don't show widget if not connected

  return (
    <Card className="hover:border-primary/50 transition-colors h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm">Google Calendar</CardTitle>
        <span className="text-[10px] text-muted-foreground">7 prochains jours</span>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="text-xs text-muted-foreground py-4 text-center">Aucun événement à venir</div>
        ) : (
          <div className="space-y-1.5">
            {events.slice(0, 5).map((e) => (
              <a
                key={e.id}
                href={e.htmlLink || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="block group"
              >
                <div className="flex items-center gap-2 text-xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                  <span className="truncate flex-1 group-hover:text-primary transition-colors">{e.title}</span>
                  <span className="text-muted-foreground shrink-0 text-[10px]">
                    {e.allDay
                      ? 'Toute journée'
                      : new Date(e.start).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </a>
            ))}
            {events.length > 5 && (
              <div className="text-xs text-muted-foreground pt-1">+{events.length - 5} autres</div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function GoogleCalendarConnectPrompt() {
  return (
    <Card>
      <CardContent className="text-center py-6 space-y-3">
        <p className="text-sm text-muted-foreground">Synchronise ton Google Calendar</p>
        <Link href="/settings">
          <Button size="sm" variant="outline">Connecter dans Paramètres</Button>
        </Link>
      </CardContent>
    </Card>
  )
}
