import db, { getUserPath } from '../lib/database';
import { subscribeToPathValue } from '../lib/realtime';
import Match from '../classes/Match';
import { getCombinedPlayerNames } from './players';
import { appendTeamMatchAuditEvent, normalizeTeamMatchSchema } from './matchSchema';
import { getMatchData, getMatchScore } from './scoring';
import { getPreviewValue, isRecordActive, softDeleteCanonical, softDeleteDynamicURLsByReference } from './deletion';
import { supportedSports } from './sports';
import { getTeam, getTeamName } from './teams';

export default async function getMyTeamMatches(userID = getUserPath()) {


    let myTeamMatches = await db.ref("users" + "/" + userID + "/" + "myTeamMatches").get()
    myTeamMatches = myTeamMatches.val()
    if (typeof myTeamMatches === "object" && myTeamMatches !== null) {
        return await Promise.all(Object.entries(myTeamMatches).map(async ([id, item]) => {
            const teamMatchEntry = item as Record<string, any>
            const canonicalSnapshot = await db.ref(`teamMatches/${teamMatchEntry.id}`).get()
            if (!isRecordActive(canonicalSnapshot.val())) {
                return null
            }
            let teamMatchScores = await getTeamMatchTeamScore(teamMatchEntry.id)
            return [id, { ...teamMatchEntry, teamAScore: teamMatchScores.a, teamBScore: teamMatchScores.b }]
        })).then((entries) => entries.filter(Boolean))
    }
    else {
        return []
    }

}

function buildCurrentTableSummaries(currentMatches: Record<string, string> | null, matchesByID: Record<string, Record<string, any> | null>) {
    if (!currentMatches || typeof currentMatches !== 'object') {
        return []
    }

    return Object.entries(currentMatches)
        .map(([tableNumber, matchID]) => {
            if (typeof matchID !== 'string' || matchID.length === 0) {
                return null
            }
        const match = matchesByID[matchID]
            if (!match) {
                return {
                    tableNumber,
                    matchID,
                    label: 'Match unavailable',
                    status: 'attention-required',
                }
            }
            const playerNames = getCombinedPlayerNames(match.playerA, match.playerB, match.playerA2, match.playerB2)
            return {
                tableNumber,
                matchID,
                label: `${playerNames.a || 'Player A'} vs ${playerNames.b || 'Player B'}`,
                status: 'active',
                contextLabel: [match.matchRound || match.context?.matchRound || '', match.eventName || match.context?.eventName || ''].filter(Boolean).join(' • '),
            }
        })
        .filter(Boolean)
}

export function subscribeToMyTeamMatches(
    callback: (teamMatches: Array<[string, Record<string, any>]>) => void,
    userID = getUserPath(),
) {
    return subscribeToPathValue(`users/${userID}/myTeamMatches`, async (myTeamMatchesValue) => {
        const teamMatches = myTeamMatchesValue && typeof myTeamMatchesValue === 'object'
            ? await Promise.all(Object.entries(myTeamMatchesValue as Record<string, unknown>).map(async ([id, item]) => {
                const teamMatchEntry = item as Record<string, any>
                const canonicalSnapshot = await db.ref(`teamMatches/${teamMatchEntry.id}`).get()
                const teamMatch = canonicalSnapshot.val()
                if (!isRecordActive(teamMatch)) {
                    return null
                }
                const teamMatchScores = await getTeamMatchTeamScore(teamMatchEntry.id)
                const currentMatches = teamMatch?.currentMatches && typeof teamMatch.currentMatches === 'object'
                    ? teamMatch.currentMatches as Record<string, string>
                    : {}
                const matchIDs = Object.values(currentMatches).filter((matchID): matchID is string => typeof matchID === 'string' && matchID.length > 0)
                const matches = await Promise.all(matchIDs.map(async (matchID) => [matchID, await getMatchData(matchID)] as const))
                const matchesByID = Object.fromEntries(matches) as Record<string, Record<string, any> | null>

                return [id, {
                    ...teamMatchEntry,
                    teamAScore: teamMatchScores.a,
                    teamBScore: teamMatchScores.b,
                    tableCount: Object.keys(currentMatches).length,
                    activeTableCount: matchIDs.length,
                    currentTableSummaries: buildCurrentTableSummaries(currentMatches, matchesByID),
                    status: matchIDs.length > 0 ? 'active' : 'not-started',
                }] as [string, Record<string, any>]
            }))
            : []

        callback(teamMatches.filter(Boolean) as Array<[string, Record<string, any>]>)
    })
}

export async function createTeamMatchNewMatch(
    teamMatchID,
    tableNumber,
    sportName,
    previousMatchObj,
    scoringType: string | null = null,
) {
    let newMatch = await db.ref(`matches`).push(new Match().createNew(sportName, previousMatchObj, true, scoringType))
    let currentMatchKey = await db.ref(`teamMatches/${teamMatchID}/currentMatches/${tableNumber}`).set(newMatch.key)
    if (newMatch.key) {
        await Promise.all([
            db.ref(`matches/${newMatch.key}/teamMatchID`).set(teamMatchID),
            db.ref(`matches/${newMatch.key}/scheduling`).update({
                teamMatchID,
                tableNumber,
                sourceType: 'team-match',
            }),
        ])
        await appendTeamMatchAuditEvent(teamMatchID, 'team_match_table_created', {
            tableNumber,
            matchID: newMatch.key,
        })
    }
    return newMatch.key
}


export async function getTeamMatch(teamMatchID) {
    let pushedTeam = await db.ref(`teamMatches/${teamMatchID}`).get()
    const teamMatch = normalizeTeamMatchSchema(pushedTeam.val())
    return isRecordActive(teamMatch) ? teamMatch : null
}

export function subscribeToTeamMatch(
    teamMatchID: string,
    callback: (teamMatch: Record<string, unknown> | null) => void,
) {
    return subscribeToPathValue(`teamMatches/${teamMatchID}`, (teamMatchValue) => {
        const normalized = normalizeTeamMatchSchema(teamMatchValue as Record<string, unknown> | null)
        callback(isRecordActive(normalized) ? (normalized as Record<string, unknown>) : null)
    })
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

export function subscribeToTeamMatchCurrentMatch(
    teamMatchID: string,
    tableNumber: string,
    callback: (matchID: string) => void,
) {
    return subscribeToPathValue(`teamMatches/${teamMatchID}/currentMatches/${tableNumber}`, (matchIDValue) => {
        callback(typeof matchIDValue === 'string' ? matchIDValue : '')
    })
}

export async function addNewTeamMatch(teamMatch) {

    let pushedTeamMatch = await db.ref(`teamMatches`).push(teamMatch)
    if (pushedTeamMatch.key) {
        await appendTeamMatchAuditEvent(pushedTeamMatch.key, 'team_match_created', {
            teamAID: teamMatch.teamAID,
            teamBID: teamMatch.teamBID,
            sportName: teamMatch.sportName,
            scoringType: teamMatch.scoringType,
        })
    }
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
    return pushedTeamMatch.key
}

export async function updateTeamMatch(teamMatchID, myTeamMatchID, teamMatch) {
    const currentTeamMatchSnapshot = await db.ref(`teamMatches/${teamMatchID}`).get()
    const currentTeamMatch = currentTeamMatchSnapshot.val() || {}
    const nextTeamMatch = {
        ...currentTeamMatch,
        ...teamMatch,
        teamAScore: currentTeamMatch.teamAScore || teamMatch.teamAScore || 0,
        teamBScore: currentTeamMatch.teamBScore || teamMatch.teamBScore || 0,
        currentMatches: currentTeamMatch.currentMatches || teamMatch.currentMatches || { 1: "" },
        archivedMatches: currentTeamMatch.archivedMatches || teamMatch.archivedMatches || {},
        scheduledMatches: currentTeamMatch.scheduledMatches || teamMatch.scheduledMatches || {},
        auditTrail: currentTeamMatch.auditTrail || teamMatch.auditTrail || {},
        schemaVersion: currentTeamMatch.schemaVersion || teamMatch.schemaVersion,
        tournamentContext: currentTeamMatch.tournamentContext || teamMatch.tournamentContext,
        context: currentTeamMatch.context || teamMatch.context,
        scheduling: {
            ...(currentTeamMatch.scheduling || {}),
            ...(teamMatch.scheduling || {}),
        },
    }
    await db.ref(`teamMatches/${teamMatchID}`).set(nextTeamMatch)
    await appendTeamMatchAuditEvent(teamMatchID, 'team_match_updated', {
        teamAID: nextTeamMatch.teamAID,
        teamBID: nextTeamMatch.teamBID,
        sportName: nextTeamMatch.sportName,
        scoringType: nextTeamMatch.scoringType,
    })
    await db.ref("users" + "/" + getUserPath() + "/" + "myTeamMatches/" + myTeamMatchID).set({
        id: teamMatchID,
        teamAName: await getTeamName(nextTeamMatch.teamAID),
        teamBName: await getTeamName(nextTeamMatch.teamBID),
        startTime: nextTeamMatch.startTime,
        sportName: nextTeamMatch.sportName,
        sportDisplayName: supportedSports[nextTeamMatch.sportName].displayName,
        scoringType: nextTeamMatch.scoringType
    })
    return nextTeamMatch
}

export async function deleteTeamMatch(myTeamMatchID) {
    const previewPath = `users/${getUserPath()}/myTeamMatches/${myTeamMatchID}`
    const preview = await getPreviewValue(previewPath)
    const teamMatchID = preview?.id
    if (typeof teamMatchID === 'string' && teamMatchID.length > 0) {
        const softDeletedDependents = {
            dynamicURLs: await softDeleteDynamicURLsByReference({ teamMatchID, reason: 'parent_team_match_soft_deleted' }),
        }
        await softDeleteCanonical(`teamMatches/${teamMatchID}`, {
            deleteReason: 'delete_team_match',
            softDeletedDependents,
        }, {
            entityType: 'teamMatch',
            canonicalID: teamMatchID,
            ownerID: getUserPath(),
            previewPath,
            dependents: softDeletedDependents,
        })
    }
    await db.ref(previewPath).remove()
}

export async function getImportTeamMembersList(player, teamMatchID) {
    let teamMatch = await getTeamMatch(teamMatchID)
    if (!teamMatch) {
        return []
    }
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
        tournamentID: match["tournamentID"] || "",
        eventID: match["eventID"] || "",
        roundID: match["roundID"] || "",
        eventName: match["eventName"] || "",
        matchRound: match["matchRound"] || "",
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
