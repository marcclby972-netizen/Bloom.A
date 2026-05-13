'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useApp } from '@/lib/context'
import { store } from '@/lib/store'
import { PROJECT_STATUSES, CONTACT_STATUSES, PLATFORMS } from '@/lib/types'
import type { Project, ProjectStatus, ProjectNote } from '@/lib/types'
import { formatRelative } from '@/lib/date-utils'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'

// ── Helpers ──

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

// ── Main Page ──

export default function ProjectsPage() {
  const app = useApp()
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [creatorOpen, setCreatorOpen] = useState(false)

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
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <h1 className="text-lg font-semibold">Projets</h1>
        <Button size="sm" onClick={() => setCreatorOpen(true)}>+ Projet</Button>
      </div>

      {/* Body: Kanban + Detail */}
      <div className="flex flex-1 min-h-0">
        {/* Left: Kanban columns */}
        <div className={cn(
          "shrink-0 overflow-x-auto border-r border-border transition-all",
          selectedProject ? "w-[340px]" : "flex-1"
        )}>
          <div className="flex h-full min-w-max">
            {PROJECT_STATUSES.map((status) => {
              const projects = app.projects.filter((p) => p.status === status.value)
              return (
                <div
                  key={status.value}
                  className={cn(
                    "border-r border-border last:border-r-0",
                    selectedProject ? "w-[170px]" : "flex-1 min-w-[260px]"
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
                          "rounded-lg border bg-background p-2.5 cursor-grab active:cursor-grabbing hover:shadow-sm transition-all group",
                          selectedProjectId === project.id
                            ? "border-primary ring-1 ring-primary/30"
                            : "border-border"
                        )}
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
      </Tabs>
    </div>
  )
}

// ── Tab 1: Overview ──

function OverviewTab({ project }: { project: Project }) {
  const app = useApp()
  const stats = store.getProjectStats(project.id)

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
        <div className="flex gap-1 mt-1">
          {PROJECT_STATUSES.map((s) => (
            <button
              key={s.value}
              className={cn(
                "flex-1 rounded-md px-2 py-1.5 text-xs transition-colors",
                project.status === s.value ? 'text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
              style={project.status === s.value ? { backgroundColor: s.color } : undefined}
              onClick={() => app.updateProject(project.id, { status: s.value })}
            >
              {s.label}
            </button>
          ))}
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
          <div className="rounded-lg border border-border bg-muted/20 p-3">
            <div className="text-[10px] text-muted-foreground mb-1">Revenue</div>
            <Input
              value={revenueValue}
              onChange={(e) => setRevenueValue(e.target.value)}
              onBlur={saveRevenue}
              onKeyDown={(e) => e.key === 'Enter' && saveRevenue()}
              className="h-7 text-sm font-semibold px-1"
              type="number"
            />
            <div className="text-[10px] text-muted-foreground mt-0.5">EUR</div>
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
        placeholder="Ecrivez ici..."
        className="flex-1 resize-none border-none shadow-none px-0 focus-visible:ring-0 text-sm"
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
            <div className="flex gap-1 mt-1">
              {PROJECT_STATUSES.map((s) => (
                <button
                  key={s.value}
                  className={cn(
                    "flex-1 rounded-md px-2 py-1.5 text-xs transition-colors",
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
