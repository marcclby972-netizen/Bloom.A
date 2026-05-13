'use client'

import { useState, useEffect } from 'react'
import { useApp } from '@/lib/context'
import { Task } from '@/lib/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'

type Props = {
  open: boolean
  onClose: () => void
  task?: Task | null
  defaultDate?: string
  defaultStartTime?: string
}

export function TaskEditor({ open, onClose, task, defaultDate, defaultStartTime }: Props) {
  const { categories, createTask, updateTask, deleteTask, selectedDate } = useApp()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')

  useEffect(() => {
    if (open) {
      if (task) {
        setTitle(task.title)
        setDescription(task.description)
        setCategoryId(task.categoryId)
        setTags(task.tags)
        setDate(task.date)
        setStartTime(task.startTime)
        setEndTime(task.endTime)
      } else {
        setTitle('')
        setDescription('')
        setCategoryId(categories[0]?.id || '')
        setTags([])
        setDate(defaultDate || selectedDate)
        setStartTime(defaultStartTime || '09:00')
        setEndTime(defaultStartTime ? `${String(Number(defaultStartTime.split(':')[0]) + 1).padStart(2, '0')}:00` : '10:00')
      }
      setTagInput('')
    }
  }, [open, task, defaultDate, defaultStartTime, selectedDate, categories])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    if (task) {
      updateTask(task.id, { title, description, categoryId, tags, date, startTime, endTime })
    } else {
      createTask({ title, description, categoryId, tags, date, startTime, endTime, status: 'planned' })
    }
    onClose()
  }

  const handleAddTag = () => {
    const t = tagInput.trim()
    if (t && !tags.includes(t)) {
      setTags([...tags, t])
    }
    setTagInput('')
  }

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag))
  }

  const handleDelete = () => {
    if (task) {
      deleteTask(task.id)
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{task ? 'Modifier la tâche' : 'Nouvelle tâche'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="Titre de la tâche"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />

          <Textarea
            placeholder="Description (optionnel)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Catégorie</label>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryId(cat.id)}
                  className="flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors"
                  style={{
                    borderColor: categoryId === cat.id ? cat.color : undefined,
                    backgroundColor: categoryId === cat.id ? `${cat.color}15` : undefined,
                  }}
                >
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cat.color }} />
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Date</label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Début</label>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Fin</label>
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Tags</label>
            <div className="flex gap-2">
              <Input
                placeholder="Ajouter un tag"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddTag()
                  }
                }}
              />
              <Button type="button" variant="outline" size="sm" onClick={handleAddTag}>+</Button>
            </div>
            {tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => handleRemoveTag(tag)}
                  >
                    {tag} ×
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-between pt-2">
            {task && (
              <Button type="button" variant="destructive" size="sm" onClick={handleDelete}>
                Supprimer
              </Button>
            )}
            <div className="ml-auto flex gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={onClose}>Annuler</Button>
              <Button type="submit" size="sm">{task ? 'Modifier' : 'Créer'}</Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
