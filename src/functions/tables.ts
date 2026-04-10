import db, { getUserPath } from "../lib/database"
import { subscribeToPathValue } from "../lib/realtime";
import { v4 as uuidv4 } from 'uuid';
import Table from "../classes/Table";
import { buildAccessSecretMetadata, hasAccessSecret, isAccessSecretValid } from './accessSecrets';
import { getPreviewValue, isRecordActive, softDeleteCanonical, softDeleteDynamicURLsByReference } from './deletion';
import { getMatchData, getMatchScore, getNextPromotableScheduledMatch, isScheduledMatchPromotable, sortScheduledMatchEntries } from './scoring';
import { getCombinedPlayerNames } from './players';
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

export async function getTable(tableID) {
  const tableSnap = await db.ref(`tables/${tableID}`).get()
  const table = tableSnap.val()
  return isRecordActive(table) ? table : null
}

export function subscribeToTable(
  tableID: string,
  callback: (table: Record<string, unknown> | null) => void,
) {
  return subscribeToPathValue(`tables/${tableID}`, (tableValue) => {
    callback(isRecordActive(tableValue) ? (tableValue as Record<string, unknown>) : null)
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
  let schedMatches = await db.ref("tables/" + tableID + "/scheduledMatches").get()
  if (schedMatches.val()) {
    return Object.entries(schedMatches.val())
  }
  else {
    return []
  }

}

export async function setScheduledTableMatchToCurrentMatch(tableID, matchID, scheduledMatchID) {
  await db.ref(`tables/${tableID}/currentMatch`).set(matchID)
  await db.ref(`tables/${tableID}/scheduledMatches/${scheduledMatchID}`).remove()



}

export async function getTableName(tableID) {
  let name = await db.ref(`tables/${tableID}/tableName`).get()
  return name.val()
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

export async function deleteTable(myTableID) {
  const previewPath = `users/${getUserPath()}/myTables/${myTableID}`
  const tableID = await getPreviewValue(previewPath)
  if (typeof tableID === 'string' && tableID.length > 0) {
    const softDeletedDependents = {
      dynamicURLs: await softDeleteDynamicURLsByReference({ tableID, reason: 'parent_table_soft_deleted' }),
    }
    await softDeleteCanonical(`tables/${tableID}`, {
      deleteReason: 'delete_table',
      softDeletedDependents,
    }, {
      entityType: 'table',
      canonicalID: tableID,
      ownerID: getUserPath(),
      previewPath,
      dependents: softDeletedDependents,
    })
  }
  await db.ref(previewPath).remove()
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

function buildCurrentMatchSummary(match: Record<string, any> | null) {
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

function buildNextScheduledMatchSummary(scheduledMatches: Array<[string, Record<string, any>]>) {
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
  queuedMatches: Array<[string, Record<string, any>]>
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
  callback: (tables: Array<[string, Record<string, any>]>) => void,
  userID = getUserPath(),
) {
  const tableRows = new Map<string, [string, Record<string, any>]>()
  const tableSubscriptions = new Map<string, () => void>()
  const matchSubscriptions = new Map<string, () => void>()
  const tableRecords = new Map<string, Record<string, any>>()
  const currentMatches = new Map<string, Record<string, any> | null>()
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

    const tableID = String(tableInfo.id || tableInfo.tableID || '')
    const currentMatchID = currentMatchIDs.get(myTableID) || ''
    const currentMatch = currentMatches.get(myTableID) || null
    const scheduledMatches = tableInfo.scheduledMatches && typeof tableInfo.scheduledMatches === 'object'
      ? Object.entries(tableInfo.scheduledMatches as Record<string, Record<string, any>>)
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
      currentMatches.set(myTableID, matchValue && typeof matchValue === 'object' ? matchValue as Record<string, any> : null)
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
      if (existingTableRecord && String(existingTableRecord.id || existingTableRecord.tableID || '') === tableID) {
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

        const tableInfo: Record<string, any> = {
          ...(tableValueRecord as Record<string, any>),
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
