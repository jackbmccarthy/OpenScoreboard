import db, { getUserPath } from '../../database';
import Match from '../classes/Match';
import { getCombinedPlayerNames } from './players';
import { getMatchData, getMatchScore } from './scoring';
import { supportedSports } from './sports';
import { getTeam, getTeamName } from './teams';

export default async function getMyTeamMatches(userID) {


    let myTeamMatches = await db.ref("users" + "/" + userID + "/" + "myTeamMatches").get()
    myTeamMatches = myTeamMatches.val()
    if (typeof myTeamMatches === "object" && myTeamMatches !== null) {
        return await Promise.all(Object.entries(myTeamMatches).map(async ([id, item]) => {
            const teamMatch = await getTeamMatch(item.id) || {}
            let teamMatchScores = {
                a: teamMatch.teamAScore || 0,
                b: teamMatch.teamBScore || 0,
            }
            return [id, {
                ...teamMatch,
                ...item,
                currentMatches: teamMatch.currentMatches || {},
                teamAScore: teamMatchScores.a,
                teamBScore: teamMatchScores.b,
            }]
        }))
    }
    else {
        return []
    }

}

export async function createTeamMatchNewMatch(teamMatchID, tableNumber, sportName, previousMatchObj, scoringType) {
    const resolvedSportName = sportName || previousMatchObj?.sportName || "tableTennis"
    const resolvedScoringType = scoringType !== undefined ? scoringType : previousMatchObj?.scoringType || "normal"
    let newMatch = await db.ref(`matches`).push(new Match().createNew(resolvedSportName, previousMatchObj, true, resolvedScoringType))
    let currentMatchKey = await db.ref(`teamMatches/${teamMatchID}/currentMatches/${tableNumber}`).set(newMatch.key)
    return newMatch.key
}


export async function getTeamMatch(teamMatchID) {
    let pushedTeam = await db.ref(`teamMatches/${teamMatchID}`).get()
    return pushedTeam.val()
}

export async function getMyTeamMatch(myTeamMatchID) {
    let pushedTeam = await db.ref(`users/${getUserPath()}/myTeamMatches/${myTeamMatchID}`).get()
    return pushedTeam.val()
}

export async function getTeamMatchCurrentMatches(teamMatchID) {
    let pushedTeam = await db.ref(`teamMatches/${teamMatchID}/currentMatches`).get()
    return pushedTeam.val()
}
export async function addTeamMatchCurrentMatch(teamMatchID, tableNumber) {
    let pushedTeam = await db.ref(`teamMatches/${teamMatchID}/currentMatches/${tableNumber}`).set("")

}

export async function getTeamMatchCurrentMatch(teamMatchID, tableNumber) {
    let pushedTeam = await db.ref(`teamMatches/${teamMatchID}/currentMatches/${tableNumber}`).get()
    return pushedTeam.val()
}

export async function addNewTeamMatch(teamMatch) {

    const ownerID = getUserPath()
    const nextTeamMatch = {
        ...teamMatch,
        ownerID: teamMatch.ownerID || ownerID,
    }
    let pushedTeamMatch = await db.ref(`teamMatches`).push(nextTeamMatch)
    let preview = {
        id: pushedTeamMatch.key,
        ownerID,
        teamAName: await getTeamName(nextTeamMatch.teamAID),
        teamBName: await getTeamName(nextTeamMatch.teamBID),
        startTime: nextTeamMatch.startTime,
        sportName: nextTeamMatch.sportName,
        sportDisplayName: supportedSports[nextTeamMatch.sportName].displayName,
        scoringType: nextTeamMatch.scoringType
    }

    await db.ref("users" + "/" + getUserPath() + "/" + "myTeamMatches").push(preview)
}

export async function updateTeamMatch(teamMatchID, myTeamMatchID, teamMatch) {
    const ownerID = teamMatch.ownerID || getUserPath()
    const nextTeamMatch = {
        ...teamMatch,
        ownerID,
    }
    await db.ref(`teamMatches/${teamMatchID}`).set(nextTeamMatch)
    await db.ref("users" + "/" + getUserPath() + "/" + "myTeamMatches/" + myTeamMatchID).update({
        id: teamMatchID,
        ownerID,
        teamAName: await getTeamName(nextTeamMatch.teamAID),
        teamBName: await getTeamName(nextTeamMatch.teamBID),
        startTime: nextTeamMatch.startTime,
        sportName: nextTeamMatch.sportName,
        sportDisplayName: supportedSports[nextTeamMatch.sportName]?.displayName || "",
        scoringType: nextTeamMatch.scoringType || "",
    })
}

export async function getImportTeamMembersList(player, teamMatchID) {
    let teamMatch = await getTeamMatch(teamMatchID)
    if (!teamMatch) {
        return []
    }

    if (player === "playerA" || player === "playerA2") {

        let ATeam = await getTeam(teamMatch.teamAID)

        if (ATeam) {
            return Object.entries(ATeam.players || {})
        }
        else {
            return []
        }

    }
    else {
        let BTeam = await getTeam(teamMatch.teamBID)
        if (BTeam) {
            return Object.entries(BTeam.players || {})
        }
        else {
            return []
        }

    }

}

export async function archiveMatchForTeamMatch(teamMatchID, tableNumber, matchID, matchSettings = null) {
    let match
    if (matchSettings) {
        match = matchSettings
    }
    else {
        match = await getMatchData(matchID)
    }

    let matchScores = getMatchScore(match)

    let archivedMatch = {
        tableNumber: tableNumber,
        matchID: matchID,
        playerA: getCombinedPlayerNames(match["playerA"], match["playerB"], match["playerA2"], match["playerB2"]).a,
        playerB: getCombinedPlayerNames(match["playerA"], match["playerB"], match["playerA2"], match["playerB2"]).b,
        AScore: matchScores.a,
        BScore: matchScores.b,
        archivedOn: new Date().toISOString()
    }

    let currentMatchSnapShot = await db.ref(`teamMatches/${teamMatchID}/archivedMatches`).push(archivedMatch)
    return currentMatchSnapShot.key

}

export async function archiveTeamMatch(myTeamMatchID) {
    let userID = getUserPath()
    let myTeamMatch = await db.ref("users" + "/" + userID + "/" + "myTeamMatches/" + myTeamMatchID).get()
    let currentMatchSnapShot = await db.ref("users" + "/" + userID + "/" + "archivedTeamMatches/").push(myTeamMatch.val())
    await db.ref("users" + "/" + userID + "/" + "myTeamMatches/" + myTeamMatchID).remove()
    return currentMatchSnapShot.key

}

export async function getTeamMatchTeamScore(teamMatchID,) {
    let teamAScore = await db.ref(`teamMatches/${teamMatchID}/teamAScore`).get()
    let teamBScore = await db.ref(`teamMatches/${teamMatchID}/teamBScore`).get()

    return {
        a: teamAScore.val() || 0,
        b: teamBScore.val() || 0
    }

}
export async function addWinToTeamMatchTeamScore(teamMatchID, AorB) {
    let scores = await getTeamMatchTeamScore(teamMatchID)
    if (AorB === "A") {
        await db.ref(`teamMatches/${teamMatchID}/teamAScore`).set(parseInt(scores.a) + 1)
    }
    else {
        await db.ref(`teamMatches/${teamMatchID}/teamBScore`).set(parseInt(scores.b) + 1)
    }
    let teamAScore = await db.ref(`teamMatches/${teamMatchID}/teamAScore`).get()
    let teamBScore = await db.ref(`teamMatches/${teamMatchID}/teamBScore`).get()
    return {
        a: teamAScore,
        b: teamBScore
    }

}

export async function setTeamMatchTeamScore(teamMatchID, teamAScore, teamBScore) {


    await db.ref(`teamMatches/${teamMatchID}/teamAScore`).set(parseInt(teamAScore))

    await db.ref(`teamMatches/${teamMatchID}/teamBScore`).set(parseInt(teamBScore))

    // let teamAScore = await db.ref(`teamMatches/${teamMatchID}/teamAScore`).get()
    // let teamBScore = await db.ref(`teamMatches/${teamMatchID}/teamBScore`).get()
    // return {
    //     a: teamAScore,
    //     b: teamBScore
    // }

}
