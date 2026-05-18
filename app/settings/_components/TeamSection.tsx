'use client'

/**
 * TeamSection — visible uniquement si une team est active.
 *
 * Permet :
 *  - de renommer l'équipe (founders only)
 *  - de lister les membres avec leur rôle + parts
 *  - de changer le rôle d'un membre (founders only)
 *  - d'inviter un nouvel associé
 *  - de retirer un membre (avec confirmation par texte tapé)
 */

import { useEffect, useState } from 'react'
import {
  Section,
  Field,
  Input,
  Select,
  PrimaryButton,
  GhostButton,
  FieldError,
  FieldSuccess,
} from './Section'
import {
  getTeamMembersAction,
  updateTeamAction,
  inviteMemberAction,
  updateMemberRoleAction,
  removeMemberAction,
} from '@/lib/actions/teams'
import { useCurrentTeam, useCurrentUser } from '@/hooks'
import type { Membership, TeamRole } from '@/lib/v3-types'

const ROLE_LABEL: Record<TeamRole, string> = {
  founder: 'Fondateur',
  associate: 'Associé',
  guest: 'Invité',
}

const AV_CYCLE = ['av-a', 'av-b', 'av-c'] as const

function shortId(id: string) {
  return id.slice(0, 2).toUpperCase()
}

export function TeamSection() {
  const { data: user } = useCurrentUser()
  const { currentTeam, refetch: refetchTeams } = useCurrentTeam()

  const [members, setMembers] = useState<Membership[]>([])
  const [membersLoading, setMembersLoading] = useState(true)

  // Rename team
  const [teamName, setTeamName] = useState('')
  const [nameBusy, setNameBusy] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)
  const [nameSuccess, setNameSuccess] = useState<string | null>(null)

  // Invite
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<TeamRole>('associate')
  const [inviteBusy, setInviteBusy] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null)

  // Remove member dialog
  const [removingMember, setRemovingMember] = useState<Membership | null>(null)

  const teamId = currentTeam?.id ?? null

  // Hydrate name from team
  useEffect(() => {
    if (currentTeam) setTeamName(currentTeam.name)
  }, [currentTeam])

  const reloadMembers = async () => {
    if (!teamId) {
      setMembers([])
      setMembersLoading(false)
      return
    }
    setMembersLoading(true)
    const r = await getTeamMembersAction(teamId)
    if (r.ok) setMembers(r.data)
    setMembersLoading(false)
  }

  useEffect(() => {
    void reloadMembers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId])

  // Am I a founder?
  const myMembership = user ? members.find((m) => m.userId === user.id) : null
  const isFounder = myMembership?.role === 'founder'

  if (!teamId || !currentTeam) {
    return (
      <Section
        id="team"
        eyebrow="Équipe"
        title="Équipe"
        description="Aucune équipe active. Crée-en une depuis l'onboarding pour gérer tes associés ici."
      >
        <p style={{ fontSize: 13, color: 'var(--bloom-text-muted)' }}>
          Bloom solo n&apos;a pas de gestion d&apos;équipe. Crée une team pour
          débloquer cette section.
        </p>
      </Section>
    )
  }

  // ─── Rename ───
  const submitName = async (e: React.FormEvent) => {
    e.preventDefault()
    setNameError(null)
    setNameSuccess(null)
    if (teamName.trim() === currentTeam.name) return
    setNameBusy(true)
    const r = await updateTeamAction(teamId, { name: teamName.trim() })
    if (r.ok) {
      setNameSuccess('Équipe renommée.')
      await refetchTeams()
      window.setTimeout(() => setNameSuccess(null), 2500)
    } else {
      setNameError(r.error.message)
    }
    setNameBusy(false)
  }

  // ─── Invite ───
  const submitInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviteError(null)
    setInviteSuccess(null)
    setInviteBusy(true)
    const r = await inviteMemberAction({
      teamId,
      email: inviteEmail.trim(),
      role: inviteRole,
    })
    if (r.ok) {
      setInviteSuccess(`Invitation envoyée à ${inviteEmail}.`)
      setInviteEmail('')
      await reloadMembers()
      window.setTimeout(() => setInviteSuccess(null), 3000)
    } else {
      setInviteError(r.error.message)
    }
    setInviteBusy(false)
  }

  // ─── Role change ───
  const changeRole = async (m: Membership, newRole: TeamRole) => {
    if (m.role === newRole) return
    const r = await updateMemberRoleAction(m.id, newRole)
    if (r.ok) {
      await reloadMembers()
    } else {
      window.alert(r.error.message)
    }
  }

  return (
    <>
      <Section
        id="team"
        eyebrow="Gouvernance"
        title="Équipe"
        description="Gère le nom de l'équipe et la liste des associés. Seuls les fondateurs peuvent modifier."
      >
        {/* ── Rename team ── */}
        <form onSubmit={submitName} style={{ marginBottom: 24 }}>
          <Field label="Nom de l'équipe" htmlFor="team-name">
            <Input
              id="team-name"
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              maxLength={80}
              disabled={!isFounder || nameBusy}
              style={
                !isFounder ? { opacity: 0.6, cursor: 'not-allowed' } : undefined
              }
            />
          </Field>
          {isFounder ? (
            <PrimaryButton
              type="submit"
              disabled={
                nameBusy ||
                !teamName.trim() ||
                teamName.trim() === currentTeam.name
              }
            >
              {nameBusy ? '…' : 'Renommer'}
            </PrimaryButton>
          ) : (
            <p style={{ fontSize: 12, color: 'var(--bloom-text-faint)' }}>
              Seuls les fondateurs peuvent renommer l&apos;équipe.
            </p>
          )}
          <FieldError error={nameError} />
          <FieldSuccess success={nameSuccess} />
        </form>

        <hr
          style={{
            border: 0,
            borderTop: '1px solid var(--bloom-border)',
            margin: '24px 0',
          }}
        />

        {/* ── Members ── */}
        <h3
          style={{
            fontFamily: 'var(--font-display), system-ui, sans-serif',
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--bloom-text)',
            marginBottom: 10,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          Membres ({members.length})
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {membersLoading && members.length === 0 && (
            <p style={{ fontSize: 13, color: 'var(--bloom-text-muted)' }}>
              Chargement…
            </p>
          )}
          {members.map((m, idx) => {
            const isMe = m.userId === user?.id
            const av = AV_CYCLE[idx % AV_CYCLE.length]
            return (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  background: 'var(--bloom-surface-2)',
                  border: '1px solid var(--bloom-border)',
                  borderRadius: 12,
                }}
              >
                <span
                  className={`av ${av}`}
                  style={{ flexShrink: 0 }}
                >
                  {shortId(m.userId)}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13.5,
                      fontWeight: 700,
                      color: 'var(--bloom-text)',
                    }}
                  >
                    Membre {idx + 1}
                    {isMe && (
                      <span
                        style={{
                          marginLeft: 6,
                          fontSize: 11,
                          color: 'var(--orange-2)',
                          fontWeight: 600,
                        }}
                      >
                        (toi)
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--bloom-text-muted)',
                    }}
                  >
                    {m.shares !== null ? `${m.shares}% parts · ` : ''}
                    {ROLE_LABEL[m.role]}
                  </div>
                </div>
                {isFounder && !isMe ? (
                  <>
                    <Select
                      value={m.role}
                      onChange={(e) =>
                        void changeRole(m, e.target.value as TeamRole)
                      }
                      style={{ width: 130, padding: '6px 10px', fontSize: 12 }}
                    >
                      {(Object.keys(ROLE_LABEL) as TeamRole[]).map((r) => (
                        <option key={r} value={r}>
                          {ROLE_LABEL[r]}
                        </option>
                      ))}
                    </Select>
                    <button
                      type="button"
                      onClick={() => setRemovingMember(m)}
                      style={{
                        background: 'transparent',
                        border: '1px solid var(--bloom-border)',
                        borderRadius: 8,
                        color: '#FCA5A5',
                        cursor: 'pointer',
                        padding: '6px 10px',
                        fontSize: 12,
                        fontFamily: 'inherit',
                      }}
                    >
                      Retirer
                    </button>
                  </>
                ) : (
                  <span
                    style={{
                      fontSize: 11,
                      color: 'var(--bloom-text-faint)',
                      padding: '6px 10px',
                    }}
                  >
                    {isMe ? 'Toi-même' : ''}
                  </span>
                )}
              </div>
            )
          })}
        </div>

        <hr
          style={{
            border: 0,
            borderTop: '1px solid var(--bloom-border)',
            margin: '24px 0',
          }}
        />

        {/* ── Invite ── */}
        {isFounder && (
          <>
            <h3
              style={{
                fontFamily: 'var(--font-display), system-ui, sans-serif',
                fontSize: 14,
                fontWeight: 700,
                color: 'var(--bloom-text)',
                marginBottom: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              Inviter un associé
            </h3>
            <form onSubmit={submitInvite}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 160px auto',
                  gap: 10,
                }}
              >
                <Input
                  type="email"
                  placeholder="associe@email.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  disabled={inviteBusy}
                />
                <Select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as TeamRole)}
                  disabled={inviteBusy}
                >
                  {(Object.keys(ROLE_LABEL) as TeamRole[]).map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABEL[r]}
                    </option>
                  ))}
                </Select>
                <PrimaryButton
                  type="submit"
                  disabled={inviteBusy || !inviteEmail.includes('@')}
                >
                  {inviteBusy ? '…' : 'Inviter'}
                </PrimaryButton>
              </div>
              <FieldError error={inviteError} />
              <FieldSuccess success={inviteSuccess} />
            </form>
          </>
        )}
      </Section>

      {removingMember && (
        <RemoveMemberDialog
          membership={removingMember}
          onClose={() => setRemovingMember(null)}
          onRemoved={async () => {
            setRemovingMember(null)
            await reloadMembers()
          }}
        />
      )}
    </>
  )
}

function RemoveMemberDialog({
  membership,
  onClose,
  onRemoved,
}: {
  membership: Membership
  onClose: () => void
  onRemoved: () => void
}) {
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const keyword = 'RETIRER'

  const submit = async () => {
    if (confirm !== keyword) return
    setBusy(true)
    setError(null)
    const r = await removeMemberAction(membership.id)
    setBusy(false)
    if (r.ok) onRemoved()
    else setError(r.error.message)
  }

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
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        style={{
          background: 'var(--bloom-surface)',
          border: '1px solid var(--bloom-border-strong)',
          borderRadius: 18,
          padding: 24,
          maxWidth: 460,
          width: '100%',
        }}
      >
        <h3
          style={{
            fontFamily: 'var(--font-display), system-ui, sans-serif',
            fontSize: 18,
            fontWeight: 700,
            color: 'var(--bloom-text)',
            marginBottom: 8,
          }}
        >
          Retirer ce membre ?
        </h3>
        <p
          style={{
            fontSize: 13,
            color: 'var(--bloom-text-muted)',
            marginBottom: 16,
            lineHeight: 1.55,
          }}
        >
          Le membre perdra l&apos;accès à l&apos;équipe et à toutes ses
          ressources. Cette action peut être inversée en l&apos;invitant à
          nouveau.
        </p>
        <Field
          label={`Pour confirmer, tape « ${keyword} » :`}
          htmlFor="confirm-remove"
        >
          <Input
            id="confirm-remove"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder={keyword}
            autoFocus
            disabled={busy}
          />
        </Field>
        <FieldError error={error} />
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <button
            type="button"
            onClick={submit}
            disabled={confirm !== keyword || busy}
            style={{
              background: '#EF4444',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              padding: '10px 18px',
              fontWeight: 700,
              fontSize: 13.5,
              cursor: confirm !== keyword || busy ? 'not-allowed' : 'pointer',
              opacity: confirm !== keyword || busy ? 0.5 : 1,
              fontFamily: 'inherit',
            }}
          >
            {busy ? '…' : 'Retirer le membre'}
          </button>
          <GhostButton type="button" onClick={onClose} disabled={busy}>
            Annuler
          </GhostButton>
        </div>
      </div>
    </div>
  )
}
