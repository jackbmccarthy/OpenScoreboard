import db, { getNumberValue, getStringValue, getValue } from '../lib/database';
import { MATCH_SCHEMA_VERSION, appendMatchAuditEvent, appendMatchPointHistory, normalizeMatchSchema, syncMatchSchemaFromFlat } from './matchSchema';
import { subscribeToPathValue, unwrapRealtimeValue } from '../lib/realtime';
import Match from '../classes/Match';
import { getNewPlayer } from '../classes/Player';
import { getCombinedPlayerNames } from './players';
import type { Match as MatchRecord, Player, ScheduledMatch, ScheduledMatchStatus } from '../types/matches';



export async function AddPoint(matchID, gameNumber, AorB) {
    let pointUpdateRef = db.ref<number>(`matches/${matchID}/game${gameNumber}${AorB}Score`)
    let newScore = await getNumberValue(`matches/${matchID}/game${gameNumber}${AorB}Score`) + 1
    await pointUpdateRef.set(newScore)
    const match = await getMatchData(matchID)
    if (match) {
        await syncMatchSchemaFromFlat(matchID, match)
        await appendMatchPointHistory(matchID, {
            action: 'point_added',
            createdAt: new Date().toISOString(),
            gameNumber,
            side: AorB,
            scoreA: Number(match[`game${gameNumber}AScore`] || 0),
            scoreB: Number(match[`game${gameNumber}BScore`] || 0),
        })
    }
    return newScore
}

export async function MinusPoint(matchID, gameNumber, AorB) {
    let pointUpdateRef = db.ref<number>(`matches/${matchID}/game${gameNumber}${AorB}Score`)
    let newScore = await getNumberValue(`matches/${matchID}/game${gameNumber}${AorB}Score`) - 1
    if (newScore >= 0) {
        await pointUpdateRef.set(newScore)
        const match = await getMatchData(matchID)
        if (match) {
            await syncMatchSchemaFromFlat(matchID, match)
            await appendMatchPointHistory(matchID, {
                action: 'point_removed',
                createdAt: new Date().toISOString(),
                gameNumber,
                side: AorB,
                scoreA: Number(match[`game${gameNumber}AScore`] || 0),
                scoreB: Number(match[`game${gameNumber}BScore`] || 0),
            })
        }
    }
    return newScore < 0 ? 0 : newScore

}

function sortPointHistoryEntries(pointHistory: Record<string, Record<string, unknown>> | undefined) {
    return Object.entries(pointHistory || {}).sort((a, b) => {
        const createdAtA = String(a[1]?.createdAt || '')
        const createdAtB = String(b[1]?.createdAt || '')
        return new Date(createdAtB).getTime() - new Date(createdAtA).getTime()
    })
}

function isDeletedGame(match: Record<string, any> | null | undefined, gameNumber: number) {
    return Boolean(
        match?.games?.[gameNumber]?.deleted
        || match?.games?.[String(gameNumber)]?.deleted
    )
}

export function getRecentPointHistory(match: Record<string, any> | null, limit = 5) {
    if (!match?.pointHistory || typeof match.pointHistory !== 'object') {
        return []
    }

    return sortPointHistoryEntries(match.pointHistory as Record<string, Record<string, unknown>>)
        .slice(0, limit)
        .map(([eventID, event]) => ({
            eventID,
            action: String(event?.action || ''),
            createdAt: String(event?.createdAt || ''),
            gameNumber: Number(event?.gameNumber || 1),
            side: String(event?.side || ''),
            scoreA: Number(event?.scoreA || 0),
            scoreB: Number(event?.scoreB || 0),
            undone: Boolean(event?.undone),
        }))
}

export function getLatestUndoablePointEvent(match: Record<string, any> | null) {
    if (!match?.pointHistory || typeof match.pointHistory !== 'object') {
        return null
    }

    return sortPointHistoryEntries(match.pointHistory as Record<string, Record<string, unknown>>)
        .find(([, event]) => {
            const action = String(event?.action || '')
            const undone = Boolean(event?.undone)
            return !undone && (action === 'point_added' || action === 'point_removed')
        }) || null
}

export async function undoLastPointAction(matchID: string) {
    const match = await getMatchData(matchID)
    const latestUndoableEvent = getLatestUndoablePointEvent(match as Record<string, any> | null)
    if (!match || !latestUndoableEvent) {
        return null
    }

    const [eventID, event] = latestUndoableEvent
    const gameNumber = Number(event.gameNumber || 1)
    const side = String(event.side || 'A')
    const scorePath = `matches/${matchID}/game${gameNumber}${side}Score`
    const scoreSnapshot = await db.ref(scorePath).get()
    const currentScore = Number(scoreSnapshot.val() || 0)
    const nextScore = event.action === 'point_added'
        ? Math.max(0, currentScore - 1)
        : currentScore + 1

    await db.ref(scorePath).set(nextScore)
    await db.ref(`matches/${matchID}/pointHistory/${eventID}`).update({
        undone: true,
        undoneAt: new Date().toISOString(),
    })

    if (match.sportName !== 'pickleball' && !match.isManualServiceMode) {
        const otherSide = side === 'A' ? 'B' : 'A'
        const combinedPoints = nextScore + Number(match[`game${gameNumber}${otherSide}Score`] || 0)
        await updateService(
            matchID,
            match.isAInitialServer,
            gameNumber,
            combinedPoints,
            match.changeServeEveryXPoints,
            match.pointsToWinGame,
            match.sportName,
            match.scoringType,
        )
    }

    const refreshedMatch = await getMatchData(matchID)
    if (refreshedMatch) {
        await syncMatchSchemaFromFlat(matchID, refreshedMatch)
    }
    await appendMatchAuditEvent(matchID, 'undo_applied', {
        eventID,
        sourceAction: event.action,
        gameNumber,
        side,
        resultingScore: nextScore,
    })
    return refreshedMatch
}

export async function updateService(
    matchID,
    isAInitialServer,
    gameNumber,
    combinedPoints,
    changeServeEveryXPoints,
    pointsToWinGame,
    sportName,
    scoringType: string | null = null,
) {

    switch (sportName) {
        case "tableTennis":
            await db.ref(`matches/${matchID}/isACurrentlyServing`).set(isAServing(isAInitialServer, gameNumber, combinedPoints, changeServeEveryXPoints, pointsToWinGame))

            break;
        case "pickleball":
            //This function is not used in pickleball, only when creating a new game. 
            // Also setting this to isSecondServer:true
            await Promise.all([
                db.ref(`matches/${matchID}/isACurrentlyServing`).set(isAServing(isAInitialServer, gameNumber, combinedPoints, changeServeEveryXPoints, pointsToWinGame)),
                db.ref(`matches/${matchID}/isSecondServer`).set(true),
            ])
            break;
        default:
            await db.ref(`matches/${matchID}/isACurrentlyServing`).set(isAServing(isAInitialServer, gameNumber, combinedPoints, changeServeEveryXPoints, pointsToWinGame))

            break;
    }



}

export function getCurrentGameNumber(match) {
    if (match) {
        if (match.isInBetweenGames) {

            for (let gameN = 1; gameN <= 9; gameN++) {
                if (match[`isGame${gameN}Started`] === true && match[`isGame${gameN}Finished`] === true) {
                    //Do Nothing
                }
                else {
                    return gameN
                }
            }
        }
        let gameScoreFieldsOnly = {}
        Object.entries(match).filter((field) => {
            if (field[0].match(/game[1-9][A-B]Score/g)) {
                return true
            }
        }).map((gameField) => {
            gameScoreFieldsOnly[gameField[0]] = gameField[1]
        })
        for (let gameN = 1; gameN <= 9; gameN++) {
            if (match[`isGame${gameN}Started`] === true && match[`isGame${gameN}Finished`] === false) {
                return gameN
            }
        }
        return 1
    }
}

export function getCurrentGameScore(match) {
    if (match) {

        for (let gameN = 1; gameN <= 9; gameN++) {
            if (match[`isGame${gameN}Started`] === true && match[`isGame${gameN}Finished`] === false) {
                return {
                    a: match[`game${gameN}AScore`],
                    b: match[`game${gameN}BScore`]
                }
            }
        }
        return {
            a: match[`game1AScore`],
            b: match[`game1BScore`]
        }

    }
}

export function hasActiveGame(match) {
    for (let gameN = 1; gameN <= 9; gameN++) {
        if (match[`isGame${gameN}Started`] === true && match[`isGame${gameN}Finished`] === false) {
            return true
        }
    }
    return false
}

export function getActiveGameNumber(match) {
    for (let gameN = 1; gameN <= 9; gameN++) {
        if (match[`isGame${gameN}Started`] === true && match[`isGame${gameN}Finished`] === false) {
            return gameN
        }
    }
    return false
}

export async function getMatchData(matchID: string): Promise<MatchRecord | null> {
    const matchValue = await getValue<Record<string, unknown>>(`matches/${matchID}`)
    return normalizeMatchSchema(matchValue) as MatchRecord | null

}

async function syncMatchSchemaAndAudit(matchID, action, payload = {}) {
    const match = await getMatchData(matchID)
    if (!match) {
        return null
    }

    await syncMatchSchemaFromFlat(matchID, match)
    await appendMatchAuditEvent(matchID, action, payload)
    return match
}

export function subscribeToMatchData(
    matchID: string,
    callback: (match: MatchRecord | null) => void,
) {
    return subscribeToPathValue(`matches/${matchID}`, (matchValue) => {
        callback(normalizeMatchSchema(matchValue as Record<string, unknown> | null) as MatchRecord | null)
    })
}

export async function subscribeToAllMatchFields(matchID, callback) {
    let match = await getMatchData(matchID)
    if (!match) {
        return []
    }
    let offList: Array<() => void> = []
    for (const key in match) {
        offList.push(
            subscribeToPathValue(`matches/${matchID}/${key}`, (value) => {
                callback(unwrapRealtimeValue(value), key)
            })
        )
    }
    return offList
}

export async function unsubscribeToAllMatchFields(matchID, match) {
    for (const key in match) {
        let matchRef = db.ref(`matches/${matchID}/${key}`)
        matchRef.off("value", () => {
        })
    }
}

export async function createNewMatch(
    tableID,
    sportName,
    previousMatchObj = null,
    isTeamMatch: boolean | null = null,
    scoringType: string | null = null,
) {
    const existingCurrentMatchID = await getCurrentMatchForTable(tableID)
    let newMatch = await db.ref(`matches`).push(new Match().createNew(sportName, previousMatchObj, isTeamMatch ?? false, scoringType ?? undefined))
    try {
        await db.ref(`tables/${tableID}/currentMatch`).compareSet(existingCurrentMatchID || "", newMatch.key)
    } catch {
        if (newMatch.key) {
            await db.ref(`matches/${newMatch.key}`).remove()
        }
        throw new Error('Table already has an active match')
    }
    if (existingCurrentMatchID) {
        await reconcileScheduledQueueItemForMatch(tableID, existingCurrentMatchID, 'completed', false)
    }
    if (newMatch.key) {
        await Promise.all([
            db.ref(`matches/${newMatch.key}/schemaVersion`).set(MATCH_SCHEMA_VERSION),
            db.ref(`matches/${newMatch.key}/scheduling`).update({
                tableID,
                sourceType: 'table',
            }),
        ])
    }
    return newMatch.key
}

export async function createNewScheduledMatch(sportName) {
    let newMatch = await db.ref(`matches`).push(new Match().createNew(sportName))
    return newMatch.key
}

export const scheduledMatchStatusOptions: ScheduledMatchStatus[] = [
    'scheduled',
    'queued',
    'called',
    'active',
    'paused',
    'completed',
    'cancelled',
    'archived',
]

const promotableScheduledMatchStatuses = new Set<ScheduledMatchStatus>(['scheduled', 'queued', 'called', 'paused'])
const scheduledMatchStatusTransitions: Record<ScheduledMatchStatus, ScheduledMatchStatus[]> = {
    scheduled: ['queued', 'called', 'paused', 'cancelled', 'archived'],
    queued: ['scheduled', 'called', 'paused', 'cancelled', 'archived'],
    called: ['queued', 'paused', 'cancelled', 'archived'],
    active: ['paused', 'completed', 'cancelled', 'archived'],
    paused: ['queued', 'called', 'cancelled', 'archived'],
    completed: ['archived'],
    cancelled: ['archived'],
    archived: [],
}

function getQueueTimestamp(value: string | undefined) {
    const parsed = value ? new Date(value).getTime() : Number.NaN
    return Number.isFinite(parsed) ? parsed : Date.now()
}

export function normalizeScheduledMatchEntry(
    scheduledMatchID: string,
    scheduledMatch: ScheduledMatch | null | undefined,
): [string, ScheduledMatch] {
    const normalized = scheduledMatch || {}
    const scheduledOn = typeof normalized.scheduledOn === 'string' && normalized.scheduledOn
        ? normalized.scheduledOn
        : new Date().toISOString()

    return [scheduledMatchID, {
        ...normalized,
        matchID: typeof normalized.matchID === 'string' ? normalized.matchID : '',
        playerA: typeof normalized.playerA === 'string' ? normalized.playerA : 'TBD',
        playerB: typeof normalized.playerB === 'string' ? normalized.playerB : 'TBD',
        status: scheduledMatchStatusOptions.includes(normalized.status as ScheduledMatchStatus)
            ? normalized.status as ScheduledMatchStatus
            : 'scheduled',
        queueOrder: typeof normalized.queueOrder === 'number'
            ? normalized.queueOrder
            : getQueueTimestamp(normalized.startTime || scheduledOn),
        scheduledOn,
        updatedAt: typeof normalized.updatedAt === 'string' ? normalized.updatedAt : scheduledOn,
        operatorNotes: typeof normalized.operatorNotes === 'string' ? normalized.operatorNotes : '',
        assignedScorerID: typeof normalized.assignedScorerID === 'string' ? normalized.assignedScorerID : '',
    }]
}

export function sortScheduledMatchEntries(entries: Array<[string, ScheduledMatch]>) {
    return [...entries]
        .map(([scheduledMatchID, scheduledMatch]) => normalizeScheduledMatchEntry(scheduledMatchID, scheduledMatch))
        .sort((a, b) => {
            const orderA = typeof a[1].queueOrder === 'number' ? a[1].queueOrder : Number.MAX_SAFE_INTEGER
            const orderB = typeof b[1].queueOrder === 'number' ? b[1].queueOrder : Number.MAX_SAFE_INTEGER
            if (orderA !== orderB) {
                return orderA - orderB
            }
            return getQueueTimestamp(a[1].startTime || a[1].scheduledOn) - getQueueTimestamp(b[1].startTime || b[1].scheduledOn)
        })
}

export function isScheduledMatchPromotable(scheduledMatch: ScheduledMatch | null | undefined) {
    return promotableScheduledMatchStatuses.has((scheduledMatch?.status || 'scheduled') as ScheduledMatchStatus)
}

export function canTransitionScheduledMatchStatus(
    currentStatus: ScheduledMatchStatus | undefined,
    nextStatus: ScheduledMatchStatus,
) {
    const normalizedCurrentStatus = (currentStatus || 'scheduled') as ScheduledMatchStatus
    if (normalizedCurrentStatus === nextStatus) {
        return true
    }
    return scheduledMatchStatusTransitions[normalizedCurrentStatus]?.includes(nextStatus) || false
}

export function getNextPromotableScheduledMatch(entries: Array<[string, ScheduledMatch]>) {
    return sortScheduledMatchEntries(entries).find(([, scheduledMatch]) => isScheduledMatchPromotable(scheduledMatch)) || null
}

async function getScheduledMatchesByTable(tableID: string) {
    return await getValue<Record<string, ScheduledMatch>>(`tables/${tableID}/scheduledMatches`) || {}
}

async function persistScheduledMatch(tableID: string, scheduledMatchID: string, scheduledMatch: ScheduledMatch) {
    await db.ref(`tables/${tableID}/scheduledMatches/${scheduledMatchID}`).set(scheduledMatch)
    return scheduledMatch
}

async function applyRootUpdate(update: Record<string, unknown>) {
    await db.ref('').update(update)
}

async function clearCurrentMatchIfMatches(tableID: string, matchID: string) {
    try {
        await db.ref(`tables/${tableID}/currentMatch`).compareSet(matchID, "")
    } catch {
        const currentMatchID = await getCurrentMatchForTable(tableID)
        if (currentMatchID === matchID) {
            throw new Error('Failed to clear the current match claim')
        }
    }
}

async function findScheduledMatchRowForMatch(tableID: string, matchID: string) {
    const scheduledMatches = await getScheduledMatchesByTable(tableID)
    return sortScheduledMatchEntries(Object.entries(scheduledMatches)).find(([, scheduledMatch]) => scheduledMatch.matchID === matchID) || null
}

export async function reconcileScheduledQueueItemForMatch(
    tableID: string,
    matchID: string,
    nextStatus: Extract<ScheduledMatchStatus, 'completed' | 'archived' | 'cancelled'> = 'completed',
    clearCurrentMatch = true,
) {
    const queueMatch = await findScheduledMatchRowForMatch(tableID, matchID)
    if (!queueMatch) {
        if (clearCurrentMatch) {
            await clearCurrentMatchIfMatches(tableID, matchID)
        }
        return null
    }

    const [scheduledMatchID, scheduledMatch] = queueMatch
    const now = new Date().toISOString()
    const reconciledMatch: ScheduledMatch = {
        ...scheduledMatch,
        status: nextStatus,
        updatedAt: now,
        ...(nextStatus === 'completed' ? { completedAt: now } : {}),
        ...(nextStatus === 'archived' ? { archivedAt: now } : {}),
        ...(nextStatus === 'cancelled' ? { cancelledAt: now } : {}),
    }

    const update: Record<string, unknown> = {
        [`tables/${tableID}/scheduledMatches/${scheduledMatchID}`]: reconciledMatch,
    }
    if (clearCurrentMatch) {
        update[`tables/${tableID}/currentMatch`] = ''
    }
    await applyRootUpdate(update)
    return reconciledMatch
}


export async function getCurrentMatchForTable(tableID) {
    return await getStringValue(`tables/${tableID}/currentMatch`)

}
export async function unassignedCurrentMatchForTable(tableID) {
    await db.ref(`tables/${tableID}/currentMatch`).set("")
}

export async function archiveMatchForTable(tableID, matchID, matchSettings: any = null) {
    let match
    if (matchSettings) {
        match = matchSettings
    }
    else {
        match = await getMatchData(matchID)
    }

    let matchScores = getMatchScore(match)

    let archivedMatch = {
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
        archivedOn: new Date().toISOString(),
        startTime: match["matchStartTime"]
    }

    let currentMatchSnapShot = await db.ref(`tables/${tableID}/archivedMatches`).push(archivedMatch)
    return currentMatchSnapShot.key

}

export async function completeCurrentTableMatch(
    tableID,
    matchID,
    matchSettings: any = null,
    shouldPromoteNext: boolean = false,
) {
    const archivedMatch = matchSettings || await getMatchData(matchID)
    await archiveMatchForTable(tableID, matchID, archivedMatch)
    await reconcileScheduledQueueItemForMatch(tableID, matchID, 'completed', true)
    if (archivedMatch?.tournamentID && archivedMatch?.roundID) {
        const tournamentsModule = await import('./tournaments')
        await tournamentsModule.syncTournamentRoundAutomation(String(archivedMatch.tournamentID), String(archivedMatch.roundID))
    }
    if (shouldPromoteNext) {
        return promoteNextScheduledMatch(tableID)
    }
    return null
}



export async function getArchivedMatchesForTable(tableID) {



    let currentMatchSnapShot = await db.ref(`tables/${tableID}/archivedMatches`).get()
    let val = currentMatchSnapShot.val()
    if (val) {
        return Object.entries(currentMatchSnapShot.val())
    }
    else {
        return []
    }


}
export async function getArchivedMatchesForTeamMatch(teamMatchID) {
    let currentMatchSnapShot = await db.ref(`teamMatches/${teamMatchID}/archivedMatches`).get()
    let val = currentMatchSnapShot.val()
    if (val) {
        return Object.entries(currentMatchSnapShot.val())
    }
    else {
        return []
    }
}

export async function addScheduledMatch(tableID, matchID, startTime, patch: Partial<ScheduledMatch> = {}) {
    let match = await getMatchData(matchID)
    if (!match) {
        return null
    }
    let matchScores = getMatchScore(match)

    let matchSummary = {
        matchID: matchID,
        playerA: getCombinedPlayerNames(match["playerA"], match["playerB"], match["playerA2"], match["playerB2"]).a,
        playerB: getCombinedPlayerNames(match["playerA"], match["playerB"], match["playerA2"], match["playerB2"]).b,
        AScore: matchScores.a,
        BScore: matchScores.b,
        status: 'scheduled',
        queueOrder: getQueueTimestamp(startTime),
        scheduledOn: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        startTime: startTime,
        sourceType: 'manual',
        sourceID: matchID,
        operatorNotes: '',
        assignedScorerID: '',
        ...patch,
    }
    let currentMatchSnapShot = await db.ref(`tables/${tableID}/scheduledMatches`).push(matchSummary)
    return currentMatchSnapShot.key
}

export async function updateScheduledMatch(tableID, scheduledMatchID, matchID, startTime, patch: Partial<ScheduledMatch> = {}) {
    let match = await getMatchData(matchID)
    if (!match) {
        return null
    }
    const existingScheduledMatches = await getScheduledMatchesByTable(tableID)
    if (!existingScheduledMatches[scheduledMatchID]) {
        throw new Error('Scheduled match was not found')
    }
    if (patch.status === 'active') {
        throw new Error('Use promoteScheduledTableMatch to activate a queue row')
    }
    const [, existing] = normalizeScheduledMatchEntry(scheduledMatchID, existingScheduledMatches[scheduledMatchID])
    let matchScores = getMatchScore(match)
    let matchSummary = {
        ...existing,
        ...patch,
        matchID: matchID,
        playerA: getCombinedPlayerNames(match["playerA"], match["playerB"], match["playerA2"], match["playerB2"]).a,
        playerB: getCombinedPlayerNames(match["playerA"], match["playerB"], match["playerA2"], match["playerB2"]).b,
        AScore: matchScores.a,
        BScore: matchScores.b,
        queueOrder: typeof patch.queueOrder === 'number' ? patch.queueOrder : existing.queueOrder,
        scheduledOn: existing.scheduledOn || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        startTime: startTime
    }
    await persistScheduledMatch(tableID, scheduledMatchID, matchSummary)
    return matchSummary
}

export async function setScheduledTableMatchStatus(tableID, scheduledMatchID, status: ScheduledMatchStatus) {
    const scheduledMatches = await getScheduledMatchesByTable(tableID)
    if (!scheduledMatches[scheduledMatchID]) {
        throw new Error('Scheduled match was not found')
    }
    const [, scheduledMatch] = normalizeScheduledMatchEntry(scheduledMatchID, scheduledMatches[scheduledMatchID])
    if (status === 'active') {
        throw new Error('Use promoteScheduledTableMatch to activate a queue row')
    }
    if (!canTransitionScheduledMatchStatus((scheduledMatch.status || 'scheduled') as ScheduledMatchStatus, status)) {
        throw new Error(`Invalid queue status transition from ${scheduledMatch.status || 'scheduled'} to ${status}`)
    }
    const now = new Date().toISOString()
    const nextScheduledMatch: ScheduledMatch = {
        ...scheduledMatch,
        status,
        updatedAt: now,
        ...(status === 'completed' ? { completedAt: now } : {}),
        ...(status === 'cancelled' ? { cancelledAt: now } : {}),
        ...(status === 'archived' ? { archivedAt: now } : {}),
    }
    const update: Record<string, unknown> = {
        [`tables/${tableID}/scheduledMatches/${scheduledMatchID}`]: nextScheduledMatch,
    }
    if (scheduledMatch.status === 'active' && scheduledMatch.matchID) {
        update[`tables/${tableID}/currentMatch`] = ''
    }
    await applyRootUpdate(update)
    return nextScheduledMatch
}

export async function reorderScheduledTableMatch(tableID, scheduledMatchID, direction: 'up' | 'down') {
    const scheduledMatches = await getScheduledMatchesByTable(tableID)
    const orderedEntries = sortScheduledMatchEntries(Object.entries(scheduledMatches))
    const currentIndex = orderedEntries.findIndex(([currentScheduledMatchID]) => currentScheduledMatchID === scheduledMatchID)
    if (currentIndex < 0) {
        return orderedEntries
    }

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (targetIndex < 0 || targetIndex >= orderedEntries.length) {
        return orderedEntries
    }

    const reorderedEntries = [...orderedEntries]
    const [movedEntry] = reorderedEntries.splice(currentIndex, 1)
    reorderedEntries.splice(targetIndex, 0, movedEntry)

    const reorderedRecord = Object.fromEntries(reorderedEntries.map(([currentScheduledMatchID, currentScheduledMatch], index) => [
        currentScheduledMatchID,
        {
            ...currentScheduledMatch,
            queueOrder: (index + 1) * 1000,
            updatedAt: new Date().toISOString(),
        },
    ]))

    await db.ref(`tables/${tableID}/scheduledMatches`).set(reorderedRecord)
    return sortScheduledMatchEntries(Object.entries(reorderedRecord))
}

export async function copyScheduledTableMatchesToTable(
    sourceTableID: string,
    targetTableID: string,
    scheduledMatchIDs: string[],
    removeSource: boolean = false,
) {
    if (!sourceTableID || !targetTableID || sourceTableID === targetTableID) {
        return { copied: 0, removed: 0, skipped: scheduledMatchIDs.length }
    }

    const sourceScheduledMatches = await getScheduledMatchesByTable(sourceTableID)
    const targetScheduledMatches = await getScheduledMatchesByTable(targetTableID)
    const sortedTargetEntries = sortScheduledMatchEntries(Object.entries(targetScheduledMatches))
    let nextQueueOrder = sortedTargetEntries.length > 0
        ? Math.max(...sortedTargetEntries.map(([, scheduledMatch]) => Number(scheduledMatch.queueOrder || 0))) + 1000
        : 1000

    let copied = 0
    let removed = 0
    let skipped = 0

    for (const scheduledMatchID of scheduledMatchIDs) {
        const sourceMatch = sourceScheduledMatches[scheduledMatchID]
        if (!sourceMatch) {
            skipped += 1
            continue
        }

        const [, normalizedMatch] = normalizeScheduledMatchEntry(scheduledMatchID, sourceMatch)
        if (normalizedMatch.status === 'active') {
            skipped += 1
            continue
        }

        const clonedMatch: ScheduledMatch = {
            ...normalizedMatch,
            queueOrder: nextQueueOrder,
            updatedAt: new Date().toISOString(),
            scheduledOn: normalizedMatch.scheduledOn || new Date().toISOString(),
            promotionSource: removeSource ? 'bulk-move' : 'bulk-copy',
        }
        nextQueueOrder += 1000

        await db.ref(`tables/${targetTableID}/scheduledMatches`).push(clonedMatch)
        copied += 1

        if (removeSource) {
            await deleteScheduledTableMatch(sourceTableID, scheduledMatchID)
            removed += 1
        }
    }

    return { copied, removed, skipped }
}

export async function moveScheduledTableMatchToTable(
    sourceTableID: string,
    targetTableID: string,
    scheduledMatchID: string,
) {
    if (!sourceTableID || !targetTableID || sourceTableID === targetTableID) {
        return null
    }

    const sourceScheduledMatches = await getScheduledMatchesByTable(sourceTableID)
    const sourceMatch = sourceScheduledMatches[scheduledMatchID]
    if (!sourceMatch) {
        throw new Error('Scheduled match was not found')
    }

    const [, normalizedMatch] = normalizeScheduledMatchEntry(scheduledMatchID, sourceMatch)
    const targetScheduledMatches = await getScheduledMatchesByTable(targetTableID)
    const sortedTargetEntries = sortScheduledMatchEntries(Object.entries(targetScheduledMatches))
    const nextQueueOrder = sortedTargetEntries.length > 0
        ? Math.max(...sortedTargetEntries.map(([, scheduledMatch]) => Number(scheduledMatch.queueOrder || 0))) + 1000
        : 1000

    const pushedScheduledMatch = await db.ref(`tables/${targetTableID}/scheduledMatches`).push({
        ...normalizedMatch,
        queueOrder: nextQueueOrder,
        updatedAt: new Date().toISOString(),
        promotionSource: 'bulk-move',
    })

    await deleteScheduledTableMatch(sourceTableID, scheduledMatchID)
    return pushedScheduledMatch.key
}

export async function promoteScheduledTableMatch(tableID, scheduledMatchID, promotionSource = 'manual') {
    const scheduledMatches = await getScheduledMatchesByTable(tableID)
    if (!scheduledMatches[scheduledMatchID]) {
        throw new Error('Scheduled match was not found')
    }
    const [, scheduledMatch] = normalizeScheduledMatchEntry(scheduledMatchID, scheduledMatches[scheduledMatchID])
    if (!scheduledMatch.matchID || !isScheduledMatchPromotable(scheduledMatch)) {
        throw new Error('Scheduled match is not promotable')
    }

    const now = new Date().toISOString()
    const nextScheduledMatch: ScheduledMatch = {
        ...scheduledMatch,
        status: 'active',
        promotedAt: now,
        updatedAt: now,
        promotionSource,
    }
    try {
        await db.ref(`tables/${tableID}/currentMatch`).compareSet("", scheduledMatch.matchID)
    } catch {
        throw new Error('Table already has an active match')
    }
    try {
        await applyRootUpdate({
            [`tables/${tableID}/scheduledMatches/${scheduledMatchID}`]: nextScheduledMatch,
            [`matches/${scheduledMatch.matchID}/scheduling/tableID`]: tableID,
            [`matches/${scheduledMatch.matchID}/scheduling/queueItemID`]: scheduledMatchID,
            [`matches/${scheduledMatch.matchID}/scheduling/sourceType`]: 'scheduled-table-queue',
        })
    } catch (error) {
        await clearCurrentMatchIfMatches(tableID, scheduledMatch.matchID)
        throw error
    }
    return scheduledMatch.matchID
}

export async function promoteNextScheduledMatch(tableID) {
    const scheduledMatches = await getScheduledMatchesByTable(tableID)
    const nextScheduledMatch = getNextPromotableScheduledMatch(Object.entries(scheduledMatches))
    if (!nextScheduledMatch) {
        return null
    }
    return promoteScheduledTableMatch(tableID, nextScheduledMatch[0], 'promote-next')
}

export async function deleteScheduledTableMatch(tableID, scheduledMatchID) {
    await db.ref(`tables/${tableID}/scheduledMatches/${scheduledMatchID}`).remove()
}


export async function getTableInfo(tableID) {
    let currentMatchSnapShot = await db.ref(`tables/${tableID}`).get()
    return currentMatchSnapShot.val()

}

export async function switchSides(matchID) {
    let currentSwitchedValueSnapshot = await db.ref(`matches/${matchID}/isSwitched`).get()
    let currentSwitchedValue = currentSwitchedValueSnapshot.val()
    let newIsSwitched = currentSwitchedValue ? false : true
    await db.ref(`matches/${matchID}/isSwitched`).set(newIsSwitched)
    return newIsSwitched
}



export async function updateCurrentPlayer(currentMatchID, player, playerSettings) {
    let updatePlayer = await db.ref(`matches/${currentMatchID}/${player}/`).set(playerSettings)

}

export function getMatchScore(match) {
    let gameScore = { a: 0, b: 0 }
    for (let gameN = 1; gameN <= 9; gameN++) {
        if (isDeletedGame(match, gameN)) {
            continue
        }
        if (match[`isGame${gameN}Finished`] === true) {
            if (match[`game${gameN}AScore`] > match[`game${gameN}BScore`]) {
                gameScore.a++
            }
            else {
                gameScore.b++
            }
        }

    }
    return gameScore
}

export async function resetMatchScores(matchID) {
    for (let gameN = 1; gameN <= 9; gameN++) {
        await Promise.all([
            db.ref(`matches/${matchID}/isGame${gameN}Finished`).set(false),
            db.ref(`matches/${matchID}/game${gameN}AScore`).set(0),
            db.ref(`matches/${matchID}/game${gameN}BScore`).set(0),
            db.ref(`matches/${matchID}/isGame${gameN}Started`).set(false),
            db.ref(`matches/${matchID}/game${gameN}StartTime`).set(""),
            db.ref(`matches/${matchID}/game${gameN}EndTime`).set(""),
        ])


    }


}

function isInitialServerServingGame(combinedPoints, serveChangePoints) {
    let serveChangedCount = Math.floor(combinedPoints / serveChangePoints)
    if (serveChangedCount % 2 === 0) {
        return true
    }
    else {
        return false
    }
}

export function isAServing(initialMatchServerIsA, gameNumber, combinedScore, serveChangePoints, pointsToWinGame) {
    const pointsAtDeuce = (pointsToWinGame - 1) * 2
    const gameIndex = gameNumber - 1
    if (combinedScore >= pointsAtDeuce) {
        if (combinedScore % 2 === 0) {
            return gameIndex % 2 === 0 ? (initialMatchServerIsA ? true : false) : (initialMatchServerIsA ? false : true)
        }
        else {
            return gameIndex % 2 === 0 ? (initialMatchServerIsA ? false : true) : (initialMatchServerIsA ? true : false)

        }
    }
    else {
        if (gameIndex % 2 === 0) {
            return isInitialServerServingGame(combinedScore, serveChangePoints) ? (initialMatchServerIsA ? true : false) : (initialMatchServerIsA ? false : true)
        }
        else {
            return isInitialServerServingGame(combinedScore, serveChangePoints) ? (initialMatchServerIsA ? false : true) : (initialMatchServerIsA ? true : false)
        }
    }

}

export function isGameFinished(enforceGameScore, playerAScore, playerBScore, pointsToWinGame) {

    if (enforceGameScore) {
        if (playerAScore >= pointsToWinGame && playerBScore <= playerAScore - 2) {
            return true
        }
        else if (playerBScore >= pointsToWinGame && playerAScore <= playerBScore - 2) {
            return true
        }
        else {
            return false
        }

    }
    else {
        return false
    }
}

export function isValidGameScore(enforceGameScore, playerAScore, playerBScore, pointsToWinGame) {

    if (enforceGameScore) {
        if (playerAScore >= pointsToWinGame && playerBScore <= playerAScore - 2) {
            if (playerBScore >= pointsToWinGame - 1 && Math.abs(playerAScore - playerBScore) === 2) {
                return true
            }
            if (playerAScore === pointsToWinGame && playerBScore < pointsToWinGame - 1) {
                return true
            }
            else {

                return false
            }

        }
        else if (playerBScore >= pointsToWinGame && playerAScore <= playerBScore - 2) {
            if (playerAScore >= pointsToWinGame - 1 && Math.abs(playerAScore - playerBScore) === 2) {
                return true
            }
            if (playerBScore === pointsToWinGame && playerAScore < pointsToWinGame - 1) {
                return true
            }
            else {
                return false
            }
        }
        else {
            return false
        }

    }
    else {
        return false
    }
}

export async function endGame(matchID, gameNumber) {
    await Promise.all([
        db.ref(`matches/${matchID}/isGame${gameNumber}Finished`).set(true),
        db.ref(`matches/${matchID}/game${gameNumber}EndTime`).set(new Date().toISOString()),
        db.ref(`matches/${matchID}/isInBetweenGames`).set(true),
    ])


    const match = await getMatchData(matchID)
    if (match) {
        await syncMatchSchemaFromFlat(matchID, match)
        await appendMatchAuditEvent(matchID, 'game_finished', {
            gameNumber,
            winner: match.games?.[String(gameNumber)]?.winner || '',
        })
    }

    return {
        [`isGame${gameNumber}Finished`]: true,
        [`game${gameNumber}EndTime`]: new Date().toISOString(),
        isInBetweenGames: true
    }
}

export async function startGame(matchID, gameNumber) {
    await Promise.all([

        db.ref(`matches/${matchID}/isMatchStarted`).set(true),
        db.ref(`matches/${matchID}/matchStartTime`).set(new Date().toISOString()),
        db.ref(`matches/${matchID}/isGame${gameNumber}Started`).set(true),
        db.ref(`matches/${matchID}/game${gameNumber}StartTime`).set(new Date().toISOString()),
        db.ref(`matches/${matchID}/isInBetweenGames`).set(false),
    ])

    const match = await getMatchData(matchID)
    if (match) {
        await syncMatchSchemaFromFlat(matchID, match)
        await appendMatchAuditEvent(matchID, 'game_started', {
            gameNumber,
        })
    }



}



export async function setInitialMatchServer(matchID, isAInitialServer) {
    await db.ref(`matches/${matchID}/isInitialServerSelected`).set(true)
    await db.ref(`matches/${matchID}/isAInitialServer`).set(isAInitialServer)
    const match = await getMatchData(matchID)
    if (match) {
        await syncMatchSchemaFromFlat(matchID, match)
        await appendMatchAuditEvent(matchID, 'initial_server_set', { isAInitialServer })
    }
}

export function isGamePoint(match) {
    let { pointsToWinGame, } = match

    let currentScore = getCurrentGameScore(match)
    if (!currentScore) {
        return false
    }

    if (currentScore.a === pointsToWinGame - 1 && currentScore.b < pointsToWinGame - 1) {
        return true
    }
    else if (currentScore.b === pointsToWinGame - 1 && currentScore.a < pointsToWinGame - 1) {
        return true
    }
    else if (currentScore.a >= pointsToWinGame - 1 && currentScore.b >= pointsToWinGame - 1) {
        if (currentScore.a === currentScore.b) {
            return false
        }
        else if (Math.abs(currentScore.a - currentScore.b) === 1) {
            return true
        }
        else {
            return false
        }
    }
    else {
        return false
    }

}
//This is used with isGamePoint to determine if it is match point.
export function isFinalGame(match) {
    let matchScores = getMatchScore(match)
    const gameScore = getCurrentGameScore(match)
    if (!gameScore) {
        return false
    }
    if ((match.bestOf - 1) / 2 === matchScores.a && gameScore.a > gameScore.b) {
        return true
    }

    else if ((match.bestOf - 1) / 2 === matchScores.b && gameScore.b > gameScore.a) {

        return true
    }
    else {
        return false
    }
}

export async function setIsGamePoint(matchID, isGamePoint) {
    await db.ref(`matches/${matchID}/isGamePoint`).set(isGamePoint)
    await syncMatchSchemaAndAudit(matchID, 'game_point_flag_set', { isGamePoint })
}
export async function setIsMatchPoint(matchID, isGamePoint) {
    await db.ref(`matches/${matchID}/isMatchPoint`).set(isGamePoint)
    await syncMatchSchemaAndAudit(matchID, 'match_point_flag_set', { isMatchPoint: isGamePoint })
}

export async function setRoundName(matchID, roundName) {
    await Promise.all([
        db.ref(`matches/${matchID}/matchRound`).set(roundName),
        db.ref(`matches/${matchID}/schemaVersion`).set(MATCH_SCHEMA_VERSION),
        db.ref(`matches/${matchID}/tournamentContext/matchRound`).set(roundName),
    ])
    const match = await getMatchData(matchID)
    if (match) {
        await syncMatchSchemaFromFlat(matchID, match)
        await appendMatchAuditEvent(matchID, 'round_name_set', { roundName })
    }
}

export async function addSignificantPoint(matchID, gameNumber, playerAScore, playerBScore) {
    await db.ref(`matches/${matchID}/significantPoints`).push({
        playerAScore: playerAScore,
        playerBScore: playerBScore,
        gameNumber: gameNumber
    })
    await appendMatchPointHistory(matchID, {
        action: 'significant_point',
        createdAt: new Date().toISOString(),
        gameNumber,
        scoreA: playerAScore,
        scoreB: playerBScore,
    })
}

export async function getSignificantPoints(matchID) {
    let sigPointsSnap = await db.ref(`matches/${matchID}/significantPoints`).get()
    let sigPoints = sigPointsSnap.val()
    if (sigPoints) {
        return Object.entries(sigPoints)
    }
    else {
        return []
    }
}

export async function setIsDoubles(matchID, isDoubles) {
    await db.ref(`matches/${matchID}/isDoubles`).set(isDoubles)
    const match = await getMatchData(matchID)
    if (match) {
        await syncMatchSchemaFromFlat(matchID, match)
        await appendMatchAuditEvent(matchID, 'doubles_mode_set', { isDoubles })
    }
}

export async function setYellowFlag(matchID, AorB, isFlagged) {
    await db.ref(`matches/${matchID}/is${AorB}YellowCarded`).set(isFlagged)
    await syncMatchSchemaAndAudit(matchID, 'yellow_card_set', { side: AorB, isFlagged })
}
export async function setRedFlag(matchID, AorB, isFlagged) {
    await db.ref(`matches/${matchID}/is${AorB}RedCarded`).set(isFlagged)
    await syncMatchSchemaAndAudit(matchID, 'red_card_set', { side: AorB, isFlagged })
}

export async function setJudgePauseState(matchID, isPaused, reason = "") {
    await Promise.all([
        db.ref(`matches/${matchID}/isJudgePaused`).set(isPaused),
        db.ref(`matches/${matchID}/judgePauseReason`).set(isPaused ? reason : ""),
    ])
    await syncMatchSchemaAndAudit(matchID, 'judge_pause_set', { isPaused, reason: isPaused ? reason : "" })
}

export async function setMatchDisputeState(matchID, isDisputed, note = "") {
    await db.ref(`matches/${matchID}/isDisputed`).set(isDisputed)
    if (note) {
        await Promise.all([
            db.ref(`matches/${matchID}/latestJudgeNote`).set(note),
            db.ref(`matches/${matchID}/latestJudgeNoteAt`).set(new Date().toISOString()),
        ])
    }
    await syncMatchSchemaAndAudit(matchID, 'match_dispute_set', { isDisputed, note })
}

export async function addJudgeNote(matchID, note) {
    const trimmedNote = typeof note === 'string' ? note.trim() : ''
    if (!trimmedNote) {
        return
    }
    const createdAt = new Date().toISOString()
    await Promise.all([
        db.ref(`matches/${matchID}/latestJudgeNote`).set(trimmedNote),
        db.ref(`matches/${matchID}/latestJudgeNoteAt`).set(createdAt),
    ])
    await appendMatchAuditEvent(matchID, 'judge_note_added', { note: trimmedNote, createdAt })
}

export async function setisManualMode(matchID, isManual) {
    await db.ref(`matches/${matchID}/isManualServiceMode`).set(isManual)
    const match = await getMatchData(matchID)
    if (match) {
        await syncMatchSchemaFromFlat(matchID, match)
        await appendMatchAuditEvent(matchID, 'manual_service_mode_set', { isManual })
    }
}

export async function flipScoreboard(matchID) {
    let currentFlipSnap = await db.ref(`matches/${matchID}/isCourtSideScoreboardFlipped`).get()
    let currentFlip = currentFlipSnap.val()
    await db.ref(`matches/${matchID}/isCourtSideScoreboardFlipped`).set(currentFlip ? false : true)
    await appendMatchAuditEvent(matchID, 'scoreboard_flipped', { isCourtSideScoreboardFlipped: !currentFlip })
}

export async function setUsedTimeOut(matchID, AorB) {
    await db.ref(`matches/${matchID}/is${AorB}TimeOutUsed`).set(true)
    await db.ref(`matches/${matchID}/is${AorB}TimeOutActive`).set(false)
    await syncMatchSchemaAndAudit(matchID, 'timeout_used', { side: AorB })
}
export async function resetUsedTimeOut(matchID, AorB) {
    await Promise.all(
        [
            db.ref(`matches/${matchID}/is${AorB}TimeOutUsed`).set(false),
            db.ref(`matches/${matchID}/is${AorB}TimeOutActive`).set(false)
        ]
    )
    await syncMatchSchemaAndAudit(matchID, 'timeout_reset', { side: AorB })

}

export async function startTimeOut(matchID, AorB) {
    await db.ref(`matches/${matchID}/timeOutStartTime${AorB}`).set(new Date().toISOString())
    await db.ref(`matches/${matchID}/is${AorB}TimeOutActive`).set(true)
    await syncMatchSchemaAndAudit(matchID, 'timeout_started', { side: AorB })
}

export async function setServerManually(matchID, isAServing) {
    await db.ref(`matches/${matchID}/isACurrentlyServing`).set(isAServing)
    await syncMatchSchemaAndAudit(matchID, 'server_manually_set', { isAServing })
}

export function isMatchFinished(match) {
    let matchScores = getMatchScore(match)
    let winningGameScore = Math.floor(match.bestOf / 2) + 1
    if (winningGameScore === matchScores.a || winningGameScore === matchScores.b) {
        return true
    }
    else {
        return false
    }
}

export async function clearPlayer(matchID, player) {
    await db.ref(`matches/${matchID}/${player}`).set(getNewPlayer())
    await syncMatchSchemaAndAudit(matchID, 'player_cleared', { player })
}

export async function start2MinuteWarmUp(matchID,) {
    await startWarmup(matchID)
}

export async function stop2MinuteWarmUp(matchID,) {
    await endWarmup(matchID)
}

export async function setWarmupDuration(matchID, seconds) {
    const normalizedSeconds = Math.max(0, Number(seconds) || 0)
    await db.ref(`matches/${matchID}/warmupDurationSeconds`).set(normalizedSeconds)
    await syncMatchSchemaAndAudit(matchID, 'warmup_duration_set', { warmupDurationSeconds: normalizedSeconds })
}

export async function startWarmup(matchID) {
    const startedAt = new Date().toISOString()
    await Promise.all([
        db.ref(`matches/${matchID}/isWarmUpStarted`).set(true),
        db.ref(`matches/${matchID}/isWarmUpFinished`).set(false),
        db.ref(`matches/${matchID}/warmUpStartTime`).set(startedAt)
    ])
    await syncMatchSchemaAndAudit(matchID, 'warmup_started', { warmUpStartTime: startedAt })
}

export async function endWarmup(matchID) {
    await Promise.all([
        db.ref(`matches/${matchID}/isWarmUpStarted`).set(true),
        db.ref(`matches/${matchID}/isWarmUpFinished`).set(true),
    ])
    await syncMatchSchemaAndAudit(matchID, 'warmup_finished')
}

export async function deleteGame(matchID, gameNumber) {
    const deletedAt = new Date().toISOString()
    await Promise.all([
        db.ref(`matches/${matchID}/games/${gameNumber}/deleted`).set(true),
        db.ref(`matches/${matchID}/games/${gameNumber}/deletedAt`).set(deletedAt),
    ])
    await syncMatchSchemaAndAudit(matchID, 'game_deleted', { gameNumber, deletedAt })
}

export async function setJerseyColor(matchID, side, color) {
    const normalizedColor = typeof color === 'string' ? color : ''
    const sideKey = side === 'B' ? 'b' : 'a'
    const playerKey = side === 'B' ? 'playerB' : 'playerA'
    const currentPlayer = await getValue<Player>(`matches/${matchID}/${playerKey}`) || getNewPlayer()
    await Promise.all([
        db.ref(`matches/${matchID}/${sideKey}JerseyColor`).set(normalizedColor),
        db.ref(`matches/${matchID}/${playerKey}`).set({
            ...currentPlayer,
            jerseyColor: normalizedColor,
        }),
    ])
    await syncMatchSchemaAndAudit(matchID, 'jersey_color_set', { side, color: normalizedColor })
}

async function setSideName(matchID, side: 'A' | 'B', name: string) {
    const normalizedName = typeof name === 'string' ? name.trim() : ''
    const sideKey = side === 'B' ? 'b' : 'a'
    const playerKey = side === 'B' ? 'playerB' : 'playerA'
    const currentPlayer = await getValue<Player>(`matches/${matchID}/${playerKey}`) || getNewPlayer()
    await Promise.all([
        db.ref(`matches/${matchID}/${sideKey}PlayerName`).set(normalizedName),
        db.ref(`matches/${matchID}/${playerKey}`).set({
            ...currentPlayer,
            firstName: normalizedName,
            lastName: '',
        }),
    ])
    await syncMatchSchemaAndAudit(matchID, 'side_name_set', { side, name: normalizedName })
}

export async function setPlayerAName(matchID, name) {
    await setSideName(matchID, 'A', name)
}

export async function setPlayerBName(matchID, name) {
    await setSideName(matchID, 'B', name)
}

export async function setBestOf(matchID, maxGames) {
    await Promise.all([
        db.ref(`matches/${matchID}/bestOf`).set(maxGames),
    ])
    const match = await getMatchData(matchID)
    if (match) {
        await syncMatchSchemaFromFlat(matchID, match)
        await appendMatchAuditEvent(matchID, 'best_of_set', { bestOf: maxGames })
    }
}
export async function setGamePointsToWinGame(matchID, pointsToWin) {
    await Promise.all([
        db.ref(`matches/${matchID}/pointsToWinGame`).set(pointsToWin),
    ])
    const match = await getMatchData(matchID)
    if (match) {
        await syncMatchSchemaFromFlat(matchID, match)
        await appendMatchAuditEvent(matchID, 'points_to_win_set', { pointsToWinGame: pointsToWin })
    }
}

export async function setChangeServiceEveryXPoints(matchID, changeEveryPoints) {
    await Promise.all([
        db.ref(`matches/${matchID}/changeServeEveryXPoints`).set(changeEveryPoints),
    ])
    const match = await getMatchData(matchID)
    if (match) {
        await syncMatchSchemaFromFlat(matchID, match)
        await appendMatchAuditEvent(matchID, 'serve_rotation_set', { changeServeEveryXPoints: changeEveryPoints })
    }
}

export async function manuallySetGameScore(matchID, gameNumber, AScore, BScore) {
    await Promise.all([
        db.ref(`matches/${matchID}/game${gameNumber}AScore`).set(AScore),
        db.ref(`matches/${matchID}/game${gameNumber}BScore`).set(BScore),
        db.ref(`matches/${matchID}/games/${gameNumber}/deleted`).set(false),
    ])
    const match = await getMatchData(matchID)
    if (match) {
        await syncMatchSchemaFromFlat(matchID, match)
        await appendMatchAuditEvent(matchID, 'manual_game_score_set', {
            gameNumber,
            resultingScoreA: AScore,
            resultingScoreB: BScore,
        })
    }
}

export function watchForPasswordChange(tableID, callback) {
    return subscribeToPathValue(`tables/${tableID}`, (tableValue) => {
        if (tableValue && typeof tableValue === "object") {
            const accessRecord = tableValue as Record<string, any>
            callback([
                accessRecord.accessSecretMode || "",
                accessRecord.passwordUpdatedAt || "",
                accessRecord.passwordHash || "",
                accessRecord.password || "",
            ].join(":"))
        }
    })
}


export async function syncShowGameWonConfirmationModal(matchID, show) {
    await db.ref(`matches/${matchID}/showGameWonConfirmationModal`).set(show)
}

export async function syncShowInBetweenGamesModal(matchID, show) {
    await db.ref(`matches/${matchID}/showInBetweenGamesModal`).set(show)
}

export async function syncShowMatchSetupWizard(matchID, show) {
    await db.ref(`matches/${matchID}/showMatchSetupWizard`).set(show)
    await syncMatchSchemaAndAudit(matchID, 'match_setup_wizard_toggled', { show })
}

// Non table tennis related scoring functions
export async function getScoringTypeForTable(tableID) {
    let currentMatchSnapShot = await db.ref(`tables/${tableID}/scoringType`).get()
    return currentMatchSnapShot.val()

}
export async function setScoringType(matchID, value) {
    let currentMatchSnapShot = await db.ref(`matches/${matchID}/scoringType`).set(value)
    const match = await getMatchData(matchID)
    if (match) {
        await syncMatchSchemaFromFlat(matchID, match)
        await appendMatchAuditEvent(matchID, 'scoring_type_set', { scoringType: value })
    }

}

export async function getPointsToWinGameForTable(tableID) {
    let currentMatchSnapShot = await db.ref(`tables/${tableID}/pointsToWinGame`).get()
    return currentMatchSnapShot.val()

}


export async function BWonRally_PB(matchID, gameNumber, isACurrentlyServing, isSecondServer, isDoubles, isRallyScoring = false, pointsToWin, BScore) {
    if (isRallyScoring) {
        if (pointsToWin - 1 === parseInt(BScore) && isACurrentlyServing) {
            const serviceUpdates = [db.ref(`matches/${matchID}/isACurrentlyServing`).set(false)]
            if (isDoubles) {
                serviceUpdates.push(db.ref(`matches/${matchID}/isSecondServer`).set(BScore % 2 === 0 ? false : true))

            }
            else {
                serviceUpdates.push(db.ref(`matches/${matchID}/isSecondServer`).set(false))

            }
            await Promise.all(serviceUpdates)
            return BScore
        }
        else {

            await db.ref(`matches/${matchID}/isACurrentlyServing`).set(false)
            let newScoreB = await AddPoint(matchID, gameNumber, "B")
            if (isDoubles) {
                if (newScoreB % 2 === 0) {
                    await db.ref(`matches/${matchID}/isSecondServer`).set(false)
                }
                else {
                    await db.ref(`matches/${matchID}/isSecondServer`).set(true)
                }
            }
            else {
                await db.ref(`matches/${matchID}/isSecondServer`).set(false)

            }

            return newScoreB
        }
    } else {
        if (!isACurrentlyServing) {
            return await AddPoint(matchID, gameNumber, "B")
        }

        else {
            if (isDoubles) {
                if (isSecondServer) {
                    await Promise.all([
                        db.ref(`matches/${matchID}/isACurrentlyServing`).set(false),
                        db.ref(`matches/${matchID}/isSecondServer`).set(false),
                    ])

                }
                else {
                    await db.ref(`matches/${matchID}/isSecondServer`).set(true)
                }
            }
            else {
                await db.ref(`matches/${matchID}/isACurrentlyServing`).set(false)
            }

        }

    }
    return false
}

export async function AWonRally_PB(matchID, gameNumber, isACurrentlyServing, isSecondServer, isDoubles, isRallyScoring = false, pointsToWin, AScore) {
    if (isRallyScoring) {
        if (pointsToWin - 1 === parseInt(AScore) && !isACurrentlyServing) {
            const serviceUpdates = [db.ref(`matches/${matchID}/isACurrentlyServing`).set(true)]
            if (isDoubles) {
                serviceUpdates.push(db.ref(`matches/${matchID}/isSecondServer`).set(AScore % 2 === 0 ? false : true))
            }
            else {
                serviceUpdates.push(db.ref(`matches/${matchID}/isSecondServer`).set(false))
            }
            await Promise.all(serviceUpdates)

            return AScore
        }
        else {

            await db.ref(`matches/${matchID}/isACurrentlyServing`).set(true)
            let newScoreA = await AddPoint(matchID, gameNumber, "A")
            if (isDoubles) {
                if (newScoreA % 2 === 0) {
                    await db.ref(`matches/${matchID}/isSecondServer`).set(false)
                }
                else {
                    await db.ref(`matches/${matchID}/isSecondServer`).set(true)
                }
            }
            else {
                await db.ref(`matches/${matchID}/isSecondServer`).set(false)
            }

            return newScoreA
        }



    }
    else {
        if (isACurrentlyServing) {
            return await AddPoint(matchID, gameNumber, "A")
        }
        else {
            if (isDoubles) {
                if (isSecondServer) {
                    await Promise.all([
                        db.ref(`matches/${matchID}/isACurrentlyServing`).set(true),
                        db.ref(`matches/${matchID}/isSecondServer`).set(false),
                    ])

                }
                else {
                    await db.ref(`matches/${matchID}/isSecondServer`).set(true)
                }
            }
            else {
                await db.ref(`matches/${matchID}/isACurrentlyServing`).set(true)
            }

        }

    }
    return false

}
