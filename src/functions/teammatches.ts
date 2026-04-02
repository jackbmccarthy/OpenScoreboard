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
            let teamMatchScores = await getTeamMatchTeamScore(item.id)
            return [id, { ...item, teamAScore: teamMatchScores.a, teamBScore: teamMatchScores.b }]
        }))
    }
    else {
        return []
    }

}

export async function createTeamMatchNewMatch(teamMatchID, tableNumber, sportName, previousMatchObj, scoringType) {
    let newMatch = await db.ref(`matches`).push(new Match().createNew(sportName, previousMatchObj, true, scoringType))
    let currentMatchKey = await db.ref(`teamMatches/${teamMatchID}/currentMatches/${tableNumber}`).set(newMatch.key)
    return newMatch.key
}


export async function getTeamMatch(teamMatchID) {
    let pushedTeam = await db.ref(`teamMatches/${teamMatchID}`).get()
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

    let pushedTeamMatch = await db.ref(`teamMatches`).push(teamMatch)
    let preview = {
        id: pushedTeamMatch.key,
        teamAName: await getTeamName(teamMatch.teamAID),
        teamBName: await getTeamName(teamMatch.teamBID),
        startTime: teamMatch.startTime,
        sportName: teamMatch.sportName,
        sportDisplayName: supportedSports[teamMatch.sportName].displayName,
        scoringType: teamMatch.scoringType
    }

    await db.ref("users" + "/" + getUserPath() + "/" + "myTeamMatches").push(preview)
}

export async function updateTeamMatch(teamMatchID, myTeamMatchID, teamMatch) {
    let pushedTeam = await db.ref(`teamMatches/${teamMatchID}`).set(teamMatch)
    await db.ref("users" + "/" + getUserPath() + "/" + "myTeamMatches/" + myTeamMatchID).push({
        id: teamMatchID,
        teamAName: await getTeamName(teamMatch.teamAID),
        teamBName: await getTeamName(teamMatch.teamBID),
        startTime: teamMatch.startTime
    })
    return pushedTeam.val()
}

export async function getImportTeamMembersList(player, teamMatchID) {
    let teamMatch = await getTeamMatch(teamMatchID)
    if (player === "playerA" || player === "playerA2") {

        let ATeam = await getTeam(teamMatch.teamAID)

        if (ATeam) {
            return Object.entries(ATeam.players)
        }
        else {
            return []
        }

    }
    else {
        let BTeam = await getTeam(teamMatch.teamBID)
        if (BTeam) {
            return Object.entries(BTeam.players)
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