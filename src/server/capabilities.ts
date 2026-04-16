import * as crypto from 'node:crypto'

import { isAccessSecretValid, isLegacyAccessAllowed, type LegacyAccessRecord } from '@/functions/accessSecrets'

import { executeDatabaseActions, executeServerDatabaseActions, type DatabaseAction } from './databaseDriver'
import { RequestSecurityError } from './errors'

export type CapabilityType =
  | 'table_scoring'
  | 'team_match_scoring'
  | 'player_registration'
  | 'public_score_view'

export type CapabilityStatus =
  | 'active'
  | 'revoked'
  | 'expired'
  | 'rotated'

export type CapabilityAuditEvent = {
  type: string
  at: string
  actorID?: string
  ipHash?: string
  userAgentHash?: string
  origin?: string
  details?: Record<string, unknown>
}

export type CapabilityRecord = {
  tokenId: string
  capabilityType: CapabilityType
  status: CapabilityStatus
  createdAt: string
  createdBy: string
  expiresAt: string | null
  revokedAt: string | null
  revokedBy?: string
  revocationReason?: string
  rotatedAt?: string
  replacedByTokenId?: string
  replacesTokenId?: string
  tableID?: string
  teamMatchID?: string
  matchID?: string
  playerListID?: string
  tableNumber?: string
  scoreboardID?: string
  label?: string
  tokenFingerprint: string
  issuedFromIPHash?: string
  issuedUserAgentHash?: string
  lastAccessedAt?: string
  lastAccessIPHash?: string
  lastAccessUserAgentHash?: string
  accessCount?: number
  lastInvalidAttemptAt?: string
  invalidAttemptCount?: number
  suspiciousAttemptCount?: number
  auditTrail?: Record<string, CapabilityAuditEvent>
}

type CapabilityPayload = {
  v: 2
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

export type CapabilityRequestContext = {
  actorID?: string
  ipAddress?: string
  userAgent?: string
  origin?: string
  source?: string
  skipAudit?: boolean
}

type MatchScope = {
  matchID?: string
  tableID?: string
  teamMatchID?: string
  tableNumber?: string
}

function normalizePath(path: string) {
  return path.replace(/^\/+|\/+$/g, '')
}

function getPathSegments(path: string) {
  return normalizePath(path).split('/').filter(Boolean)
}

function isPathOrChild(path: string, parentPath: string) {
  return path === parentPath || path.startsWith(`${parentPath}/`)
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

function hashValue(value: string) {
  return crypto.createHash('sha256').update(value).digest('hex').slice(0, 16)
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
  return hashValue(token)
}

function buildAuditEvent(
  type: string,
  context?: CapabilityRequestContext,
  details?: Record<string, unknown>,
): CapabilityAuditEvent {
  return {
    type,
    at: new Date().toISOString(),
    ...(context?.actorID ? { actorID: context.actorID } : {}),
    ...(context?.ipAddress ? { ipHash: hashValue(context.ipAddress) } : {}),
    ...(context?.userAgent ? { userAgentHash: hashValue(context.userAgent) } : {}),
    ...(context?.origin ? { origin: context.origin } : {}),
    ...(details ? { details } : {}),
  }
}

async function appendCapabilityAuditEvent(
  tokenId: string,
  type: string,
  context?: CapabilityRequestContext,
  details?: Record<string, unknown>,
) {
  await executeServerDatabaseActions([
    {
      type: 'push',
      path: `capabilityTokens/${tokenId}/auditTrail`,
      value: buildAuditEvent(type, context, details),
    },
  ])
}

async function updateCapabilityRecord(
  tokenId: string,
  updater: (record: CapabilityRecord) => CapabilityRecord | null,
) {
  const currentRecord = await getCapabilityRecord(tokenId)
  if (!currentRecord) {
    return null
  }
  const nextRecord = updater(currentRecord)
  if (!nextRecord) {
    return null
  }
  await executeServerDatabaseActions([
    { type: 'set', path: `capabilityTokens/${tokenId}`, value: nextRecord },
  ])
  return nextRecord
}

function getRecordStatus(record: CapabilityRecord): CapabilityStatus {
  if (record.revokedAt) {
    return record.replacedByTokenId ? 'rotated' : 'revoked'
  }
  if (record.expiresAt && new Date(record.expiresAt).getTime() <= Date.now()) {
    return 'expired'
  }
  return 'active'
}

async function getServerValue(path: string) {
  const [result] = await executeServerDatabaseActions([{ type: 'get', path }])
  return result?.value ?? null
}

function getMatchScopeFromValue(value: unknown): MatchScope | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const record = value as Record<string, unknown>
  const scheduling = record.scheduling && typeof record.scheduling === 'object'
    ? record.scheduling as Record<string, unknown>
    : {}

  return {
    tableID: typeof scheduling.tableID === 'string' && scheduling.tableID
      ? scheduling.tableID
      : typeof record.tableID === 'string'
        ? record.tableID
        : '',
    teamMatchID: typeof scheduling.teamMatchID === 'string' && scheduling.teamMatchID
      ? scheduling.teamMatchID
      : typeof record.teamMatchID === 'string'
        ? record.teamMatchID
        : '',
    tableNumber: typeof scheduling.tableNumber === 'string' && scheduling.tableNumber
      ? scheduling.tableNumber
      : typeof record.tableNumber === 'string'
        ? record.tableNumber
        : '',
  }
}

async function getMatchScopeByID(matchID: string): Promise<MatchScope | null> {
  const matchValue = await getServerValue(`matches/${matchID}`)
  if (!matchValue || typeof matchValue !== 'object') {
    return null
  }

  const record = matchValue as Record<string, unknown>
  const scheduling = record.scheduling && typeof record.scheduling === 'object'
    ? record.scheduling as Record<string, unknown>
    : {}

  return {
    matchID,
    tableID: typeof scheduling.tableID === 'string' && scheduling.tableID
      ? scheduling.tableID
      : typeof record.tableID === 'string'
        ? record.tableID
        : '',
    teamMatchID: typeof scheduling.teamMatchID === 'string' && scheduling.teamMatchID
      ? scheduling.teamMatchID
      : typeof record.teamMatchID === 'string'
        ? record.teamMatchID
        : '',
    tableNumber: typeof scheduling.tableNumber === 'string' && scheduling.tableNumber
      ? scheduling.tableNumber
      : typeof record.tableNumber === 'string'
        ? record.tableNumber
        : '',
  }
}

function capabilityMatchesScope(record: CapabilityRecord, scope: MatchScope | null) {
  if (!scope) {
    return false
  }

  if (record.matchID) {
    return scope.matchID === record.matchID
  }

  if (record.capabilityType === 'table_scoring') {
    return Boolean(record.tableID && scope.tableID === record.tableID)
  }

  if (record.capabilityType === 'team_match_scoring') {
    return Boolean(
      record.teamMatchID &&
      scope.teamMatchID === record.teamMatchID &&
      `${scope.tableNumber || ''}` === `${record.tableNumber || '1'}`,
    )
  }

  if (record.capabilityType === 'public_score_view') {
    if (record.tableID) {
      return scope.tableID === record.tableID
    }
    if (record.teamMatchID) {
      return scope.teamMatchID === record.teamMatchID &&
        `${scope.tableNumber || ''}` === `${record.tableNumber || scope.tableNumber || '1'}`
    }
  }

  return false
}

async function updateCapabilityAccess(record: CapabilityRecord, context?: CapabilityRequestContext) {
  const nextRecord = await updateCapabilityRecord(record.tokenId, (currentRecord) => ({
    ...currentRecord,
    status: getRecordStatus(currentRecord),
    lastAccessedAt: new Date().toISOString(),
    lastAccessIPHash: context?.ipAddress ? hashValue(context.ipAddress) : currentRecord.lastAccessIPHash || '',
    lastAccessUserAgentHash: context?.userAgent ? hashValue(context.userAgent) : currentRecord.lastAccessUserAgentHash || '',
    accessCount: Number(currentRecord.accessCount || 0) + 1,
  }))

  if (nextRecord && !context?.skipAudit) {
    await appendCapabilityAuditEvent(record.tokenId, 'resolved', context, {
      source: context?.source || 'resolve',
      status: nextRecord.status,
    })
  }

  return nextRecord
}

async function markCapabilityExpired(record: CapabilityRecord, context?: CapabilityRequestContext) {
  const nextRecord = await updateCapabilityRecord(record.tokenId, (currentRecord) => ({
    ...currentRecord,
    status: 'expired',
  }))

  if (nextRecord && !context?.skipAudit) {
    await appendCapabilityAuditEvent(record.tokenId, 'expired', context, {
      source: context?.source || 'resolve',
    })
  }
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
  requestContext,
  replacesTokenId,
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
  requestContext?: CapabilityRequestContext
  replacesTokenId?: string
}) {
  const tokenId = crypto.randomUUID()
  const issuedAt = Date.now()
  const expiresAt = expiresInHours && expiresInHours > 0 ? new Date(issuedAt + expiresInHours * 60 * 60 * 1000) : null
  const payload: CapabilityPayload = {
    v: 2,
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
    status: 'active',
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
    ...(replacesTokenId ? { replacesTokenId } : {}),
    ...(requestContext?.ipAddress ? { issuedFromIPHash: hashValue(requestContext.ipAddress) } : {}),
    ...(requestContext?.userAgent ? { issuedUserAgentHash: hashValue(requestContext.userAgent) } : {}),
    tokenFingerprint: fingerprintToken(token),
    accessCount: 0,
    invalidAttemptCount: 0,
    suspiciousAttemptCount: 0,
  }

  await executeServerDatabaseActions([
    { type: 'set', path: `capabilityTokens/${tokenId}`, value: record },
  ])
  await appendCapabilityAuditEvent(tokenId, 'issued', requestContext, {
    replacesTokenId: replacesTokenId || '',
    source: requestContext?.source || 'issue',
  })

  return { token, record }
}

export async function getCapabilityRecord(tokenId: string) {
  const [result] = await executeServerDatabaseActions([
    { type: 'get', path: `capabilityTokens/${tokenId}` },
  ])
  return (result?.value || null) as CapabilityRecord | null
}

export async function resolveCapabilityToken(
  token: string,
  expectedType?: CapabilityType,
  requestContext?: CapabilityRequestContext,
) {
  const payload = verifyCapabilitySignature(token)
  if (!payload) {
    return null
  }

  if (expectedType && payload.capabilityType !== expectedType) {
    return null
  }

  const record = await getCapabilityRecord(payload.jti)
  if (!record) {
    return null
  }

  if (record.tokenFingerprint !== fingerprintToken(token)) {
    return null
  }

  const status = getRecordStatus(record)
  if (status === 'revoked' || status === 'rotated') {
    return null
  }
  if (status === 'expired') {
    await markCapabilityExpired(record, requestContext)
    return null
  }

  if (requestContext?.skipAudit && requestContext?.source === 'database_proxy') {
    return {
      ...record,
      status,
    }
  }

  return updateCapabilityAccess(record, requestContext)
}

export async function listCapabilityTokens(filters: Partial<CapabilityRecord>) {
  const [result] = await executeServerDatabaseActions([
    { type: 'get', path: 'capabilityTokens' },
  ])
  const records = result?.value && typeof result.value === 'object'
    ? Object.values(result.value as Record<string, CapabilityRecord>)
    : []

  return records
    .filter((record) => Object.entries(filters).every(([key, value]) => {
      if (typeof value === 'undefined') {
        return true
      }
      return record[key as keyof CapabilityRecord] === value
    }))
    .map((record) => ({
      ...record,
      status: getRecordStatus(record),
    }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
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

export async function revokeCapabilityToken(
  tokenId: string,
  ownerID?: string,
  requestContext?: CapabilityRequestContext,
  reason = 'revoked_by_owner',
) {
  const record = await getCapabilityRecord(tokenId)
  if (!record) {
    return null
  }
  if (ownerID && record.createdBy !== ownerID && ownerID !== 'mylocalserver') {
    return null
  }

  const nextRecord = await updateCapabilityRecord(tokenId, (currentRecord) => ({
    ...currentRecord,
    status: currentRecord.replacedByTokenId ? 'rotated' : 'revoked',
    revokedAt: currentRecord.revokedAt || new Date().toISOString(),
    revokedBy: requestContext?.actorID || ownerID || currentRecord.revokedBy || '',
    revocationReason: reason,
  }))

  if (nextRecord) {
    await appendCapabilityAuditEvent(tokenId, 'revoked', requestContext, { reason })
  }

  return nextRecord
}

function deriveRotationHours(record: CapabilityRecord, expiresInHours?: number | null) {
  if (typeof expiresInHours === 'number') {
    return expiresInHours
  }
  if (!record.expiresAt) {
    return null
  }
  const remainingMs = new Date(record.expiresAt).getTime() - Date.now()
  if (remainingMs <= 0) {
    return 1
  }
  return Math.max(1, Math.ceil(remainingMs / (60 * 60 * 1000)))
}

export async function rotateCapabilityToken({
  tokenId,
  ownerID,
  expiresInHours,
  label,
  requestContext,
}: {
  tokenId: string
  ownerID: string
  expiresInHours?: number | null
  label?: string
  requestContext?: CapabilityRequestContext
}) {
  const currentRecord = await getOwnedCapabilityRecord(tokenId, ownerID)
  if (!currentRecord) {
    return null
  }

  const { token, record } = await issueCapabilityToken({
    capabilityType: currentRecord.capabilityType,
    createdBy: currentRecord.createdBy,
    expiresInHours: deriveRotationHours(currentRecord, expiresInHours),
    tableID: currentRecord.tableID,
    teamMatchID: currentRecord.teamMatchID,
    matchID: currentRecord.matchID,
    playerListID: currentRecord.playerListID,
    tableNumber: currentRecord.tableNumber,
    scoreboardID: currentRecord.scoreboardID,
    label: label || currentRecord.label,
    requestContext: {
      ...requestContext,
      source: requestContext?.source || 'rotate',
    },
    replacesTokenId: currentRecord.tokenId,
  })

  await updateCapabilityRecord(tokenId, (recordToRotate) => ({
    ...recordToRotate,
    status: 'rotated',
    revokedAt: recordToRotate.revokedAt || new Date().toISOString(),
    revokedBy: requestContext?.actorID || ownerID,
    revocationReason: 'rotated',
    rotatedAt: new Date().toISOString(),
    replacedByTokenId: record.tokenId,
  }))
  await appendCapabilityAuditEvent(tokenId, 'rotated', requestContext, {
    replacedByTokenId: record.tokenId,
  })

  return { token, record }
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
  if (record.capabilityType === 'table_scoring') {
    if (!record.tableID) {
      return false
    }
    if (!record.matchID) {
      return true
    }
  }

  if (record.capabilityType === 'team_match_scoring') {
    if (!record.teamMatchID) {
      return false
    }
    if (!record.matchID) {
      return true
    }
  }

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

export async function exchangeLegacyCapabilityToken({
  capabilityType,
  secret,
  tableID,
  playerListID,
  requestContext,
}: {
  capabilityType: 'table_scoring' | 'player_registration'
  secret: string
  tableID?: string
  playerListID?: string
  requestContext?: CapabilityRequestContext
}) {
  const targetPath = capabilityType === 'table_scoring'
    ? `tables/${tableID}`
    : `playerLists/${playerListID}`
  const recordValue = await getServerValue(targetPath)
  if (!recordValue || typeof recordValue !== 'object') {
    return null
  }

  const targetRecord = recordValue as Record<string, any>
  if (!isLegacyAccessAllowed(targetRecord)) {
    throw new RequestSecurityError('This legacy password link has expired. Generate a new secure link from the QR/access page.', 410, 'legacy_access_retired')
  }
  if (!isAccessSecretValid(secret, targetRecord)) {
    return null
  }

  const { token, record } = await issueCapabilityToken({
    capabilityType,
    createdBy: capabilityType === 'table_scoring'
      ? String(targetRecord.creatorID || '')
      : String(targetRecord.ownerID || ''),
    tableID,
    playerListID,
    expiresInHours: capabilityType === 'table_scoring' ? 12 : 6,
    requestContext: {
      ...requestContext,
      source: requestContext?.source || 'legacy_exchange',
    },
  })

  const legacyAccess = targetRecord.legacyAccess && typeof targetRecord.legacyAccess === 'object'
    ? targetRecord.legacyAccess as LegacyAccessRecord
    : {}

  await executeServerDatabaseActions([
    {
      type: 'update',
      path: targetPath,
      value: {
        legacyAccess: {
          ...legacyAccess,
          lastAccessedAt: new Date().toISOString(),
          lastIssuedCapabilityAt: new Date().toISOString(),
        },
      },
    },
  ])

  await appendCapabilityAuditEvent(record.tokenId, 'legacy_exchange', requestContext, {
    targetPath,
  })

  return { token, record }
}

async function capabilityCanReadMatch(record: CapabilityRecord, path: string) {
  if (!path.startsWith('matches/')) {
    return false
  }
  const segments = getPathSegments(path)
  const matchID = segments[1]
  if (!matchID) {
    return false
  }

  if (record.matchID) {
    return isPathOrChild(path, `matches/${record.matchID}`)
  }

  const scope = await getMatchScopeByID(matchID)
  return capabilityMatchesScope(record, scope)
}

export async function capabilityAllowsRead(record: CapabilityRecord, action: DatabaseAction) {
  if (action.type !== 'get') {
    return false
  }

  const path = normalizePath(action.path)

  switch (record.capabilityType) {
    case 'table_scoring':
      return isPathOrChild(path, `tables/${record.tableID}`) || await capabilityCanReadMatch(record, path)
    case 'team_match_scoring':
      return isPathOrChild(path, `teamMatches/${record.teamMatchID}`) || await capabilityCanReadMatch(record, path)
    case 'player_registration':
      return isPathOrChild(path, `playerLists/${record.playerListID}`)
    case 'public_score_view':
      return (
        Boolean(record.scoreboardID && isPathOrChild(path, `scoreboards/${record.scoreboardID}`)) ||
        Boolean(record.tableID && isPathOrChild(path, `tables/${record.tableID}`)) ||
        Boolean(record.teamMatchID && isPathOrChild(path, `teamMatches/${record.teamMatchID}`)) ||
        await capabilityCanReadMatch(record, path) ||
        (record.matchID ? isPathOrChild(path, `matches/${record.matchID}`) : false)
      )
  }
}

function getActionValue(action: DatabaseAction) {
  return 'value' in action ? action.value : undefined
}

async function capabilityCanWriteMatch(record: CapabilityRecord, action: DatabaseAction) {
  const path = normalizePath(action.path)
  const segments = getPathSegments(path)

  if (path === 'matches' && action.type === 'push') {
    return capabilityMatchesScope(record, getMatchScopeFromValue(getActionValue(action)))
  }

  if (segments[0] !== 'matches' || !segments[1]) {
    return false
  }

  const scope = await getMatchScopeByID(segments[1])
  return capabilityMatchesScope(record, scope)
}

async function capabilityAllowsTableWrite(record: CapabilityRecord, action: DatabaseAction) {
  const path = normalizePath(action.path)

  if (await capabilityCanWriteMatch(record, action)) {
    return true
  }

  if (!record.tableID) {
    return false
  }

  if (path === `tables/${record.tableID}/currentMatch`) {
    const actionValue = getActionValue(action)
    if (actionValue === '') {
      return action.type === 'set' || action.type === 'compareSet'
    }
    if (typeof actionValue !== 'string' || !actionValue) {
      return false
    }
    return capabilityMatchesScope(record, await getMatchScopeByID(actionValue))
  }

  if (isPathOrChild(path, `tables/${record.tableID}/scheduledMatches`)) {
    return action.type === 'set' || action.type === 'update' || action.type === 'remove'
  }

  if (path === `tables/${record.tableID}/archivedMatches` && action.type === 'push') {
    const actionValue = getActionValue(action)
    const archivedMatchID = actionValue && typeof actionValue === 'object'
      ? String((actionValue as Record<string, unknown>).matchID || '')
      : ''
    return archivedMatchID ? capabilityMatchesScope(record, await getMatchScopeByID(archivedMatchID)) : false
  }

  return false
}

async function capabilityAllowsTeamMatchWrite(record: CapabilityRecord, action: DatabaseAction) {
  const path = normalizePath(action.path)

  if (await capabilityCanWriteMatch(record, action)) {
    return true
  }

  if (!record.teamMatchID) {
    return false
  }

  if (path === `teamMatches/${record.teamMatchID}/currentMatches/${record.tableNumber || '1'}`) {
    const actionValue = getActionValue(action)
    if (actionValue === '') {
      return action.type === 'set' || action.type === 'compareSet'
    }
    if (typeof actionValue !== 'string' || !actionValue) {
      return false
    }
    return capabilityMatchesScope(record, await getMatchScopeByID(actionValue))
  }

  if (path === `teamMatches/${record.teamMatchID}/archivedMatches` && action.type === 'push') {
    const actionValue = getActionValue(action)
    const archivedMatchID = actionValue && typeof actionValue === 'object'
      ? String((actionValue as Record<string, unknown>).matchID || '')
      : ''
    return archivedMatchID ? capabilityMatchesScope(record, await getMatchScopeByID(archivedMatchID)) : false
  }

  return (
    isPathOrChild(path, `teamMatches/${record.teamMatchID}/teamAScore`) ||
    isPathOrChild(path, `teamMatches/${record.teamMatchID}/teamBScore`)
  )
}

export async function capabilityAllowsWrite(record: CapabilityRecord, action: DatabaseAction) {
  switch (record.capabilityType) {
    case 'table_scoring':
      return capabilityAllowsTableWrite(record, action)
    case 'team_match_scoring':
      return capabilityAllowsTeamMatchWrite(record, action)
    case 'player_registration':
      return isPathOrChild(normalizePath(action.path), `playerLists/${record.playerListID}/players`)
    case 'public_score_view':
      return false
  }
}
