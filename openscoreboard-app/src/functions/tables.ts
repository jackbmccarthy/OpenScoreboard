import db, { getUserPath } from "../../database"
import { v4 as uuidv4 } from 'uuid';
import Table from "../classes/Table";
import { setScheduledMatchToCurrentForSource } from "./scheduling";

export function getValidTableName(tableName) {
  const cleanTableName = `${tableName ?? ""}`.trim()
  if (!cleanTableName) {
    throw new Error("Table name is required.")
  }
  return cleanTableName
}

export async function updateTableName(tableID, tableName) {
  if (!tableID) {
    throw new Error("Table ID is required.")
  }
  const cleanTableName = getValidTableName(tableName)
  await db.ref(`tables/${tableID}/tableName`).set(cleanTableName)
  return cleanTableName
}

export async function updateTableMode(tableID, tableMode) {
  if (!tableID) {
    throw new Error("Table ID is required.")
  }
  const nextTableMode = tableMode === "kiosk" ? "kiosk" : "standard"
  await db.ref(`tables/${tableID}/tableMode`).set(nextTableMode)
  return nextTableMode
}

export async function resetTablePassword(tableID) {
  let newPassword = uuidv4()
  await db.ref("tables/" + tableID + "/password").set(newPassword)
  return newPassword

}

export async function createNewTable(tableName, playerListID, sportName, scoringType, tableMode = "standard") {

  const cleanTableName = getValidTableName(tableName)
  let newTable = new Table(cleanTableName, getUserPath(), playerListID, sportName, scoringType, tableMode)
  let newTableResult = await db.ref("tables").push(newTable)
  await db.ref("users/" + getUserPath() + "/myTables").push(newTableResult.key)

}

export function compareScheduledTableMatches(firstMatch, secondMatch) {
    const first = firstMatch?.[1] || {}
    const second = secondMatch?.[1] || {}
    const firstQueuePosition = Number(first.queuePosition)
    const secondQueuePosition = Number(second.queuePosition)

    if (Number.isFinite(firstQueuePosition) && Number.isFinite(secondQueuePosition) && firstQueuePosition !== secondQueuePosition) {
      return firstQueuePosition - secondQueuePosition
    }
    if (Number.isFinite(firstQueuePosition) !== Number.isFinite(secondQueuePosition)) {
      return Number.isFinite(firstQueuePosition) ? -1 : 1
    }

    const firstTime = new Date(first.scheduledOn || first.startTime || 0).getTime()
    const secondTime = new Date(second.scheduledOn || second.startTime || 0).getTime()
    if (firstTime !== secondTime) {
      return firstTime - secondTime
    }

    return `${firstMatch?.[0] || ""}`.localeCompare(`${secondMatch?.[0] || ""}`)
}

export function sortScheduledTableMatches(matches: any[] = []) {
  return [...matches].sort(compareScheduledTableMatches)
}

export function isPendingScheduledTableMatch(match) {
  return match?.isComplete !== true &&
    match?.status !== "active" &&
    match?.status !== "cancelled" &&
    match?.status !== "complete" &&
    match?.status !== "resolved"
}

export async function getScheduledTableMatches(tableID, options: any = {}) {
  let schedMatches = await db.ref("tables/" + tableID + "/scheduledMatches").get()
  if (schedMatches.val()) {
    let matches = sortScheduledTableMatches(Object.entries(schedMatches.val()))
    if (options.pendingOnly === true) {
      return matches.filter(([, match]: any) => isPendingScheduledTableMatch(match))
    }
    return matches
  }
  else {
    return []
  }

}

export async function setScheduledTableMatchToCurrentMatch(tableID, matchID, scheduledMatchID) {
  await setScheduledMatchToCurrentForSource("table", tableID, "", scheduledMatchID)
}

export async function getTableName(tableID) {
  let name = await db.ref(`tables/${tableID}/tableName`).get()
  return name.val()
}

export async function getTableInfo(tableID) {
  const tableSnapshot = await db.ref(`tables/${tableID}`).get()
  const table = tableSnapshot.val() || {}
  return {
    playerListID: table.playerListID || "",
    scoringType: table.scoringType || "",
    sportName: table.sportName || "tableTennis",
    tableName: table.tableName || "Table",
    tableMode: table.tableMode === "kiosk" ? "kiosk" : "standard",
  }
}

export async function getTablePassword(tableID) {
  let passwordSnap = await db.ref("tables/" + tableID + "/password").get()
  return passwordSnap.val()
}
export async function deleteAllMyTables() {
  await db.ref(`users/${getUserPath()}/myTables/`).set({})
}

export async function deleteTable(myTableID) {
  await db.ref(`users/${getUserPath()}/myTables/${myTableID}`).remove()
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
    return Promise.all(Object.entries(myTables).map(async (table) => {
      let tableID = table[1]
      let tableInfo = await getTableInfo(tableID)
      return [tableID, tableInfo]
    }))
  }
  else {
    return []
  }
}
