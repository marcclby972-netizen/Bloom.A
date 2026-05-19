'use client'

/**
 * EventModal — création / édition d'un évènement.
 *
 * Champs :
 *  - titre (requis)
 *  - all-day toggle
 *  - date+heure de début / fin
 *  - projet (optionnel, depuis useProjects scopé team)
 *  - tâche (optionnel, filtrée par projectId)
 *  - couleur (palette de 5)
 *  - description (textarea)
 *
 * Boutons :
 *  - Enregistrer (create / update)
 *  - Supprimer (uniquement en édition)
 *  - Créer une tâche depuis cet évènement (crée une Task pré-remplie
 *    avec le titre + sélectionne le projet courant)
 *  - Annuler / fermer
 */

import { useEffect, useMemo, useState } from 'react'
import type { Event } from '@/lib/v3-types'
import { useProjects, useTasks } from '@/hooks'
import { createTaskAction } from '@/lib/actions/tasks'

const COLORS = [
  { value: '#E37520', name: 'Orange' },
  { value: '#2B4F6F', name: 'Bleu' },
  { value: '#3B6E47', name: 'Vert' },
  { value: '#6B3FA0', name: 'Violet' },
  { value: '#C13C5C', name: 'Rouge' },
] as const

function pad(n: number): string {
  return n < 10 ? '0' + n : String(n)
}

function toDateInput(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function toTimeInput(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function combine(date: string, time: string): string {
  // date = 'YYYY-MM-DD', time = 'HH:MM'
  return new Date(`${date}T${time}:00`).toISOString()
}

type Mode = 'create' | 'edit'

export function EventModal({
  mode,
  event,
  initialDate,
  teamId,
  onClose,
  onSave,
  onDelete,
}: {
  mode: Mode
  event?: Event | null
  /** Date par défaut quand on crée depuis le grid (YYYY-MM-DD). */
  initialDate?: string
  teamId: string | null
  onClose: () => void
  onSave: (input: {
    title: string
    description: string | null
    startsAt: string
    endsAt: string
    allDay: boolean
    projectId: string | null
    taskId: string | null
    color: string | null
  }) => Promise<void>
  onDelete?: () => Promise<void>
}) {
  const { data: projects } = useProjects({ teamId })

  // Form state
  const todayIso = initialDate ?? toDateInput(new Date())
  const [title, setTitle] = useState(event?.title ?? '')
  const [description, setDescription] = useState(event?.description ?? '')
  const [allDay, setAllDay] = useState(event?.allDay ?? false)
  const [startDate, setStartDate] = useState(
    event ? toDateInput(new Date(event.startsAt)) : todayIso
  )
  const [startTime, setStartTime] = useState(
    event ? toTimeInput(new Date(event.startsAt)) : '09:00'
  )
  const [endDate, setEndDate] = useState(
    event ? toDateInput(new Date(event.endsAt)) : todayIso
  )
  const [endTime, setEndTime] = useState(
    event ? toTimeInput(new Date(event.endsAt)) : '10:00'
  )
  const [projectId, setProjectId] = useState<string>(event?.projectId ?? '')
  const [taskId, setTaskId] = useState<string>(event?.taskId ?? '')
  const [color, setColor] = useState<string>(event?.color ?? '#E37520')

  const { data: tasksForProject } = useTasks(
    projectId ? { projectId } : {}
  )

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [creatingTask, setCreatingTask] = useState(false)

  // Si on désactive all-day, on remet des heures par défaut
  useEffect(() => {
    if (allDay) {
      setStartTime('00:00')
      setEndTime('23:59')
    }
  }, [allDay])

  // Si le projet change, on déselectionne la tâche (peut plus être valide)
  useEffect(() => {
    if (event?.projectId !== projectId) {
      setTaskId('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!title.trim()) {
      setError('Titre requis')
      return
    }
    const startsAt = combine(startDate, allDay ? '00:00' : startTime)
    const endsAt = combine(endDate, allDay ? '23:59' : endTime)
    if (new Date(endsAt) < new Date(startsAt)) {
      setError('La fin doit être après le début')
      return
    }
    setBusy(true)
    try {
      await onSave({
        title: title.trim(),
        description: description.trim() || null,
        startsAt,
        endsAt,
        allDay,
        projectId: projectId || null,
        taskId: taskId || null,
        color: color || null,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sauvegarde échouée')
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async () => {
    if (!onDelete) return
    if (!confirm('Supprimer cet évènement ?')) return
    setBusy(true)
    try {
      await onDelete()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Suppression échouée')
    } finally {
      setBusy(false)
    }
  }

  // Quick action : create a task from this event title
  const createTaskFromEvent = async () => {
    if (!projectId) {
      window.alert(
        'Sélectionne d’abord un projet pour pouvoir créer la tâche associée.'
      )
      return
    }
    if (!title.trim()) {
      window.alert('Donne un titre à l’évènement d’abord.')
      return
    }
    setCreatingTask(true)
    const r = await createTaskAction({
      projectId,
      title: title.trim(),
      priority: 'medium',
      dueDate: combine(startDate, '00:00'),
    })
    setCreatingTask(false)
    if (r.ok) {
      setTaskId(r.data.id)
      window.alert(`Tâche créée et liée : « ${r.data.title} »`)
    } else {
      window.alert(`Impossible de créer la tâche : ${r.error.message}`)
    }
  }

  const isEdit = mode === 'edit'

  return (
    <div
      onClick={onClose}
      role="presentation"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(6px)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 100,
        padding: 20,
      }}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        style={{
          background: 'var(--bloom-surface)',
          border: '1px solid var(--bloom-border-strong)',
          borderRadius: 18,
          padding: 24,
          maxWidth: 540,
          width: '100%',
          maxHeight: '85vh',
          overflow: 'auto',
        }}
      >
        <h3
          style={{
            fontFamily: 'var(--font-display), system-ui, sans-serif',
            fontSize: 20,
            fontWeight: 700,
            color: 'var(--bloom-text)',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: color,
              flexShrink: 0,
            }}
          />
          {isEdit ? 'Modifier l’évènement' : 'Nouvel évènement'}
        </h3>

        <FieldRow>
          <Label>Titre</Label>
          <input
            autoFocus
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="ex : Revue Pricing v2"
            maxLength={200}
            required
            disabled={busy}
            style={inputStyle}
          />
        </FieldRow>

        {/* All day */}
        <FieldRow direction="row" gap={10}>
          <input
            id="all-day"
            type="checkbox"
            checked={allDay}
            onChange={(e) => setAllDay(e.target.checked)}
            disabled={busy}
            style={{ accentColor: 'var(--orange)' }}
          />
          <label
            htmlFor="all-day"
            style={{
              fontSize: 13,
              color: 'var(--bloom-text)',
              cursor: 'pointer',
            }}
          >
            Toute la journée
          </label>
        </FieldRow>

        {/* Dates + heures */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FieldRow>
            <Label>Début</Label>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                disabled={busy}
                style={{ ...inputStyle, flex: 1 }}
              />
              {!allDay && (
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  disabled={busy}
                  style={{ ...inputStyle, width: 100 }}
                />
              )}
            </div>
          </FieldRow>
          <FieldRow>
            <Label>Fin</Label>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                disabled={busy}
                style={{ ...inputStyle, flex: 1 }}
              />
              {!allDay && (
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                  disabled={busy}
                  style={{ ...inputStyle, width: 100 }}
                />
              )}
            </div>
          </FieldRow>
        </div>

        {/* Project + Task linking */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FieldRow>
            <Label>Projet</Label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              disabled={busy}
              style={inputStyle}
            >
              <option value="">— Aucun —</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </FieldRow>
          <FieldRow>
            <Label>Tâche</Label>
            <select
              value={taskId}
              onChange={(e) => setTaskId(e.target.value)}
              disabled={busy || !projectId || tasksForProject.length === 0}
              style={{
                ...inputStyle,
                opacity: !projectId ? 0.5 : 1,
                cursor: !projectId ? 'not-allowed' : 'pointer',
              }}
            >
              <option value="">— Aucune —</option>
              {tasksForProject.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </FieldRow>
        </div>

        {/* Quick create task */}
        <button
          type="button"
          onClick={createTaskFromEvent}
          disabled={busy || creatingTask || !projectId || !title.trim()}
          style={{
            background: 'transparent',
            border: '1px dashed var(--bloom-border-strong)',
            borderRadius: 10,
            color: 'var(--bloom-text-muted)',
            padding: '8px 12px',
            fontSize: 12.5,
            cursor:
              busy || creatingTask || !projectId || !title.trim()
                ? 'not-allowed'
                : 'pointer',
            fontFamily: 'inherit',
            marginBottom: 12,
            width: '100%',
            opacity: !projectId || !title.trim() ? 0.5 : 1,
          }}
          title={
            !projectId
              ? 'Choisis un projet pour activer'
              : !title.trim()
                ? 'Donne un titre d’abord'
                : 'Crée une tâche pré-remplie depuis ce titre + la date'
          }
        >
          {creatingTask ? 'Création…' : '+ Créer une tâche depuis cet évènement'}
        </button>

        {/* Couleur */}
        <FieldRow>
          <Label>Couleur</Label>
          <div style={{ display: 'flex', gap: 8 }}>
            {COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setColor(c.value)}
                title={c.name}
                disabled={busy}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: c.value,
                  border:
                    color === c.value
                      ? '2px solid var(--bloom-text)'
                      : '2px solid transparent',
                  cursor: 'pointer',
                  padding: 0,
                  outline: 'none',
                  transition: 'transform 120ms ease',
                }}
              />
            ))}
          </div>
        </FieldRow>

        {/* Description */}
        <FieldRow>
          <Label>Description (optionnel)</Label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Notes, lien visio, ordre du jour…"
            rows={3}
            disabled={busy}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </FieldRow>

        {error && (
          <p
            role="alert"
            style={{
              fontSize: 13,
              color: '#FCA5A5',
              marginBottom: 12,
            }}
          >
            {error}
          </p>
        )}

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 6,
          }}
        >
          <div>
            {isEdit && onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={busy}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--bloom-border)',
                  borderRadius: 12,
                  color: '#FCA5A5',
                  padding: '10px 14px',
                  fontSize: 13,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Supprimer
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="btn btn-ghost-dark"
            >
              Annuler
            </button>
            <button type="submit" disabled={busy} className="btn btn-primary">
              {busy ? '…' : isEdit ? 'Enregistrer' : 'Créer l’évènement'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

// ─── Styled sub-bits ───

function FieldRow({
  children,
  direction = 'column',
  gap = 6,
}: {
  children: React.ReactNode
  direction?: 'row' | 'column'
  gap?: number
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: direction,
        gap,
        marginBottom: 14,
        alignItems: direction === 'row' ? 'center' : 'stretch',
      }}
    >
      {children}
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label
      style={{
        fontSize: 12,
        fontWeight: 700,
        color: 'var(--bloom-text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
      }}
    >
      {children}
    </label>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--bloom-surface-2)',
  border: '1px solid var(--bloom-border)',
  borderRadius: 10,
  color: 'var(--bloom-text)',
  padding: '10px 12px',
  fontSize: 14,
  fontFamily: 'inherit',
  outline: 'none',
}
