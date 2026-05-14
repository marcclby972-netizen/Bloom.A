'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  isVaultInitialized,
  initializeVault,
  verifyMasterPassword,
  loadVault,
  saveVault,
  destroyVault,
  generatePassword,
  type VaultEntry,
} from '@/lib/vault'

type Mode = 'locked' | 'init' | 'unlocked'

export default function VaultPage() {
  const [mode, setMode] = useState<Mode>('locked')
  const [masterPwd, setMasterPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const [entries, setEntries] = useState<VaultEntry[]>([])
  const [search, setSearch] = useState('')
  const [editingEntry, setEditingEntry] = useState<VaultEntry | null>(null)
  const [showNewForm, setShowNewForm] = useState(false)
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    setMode(isVaultInitialized() ? 'locked' : 'init')
  }, [])

  const handleInit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (masterPwd.length < 8) { setError('Minimum 8 caractères'); return }
    if (masterPwd !== confirmPwd) { setError('Les mots de passe ne correspondent pas'); return }
    setBusy(true)
    try {
      await initializeVault(masterPwd)
      setEntries([])
      setMode('unlocked')
      setConfirmPwd('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setBusy(false)
    }
  }

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const ok = await verifyMasterPassword(masterPwd)
      if (!ok) { setError('Mot de passe incorrect'); return }
      const data = await loadVault(masterPwd)
      setEntries(data)
      setMode('unlocked')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setBusy(false)
    }
  }

  const handleLock = () => {
    setMasterPwd('')
    setEntries([])
    setRevealedIds(new Set())
    setEditingEntry(null)
    setShowNewForm(false)
    setMode('locked')
  }

  const persistEntries = async (next: VaultEntry[]) => {
    setEntries(next)
    await saveVault(next, masterPwd)
  }

  const handleSaveEntry = async (entry: VaultEntry) => {
    const exists = entries.find((e) => e.id === entry.id)
    const next = exists
      ? entries.map((e) => e.id === entry.id ? { ...entry, updatedAt: Date.now() } : e)
      : [...entries, { ...entry, createdAt: Date.now(), updatedAt: Date.now() }]
    await persistEntries(next)
    setEditingEntry(null)
    setShowNewForm(false)
  }

  const handleDeleteEntry = async (id: string) => {
    if (!confirm('Supprimer cette entrée ?')) return
    await persistEntries(entries.filter((e) => e.id !== id))
  }

  const handleDestroyVault = () => {
    if (!confirm('⚠️ Cette action supprimera DÉFINITIVEMENT tout le coffre-fort. Continuer ?')) return
    if (!confirm('Vraiment sûr ? Toutes les données chiffrées seront perdues.')) return
    destroyVault()
    handleLock()
    setMode('init')
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return entries.filter((e) =>
      !q || e.title.toLowerCase().includes(q) || e.username.toLowerCase().includes(q) ||
      e.url.toLowerCase().includes(q) || e.category.toLowerCase().includes(q)
    ).sort((a, b) => b.updatedAt - a.updatedAt)
  }, [entries, search])

  const toggleReveal = (id: string) => {
    const next = new Set(revealedIds)
    if (next.has(id)) next.delete(id); else next.add(id)
    setRevealedIds(next)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard?.writeText(text)
  }

  // ── Rendering ──

  if (mode === 'init') {
    return (
      <div className="flex flex-col h-full">
        <Header />
        <div className="flex-1 overflow-auto p-4 sm:p-6 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <LockIcon size={20} />
                </div>
                <div>
                  <CardTitle className="text-base">Créer le coffre-fort</CardTitle>
                  <CardDescription>Définis un mot de passe maître</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleInit} className="space-y-3">
                <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900/50 p-3 text-xs text-amber-800 dark:text-amber-300">
                  ⚠️ Ce mot de passe ne peut PAS être récupéré. Si tu l&apos;oublies, tu perds tout le coffre-fort. Le chiffrement est local (AES-256-GCM).
                </div>
                <Input
                  type="password"
                  placeholder="Mot de passe maître (min. 8 caractères)"
                  value={masterPwd}
                  onChange={(e) => setMasterPwd(e.target.value)}
                  autoFocus
                />
                <Input
                  type="password"
                  placeholder="Confirmer le mot de passe"
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                />
                {error && <p className="text-xs text-red-600">{error}</p>}
                <Button type="submit" disabled={busy} className="w-full">
                  {busy ? 'Création...' : 'Créer le coffre-fort'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (mode === 'locked') {
    return (
      <div className="flex flex-col h-full">
        <Header />
        <div className="flex-1 overflow-auto p-4 sm:p-6 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <LockIcon size={20} />
                </div>
                <div>
                  <CardTitle className="text-base">Coffre-fort verrouillé</CardTitle>
                  <CardDescription>Entre ton mot de passe maître</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUnlock} className="space-y-3">
                <Input
                  type="password"
                  placeholder="Mot de passe maître"
                  value={masterPwd}
                  onChange={(e) => setMasterPwd(e.target.value)}
                  autoFocus
                />
                {error && <p className="text-xs text-red-600">{error}</p>}
                <Button type="submit" disabled={busy} className="w-full">
                  {busy ? 'Déverrouillage...' : 'Déverrouiller'}
                </Button>
                <button
                  type="button"
                  onClick={handleDestroyVault}
                  className="w-full text-[10px] text-muted-foreground hover:text-destructive"
                >
                  Supprimer le coffre-fort
                </button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Unlocked
  return (
    <div className="flex flex-col h-full">
      <Header onLock={handleLock} unlocked />
      <div className="px-4 sm:px-6 py-3 border-b border-border flex items-center gap-3 flex-wrap">
        <Input
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Button size="sm" onClick={() => setShowNewForm(true)}>+ Entrée</Button>
        <span className="text-xs text-muted-foreground ml-auto">{entries.length} entrée{entries.length > 1 ? 's' : ''}</span>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6">
        {showNewForm && (
          <EntryEditor
            entry={null}
            onSave={handleSaveEntry}
            onCancel={() => setShowNewForm(false)}
          />
        )}

        {editingEntry && (
          <EntryEditor
            entry={editingEntry}
            onSave={handleSaveEntry}
            onCancel={() => setEditingEntry(null)}
          />
        )}

        {filtered.length === 0 && !showNewForm ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
            <LockIcon size={40} />
            <p className="text-sm mt-4">{search ? 'Aucun résultat' : 'Coffre-fort vide. Ajoute ta première entrée.'}</p>
          </div>
        ) : (
          <div className="space-y-2 max-w-3xl mx-auto">
            {filtered.map((entry) => (
              <Card key={entry.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="flex items-center gap-3 p-3">
                  <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0 text-xs font-semibold uppercase">
                    {entry.title.slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{entry.title}</span>
                      {entry.category && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{entry.category}</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {entry.username && <span className="text-xs text-muted-foreground truncate">{entry.username}</span>}
                      {entry.url && <a href={entry.url.startsWith('http') ? entry.url : `https://${entry.url}`} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline truncate">{entry.url}</a>}
                    </div>
                    {revealedIds.has(entry.id) && (
                      <div className="mt-1 font-mono text-xs text-foreground bg-muted/40 px-2 py-1 rounded select-all">
                        {entry.password}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => copyToClipboard(entry.username)}
                      title="Copier identifiant"
                      className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <CopyIcon />
                    </button>
                    <button
                      onClick={() => copyToClipboard(entry.password)}
                      title="Copier mot de passe"
                      className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <KeyIcon />
                    </button>
                    <button
                      onClick={() => toggleReveal(entry.id)}
                      title={revealedIds.has(entry.id) ? 'Masquer' : 'Afficher'}
                      className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <EyeIcon open={revealedIds.has(entry.id)} />
                    </button>
                    <button
                      onClick={() => setEditingEntry(entry)}
                      title="Modifier"
                      className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <EditIcon />
                    </button>
                    <button
                      onClick={() => handleDeleteEntry(entry.id)}
                      title="Supprimer"
                      className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-red-50 hover:text-red-500"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Entry editor ──

function EntryEditor({ entry, onSave, onCancel }: {
  entry: VaultEntry | null
  onSave: (entry: VaultEntry) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState(entry?.title || '')
  const [username, setUsername] = useState(entry?.username || '')
  const [password, setPassword] = useState(entry?.password || '')
  const [url, setUrl] = useState(entry?.url || '')
  const [notes, setNotes] = useState(entry?.notes || '')
  const [category, setCategory] = useState(entry?.category || '')
  const [pwLength, setPwLength] = useState(20)

  const handleGenerate = () => {
    setPassword(generatePassword({ length: pwLength }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onSave({
      id: entry?.id || crypto.randomUUID(),
      title: title.trim(),
      username,
      password,
      url,
      notes,
      category,
      createdAt: entry?.createdAt || Date.now(),
      updatedAt: Date.now(),
    })
  }

  return (
    <Card className="mb-4 max-w-3xl mx-auto border-primary/40">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">{entry ? 'Modifier' : 'Nouvelle entrée'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input placeholder="Titre *" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input placeholder="Identifiant / email" value={username} onChange={(e) => setUsername(e.target.value)} />
            <Input placeholder="URL (ex: github.com)" value={url} onChange={(e) => setUrl(e.target.value)} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex-1 font-mono"
              />
              <input
                type="number"
                min="8"
                max="64"
                value={pwLength}
                onChange={(e) => setPwLength(parseInt(e.target.value, 10) || 20)}
                className="h-9 w-14 rounded-md border border-input bg-transparent px-2 text-xs text-center"
              />
              <Button type="button" variant="outline" size="sm" onClick={handleGenerate}>Générer</Button>
            </div>
            {password && (
              <PasswordStrengthBar password={password} />
            )}
          </div>
          <Input placeholder="Catégorie (optionnel)" value={category} onChange={(e) => setCategory(e.target.value)} />
          <textarea
            placeholder="Notes (optionnel)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none resize-none"
          />
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" size="sm" onClick={onCancel}>Annuler</Button>
            <Button type="submit" size="sm" disabled={!title.trim()}>Enregistrer</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function PasswordStrengthBar({ password }: { password: string }) {
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^a-zA-Z\d]/.test(password)) score++
  const pct = (score / 5) * 100
  const color = score < 2 ? 'bg-red-500' : score < 3 ? 'bg-orange-500' : score < 4 ? 'bg-yellow-500' : score < 5 ? 'bg-lime-500' : 'bg-green-500'
  const label = score < 2 ? 'Faible' : score < 3 ? 'Moyen' : score < 4 ? 'Bon' : score < 5 ? 'Fort' : 'Excellent'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={cn('h-full transition-all', color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  )
}

// ── Header ──

function Header({ onLock, unlocked }: { onLock?: () => void; unlocked?: boolean } = {}) {
  return (
    <div className="shrink-0">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <LockIcon size={16} />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Coffre-fort</h1>
            <p className="text-xs text-muted-foreground">Mots de passe chiffrés localement</p>
          </div>
        </div>
        {unlocked && onLock && (
          <Button size="sm" variant="outline" onClick={onLock}>Verrouiller</Button>
        )}
      </div>
      <div className="h-px gradient-line" />
    </div>
  )
}

// ── Icons ──

function LockIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
      <rect x="3" y="7" width="10" height="7" rx="2" />
      <path d="M5 7V5a3 3 0 0 1 6 0v2" />
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="8" height="9" rx="1.5" />
      <path d="M2 9V2.5a1 1 0 0 1 1-1H9" />
    </svg>
  )
}

function KeyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="4" cy="9" r="2.5" />
      <path d="M6.5 9h6M11 9v2M9 9v1.5" />
    </svg>
  )
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 7c1.5-3 4-4 6-4s4.5 1 6 4c-1.5 3-4 4-6 4s-4.5-1-6-4Z" />
      <circle cx="7" cy="7" r="1.5" />
    </svg>
  ) : (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 7c.5-1 1-1.7 1.6-2.3M5.5 3.5C6 3.3 6.5 3.2 7 3.2c2 0 4.5 1 6 4-.4.7-.8 1.3-1.3 1.8M9.5 9.5c-.7.5-1.6.8-2.5.8-2 0-4.5-1-6-4" />
      <path d="M5.5 5.5a1.5 1.5 0 0 0 2.1 2.1" />
      <path d="M2 2l10 10" />
    </svg>
  )
}

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 2.5l3 3L4.5 12.5H1.5v-3l7-7Z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 4h10M5 4V2.5h4V4M3.5 4v8a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1V4" />
    </svg>
  )
}
