import db, { getUserPath } from "../../database"

import { v4 as uuidv4 } from 'uuid';
import { defaultPlayerRegistrationFields } from "../registrationFields";

function nowTimestamp() {
    return new Date().toISOString()
}

async function touchPlayerList(playerListID) {
    await db.ref(`playerLists/${playerListID}/modifiedOn`).set(nowTimestamp())
}

export async function resetPlayerListPassword(playerListID) {
    let newPassword = uuidv4()
    await db.ref("playerLists/" + playerListID + "/password").set(newPassword)
    await touchPlayerList(playerListID)
    return newPassword

}

function isFullNameEntered(player) {
    if (player && player.firstName && player.lastName && player.firstName.length > 0 && player.lastName.length > 0) {
        return true
    }
    else {
        return false
    }
}

function isPartialNameEntered(player) {
    if (player && (player.firstName && player.firstName.length > 0) || player && (player.lastName && player.lastName.length > 0)) {
        return true
    }
    else {
        return false
    }
}

function getPlayerPartialName(player) {
    if (player && player.lastName && player.lastName.length > 0) {
        return player.lastName
    }

    else if (player && player.firstName && player.firstName.length > 0) {
        return player.firstName
    }
    else {
        return ""
    }
}

function getPlayerFullName(player) {
    let firstName = player && player.firstNameInitial === true ? player.firstName[0] : player.firstName
    let lastName = player && player.lastNameInitial === true ? player.lastName[0] : player.lastName
    return `${firstName} ${lastName}`

}

function getCombinedPlayersFormatted(player1, player2) {
    if (isPartialNameEntered(player1) && isPartialNameEntered(player2)) {
        return `${getPlayerPartialName(player1)}/${getPlayerPartialName(player2)}`
    }
    else {
        if (isFullNameEntered(player1)) {
            return getPlayerFullName(player1)
        }
        else {
            return getPlayerPartialName(player1)
        }
    }
}

export function getPlayerFormatted(player) {

    if (isFullNameEntered(player)) {
        return getPlayerFullName(player)
    }
    else {
        return getPlayerPartialName(player)
    }

}


export function getCombinedPlayerNames(playerA, playerB, playerA2, playerB2) {
    let playerNames = { a: "", b: "" }
    playerNames.a = getCombinedPlayersFormatted(playerA, playerA2)
    playerNames.b = getCombinedPlayersFormatted(playerB, playerB2)
    return playerNames
}


export async function getImportPlayerList(playerListID) {
    let playerListRef = db.ref(`playerLists/${playerListID}/players`)
    let playerListSnapshot = await playerListRef.get()
    let playerList = playerListSnapshot.val()
    if (playerList) {
        return Object.entries(playerList)
    }
    else {
        return []
    }


}

export async function getPlayerListDetails(playerListID) {
    let playerListRef = db.ref(`playerLists/${playerListID}`)
    let playerListSnapshot = await playerListRef.get()
    let playerList = playerListSnapshot.val()

    if (playerList) {
        return playerList
    }

    return {}
}

export async function getPlayerListName(playerListID) {
    let playerListRef = db.ref(`playerLists/${playerListID}/playerListName`)
    let playerListSnapshot = await playerListRef.get()
    let playerList = playerListSnapshot.val()
    if (playerList) {
        return playerList
    }
    else {
        return ""
    }


}

export async function updatePlayerListDetails(playerListID, details) {
    const updates = {
        ...details,
        modifiedOn: nowTimestamp(),
    }

    await db.ref(`playerLists/${playerListID}`).update(updates)

    if (typeof details.playerListName === "string") {
        const myPlayerListsSnap = await db.ref(`users/${getUserPath()}/myPlayerLists`).get()
        const myPlayerLists = myPlayerListsSnap.val()

        if (myPlayerLists && typeof myPlayerLists === "object") {
            const matchingUserList = Object.entries(myPlayerLists).find(([, data]) => data["id"] === playerListID)
            if (matchingUserList) {
                await db.ref(`users/${getUserPath()}/myPlayerLists/${matchingUserList[0]}`).update({
                    playerListName: details.playerListName,
                    modifiedOn: updates.modifiedOn,
                })
            }
        }
    }
}

export async function updateImportedPlayers(playerListID, players) {
    await db.ref(`playerLists/${playerListID}/players`).set(players)
    await touchPlayerList(playerListID)
}

function withArchivedMetadata(players) {
    const timestamp = nowTimestamp()
    return Object.entries(players || {}).reduce((archivedPlayers, [playerID, player]) => {
        archivedPlayers[playerID] = {
            ...player,
            archivedOn: timestamp,
        }
        return archivedPlayers
    }, {})
}

export async function updateImportedPlayersWithArchived(playerListID, players, archivedPlayers = {}) {
    const archivedPayload = withArchivedMetadata(archivedPlayers)
    await db.ref(`playerLists/${playerListID}/players`).set(players)

    if (Object.keys(archivedPayload).length > 0) {
        await db.ref(`playerLists/${playerListID}/archivedPlayers`).update(archivedPayload)
    }

    await touchPlayerList(playerListID)
}

export async function addImportedPlayer(playerListID, playerSettings) {

    let playerListRef = await db.ref(`playerLists/${playerListID}/players`).push({ ...playerSettings })
    await touchPlayerList(playerListID)
    return playerListRef.key

}
export async function editImportedPlayer(playerListID, playerID, playerSettings) {
    let playerListRef = db.ref(`playerLists/${playerListID}/players/${playerID}`)
    await playerListRef.update({ ...playerSettings })
    await touchPlayerList(playerListID)

}

export async function deleteImportedPlayer(playerListID, playerID) {
    let playerListRef = db.ref(`playerLists/${playerListID}/players/${playerID}`)
    await playerListRef.remove()
    await touchPlayerList(playerListID)

}

export async function archiveImportedPlayers(playerListID, playerIDs) {
    const playerListSnapshot = await db.ref(`playerLists/${playerListID}/players`).get()
    const players = playerListSnapshot.val() || {}
    const archivedPlayers = {}
    const activePlayers = { ...players }

    playerIDs.forEach((playerID) => {
        if (activePlayers[playerID]) {
            archivedPlayers[playerID] = activePlayers[playerID]
            delete activePlayers[playerID]
        }
    })

    await updateImportedPlayersWithArchived(playerListID, activePlayers, archivedPlayers)
}

export async function updateSinglePlayerInList(playerListID, playerID, playerSettings) {
    let updatePlayerListRef = db.ref(`playerLists/${playerListID}/players/${playerID}`)
    let updatePlayerListSnapshot = await updatePlayerListRef.set(playerSettings)
    await touchPlayerList(playerListID)
    let updatedPlayer = updatePlayerListSnapshot.val()
    return updatedPlayer
}

export function sortPlayers(playerValues) {
    return playerValues.sort((a, b) => {

        if ((a[1].firstName && b[1].firstName)) {
            return a[1].firstName.localeCompare(b[1].firstName);
        }
    });
}

export async function addPlayerList(name) {
    const timestamp = nowTimestamp()

    let playerListRef = await db.ref(`playerLists`).push({
        playerListName: name,
        players: {},
        password: uuidv4(),
        registrationFields: defaultPlayerRegistrationFields,
        createdOn: timestamp,
        modifiedOn: timestamp

    })
    await db.ref(`users/${getUserPath()}/myPlayerLists/`).push({ id: playerListRef.key, playerListName: name, createdOn: timestamp, modifiedOn: timestamp })
}

export function watchForPlayerListPasswordChange(playerListID, callback) {
    let tableRef = db.ref(`playerLists/${playerListID}/password`)
    tableRef.on("value", (passwordRef) => {
        if (typeof passwordRef.val() === "string") {
            callback(passwordRef.val())
        }
    })
    return () => { tableRef.off() }
}

export async function getMyPlayerLists() {
    let myPlayerListsSnap = await db.ref(`users/${getUserPath()}/myPlayerLists`).get()
    let myPlayerLists = myPlayerListsSnap.val()
    if (myPlayerLists !== null) {
        return Promise.all(Object.entries(myPlayerLists).map(async ([id, data]) => {
            const playerListID = data["id"]
            const playerListSnap = await db.ref(`playerLists/${playerListID}`).get()
            const playerList = playerListSnap.val() || {}
            const players = playerList.players && typeof playerList.players === "object" ? playerList.players : {}
            const playerCount = Object.values(players).filter((player) => player !== null && typeof player !== "undefined").length

            return [id, {
                ...data,
                password: playerList.password,
                playerCount,
                modifiedOn: playerList.modifiedOn || data["modifiedOn"] || playerList.createdOn || data["createdOn"] || null,
            }]
        }))
    }
    else {
        return []
    }
}

export async function deletePlayerList(myPlayerListID) {
    let myPlayerListsSnap = await db.ref(`users/${getUserPath()}/myPlayerLists/${myPlayerListID}`).remove()

}
