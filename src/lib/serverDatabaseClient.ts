import firebase from 'firebase/app'
import 'firebase/auth'

import { isLocalDatabase } from './firebase'

export type DatabaseAction =
  | { type: 'get'; path: string }
  | { type: 'set'; path: string; value: unknown }
  | { type: 'update'; path: string; value: Record<string, unknown> }
  | { type: 'remove'; path: string }
  | { type: 'push'; path: string; value: unknown }

export type DatabaseActionResult = {
  key?: string
  value?: unknown
}

async function getAuthHeaders() {
  if (isLocalDatabase) {
    return {}
  }

  const currentUser = firebase.auth().currentUser
  const token = currentUser ? await currentUser.getIdToken() : null

  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {}
}

export async function runServerDatabaseActions(actions: DatabaseAction[]) {
  const authHeaders = await getAuthHeaders()
  const response = await fetch('/api/database', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(authHeaders as Record<string, string>),
    },
    body: JSON.stringify({ actions }),
  })

  const payload = await response.json()

  if (!response.ok) {
    throw new Error(payload?.error || 'Database request failed')
  }

  return (payload?.results || []) as DatabaseActionResult[]
}
