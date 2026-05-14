'use client'

import { useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useApp } from '@/lib/context'
import { store } from '@/lib/store'
import { CONTACT_STATUSES, CHANNELS, type Channel } from '@/lib/types'
import { formatDateFr, formatRelative } from '@/lib/date-utils'
import { ContactEditor } from '@/components/crm/ContactEditor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ContactDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { contacts, createInteraction, deleteInteraction, updateContact } = useApp()

  const contact = useMemo(() => contacts.find((c) => c.id === params.id), [contacts, params.id])
  const interactions = useMemo(() => (contact ? store.getInteractions(contact.id) : []), [contact, contacts])

  const [editorOpen, setEditorOpen] = useState(false)
  const [newChannel, setNewChannel] = useState<Channel>('instagram_dm')
  const [newDirection, setNewDirection] = useState<'outbound' | 'inbound'>('outbound')
  const [newSummary, setNewSummary] = useState('')

  if (!contact) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Contact introuvable
      </div>
    )
  }

  const status = CONTACT_STATUSES.find((s) => s.value === contact.status)

  const handleAddInteraction = () => {
    if (!newSummary.trim()) return
    createInteraction({
      contactId: contact.id,
      channel: newChannel,
      direction: newDirection,
      summary: newSummary.trim(),
      date: Date.now(),
    })
    setNewSummary('')
  }

  const handleStatusChange = (newStatus: string) => {
    updateContact(contact.id, { status: newStatus as typeof contact.status })
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-4 px-6 py-4 border-b border-border shrink-0">
        <button onClick={() => router.back()} className="text-muted-foreground hover:text-foreground">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold">{contact.firstName} {contact.lastName}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: status?.color }} />
            <span className="text-xs text-muted-foreground">{status?.label}</span>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => setEditorOpen(true)}>Modifier</Button>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Coordonnées</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              {contact.phone && <div>Tél : {contact.phone}</div>}
              {contact.email && <div>📧 {contact.email}</div>}
              {contact.instagram && <div>📸 @{contact.instagram}</div>}
              {!contact.phone && !contact.email && !contact.instagram && (
                <div className="text-muted-foreground text-xs">Aucune coordonnée</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Infos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <div className="text-xs text-muted-foreground">Source: {contact.source || '—'}</div>
              <div className="text-xs text-muted-foreground">Créé {formatRelative(contact.createdAt)}</div>
              {contact.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {contact.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-[10px]">{tag}</span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1">
                {CONTACT_STATUSES.map((s) => (
                  <button
                    key={s.value}
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] border transition-colors ${
                      contact.status === s.value
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border hover:bg-muted'
                    }`}
                    onClick={() => handleStatusChange(s.value)}
                  >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: contact.status === s.value ? 'currentColor' : s.color }} />
                    {s.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {contact.notes && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{contact.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Add interaction */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Nouvelle interaction</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <select
                value={newChannel}
                onChange={(e) => setNewChannel(e.target.value as Channel)}
                className="h-8 rounded-md border border-border bg-background px-2 text-xs"
              >
                {CHANNELS.map((ch) => (
                  <option key={ch.value} value={ch.value}>{ch.label}</option>
                ))}
              </select>
              <select
                value={newDirection}
                onChange={(e) => setNewDirection(e.target.value as 'outbound' | 'inbound')}
                className="h-8 rounded-md border border-border bg-background px-2 text-xs"
              >
                <option value="outbound">Sortant</option>
                <option value="inbound">Entrant</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Textarea
                placeholder="Résumé de l'interaction..."
                value={newSummary}
                onChange={(e) => setNewSummary(e.target.value)}
                rows={2}
                className="flex-1"
              />
              <Button size="sm" className="self-end" onClick={handleAddInteraction}>Ajouter</Button>
            </div>
          </CardContent>
        </Card>

        {/* Interaction history */}
        <div>
          <h3 className="text-sm font-medium mb-3">Historique ({interactions.length})</h3>
          {interactions.length === 0 ? (
            <div className="text-xs text-muted-foreground text-center py-6">Aucune interaction</div>
          ) : (
            <div className="space-y-2">
              {interactions.map((inter) => {
                const ch = CHANNELS.find((c) => c.value === inter.channel)
                return (
                  <div key={inter.id} className="flex items-start gap-3 rounded-lg border border-border p-3 group">
                    <div className="flex flex-col items-center gap-1">
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                        inter.direction === 'outbound' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'
                      }`}>
                        {inter.direction === 'outbound' ? '→' : '←'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">{ch?.label}</span>
                        <span>{formatDateFr(inter.date, 'dd MMM yyyy HH:mm')}</span>
                        <span>({formatRelative(inter.date)})</span>
                      </div>
                      <p className="text-sm mt-1">{inter.summary}</p>
                    </div>
                    <button
                      className="text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                      onClick={() => deleteInteraction(inter.id)}
                    >
                      ×
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <ContactEditor open={editorOpen} onClose={() => setEditorOpen(false)} contact={contact} />
    </div>
  )
}
