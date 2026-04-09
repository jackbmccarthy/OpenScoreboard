import db from './database'

export type RealtimeSnapshot<T = unknown> = {
  val(): T
}

export type RealtimeUnsubscribe = () => void

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
