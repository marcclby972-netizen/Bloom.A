'use client'

import { useState, useEffect, useMemo } from 'react'
import { store } from '@/lib/store'
import { cn } from '@/lib/utils'

type Props = {
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  maxSuggestions?: number
}

/**
 * TagInput — input field with autocomplete from existing tags across all entities.
 * Suggestions are pulled from store.getAllTags() which aggregates tags from
 * tasks, contacts, posts and projects.
 */
export function TagInput({ value, onChange, placeholder = 'Ajouter un tag...', maxSuggestions = 6 }: Props) {
  const [input, setInput] = useState('')
  const [focused, setFocused] = useState(false)
  const [allTags, setAllTags] = useState<string[]>([])

  useEffect(() => {
    setAllTags(store.getAllTags())
  }, [])

  const suggestions = useMemo(() => {
    const q = input.trim().toLowerCase()
    return allTags
      .filter((t) => !value.includes(t) && (q === '' || t.toLowerCase().includes(q)))
      .slice(0, maxSuggestions)
  }, [allTags, value, input, maxSuggestions])

  const addTag = (tag: string) => {
    const t = tag.trim()
    if (!t || value.includes(t)) return
    onChange([...value, t])
    setInput('')
  }

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag))
  }

  return (
    <div className="space-y-1.5 relative">
      {/* Existing tags */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {value.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary"
            >
              #{tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="hover:text-destructive"
                aria-label={`Retirer ${tag}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input + autocomplete */}
      <div className="relative">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              if (input.trim()) addTag(input)
            } else if (e.key === 'Backspace' && !input && value.length > 0) {
              removeTag(value[value.length - 1])
            } else if (e.key === ',') {
              e.preventDefault()
              if (input.trim()) addTag(input)
            }
          }}
          placeholder={placeholder}
          className="w-full text-xs h-8 rounded-md border border-input bg-transparent px-2.5 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
        />

        {focused && suggestions.length > 0 && (
          <div className="absolute top-full mt-1 left-0 right-0 z-30 bg-background border border-border rounded-lg shadow-lg p-1 max-h-44 overflow-auto">
            {suggestions.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => addTag(tag)}
                className={cn(
                  'flex w-full items-center gap-1 px-2 py-1 rounded text-xs text-left hover:bg-muted transition-colors',
                )}
              >
                <span className="text-primary">#</span>
                <span>{tag}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
