import db, { getUserPath } from '../lib/database'
import { listCapabilityLinks, revokeCapabilityLink } from './accessTokens'
import { auditOwnershipSnapshot } from '@/ownership/audit.js'
import { getOwnershipPolicy, isRecordActive as isOwnershipRecordActive } from '@/ownership/policies.js'

export const ACTIVE_DELETE_MODE = 'active'
export const SOFT_DELETED_DELETE_MODE = 'soft_deleted'
export const DELETION_LOG_ROOT = 'deletionLog'

type SoftDeleteAuditContext = {
  entityType?: string
  canonicalID?: string
  ownerID?: string
  previewPath?: string
  dependents?: Record<string, any>
}

export type OwnershipMutationOptions = {
  dryRun?: boolean
}

type OwnershipScanReport = ReturnType<typeof auditOwnershipSnapshot> & {
  dryRun: boolean
  appliedActions?: number
}

function getCanonicalIDFromPath(path: string) {
  return path.split('/').filter(Boolean)[1] || ''
}

function getEntityTypeFromPath(path: string) {
  const root = path.split('/').filter(Boolean)[0] || ''
  const rootToEntityType: Record<string, string> = {
    tables: 'table',
    matches: 'match',
    teamMatches: 'teamMatch',
    teams: 'team',
    playerLists: 'playerList',
    scoreboards: 'scoreboard',
    scoreboardTemplates: 'scoreboardTemplate',
    dynamicurls: 'dynamicURL',
  }
  return rootToEntityType[root] || root || 'unknown'
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date)
  nextDate.setUTCDate(nextDate.getUTCDate() + days)
  return nextDate
}

function replaceNowPlaceholders(value: unknown, now = new Date().toISOString()): unknown {
  if (value === '__NOW__') {
    return now
  }

  if (Array.isArray(value)) {
    return value.map((entry) => replaceNowPlaceholders(entry, now))
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [key, replaceNowPlaceholders(entry, now)]),
    )
  }

  return value
}

function getOwnerIDFromRecord(record: Record<string, any> | null | undefined) {
  if (!record || typeof record !== 'object') {
    return ''
  }

  return String(record.ownerID || record.creatorID || record.createdBy || '')
}

function getRetentionDays(entityType: string) {
  const policy = getOwnershipPolicy(entityType)
  return Number(policy?.retentionDays || 30)
}

function getNestedMatchIDs(value: unknown) {
  if (!value || typeof value !== 'object') {
    return []
  }

  const matchIDs: string[] = []
  for (const candidate of Object.values(value as Record<string, unknown>)) {
    if (typeof candidate === 'string' && candidate.length > 0) {
      matchIDs.push(candidate)
      continue
    }

    if (candidate && typeof candidate === 'object') {
      const record = candidate as Record<string, unknown>
      if (typeof record.matchID === 'string' && record.matchID.length > 0) {
        matchIDs.push(record.matchID)
      }
    }
  }

  return matchIDs
}

async function getRootValue(path: string) {
  const snapshot = await db.ref(path).get()
  return snapshot.val()
}

export function buildSoftDeleteMetadata(reason = 'user_requested', entityType = 'unknown') {
  const deletedAt = new Date()
  const retentionDays = getRetentionDays(entityType)
  return {
    deleteMode: SOFT_DELETED_DELETE_MODE,
    deletedAt: deletedAt.toISOString(),
    deletedBy: getUserPath(),
    deleteReason: reason,
    retentionDays,
    purgeAfter: addDays(deletedAt, retentionDays).toISOString(),
  }
}

export function isRecordActive(record: any) {
  return isOwnershipRecordActive(record)
}

export async function recordDeletionEvent(
  path: string,
  record: Record<string, any>,
  audit: SoftDeleteAuditContext = {},
  options: OwnershipMutationOptions = {},
) {
  const event = {
    entityType: audit.entityType || getEntityTypeFromPath(path),
    canonicalPath: path,
    canonicalID: audit.canonicalID || getCanonicalIDFromPath(path),
    ownerID: audit.ownerID || getOwnerIDFromRecord(record) || getUserPath(),
    previewPath: audit.previewPath || '',
    deleteMode: record.deleteMode || SOFT_DELETED_DELETE_MODE,
    deleteReason: record.deleteReason || 'user_requested',
    deletedAt: record.deletedAt || new Date().toISOString(),
    deletedBy: record.deletedBy || getUserPath(),
    dependents: audit.dependents || record.softDeletedDependents || {},
  }

  if (!options.dryRun) {
    await db.ref(DELETION_LOG_ROOT).push(event)
  }

  return event
}

export async function softDeleteCanonical(
  path: string,
  extra: Record<string, any> = {},
  audit: SoftDeleteAuditContext = {},
  options: OwnershipMutationOptions = {},
) {
  const snapshot = await db.ref(path).get()
  const current = snapshot.val()

  if (!current || typeof current !== 'object') {
    return null
  }

  const entityType = audit.entityType || getEntityTypeFromPath(path)
  const next = {
    ...current,
    ...buildSoftDeleteMetadata(extra.deleteReason || 'user_requested', entityType),
    ...extra,
  }

  if (!options.dryRun) {
    await db.ref(path).set(next)
  }
  await recordDeletionEvent(path, next, audit, options)
  return next
}

export async function getPreviewValue(path: string) {
  const snapshot = await db.ref(path).get()
  return snapshot.val()
}

export function collectTableDependentMatchIDs(tableRecord: Record<string, any> | null | undefined) {
  const currentMatchID = typeof tableRecord?.currentMatch === 'string' ? tableRecord.currentMatch : ''
  return Array.from(new Set([
    currentMatchID,
    ...getNestedMatchIDs(tableRecord?.scheduledMatches),
    ...getNestedMatchIDs(tableRecord?.previousMatches),
  ].filter(Boolean)))
}

export function collectTeamMatchDependentMatchIDs(teamMatchRecord: Record<string, any> | null | undefined) {
  return Array.from(new Set([
    ...getNestedMatchIDs(teamMatchRecord?.currentMatches),
    ...getNestedMatchIDs(teamMatchRecord?.scheduledMatches),
  ].filter(Boolean)))
}

export async function revokeCapabilityLinksByReference(
  {
    tableID,
    teamMatchID,
    playerListID,
    scoreboardID,
    reason,
  }: {
    tableID?: string
    teamMatchID?: string
    playerListID?: string
    scoreboardID?: string
    reason: string
  },
  options: OwnershipMutationOptions = {},
) {
  const filterSets = [
    tableID ? { tableID } : null,
    teamMatchID ? { teamMatchID } : null,
    playerListID ? { playerListID } : null,
    scoreboardID ? { scoreboardID } : null,
  ].filter(Boolean) as Array<Record<string, unknown>>

  if (filterSets.length === 0) {
    return []
  }

  const tokenIDs = new Set<string>()

  for (const filters of filterSets) {
    const records = await listCapabilityLinks(filters)
    for (const record of records) {
      if (record.revokedAt || record.status === 'revoked') {
        continue
      }
      tokenIDs.add(record.tokenId)
      if (!options.dryRun) {
        await revokeCapabilityLink(record.tokenId)
      }
    }
  }

  return Array.from(tokenIDs).sort()
}

export async function softDeleteMatches(
  matchIDs: string[],
  reason: string,
  auditBase: Omit<SoftDeleteAuditContext, 'entityType' | 'canonicalID'> = {},
  options: OwnershipMutationOptions = {},
) {
  const deletedMatchIDs: string[] = []

  for (const matchID of Array.from(new Set(matchIDs.filter(Boolean)))) {
    const deletedMatch = await softDeleteCanonical(
      `matches/${matchID}`,
      { deleteReason: reason },
      {
        ...auditBase,
        entityType: 'match',
        canonicalID: matchID,
      },
      options,
    )

    if (deletedMatch) {
      deletedMatchIDs.push(matchID)
    }
  }

  return deletedMatchIDs
}

export async function softDeleteDynamicURLsByReference(
  {
    tableID,
    scoreboardID,
    teamMatchID,
    reason,
  }: {
    tableID?: string
    scoreboardID?: string
    teamMatchID?: string
    reason: string
  },
  options: OwnershipMutationOptions = {},
) {
  const snapshot = await db.ref('dynamicurls').get()
  const dynamicURLs = snapshot.val()

  if (!dynamicURLs || typeof dynamicURLs !== 'object') {
    return []
  }

  const deleted: string[] = []

  for (const [dynamicURLID, dynamicURL] of Object.entries(dynamicURLs)) {
    const candidate = dynamicURL as Record<string, any>
    if (!isRecordActive(candidate)) {
      continue
    }

    const matches =
      (tableID && candidate.tableID === tableID) ||
      (scoreboardID && candidate.scoreboardID === scoreboardID) ||
      (teamMatchID && (candidate.teammatchID === teamMatchID || candidate.teamMatchID === teamMatchID))

    if (!matches) {
      continue
    }

    await softDeleteCanonical(
      `dynamicurls/${dynamicURLID}`,
      {
        deleteReason: reason,
        invalidatedBy: {
          tableID: tableID || '',
          scoreboardID: scoreboardID || '',
          teamMatchID: teamMatchID || '',
        },
      },
      {
        entityType: 'dynamicURL',
        canonicalID: dynamicURLID,
        ownerID: getOwnerIDFromRecord(candidate),
      },
      options,
    )
    deleted.push(dynamicURLID)
  }

  return deleted
}

export async function clearPlayerListIdFromTables(playerListID: string, options: OwnershipMutationOptions = {}) {
  const tables = await getRootValue('tables')

  if (!tables || typeof tables !== 'object') {
    return []
  }

  const cleared: string[] = []

  for (const [tableID, table] of Object.entries(tables)) {
    const candidate = table as Record<string, any>
    if (!isRecordActive(candidate)) {
      continue
    }

    if (candidate.playerListID === playerListID) {
      if (!options.dryRun) {
        await db.ref(`tables/${tableID}/playerListID`).set(null)
      }
      cleared.push(tableID)
    }
  }

  return cleared
}

export async function clearScoreboardIdFromTables(scoreboardID: string, options: OwnershipMutationOptions = {}) {
  const tables = await getRootValue('tables')

  if (!tables || typeof tables !== 'object') {
    return []
  }

  const cleared: string[] = []

  for (const [tableID, table] of Object.entries(tables)) {
    const candidate = table as Record<string, any>
    if (!isRecordActive(candidate)) {
      continue
    }

    if (candidate.scoreboardID === scoreboardID) {
      if (!options.dryRun) {
        await db.ref(`tables/${tableID}/scoreboardID`).set(null)
      }
      cleared.push(tableID)
    }
  }

  return cleared
}

export async function clearScoreboardTemplateIdFromScoreboards(templateID: string, options: OwnershipMutationOptions = {}) {
  const scoreboards = await getRootValue('scoreboards')

  if (!scoreboards || typeof scoreboards !== 'object') {
    return []
  }

  const clearedScoreboards: string[] = []

  for (const [scoreboardID, scoreboard] of Object.entries(scoreboards)) {
    const candidate = scoreboard as Record<string, any>
    if (!isRecordActive(candidate)) {
      continue
    }

    if (candidate.templateID !== templateID && candidate.scoreboardTemplateID !== templateID) {
      continue
    }

    if (!options.dryRun) {
      await Promise.all([
        db.ref(`scoreboards/${scoreboardID}/templateID`).set(''),
        db.ref(`scoreboards/${scoreboardID}/scoreboardTemplateID`).set(''),
      ])
    }
    clearedScoreboards.push(scoreboardID)
  }

  return clearedScoreboards
}

async function buildOwnershipSnapshot() {
  const [users, tables, matches, teamMatches, teams, playerLists, scoreboards, scoreboardTemplates, dynamicurls] = await Promise.all([
    getRootValue('users'),
    getRootValue('tables'),
    getRootValue('matches'),
    getRootValue('teamMatches'),
    getRootValue('teams'),
    getRootValue('playerLists'),
    getRootValue('scoreboards'),
    getRootValue('scoreboardTemplates'),
    getRootValue('dynamicurls'),
  ])

  return {
    users,
    tables,
    matches,
    teamMatches,
    teams,
    playerLists,
    scoreboards,
    scoreboardTemplates,
    dynamicurls,
  }
}

async function applyOwnershipFixAction(action: Record<string, any>) {
  switch (action.type) {
    case 'remove_preview':
      await db.ref(action.path).remove()
      return
    case 'rebuild_preview':
      await db.ref(`users/${action.userID}/${action.previewRoot}`).push(replaceNowPlaceholders(action.value))
      return
    case 'set_value':
      await db.ref(action.path).set(replaceNowPlaceholders(action.value))
      return
    case 'soft_delete_canonical':
      await softDeleteCanonical(
        action.path,
        {
          ...(action.extra || {}),
          deleteReason: action.reason || 'ownership_repair',
        },
        {
          entityType: action.entityType,
          canonicalID: action.canonicalID,
          ownerID: action.ownerID,
        },
      )
      return
    default:
      return
  }
}

export async function scanAndRepairOwnershipOrphans(options: OwnershipMutationOptions = {}): Promise<OwnershipScanReport> {
  const snapshot = await buildOwnershipSnapshot()
  const report = auditOwnershipSnapshot(snapshot)

  if (options.dryRun) {
    return {
      ...report,
      dryRun: true,
    }
  }

  for (const action of report.fixPlan.actions) {
    await applyOwnershipFixAction(action as Record<string, any>)
  }

  return {
    ...report,
    dryRun: false,
    appliedActions: report.fixPlan.actions.length,
  }
}

async function getTournamentChildIds(tournamentID: string, childPath: string): Promise<string[]> {
  const snapshot = await db.ref(`tournaments/${tournamentID}/${childPath}`).get()
  const children = snapshot.val()

  if (!children || typeof children !== 'object') {
    return []
  }

  return Object.entries(children)
    .filter(([, record]) => isRecordActive(record as Record<string, any>))
    .map(([id]) => id)
}

export async function softDeleteTournamentChildren(
  tournamentID: string,
  reason = 'parent_tournament_deleted',
  options: OwnershipMutationOptions = {},
): Promise<Record<string, string[]>> {
  const childPaths = [
    'events',
    'rounds',
    'brackets',
    'scheduleBlocks',
    'staffAssignments',
    'pendingInvites',
  ]

  const result: Record<string, string[]> = {}

  for (const childPath of childPaths) {
    const childIds = await getTournamentChildIds(tournamentID, childPath)
    for (const childId of childIds) {
      await softDeleteCanonical(
        `tournaments/${tournamentID}/${childPath}/${childId}`,
        { deleteReason: reason },
        {
          entityType: childPath.slice(0, -1),
          canonicalID: childId,
          ownerID: tournamentID,
        },
        options,
      )
    }
    result[childPath] = childIds
  }

  return result
}
