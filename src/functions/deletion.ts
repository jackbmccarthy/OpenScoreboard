import db, { getUserPath } from '../lib/database'

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

function getCanonicalIDFromPath(path: string) {
  return path.split('/').filter(Boolean)[1] || ''
}

function getEntityTypeFromPath(path: string) {
  return path.split('/').filter(Boolean)[0] || 'unknown'
}

export function buildSoftDeleteMetadata(reason = 'user_requested') {
  return {
    deleteMode: SOFT_DELETED_DELETE_MODE,
    deletedAt: new Date().toISOString(),
    deletedBy: getUserPath(),
    deleteReason: reason,
    purgeAfter: null,
  }
}

export function isRecordActive(record: any) {
  if (!record || typeof record !== 'object') {
    return false
  }

  return !record.deleteMode || record.deleteMode === ACTIVE_DELETE_MODE
}

export async function recordDeletionEvent(
  path: string,
  record: Record<string, any>,
  audit: SoftDeleteAuditContext = {},
) {
  return db.ref(DELETION_LOG_ROOT).push({
    entityType: audit.entityType || getEntityTypeFromPath(path),
    canonicalPath: path,
    canonicalID: audit.canonicalID || getCanonicalIDFromPath(path),
    ownerID: audit.ownerID || record.ownerID || getUserPath(),
    previewPath: audit.previewPath || '',
    deleteMode: record.deleteMode || SOFT_DELETED_DELETE_MODE,
    deleteReason: record.deleteReason || 'user_requested',
    deletedAt: record.deletedAt || new Date().toISOString(),
    deletedBy: record.deletedBy || getUserPath(),
    dependents: audit.dependents || record.softDeletedDependents || {},
  })
}

export async function softDeleteCanonical(
  path: string,
  extra: Record<string, any> = {},
  audit: SoftDeleteAuditContext = {},
) {
  const snapshot = await db.ref(path).get()
  const current = snapshot.val()

  if (!current || typeof current !== 'object') {
    return null
  }

  const next = {
    ...current,
    ...buildSoftDeleteMetadata(),
    ...extra,
  }

  await db.ref(path).set(next)
  await recordDeletionEvent(path, next, audit)
  return next
}

export async function getPreviewValue(path: string) {
  const snapshot = await db.ref(path).get()
  return snapshot.val()
}

export async function softDeleteDynamicURLsByReference({
  tableID,
  scoreboardID,
  teamMatchID,
  reason,
}: {
  tableID?: string
  scoreboardID?: string
  teamMatchID?: string
  reason: string
}) {
  const snapshot = await db.ref('dynamicurls').get()
  const dynamicURLs = snapshot.val()

  if (!dynamicURLs || typeof dynamicURLs !== 'object') {
    return []
  }

  const deleted: string[] = []

  for (const [dynamicURLID, dynamicURL] of Object.entries(dynamicURLs)) {
    const candidate = dynamicURL as Record<string, any>
    const matches =
      (tableID && candidate.tableID === tableID) ||
      (scoreboardID && candidate.scoreboardID === scoreboardID) ||
      (teamMatchID && (candidate.teammatchID === teamMatchID || candidate.teamMatchID === teamMatchID))

    if (!matches) {
      continue
    }

    await softDeleteCanonical(`dynamicurls/${dynamicURLID}`, {
      deleteReason: reason,
      invalidatedBy: {
        tableID: tableID || '',
        scoreboardID: scoreboardID || '',
        teamMatchID: teamMatchID || '',
      },
    })
    deleted.push(dynamicURLID)
  }

  return deleted
}

/**
 * Clear playerListID on any table records that reference the given player list.
 * This prevents dangling references after a player list is deleted.
 */
export async function clearPlayerListIdFromTables(playerListID: string) {
  const snapshot = await db.ref('tables').get()
  const tables = snapshot.val()

  if (!tables || typeof tables !== 'object') {
    return []
  }

  const cleared: string[] = []

  for (const [tableID, table] of Object.entries(tables)) {
    const candidate = table as Record<string, any>
    if (candidate.playerListID === playerListID) {
      await db.ref(`tables/${tableID}/playerListID`).set(null)
      cleared.push(tableID)
    }
  }

  return cleared
}
