'use client'

/**
 * Settings v3 — page complète refondue avec backend câblé.
 *
 * Layout : DashboardShell + 2 colonnes (nav scroll-spy à gauche, sections
 * à droite). Sections : Profil, Compte (email/password), Notifications,
 * Apparence (theme switcher), Équipe (rename + members + invite), Données
 * (export RGPD), Zone de danger (delete account).
 *
 * Toutes les sections sont fonctionnelles — actions back-end créées au
 * besoin dans lib/actions/users.ts et lib/actions/teams.ts.
 */

import {
  DashboardShell,
  PageHeader,
} from '../dashboard/_components/DashboardShell'
import { useCurrentTeam } from '@/hooks'
import { SettingsNav, type NavItem } from './_components/SettingsNav'
import { ProfileSection } from './_components/ProfileSection'
import { AccountSection } from './_components/AccountSection'
import { NotificationsSection } from './_components/NotificationsSection'
import { AppearanceSection } from './_components/AppearanceSection'
import { TeamSection } from './_components/TeamSection'
import { DataSection } from './_components/DataSection'
import { DangerZone } from './_components/DangerZone'

const NAV_ITEMS: NavItem[] = [
  {
    id: 'profile',
    label: 'Profil',
    icon: (
      <svg viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="6" r="3" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M3 16c0-3 2.7-5 6-5s6 2 6 5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    id: 'account',
    label: 'Compte',
    icon: (
      <svg viewBox="0 0 18 18" fill="none">
        <rect
          x="3"
          y="7"
          width="12"
          height="8"
          rx="1.5"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M5.5 7V5a3.5 3.5 0 017 0v2"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
    ),
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: (
      <svg viewBox="0 0 18 18" fill="none">
        <path
          d="M4.5 13.5h9l-1-1.5V8.5A3.5 3.5 0 009 5a3.5 3.5 0 00-3.5 3.5v3.5l-1 1.5zM7.5 15a1.5 1.5 0 003 0"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: 'appearance',
    label: 'Apparence',
    icon: (
      <svg viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M9 2.5v13M2.5 9h13" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    id: 'team',
    label: 'Équipe',
    icon: (
      <svg viewBox="0 0 18 18" fill="none">
        <circle cx="6" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="13" cy="7" r="2" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M2 14c0-2.2 1.8-4 4-4s4 1.8 4 4M11 14c0-1.7 1.3-3 3-3"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
    teamOnly: true,
  },
  {
    id: 'data',
    label: 'Mes données',
    icon: (
      <svg viewBox="0 0 18 18" fill="none">
        <ellipse
          cx="9"
          cy="4.5"
          rx="6"
          ry="2.5"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M3 4.5v9c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-9"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
    ),
  },
  {
    id: 'danger',
    label: 'Zone de danger',
    icon: (
      <svg viewBox="0 0 18 18" fill="none">
        <path
          d="M9 2L1 16h16L9 2zM9 7v4M9 13.5h.01"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
]

export default function SettingsPage() {
  return (
    <DashboardShell screenLabel="Settings">
      <SettingsContent />
    </DashboardShell>
  )
}

function SettingsContent() {
  const { teamId } = useCurrentTeam()

  return (
    <>
      <PageHeader eyebrow="Compte" title="Paramètres" />

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 32,
        }}
      >
        <SettingsNav items={NAV_ITEMS} showTeamOnly={teamId !== null} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <ProfileSection />
          <AccountSection />
          <NotificationsSection />
          <AppearanceSection />
          {teamId && <TeamSection />}
          <DataSection />
          <DangerZone />
        </div>
      </div>
    </>
  )
}
