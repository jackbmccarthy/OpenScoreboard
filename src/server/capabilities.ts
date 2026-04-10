import crypto from 'node:crypto'

import { executeDatabaseActions, executeServerDatabaseActions, type DatabaseAction } from './databaseDriver'

export type CapabilityType =
  | 'table_scoring'
  | 'team_match_scoring'
  | 'player_registration'
  | 'public_score_view'

export type CapabilityRecord = {
  tokenId: string
  capabilityType: CapabilityType
  createdAt: string
  createdBy: string
  expiresAt: string | null
  revokedAt: string | null
  tableID?: string
  teamMatchID?: string
  matchID?: string
  playerListID?: string
  tableNumber?: string
  scoreboardID?: string
  label?: string
  tokenFingerprint: string
}

type CapabilityPayload = {
  v: 1
  jti: string
  capabilityType: CapabilityType
  iat: number
  exp?: number
  tableID?: string
  teamMatchID?: string
  matchID?: string
  playerListID?: string
  tableNumber?: string
  scoreboardID?: string
}

function base64UrlEncode(value: string) {
  return Buffer.from(value)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function base64UrlDecode(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4))
  return Buffer.from(`${normalized}${padding}`, 'base64').toString('utf8')
}

function getCapabilitySecret() {
  const configuredSecret = process.env.CAPABILITY_TOKEN_SECRET || process.env.OPENSCOREBOARD_CAPABILITY_SECRET
  if (configuredSecret) {
    return configuredSecret
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Missing CAPABILITY_TOKEN_SECRET or OPENSCOREBOARD_CAPABILITY_SECRET')
  }
  return 'openscoreboard-dev-capability-secret'
}

function signCapabilityPayload(payload: CapabilityPayload) {
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'OSC' }))
  const body = base64UrlEncode(JSON.stringify(payload))
  const signature = crypto
    .createHmac('sha256', getCapabilitySecret())
    .update(`${header}.${body}`)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')

  return `${header}.${body}.${signature}`
}

function verifyCapabilitySignature(token: string) {
  const [header, body, signature] = token.split('.')
  if (!header || !body || !signature) {
    return null
  }

  const expected = crypto
    .createHmac('sha256', getCapabilitySecret())
    .update(`${header}.${body}`)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')

  if (signature !== expected) {
    return null
  }

  try {
    return JSON.parse(base64UrlDecode(body)) as CapabilityPayload
  } catch {
    return null
  }
}

function fingerprintToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex').slice(0, 16)
}

export function buildCapabilityUrl(origin: string, record: CapabilityRecord, token: string) {
  switch (record.capabilityType) {
    case 'table_scoring':
      return `${origin}/scoring/table/${record.tableID}?token=${encodeURIComponent(token)}`
    case 'team_match_scoring':
      return `${origin}/teamscoring/teammatch/${record.teamMatchID}?table=${encodeURIComponent(record.tableNumber || '1')}&token=${encodeURIComponent(token)}`
    case 'player_registration':
      return `${origin}/playerregistration/${record.playerListID}?token=${encodeURIComponent(token)}`
    case 'public_score_view':
      return `${origin}/scoreboard/view?token=${encodeURIComponent(token)}`
  }
}

export async function issueCapabilityToken({
  capabilityType,
  createdBy,
  expiresInHours,
  tableID,
  teamMatchID,
  matchID,
  playerListID,
  tableNumber,
  scoreboardID,
  label,
  authToken,
}: {
  capabilityType: CapabilityType
  createdBy: string
  expiresInHours?: number | null
  tableID?: string
  teamMatchID?: string
  matchID?: string
  playerListID?: string
  tableNumber?: string
  scoreboardID?: string
  label?: string
  authToken?: string | null
}) {
  const tokenId = crypto.randomUUID()
  const issuedAt = Date.now()
  const expiresAt = expiresInHours && expiresInHours > 0 ? new Date(issuedAt + expiresInHours * 60 * 60 * 1000) : null
  const payload: CapabilityPayload = {
    v: 1,
    jti: tokenId,
    capabilityType,
    iat: Math.floor(issuedAt / 1000),
    ...(expiresAt ? { exp: Math.floor(expiresAt.getTime() / 1000) } : {}),
    ...(tableID ? { tableID } : {}),
    ...(teamMatchID ? { teamMatchID } : {}),
    ...(matchID ? { matchID } : {}),
    ...(playerListID ? { playerListID } : {}),
    ...(tableNumber ? { tableNumber } : {}),
    ...(scoreboardID ? { scoreboardID } : {}),
  }

  const token = signCapabilityPayload(payload)
  const record: CapabilityRecord = {
    tokenId,
    capabilityType,
    createdAt: new Date(issuedAt).toISOString(),
    createdBy,
    expiresAt: expiresAt ? expiresAt.toISOString() : null,
    revokedAt: null,
    ...(tableID ? { tableID } : {}),
    ...(teamMatchID ? { teamMatchID } : {}),
    ...(matchID ? { matchID } : {}),
    ...(playerListID ? { playerListID } : {}),
    ...(tableNumber ? { tableNumber } : {}),
    ...(scoreboardID ? { scoreboardID } : {}),
    ...(label ? { label } : {}),
    tokenFingerprint: fingerprintToken(token),
  }

  await executeServerDatabaseActions([
    { type: 'set', path: `capabilityTokens/${tokenId}`, value: record },
  ])

  return { token, record }
}

export async function getCapabilityRecord(tokenId: string) {
  const [result] = await executeServerDatabaseActions([
    { type: 'get', path: `capabilityTokens/${tokenId}` },
  ])
  return (result?.value || null) as CapabilityRecord | null
}

export async function resolveCapabilityToken(token: string, expectedType?: CapabilityType) {
  const payload = verifyCapabilitySignature(token)
  if (!payload) {
    return null
  }

  if (expectedType && payload.capabilityType !== expectedType) {
    return null
  }

  const record = await getCapabilityRecord(payload.jti)
  if (!record || record.revokedAt) {
    return null
  }

  if (record.tokenFingerprint !== fingerprintToken(token)) {
    return null
  }

  if (record.expiresAt && new Date(record.expiresAt).getTime() <= Date.now()) {
    return null
  }

  return record
}

export async function listCapabilityTokens(filters: Partial<CapabilityRecord>, authToken?: string | null) {
  const [result] = await executeServerDatabaseActions([
    { type: 'get', path: 'capabilityTokens' },
  ])
  const records = result?.value && typeof result.value === 'object'
    ? Object.values(result.value as Record<string, CapabilityRecord>)
    : []

  return records.filter((record) => {
    return Object.entries(filters).every(([key, value]) => {
      if (typeof value === 'undefined') {
        return true
      }
      return record[key as keyof CapabilityRecord] === value
    })
  })
}

export async function getOwnedCapabilityRecord(tokenId: string, ownerID: string) {
  const record = await getCapabilityRecord(tokenId)
  if (!record) {
    return null
  }
  if (record.createdBy !== ownerID && ownerID !== 'mylocalserver') {
    return null
  }
  return record
}

export async function revokeCapabilityToken(tokenId: string, authToken?: string | null, ownerID?: string) {
  const record = await getCapabilityRecord(tokenId)
  if (!record) {
    return null
  }
  if (ownerID && record.createdBy !== ownerID && ownerID !== 'mylocalserver') {
    return null
  }

  const nextRecord = {
    ...record,
    revokedAt: new Date().toISOString(),
  }
  await executeServerDatabaseActions([
    { type: 'set', path: `capabilityTokens/${tokenId}`, value: nextRecord },
  ])
  return nextRecord
}

export function capabilityAllowsWrite(record: CapabilityRecord, action: DatabaseAction) {
  const path = action.path.replace(/^\/+/, '')
  const allowedMatchPrefixes = record.matchID
    ? [
        `matches/${record.matchID}/game`,
        `matches/${record.matchID}/games`,
        `matches/${record.matchID}/pointHistory`,
        `matches/${record.matchID}/auditTrail`,
        `matches/${record.matchID}/scoringRules`,
        `matches/${record.matchID}/scheduling`,
        `matches/${record.matchID}/schemaVersion`,
        `matches/${record.matchID}/context`,
        `matches/${record.matchID}/tournamentContext`,
        `matches/${record.matchID}/playerA`,
        `matches/${record.matchID}/playerA2`,
        `matches/${record.matchID}/playerB`,
        `matches/${record.matchID}/playerB2`,
        `matches/${record.matchID}/isA`,
        `matches/${record.matchID}/isB`,
        `matches/${record.matchID}/isSecondServer`,
        `matches/${record.matchID}/isInitialServerSelected`,
        `matches/${record.matchID}/isGame`,
        `matches/${record.matchID}/isMatch`,
        `matches/${record.matchID}/isInBetweenGames`,
        `matches/${record.matchID}/isWarmUp`,
        `matches/${record.matchID}/isCourtSideScoreboardFlipped`,
        `matches/${record.matchID}/isManualServiceMode`,
        `matches/${record.matchID}/isDoubles`,
        `matches/${record.matchID}/isSwitched`,
        `matches/${record.matchID}/isJudgePaused`,
        `matches/${record.matchID}/judgePauseReason`,
        `matches/${record.matchID}/isDisputed`,
        `matches/${record.matchID}/latestJudgeNote`,
        `matches/${record.matchID}/latestJudgeNoteAt`,
        `matches/${record.matchID}/matchStartTime`,
        `matches/${record.matchID}/matchRound`,
        `matches/${record.matchID}/bestOf`,
        `matches/${record.matchID}/pointsToWinGame`,
        `matches/${record.matchID}/changeServeEveryXPoints`,
        `matches/${record.matchID}/scoringType`,
        `matches/${record.matchID}/enforceGameScore`,
        `matches/${record.matchID}/timeOutStartTime`,
        `matches/${record.matchID}/showGameWonConfirmationModal`,
        `matches/${record.matchID}/showInBetweenGamesModal`,
      ]
    : []
  const matchWriteAllowed = allowedMatchPrefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}`))
  const actionValue = 'value' in action ? action.value : undefined
  const currentMatchWriteAllowed = Boolean(
    record.matchID &&
    record.tableID &&
    path === `tables/${record.tableID}/currentMatch` &&
    action.type === 'set' &&
    (actionValue === record.matchID || actionValue === ''),
  )
  const teamCurrentMatchWriteAllowed = Boolean(
    record.matchID &&
    record.teamMatchID &&
    path === `teamMatches/${record.teamMatchID}/currentMatches/${record.tableNumber || ''}` &&
    action.type === 'set' &&
    (actionValue === record.matchID || actionValue === ''),
  )
  const archivedTableWriteAllowed = Boolean(
    record.matchID &&
    record.tableID &&
    path === `tables/${record.tableID}/archivedMatches` &&
    action.type === 'push' &&
    actionValue &&
    typeof actionValue === 'object' &&
    (actionValue as Record<string, unknown>).matchID === record.matchID,
  )
  const archivedTeamMatchWriteAllowed = Boolean(
    record.matchID &&
    record.teamMatchID &&
    path === `teamMatches/${record.teamMatchID}/archivedMatches` &&
    action.type === 'push' &&
    actionValue &&
    typeof actionValue === 'object' &&
    (actionValue as Record<string, unknown>).matchID === record.matchID,
  )

  switch (record.capabilityType) {
    case 'table_scoring':
      return matchWriteAllowed || currentMatchWriteAllowed || archivedTableWriteAllowed
    case 'team_match_scoring':
      return (
        matchWriteAllowed ||
        teamCurrentMatchWriteAllowed ||
        archivedTeamMatchWriteAllowed ||
        path.startsWith(`teamMatches/${record.teamMatchID}/teamAScore`) ||
        path.startsWith(`teamMatches/${record.teamMatchID}/teamBScore`)
      )
    case 'player_registration':
      return path.startsWith(`playerLists/${record.playerListID}/players`)
    case 'public_score_view':
      return false
  }
}

function isPathOrChild(path: string, parentPath: string) {
  return path === parentPath || path.startsWith(`${parentPath}/`)
}

export function capabilityAllowsRead(record: CapabilityRecord, action: DatabaseAction) {
  if (action.type !== 'get') {
    return false
  }

  const path = action.path.replace(/^\/+/, '')
  const matchReadAllowed = Boolean(record.matchID && isPathOrChild(path, `matches/${record.matchID}`))

  switch (record.capabilityType) {
    case 'table_scoring':
      return matchReadAllowed || Boolean(record.tableID && isPathOrChild(path, `tables/${record.tableID}`))
    case 'team_match_scoring':
      return matchReadAllowed || Boolean(record.teamMatchID && isPathOrChild(path, `teamMatches/${record.teamMatchID}`))
    case 'player_registration':
      return Boolean(record.playerListID && isPathOrChild(path, `playerLists/${record.playerListID}`))
    case 'public_score_view':
      return (
        matchReadAllowed ||
        Boolean(record.scoreboardID && isPathOrChild(path, `scoreboards/${record.scoreboardID}`)) ||
        Boolean(record.tableID && isPathOrChild(path, `tables/${record.tableID}`)) ||
        Boolean(record.teamMatchID && isPathOrChild(path, `teamMatches/${record.teamMatchID}`))
      )
  }
}

export async function callerOwnsCapabilityTarget(record: Partial<CapabilityRecord>, callerID: string, authToken?: string | null) {
  const checks: Array<{ path: string; field?: string }> = []

  if (record.tableID) {
    checks.push({ path: `tables/${record.tableID}`, field: 'creatorID' })
  }
  if (record.playerListID) {
    checks.push({ path: `playerLists/${record.playerListID}` })
  }
  if (record.scoreboardID) {
    checks.push({ path: `scoreboards/${record.scoreboardID}`, field: 'ownerID' })
  }
  if (record.teamMatchID) {
    checks.push({ path: `teamMatches/${record.teamMatchID}` })
  }

  if (checks.length === 0) {
    return false
  }

  for (const check of checks) {
    const [result] = await executeDatabaseActions([{ type: 'get', path: check.path }], authToken)
    const value = result?.value as Record<string, any> | null
    if (!value) {
      return false
    }
    const ownerValue = check.field ? value[check.field] : value.ownerID || value.creatorID || value.createdBy
    if (!ownerValue) {
      return false
    }
    if (ownerValue !== callerID && callerID !== 'mylocalserver') {
      return false
    }
  }

  return true
}

export async function validateScoringCapabilityTarget(
  record: {
    capabilityType: CapabilityType
    tableID?: string
    teamMatchID?: string
    tableNumber?: string
    matchID?: string
  },
  authToken?: string | null,
) {
  if (!record.matchID) {
    return false
  }

  const [matchResult] = await executeDatabaseActions([{ type: 'get', path: `matches/${record.matchID}` }], authToken)
  const matchValue = matchResult?.value as Record<string, any> | null
  if (!matchValue) {
    return false
  }

  const matchScheduling = matchValue.scheduling && typeof matchValue.scheduling === 'object'
    ? matchValue.scheduling as Record<string, any>
    : {}

  if (record.capabilityType === 'table_scoring') {
    if (!record.tableID) {
      return false
    }
    const [tableResult] = await executeDatabaseActions([{ type: 'get', path: `tables/${record.tableID}` }], authToken)
    const tableValue = tableResult?.value as Record<string, any> | null
    if (!tableValue) {
      return false
    }
    return (
      tableValue.currentMatch === record.matchID ||
      matchValue.tableID === record.tableID ||
      matchScheduling.tableID === record.tableID
    )
  }

  if (record.capabilityType === 'team_match_scoring') {
    if (!record.teamMatchID) {
      return false
    }
    const effectiveTableNumber = record.tableNumber || '1'
    const [teamMatchResult] = await executeDatabaseActions([{ type: 'get', path: `teamMatches/${record.teamMatchID}` }], authToken)
    const teamMatchValue = teamMatchResult?.value as Record<string, any> | null
    if (!teamMatchValue) {
      return false
    }
    const currentMatches = teamMatchValue.currentMatches && typeof teamMatchValue.currentMatches === 'object'
      ? teamMatchValue.currentMatches as Record<string, string>
      : {}
    return (
      currentMatches[effectiveTableNumber] === record.matchID ||
      (matchValue.teamMatchID === record.teamMatchID && `${matchValue.tableNumber || ''}` === effectiveTableNumber) ||
      (matchScheduling.teamMatchID === record.teamMatchID && `${matchScheduling.tableNumber || ''}` === effectiveTableNumber)
    )
  }

  return false
}
