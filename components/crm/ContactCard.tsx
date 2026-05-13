'use client'

import Link from 'next/link'
import type { Contact } from '@/lib/types'
import { formatRelative } from '@/lib/date-utils'

export function ContactCard({ contact }: { contact: Contact }) {
  return (
    <Link
      href={`/contact/${contact.id}`}
      className="block rounded-lg border border-border bg-background p-3 hover:bg-muted/50 transition-colors"
    >
      <div className="font-medium text-sm">
        {contact.firstName} {contact.lastName}
      </div>
      {contact.instagram && (
        <div className="text-xs text-muted-foreground mt-0.5">@{contact.instagram}</div>
      )}
      {contact.phone && (
        <div className="text-xs text-muted-foreground mt-0.5">{contact.phone}</div>
      )}
      {contact.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {contact.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="inline-block rounded-full bg-muted px-2 py-0.5 text-[10px]">
              {tag}
            </span>
          ))}
        </div>
      )}
      <div className="text-[10px] text-muted-foreground mt-2">
        {formatRelative(contact.updatedAt)}
      </div>
    </Link>
  )
}
