import { AceBaseClient } from 'acebase-client'

import { acebaseConfig, firebaseClientConfig, isLocalDatabase } from '../lib/env'

export type DatabaseAction =
  | { type: 'get'; path: string }
  | { type: 'set'; path: string; value: unknown }
  | { type: 'update'; path: string; value: Record<string, unknown> }
  | { type: 'remove'; path: string }
  | { type: 'push'; path: string; value: unknown }

type DatabaseActionResult = {
  key?: string
  value?: unknown
}

let acebaseClient: AceBaseClient | null = null

function normalizePath(path: string) {
  return path.replace(/^\/+|\/+$/g, '')
}

function getFirebaseDatabaseUrl() {
  const databaseUrl =
    process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ||
    process.env.VITE_FIREBASE_DATABASE_URL ||
    firebaseClientConfig.databaseURL

  if (!databaseUrl) {
    throw new Error('Missing Firebase Realtime Database URL')
  }

  return databaseUrl.endsWith('/') ? databaseUrl : `${databaseUrl}/`
}

function createFirebaseUrl(path: string, authToken?: string | null) {
  const url = new URL(`${normalizePath(path)}.json`, getFirebaseDatabaseUrl())

  if (authToken) {
    url.searchParams.set('auth', authToken)
  }

  return url
}

async function runFirebaseAction(
  action: DatabaseAction,
  authToken?: string | null,
): Promise<DatabaseActionResult> {
  const url = createFirebaseUrl(action.path, authToken)

  switch (action.type) {
    case 'get': {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Firebase read failed for ${action.path}`)
      }
      return { value: await response.json() }
    }
    case 'set': {
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(action.value),
      })
      if (!response.ok) {
        throw new Error(`Firebase set failed for ${action.path}`)
      }
      return { value: action.value ?? null }
    }
    case 'update': {
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(action.value),
      })
      if (!response.ok) {
        throw new Error(`Firebase update failed for ${action.path}`)
      }
      return { value: action.value ?? null }
    }
    case 'remove': {
      const response = await fetch(url, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error(`Firebase delete failed for ${action.path}`)
      }
      return { value: null }
    }
    case 'push': {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(action.value),
      })
      if (!response.ok) {
        throw new Error(`Firebase push failed for ${action.path}`)
      }
      const payload = await response.json()
      return {
        key: payload?.name,
        value: action.value ?? null,
      }
    }
  }
}

function getAcebaseClient() {
  if (!acebaseClient) {
    acebaseClient = new AceBaseClient({
      host:
        process.env.NEXT_PUBLIC_ACEBASE_HOST ||
        process.env.VITE_ACEBASE_HOST ||
        acebaseConfig.host,
      port: parseInt(
        process.env.NEXT_PUBLIC_ACEBASE_PORT ||
          process.env.VITE_ACEBASE_PORT ||
          `${acebaseConfig.port}`,
        10,
      ),
      dbname:
        process.env.NEXT_PUBLIC_DATABASE_NAME ||
        process.env.VITE_DATABASE_NAME ||
        acebaseConfig.dbname,
      https:
        (process.env.NEXT_PUBLIC_ACEBASE_USE_SSL ||
          process.env.VITE_ACEBASE_USE_SSL ||
          `${acebaseConfig.ssl}`) === 'true',
    })
  }

  return acebaseClient
}

async function runAcebaseAction(action: DatabaseAction): Promise<DatabaseActionResult> {
  const ref = getAcebaseClient().ref(normalizePath(action.path))

  switch (action.type) {
    case 'get': {
      const snapshot = await ref.get()
      return { value: snapshot.val() }
    }
    case 'set': {
      await ref.set(action.value)
      return { value: action.value ?? null }
    }
    case 'update': {
      await ref.update(action.value)
      return { value: action.value ?? null }
    }
    case 'remove': {
      await ref.remove()
      return { value: null }
    }
    case 'push': {
      const pushedRef = await ref.push(action.value)
      return {
        key: pushedRef.key,
        value: action.value ?? null,
      }
    }
  }
}

export async function executeDatabaseActions(
  actions: DatabaseAction[],
  authToken?: string | null,
) {
  const results: DatabaseActionResult[] = []

  for (const action of actions) {
    if (isLocalDatabase) {
      results.push(await runAcebaseAction(action))
      continue
    }

    results.push(await runFirebaseAction(action, authToken))
  }

  return results
}
