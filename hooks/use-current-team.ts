'use client'

import { useCallback, useEffect, useState } from 'react'
import { getUserTeamsAction, createTeamAction } from '@/lib/actions/teams'
import type { Team, ServiceError } from '@/lib/v3-types'

const STORAGE_KEY = 'bloom_active_team_id'
const SOLO_KEY = '__solo__'

/**
 * Manages the user's active team selection (persisted in localStorage).
 *
 * Returns:
 *  - `teams`: all teams the user is a member of
 *  - `currentTeam`: the active team object, or null in solo mode
 *  - `isSolo`: true if user picked "solo" (no team scope)
 *  - `setCurrentTeam(team | null)`: change the active selection
 *  - `createTeam({ name })`: create a new team and select it
 */
export function useCurrentTeam() {
  const [teams, setTeams] = useState<Team[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isSolo, setIsSolo] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<ServiceError | null>(null)

  // Restore from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === SOLO_KEY) {
      setIsSolo(true)
    } else if (saved) {
      setActiveId(saved)
    }
  }, [])

  const refetch = useCallback(async () => {
    setLoading(true)
    const r = await getUserTeamsAction()
    if (r.ok) {
      setTeams(r.data)
      setError(null)
      // If no saved selection and at least one team → default to first team
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (!saved && r.data[0] && !isSolo) {
          setActiveId(r.data[0].id)
          localStorage.setItem(STORAGE_KEY, r.data[0].id)
        }
        // If saved team no longer exists → fallback to solo
        if (saved && saved !== SOLO_KEY && !r.data.find((t) => t.id === saved)) {
          setActiveId(null)
          setIsSolo(true)
          localStorage.setItem(STORAGE_KEY, SOLO_KEY)
        }
      }
    } else {
      setError(r.error)
    }
    setLoading(false)
  }, [isSolo])

  useEffect(() => {
    void refetch()
  }, [refetch])

  const setCurrentTeam = useCallback((team: Team | null) => {
    if (team === null) {
      setIsSolo(true)
      setActiveId(null)
      if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, SOLO_KEY)
    } else {
      setIsSolo(false)
      setActiveId(team.id)
      if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, team.id)
    }
  }, [])

  const createTeam = useCallback(
    async (input: { name: string }) => {
      const r = await createTeamAction(input)
      if (r.ok) {
        setTeams((prev) => [r.data, ...prev])
        setCurrentTeam(r.data)
        return r.data
      } else {
        setError(r.error)
        throw new Error(r.error.message)
      }
    },
    [setCurrentTeam]
  )

  const currentTeam = activeId ? teams.find((t) => t.id === activeId) ?? null : null

  return {
    teams,
    currentTeam,
    /** null when isSolo OR while loading */
    teamId: currentTeam?.id ?? null,
    isSolo,
    loading,
    error,
    refetch,
    setCurrentTeam,
    createTeam,
  }
}
