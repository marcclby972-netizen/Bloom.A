'use client'

import { useState, useEffect } from 'react'
import { useApp } from '@/lib/context'
import { Task } from '@/lib/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { TagInput } from '@/components/shared/TagInput'
import { cn } from '@/lib/utils'

type Props = {
  open: boolean
  onClose: () => void
  task?: Task | null
  defaultDate?: string
  defaultStartTime?: string
}

export function TaskEditor({ open, onClose, task, defaultDate, defaultStartTime }: Props) {
  const { categories, projects, createTaskWithTodo, updateTask, deleteTask, selectedDate } = useApp()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [projectId, setProjectId] = useState<string | null>(null)
  const [tags, setTags] = useState<string[]>([])
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [autoCreateTodo, setAutoCreateTodo] = useState(true)

  useEffect(() => {
    if (open) {
      if (task) {
        setTitle(task.title)
        setDescription(task.description)
        setCategoryId(task.categoryId)
        setProjectId(task.projectId ?? null)
        setTags(task.tags)
        setDate(task.date)
        setStartTime(task.startTime)
        setEndTime(task.endTime)
      } else {
        setTitle('')
        setDescription('')
        setCategoryId(categories[0]?.id || '')
        setProjectId(null)
        setTags([])
        setDate(defaultDate || selectedDate)
        setStartTime(defaultStartTime || '09:00')
        setEndTime(defaultStartTime ? `${String(Number(defaultStartTime.split(':')[0]) + 1).padStart(2, '0')}:00` : '10:00')
        setAutoCreateTodo(true)
      }
    }
  }, [open, task, defaultDate, defaultStartTime, selectedDate, categories])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    if (task) {
      updateTask(task.id, { title, description, categoryId, tags, date, startTime, endTime, projectId: projectId ?? undefined })
    } else {
      createTaskWithTodo(
        { title, description, categoryId, tags, date, startTime, endTime, status: 'planned', projectId: projectId ?? undefined },
        autoCreateTodo
      )
    }
    onClose()
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

          {projects.length > 0 && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Projet</label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setProjectId(null)}
                  className={cn(
                    'rounded-md border px-2.5 py-1 text-xs transition-colors',
                    projectId === null ? 'border-primary bg-primary/5 text-foreground' : 'border-border text-muted-foreground hover:bg-muted'
                  )}
                >
                  Aucun
                </button>
                {projects.filter((p) => p.status !== 'archived').map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setProjectId(p.id)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors',
                      projectId === p.id ? 'border-primary bg-primary/5 text-foreground' : 'border-border text-muted-foreground hover:bg-muted'
                    )}
                  >
                    {p.color && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />}
                    <span className="truncate max-w-[120px]">{p.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Tags</label>
            <TagInput value={tags} onChange={setTags} placeholder="Ajouter un tag (Entrée ou virgule)..." />
          </div>

          {!task && (
            <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoCreateTodo}
                onChange={(e) => setAutoCreateTodo(e.target.checked)}
                className="h-3.5 w-3.5 rounded accent-primary"
              />
              <span className="text-muted-foreground">Créer aussi un to-do lié (validation synchronisée)</span>
            </label>
          )}

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
