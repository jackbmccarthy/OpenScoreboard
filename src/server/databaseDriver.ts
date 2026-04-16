import { AceBaseClient } from 'acebase-client'

import { acebaseConfig, firebaseClientConfig, isLocalDatabase } from '../lib/env'
import { capabilityAllowsRead, capabilityAllowsWrite, resolveCapabilityToken } from './capabilities'
import { RequestSecurityError } from './errors'

export type DatabaseAction =
  | { type: 'get'; path: string }
  | { type: 'set'; path: string; value: unknown }
  | { type: 'compareSet'; path: string; expected: unknown; value: unknown }
  | { type: 'update'; path: string; value: Record<string, unknown> }
  | { type: 'remove'; path: string }
  | { type: 'push'; path: string; value: unknown }

type DatabaseActionResult<T = any> = {
  key?: string
  value?: T
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

function getRecordOwnerID(value: unknown) {
  if (!value || typeof value !== 'object') {
    return ''
  }

  const record = value as Record<string, unknown>
  const ownerID = record.ownerID || record.creatorID || record.createdBy
  return typeof ownerID === 'string' ? ownerID : ''
}

async function getOwnedParentOwnerID(
  path: string,
  authToken?: string | null,
) {
  const normalizedPath = normalizePath(path)
  const segments = getPathSegments(normalizedPath)

  if (segments[0] === 'tables' && segments[1]) {
    return getRecordOwnerID(await getPathValue(`tables/${segments[1]}`, authToken))
  }
  if (segments[0] === 'playerLists' && segments[1]) {
    return getRecordOwnerID(await getPathValue(`playerLists/${segments[1]}`, authToken))
  }
  if (segments[0] === 'teamMatches' && segments[1]) {
    return getRecordOwnerID(await getPathValue(`teamMatches/${segments[1]}`, authToken))
  }
  if (segments[0] === 'scoreboards' && segments[1]) {
    return getRecordOwnerID(await getPathValue(`scoreboards/${segments[1]}`, authToken))
  }
  if (segments[0] === 'dynamicurls' && segments[1]) {
    const dynamicURL = await getPathValue(`dynamicurls/${segments[1]}`, authToken)
    if (!dynamicURL || typeof dynamicURL !== 'object') {
      return ''
    }
    const record = dynamicURL as Record<string, unknown>
    if (typeof record.tableID === 'string' && record.tableID) {
      return getRecordOwnerID(await getPathValue(`tables/${record.tableID}`, authToken))
    }
    if (typeof record.teamMatchID === 'string' && record.teamMatchID) {
      return getRecordOwnerID(await getPathValue(`teamMatches/${record.teamMatchID}`, authToken))
    }
    if (typeof record.scoreboardID === 'string' && record.scoreboardID) {
      return getRecordOwnerID(await getPathValue(`scoreboards/${record.scoreboardID}`, authToken))
    }
    return ''
  }
  if (segments[0] === 'matches') {
    const matchID = segments[1]
    if (!matchID) {
      return ''
    }
    const matchValue = await getPathValue(`matches/${matchID}`, authToken)
    if (!matchValue || typeof matchValue !== 'object') {
      return ''
    }
    const record = matchValue as Record<string, unknown>
    const scheduling = record.scheduling && typeof record.scheduling === 'object'
      ? record.scheduling as Record<string, unknown>
      : {}
    const tableID = typeof scheduling.tableID === 'string' && scheduling.tableID
      ? scheduling.tableID
      : typeof record.tableID === 'string'
        ? record.tableID
        : ''
    if (tableID) {
      return getRecordOwnerID(await getPathValue(`tables/${tableID}`, authToken))
    }
    const teamMatchID = typeof scheduling.teamMatchID === 'string' && scheduling.teamMatchID
      ? scheduling.teamMatchID
      : typeof record.teamMatchID === 'string'
        ? record.teamMatchID
        : ''
    if (teamMatchID) {
      return getRecordOwnerID(await getPathValue(`teamMatches/${teamMatchID}`, authToken))
    }
  }

  return ''
}

async function canWriteProtectedAction(action: DatabaseAction, callerID: string, authToken?: string | null) {
  const normalizedPath = normalizePath(action.path)
  const pathSegments = getPathSegments(action.path)

  if (pathSegments[0] === 'capabilityTokens') {
    return false
  }

  if (pathSegments[0] === 'tables') {
    if (action.type === 'push' && normalizedPath === 'tables') {
      return callerID === 'mylocalserver' || (action.value && typeof action.value === 'object' && (action.value as Record<string, unknown>).creatorID === callerID)
    }
    return (await getOwnedParentOwnerID(action.path, authToken)) === callerID || callerID === 'mylocalserver'
  }

  if (pathSegments[0] === 'playerLists') {
    if (action.type === 'push' && normalizedPath === 'playerLists') {
      return callerID === 'mylocalserver' || (action.value && typeof action.value === 'object' && (action.value as Record<string, unknown>).ownerID === callerID)
    }
    return (await getOwnedParentOwnerID(action.path, authToken)) === callerID || callerID === 'mylocalserver'
  }

  if (pathSegments[0] === 'teamMatches') {
    if (action.type === 'push' && normalizedPath === 'teamMatches') {
      return callerID === 'mylocalserver' || (action.value && typeof action.value === 'object' && (action.value as Record<string, unknown>).ownerID === callerID)
    }
    return (await getOwnedParentOwnerID(action.path, authToken)) === callerID || callerID === 'mylocalserver'
  }

  if (pathSegments[0] === 'matches') {
    if (action.type === 'push' && normalizedPath === 'matches') {
      if (!action.value || typeof action.value !== 'object') {
        return false
      }
      const record = action.value as Record<string, unknown>
      const scheduling = record.scheduling && typeof record.scheduling === 'object'
        ? record.scheduling as Record<string, unknown>
        : {}
      const tableID = typeof scheduling.tableID === 'string' && scheduling.tableID
        ? scheduling.tableID
        : typeof record.tableID === 'string'
          ? record.tableID
          : ''
      if (tableID) {
        return getRecordOwnerID(await getPathValue(`tables/${tableID}`, authToken)) === callerID || callerID === 'mylocalserver'
      }
      const teamMatchID = typeof scheduling.teamMatchID === 'string' && scheduling.teamMatchID
        ? scheduling.teamMatchID
        : typeof record.teamMatchID === 'string'
          ? record.teamMatchID
          : ''
      if (teamMatchID) {
        return getRecordOwnerID(await getPathValue(`teamMatches/${teamMatchID}`, authToken)) === callerID || callerID === 'mylocalserver'
      }
      return false
    }
    return (await getOwnedParentOwnerID(action.path, authToken)) === callerID || callerID === 'mylocalserver'
  }

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

  if (pathSegments[0] === 'dynamicurls') {
    if (action.type === 'push' && normalizedPath === 'dynamicurls') {
      if (!action.value || typeof action.value !== 'object') {
        return false
      }
      const record = action.value as Record<string, unknown>
      if (typeof record.tableID === 'string' && record.tableID) {
        return getRecordOwnerID(await getPathValue(`tables/${record.tableID}`, authToken)) === callerID || callerID === 'mylocalserver'
      }
      if (typeof record.teamMatchID === 'string' && record.teamMatchID) {
        return getRecordOwnerID(await getPathValue(`teamMatches/${record.teamMatchID}`, authToken)) === callerID || callerID === 'mylocalserver'
      }
      if (typeof record.scoreboardID === 'string' && record.scoreboardID) {
        return getRecordOwnerID(await getPathValue(`scoreboards/${record.scoreboardID}`, authToken)) === callerID || callerID === 'mylocalserver'
      }
      return false
    }
    return (await getOwnedParentOwnerID(action.path, authToken)) === callerID || callerID === 'mylocalserver'
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

export async function executeDatabaseActions<T = any>(
  actions: DatabaseAction[],
  authToken?: string | null,
  capabilityToken?: string | null,
) {
  const results: DatabaseActionResult[] = []
  const capabilityRecord = capabilityToken ? await resolveCapabilityToken(capabilityToken, undefined, {
    source: 'database_proxy',
    skipAudit: true,
  }) : null
  const callerID = authToken ? await resolveFirebaseCallerID(authToken) : null

  for (const action of actions) {
    if (isLocalDatabase) {
      results.push(await runAcebaseAction(action))
      continue
    }

    if (authToken && !callerID) {
      throw new RequestSecurityError('Invalid authentication token', 401, 'invalid_auth_token')
    }

    if (action.type === 'get' && !authToken) {
      if (!capabilityRecord || !await capabilityAllowsRead(capabilityRecord, action)) {
        throw new RequestSecurityError(`Unauthorized database action for ${action.path}`, 401, 'unauthorized_database_action')
      }
      results.push(await runServerFirebaseAction(action))
      continue
    }

    if (action.type !== 'get' && !authToken) {
      if (!capabilityRecord || !await capabilityAllowsWrite(capabilityRecord, action)) {
        throw new RequestSecurityError(`Unauthorized database action for ${action.path}`, 401, 'unauthorized_database_action')
      }
      results.push(await runServerFirebaseAction(action))
      continue
    }

    if (action.type !== 'get' && callerID) {
      const allowed = await canWriteProtectedAction(action, callerID, authToken)
      if (!allowed) {
        throw new RequestSecurityError(`Forbidden database action for ${action.path}`, 403, 'forbidden_database_action')
      }
    }

    results.push(await runFirebaseAction(action, authToken))
  }

  return results as DatabaseActionResult<T>[]
}

export async function executeServerDatabaseActions<T = any>(actions: DatabaseAction[]) {
  const results: DatabaseActionResult[] = []

  for (const action of actions) {
    if (isLocalDatabase) {
      results.push(await runAcebaseAction(action))
      continue
    }

    results.push(await runServerFirebaseAction(action))
  }

  return results as DatabaseActionResult<T>[]
}
