'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useApp } from '@/lib/context'
import { CONTACT_STATUSES } from '@/lib/types'
import { ContactEditor } from '@/components/crm/ContactEditor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatRelative } from '@/lib/date-utils'

export default function ContactsPage() {
  const { contacts } = useApp()
  const [search, setSearch] = useState('')
  const [editorOpen, setEditorOpen] = useState(false)

  const filtered = contacts.filter((c) => {
    const q = search.toLowerCase()
    return (
      c.firstName.toLowerCase().includes(q) ||
      c.lastName.toLowerCase().includes(q) ||
      c.instagram.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.tags.some((t) => t.toLowerCase().includes(q))
    )
  })

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <h1 className="text-lg font-semibold">Contacts</h1>
        <Button size="sm" onClick={() => setEditorOpen(true)}>+ Contact</Button>
      </div>

      <div className="px-6 py-3 border-b border-border">
        <Input
          placeholder="Rechercher par nom, Instagram, téléphone, tag..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-background border-b border-border">
            <tr className="text-left text-xs text-muted-foreground">
              <th className="px-6 py-2 font-medium">Nom</th>
              <th className="px-4 py-2 font-medium">Instagram</th>
              <th className="px-4 py-2 font-medium">Téléphone</th>
              <th className="px-4 py-2 font-medium">Statut</th>
              <th className="px-4 py-2 font-medium">Source</th>
              <th className="px-4 py-2 font-medium">Dernière MAJ</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => {
              const status = CONTACT_STATUSES.find((s) => s.value === c.status)
              return (
                <tr key={c.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-3">
                    <Link href={`/contact/${c.id}`} className="font-medium hover:underline">
                      {c.firstName} {c.lastName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {c.instagram ? `@${c.instagram}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.phone || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 text-xs">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: status?.color }} />
                      {status?.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{c.source || '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{formatRelative(c.updatedAt)}</td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-12 text-muted-foreground">
                  {search ? 'Aucun résultat' : 'Aucun contact'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ContactEditor open={editorOpen} onClose={() => setEditorOpen(false)} />
    </div>
  )
}
