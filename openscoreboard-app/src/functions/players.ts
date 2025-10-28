import db, { getUserPath } from "../../database"

import { v4 as uuidv4 } from 'uuid';

export async function resetPlayerListPassword(playerListID) {
    let newPassword = uuidv4()
    await db.ref("playerLists/" + playerListID + "/password").set(newPassword)

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
    let lastName = player && player.lastNameInitial === true ? player.firstName[0] : player.lastName
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

export async function addImportedPlayer(playerListID, playerSettings) {

    let playerListRef = await db.ref(`playerLists/${playerListID}/players`).push({ ...playerSettings })
    return playerListRef.key

}
export async function editImportedPlayer(playerListID, playerID, playerSettings) {
    let playerListRef = db.ref(`playerLists/${playerListID}/players/${playerID}`)
    await playerListRef.update({ ...playerSettings })

}

export async function deleteImportedPlayer(playerListID, playerID) {
    let playerListRef = db.ref(`playerLists/${playerListID}/players/${playerID}`)
    await playerListRef.remove()

}

export async function updateSinglePlayerInList(playerListID, playerID, playerSettings) {
    let updatePlayerListRef = db.ref(`playerLists/${playerListID}/players/${playerID}`)
    let updatePlayerListSnapshot = await updatePlayerListRef.set(playerSettings)
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

    let playerListRef = await db.ref(`playerLists`).push({
        playerListName: name,
        players: {},
        password: uuidv4()

    })
    await db.ref(`users/${getUserPath()}/myPlayerLists/`).push({ id: playerListRef.key, playerListName: name })
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
            console.log(`playerLists/${data["id"]}/password`)
            let passwordRef = db.ref(`playerLists/${data["id"]}/password`)
            let passwordSnap = await passwordRef.get()
            return [id, { ...data, password: passwordSnap.val() }]
        }))
    }
    else {
        return []
    }
}

export async function deletePlayerList(myPlayerListID) {
    let myPlayerListsSnap = await db.ref(`users/${getUserPath()}/myPlayerLists/${myPlayerListID}`).remove()

}