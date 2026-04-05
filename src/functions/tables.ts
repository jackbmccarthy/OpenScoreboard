import db, { getUserPath } from "../lib/database"
import { v4 as uuidv4 } from 'uuid';
import Table from "../classes/Table";
export async function resetTablePassword(tableID) {
  let newPassword = uuidv4()
  await db.ref("tables/" + tableID + "/password").set(newPassword)

}

export async function createNewTable(tableName, playerListID, sportName, scoringType) {


  let newTable = new Table(tableName, getUserPath(), playerListID, sportName, scoringType)
  let newTableResult = await db.ref("tables").push(newTable)
  await db.ref("users/" + getUserPath() + "/myTables").push(newTableResult.key)
  return newTableResult.key

}

export async function getTable(tableID) {
  const tableSnap = await db.ref(`tables/${tableID}`).get()
  return tableSnap.val()
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
    return Promise.all(Object.entries(myTables).map(async ([myTableID, tableValue]) => {
      let tableID = String(tableValue ?? '')
      let tableInfo = await getTable(tableID)
      return [myTableID, {
        tableID,
        tableName: tableInfo?.tableName || '',
        sportName: tableInfo?.sportName || '',
        scoringType: tableInfo?.scoringType || '',
        playerListID: tableInfo?.playerListID || ''
      }]
    }))
  }
  else {
    return []
  }
}
