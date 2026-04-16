import type { RealtimeState, RealtimeStatus, RealtimeUnsubscribe } from './realtime'
import { subscribeToPathValue } from './realtime'

export type LiveSyncStatus = RealtimeStatus | 'unauthorized' | 'conflict'

export type LiveSyncState<T = unknown> = {
  status: LiveSyncStatus
  value: T | null
  error: string
  updatedAt: string
}

type OwnedCanonicalCollectionOptions<Preview, Canonical, Row> = {
  ownerPath: string
  getCanonicalID: (preview: Preview, myID: string) => string
  getCanonicalPath: (canonicalID: string, preview: Preview, myID: string) => string
  isCanonicalActive?: (canonical: Canonical | null) => boolean
  buildRow: (args: {
    myID: string
    preview: Preview
    canonicalID: string
    canonical: Canonical
  }) => Row | null
}

export function createInitialLiveSyncState<T = unknown>(
  status: LiveSyncStatus = 'idle',
  value: T | null = null,
): LiveSyncState<T> {
  return {
    status,
    value,
    error: '',
    updatedAt: '',
  }
}

export function createLiveSyncState<T = unknown>(
  next: Partial<LiveSyncState<T>> & Pick<LiveSyncState<T>, 'status'>,
): LiveSyncState<T> {
  return {
    value: null,
    error: '',
    updatedAt: '',
    ...next,
  }
}

export function mapRealtimeState<T = unknown>(state: RealtimeState<T>): LiveSyncState<T> {
  return {
    status: state.status,
    value: state.value,
    error: state.error,
    updatedAt: state.updatedAt,
  }
}

export function createSubscriptionRegistry() {
  const subscriptions = new Map<string, RealtimeUnsubscribe>()

  return {
    replace(key: string, unsubscribe: RealtimeUnsubscribe) {
      subscriptions.get(key)?.()
      subscriptions.set(key, unsubscribe)
    },
    remove(key: string) {
      subscriptions.get(key)?.()
      subscriptions.delete(key)
    },
    clear() {
      Array.from(subscriptions.values()).forEach((unsubscribe) => unsubscribe())
      subscriptions.clear()
    },
  }
}

export function getLiveSyncLabel(status: LiveSyncStatus) {
  switch (status) {
    case 'loading':
      return 'Connecting'
    case 'stale':
      return 'Reconnecting'
    case 'offline':
      return 'Offline'
    case 'error':
      return 'Error'
    case 'unauthorized':
      return 'Unauthorized'
    case 'conflict':
      return 'Conflict'
    case 'live':
      return 'Live'
    default:
      return 'Idle'
  }
}

export function getLiveSyncMessage(status: LiveSyncStatus, error = '') {
  if (status === 'error') {
    return error || 'Live updates are unavailable right now.'
  }
  if (status === 'offline') {
    return 'You are offline. Live updates will resume when the network returns.'
  }
  if (status === 'stale') {
    return 'Reconnecting to live updates…'
  }
  if (status === 'loading') {
    return 'Connecting to live updates…'
  }
  if (status === 'unauthorized') {
    return 'Your session is no longer authorized for this live view.'
  }
  if (status === 'conflict') {
    return 'Another session changed this record at the same time. Review the latest data before continuing.'
  }
  return ''
}

const liveSyncStatusPriority: Record<LiveSyncStatus, number> = {
  unauthorized: 0,
  error: 1,
  offline: 2,
  conflict: 3,
  stale: 4,
  loading: 5,
  live: 6,
  idle: 7,
}

export function compareLiveSyncStates(
  left: Pick<LiveSyncState<unknown>, 'status'>,
  right: Pick<LiveSyncState<unknown>, 'status'>,
) {
  return liveSyncStatusPriority[left.status] - liveSyncStatusPriority[right.status]
}

export function getDominantLiveSyncState<T = unknown>(
  states: Array<LiveSyncState<T> | null | undefined>,
  fallbackStatus: LiveSyncStatus = 'idle',
): LiveSyncState<T | null> {
  const activeStates = states.filter(Boolean) as LiveSyncState<T>[]
  if (activeStates.length === 0) {
    return createInitialLiveSyncState<T | null>(fallbackStatus, null)
  }

  const dominantState = activeStates.reduce((current, candidate) => (
    compareLiveSyncStates(candidate, current) < 0 ? candidate : current
  ))
  const firstError = activeStates.find((state) => state.error)?.error || dominantState.error
  const latestUpdatedAt = activeStates
    .map((state) => state.updatedAt)
    .filter(Boolean)
    .sort()
    .at(-1) || dominantState.updatedAt

  return createLiveSyncState<T | null>({
    status: dominantState.status,
    value: dominantState.value ?? null,
    error: firstError,
    updatedAt: latestUpdatedAt,
  })
}

export function combineLiveSyncStates(
  states: Array<LiveSyncState<unknown> | null | undefined>,
  fallbackStatus: LiveSyncStatus = 'idle',
) {
  const dominantState = getDominantLiveSyncState(states, fallbackStatus)
  return createLiveSyncState<null>({
    status: dominantState.status,
    value: null,
    error: dominantState.error,
    updatedAt: dominantState.updatedAt,
  })
}

export function subscribeToOwnedCanonicalCollection<Preview, Canonical, Row>(
  options: OwnedCanonicalCollectionOptions<Preview, Canonical, Row>,
  callback: (rows: Array<[string, Row]>) => void,
): RealtimeUnsubscribe {
  const ownerOrder: string[] = []
  const previews = new Map<string, Preview>()
  const canonicalIDs = new Map<string, string>()
  const canonicalValues = new Map<string, Canonical>()
  const rows = new Map<string, [string, Row]>()
  const subscriptions = createSubscriptionRegistry()
  const isCanonicalActive = options.isCanonicalActive || ((canonical) => canonical !== null)

  const emitRows = () => {
    callback(ownerOrder.map((myID) => rows.get(myID)).filter(Boolean) as Array<[string, Row]>)
  }

  const removeRow = (myID: string) => {
    subscriptions.remove(myID)
    previews.delete(myID)
    canonicalIDs.delete(myID)
    canonicalValues.delete(myID)
    rows.delete(myID)
  }

  const updateRow = (myID: string, preview = previews.get(myID)) => {
    if (!preview) {
      rows.delete(myID)
      emitRows()
      return
    }

    const canonicalID = canonicalIDs.get(myID) || ''
    const canonical = canonicalValues.get(myID)
    if (!canonicalID || !canonical || !isCanonicalActive(canonical)) {
      rows.delete(myID)
      emitRows()
      return
    }

    const nextRow = options.buildRow({
      myID,
      preview,
      canonicalID,
      canonical,
    })

    if (!nextRow) {
      rows.delete(myID)
    } else {
      rows.set(myID, [myID, nextRow])
    }
    emitRows()
  }

  const subscribeToCanonical = (myID: string, preview: Preview) => {
    const canonicalID = options.getCanonicalID(preview, myID)
    const previousCanonicalID = canonicalIDs.get(myID) || ''

    if (!canonicalID) {
      removeRow(myID)
      emitRows()
      return
    }

    if (previousCanonicalID === canonicalID && canonicalValues.has(myID)) {
      updateRow(myID, preview)
      return
    }

    subscriptions.remove(myID)
    canonicalIDs.set(myID, canonicalID)
    canonicalValues.delete(myID)

    subscriptions.replace(myID, subscribeToPathValue(
      options.getCanonicalPath(canonicalID, preview, myID),
      (canonicalValue) => {
        if (!isCanonicalActive(canonicalValue as Canonical | null)) {
          canonicalValues.delete(myID)
          rows.delete(myID)
          emitRows()
          return
        }

        canonicalValues.set(myID, canonicalValue as Canonical)
        updateRow(myID)
      },
    ))
  }

  const unsubscribeOwner = subscribeToPathValue(options.ownerPath, (ownerValue) => {
    const ownerEntries = ownerValue && typeof ownerValue === 'object'
      ? Object.entries(ownerValue as Record<string, Preview>)
      : []
    const activeMyIDs = new Set(ownerEntries.map(([myID]) => myID))

    ownerOrder.splice(0, ownerOrder.length, ...ownerEntries.map(([myID]) => myID))

    Array.from(previews.keys()).forEach((myID) => {
      if (!activeMyIDs.has(myID)) {
        removeRow(myID)
      }
    })

    ownerEntries.forEach(([myID, preview]) => {
      previews.set(myID, preview)
      subscribeToCanonical(myID, preview)
    })

    emitRows()
  })

  return () => {
    unsubscribeOwner()
    subscriptions.clear()
  }
}
