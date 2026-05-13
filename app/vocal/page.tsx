'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { useApp } from '@/lib/context'
import { store } from '@/lib/store'
import { useSpeech } from '@/lib/use-speech'
import { formatRelative } from '@/lib/date-utils'
import type { VocalProject, VocalNote } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export default function VocalPage() {
  const app = useApp()
  const speech = useSpeech()
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [projectDialogOpen, setProjectDialogOpen] = useState(false)
  const [rewriting, setRewriting] = useState(false)
  const [editingProject, setEditingProject] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  const project = useMemo(() => {
    if (!selectedProject) return null
    return app.vocalProjects.find((p) => p.id === selectedProject) || null
  }, [selectedProject, app.vocalProjects])

  const vocalNotes = useMemo(() => {
    if (!selectedProject) return []
    return store.getVocalNotes(selectedProject)
  }, [selectedProject, app.vocalProjects])

  const promptNotes = useMemo(() => {
    if (!selectedProject) return []
    return store.getPromptNotes(selectedProject)
  }, [selectedProject, app.vocalProjects])

  const latestPrompt = promptNotes[0]

  // Auto-transcribe: save automatically when speech stops
  const prevListeningRef = useRef(false)
  useEffect(() => {
    const wasListening = prevListeningRef.current
    prevListeningRef.current = speech.isListening
    if (wasListening && !speech.isListening && speech.transcript.trim()) {
      const settings = store.getSettings()
      if (settings.voice.autoTranscribe && selectedProject) {
        app.createVocalNote({ projectId: selectedProject, transcript: speech.transcript.trim() })
        speech.reset()
      }
    }
  }, [speech.isListening, speech.transcript, selectedProject, app, speech])

  const handleSaveVocal = async () => {
    if (!selectedProject || !speech.transcript.trim()) return
    app.createVocalNote({ projectId: selectedProject, transcript: speech.transcript.trim() })
    speech.reset()
  }

  const handleDeleteProject = () => {
    if (!selectedProject) return
    app.deleteVocalProject(selectedProject)
    setSelectedProject(null)
    setDeleteConfirm(false)
  }

  const handleGeneratePrompt = async () => {
    if (!selectedProject) return
    setRewriting(true)

    const notes = store.getVocalNotes(selectedProject)
    const latest = store.getLatestPrompt(selectedProject)

    let vocalIds: string[]
    let transcripts: string[]

    if (latest && !latest.used) {
      const newNotes = notes.filter((n) => !latest.vocalNoteIds.includes(n.id))
      if (newNotes.length === 0) { setRewriting(false); return }
      vocalIds = [...latest.vocalNoteIds, ...newNotes.map((n) => n.id)]
      transcripts = notes.filter((n) => vocalIds.includes(n.id)).map((n) => n.transcript)
    } else {
      const usedIds = latest ? latest.vocalNoteIds : []
      const newNotes = latest?.used ? notes.filter((n) => !usedIds.includes(n.id)) : notes
      if (newNotes.length === 0) { setRewriting(false); return }
      vocalIds = newNotes.map((n) => n.id)
      transcripts = newNotes.map((n) => n.transcript)
    }

    try {
      const currentSettings = store.getSettings()
      const anthropicIntegration = currentSettings.integrations.find((i) => i.provider === 'anthropic')
      const openaiIntegration = currentSettings.integrations.find((i) => i.provider === 'openai')
      const googleIntegration = currentSettings.integrations.find((i) => i.provider === 'google')

      const res = await fetch('/api/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcripts,
          projectName: project?.name,
          previousPrompt: latest && !latest.used ? latest.content : undefined,
          settings: {
            model: currentSettings.ai.model,
            apiKey: anthropicIntegration?.apiKey,
            openaiApiKey: openaiIntegration?.apiKey,
            googleApiKey: googleIntegration?.apiKey,
          },
        }),
      })
      const data = await res.json()

      if (latest && !latest.used) {
        app.updatePromptNote(latest.id, { content: data.prompt, vocalNoteIds: vocalIds })
      } else {
        app.createPromptNote({ projectId: selectedProject, vocalNoteIds: vocalIds, content: data.prompt, used: false })
      }
    } catch {
      const fallback = transcripts.join('\n\n')
      if (latest && !latest.used) {
        app.updatePromptNote(latest.id, { content: fallback, vocalNoteIds: vocalIds })
      } else {
        app.createPromptNote({ projectId: selectedProject, vocalNoteIds: vocalIds, content: fallback, used: false })
      }
    }

    setRewriting(false)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <h1 className="text-lg font-semibold">Voice-to-Prompt</h1>
        <Button size="sm" onClick={() => setProjectDialogOpen(true)}>+ Projet</Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Project list */}
        <div className="w-64 border-r border-border overflow-y-auto">
          <div className="p-2 space-y-1">
            {app.vocalProjects.length === 0 ? (
              <div className="text-xs text-muted-foreground text-center py-8">
                Créez un projet pour commencer
              </div>
            ) : (
              app.vocalProjects.map((proj) => (
                <button
                  key={proj.id}
                  className={`w-full text-left rounded-md px-3 py-2 text-sm transition-colors ${
                    selectedProject === proj.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                  }`}
                  onClick={() => { setSelectedProject(proj.id); setEditingProject(false); setDeleteConfirm(false) }}
                >
                  <div className="font-medium">{proj.name}</div>
                  {proj.keywords.length > 0 && (
                    <div className="text-[10px] opacity-70 mt-0.5 truncate">
                      {proj.keywords.join(', ')}
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Main area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!project ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Sélectionnez ou créez un projet
            </div>
          ) : (
            <>
              {/* Project header with edit/delete */}
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  {editingProject ? (
                    <ProjectEditor
                      project={project}
                      onSave={(data) => {
                        app.updateVocalProject(project.id, data)
                        setEditingProject(false)
                      }}
                      onCancel={() => setEditingProject(false)}
                    />
                  ) : (
                    <div>
                      <h2 className="text-base font-semibold">{project.name}</h2>
                      {project.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{project.description}</p>
                      )}
                      {project.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {project.keywords.map((kw) => (
                            <span key={kw} className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full">{kw}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {!editingProject && (
                  <div className="flex items-center gap-1 shrink-0 ml-4">
                    <Button size="xs" variant="ghost" onClick={() => setEditingProject(true)}>
                      <EditIcon />
                    </Button>
                    {!deleteConfirm ? (
                      <Button size="xs" variant="ghost" onClick={() => setDeleteConfirm(true)}>
                        <TrashIcon />
                      </Button>
                    ) : (
                      <div className="flex items-center gap-1">
                        <Button size="xs" variant="destructive" onClick={handleDeleteProject}>
                          Supprimer
                        </Button>
                        <Button size="xs" variant="ghost" onClick={() => setDeleteConfirm(false)}>
                          Annuler
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Recorder */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Enregistrer un vocal</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    {!speech.isListening ? (
                      <Button onClick={speech.start} size="sm" variant="outline" className="gap-2">
                        <span className="h-3 w-3 rounded-full bg-red-500" />
                        Enregistrer
                      </Button>
                    ) : (
                      <Button onClick={speech.stop} size="sm" variant="default" className="gap-2">
                        <span className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
                        Arrêter
                      </Button>
                    )}
                    {speech.transcript && (
                      <>
                        <Button onClick={handleSaveVocal} size="sm">Sauvegarder</Button>
                        <Button onClick={speech.reset} size="sm" variant="ghost">Annuler</Button>
                      </>
                    )}
                  </div>

                  {speech.error && <div className="text-xs text-red-500">{speech.error}</div>}

                  {speech.transcript && (
                    <div className="rounded-md border border-border p-3 text-sm bg-muted/30">
                      {speech.transcript}
                    </div>
                  )}

                  {speech.isListening && !speech.transcript && (
                    <div className="text-xs text-muted-foreground animate-pulse">En écoute...</div>
                  )}
                </CardContent>
              </Card>

              {/* Generate prompt */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Prompt cumulé</CardTitle>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleGeneratePrompt}
                        disabled={rewriting || vocalNotes.length === 0}
                      >
                        {rewriting ? 'Génération...' : 'Générer / Mettre à jour'}
                      </Button>
                      {latestPrompt && !latestPrompt.used && (
                        <Button size="sm" onClick={() => app.markPromptUsed(latestPrompt.id)}>
                          Marquer utilisé
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {latestPrompt ? (
                    <div className="space-y-2">
                      <div className={`rounded-md border p-4 text-sm whitespace-pre-wrap ${
                        latestPrompt.used ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950' : 'border-border bg-background'
                      }`}>
                        {latestPrompt.content}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{latestPrompt.vocalNoteIds.length} vocaux combinés</span>
                        <span>·</span>
                        <span>MAJ {formatRelative(latestPrompt.updatedAt)}</span>
                        {latestPrompt.used && (
                          <>
                            <span>·</span>
                            <span className="text-green-600 font-medium">Utilisé</span>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground">
                      Enregistrez des vocaux puis cliquez sur &quot;Générer&quot; pour créer un prompt
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Prompt history */}
              {promptNotes.length > 1 && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Historique des prompts</h3>
                  <div className="space-y-2">
                    {promptNotes.slice(1).map((pn) => (
                      <div key={pn.id} className="rounded-md border border-border p-3 text-xs">
                        <div className="line-clamp-2 text-muted-foreground">{pn.content}</div>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                          <span>{pn.vocalNoteIds.length} vocaux</span>
                          <span>·</span>
                          <span>{formatRelative(pn.createdAt)}</span>
                          {pn.used && <span className="text-green-600">· Utilisé</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Vocal notes list */}
              <div>
                <h3 className="text-sm font-medium mb-2">Vocaux ({vocalNotes.length})</h3>
                {vocalNotes.length === 0 ? (
                  <div className="text-xs text-muted-foreground text-center py-4">Aucun vocal enregistré</div>
                ) : (
                  <div className="space-y-2">
                    {vocalNotes.map((note) => (
                      <NoteCard
                        key={note.id}
                        note={note}
                        projects={app.projects}
                        contacts={app.contacts}
                        onUpdate={(data) => app.updateVocalNote(note.id, data)}
                        onDelete={() => app.deleteVocalNote(note.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <ProjectDialog open={projectDialogOpen} onClose={() => setProjectDialogOpen(false)} />
    </div>
  )
}

// ── Project inline editor ──

function ProjectEditor({ project, onSave, onCancel }: {
  project: VocalProject
  onSave: (data: Partial<VocalProject>) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(project.name)
  const [description, setDescription] = useState(project.description)
  const [keywords, setKeywords] = useState<string[]>(project.keywords)
  const [kwInput, setKwInput] = useState('')

  const addKw = () => {
    const kw = kwInput.trim()
    if (kw && !keywords.includes(kw)) {
      setKeywords([...keywords, kw])
      setKwInput('')
    }
  }

  return (
    <div className="space-y-2">
      <Input value={name} onChange={(e) => setName(e.target.value)} className="text-sm h-8" placeholder="Nom du projet" />
      <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="text-xs" rows={2} placeholder="Description" />
      <div className="flex gap-2">
        <Input
          value={kwInput}
          onChange={(e) => setKwInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addKw() } }}
          placeholder="Ajouter un mot-clé"
          className="text-xs h-7 flex-1"
        />
        <Button size="xs" variant="outline" onClick={addKw}>+</Button>
      </div>
      {keywords.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {keywords.map((kw) => (
            <span
              key={kw}
              className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] cursor-pointer hover:bg-muted/80"
              onClick={() => setKeywords(keywords.filter((k) => k !== kw))}
            >
              {kw} ×
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2 pt-1">
        <Button size="sm" onClick={() => onSave({ name: name.trim() || project.name, description, keywords })} disabled={!name.trim()}>
          Enregistrer
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>Annuler</Button>
      </div>
    </div>
  )
}

// ── Note card with edit/link ──

function NoteCard({ note, projects, contacts, onUpdate, onDelete }: {
  note: VocalNote
  projects: { id: string; name: string }[]
  contacts: { id: string; firstName: string; lastName: string }[]
  onUpdate: (data: Partial<VocalNote>) => void
  onDelete: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [transcript, setTranscript] = useState(note.transcript)
  const [linking, setLinking] = useState(false)

  const linkedProject = note.linkedProjectId ? projects.find((p) => p.id === note.linkedProjectId) : null
  const linkedContact = note.linkedContactId ? contacts.find((c) => c.id === note.linkedContactId) : null

  const handleSave = () => {
    if (!transcript.trim()) return
    onUpdate({ transcript: transcript.trim() })
    setEditing(false)
  }

  return (
    <div className="rounded-md border border-border p-3 group">
      {editing ? (
        <div className="space-y-2">
          <Textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            className="text-sm"
            rows={3}
            autoFocus
          />
          <div className="flex gap-2">
            <Button size="xs" onClick={handleSave}>OK</Button>
            <Button size="xs" variant="ghost" onClick={() => { setEditing(false); setTranscript(note.transcript) }}>
              Annuler
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm flex-1">{note.transcript}</p>
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button className="text-muted-foreground hover:text-foreground p-1 rounded" onClick={() => setEditing(true)} title="Modifier">
                <EditIcon />
              </button>
              <button className="text-muted-foreground hover:text-foreground p-1 rounded" onClick={() => setLinking(!linking)} title="Lier">
                <LinkIcon />
              </button>
              <button className="text-muted-foreground hover:text-red-500 p-1 rounded" onClick={onDelete} title="Supprimer">
                <TrashIcon />
              </button>
            </div>
          </div>

          {/* Link badges */}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-[10px] text-muted-foreground">{formatRelative(note.createdAt)}</span>
            {linkedProject && (
              <span className="inline-flex items-center gap-1 text-[10px] bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300 px-1.5 py-0.5 rounded-full">
                <ProjectIcon /> {linkedProject.name}
                <button className="hover:text-red-500 ml-0.5" onClick={() => onUpdate({ linkedProjectId: undefined })}>×</button>
              </span>
            )}
            {linkedContact && (
              <span className="inline-flex items-center gap-1 text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-1.5 py-0.5 rounded-full">
                <ContactIcon /> {linkedContact.firstName} {linkedContact.lastName}
                <button className="hover:text-red-500 ml-0.5" onClick={() => onUpdate({ linkedContactId: undefined })}>×</button>
              </span>
            )}
          </div>
        </>
      )}

      {/* Link picker */}
      {linking && (
        <LinkPicker
          projects={projects}
          contacts={contacts}
          currentProjectId={note.linkedProjectId}
          currentContactId={note.linkedContactId}
          onLinkProject={(id) => { onUpdate({ linkedProjectId: id }); setLinking(false) }}
          onLinkContact={(id) => { onUpdate({ linkedContactId: id }); setLinking(false) }}
          onClose={() => setLinking(false)}
        />
      )}
    </div>
  )
}

// ── Link picker ──

function LinkPicker({ projects, contacts, currentProjectId, currentContactId, onLinkProject, onLinkContact, onClose }: {
  projects: { id: string; name: string }[]
  contacts: { id: string; firstName: string; lastName: string }[]
  currentProjectId?: string
  currentContactId?: string
  onLinkProject: (id: string) => void
  onLinkContact: (id: string) => void
  onClose: () => void
}) {
  const [tab, setTab] = useState<'project' | 'contact'>('project')
  const [search, setSearch] = useState('')

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) && p.id !== currentProjectId
  )
  const filteredContacts = contacts.filter((c) =>
    `${c.firstName} ${c.lastName}`.toLowerCase().includes(search.toLowerCase()) && c.id !== currentContactId
  )

  return (
    <div className="mt-2 rounded-md border border-border bg-background p-2 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          <button
            onClick={() => { setTab('project'); setSearch('') }}
            className={`text-[10px] px-2 py-1 rounded-md font-medium ${tab === 'project' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
          >
            Projet
          </button>
          <button
            onClick={() => { setTab('contact'); setSearch('') }}
            className={`text-[10px] px-2 py-1 rounded-md font-medium ${tab === 'contact' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
          >
            Contact
          </button>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xs">×</button>
      </div>
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={tab === 'project' ? 'Chercher un projet...' : 'Chercher un contact...'}
        className="text-xs h-7"
      />
      <div className="max-h-32 overflow-y-auto space-y-0.5">
        {tab === 'project' ? (
          filteredProjects.length === 0 ? (
            <p className="text-[10px] text-muted-foreground text-center py-2">Aucun projet trouvé</p>
          ) : (
            filteredProjects.map((p) => (
              <button key={p.id} onClick={() => onLinkProject(p.id)} className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-muted truncate">
                {p.name}
              </button>
            ))
          )
        ) : (
          filteredContacts.length === 0 ? (
            <p className="text-[10px] text-muted-foreground text-center py-2">Aucun contact trouvé</p>
          ) : (
            filteredContacts.map((c) => (
              <button key={c.id} onClick={() => onLinkContact(c.id)} className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-muted truncate">
                {c.firstName} {c.lastName}
              </button>
            ))
          )
        )}
      </div>
    </div>
  )
}

// ── Create project dialog ──

function ProjectDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { createVocalProject } = useApp()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [keywordInput, setKeywordInput] = useState('')
  const [keywords, setKeywords] = useState<string[]>([])

  const handleCreate = () => {
    if (!name.trim()) return
    createVocalProject({ name: name.trim(), description, keywords })
    setName('')
    setDescription('')
    setKeywords([])
    onClose()
  }

  const addKeyword = () => {
    const kw = keywordInput.trim()
    if (kw && !keywords.includes(kw)) {
      setKeywords([...keywords, kw])
      setKeywordInput('')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nouveau projet vocal</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Nom du projet *" value={name} onChange={(e) => setName(e.target.value)} />
          <Textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Mots-clés (pour classement automatique)
            </label>
            <div className="flex gap-2 mt-1">
              <Input
                placeholder="Ajouter un mot-clé"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
              />
              <Button variant="outline" size="sm" onClick={addKeyword}>+</Button>
            </div>
            {keywords.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {keywords.map((kw) => (
                  <span key={kw} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs cursor-pointer" onClick={() => setKeywords(keywords.filter((k) => k !== kw))}>
                    {kw} ×
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" size="sm" onClick={onClose}>Annuler</Button>
          <Button size="sm" onClick={handleCreate}>Créer</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Icons ──

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 2.5l3 3L4.5 12.5H1.5v-3l7-7Z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 4h10M5 4V2.5h4V4M3.5 4v8a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1V4" />
    </svg>
  )
}

function LinkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a3 3 0 0 0 4.24 0l1.5-1.5a3 3 0 0 0-4.24-4.24L6.75 3" />
      <path d="M8 6a3 3 0 0 0-4.24 0L2.26 7.5a3 3 0 0 0 4.24 4.24L7.25 11" />
    </svg>
  )
}

function ProjectIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 1l5 2.5L5 6 0 3.5Z" />
      <path d="M0 5l5 2.5L10 5" />
    </svg>
  )
}

function ContactIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5" cy="3.5" r="2" />
      <path d="M1 9.5c0-2.2 1.8-4 4-4s4 1.8 4 4" />
    </svg>
  )
}
