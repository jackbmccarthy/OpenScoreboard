import db, { getStringValue, getUserPath, getValue } from "../lib/database"
import { subscribeToPathValue } from "../lib/realtime";
import { v4 as uuidv4 } from 'uuid';
import Table from "../classes/Table";
import { buildAccessSecretMetadata, hasAccessSecret, isAccessSecretValid } from './accessSecrets';
import type { OwnershipMutationOptions } from './deletion';
import { collectTableDependentMatchIDs, getPreviewValue, isRecordActive, revokeCapabilityLinksByReference, softDeleteCanonical, softDeleteDynamicURLsByReference, softDeleteMatches } from './deletion';
import { getMatchData, getMatchScore, getNextPromotableScheduledMatch, isScheduledMatchPromotable, sortScheduledMatchEntries } from './scoring';
import { getCombinedPlayerNames } from './players';
import type { Match as MatchRecord, ScheduledMatch, Table as TableRecord } from '../types/matches';

type TableListRow = {
  tableID: string
  tableName: string
  sportName: string
  scoringType: string
  autoAdvanceMode: 'manual' | 'prompt' | 'automatic'
  autoAdvanceDelaySeconds: number
  playerListID: string
  currentMatchID?: string
  currentMatchSummary?: {
    label: string
    scoreLabel: string
    contextLabel: string
  } | null
  queueCount?: number
  nextScheduledMatch?: {
    label: string
    startTime: string
    status: string
    contextLabel: string
  } | null
  status?: 'active' | 'called' | 'paused' | 'queued' | 'idle'
}
export async function resetTablePassword(tableID) {
  let newPassword = uuidv4()
  await db.ref("tables/" + tableID).update({
    password: "",
    ...buildAccessSecretMetadata(newPassword),
  })
  return newPassword

}

export async function createNewTable(tableName, playerListID, sportName, scoringType, autoAdvanceMode = 'manual', autoAdvanceDelaySeconds = 0) {


  let newTable = new Table(tableName, getUserPath(), playerListID, sportName, scoringType, autoAdvanceMode, autoAdvanceDelaySeconds)
  let newTableResult = await db.ref("tables").push(newTable)
  await db.ref("users/" + getUserPath() + "/myTables").push(newTableResult.key)
  return newTableResult.key

}

export async function getTable(tableID: string): Promise<TableRecord | null> {
  const table = await getValue<TableRecord>(`tables/${tableID}`)
  return isRecordActive(table) ? table : null
}

export function subscribeToTable(
  tableID: string,
  callback: (table: TableRecord | null) => void,
) {
  return subscribeToPathValue(`tables/${tableID}`, (tableValue) => {
    callback(isRecordActive(tableValue) ? (tableValue as TableRecord) : null)
  })
}

export async function updateTable(tableID, tableSettings) {
  const currentTable = await getTable(tableID)
  await db.ref(`tables/${tableID}`).set({
    ...(currentTable || {}),
    ...(tableSettings || {})
  })
}

export async function getScheduledTableMatches(tableID) {
  const schedMatches = await getValue<Record<string, ScheduledMatch>>(`tables/${tableID}/scheduledMatches`)
  return schedMatches ? Object.entries(schedMatches) : []
}

export async function setScheduledTableMatchToCurrentMatch(tableID, matchID, scheduledMatchID) {
  await db.ref(`tables/${tableID}/currentMatch`).set(matchID)
  await db.ref(`tables/${tableID}/scheduledMatches/${scheduledMatchID}`).remove()



}

export async function getTableName(tableID) {
  return await getStringValue(`tables/${tableID}/tableName`)
}

export async function isTableAccessRequired(tableID: string) {
  const tableSnap = await db.ref(`tables/${tableID}`).get()
  return hasAccessSecret(tableSnap.val())
}

export async function verifyTablePassword(tableID: string, input: string) {
  const tableSnap = await db.ref(`tables/${tableID}`).get()
  return isAccessSecretValid(input, tableSnap.val())
}
export async function deleteAllMyTables() {
  await db.ref(`users/${getUserPath()}/myTables/`).set({})
}

export async function deleteTable(myTableID, options: OwnershipMutationOptions = {}) {
  const previewPath = `users/${getUserPath()}/myTables/${myTableID}`
  const tableID = await getPreviewValue(previewPath)
  const tableRecord = typeof tableID === 'string' && tableID.length > 0
    ? await getTable(tableID)
    : null
  const dependentMatchIDs = collectTableDependentMatchIDs(tableRecord as Record<string, any> | null)
  const report = {
    entityType: 'table',
    canonicalID: typeof tableID === 'string' ? tableID : '',
    canonicalPath: typeof tableID === 'string' && tableID.length > 0 ? `tables/${tableID}` : '',
    previewPath,
    dryRun: Boolean(options.dryRun),
    deleteMode: 'soft_deleted',
    ownerID: getUserPath(),
    dependentIDs: {
      matches: dependentMatchIDs,
      dynamicURLs: [] as string[],
      revokedCapabilityTokenIDs: [] as string[],
    },
  }
  if (typeof tableID === 'string' && tableID.length > 0) {
    const softDeletedMatchIDs = await softDeleteMatches(dependentMatchIDs, 'parent_table_soft_deleted', {
      ownerID: getUserPath(),
      previewPath,
    }, options)
    const softDeletedDependents = {
      matches: softDeletedMatchIDs,
      dynamicURLs: await softDeleteDynamicURLsByReference({ tableID, reason: 'parent_table_soft_deleted' }, options),
    }
    const revokedCapabilityTokenIDs = await revokeCapabilityLinksByReference({
      tableID,
      reason: 'parent_table_soft_deleted',
    }, options)
    await softDeleteCanonical(`tables/${tableID}`, {
      deleteReason: 'delete_table',
      softDeletedDependents,
      revokedCapabilityTokenIDs,
    }, {
      entityType: 'table',
      canonicalID: tableID,
      ownerID: getUserPath(),
      previewPath,
      dependents: softDeletedDependents,
    }, options)
    report.dependentIDs = {
      matches: softDeletedMatchIDs,
      dynamicURLs: softDeletedDependents.dynamicURLs,
      revokedCapabilityTokenIDs,
    }
  }
  if (!options.dryRun) {
    await db.ref(previewPath).remove()
  }
  return report
}

export async function setPlayerListToTable(tableID, playerListID, myTableID) {
  await db.ref(`tables/${tableID}/playerListID`).set(playerListID)

}
export async function getPlayerListIDForTable(tableID) {
  let playerListSnap = await db.ref(`tables/${tableID}/playerListID`).get()
  let playerListID = playerListSnap.val()
  if (playerListID !== null) {
    return playerListID
  }
  else {
    return ""
  }
}

export async function getMyTables() {
  let myTablesSnap = await db.ref("users" + "/" + getUserPath() + "/" + "myTables").get()
  let myTables = myTablesSnap.val()
  if (myTables) {
    return Promise.all(Object.entries(myTables).map(async ([myTableID, tableValue]) => {
      let tableID = String(tableValue ?? '')
      let tableInfo = await getTable(tableID)
      return [myTableID, {
        tableID,
        tableName: tableInfo?.tableName || '',
        sportName: tableInfo?.sportName || '',
        scoringType: tableInfo?.scoringType || '',
        autoAdvanceMode: tableInfo?.autoAdvanceMode || 'manual',
        autoAdvanceDelaySeconds: Number(tableInfo?.autoAdvanceDelaySeconds || 0),
        playerListID: tableInfo?.playerListID || ''
      }]
    }))
  }
  else {
    return []
  }
}

function buildCurrentMatchSummary(match: MatchRecord | null) {
  if (!match) {
    return null
  }

  const playerNames = getCombinedPlayerNames(match.playerA, match.playerB, match.playerA2, match.playerB2)
  const score = getMatchScore(match)

  return {
    label: `${playerNames.a || 'Player A'} vs ${playerNames.b || 'Player B'}`,
    scoreLabel: `${score.a}-${score.b}`,
    contextLabel: [match.matchRound || match.context?.matchRound || '', match.eventName || match.context?.eventName || ''].filter(Boolean).join(' • '),
  }
}

function buildNextScheduledMatchSummary(scheduledMatches: Array<[string, ScheduledMatch]>) {
  const nextEntry = getNextPromotableScheduledMatch(scheduledMatches)
  if (!nextEntry) {
    return null
  }
  const [, nextMatch] = nextEntry
  return {
    label: `${nextMatch.playerA || 'TBD'} vs ${nextMatch.playerB || 'TBD'}`,
    startTime: typeof nextMatch.startTime === 'string' ? nextMatch.startTime : '',
    status: typeof nextMatch.status === 'string' ? nextMatch.status : 'scheduled',
    contextLabel: [nextMatch.matchRound || '', nextMatch.eventName || ''].filter(Boolean).join(' • '),
  }
}

function buildTableStatus({
  currentMatchID,
  queuedMatches,
}: {
  currentMatchID: string
  queuedMatches: Array<[string, ScheduledMatch]>
}) {
  if (currentMatchID) {
    return 'active'
  }
  if (queuedMatches.some(([, scheduledMatch]) => scheduledMatch.status === 'called')) {
    return 'called'
  }
  if (queuedMatches.some(([, scheduledMatch]) => scheduledMatch.status === 'paused')) {
    return 'paused'
  }
  if (queuedMatches.length > 0) {
    return 'queued'
  }
  return 'idle'
}

export function subscribeToMyTables(
  callback: (tables: Array<[string, TableListRow]>) => void,
  userID = getUserPath(),
) {
  const tableRows = new Map<string, [string, TableListRow]>()
  const tableSubscriptions = new Map<string, () => void>()
  const matchSubscriptions = new Map<string, () => void>()
  const tableRecords = new Map<string, TableRecord & { id: string }>()
  const currentMatches = new Map<string, MatchRecord | null>()
  const currentMatchIDs = new Map<string, string>()

  const emitRows = () => {
    callback(Array.from(tableRows.values()))
  }

  const updateRow = (myTableID: string) => {
    const tableInfo = tableRecords.get(myTableID)
    if (!tableInfo) {
      tableRows.delete(myTableID)
      emitRows()
      return
    }

    const tableID = String(tableInfo.id || '')
    const currentMatchID = currentMatchIDs.get(myTableID) || ''
    const currentMatch = currentMatches.get(myTableID) || null
    const scheduledMatches = tableInfo.scheduledMatches && typeof tableInfo.scheduledMatches === 'object'
      ? Object.entries(tableInfo.scheduledMatches as Record<string, ScheduledMatch>)
      : []
    const queuedMatches = sortScheduledMatchEntries(scheduledMatches).filter(([, scheduledMatch]) => isScheduledMatchPromotable(scheduledMatch))
    const queueCount = queuedMatches.length

    tableRows.set(myTableID, [myTableID, {
      tableID,
      tableName: tableInfo.tableName || '',
      sportName: tableInfo.sportName || '',
      scoringType: tableInfo.scoringType || '',
      autoAdvanceMode: (tableInfo.autoAdvanceMode || 'manual') as 'manual' | 'prompt' | 'automatic',
      autoAdvanceDelaySeconds: Number(tableInfo.autoAdvanceDelaySeconds || 0),
      playerListID: tableInfo.playerListID || '',
      currentMatchID,
      currentMatchSummary: buildCurrentMatchSummary(currentMatch),
      queueCount,
      nextScheduledMatch: buildNextScheduledMatchSummary(scheduledMatches),
      status: buildTableStatus({ currentMatchID, queuedMatches }),
    }])
    emitRows()
  }

  const subscribeToCurrentMatch = (myTableID: string, matchID: string) => {
    matchSubscriptions.get(myTableID)?.()
    matchSubscriptions.delete(myTableID)

    if (!matchID) {
      currentMatchIDs.set(myTableID, '')
      currentMatches.set(myTableID, null)
      updateRow(myTableID)
      return
    }

    currentMatchIDs.set(myTableID, matchID)
    matchSubscriptions.set(myTableID, subscribeToPathValue(`matches/${matchID}`, (matchValue) => {
      currentMatches.set(myTableID, matchValue && typeof matchValue === 'object' ? matchValue as MatchRecord : null)
      updateRow(myTableID)
    }))
  }

  const ownerSubscription = subscribeToPathValue(`users/${userID}/myTables`, (myTablesValue) => {
    const ownerEntries = myTablesValue && typeof myTablesValue === 'object'
      ? Object.entries(myTablesValue as Record<string, unknown>)
      : []
    const activeMyTableIDs = new Set(ownerEntries.map(([myTableID]) => myTableID))

    Array.from(tableSubscriptions.keys()).forEach((myTableID) => {
      if (!activeMyTableIDs.has(myTableID)) {
        tableSubscriptions.get(myTableID)?.()
        tableSubscriptions.delete(myTableID)
        matchSubscriptions.get(myTableID)?.()
        matchSubscriptions.delete(myTableID)
        tableRecords.delete(myTableID)
        currentMatches.delete(myTableID)
        currentMatchIDs.delete(myTableID)
        tableRows.delete(myTableID)
      }
    })

    ownerEntries.forEach(([myTableID, tableValue]) => {
      const tableID = String(tableValue ?? '')
      const existingTableRecord = tableRecords.get(myTableID)
      if (existingTableRecord && String(existingTableRecord.id || '') === tableID) {
        return
      }

      tableSubscriptions.get(myTableID)?.()
      matchSubscriptions.get(myTableID)?.()
      matchSubscriptions.delete(myTableID)
      tableSubscriptions.set(myTableID, subscribeToPathValue(`tables/${tableID}`, (tableValueRecord) => {
        if (!isRecordActive(tableValueRecord)) {
          tableSubscriptions.get(myTableID)?.()
          tableSubscriptions.delete(myTableID)
          matchSubscriptions.get(myTableID)?.()
          matchSubscriptions.delete(myTableID)
          tableRows.delete(myTableID)
          tableRecords.delete(myTableID)
          currentMatches.delete(myTableID)
          currentMatchIDs.delete(myTableID)
          emitRows()
          return
        }

        const tableInfo: TableRecord & { id: string } = {
          ...(tableValueRecord as TableRecord),
          id: tableID,
        }
        tableRecords.set(myTableID, tableInfo)
        const nextCurrentMatchID = typeof tableInfo.currentMatch === 'string' ? tableInfo.currentMatch : ''
        if (currentMatchIDs.get(myTableID) !== nextCurrentMatchID) {
          subscribeToCurrentMatch(myTableID, nextCurrentMatchID)
          return
        }
        updateRow(myTableID)
      }))
    })

    emitRows()
  })

  return () => {
    ownerSubscription()
    Array.from(tableSubscriptions.values()).forEach((unsubscribe) => unsubscribe())
    Array.from(matchSubscriptions.values()).forEach((unsubscribe) => unsubscribe())
  }
}
