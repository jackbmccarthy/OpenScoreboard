import { AceBaseClient } from 'acebase-client'

import { acebaseConfig, firebaseClientConfig, isLocalDatabase } from '../lib/env'
import { capabilityAllowsRead, capabilityAllowsWrite, resolveCapabilityToken } from './capabilities'

export type DatabaseAction =
  | { type: 'get'; path: string }
  | { type: 'set'; path: string; value: unknown }
  | { type: 'compareSet'; path: string; expected: unknown; value: unknown }
  | { type: 'update'; path: string; value: Record<string, unknown> }
  | { type: 'remove'; path: string }
  | { type: 'push'; path: string; value: unknown }

type DatabaseActionResult = {
  key?: string
  value?: unknown
}

let acebaseClient: AceBaseClient | null = null
const acebasePathLocks = new Map<string, Promise<void>>()

function normalizePath(path: string) {
  return path.replace(/^\/+|\/+$/g, '')
}

function getPathSegments(path: string) {
  return normalizePath(path).split('/').filter(Boolean)
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

function getServerFirebaseAuthToken() {
  const serverToken = process.env.FIREBASE_DATABASE_SECRET || process.env.FIREBASE_LEGACY_DATABASE_SECRET || null
  if (!serverToken && process.env.NODE_ENV === 'production') {
    throw new Error('Missing FIREBASE_DATABASE_SECRET or FIREBASE_LEGACY_DATABASE_SECRET for server database writes')
  }
  return serverToken
}

async function runServerFirebaseAction(action: DatabaseAction): Promise<DatabaseActionResult> {
  return runFirebaseAction(action, getServerFirebaseAuthToken())
}

async function resolveFirebaseCallerID(authToken?: string | null) {
  if (isLocalDatabase) {
    return 'mylocalserver'
  }
  if (!authToken || !firebaseClientConfig.apiKey) {
    return null
  }

  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseClientConfig.apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: authToken }),
  })
  if (!response.ok) {
    return null
  }
  const payload = await response.json()
  const user = Array.isArray(payload?.users) ? payload.users[0] : null
  return user?.localId || null
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
    case 'compareSet': {
      const etagResponse = await fetch(url, {
        headers: {
          'X-Firebase-ETag': 'true',
        },
      })
      if (!etagResponse.ok) {
        throw new Error(`Firebase compareSet read failed for ${action.path}`)
      }
      const currentValue = await etagResponse.json()
      const expectedSerialized = JSON.stringify(action.expected ?? null)
      const currentSerialized = JSON.stringify(currentValue ?? null)
      if (expectedSerialized !== currentSerialized) {
        throw new Error(`Firebase compareSet precondition failed for ${action.path}`)
      }
      const etag = etagResponse.headers.get('etag')
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(etag ? { 'if-match': etag } : {}),
        },
        body: JSON.stringify(action.value),
      })
      if (!response.ok) {
        throw new Error(`Firebase compareSet failed for ${action.path}`)
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

async function withAcebasePathLock<T>(path: string, operation: () => Promise<T>) {
  const previousLock = acebasePathLocks.get(path) || Promise.resolve()
  let releaseLock: () => void = () => {}
  const nextLock = new Promise<void>((resolve) => {
    releaseLock = resolve
  })
  acebasePathLocks.set(path, previousLock.then(() => nextLock))

  await previousLock
  try {
    return await operation()
  } finally {
    releaseLock()
    if (acebasePathLocks.get(path) === nextLock) {
      acebasePathLocks.delete(path)
    }
  }
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
    case 'compareSet': {
      return withAcebasePathLock(normalizePath(action.path), async () => {
        const snapshot = await ref.get()
        const currentValue = snapshot.val()
        const expectedSerialized = JSON.stringify(action.expected ?? null)
        const currentSerialized = JSON.stringify(currentValue ?? null)
        if (expectedSerialized !== currentSerialized) {
          throw new Error(`AceBase compareSet precondition failed for ${action.path}`)
        }
        await ref.set(action.value)
        return { value: action.value ?? null }
      })
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

async function getPathValue(path: string, authToken?: string | null) {
  if (isLocalDatabase) {
    const ref = getAcebaseClient().ref(normalizePath(path))
    const snapshot = await ref.get()
    return snapshot.val()
  }

  const result = await runFirebaseAction({ type: 'get', path }, authToken)
  return result.value
}

async function canWriteProtectedAction(action: DatabaseAction, callerID: string, authToken?: string | null) {
  const normalizedPath = normalizePath(action.path)
  const pathSegments = getPathSegments(action.path)

  if (pathSegments[0] === 'scoreboards') {
    if (action.type === 'push' && normalizedPath === 'scoreboards') {
      return callerID === 'mylocalserver' || (action.value && typeof action.value === 'object' && (action.value as Record<string, unknown>).ownerID === callerID)
    }
    const scoreboardID = pathSegments[1]
    if (!scoreboardID) {
      return false
    }
    const scoreboardValue = await getPathValue(`scoreboards/${scoreboardID}`, authToken)
    const scoreboard = scoreboardValue && typeof scoreboardValue === 'object'
      ? scoreboardValue as Record<string, unknown>
      : null
    return Boolean(scoreboard && (scoreboard.ownerID === callerID || callerID === 'mylocalserver'))
  }

  if (pathSegments[0] === 'scoreboardTemplates') {
    if (action.type === 'push' && normalizedPath === 'scoreboardTemplates') {
      return callerID === 'mylocalserver' || (action.value && typeof action.value === 'object' && (action.value as Record<string, unknown>).createdBy === callerID)
    }
    const templateID = pathSegments[1]
    if (!templateID) {
      return false
    }
    const templateValue = await getPathValue(`scoreboardTemplates/${templateID}`, authToken)
    const template = templateValue && typeof templateValue === 'object'
      ? templateValue as Record<string, unknown>
      : null
    return Boolean(template && (template.createdBy === callerID || callerID === 'mylocalserver'))
  }

  if (pathSegments[0] === 'users' && pathSegments[1]) {
    const ownerScopedCollections = new Set([
      'myTournaments',
      'sharedTournaments',
      'myScoreboards',
    ])
    if (ownerScopedCollections.has(pathSegments[2] || '')) {
      return pathSegments[1] === callerID
    }
  }

  if (pathSegments[0] === 'tournaments') {
    if (action.type === 'push' && normalizedPath === 'tournaments') {
      return true
    }

    const tournamentID = pathSegments[1]
    if (!tournamentID) {
      return false
    }

    const tournamentValue = await getPathValue(`tournaments/${tournamentID}`, authToken)
    const tournament = tournamentValue && typeof tournamentValue === 'object'
      ? tournamentValue as Record<string, unknown>
      : null
    if (!tournament) {
      return false
    }

    const callerIsOwner = tournament.ownerID === callerID || callerID === 'mylocalserver'
    const pathTargetsOwnerID = pathSegments[2] === 'ownerID'
    const updatesOwnerID =
      (action.type === 'set' || action.type === 'update') &&
      pathSegments.length === 2 &&
      action.value &&
      typeof action.value === 'object' &&
      'ownerID' in action.value &&
      (action.value as Record<string, unknown>).ownerID !== tournament.ownerID

    if ((pathTargetsOwnerID || updatesOwnerID) && !callerIsOwner) {
      return false
    }

    if (callerIsOwner) {
      return true
    }

    const staffAssignments = tournament.staffAssignments && typeof tournament.staffAssignments === 'object'
      ? tournament.staffAssignments as Record<string, { subjectType?: string; subjectID?: string; role?: string }>
      : {}
    const assignment = Object.values(staffAssignments).find((candidate) => candidate.subjectType === 'user' && candidate.subjectID === callerID)
    return assignment?.role === 'admin'
  }

  if (pathSegments[0] !== 'users') {
    return true
  }
  return false
}

export async function executeDatabaseActions(
  actions: DatabaseAction[],
  authToken?: string | null,
  capabilityToken?: string | null,
) {
  const results: DatabaseActionResult[] = []
  const capabilityRecord = capabilityToken ? await resolveCapabilityToken(capabilityToken) : null
  const callerID = authToken ? await resolveFirebaseCallerID(authToken) : null

  for (const action of actions) {
    if (isLocalDatabase) {
      results.push(await runAcebaseAction(action))
      continue
    }

    if (action.type === 'get' && !authToken) {
      if (!capabilityRecord || !capabilityAllowsRead(capabilityRecord, action)) {
        throw new Error(`Unauthorized database action for ${action.path}`)
      }
      results.push(await runServerFirebaseAction(action))
      continue
    }

    if (action.type !== 'get' && !authToken) {
      if (!capabilityRecord || !capabilityAllowsWrite(capabilityRecord, action)) {
        throw new Error(`Unauthorized database action for ${action.path}`)
      }
      results.push(await runServerFirebaseAction(action))
      continue
    }

    if (action.type !== 'get' && callerID) {
      const allowed = await canWriteProtectedAction(action, callerID, authToken)
      if (!allowed) {
        throw new Error(`Forbidden database action for ${action.path}`)
      }
    }

    results.push(await runFirebaseAction(action, authToken))
  }

  return results
}

export async function executeServerDatabaseActions(actions: DatabaseAction[]) {
  const results: DatabaseActionResult[] = []

  for (const action of actions) {
    if (isLocalDatabase) {
      results.push(await runAcebaseAction(action))
      continue
    }

    results.push(await runServerFirebaseAction(action))
  }

  return results
}
