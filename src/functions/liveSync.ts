import type { Match, ScheduledMatch, Table, TeamMatch } from '@/types/matches'
import {
  createInitialLiveSyncState,
  createLiveSyncState,
  createSubscriptionRegistry,
  mapRealtimeState,
  type LiveSyncState,
} from '@/lib/liveSync'
import { subscribeToPathState, type RealtimeUnsubscribe } from '@/lib/realtime'
import { getRecentPointHistory, subscribeToMatchData } from './scoring'
import { resolveCapabilityLink, type CapabilityRecord, type CapabilityType } from './accessTokens'
import { sortScheduledMatchEntries } from './scoring'
import { subscribeToTable } from './tables'
import { subscribeToTeamMatch, subscribeToTeamMatchCurrentMatch } from './teammatches'

type MatchHistoryEntry = ReturnType<typeof getRecentPointHistory>

export type TableRuntimeState = {
  table: LiveSyncState<Table | null>
  currentMatch: LiveSyncState<Match | null>
  queue: LiveSyncState<Array<[string, ScheduledMatch]>>
  history: LiveSyncState<MatchHistoryEntry>
  accessToken: LiveSyncState<CapabilityRecord | null>
  currentMatchID: string
}

export type TeamMatchRuntimeState = {
  teamMatch: LiveSyncState<TeamMatch | null>
  currentMatch: LiveSyncState<Match | null>
  queue: LiveSyncState<Array<[string, ScheduledMatch]>>
  history: LiveSyncState<MatchHistoryEntry>
  accessToken: LiveSyncState<CapabilityRecord | null>
  currentMatchID: string
}

function buildQueueState(
  status: LiveSyncState<unknown>['status'],
  updatedAt: string,
  scheduledMatches: Record<string, ScheduledMatch> | null | undefined,
) {
  const queueEntries = scheduledMatches && typeof scheduledMatches === 'object'
    ? sortScheduledMatchEntries(Object.entries(scheduledMatches))
    : []

  return createLiveSyncState<Array<[string, ScheduledMatch]>>({
    status,
    value: queueEntries,
    updatedAt,
  })
}

function createIdleMatchState() {
  return createInitialLiveSyncState<Match | null>('idle', null)
}

function createIdleHistoryState() {
  return createInitialLiveSyncState<MatchHistoryEntry>('idle', [])
}

export function watchCapabilityState(
  token: string,
  capabilityType: CapabilityType,
  callback: (state: LiveSyncState<CapabilityRecord | null>) => void,
  intervalMs = 5000,
): RealtimeUnsubscribe {
  let cancelled = false
  let lastRecord: CapabilityRecord | null = null
  let intervalID: number | null = null

  const publish = (state: LiveSyncState<CapabilityRecord | null>) => {
    if (!cancelled) {
      callback(state)
    }
  }

  const poll = async () => {
    if (cancelled) {
      return
    }

    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      publish(createLiveSyncState({
        status: 'offline',
        value: lastRecord,
        updatedAt: new Date().toISOString(),
      }))
      return
    }

    try {
      const resolved = await resolveCapabilityLink(token, capabilityType)
      if (!resolved?.record) {
        publish(createLiveSyncState({
          status: 'unauthorized',
          value: null,
          updatedAt: new Date().toISOString(),
        }))
        return
      }

      lastRecord = resolved.record
      publish(createLiveSyncState({
        status: 'live',
        value: resolved.record,
        updatedAt: new Date().toISOString(),
      }))
    } catch (error) {
      publish(createLiveSyncState({
        status: 'error',
        value: lastRecord,
        error: error instanceof Error ? error.message : 'Failed to validate access token',
        updatedAt: new Date().toISOString(),
      }))
    }
  }

  const handleOnline = () => {
    publish(createLiveSyncState({
      status: 'loading',
      value: lastRecord,
      updatedAt: new Date().toISOString(),
    }))
    void poll()
  }

  const handleOffline = () => {
    publish(createLiveSyncState({
      status: 'offline',
      value: lastRecord,
      updatedAt: new Date().toISOString(),
    }))
  }

  publish(createLiveSyncState({
    status: typeof navigator !== 'undefined' && navigator.onLine === false ? 'offline' : 'loading',
    value: null,
  }))
  void poll()

  if (typeof window !== 'undefined') {
    intervalID = window.setInterval(() => {
      void poll()
    }, intervalMs)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
  }

  return () => {
    cancelled = true
    if (intervalID !== null && typeof window !== 'undefined') {
      window.clearInterval(intervalID)
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }
}

export function subscribeToTableRuntime(
  {
    tableID,
    token,
    capabilityType = 'table_scoring',
  }: {
    tableID: string
    token?: string | null
    capabilityType?: CapabilityType
  },
  callback: (state: TableRuntimeState) => void,
): RealtimeUnsubscribe {
  const subscriptions = createSubscriptionRegistry()
  let currentMatchID = ''
  let currentState: TableRuntimeState = {
    table: createInitialLiveSyncState<Table | null>('loading', null),
    currentMatch: createIdleMatchState(),
    queue: createInitialLiveSyncState<Array<[string, ScheduledMatch]>>('loading', []),
    history: createIdleHistoryState(),
    accessToken: createInitialLiveSyncState<CapabilityRecord | null>(token ? 'loading' : 'idle', null),
    currentMatchID: '',
  }

  const emit = () => {
    callback({
      ...currentState,
      currentMatchID,
    })
  }

  const syncCurrentMatch = (nextMatchID: string) => {
    if (currentMatchID === nextMatchID) {
      return
    }

    currentMatchID = nextMatchID
    subscriptions.remove('match-state')
    subscriptions.remove('match-data')

    if (!nextMatchID) {
      currentState = {
        ...currentState,
        currentMatch: createIdleMatchState(),
        history: createIdleHistoryState(),
      }
      emit()
      return
    }

    currentState = {
      ...currentState,
      currentMatch: createInitialLiveSyncState<Match | null>('loading', null),
      history: createInitialLiveSyncState<MatchHistoryEntry>('loading', []),
    }
    emit()

    subscriptions.replace('match-state', subscribeToPathState(`matches/${nextMatchID}`, (state) => {
      currentState = {
        ...currentState,
        currentMatch: {
          ...currentState.currentMatch,
          ...mapRealtimeState<Match | null>(state as never),
        },
        history: createLiveSyncState({
          status: state.status,
          value: currentState.history.value || [],
          error: state.error,
          updatedAt: state.updatedAt,
        }),
      }
      emit()
    }))
    subscriptions.replace('match-data', subscribeToMatchData(nextMatchID, (match) => {
      currentState = {
        ...currentState,
        currentMatch: {
          ...currentState.currentMatch,
          value: match,
          updatedAt: new Date().toISOString(),
        },
        history: {
          ...currentState.history,
          value: getRecentPointHistory(match),
          updatedAt: new Date().toISOString(),
        },
      }
      emit()
    }))
  }

  subscriptions.replace('table-state', subscribeToPathState(`tables/${tableID}`, (state) => {
    currentState = {
      ...currentState,
      table: {
        ...currentState.table,
        ...mapRealtimeState<Table | null>(state as never),
      },
      queue: createLiveSyncState({
        status: state.status,
        value: currentState.queue.value || [],
        error: state.error,
        updatedAt: state.updatedAt,
      }),
    }
    emit()
  }))
  subscriptions.replace('table-data', subscribeToTable(tableID, (table) => {
    currentState = {
      ...currentState,
      table: {
        ...currentState.table,
        value: table,
        updatedAt: new Date().toISOString(),
      },
      queue: buildQueueState(
        currentState.table.status,
        new Date().toISOString(),
        table?.scheduledMatches as Record<string, ScheduledMatch> | undefined,
      ),
    }
    syncCurrentMatch(typeof table?.currentMatch === 'string' ? table.currentMatch : '')
    emit()
  }))

  if (token) {
    subscriptions.replace('access-token', watchCapabilityState(token, capabilityType, (accessToken) => {
      currentState = {
        ...currentState,
        accessToken,
      }
      emit()
    }))
  }

  emit()

  return () => {
    subscriptions.clear()
  }
}

export function subscribeToTeamMatchRuntime(
  {
    teamMatchID,
    tableNumber,
    token,
    capabilityType = 'team_match_scoring',
  }: {
    teamMatchID: string
    tableNumber: string
    token?: string | null
    capabilityType?: CapabilityType
  },
  callback: (state: TeamMatchRuntimeState) => void,
): RealtimeUnsubscribe {
  const subscriptions = createSubscriptionRegistry()
  let currentMatchID = ''
  let currentState: TeamMatchRuntimeState = {
    teamMatch: createInitialLiveSyncState<TeamMatch | null>('loading', null),
    currentMatch: createIdleMatchState(),
    queue: createInitialLiveSyncState<Array<[string, ScheduledMatch]>>('loading', []),
    history: createIdleHistoryState(),
    accessToken: createInitialLiveSyncState<CapabilityRecord | null>(token ? 'loading' : 'idle', null),
    currentMatchID: '',
  }

  const emit = () => {
    callback({
      ...currentState,
      currentMatchID,
    })
  }

  const syncCurrentMatch = (nextMatchID: string) => {
    if (currentMatchID === nextMatchID) {
      return
    }

    currentMatchID = nextMatchID
    subscriptions.remove('match-state')
    subscriptions.remove('match-data')

    if (!nextMatchID) {
      currentState = {
        ...currentState,
        currentMatch: createIdleMatchState(),
        history: createIdleHistoryState(),
      }
      emit()
      return
    }

    currentState = {
      ...currentState,
      currentMatch: createInitialLiveSyncState<Match | null>('loading', null),
      history: createInitialLiveSyncState<MatchHistoryEntry>('loading', []),
    }
    emit()

    subscriptions.replace('match-state', subscribeToPathState(`matches/${nextMatchID}`, (state) => {
      currentState = {
        ...currentState,
        currentMatch: {
          ...currentState.currentMatch,
          ...mapRealtimeState<Match | null>(state as never),
        },
        history: createLiveSyncState({
          status: state.status,
          value: currentState.history.value || [],
          error: state.error,
          updatedAt: state.updatedAt,
        }),
      }
      emit()
    }))
    subscriptions.replace('match-data', subscribeToMatchData(nextMatchID, (match) => {
      currentState = {
        ...currentState,
        currentMatch: {
          ...currentState.currentMatch,
          value: match,
          updatedAt: new Date().toISOString(),
        },
        history: {
          ...currentState.history,
          value: getRecentPointHistory(match),
          updatedAt: new Date().toISOString(),
        },
      }
      emit()
    }))
  }

  subscriptions.replace('team-match-state', subscribeToPathState(`teamMatches/${teamMatchID}`, (state) => {
    currentState = {
      ...currentState,
      teamMatch: {
        ...currentState.teamMatch,
        ...mapRealtimeState<TeamMatch | null>(state as never),
      },
      queue: createLiveSyncState({
        status: state.status,
        value: currentState.queue.value || [],
        error: state.error,
        updatedAt: state.updatedAt,
      }),
    }
    emit()
  }))
  subscriptions.replace('team-match-data', subscribeToTeamMatch(teamMatchID, (teamMatch) => {
    currentState = {
      ...currentState,
      teamMatch: {
        ...currentState.teamMatch,
        value: teamMatch,
        updatedAt: new Date().toISOString(),
      },
      queue: buildQueueState(
        currentState.teamMatch.status,
        new Date().toISOString(),
        teamMatch?.scheduledMatches as Record<string, ScheduledMatch> | undefined,
      ),
    }
    const currentMatches = teamMatch?.currentMatches && typeof teamMatch.currentMatches === 'object'
      ? teamMatch.currentMatches as Record<string, string>
      : {}
    syncCurrentMatch(currentMatches[tableNumber] || '')
    emit()
  }))
  subscriptions.replace('team-match-current', subscribeToTeamMatchCurrentMatch(teamMatchID, tableNumber, (nextMatchID) => {
    syncCurrentMatch(nextMatchID)
  }))

  if (token) {
    subscriptions.replace('access-token', watchCapabilityState(token, capabilityType, (accessToken) => {
      currentState = {
        ...currentState,
        accessToken,
      }
      emit()
    }))
  }

  emit()

  return () => {
    subscriptions.clear()
  }
}
