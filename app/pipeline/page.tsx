'use client'

import { useState, type DragEvent } from 'react'
import { useApp } from '@/lib/context'
import { CONTACT_STATUSES, type ContactStatus } from '@/lib/types'
import { ContactCard } from '@/components/crm/ContactCard'
import { ContactEditor } from '@/components/crm/ContactEditor'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function PipelinePage() {
  const { contacts, updateContact } = useApp()
  const [editorOpen, setEditorOpen] = useState(false)
  const [defaultStatus, setDefaultStatus] = useState<ContactStatus>('prospect')
  const [dragOverCol, setDragOverCol] = useState<string | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)

  const cols = CONTACT_STATUSES.filter((s) => s.value !== 'inactive')

  const handleAdd = (status: ContactStatus) => {
    setDefaultStatus(status)
    setEditorOpen(true)
  }

  const handleDragStart = (e: DragEvent, contactId: string) => {
    e.dataTransfer.setData('text/plain', contactId)
    e.dataTransfer.effectAllowed = 'move'
    setDraggingId(contactId)
  }

  const handleDragOver = (e: DragEvent, colValue: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverCol(colValue)
  }

  const handleDragLeave = () => {
    setDragOverCol(null)
  }

  const handleDrop = (e: DragEvent, newStatus: ContactStatus) => {
    e.preventDefault()
    const contactId = e.dataTransfer.getData('text/plain')
    if (contactId) {
      updateContact(contactId, { status: newStatus })
    }
    setDragOverCol(null)
    setDraggingId(null)
  }

  const handleDragEnd = () => {
    setDragOverCol(null)
    setDraggingId(null)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <h1 className="text-lg font-semibold">Pipeline</h1>
        <Button size="sm" onClick={() => handleAdd('prospect')}>+ Contact</Button>
      </div>

      <div className="flex-1 overflow-x-auto">
        <div className="flex h-full min-w-max">
          {cols.map((col) => {
            const colContacts = contacts.filter((c) => c.status === col.value)
            const isOver = dragOverCol === col.value
            return (
              <div
                key={col.value}
                className={cn(
                  'flex flex-col w-72 border-r border-border last:border-r-0 transition-colors',
                  isOver && 'bg-primary/5'
                )}
                onDragOver={(e) => handleDragOver(e, col.value)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, col.value)}
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: col.color }} />
                    <span className="text-sm font-medium">{col.label}</span>
                    <span className="text-xs text-muted-foreground bg-muted rounded-full px-1.5 py-0.5">{colContacts.length}</span>
                  </div>
                  <button
                    className="text-muted-foreground hover:text-foreground text-lg leading-none"
                    onClick={() => handleAdd(col.value)}
                  >
                    +
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {colContacts.map((contact) => (
                    <div
                      key={contact.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, contact.id)}
                      onDragEnd={handleDragEnd}
                      className={cn(
                        'cursor-grab active:cursor-grabbing transition-opacity',
                        draggingId === contact.id && 'opacity-40'
                      )}
                    >
                      <ContactCard contact={contact} />
                    </div>
                  ))}
                  {colContacts.length === 0 && (
                    <div className={cn(
                      'text-xs text-muted-foreground text-center py-8 rounded-lg border-2 border-dashed border-transparent transition-colors',
                      isOver && 'border-primary/30 bg-primary/5'
                    )}>
                      {isOver ? 'Déposer ici' : 'Aucun contact'}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <ContactEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        defaultStatus={defaultStatus}
      />
    </div>
  )
}
