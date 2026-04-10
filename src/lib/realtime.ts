import db from './database'

export type RealtimeSnapshot<T = unknown> = {
  val(): T
}

export type RealtimeUnsubscribe = () => void

export type RealtimeStatus = 'idle' | 'loading' | 'live' | 'error' | 'stale' | 'offline'

export type RealtimeState<T = unknown> = {
  status: RealtimeStatus
  value: T | null
  error: string
  updatedAt: string
}

export function createInitialRealtimeState<T = unknown>(): RealtimeState<T> {
  return {
    status: 'idle',
    value: null,
    error: '',
    updatedAt: '',
  }
}

export function unwrapRealtimeValue<T = unknown>(value: unknown): T {
  if (value && typeof value === 'object' && 'value' in value) {
    return (value as { value: T }).value
  }

  return value as T
}

export function subscribeToPathValue<T = unknown>(
  path: string,
  callback: (value: T, snapshot: RealtimeSnapshot<T>) => void,
): RealtimeUnsubscribe {
  const ref = db.ref(path)
  ref.on('value', (snapshot: RealtimeSnapshot<T>) => {
    callback(snapshot.val(), snapshot)
  })

  return () => {
    ref.off()
  }
}

export function subscribeToPathState<T = unknown>(
  path: string,
  callback: (state: RealtimeState<T>) => void,
): RealtimeUnsubscribe {
  const STALE_AFTER_MS = 15000
  let lastValue: T | null = null
  let staleTimeout: number | null = null

  const clearStaleTimeout = () => {
    if (staleTimeout !== null && typeof window !== 'undefined') {
      window.clearTimeout(staleTimeout)
      staleTimeout = null
    }
  }

  const scheduleStaleTimeout = (updatedAt: string) => {
    if (typeof window === 'undefined') {
      return
    }
    clearStaleTimeout()
    staleTimeout = window.setTimeout(() => {
      callback({
        status: 'stale',
        value: lastValue,
        error: '',
        updatedAt,
      })
    }, STALE_AFTER_MS)
  }

  callback({
    status: typeof navigator !== 'undefined' && navigator.onLine === false ? 'offline' : 'loading',
    value: null,
    error: '',
    updatedAt: '',
  })

  const ref = db.ref(path)
  const onOnline = () => {
    callback({
      status: 'loading',
      value: lastValue,
      error: '',
      updatedAt: '',
    })
  }
  const onOffline = () => {
    clearStaleTimeout()
    callback({
      status: 'offline',
      value: lastValue,
      error: '',
      updatedAt: new Date().toISOString(),
    })
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
  }

  try {
    ref.on('value', (snapshot: RealtimeSnapshot<T>) => {
      const nextValue = snapshot.val()
      const updatedAt = new Date().toISOString()
      lastValue = nextValue
      scheduleStaleTimeout(updatedAt)
      callback({
        status: 'live',
        value: nextValue,
        error: '',
        updatedAt,
      })
    })
  } catch (error) {
    clearStaleTimeout()
    callback({
      status: 'error',
      value: lastValue,
      error: error instanceof Error ? error.message : 'Realtime subscription failed',
      updatedAt: new Date().toISOString(),
    })
  }

  return () => {
    clearStaleTimeout()
    ref.off()
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }
}
