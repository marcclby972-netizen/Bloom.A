'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useApp } from '@/lib/context'
import { store } from '@/lib/store'
import { PROJECT_STATUSES, CONTACT_STATUSES, PLATFORMS, TODO_PRIORITIES } from '@/lib/types'
import type { Project, ProjectStatus, ProjectNote, ProjectRevenueType } from '@/lib/types'
import { formatRelative } from '@/lib/date-utils'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'

// ── Helpers ──

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

/** Convert a recurring revenue amount to its monthly equivalent (MRR). */
function toMonthlyEquivalent(amount: number, type?: ProjectRevenueType): number {
  if (!type || type === 'one-time') return 0
  if (type === 'monthly') return amount
  if (type === 'quarterly') return amount / 3
  if (type === 'annual') return amount / 12
  return 0
}

// ── Main Page ──

export default function ProjectsPage() {
  const app = useApp()
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [creatorOpen, setCreatorOpen] = useState(false)
  const [effectiveStatuses, setEffectiveStatuses] = useState(PROJECT_STATUSES as { value: string; label: string; color: string }[])

  useEffect(() => {
    setEffectiveStatuses(store.getEffectiveProjectStatuses())
  }, [app.projects])

  const selectedProject = app.projects.find((p) => p.id === selectedProjectId) ?? null

  const handleDrop = (projectId: string, newStatus: ProjectStatus) => {
    app.updateProject(projectId, { status: newStatus })
  }

  const handleSelectProject = (project: Project) => {
    setSelectedProjectId(project.id)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-border shrink-0">
        <h1 className="text-lg font-semibold">Projets</h1>
        <Button size="sm" onClick={() => setCreatorOpen(true)}>+ Projet</Button>
      </div>

      {/* Body: Kanban + Detail */}
      <div className="flex flex-1 min-h-0 flex-col md:flex-row">
        {/* Left: Kanban columns */}
        <div className={cn(
          "shrink-0 overflow-x-auto border-b md:border-b-0 md:border-r border-border transition-all",
          selectedProject ? "md:w-[340px]" : "flex-1"
        )}>
          <div className="flex md:h-full min-w-max">
            {effectiveStatuses.map((status) => {
              const projects = app.projects.filter((p) => p.status === status.value)
              return (
                <div
                  key={status.value}
                  className={cn(
                    "border-r border-border last:border-r-0",
                    selectedProject ? "w-[170px]" : "w-[240px] md:flex-1 md:min-w-[260px]"
                  )}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    const projectId = e.dataTransfer.getData('projectId')
                    if (projectId) handleDrop(projectId, status.value)
                  }}
                >
                  <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border bg-muted/30">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: status.color }} />
                    <span className="text-xs font-medium truncate">{status.label}</span>
                    <span className="ml-auto text-[10px] text-muted-foreground">{projects.length}</span>
                  </div>
                  <div className="p-2 space-y-1.5 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 130px)' }}>
                    {projects.map((project) => (
                      <div
                        key={project.id}
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData('projectId', project.id)}
                        className={cn(
                          "rounded-lg border bg-background p-2.5 cursor-grab active:cursor-grabbing hover:shadow-sm transition-all group relative",
                          selectedProjectId === project.id
                            ? "border-primary ring-1 ring-primary/30"
                            : "border-border"
                        )}
                        style={project.color ? {
                          borderLeftColor: project.color,
                          borderLeftWidth: '3px',
                        } : undefined}
                        onClick={() => handleSelectProject(project)}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <h3 className="text-xs font-medium leading-tight line-clamp-2">{project.name}</h3>
                          <button
                            className="text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] shrink-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (selectedProjectId === project.id) setSelectedProjectId(null)
                              app.deleteProject(project.id)
                            }}
                          >
                            ×
                          </button>
                        </div>
                        {!selectedProject && project.description && (
                          <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{project.description}</p>
                        )}
                        {project.tags.length > 0 && (
                          <div className="flex flex-wrap gap-0.5 mt-1.5">
                            {project.tags.slice(0, selectedProject ? 2 : 4).map((tag) => (
                              <span key={tag} className="rounded-full bg-muted px-1.5 py-0.5 text-[9px]">{tag}</span>
                            ))}
                          </div>
                        )}
                        <div className="text-[9px] text-muted-foreground mt-1.5">
                          {formatRelative(project.updatedAt)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right: Detail Panel */}
        {selectedProject && (
          <div className="flex-1 min-w-0 flex flex-col">
            <ProjectDetail
              project={selectedProject}
              onClose={() => setSelectedProjectId(null)}
            />
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <ProjectCreator
        open={creatorOpen}
        onClose={() => setCreatorOpen(false)}
      />
    </div>
  )
}

// ── Project Detail Panel ──

function ProjectDetail({ project, onClose }: { project: Project; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<string | number>(0)

  return (
    <div className="flex flex-col h-full">
      {/* Detail header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
        <div className="text-sm font-medium truncate">{project.name}</div>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors text-lg leading-none px-1"
        >
          ×
        </button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <div className="px-5 pt-3 shrink-0">
          <TabsList variant="line">
            <TabsTrigger value={0}>Vue d&apos;ensemble</TabsTrigger>
            <TabsTrigger value={1}>Notes</TabsTrigger>
            <TabsTrigger value={2}>Liens</TabsTrigger>
            <TabsTrigger value={3}>Stats</TabsTrigger>
            <TabsTrigger value={4}>Revenus</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value={0} className="flex-1 overflow-y-auto">
          <OverviewTab project={project} />
        </TabsContent>
        <TabsContent value={1} className="flex-1 min-h-0 overflow-hidden">
          <NotesTab project={project} />
        </TabsContent>
        <TabsContent value={2} className="flex-1 overflow-y-auto">
          <LinksTab project={project} />
        </TabsContent>
        <TabsContent value={3} className="flex-1 overflow-y-auto">
          <StatsTab project={project} />
        </TabsContent>
        <TabsContent value={4} className="flex-1 overflow-y-auto">
          <RevenueTab project={project} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ── Tab 1: Overview ──

function OverviewTab({ project }: { project: Project }) {
  const app = useApp()
  const stats = store.getProjectStats(project.id)
  const effectiveStatuses = store.getEffectiveProjectStatuses()

  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState(project.name)
  const [descValue, setDescValue] = useState(project.description)
  const [revenueValue, setRevenueValue] = useState(String(project.revenue || 0))
  const [tagInput, setTagInput] = useState('')
  const [collabInput, setCollabInput] = useState('')

  // Sync local state when project changes
  useEffect(() => {
    setNameValue(project.name)
    setDescValue(project.description)
    setRevenueValue(String(project.revenue || 0))
    setEditingName(false)
  }, [project.id, project.name, project.description, project.revenue])

  const saveName = () => {
    if (nameValue.trim() && nameValue.trim() !== project.name) {
      app.updateProject(project.id, { name: nameValue.trim() })
    }
    setEditingName(false)
  }

  const saveDescription = () => {
    if (descValue !== project.description) {
      app.updateProject(project.id, { description: descValue })
    }
  }

  const saveRevenue = () => {
    const num = parseFloat(revenueValue) || 0
    if (num !== (project.revenue || 0)) {
      app.updateProject(project.id, { revenue: num })
    }
  }

  const addTag = () => {
    const t = tagInput.trim()
    if (t && !project.tags.includes(t)) {
      app.updateProject(project.id, { tags: [...project.tags, t] })
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    app.updateProject(project.id, { tags: project.tags.filter((t) => t !== tag) })
  }

  const addCollaborator = () => {
    const c = collabInput.trim()
    const collaborators = project.collaborators || []
    if (c && !collaborators.includes(c)) {
      app.updateProject(project.id, { collaborators: [...collaborators, c] })
      setCollabInput('')
    }
  }

  const removeCollaborator = (name: string) => {
    const collaborators = project.collaborators || []
    app.updateProject(project.id, { collaborators: collaborators.filter((c) => c !== name) })
  }

  return (
    <div className="p-5 space-y-5">
      {/* Project Name */}
      <div>
        {editingName ? (
          <Input
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            onBlur={saveName}
            onKeyDown={(e) => e.key === 'Enter' && saveName()}
            className="text-lg font-semibold"
            autoFocus
          />
        ) : (
          <h2
            className="text-lg font-semibold cursor-pointer hover:text-primary transition-colors"
            onClick={() => setEditingName(true)}
          >
            {project.name}
          </h2>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="text-xs font-medium text-muted-foreground">Description</label>
        <Textarea
          value={descValue}
          onChange={(e) => setDescValue(e.target.value)}
          onBlur={saveDescription}
          placeholder="Ajouter une description..."
          rows={3}
          className="mt-1"
        />
      </div>

      {/* Status */}
      <div>
        <label className="text-xs font-medium text-muted-foreground">Statut</label>
        <div className="flex flex-wrap gap-1 mt-1">
          {effectiveStatuses.map((s) => (
            <button
              key={s.value}
              className={cn(
                "rounded-md px-2.5 py-1.5 text-xs transition-colors",
                project.status === s.value ? 'text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
              style={project.status === s.value ? { backgroundColor: s.color } : undefined}
              onClick={() => app.updateProject(project.id, { status: s.value })}
            >
              {s.label}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5">Pour ajouter un statut custom, va dans Paramètres → Général</p>
      </div>

      {/* Project color */}
      <div>
        <label className="text-xs font-medium text-muted-foreground">Couleur du projet</label>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {[
            '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16', '#22C55E',
            '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
            '#8B5CF6', '#A855F7', '#D946EF', '#EC4899', '#F43F5E', '#6B7280',
          ].map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => app.updateProject(project.id, { color })}
              className={cn(
                'h-6 w-6 rounded-full border-2 transition-all',
                project.color === color ? 'border-foreground scale-110' : 'border-transparent hover:border-border'
              )}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
          {project.color && (
            <button
              type="button"
              onClick={() => app.updateProject(project.id, { color: undefined })}
              className="text-[10px] text-muted-foreground hover:text-destructive ml-1"
              title="Retirer la couleur"
            >
              Retirer
            </button>
          )}
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="text-xs font-medium text-muted-foreground">Tags</label>
        <div className="flex gap-2 mt-1">
          <Input
            placeholder="Ajouter un tag"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            className="text-sm"
          />
          <Button variant="outline" size="sm" onClick={addTag}>+</Button>
        </div>
        {project.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {project.tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs cursor-pointer hover:bg-muted/80"
                onClick={() => removeTag(t)}
              >
                {t} ×
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div>
        <label className="text-xs font-medium text-muted-foreground">Statistiques</label>
        <div className="grid grid-cols-3 gap-2 mt-2">
          <StatCard label="Temps passe" value={formatTime(stats?.totalTime ?? 0)} />
          <StatCard label="Taches" value={`${stats?.tasksDone ?? 0}/${stats?.tasksCount ?? 0}`} />
          <StatCard label="Contacts lies" value={String(stats?.contactsCount ?? 0)} />
          <StatCard label="Posts marketing" value={String(stats?.postsCount ?? 0)} />
          <div className="rounded-lg border border-border bg-muted/20 p-3 col-span-2">
            <div className="text-[10px] text-muted-foreground mb-1">Revenu</div>
            <div className="flex items-center gap-2">
              <Input
                value={revenueValue}
                onChange={(e) => setRevenueValue(e.target.value)}
                onBlur={saveRevenue}
                onKeyDown={(e) => e.key === 'Enter' && saveRevenue()}
                className="h-7 text-sm font-semibold px-1 flex-1"
                type="number"
                step="0.01"
              />
              <select
                value={project.revenueType || 'one-time'}
                onChange={(e) => app.updateProject(project.id, { revenueType: e.target.value as ProjectRevenueType })}
                className="h-7 rounded-md border border-input bg-transparent px-2 text-xs outline-none"
              >
                <option value="one-time">Ponctuel</option>
                <option value="monthly">/mois (MRR)</option>
                <option value="quarterly">/trimestre</option>
                <option value="annual">/an (ARR)</option>
              </select>
            </div>
            {project.revenueType && project.revenueType !== 'one-time' && (
              <div className="text-[10px] text-muted-foreground mt-1">
                MRR équivalent : <strong>{toMonthlyEquivalent(project.revenue || 0, project.revenueType).toFixed(2)} €</strong>
                · ARR : <strong>{(toMonthlyEquivalent(project.revenue || 0, project.revenueType) * 12).toFixed(0)} €</strong>
              </div>
            )}
          </div>
          <StatCard label="Ad Spend" value={`${(stats?.totalSpend ?? 0).toFixed(2)} EUR`} />
        </div>
      </div>

      {/* Collaborators */}
      <div>
        <label className="text-xs font-medium text-muted-foreground">Collaborateurs</label>
        <div className="flex gap-2 mt-1">
          <Input
            placeholder="Nom du collaborateur"
            value={collabInput}
            onChange={(e) => setCollabInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCollaborator())}
            className="text-sm"
          />
          <Button variant="outline" size="sm" onClick={addCollaborator}>+</Button>
        </div>
        {(project.collaborators || []).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {(project.collaborators || []).map((c) => (
              <span
                key={c}
                className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs cursor-pointer hover:bg-primary/20"
                onClick={() => removeCollaborator(c)}
              >
                {c} ×
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold mt-1">{value}</div>
    </div>
  )
}

// ── Tab 2: Notes ──

function NotesTab({ project }: { project: Project }) {
  const app = useApp()
  const notes = app.getProjectNotes(project.id)
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)

  const selectedNote = notes.find((n) => n.id === selectedNoteId) ?? null

  // Auto-select first note if available and none selected
  useEffect(() => {
    if (!selectedNote && notes.length > 0) {
      setSelectedNoteId(notes[0].id)
    }
  }, [notes, selectedNote])

  const createNote = (parentId: string | null = null) => {
    const siblings = notes.filter((n) => n.parentId === parentId)
    const note = app.createProjectNote({
      projectId: project.id,
      parentId,
      title: 'Sans titre',
      content: '',
      order: siblings.length,
    })
    setSelectedNoteId(note.id)
  }

  const deleteNote = (noteId: string) => {
    // Also delete children
    const children = notes.filter((n) => n.parentId === noteId)
    children.forEach((c) => app.deleteProjectNote(c.id))
    app.deleteProjectNote(noteId)
    if (selectedNoteId === noteId) {
      setSelectedNoteId(null)
    }
  }

  // Build a tree: top-level notes (parentId === null), then children indented
  const topLevelNotes = notes.filter((n) => n.parentId === null).sort((a, b) => a.order - b.order)

  const renderNoteItem = (note: ProjectNote, depth: number) => {
    const children = notes
      .filter((n) => n.parentId === note.id)
      .sort((a, b) => a.order - b.order)

    return (
      <div key={note.id}>
        <div
          className={cn(
            "flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer text-xs transition-colors group/note",
            selectedNoteId === note.id
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
          style={{ paddingLeft: `${8 + depth * 16}px` }}
          onClick={() => setSelectedNoteId(note.id)}
        >
          <span className="truncate flex-1">{note.title || 'Sans titre'}</span>
          <button
            className="opacity-0 group-hover/note:opacity-100 text-muted-foreground hover:text-primary text-[10px] shrink-0"
            onClick={(e) => { e.stopPropagation(); createNote(note.id) }}
            title="Ajouter sous-page"
          >
            +
          </button>
          <button
            className="opacity-0 group-hover/note:opacity-100 text-muted-foreground hover:text-red-500 text-[10px] shrink-0"
            onClick={(e) => { e.stopPropagation(); deleteNote(note.id) }}
            title="Supprimer"
          >
            ×
          </button>
        </div>
        {children.map((child) => renderNoteItem(child, depth + 1))}
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0">
      {/* Left: Note list sidebar */}
      <div className="w-[200px] shrink-0 border-r border-border flex flex-col">
        <div className="p-2 border-b border-border">
          <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => createNote(null)}>
            + Nouvelle page
          </Button>
        </div>
        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="p-1.5 space-y-0.5">
            {topLevelNotes.map((note) => renderNoteItem(note, 0))}
            {notes.length === 0 && (
              <div className="text-xs text-muted-foreground text-center py-4">Aucune note</div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Right: Note editor */}
      <div className="flex-1 min-w-0">
        {selectedNote ? (
          <NoteEditor key={selectedNote.id} note={selectedNote} />
        ) : (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
            Selectionnez ou creez une note
          </div>
        )}
      </div>
    </div>
  )
}

function NoteEditor({ note }: { note: ProjectNote }) {
  const app = useApp()
  const [title, setTitle] = useState(note.title)
  const [content, setContent] = useState(note.content)

  useEffect(() => {
    setTitle(note.title)
    setContent(note.content)
  }, [note.id, note.title, note.content])

  const saveTitle = () => {
    if (title !== note.title) {
      app.updateProjectNote(note.id, { title })
    }
  }

  const saveContent = () => {
    if (content !== note.content) {
      app.updateProjectNote(note.id, { content })
    }
  }

  return (
    <div className="flex flex-col h-full p-4">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={saveTitle}
        onKeyDown={(e) => e.key === 'Enter' && saveTitle()}
        placeholder="Titre de la note"
        className="text-base font-semibold border-none shadow-none px-0 focus-visible:ring-0 mb-3"
      />
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onBlur={saveContent}
        placeholder="Écris ici..."
        className="flex-1 resize-none border-none shadow-none px-0 focus-visible:ring-0 text-sm leading-relaxed py-3 whitespace-pre-wrap font-normal"
        style={{ lineHeight: '1.7', letterSpacing: '0.01em' }}
      />
    </div>
  )
}

// ── Tab 3: Links ──

function LinksTab({ project }: { project: Project }) {
  const app = useApp()

  return (
    <div className="p-5 space-y-6">
      {/* Linked Tasks */}
      <LinkSection
        title="Taches liees"
        buttonLabel="Lier une tache"
        linkedIds={project.linkedTaskIds || []}
        allItems={app.tasks.map((t) => ({ id: t.id, label: t.title, sublabel: t.status }))}
        onLink={(taskId) => {
          const ids = project.linkedTaskIds || []
          if (!ids.includes(taskId)) {
            app.updateProject(project.id, { linkedTaskIds: [...ids, taskId] })
          }
        }}
        onUnlink={(taskId) => {
          app.updateProject(project.id, {
            linkedTaskIds: (project.linkedTaskIds || []).filter((id) => id !== taskId),
          })
        }}
        renderItem={(item) => {
          const task = app.tasks.find((t) => t.id === item.id)
          if (!task) return null
          const statusColors: Record<string, string> = {
            planned: '#6B7280',
            in_progress: '#F59E0B',
            done: '#10B981',
          }
          return (
            <div className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: statusColors[task.status] || '#6B7280' }}
              />
              <span className="text-sm truncate">{task.title}</span>
              <span className="ml-auto text-[10px] text-muted-foreground capitalize">{task.status.replace('_', ' ')}</span>
            </div>
          )
        }}
      />

      {/* Linked Contacts */}
      <LinkSection
        title="Contacts lies"
        buttonLabel="Lier un contact"
        linkedIds={project.linkedContactIds || []}
        allItems={app.contacts.map((c) => ({
          id: c.id,
          label: `${c.firstName} ${c.lastName}`.trim(),
          sublabel: c.status,
        }))}
        onLink={(contactId) => {
          const ids = project.linkedContactIds || []
          if (!ids.includes(contactId)) {
            app.updateProject(project.id, { linkedContactIds: [...ids, contactId] })
          }
        }}
        onUnlink={(contactId) => {
          app.updateProject(project.id, {
            linkedContactIds: (project.linkedContactIds || []).filter((id) => id !== contactId),
          })
        }}
        renderItem={(item) => {
          const contact = app.contacts.find((c) => c.id === item.id)
          if (!contact) return null
          const statusDef = CONTACT_STATUSES.find((s) => s.value === contact.status)
          return (
            <div className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: statusDef?.color || '#6B7280' }}
              />
              <span className="text-sm truncate">{contact.firstName} {contact.lastName}</span>
              <span className="ml-auto text-[10px] text-muted-foreground">{statusDef?.label || contact.status}</span>
            </div>
          )
        }}
      />

      {/* Linked Posts */}
      <LinkSection
        title="Posts lies"
        buttonLabel="Lier un post"
        linkedIds={project.linkedPostIds || []}
        allItems={app.posts.map((p) => ({
          id: p.id,
          label: p.title || `${p.platform} post`,
          sublabel: p.platform,
        }))}
        onLink={(postId) => {
          const ids = project.linkedPostIds || []
          if (!ids.includes(postId)) {
            app.updateProject(project.id, { linkedPostIds: [...ids, postId] })
          }
        }}
        onUnlink={(postId) => {
          app.updateProject(project.id, {
            linkedPostIds: (project.linkedPostIds || []).filter((id) => id !== postId),
          })
        }}
        renderItem={(item) => {
          const post = app.posts.find((p) => p.id === item.id)
          if (!post) return null
          const platformDef = PLATFORMS.find((pl) => pl.value === post.platform)
          return (
            <div className="flex items-center gap-2">
              <span
                className="rounded px-1.5 py-0.5 text-[10px] font-medium text-white shrink-0"
                style={{ backgroundColor: platformDef?.color || '#6B7280' }}
              >
                {platformDef?.label || post.platform}
              </span>
              <span className="text-sm truncate">{post.title || 'Sans titre'}</span>
            </div>
          )
        }}
      />

      {/* Linked Todos (auto-derived via TodoItem.projectId) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Todos liés</h3>
          <span className="text-[10px] text-muted-foreground">
            Ajouter via la page To-Do en sélectionnant ce projet
          </span>
        </div>
        {(() => {
          const linkedTodos = app.todos.filter((t) => t.projectId === project.id)
          if (linkedTodos.length === 0) {
            return <p className="text-xs text-muted-foreground italic">Aucun todo lié à ce projet.</p>
          }
          return (
            <div className="space-y-1">
              {linkedTodos.map((todo) => {
                const prio = TODO_PRIORITIES.find((p) => p.value === todo.priority)
                return (
                  <div key={todo.id} className="flex items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1.5">
                    <button
                      onClick={() => app.updateTodo(todo.id, { done: !todo.done })}
                      className={cn(
                        'h-4 w-4 rounded border shrink-0 flex items-center justify-center',
                        todo.done ? 'bg-primary border-primary' : 'border-muted-foreground/40 hover:border-primary'
                      )}
                    >
                      {todo.done && (
                        <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1.5 4.5l2 2 4-4.5" />
                        </svg>
                      )}
                    </button>
                    <span className={cn('text-xs truncate flex-1', todo.done && 'line-through text-muted-foreground')}>{todo.title}</span>
                    <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: prio?.color }} />
                    {todo.date && <span className="text-[10px] text-muted-foreground shrink-0">{todo.date.slice(5)}</span>}
                    <button
                      onClick={() => app.updateTodo(todo.id, { projectId: undefined })}
                      className="text-muted-foreground hover:text-destructive text-xs shrink-0"
                      title="Retirer du projet"
                    >×</button>
                  </div>
                )
              })}
            </div>
          )
        })()}
      </div>
    </div>
  )
}

type LinkItem = { id: string; label: string; sublabel: string }

function LinkSection({
  title,
  buttonLabel,
  linkedIds,
  allItems,
  onLink,
  onUnlink,
  renderItem,
}: {
  title: string
  buttonLabel: string
  linkedIds: string[]
  allItems: LinkItem[]
  onLink: (id: string) => void
  onUnlink: (id: string) => void
  renderItem: (item: LinkItem) => React.ReactNode
}) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const linkedItems = allItems.filter((item) => linkedIds.includes(item.id))
  const availableItems = allItems.filter(
    (item) =>
      !linkedIds.includes(item.id) &&
      item.label.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium">{title}</h3>
        <Button
          variant="outline"
          size="sm"
          className="text-xs"
          onClick={() => { setPickerOpen(!pickerOpen); setSearchQuery('') }}
        >
          {pickerOpen ? 'Fermer' : buttonLabel}
        </Button>
      </div>

      {/* Picker dropdown */}
      {pickerOpen && (
        <div className="mb-3 rounded-lg border border-border bg-muted/20 p-2">
          <Input
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-xs mb-2"
            autoFocus
          />
          <div className="max-h-[160px] overflow-y-auto space-y-0.5">
            {availableItems.length === 0 ? (
              <div className="text-xs text-muted-foreground text-center py-2">Aucun element disponible</div>
            ) : (
              availableItems.map((item) => (
                <button
                  key={item.id}
                  className="w-full text-left rounded-md px-2 py-1.5 text-xs hover:bg-muted transition-colors"
                  onClick={() => { onLink(item.id); setPickerOpen(false) }}
                >
                  {item.label}
                  <span className="ml-2 text-muted-foreground capitalize">{item.sublabel.replace('_', ' ')}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Linked items list */}
      <div className="space-y-1">
        {linkedItems.length === 0 && !pickerOpen && (
          <div className="text-xs text-muted-foreground py-1">Aucun element lie</div>
        )}
        {linkedItems.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 group/link"
          >
            <div className="flex-1 min-w-0">
              {renderItem(item)}
            </div>
            <button
              className="text-muted-foreground hover:text-red-500 opacity-0 group-hover/link:opacity-100 transition-opacity text-xs shrink-0"
              onClick={() => onUnlink(item.id)}
              title="Dissocier"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Project Creator Dialog ──

function ProjectCreator({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { createProject } = useApp()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [status, setStatus] = useState<ProjectStatus>('idea')

  const resetForm = useCallback(() => {
    setName('')
    setDescription('')
    setTags([])
    setTagInput('')
    setStatus('idea')
  }, [])

  const handleSave = () => {
    if (!name.trim()) return
    createProject({
      name: name.trim(),
      description,
      tags,
      status,
      linkedTaskIds: [],
      linkedContactIds: [],
      linkedPostIds: [],
      revenue: 0,
      collaborators: [],
    })
    resetForm()
    onClose()
  }

  const addTag = () => {
    const t = tagInput.trim()
    if (t && !tags.includes(t)) {
      setTags([...tags, t])
      setTagInput('')
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (v) resetForm()
        if (!v) onClose()
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nouveau projet</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Nom du projet *" value={name} onChange={(e) => setName(e.target.value)} />
          <Textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          <div>
            <label className="text-xs font-medium text-muted-foreground">Statut</label>
            <div className="flex flex-wrap gap-1 mt-1">
              {store.getEffectiveProjectStatuses().map((s) => (
                <button
                  key={s.value}
                  className={cn(
                    "rounded-md px-2.5 py-1.5 text-xs transition-colors",
                    status === s.value ? 'text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  )}
                  style={status === s.value ? { backgroundColor: s.color } : undefined}
                  onClick={() => setStatus(s.value)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Tags</label>
            <div className="flex gap-2 mt-1">
              <Input
                placeholder="Ajouter un tag"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <Button variant="outline" size="sm" onClick={addTag}>+</Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs cursor-pointer"
                    onClick={() => setTags(tags.filter((x) => x !== t))}
                  >
                    {t} ×
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" size="sm" onClick={onClose}>Annuler</Button>
          <Button size="sm" onClick={handleSave}>Creer</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Stats Tab ──

function StatsTab({ project }: { project: Project }) {
  const stats = useMemo(() => store.getProjectStats(project.id), [project.id])
  const app = useApp()

  if (!stats) return <div className="p-5 text-sm text-muted-foreground">Aucune donnée</div>

  const formatT = (s: number) => {
    if (s < 60) return `${s}s`
    if (s < 3600) return `${Math.floor(s / 60)}min`
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    return m === 0 ? `${h}h` : `${h}h ${m}m`
  }

  const completionPct = stats.tasksCount > 0 ? Math.round((stats.tasksDone / stats.tasksCount) * 100) : 0
  const todoCompletionPct = stats.todosCount > 0 ? Math.round((stats.todosDone / stats.todosCount) * 100) : 0
  const avgPerDay = stats.daysWorked > 0 ? stats.totalTime / stats.daysWorked : 0
  const engagement = stats.totalLikes + stats.totalComments + stats.totalShares
  const ctr = stats.totalImpressions > 0 ? (stats.totalClicks / stats.totalImpressions) * 100 : 0
  const roi = stats.totalSpend > 0 ? ((stats.revenue - stats.totalSpend) / stats.totalSpend) * 100 : 0

  // Daily chart: last 30 days, fill missing days with 0
  const last30 = useMemo(() => {
    const days: { date: string; seconds: number }[] = []
    const map = new Map(stats.timeByDay)
    const today = new Date()
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      days.push({ date: key, seconds: map.get(key) || 0 })
    }
    return days
  }, [stats.timeByDay])

  const maxDailySec = Math.max(...last30.map((d) => d.seconds), 1)
  const maxCatSec = Math.max(...stats.timeByCategory.map((c) => c.seconds), 1)

  return (
    <div className="p-5 space-y-4">
      {/* Time KPIs */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Temps</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatKpi label="Total" value={formatT(stats.totalTime)} accent />
          <StatKpi label="Jours travaillés" value={stats.daysWorked} />
          <StatKpi label="Moyenne / jour" value={formatT(Math.round(avgPerDay))} />
          <StatKpi label="Sessions" value={(() => {
            const entries = app.timeEntries.filter((e) => {
              const t = app.tasks.find((tk) => tk.id === e.taskId)
              return t && (t.projectId === project.id || (project.linkedTaskIds || []).includes(t.id))
            })
            return entries.length
          })()} />
        </div>
      </div>

      {/* Time by category */}
      {stats.timeByCategory.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Temps par catégorie</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.timeByCategory.map(({ category, seconds }) => (
                <div key={category.id} className="flex items-center gap-2 text-xs">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: category.color }} />
                  <span className="w-24 truncate shrink-0">{category.name}</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(seconds / maxCatSec) * 100}%`, backgroundColor: category.color }} />
                  </div>
                  <span className="font-medium tabular-nums shrink-0 w-16 text-right">{formatT(seconds)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Daily evolution */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Évolution sur 30 jours</CardTitle></CardHeader>
        <CardContent>
          {stats.totalTime === 0 ? (
            <p className="text-xs text-muted-foreground italic py-4 text-center">Aucun temps enregistré sur ce projet</p>
          ) : (
            <div className="flex items-end gap-0.5 h-28">
              {last30.map((d, i) => {
                const isToday = i === 29
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1 min-w-0 group relative">
                    <div className="w-full relative flex-1 flex items-end">
                      <div
                        className={cn(
                          'w-full rounded-t transition-colors',
                          isToday ? 'bg-primary' : 'bg-primary/40 hover:bg-primary/60'
                        )}
                        style={{ height: `${(d.seconds / maxDailySec) * 100}%`, minHeight: d.seconds > 0 ? 2 : 0 }}
                      />
                    </div>
                    {(i % 5 === 0 || isToday) && (
                      <span className="text-[8px] text-muted-foreground truncate w-full text-center">{d.date.slice(5)}</span>
                    )}
                    {d.seconds > 0 && (
                      <span className="text-[9px] text-muted-foreground absolute opacity-0 group-hover:opacity-100 transition-opacity -translate-y-28 pointer-events-none bg-foreground text-background px-1.5 py-0.5 rounded whitespace-nowrap z-10">
                        {d.date.slice(5)} · {formatT(d.seconds)}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tasks & Todos */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Activité</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">Tâches calendrier</span>
                <span className="text-xs font-medium">{stats.tasksDone} / {stats.tasksCount}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden mb-3">
                <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${completionPct}%` }} />
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <div className="text-base font-bold tabular-nums">{stats.tasksPlanned}</div>
                  <div className="text-[10px] text-muted-foreground">Planifiées</div>
                </div>
                <div className="text-center">
                  <div className="text-base font-bold tabular-nums text-amber-600">{stats.tasksInProgress}</div>
                  <div className="text-[10px] text-muted-foreground">En cours</div>
                </div>
                <div className="text-center">
                  <div className="text-base font-bold tabular-nums text-green-600">{stats.tasksDone}</div>
                  <div className="text-[10px] text-muted-foreground">Terminées</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">To-Dos</span>
                <span className="text-xs font-medium">{stats.todosDone} / {stats.todosCount}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden mb-3">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${todoCompletionPct}%` }} />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                {stats.todosCount === 0 ? 'Aucun to-do lié' : `${todoCompletionPct}% de complétion`}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Contacts */}
      {stats.contactsCount > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Contacts liés ({stats.contactsCount})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.contactsByStatus).map(([status, count]) => {
                const def = CONTACT_STATUSES.find((s) => s.value === status)
                return (
                  <div key={status} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted text-xs">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: def?.color || '#6B7280' }} />
                    <span>{def?.label || status}</span>
                    <span className="font-bold tabular-nums">{count}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Marketing */}
      {stats.postsCount > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Marketing</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatKpi label="Posts" value={stats.postsCount} />
            <StatKpi label="Impressions" value={stats.totalImpressions.toLocaleString()} />
            <StatKpi label="Engagement" value={engagement.toLocaleString()} hint={`${stats.totalLikes} likes · ${stats.totalComments} commentaires · ${stats.totalShares} partages`} />
            <StatKpi label="CTR" value={`${ctr.toFixed(2)}%`} hint={`${stats.totalClicks} clics`} />
          </div>
        </div>
      )}

      {/* Money */}
      {(stats.revenue > 0 || stats.totalSpend > 0) && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Finance</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatKpi label="Revenu" value={`${stats.revenue}€`} accent />
            <StatKpi label="Dépenses ads" value={`${stats.totalSpend.toFixed(0)}€`} />
            <StatKpi label="Bénéfice" value={`${(stats.revenue - stats.totalSpend).toFixed(0)}€`} />
            <StatKpi label="ROI" value={stats.totalSpend > 0 ? `${roi.toFixed(0)}%` : '—'} />
          </div>
        </div>
      )}

      {/* Empty state */}
      {stats.totalTime === 0 && stats.tasksCount === 0 && stats.todosCount === 0 && stats.postsCount === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">Aucune activité enregistrée pour ce projet.</p>
          <p className="text-xs mt-1">Lie des tâches, todos ou posts à ce projet pour voir des stats.</p>
        </div>
      )}
    </div>
  )
}

function StatKpi({ label, value, accent, hint }: { label: string; value: number | string; accent?: boolean; hint?: string }) {
  return (
    <div className={cn('rounded-xl border p-3', accent ? 'border-primary/40 bg-primary/5' : 'border-border bg-background')}>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-xl font-bold tabular-nums mt-0.5">{typeof value === 'number' ? value.toLocaleString() : value}</p>
      {hint && <p className="text-[10px] text-muted-foreground mt-1">{hint}</p>}
    </div>
  )
}

// ── Revenue Tab ──

type StripeCharge = {
  id: string
  amount: number
  amountRefunded: number
  currency: string
  status: string
  description: string | null
  email: string | null
  createdAt: number
  metadata: Record<string, string>
  paid: boolean
  refunded: boolean
}

const STRIPE_LINK_KEY = 'bloom_stripe_charge_links'

function getChargeLinks(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(localStorage.getItem(STRIPE_LINK_KEY) || '{}') } catch { return {} }
}

function setChargeLink(chargeId: string, projectId: string | null) {
  const links = getChargeLinks()
  if (projectId) links[chargeId] = projectId
  else delete links[chargeId]
  localStorage.setItem(STRIPE_LINK_KEY, JSON.stringify(links))
}

function RevenueTab({ project }: { project: Project }) {
  const app = useApp()
  const [charges, setCharges] = useState<StripeCharge[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [links, setLinks] = useState<Record<string, string>>({})
  const [days, setDays] = useState(90)

  useEffect(() => {
    setLinks(getChargeLinks())
  }, [])

  const fetchStripe = useCallback(async () => {
    const stripeIntegration = store.getSettings().integrations.find((i) => i.provider === 'stripe')
    if (!stripeIntegration?.apiKey) {
      setError('Connecte Stripe dans Paramètres → Intégrations')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: stripeIntegration.apiKey, action: 'list_charges', daysBack: days }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      setCharges(data.charges || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }, [days])

  const linkedCharges = useMemo(() => charges.filter((c) => links[c.id] === project.id), [charges, links, project.id])
  const unlinkedCharges = useMemo(() => charges.filter((c) => !links[c.id]), [charges, links])

  const totalRevenue = useMemo(() => {
    return linkedCharges
      .filter((c) => c.paid && !c.refunded)
      .reduce((sum, c) => sum + (c.amount - c.amountRefunded), 0)
  }, [linkedCharges])

  const formatAmount = (cents: number, currency: string) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: currency.toUpperCase() }).format(cents / 100)
  }

  const handleLink = (chargeId: string) => {
    setChargeLink(chargeId, project.id)
    setLinks(getChargeLinks())
  }

  const handleUnlink = (chargeId: string) => {
    setChargeLink(chargeId, null)
    setLinks(getChargeLinks())
  }

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-sm font-semibold">Revenus Stripe</h3>
          <p className="text-xs text-muted-foreground">Lie des paiements à ce projet pour suivre les revenus</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value, 10))}
            className="h-7 rounded-md border border-input bg-transparent px-2 text-xs"
          >
            <option value={30}>30 jours</option>
            <option value={90}>90 jours</option>
            <option value={365}>1 an</option>
          </select>
          <Button size="sm" onClick={fetchStripe} disabled={loading}>
            {loading ? 'Chargement...' : 'Rafraîchir'}
          </Button>
        </div>
      </div>

      {error && <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</div>}

      {/* Total */}
      {linkedCharges.length > 0 && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Total revenus liés à ce projet</div>
          <div className="text-2xl font-bold tabular-nums mt-1">
            {linkedCharges.length > 0 ? formatAmount(totalRevenue, linkedCharges[0].currency) : '0 €'}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {linkedCharges.length} paiement{linkedCharges.length > 1 ? 's' : ''}
          </div>
          {totalRevenue > 0 && totalRevenue !== (project.revenue || 0) * 100 && (
            <button
              onClick={() => app.updateProject(project.id, { revenue: Math.round(totalRevenue / 100) })}
              className="text-[10px] text-primary hover:underline mt-2"
            >
              Synchroniser avec le revenu manuel ({formatAmount(totalRevenue, linkedCharges[0].currency)})
            </button>
          )}
        </div>
      )}

      {/* Linked charges */}
      {linkedCharges.length > 0 && (
        <div className="space-y-1">
          <h4 className="text-xs font-medium text-muted-foreground">Paiements liés</h4>
          {linkedCharges.map((c) => (
            <ChargeRow key={c.id} charge={c} formatAmount={formatAmount} action={
              <button onClick={() => handleUnlink(c.id)} className="text-xs text-muted-foreground hover:text-destructive">Délier</button>
            } />
          ))}
        </div>
      )}

      {/* Unlinked charges */}
      {unlinkedCharges.length > 0 && (
        <div className="space-y-1">
          <h4 className="text-xs font-medium text-muted-foreground">Paiements non liés ({unlinkedCharges.length})</h4>
          {unlinkedCharges.slice(0, 30).map((c) => (
            <ChargeRow key={c.id} charge={c} formatAmount={formatAmount} action={
              <button onClick={() => handleLink(c.id)} className="text-xs text-primary hover:underline">Lier à ce projet</button>
            } />
          ))}
          {unlinkedCharges.length > 30 && (
            <p className="text-[10px] text-muted-foreground italic">+{unlinkedCharges.length - 30} autres paiements</p>
          )}
        </div>
      )}

      {!loading && charges.length === 0 && !error && (
        <p className="text-xs text-muted-foreground italic">Clique sur Rafraîchir pour charger les paiements depuis Stripe.</p>
      )}
    </div>
  )
}

function ChargeRow({ charge, formatAmount, action }: {
  charge: StripeCharge
  formatAmount: (cents: number, currency: string) => string
  action: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-border bg-background px-3 py-2 text-xs">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn(
            'h-1.5 w-1.5 rounded-full',
            charge.refunded ? 'bg-orange-500' : charge.paid ? 'bg-green-500' : 'bg-red-500'
          )} />
          <span className="font-medium">{formatAmount(charge.amount, charge.currency)}</span>
          {charge.amountRefunded > 0 && (
            <span className="text-orange-600 text-[10px]">-{formatAmount(charge.amountRefunded, charge.currency)}</span>
          )}
        </div>
        <div className="text-muted-foreground truncate text-[10px] mt-0.5">
          {charge.description || charge.email || charge.id}
          <span className="ml-1">· {new Date(charge.createdAt).toLocaleDateString('fr-FR')}</span>
        </div>
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  )
}
