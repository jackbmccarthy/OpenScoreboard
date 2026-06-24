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
        const matches = await Promise.all(Object.entries(myTeamMatches).map(async ([id, item]: any) => {
            const teamMatch = await getTeamMatch(item.id) || {}
            if (teamMatch.competitionID) {
                await db.ref(`users/${userID}/myTeamMatches/${id}`).remove()
                return null
            }
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
        return matches.filter(Boolean)
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

export async function removeTeamMatchCurrentMatch(teamMatchID, tableNumber) {
    await db.ref(`teamMatches/${teamMatchID}/currentMatches/${tableNumber}`).set("")
}

export async function getTeamMatchCurrentMatch(teamMatchID, tableNumber) {
    let pushedTeam = await db.ref(`teamMatches/${teamMatchID}/currentMatches/${tableNumber}`).get()
    return pushedTeam.val()
}

export async function addNewTeamMatch(teamMatch, options: any = {}) {

    const ownerID = getUserPath()
    const nextTeamMatch = {
        ...teamMatch,
        ownerID: teamMatch.ownerID || ownerID,
    }
    let pushedTeamMatch = await db.ref(`teamMatches`).push(nextTeamMatch)
    if (options.addToMyTeamMatches === false) {
        return {
            myTeamMatchID: "",
            teamMatchID: pushedTeamMatch.key,
        }
    }

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

    const myTeamMatchRef = await db.ref("users" + "/" + getUserPath() + "/" + "myTeamMatches").push(preview)

    return {
        myTeamMatchID: myTeamMatchRef.key,
        teamMatchID: pushedTeamMatch.key,
    }
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
            return Object.entries(ATeam.players || {}).map(([playerID, player]: any) => [
                playerID,
                {
                    ...player,
                    jerseyColor: player?.jerseyColor || ATeam.teamJerseyColor || "",
                    teamJerseyColor: ATeam.teamJerseyColor || "",
                },
            ])
        }
        else {
            return []
        }

    }
    else {
        let BTeam = await getTeam(teamMatch.teamBID)
        if (BTeam) {
            return Object.entries(BTeam.players || {}).map(([playerID, player]: any) => [
                playerID,
                {
                    ...player,
                    jerseyColor: player?.jerseyColor || BTeam.teamJerseyColor || "",
                    teamJerseyColor: BTeam.teamJerseyColor || "",
                },
            ])
        }
        else {
            return []
        }

    }

}

export async function getTeamJerseyColorForMatchPlayer(player, teamMatchID) {
    let teamMatch = await getTeamMatch(teamMatchID)
    if (!teamMatch) {
        return ""
    }

    const teamID = player === "playerA" || player === "playerA2" ? teamMatch.teamAID : teamMatch.teamBID
    if (!teamID) {
        return ""
    }

    const team = await getTeam(teamID)
    return team?.teamJerseyColor || ""
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

    const existingArchiveSnapshot = await db.ref(`teamMatches/${teamMatchID}/archivedMatches`).get()
    const existingArchive = Object.entries(existingArchiveSnapshot.val() || {}).find(([, item]: any) => {
        return item?.matchID === matchID
    })
    if (existingArchive) {
        return existingArchive[0]
    }

    let currentMatchSnapShot = await db.ref(`teamMatches/${teamMatchID}/archivedMatches`).push(archivedMatch)
    return currentMatchSnapShot.key

}

export async function recordTeamMatchPlayerResult(teamMatchID, matchID, winningSide) {
    if (!teamMatchID || !matchID || (winningSide !== "A" && winningSide !== "B")) {
        return false
    }

    const resultRef = db.ref(`teamMatches/${teamMatchID}/completedPlayerMatches/${matchID}`)
    const existingResult = await resultRef.get()
    if (existingResult.exists()) {
        return false
    }

    const result = await resultRef.transaction((currentValue) => {
        if (currentValue !== null) {
            return
        }

        return {
            completedOn: new Date().toISOString(),
            winningSide,
        }
    })
    if (!result.committed) {
        return false
    }
    await addWinToTeamMatchTeamScore(teamMatchID, winningSide)
    return true
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
    const scoreField = AorB === "A" ? "teamAScore" : "teamBScore"
    await db.ref(`teamMatches/${teamMatchID}/${scoreField}`).transaction((currentScore) => {
        return (Number(currentScore) || 0) + 1
    })
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
