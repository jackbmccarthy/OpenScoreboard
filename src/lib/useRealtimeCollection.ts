import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'

import {
  createInitialLiveSyncState,
  createLiveSyncState,
  createSubscriptionRegistry,
  type LiveSyncState,
} from './liveSync'
import { subscribeToPathState, type RealtimeUnsubscribe } from './realtime'

type UseRealtimeCollectionOptions<T> = {
  enabled?: boolean
  initialValue: T
  statePath: string
  subscribe: (callback: (value: T) => void) => RealtimeUnsubscribe
}

type UseRealtimeCollectionResult<T> = {
  value: T
  setValue: Dispatch<SetStateAction<T>>
  liveState: LiveSyncState<T>
  ready: boolean
  loading: boolean
}

export function useRealtimeCollection<T>({
  enabled = true,
  initialValue,
  statePath,
  subscribe,
}: UseRealtimeCollectionOptions<T>): UseRealtimeCollectionResult<T> {
  const [value, setValue] = useState<T>(initialValue)
  const [liveState, setLiveState] = useState<LiveSyncState<T>>(
    createInitialLiveSyncState<T>(enabled ? 'loading' : 'idle', initialValue),
  )
  const [ready, setReady] = useState(!enabled)
  const initialValueRef = useRef(initialValue)
  const subscribeRef = useRef(subscribe)

  useEffect(() => {
    subscribeRef.current = subscribe
  }, [subscribe])

  useEffect(() => {
    if (!enabled) {
      setValue(initialValueRef.current)
      setLiveState(createInitialLiveSyncState<T>('idle', initialValueRef.current))
      setReady(true)
      return
    }

    setValue(initialValueRef.current)
    setLiveState(createInitialLiveSyncState<T>('loading', initialValueRef.current))
    setReady(false)

    const subscriptions = createSubscriptionRegistry()

    subscriptions.replace('state', subscribeToPathState(statePath, (state) => {
      if (state.status !== 'loading') {
        setReady(true)
      }
      setLiveState((current) => createLiveSyncState<T>({
        status: state.status,
        value: current.value,
        error: state.error,
        updatedAt: state.updatedAt,
      }))
    }))

    subscriptions.replace('data', subscribeRef.current((nextValue) => {
      setValue(nextValue)
      setReady(true)
      setLiveState((current) => createLiveSyncState<T>({
        status: current.status === 'offline' ? 'offline' : current.status === 'stale' ? 'stale' : 'live',
        value: nextValue,
        error: '',
        updatedAt: new Date().toISOString(),
      }))
    }))

    return () => {
      subscriptions.clear()
    }
  }, [enabled, statePath])

  return {
    value,
    setValue,
    liveState,
    ready,
    loading: enabled && !ready,
  }
}
