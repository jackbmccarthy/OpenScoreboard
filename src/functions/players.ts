import db, { getUserPath } from "../lib/database"
import { subscribeToPathValue } from '../lib/realtime';

import { v4 as uuidv4 } from 'uuid';
import { buildAccessSecretMetadata, hasAccessSecret, isAccessSecretValid } from './accessSecrets';
import { clearPlayerListIdFromTables, getPreviewValue, isRecordActive, softDeleteCanonical } from './deletion';

export async function resetPlayerListPassword(playerListID) {
    let newPassword = uuidv4()
    await db.ref("playerLists/" + playerListID).update({
        password: "",
        ...buildAccessSecretMetadata(newPassword),
    })
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
    const playerListSnapshot = await db.ref(`playerLists/${playerListID}`).get()
    const playerListRecord = playerListSnapshot.val()
    if (!isRecordActive(playerListRecord)) {
        return ""
    }
    let playerListRef = db.ref(`playerLists/${playerListID}/playerListName`)
    let playerListNameSnapshot = await playerListRef.get()
    let playerList = playerListNameSnapshot.val()
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

    const password = uuidv4()
    let playerListRef = await db.ref(`playerLists`).push({
        playerListName: name,
        ownerID: getUserPath(),
        players: {},
        password: "",
        ...buildAccessSecretMetadata(password),

    })
    await db.ref(`users/${getUserPath()}/myPlayerLists/`).push({ id: playerListRef.key, playerListName: name })
    return playerListRef.key
}

export async function verifyPlayerListPassword(playerListID: string, input: string) {
    const playerListSnapshot = await db.ref(`playerLists/${playerListID}`).get()
    return isAccessSecretValid(input, playerListSnapshot.val())
}

export async function isPlayerListAccessRequired(playerListID: string) {
    const playerListSnapshot = await db.ref(`playerLists/${playerListID}`).get()
    return hasAccessSecret(playerListSnapshot.val())
}

export async function updatePlayerListName(myPlayerListID, playerListID, name) {
    await Promise.all([
        db.ref(`users/${getUserPath()}/myPlayerLists/${myPlayerListID}/playerListName`).set(name),
        db.ref(`playerLists/${playerListID}/playerListName`).set(name)
    ])
}

export async function replacePlayersInList(playerListID, players) {
    await db.ref(`playerLists/${playerListID}/players`).set(players)
}

export function watchForPlayerListPasswordChange(playerListID, callback) {
    return subscribeToPathValue(`playerLists/${playerListID}`, (playerListValue) => {
        if (playerListValue && typeof playerListValue === "object") {
            const accessRecord = playerListValue as Record<string, any>
            callback([
                accessRecord.accessSecretMode || "",
                accessRecord.passwordUpdatedAt || "",
                accessRecord.passwordHash || "",
                accessRecord.password || "",
            ].join(":"))
        }
    })
}

export async function getMyPlayerLists() {
    let myPlayerListsSnap = await db.ref(`users/${getUserPath()}/myPlayerLists`).get()
    let myPlayerLists = myPlayerListsSnap.val()
    if (myPlayerLists !== null) {
        return Promise.all(Object.entries(myPlayerLists).map(async ([id, data]) => {
            const playerListEntry = data as Record<string, unknown>
            const playerListID = String(playerListEntry["id"] || '')
            const canonicalSnapshot = await db.ref(`playerLists/${playerListID}`).get()
            const canonicalPlayerList = canonicalSnapshot.val()
            if (!isRecordActive(canonicalPlayerList)) {
                return null
            }
            return [id, { ...playerListEntry }]
        })).then((entries) => entries.filter(Boolean))
    }
    else {
        return []
    }
}

export function subscribeToMyPlayerLists(
    callback: (playerLists: Array<[string, Record<string, any>]>) => void,
    userID = getUserPath(),
) {
    return subscribeToPathValue(`users/${userID}/myPlayerLists`, async (myPlayerListsValue) => {
        const playerLists = myPlayerListsValue && typeof myPlayerListsValue === 'object'
            ? await Promise.all(Object.entries(myPlayerListsValue as Record<string, unknown>).map(async ([id, data]) => {
                const playerListEntry = data as Record<string, any>
                const playerListID = String(playerListEntry.id || '')
                const canonicalSnapshot = await db.ref(`playerLists/${playerListID}`).get()
                if (!isRecordActive(canonicalSnapshot.val())) {
                    return null
                }
                return [id, playerListEntry] as [string, Record<string, any>]
            }))
            : []
        callback(playerLists.filter(Boolean) as Array<[string, Record<string, any>]>)
    })
}

export function subscribeToPlayerListPlayers(
    playerListID: string,
    callback: (players: Array<[string, Record<string, any>]>) => void,
) {
    return subscribeToPathValue(`playerLists/${playerListID}/players`, (playersValue) => {
        callback(playersValue && typeof playersValue === 'object'
            ? Object.entries(playersValue as Record<string, Record<string, any>>)
            : [])
    })
}

export async function deletePlayerList(myPlayerListID) {
    const previewPath = `users/${getUserPath()}/myPlayerLists/${myPlayerListID}`
    const preview = await getPreviewValue(previewPath)
    const playerListID = preview?.id
    if (typeof playerListID === 'string' && playerListID.length > 0) {
        // Clear dangling table references before soft-deleting the player list
        const clearedTables = await clearPlayerListIdFromTables(playerListID)
        await softDeleteCanonical(`playerLists/${playerListID}`, {
            deleteReason: 'delete_player_list',
            clearedTables,
        }, {
            entityType: 'playerList',
            canonicalID: playerListID,
            ownerID: getUserPath(),
            previewPath,
        })
    }
    await db.ref(previewPath).remove()

}
