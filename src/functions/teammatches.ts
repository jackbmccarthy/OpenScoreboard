import db, { getUserPath, getValue } from '../lib/database';
import { subscribeToPathValue } from '../lib/realtime';
import { createSubscriptionRegistry } from '@/lib/liveSync'
import Match from '../classes/Match';
import { getCombinedPlayerNames } from './players';
import {
    appendTeamMatchAuditEvent,
    buildTeamMatchTournamentCompatibilityPatch,
    normalizeTeamMatchSchema,
    resolveTournamentCompatibilityFields,
    syncTeamMatchSchema,
    syncMatchSchemaFromFlat,
    syncMatchTournamentCompatibility,
    syncTeamMatchTournamentCompatibility,
} from './matchSchema';
import { getMatchData, getMatchScore } from './scoring';
import type { OwnershipMutationOptions } from './deletion';
import { getPreviewValue, isRecordActive, revokeCapabilityLinksByReference, softDeleteCanonical, softDeleteDynamicURLsByReference, softDeleteMatches } from './deletion';
import { collectTeamMatchDependentMatchIDs } from '@/ownership/dependents.js';
import { supportedSports } from './sports';
import { getTeam, getTeamName } from './teams';
import type { Match as MatchRecord, TeamMatch, Team as TeamRecord } from '../types/matches';

type TeamMatchPreview = {
    id: string
    teamAName?: string
    teamBName?: string
    startTime?: string
    sportName?: string
    sportDisplayName?: string
    scoringType?: string
}

export default async function getMyTeamMatches(userID = getUserPath()) {
    let myTeamMatches = await getValue<Record<string, TeamMatchPreview>>(`users/${userID}/myTeamMatches`)
    if (typeof myTeamMatches === "object" && myTeamMatches !== null) {
        return await Promise.all(Object.entries(myTeamMatches).map(async ([id, item]) => {
            const canonicalValue = await getValue<TeamMatch>(`teamMatches/${item.id}`)
            if (!isRecordActive(canonicalValue)) {
                return null
            }
            let teamMatchScores = await getTeamMatchTeamScore(item.id)
            return [id, { ...item, teamAScore: teamMatchScores.a, teamBScore: teamMatchScores.b }]
        })).then((entries) => entries.filter(Boolean))
    }
    else {
        return []
    }

}

function buildCurrentTableSummaries(currentMatches: Record<string, string> | null, matchesByID: Record<string, MatchRecord | null>) {
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

function buildTeamMatchListRow(
    preview: TeamMatchPreview,
    teamMatch: TeamMatch,
    matchesByID: Record<string, MatchRecord | null>,
) {
    const currentMatches = teamMatch?.currentMatches && typeof teamMatch.currentMatches === 'object'
        ? teamMatch.currentMatches as Record<string, string>
        : {}
    const activeMatchIDs = Object.values(currentMatches).filter((matchID): matchID is string => typeof matchID === 'string' && matchID.length > 0)

    return {
        ...preview,
        id: preview.id,
        teamAName: preview.teamAName || teamMatch.teamAName || '',
        teamBName: preview.teamBName || teamMatch.teamBName || '',
        startTime: typeof teamMatch.startTime === 'string' ? teamMatch.startTime : preview.startTime,
        sportName: teamMatch.sportName || preview.sportName || '',
        sportDisplayName: teamMatch.sportDisplayName || preview.sportDisplayName || '',
        scoringType: teamMatch.scoringType || preview.scoringType || '',
        teamAScore: Number(teamMatch.teamAScore || 0),
        teamBScore: Number(teamMatch.teamBScore || 0),
        tableCount: Object.keys(currentMatches).length,
        activeTableCount: activeMatchIDs.length,
        contextLabel: [teamMatch.matchRound || teamMatch.context?.matchRound || '', teamMatch.eventName || teamMatch.context?.eventName || ''].filter(Boolean).join(' • '),
        currentTableSummaries: buildCurrentTableSummaries(currentMatches, matchesByID),
        status: activeMatchIDs.length > 0 ? 'active' : 'not-started',
    }
}

export function subscribeToMyTeamMatches(
    callback: (teamMatches: Array<[string, TeamMatchPreview & { teamAScore: number; teamBScore: number; tableCount: number; activeTableCount: number; currentTableSummaries: ReturnType<typeof buildCurrentTableSummaries>; status: string }]>) => void,
    userID = getUserPath(),
) {
    const previews = new Map<string, TeamMatchPreview>()
    const teamMatches = new Map<string, TeamMatch>()
    const matchIDsByTable = new Map<string, Record<string, string>>()
    const matchesByTable = new Map<string, Record<string, MatchRecord | null>>()
    const rows = new Map<string, [string, TeamMatchPreview & { teamAScore: number; teamBScore: number; tableCount: number; activeTableCount: number; currentTableSummaries: ReturnType<typeof buildCurrentTableSummaries>; status: string }]>()
    const ownerOrder: string[] = []
    const canonicalSubscriptions = createSubscriptionRegistry()
    const matchSubscriptions = createSubscriptionRegistry()

    const emitRows = () => {
        callback(ownerOrder.map((id) => rows.get(id)).filter(Boolean) as Array<[string, TeamMatchPreview & { teamAScore: number; teamBScore: number; tableCount: number; activeTableCount: number; currentTableSummaries: ReturnType<typeof buildCurrentTableSummaries>; status: string }]>)
    }

    const syncMatchSubscriptions = (myTeamMatchID: string, teamMatch: TeamMatch) => {
        const currentMatches = teamMatch?.currentMatches && typeof teamMatch.currentMatches === 'object'
            ? teamMatch.currentMatches as Record<string, string>
            : {}
        const activeTableNumbers = new Set(Object.keys(currentMatches))
        const previousMatchIDs = matchIDsByTable.get(myTeamMatchID) || {}

        Object.keys(previousMatchIDs).forEach((tableNumber) => {
            if (!activeTableNumbers.has(tableNumber)) {
                matchSubscriptions.remove(`${myTeamMatchID}:${tableNumber}`)
                const nextMatches = { ...(matchesByTable.get(myTeamMatchID) || {}) }
                delete nextMatches[previousMatchIDs[tableNumber]]
                matchesByTable.set(myTeamMatchID, nextMatches)
            }
        })

        matchIDsByTable.set(myTeamMatchID, currentMatches)

        Object.entries(currentMatches).forEach(([tableNumber, matchID]) => {
            const subscriptionKey = `${myTeamMatchID}:${tableNumber}`
            if (typeof matchID !== 'string' || matchID.length === 0) {
                matchSubscriptions.remove(subscriptionKey)
                return
            }

            if (previousMatchIDs[tableNumber] === matchID) {
                return
            }

            matchSubscriptions.replace(subscriptionKey, subscribeToPathValue(`matches/${matchID}`, (matchValue) => {
                const nextMatches = { ...(matchesByTable.get(myTeamMatchID) || {}) }
                nextMatches[matchID] = matchValue && typeof matchValue === 'object'
                    ? matchValue as MatchRecord
                    : null
                matchesByTable.set(myTeamMatchID, nextMatches)
                const preview = previews.get(myTeamMatchID)
                const teamMatchRecord = teamMatches.get(myTeamMatchID)
                if (!preview || !teamMatchRecord) {
                    return
                }
                rows.set(myTeamMatchID, [myTeamMatchID, buildTeamMatchListRow(preview, teamMatchRecord, nextMatches)])
                emitRows()
            }))
        })
    }

    const removeTeamMatch = (myTeamMatchID: string) => {
        canonicalSubscriptions.remove(myTeamMatchID)
        const previousMatchIDs = matchIDsByTable.get(myTeamMatchID) || {}
        Object.keys(previousMatchIDs).forEach((tableNumber) => {
            matchSubscriptions.remove(`${myTeamMatchID}:${tableNumber}`)
        })
        previews.delete(myTeamMatchID)
        teamMatches.delete(myTeamMatchID)
        matchIDsByTable.delete(myTeamMatchID)
        matchesByTable.delete(myTeamMatchID)
        rows.delete(myTeamMatchID)
    }

    const unsubscribeOwner = subscribeToPathValue(`users/${userID}/myTeamMatches`, (myTeamMatchesValue) => {
        const ownerEntries = myTeamMatchesValue && typeof myTeamMatchesValue === 'object'
            ? Object.entries(myTeamMatchesValue as Record<string, TeamMatchPreview>)
            : []
        const activeTeamMatchIDs = new Set(ownerEntries.map(([id]) => id))

        ownerOrder.splice(0, ownerOrder.length, ...ownerEntries.map(([id]) => id))

        Array.from(previews.keys()).forEach((id) => {
            if (!activeTeamMatchIDs.has(id)) {
                removeTeamMatch(id)
            }
        })

        ownerEntries.forEach(([id, preview]) => {
            previews.set(id, preview)
            const teamMatchID = typeof preview?.id === 'string' ? preview.id : ''
            if (!teamMatchID) {
                rows.delete(id)
                return
            }

            canonicalSubscriptions.replace(id, subscribeToPathValue(`teamMatches/${teamMatchID}`, (teamMatchValue) => {
                const normalizedTeamMatch = normalizeTeamMatchSchema(teamMatchValue as Record<string, unknown> | null)
                if (!isRecordActive(normalizedTeamMatch)) {
                    removeTeamMatch(id)
                    emitRows()
                    return
                }

                teamMatches.set(id, normalizedTeamMatch as TeamMatch)
                syncMatchSubscriptions(id, normalizedTeamMatch as TeamMatch)
                rows.set(id, [id, buildTeamMatchListRow(preview, normalizedTeamMatch as TeamMatch, matchesByTable.get(id) || {})])
                emitRows()
            }))
        })

        emitRows()
    })

    return () => {
        unsubscribeOwner()
        canonicalSubscriptions.clear()
        matchSubscriptions.clear()
    }
}

export async function createTeamMatchNewMatch(
    teamMatchID,
    tableNumber,
    sportName,
    previousMatchObj,
    scoringType: string | null = null,
) {
    let newMatch = await db.ref(`matches`).push(new Match().createNew(sportName, previousMatchObj, true, scoringType))
    await db.ref(`teamMatches/${teamMatchID}/currentMatches/${tableNumber}`).set(newMatch.key)
    if (newMatch.key) {
        const teamMatch = await getTeamMatch(teamMatchID)
        await Promise.all([
            db.ref(`matches/${newMatch.key}/teamMatchID`).set(teamMatchID),
            db.ref(`matches/${newMatch.key}/scheduling`).update({
                teamMatchID,
                tableNumber,
                sourceType: 'team-match',
            }),
        ])
        if (teamMatch) {
            await syncMatchTournamentCompatibility(newMatch.key, {
                ...buildTeamMatchTournamentCompatibilityPatch(teamMatch, { teamMatchID }),
                teamMatchID,
            })
        }
        await syncMatchSchemaFromFlat(newMatch.key)
        await appendTeamMatchAuditEvent(teamMatchID, 'team_match_table_created', {
            tableNumber,
            matchID: newMatch.key,
        })
        await syncTeamMatchSchema(teamMatchID)
    }
    return newMatch.key
}


export async function getTeamMatch(teamMatchID: string): Promise<TeamMatch | null> {
    const rawTeamMatch = await getValue<Record<string, unknown>>(`teamMatches/${teamMatchID}`)
    const teamMatch = normalizeTeamMatchSchema(rawTeamMatch)
    return isRecordActive(teamMatch) ? teamMatch as TeamMatch : null
}

export function subscribeToTeamMatch(
    teamMatchID: string,
    callback: (teamMatch: TeamMatch | null) => void,
) {
    return subscribeToPathValue(`teamMatches/${teamMatchID}`, (teamMatchValue) => {
        const normalized = normalizeTeamMatchSchema(teamMatchValue as Record<string, unknown> | null)
        callback(isRecordActive(normalized) ? (normalized as TeamMatch) : null)
    })
}

export async function getTeamMatchCurrentMatches(teamMatchID) {
    return await getValue<Record<string, string>>(`teamMatches/${teamMatchID}/currentMatches`)
}
export async function addTeamMatchCurrentMatch(teamMatchID, tableNumber) {
    await db.ref(`teamMatches/${teamMatchID}/currentMatches/${tableNumber}`).set("")
    await syncTeamMatchSchema(teamMatchID)
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
    const normalizedTeamMatch = normalizeTeamMatchSchema(teamMatch) || teamMatch
    let pushedTeamMatch = await db.ref(`teamMatches`).push(normalizedTeamMatch)
    if (pushedTeamMatch.key) {
        await db.ref(`teamMatches/${pushedTeamMatch.key}/teamMatchID`).set(pushedTeamMatch.key)
        await appendTeamMatchAuditEvent(pushedTeamMatch.key, 'team_match_created', {
            teamAID: normalizedTeamMatch.teamAID,
            teamBID: normalizedTeamMatch.teamBID,
            sportName: normalizedTeamMatch.sportName,
            scoringType: normalizedTeamMatch.scoringType,
        })
        await syncTeamMatchSchema(pushedTeamMatch.key, {
            ...normalizedTeamMatch,
            teamMatchID: pushedTeamMatch.key,
        })
    }
    let preview = {
        id: pushedTeamMatch.key,
        teamAName: await getTeamName(normalizedTeamMatch.teamAID),
        teamBName: await getTeamName(normalizedTeamMatch.teamBID),
        startTime: normalizedTeamMatch.startTime,
        sportName: normalizedTeamMatch.sportName,
        sportDisplayName: supportedSports[normalizedTeamMatch.sportName].displayName,
        scoringType: normalizedTeamMatch.scoringType
    }

    await db.ref("users" + "/" + getUserPath() + "/" + "myTeamMatches").push(preview)
    return pushedTeamMatch.key
}

export async function updateTeamMatch(teamMatchID, myTeamMatchID, teamMatch) {
    const currentTeamMatchSnapshot = await db.ref(`teamMatches/${teamMatchID}`).get()
    const currentTeamMatch = currentTeamMatchSnapshot.val() || {}
    const mergedTeamMatch = {
        ...currentTeamMatch,
        ...teamMatch,
        teamMatchID: currentTeamMatch.teamMatchID || teamMatch.teamMatchID || teamMatchID,
        teamAScore: currentTeamMatch.teamAScore || teamMatch.teamAScore || 0,
        teamBScore: currentTeamMatch.teamBScore || teamMatch.teamBScore || 0,
        currentMatches: currentTeamMatch.currentMatches || teamMatch.currentMatches || { 1: "" },
        archivedMatches: currentTeamMatch.archivedMatches || teamMatch.archivedMatches || {},
        scheduledMatches: currentTeamMatch.scheduledMatches || teamMatch.scheduledMatches || {},
        auditTrail: currentTeamMatch.auditTrail || teamMatch.auditTrail || {},
        schemaVersion: currentTeamMatch.schemaVersion || teamMatch.schemaVersion || undefined,
        tournamentContext: currentTeamMatch.tournamentContext || teamMatch.tournamentContext,
        context: currentTeamMatch.context || teamMatch.context,
        scheduling: {
            ...(currentTeamMatch.scheduling || {}),
            ...(teamMatch.scheduling || {}),
        },
    }
    const tournamentCompatibilityPatch = buildTeamMatchTournamentCompatibilityPatch(mergedTeamMatch, {
        teamMatchID: mergedTeamMatch.teamMatchID || teamMatchID,
    })
    const nextTeamMatch = normalizeTeamMatchSchema({
        ...mergedTeamMatch,
        ...tournamentCompatibilityPatch,
    }) || teamMatch
    await db.ref(`teamMatches/${teamMatchID}`).set(nextTeamMatch)
    await appendTeamMatchAuditEvent(teamMatchID, 'team_match_updated', {
        teamAID: nextTeamMatch.teamAID,
        teamBID: nextTeamMatch.teamBID,
        sportName: nextTeamMatch.sportName,
        scoringType: nextTeamMatch.scoringType,
    })
    await syncTeamMatchTournamentCompatibility(teamMatchID, {
        ...tournamentCompatibilityPatch,
        teamMatchID: nextTeamMatch.teamMatchID || teamMatchID,
    }, nextTeamMatch)
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

export async function deleteTeamMatch(myTeamMatchID, options: OwnershipMutationOptions = {}) {
    const previewPath = `users/${getUserPath()}/myTeamMatches/${myTeamMatchID}`
    const preview = await getPreviewValue(previewPath)
    const teamMatchID = preview?.id
    const teamMatchRecord = typeof teamMatchID === 'string' && teamMatchID.length > 0
        ? await getTeamMatch(teamMatchID)
        : null
    const dependentMatchIDs = collectTeamMatchDependentMatchIDs(teamMatchRecord as Record<string, unknown> | null)
    const report = {
        entityType: 'teamMatch',
        canonicalID: typeof teamMatchID === 'string' ? teamMatchID : '',
        canonicalPath: typeof teamMatchID === 'string' && teamMatchID.length > 0 ? `teamMatches/${teamMatchID}` : '',
        previewPath,
        dryRun: Boolean(options.dryRun),
        deleteMode: 'soft_deleted',
        ownerID: getUserPath(),
        dependentIDs: {
            matches: dependentMatchIDs,
            dynamicURLs: [] as string[],
            revokedCapabilityTokenIDs: [] as string[],
        },
    }
    if (typeof teamMatchID === 'string' && teamMatchID.length > 0) {
        const softDeletedMatchIDs = await softDeleteMatches(dependentMatchIDs, 'parent_team_match_soft_deleted', {
            ownerID: getUserPath(),
            previewPath,
        }, options)
        const softDeletedDependents = {
            matches: softDeletedMatchIDs,
            dynamicURLs: await softDeleteDynamicURLsByReference({ teamMatchID, reason: 'parent_team_match_soft_deleted' }, options),
        }
        const revokedCapabilityTokenIDs = await revokeCapabilityLinksByReference({
            teamMatchID,
            reason: 'parent_team_match_soft_deleted',
        }, options)
        await softDeleteCanonical(`teamMatches/${teamMatchID}`, {
            deleteReason: 'delete_team_match',
            softDeletedDependents,
            revokedCapabilityTokenIDs,
        }, {
            entityType: 'teamMatch',
            canonicalID: teamMatchID,
            ownerID: getUserPath(),
            previewPath,
            dependents: softDeletedDependents,
        }, options)
        report.dependentIDs = {
            matches: softDeletedMatchIDs,
            dynamicURLs: softDeletedDependents.dynamicURLs,
            revokedCapabilityTokenIDs,
        }
    }
    if (!options.dryRun) {
        await db.ref(previewPath).remove()
    }
    return report
}

export async function getImportTeamMembersList(player, teamMatchID) {
    let teamMatch = await getTeamMatch(teamMatchID)
    if (!teamMatch) {
        return []
    }
    if (player === "playerA" || player === "playerA2") {

        let ATeam = await getTeam(teamMatch.teamAID) as TeamRecord | null

        if (ATeam) {
            return Object.entries(ATeam.players || {})
        }
        else {
            return []
        }

    }
    else {
        let BTeam = await getTeam(teamMatch.teamBID) as TeamRecord | null
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

    const compatibility = resolveTournamentCompatibilityFields(match)
    let matchScores = getMatchScore(match)

    let archivedMatch = {
        tableNumber: tableNumber,
        matchID: matchID,
        playerA: getCombinedPlayerNames(match["playerA"], match["playerB"], match["playerA2"], match["playerB2"]).a,
        playerB: getCombinedPlayerNames(match["playerA"], match["playerB"], match["playerA2"], match["playerB2"]).b,
        AScore: matchScores.a,
        BScore: matchScores.b,
        tournamentID: compatibility.tournamentID || "",
        eventID: compatibility.eventID || "",
        roundID: compatibility.roundID || "",
        eventName: compatibility.eventName || "",
        matchRound: compatibility.matchRound || "",
        archivedOn: new Date().toISOString()
    }

    let currentMatchSnapShot = await db.ref(`teamMatches/${teamMatchID}/archivedMatches`).push(archivedMatch)
    await syncTeamMatchSchema(teamMatchID)
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
    return {
        a: Number(await getValue<number | string>(`teamMatches/${teamMatchID}/teamAScore`) || 0),
        b: Number(await getValue<number | string>(`teamMatches/${teamMatchID}/teamBScore`) || 0)
    }

}
export async function addWinToTeamMatchTeamScore(teamMatchID, AorB) {
    let scores = await getTeamMatchTeamScore(teamMatchID)
    if (AorB === "A") {
        await db.ref(`teamMatches/${teamMatchID}/teamAScore`).set(Number(scores.a) + 1)
    }
    else {
        await db.ref(`teamMatches/${teamMatchID}/teamBScore`).set(Number(scores.b) + 1)
    }
    await appendTeamMatchAuditEvent(teamMatchID, 'team_match_score_incremented', {
        side: AorB,
    })
    await syncTeamMatchSchema(teamMatchID)
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
    await appendTeamMatchAuditEvent(teamMatchID, 'team_match_score_set', {
        teamAScore: parseInt(teamAScore),
        teamBScore: parseInt(teamBScore),
    })
    await syncTeamMatchSchema(teamMatchID)

    // let teamAScore = await db.ref(`teamMatches/${teamMatchID}/teamAScore`).get()
    // let teamBScore = await db.ref(`teamMatches/${teamMatchID}/teamBScore`).get()
    // return {
    //     a: teamAScore,
    //     b: teamBScore
    // }

}
