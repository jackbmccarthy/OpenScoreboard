import { useEffect, useState } from 'react'

import {
  activateCapabilityToken,
  exchangeLegacyCapabilityLink,
  resolveCapabilityLink,
  type CapabilityRecord,
} from '@/functions/accessTokens'
import {
  subscribeToScoringStationRuntime,
  type ScoringStationRuntimeState,
} from '@/functions/liveSync'
import { isTableAccessRequired } from '@/functions/tables'
import type { LiveSyncStatus } from '@/lib/liveSync'
import type {
  Match as MatchRecord,
  ScheduledMatch,
  Table as TableRecord,
  TeamMatch as TeamMatchRecord,
} from '@/types/matches'

type UseScoringStationRuntimeArgs = {
  mode: 'table' | 'teamMatch'
  tableID?: string
  teamMatchID?: string
  activeTableNumber: string
  accessToken?: string | null
  user: unknown
  authLoading: boolean
}

type UseScoringStationRuntimeResult = {
  loading: boolean
  accessGranted: boolean
  passwordError: string
  tableInfo: TableRecord | null
  teamMatch: TeamMatchRecord | null
  matchID: string
  match: MatchRecord | null
  queue: Array<[string, ScheduledMatch]>
  history: NonNullable<ScoringStationRuntimeState['history']['value']>
  syncStatus: LiveSyncStatus
  syncError: string
  matchSyncStatus: LiveSyncStatus
  matchSyncError: string
  resolvedCapability: CapabilityRecord | null
  hasCapabilitySession: boolean
  sessionToken: string
  unlockTable: (secret: string) => Promise<void>
}

function getLinkInvalidMessage(mode: 'table' | 'teamMatch') {
  return mode === 'teamMatch'
    ? 'This scoring link is invalid, expired, or has been revoked.'
    : 'This scoring link is invalid, expired, or has been revoked.'
}

export function useScoringStationRuntime({
  mode,
  tableID,
  teamMatchID,
  activeTableNumber,
  accessToken,
  user,
  authLoading,
}: UseScoringStationRuntimeArgs): UseScoringStationRuntimeResult {
  const [loading, setLoading] = useState(true)
  const [accessGranted, setAccessGranted] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [resolvedCapability, setResolvedCapability] = useState<CapabilityRecord | null>(null)
  const [sessionToken, setSessionToken] = useState(accessToken || '')
  const [runtimeState, setRuntimeState] = useState<ScoringStationRuntimeState | null>(null)

  useEffect(() => {
    setSessionToken(accessToken || '')
  }, [accessToken])

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      if (authLoading) {
        return
      }

      if (user) {
        if (cancelled) return
        setResolvedCapability(null)
        setAccessGranted(true)
        setPasswordError('')
        return
      }

      if (mode === 'teamMatch') {
        if (!teamMatchID) {
          if (cancelled) return
          setAccessGranted(false)
          setLoading(false)
          return
        }

        if (!sessionToken) {
          if (cancelled) return
          setAccessGranted(false)
          setLoading(false)
          return
        }

        setLoading(true)
        try {
          const resolved = await resolveCapabilityLink(sessionToken, 'team_match_scoring')
          if (cancelled) return
          if (resolved?.record.teamMatchID === teamMatchID) {
            activateCapabilityToken(sessionToken)
            setResolvedCapability(resolved.record)
            setAccessGranted(true)
            setPasswordError('')
            return
          }

          setResolvedCapability(null)
          setAccessGranted(false)
          setPasswordError(getLinkInvalidMessage(mode))
          setLoading(false)
        } catch {
          if (cancelled) return
          setAccessGranted(false)
          setPasswordError(getLinkInvalidMessage(mode))
          setLoading(false)
        }
        return
      }

      if (!tableID) {
        if (cancelled) return
        setAccessGranted(false)
        setLoading(false)
        return
      }

      if (sessionToken) {
        setLoading(true)
        try {
          const resolved = await resolveCapabilityLink(sessionToken, 'table_scoring')
          if (cancelled) return
          const record = resolved?.record
          if (record?.tableID === tableID) {
            activateCapabilityToken(sessionToken)
            setResolvedCapability(record)
            setAccessGranted(true)
            setPasswordError('')
            return
          }

          setResolvedCapability(null)
          setAccessGranted(false)
          setPasswordError(getLinkInvalidMessage(mode))
          setLoading(false)
        } catch {
          if (cancelled) return
          setAccessGranted(false)
          setPasswordError(getLinkInvalidMessage(mode))
          setLoading(false)
        }
        return
      }

      setLoading(true)
      try {
        const requiresAccess = await isTableAccessRequired(tableID)
        if (cancelled) return
        if (!requiresAccess) {
          setAccessGranted(true)
          setPasswordError('')
          return
        }

        setAccessGranted(false)
        setLoading(false)
      } catch {
        if (cancelled) return
        setAccessGranted(false)
        setLoading(false)
      }
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [authLoading, mode, sessionToken, tableID, teamMatchID, user])

  useEffect(() => {
    if (!accessGranted) {
      setRuntimeState(null)
      return
    }

    if (mode === 'table') {
      if (!tableID) {
        setRuntimeState(null)
        setLoading(false)
        return
      }

      return subscribeToScoringStationRuntime({
        mode: 'table',
        tableID,
        token: sessionToken || undefined,
        capabilityType: 'table_scoring',
        watchLegacyAccess: !user && !sessionToken,
      }, (nextRuntimeState) => {
        setRuntimeState(nextRuntimeState)
        if (nextRuntimeState.accessToken.value) {
          setResolvedCapability(nextRuntimeState.accessToken.value)
        }
        if (!user && nextRuntimeState.accessToken.status === 'unauthorized') {
          setAccessGranted(false)
          setPasswordError(nextRuntimeState.accessToken.error || getLinkInvalidMessage(mode))
          setLoading(false)
          return
        }
        setLoading(nextRuntimeState.table.status === 'loading' && !nextRuntimeState.table.value)
      })
    }

    if (!teamMatchID) {
      setRuntimeState(null)
      setLoading(false)
      return
    }

    return subscribeToScoringStationRuntime({
      mode: 'teamMatch',
      teamMatchID,
      tableNumber: activeTableNumber,
      token: sessionToken || undefined,
      capabilityType: 'team_match_scoring',
    }, (nextRuntimeState) => {
      setRuntimeState(nextRuntimeState)
      if (nextRuntimeState.accessToken.value) {
        setResolvedCapability(nextRuntimeState.accessToken.value)
      }
      if (!user && nextRuntimeState.accessToken.status === 'unauthorized') {
        setAccessGranted(false)
        setPasswordError(nextRuntimeState.accessToken.error || getLinkInvalidMessage(mode))
        setLoading(false)
        return
      }
      setLoading(nextRuntimeState.teamMatch.status === 'loading' && !nextRuntimeState.teamMatch.value)
    })
  }, [accessGranted, activeTableNumber, mode, sessionToken, tableID, teamMatchID, user])

  const unlockTable = async (secret: string) => {
    try {
      const exchanged = await exchangeLegacyCapabilityLink({
        capabilityType: 'table_scoring',
        tableID: tableID || '',
        secret,
      })
      activateCapabilityToken(exchanged.token)
      setSessionToken(exchanged.token)
      setResolvedCapability(exchanged.record)
      setAccessGranted(true)
      setPasswordError('')
      setLoading(true)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Incorrect password'
      setPasswordError(message)
      throw error
    }
  }

  return {
    loading,
    accessGranted,
    passwordError,
    tableInfo: runtimeState?.table.value || null,
    teamMatch: runtimeState?.teamMatch.value || null,
    matchID: runtimeState?.currentMatchID || '',
    match: runtimeState?.currentMatch.value || null,
    queue: runtimeState?.queue.value || [],
    history: runtimeState?.history.value || [],
    syncStatus: runtimeState?.connection.status || (loading ? 'loading' : 'idle'),
    syncError: runtimeState?.connection.error || '',
    matchSyncStatus: runtimeState?.currentMatch.status || 'idle',
    matchSyncError: runtimeState?.currentMatch.error || '',
    resolvedCapability,
    hasCapabilitySession: Boolean(sessionToken || resolvedCapability),
    sessionToken,
    unlockTable,
  }
}
