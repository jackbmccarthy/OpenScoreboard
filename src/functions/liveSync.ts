import type { Match, ScheduledMatch, Table, TeamMatch } from '@/types/matches'
import {
  combineLiveSyncStates,
  createInitialLiveSyncState,
  createLiveSyncState,
  createSubscriptionRegistry,
  type LiveSyncState,
} from '@/lib/liveSync'
import { subscribeToPathState, type RealtimeState, type RealtimeUnsubscribe } from '@/lib/realtime'
import { getRecentPointHistory } from './scoring'
import { resolveCapabilityLink, type CapabilityRecord, type CapabilityType } from './accessTokens'
import { sanitizeClientAccessRecord } from './accessSecrets'
import { isRecordActive } from './deletion'
import { sortScheduledMatchEntries } from './scoring'
import { normalizeMatchSchema, normalizeTeamMatchSchema } from './matchSchema'

type MatchHistoryEntry = ReturnType<typeof getRecentPointHistory>

export type RuntimeConnectionState = LiveSyncState<null>

export type RuntimeSyncChannels = {
  table: LiveSyncState<Table | null>
  teamMatch: LiveSyncState<TeamMatch | null>
  currentMatch: LiveSyncState<Match | null>
  queue: LiveSyncState<Array<[string, ScheduledMatch]>>
  history: LiveSyncState<MatchHistoryEntry>
  accessToken: LiveSyncState<CapabilityRecord | null>
}

export type TableRuntimeState = {
  connection: RuntimeConnectionState
  channels: RuntimeSyncChannels
  table: LiveSyncState<Table | null>
  teamMatch: LiveSyncState<TeamMatch | null>
  currentMatch: LiveSyncState<Match | null>
  queue: LiveSyncState<Array<[string, ScheduledMatch]>>
  history: LiveSyncState<MatchHistoryEntry>
  accessToken: LiveSyncState<CapabilityRecord | null>
  currentMatchID: string
}

export type TeamMatchRuntimeState = {
  connection: RuntimeConnectionState
  channels: RuntimeSyncChannels
  table: LiveSyncState<Table | null>
  teamMatch: LiveSyncState<TeamMatch | null>
  currentMatch: LiveSyncState<Match | null>
  queue: LiveSyncState<Array<[string, ScheduledMatch]>>
  history: LiveSyncState<MatchHistoryEntry>
  accessToken: LiveSyncState<CapabilityRecord | null>
  currentMatchID: string
}

export type ScoringStationRuntimeState =
  | ({ mode: 'table' } & TableRuntimeState)
  | ({ mode: 'teamMatch' } & TeamMatchRuntimeState)

type TableRuntimeOptions = {
  tableID: string
  token?: string | null
  capabilityType?: CapabilityType
  watchLegacyAccess?: boolean
}

type TeamMatchRuntimeOptions = {
  teamMatchID: string
  tableNumber: string
  token?: string | null
  capabilityType?: CapabilityType
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

function createIdleTableState() {
  return createInitialLiveSyncState<Table | null>('idle', null)
}

function createIdleTeamMatchState() {
  return createInitialLiveSyncState<TeamMatch | null>('idle', null)
}

function createIdleHistoryState() {
  return createInitialLiveSyncState<MatchHistoryEntry>('idle', [])
}

function buildAccessMarker(tableValue: Partial<Table> | null) {
  return [
    tableValue?.accessRequired ? 'required' : 'open',
    tableValue?.accessSecretMode || '',
    tableValue?.passwordUpdatedAt || '',
    tableValue?.legacyAccess?.enabledUntil || '',
    tableValue?.legacyAccess?.retiredAt || '',
  ].join(':')
}

function normalizeMatchState(state: RealtimeState<unknown>) {
  const matchValue = state.value && typeof state.value === 'object'
    ? normalizeMatchSchema(state.value as Record<string, unknown> | null) as Match | null
    : null

  return createLiveSyncState<Match | null>({
    status: state.status,
    value: matchValue,
    error: state.error,
    updatedAt: state.updatedAt,
  })
}

function normalizeTeamMatchState(state: RealtimeState<unknown>) {
  const teamMatchValue = state.value && typeof state.value === 'object'
    ? normalizeTeamMatchSchema(state.value as Record<string, unknown> | null) as TeamMatch | null
    : null
  const activeTeamMatch = isRecordActive(teamMatchValue) ? teamMatchValue : null

  return createLiveSyncState<TeamMatch | null>({
    status: state.status,
    value: activeTeamMatch,
    error: state.error,
    updatedAt: state.updatedAt,
  })
}

function normalizeTableState(state: RealtimeState<unknown>) {
  const tableValue = state.value && typeof state.value === 'object' && isRecordActive(state.value)
    ? sanitizeClientAccessRecord(state.value as Table)
    : null

  return createLiveSyncState<Table | null>({
    status: state.status,
    value: tableValue,
    error: state.error,
    updatedAt: state.updatedAt,
  })
}

function buildRuntimeConnectionState(channels: RuntimeSyncChannels) {
  return combineLiveSyncStates([
    channels.table,
    channels.teamMatch,
    channels.currentMatch,
    channels.queue,
    channels.history,
    channels.accessToken,
  ], 'idle')
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
    watchLegacyAccess = false,
  }: TableRuntimeOptions,
  callback: (state: TableRuntimeState) => void,
): RealtimeUnsubscribe {
  const subscriptions = createSubscriptionRegistry()
  let currentMatchID = ''
  let lastAccessMarker = ''
  let hasSeenInitialTableValue = false
  let currentState: TableRuntimeState = {
    connection: createInitialLiveSyncState<null>('loading', null),
    channels: {
      table: createInitialLiveSyncState<Table | null>('loading', null),
      teamMatch: createIdleTeamMatchState(),
      currentMatch: createIdleMatchState(),
      queue: createInitialLiveSyncState<Array<[string, ScheduledMatch]>>('loading', []),
      history: createIdleHistoryState(),
      accessToken: createInitialLiveSyncState<CapabilityRecord | null>(token ? 'loading' : 'idle', null),
    },
    table: createInitialLiveSyncState<Table | null>('loading', null),
    teamMatch: createIdleTeamMatchState(),
    currentMatch: createIdleMatchState(),
    queue: createInitialLiveSyncState<Array<[string, ScheduledMatch]>>('loading', []),
    history: createIdleHistoryState(),
    accessToken: createInitialLiveSyncState<CapabilityRecord | null>(token ? 'loading' : 'idle', null),
    currentMatchID: '',
  }

  const emit = () => {
    const channels: RuntimeSyncChannels = {
      table: currentState.table,
      teamMatch: currentState.teamMatch,
      currentMatch: currentState.currentMatch,
      queue: currentState.queue,
      history: currentState.history,
      accessToken: currentState.accessToken,
    }
    callback({
      ...currentState,
      connection: buildRuntimeConnectionState(channels),
      channels,
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
      const matchState = normalizeMatchState(state)
      currentState = {
        ...currentState,
        currentMatch: matchState,
        history: {
          status: state.status,
          value: getRecentPointHistory(matchState.value),
          error: state.error,
          updatedAt: state.updatedAt,
        },
      }
      emit()
    }))
  }

  subscriptions.replace('table-state', subscribeToPathState(`tables/${tableID}`, (state) => {
    const tableState = normalizeTableState(state)
    const rawTableValue = state.value && typeof state.value === 'object'
      ? state.value as Partial<Table>
      : null
    const nextAccessMarker = rawTableValue ? buildAccessMarker(rawTableValue) : ''

    currentState = {
      ...currentState,
      table: tableState,
      queue: buildQueueState(
        tableState.status,
        state.updatedAt,
        tableState.value?.scheduledMatches as Record<string, ScheduledMatch> | undefined,
      ),
    }

    if (watchLegacyAccess) {
      if (!hasSeenInitialTableValue) {
        hasSeenInitialTableValue = true
      } else if (nextAccessMarker && nextAccessMarker !== lastAccessMarker) {
        currentState = {
          ...currentState,
          accessToken: createLiveSyncState({
            status: 'unauthorized',
            value: currentState.accessToken.value,
            error: 'The table password changed. Re-enter it to continue scoring.',
            updatedAt: state.updatedAt,
          }),
        }
      } else if (currentState.accessToken.status === 'idle') {
        currentState = {
          ...currentState,
          accessToken: createLiveSyncState({
            status: tableState.status === 'loading' ? 'loading' : 'live',
            value: null,
            updatedAt: state.updatedAt,
          }),
        }
      }
      lastAccessMarker = nextAccessMarker
    }

    syncCurrentMatch(typeof tableState.value?.currentMatch === 'string' ? tableState.value.currentMatch : '')
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
  }: TeamMatchRuntimeOptions,
  callback: (state: TeamMatchRuntimeState) => void,
): RealtimeUnsubscribe {
  const subscriptions = createSubscriptionRegistry()
  let currentMatchID = ''
  let currentState: TeamMatchRuntimeState = {
    connection: createInitialLiveSyncState<null>('loading', null),
    channels: {
      table: createIdleTableState(),
      teamMatch: createInitialLiveSyncState<TeamMatch | null>('loading', null),
      currentMatch: createIdleMatchState(),
      queue: createInitialLiveSyncState<Array<[string, ScheduledMatch]>>('loading', []),
      history: createIdleHistoryState(),
      accessToken: createInitialLiveSyncState<CapabilityRecord | null>(token ? 'loading' : 'idle', null),
    },
    table: createIdleTableState(),
    teamMatch: createInitialLiveSyncState<TeamMatch | null>('loading', null),
    currentMatch: createIdleMatchState(),
    queue: createInitialLiveSyncState<Array<[string, ScheduledMatch]>>('loading', []),
    history: createIdleHistoryState(),
    accessToken: createInitialLiveSyncState<CapabilityRecord | null>(token ? 'loading' : 'idle', null),
    currentMatchID: '',
  }

  const emit = () => {
    const channels: RuntimeSyncChannels = {
      table: currentState.table,
      teamMatch: currentState.teamMatch,
      currentMatch: currentState.currentMatch,
      queue: currentState.queue,
      history: currentState.history,
      accessToken: currentState.accessToken,
    }
    callback({
      ...currentState,
      connection: buildRuntimeConnectionState(channels),
      channels,
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
      const matchState = normalizeMatchState(state)
      currentState = {
        ...currentState,
        currentMatch: matchState,
        history: {
          status: state.status,
          value: getRecentPointHistory(matchState.value),
          error: state.error,
          updatedAt: state.updatedAt,
        },
      }
      emit()
    }))
  }

  subscriptions.replace('team-match-state', subscribeToPathState(`teamMatches/${teamMatchID}`, (state) => {
    const teamMatchState = normalizeTeamMatchState(state)
    const currentMatches = teamMatchState.value?.currentMatches && typeof teamMatchState.value.currentMatches === 'object'
      ? teamMatchState.value.currentMatches as Record<string, string>
      : {}

    currentState = {
      ...currentState,
      teamMatch: teamMatchState,
      queue: buildQueueState(
        teamMatchState.status,
        state.updatedAt,
        teamMatchState.value?.scheduledMatches as Record<string, ScheduledMatch> | undefined,
      ),
    }
    syncCurrentMatch(currentMatches[tableNumber] || '')
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

export function subscribeToScoringStationRuntime(
  options: ({ mode: 'table' } & TableRuntimeOptions) | ({ mode: 'teamMatch' } & TeamMatchRuntimeOptions),
  callback: (state: ScoringStationRuntimeState) => void,
): RealtimeUnsubscribe {
  if (options.mode === 'table') {
    return subscribeToTableRuntime(options, (state) => {
      callback({
        mode: 'table',
        ...state,
      })
    })
  }

  return subscribeToTeamMatchRuntime(options, (state) => {
    callback({
      mode: 'teamMatch',
      ...state,
    })
  })
}
