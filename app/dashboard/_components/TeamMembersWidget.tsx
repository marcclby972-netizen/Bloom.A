'use client'

/**
 * Widget team-only "Équipe" — liste des memberships actifs avec rôle +
 * parts. Click "+ Inviter un associé" déclenche un prompt navigateur et
 * envoie l'invitation via `inviteMemberAction`.
 *
 * Note : les noms d'utilisateurs ne sont pas joints (cf. service
 * `getTeamMembers` qui retourne seulement `Membership`). On affiche un
 * identifiant court basé sur userId pour le moment.
 */

import { useEffect, useState } from 'react'
import type { Membership, TeamRole } from '@/lib/v3-types'
import {
  getTeamMembersAction,
  inviteMemberAction,
} from '@/lib/actions/teams'

const ROLE_LABEL: Record<TeamRole, string> = {
  founder: 'Fondateur',
  associate: 'Associé',
  guest: 'Invité',
}

const AV_CYCLE = ['av-a', 'av-b', 'av-c'] as const

function shortId(id: string): string {
  return id.slice(0, 2).toUpperCase()
}

export function TeamMembersWidget({ teamId }: { teamId: string }) {
  const [members, setMembers] = useState<Membership[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteBusy, setInviteBusy] = useState(false)

  const reload = async () => {
    const r = await getTeamMembersAction(teamId)
    if (r.ok) setMembers(r.data)
    setLoading(false)
  }

  useEffect(() => {
    setLoading(true)
    void reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId])

  const onInvite = async () => {
    const email = window.prompt('Email de l’associé à inviter :')
    if (!email) return
    setInviteBusy(true)
    try {
      await inviteMemberAction({
        teamId,
        email,
        role: 'associate',
      })
      await reload()
    } catch {
      window.alert("L'invitation a échoué — vérifie l'email.")
    } finally {
      setInviteBusy(false)
    }
  }

  return (
    <div className="widget w-span-4 team-only">
      <div className="w-head">
        <div className="w-title">
          <span className="ico">
            <svg viewBox="0 0 14 14" fill="none">
              <circle cx="4.5" cy="5" r="2" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="9.5" cy="6" r="1.6" stroke="currentColor" strokeWidth="1.5" />
              <path
                d="M1.5 12c0-1.7 1.3-3 3-3s3 1.3 3 3M8 12c0-1.3 1-2.4 2.3-2.4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </span>
          Équipe
        </div>
        <span className="w-meta">
          {members.length} associé{members.length > 1 ? 's' : ''}
        </span>
      </div>
      <div className="list" style={{ margin: '-6px' }}>
        {loading && members.length === 0 && (
          <div className="member-row" style={{ opacity: 0.5 }}>
            <span className="av av-a">…</span>
            <div className="info">
              <div className="nm">Chargement…</div>
            </div>
          </div>
        )}
        {!loading && members.length === 0 && (
          <div className="member-row" style={{ opacity: 0.6 }}>
            <span className="av av-a">?</span>
            <div className="info">
              <div className="nm">Aucun associé</div>
              <div className="role">Invite quelqu&apos;un pour démarrer</div>
            </div>
          </div>
        )}
        {members.map((m, idx) => {
          const av = AV_CYCLE[idx % AV_CYCLE.length]
          return (
            <div className="member-row" key={m.id}>
              <span className={`av ${av}`}>{shortId(m.userId)}</span>
              <div className="info">
                <div className="nm">Membre {idx + 1}</div>
                <div className="role">
                  {ROLE_LABEL[m.role]}
                  {m.shares !== null ? ` · ${m.shares}% parts` : ''}
                </div>
              </div>
              <span className="status-dot">Actif</span>
            </div>
          )
        })}
      </div>
      <button
        type="button"
        className="w-link"
        onClick={onInvite}
        disabled={inviteBusy}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          textAlign: 'left',
          cursor: 'pointer',
        }}
      >
        + {inviteBusy ? 'Envoi…' : 'Inviter un associé'}
      </button>
    </div>
  )
}
