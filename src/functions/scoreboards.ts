import db, { getUserPath } from "../lib/database";
import { newScoreboard } from "../classes/Scoreboard";


export async function getMyScoreboards(userID,) {

    let myScoreboardsSnap = await db.ref("users" + "/" + userID + "/" + "myScoreboards").get()
    let myScoreboards = myScoreboardsSnap.val()
    if (myScoreboards !== null && typeof myScoreboards === "object") {
        return Object.entries(myScoreboards)
    }
    else {
        return []
    }

}

export async function deleteMyScoreboard(myScoreboardID) {

    let myScoreboardsSnap = await db.ref(`users/${getUserPath()}/myScoreboards/${myScoreboardID}`).remove()


}


export function getScoreboardTypesList() {
    return [
        {
            id: "liveStream",
            name: "Live Stream"
        }
        ,

    ]
}

export async function addNewScoreboard(name, type) {
    let scoreboard = newScoreboard(getUserPath(), name, type)
    let newlyAdded = await db.ref("scoreboards").push(scoreboard)

    await db.ref("users" + "/" + getUserPath() + "/" + "myScoreboards").push({
        id: newlyAdded.key,
        createdOn: new Date(),
        name: name,
        type: type
    })
    return newlyAdded.key
}

export async function getScoreboard(scoreboardID) {
    const snapshot = await db.ref(`scoreboards/${scoreboardID}`).get()
    return snapshot.val()
}

export async function duplicateScoreboard(sourceScoreboardID, myScoreboardName) {
    const scoreboard = await getScoreboard(sourceScoreboardID)
    if (!scoreboard) {
        return null
    }

    const duplicated = {
        ...scoreboard,
        ownerID: getUserPath(),
        name: myScoreboardName || `${scoreboard.name || 'Scoreboard'} Copy`,
    }

    const newlyAdded = await db.ref("scoreboards").push(duplicated)
    await db.ref(`users/${getUserPath()}/myScoreboards`).push({
        id: newlyAdded.key,
        createdOn: new Date(),
        name: duplicated.name,
        type: duplicated.type || 'liveStream'
    })

    return newlyAdded.key
}

export async function updateScoreboardDetails(scoreboardID, myScoreboardID, name, type) {
    await Promise.all([
        db.ref(`scoreboards/${scoreboardID}/name`).set(name),
        db.ref(`scoreboards/${scoreboardID}/type`).set(type),
        db.ref(`users/${getUserPath()}/myScoreboards/${myScoreboardID}/name`).set(name),
        db.ref(`users/${getUserPath()}/myScoreboards/${myScoreboardID}/type`).set(type),
    ])
}

export async function getScoreboardSettings(scoreboardID) {
    let settings = await Promise.all([
        db.ref(`scoreboards/${scoreboardID}/showDuringActiveMatch`).get(),
        db.ref(`scoreboards/${scoreboardID}/showDuringTimeOuts`).get(),
        db.ref(`scoreboards/${scoreboardID}/alwaysShow`).get(),
        db.ref(`scoreboards/${scoreboardID}/showInBetweenGames`).get(),
    ])
    let scoreboard = {
        showDuringActiveMatch: settings[0].val(),
        showDuringTimeOuts: settings[1].val(),
        alwaysShow: settings[2].val(),
        showInBetweenGames: settings[3].val()
    }
    return scoreboard

}

export async function setScoreboardSettings(scoreboardID, showDuringActiveMatch, showDuringTimeOuts, showInBetweenGames, alwaysShow) {
    let settings = await Promise.all([
        db.ref(`scoreboards/${scoreboardID}/showDuringActiveMatch`).set(showDuringActiveMatch),
        db.ref(`scoreboards/${scoreboardID}/showDuringTimeOuts`).set(showDuringTimeOuts),
        db.ref(`scoreboards/${scoreboardID}/alwaysShow`).set(alwaysShow),
        db.ref(`scoreboards/${scoreboardID}/showInBetweenGames`).set(showInBetweenGames),
    ])


}
