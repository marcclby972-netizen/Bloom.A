'use client'

import { useState } from 'react'
import { useApp } from '@/lib/context'
import { CONTACT_STATUSES, CHANNELS, type Contact, type ContactStatus } from '@/lib/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

type Props = {
  open: boolean
  onClose: () => void
  contact?: Contact
  defaultStatus?: ContactStatus
}

export function ContactEditor({ open, onClose, contact, defaultStatus = 'prospect' }: Props) {
  const { createContact, updateContact, deleteContact } = useApp()

  const [firstName, setFirstName] = useState(contact?.firstName || '')
  const [lastName, setLastName] = useState(contact?.lastName || '')
  const [phone, setPhone] = useState(contact?.phone || '')
  const [email, setEmail] = useState(contact?.email || '')
  const [instagram, setInstagram] = useState(contact?.instagram || '')
  const [status, setStatus] = useState<ContactStatus>(contact?.status || defaultStatus)
  const [source, setSource] = useState(contact?.source || '')
  const [notes, setNotes] = useState(contact?.notes || '')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>(contact?.tags || [])

  const handleSave = () => {
    if (!firstName.trim()) return
    const data = { firstName: firstName.trim(), lastName: lastName.trim(), phone, email, instagram, status, source, notes, tags }
    if (contact) {
      updateContact(contact.id, data)
    } else {
      createContact(data)
    }
    onClose()
  }

  const handleDelete = () => {
    if (contact) {
      deleteContact(contact.id)
      onClose()
    }
  }

  const addTag = () => {
    const t = tagInput.trim()
    if (t && !tags.includes(t)) {
      setTags([...tags, t])
      setTagInput('')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{contact ? 'Modifier le contact' : 'Nouveau contact'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Prénom *" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            <Input placeholder="Nom" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
          <Input placeholder="Téléphone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input placeholder="Instagram (sans @)" value={instagram} onChange={(e) => setInstagram(e.target.value)} />
          <Input placeholder="Source (ex: Instagram, Bouche à oreille)" value={source} onChange={(e) => setSource(e.target.value)} />

          <div>
            <label className="text-xs font-medium text-muted-foreground">Statut</label>
            <div className="flex flex-wrap gap-1 mt-1">
              {CONTACT_STATUSES.map((s) => (
                <Button
                  key={s.value}
                  variant={status === s.value ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => setStatus(s.value)}
                >
                  <span className="h-2 w-2 rounded-full mr-1.5 shrink-0" style={{ backgroundColor: s.color }} />
                  {s.label}
                </Button>
              ))}
            </div>
          </div>

          <Textarea placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />

          <div>
            <label className="text-xs font-medium text-muted-foreground">Tags</label>
            <div className="flex gap-2 mt-1">
              <Input
                placeholder="Ajouter un tag"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="flex-1"
              />
              <Button variant="outline" size="sm" onClick={addTag}>+</Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs cursor-pointer hover:bg-muted/80"
                    onClick={() => setTags(tags.filter((t) => t !== tag))}
                  >
                    {tag} ×
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between pt-2">
          {contact ? (
            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={handleDelete}>
              Supprimer
            </Button>
          ) : (
            <div />
          )}
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>Annuler</Button>
            <Button size="sm" onClick={handleSave}>
              {contact ? 'Enregistrer' : 'Créer'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
