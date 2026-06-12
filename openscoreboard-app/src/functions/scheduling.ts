import db from '../../database';
import Match from '../classes/Match';
import { updateCompetitionResultFromScheduledMatch } from './competitions';
import { getCombinedPlayerNames } from './players';

function removeUndefined(value) {
    if (Array.isArray(value)) {
        return value.map(removeUndefined);
    }

    if (value && typeof value === "object") {
        return Object.entries(value).reduce((cleanedValue, [key, nextValue]) => {
            if (typeof nextValue !== "undefined") {
                cleanedValue[key] = removeUndefined(nextValue);
            }
            return cleanedValue;
        }, {});
    }

    return value;
}

function buildScheduledMatch(item, options) {
    const sportName = options?.sportName || item?.sportName || "tableTennis";
    const scoringType = options?.scoringType || item?.scoringType || "normal";
    const isTeamMatch = options?.sourceType === "teamMatch";
    const match = new Match().createNew(sportName, null, isTeamMatch, scoringType);

    return removeUndefined({
        ...match,
        ...(typeof item.bestOf !== "undefined" ? { bestOf: item.bestOf } : {}),
        ...(typeof item.eventName !== "undefined" ? { eventName: item.eventName } : {}),
        ...(typeof item.isDoubles !== "undefined" ? { isDoubles: item.isDoubles === true } : {}),
        ...(typeof item.matchRound !== "undefined" ? { matchRound: item.matchRound || "" } : {}),
        ...(typeof item.playerA !== "undefined" ? { playerA: item.playerA } : {}),
        ...(typeof item.playerA2 !== "undefined" ? { playerA2: item.playerA2 } : {}),
        ...(typeof item.playerB !== "undefined" ? { playerB: item.playerB } : {}),
        ...(typeof item.playerB2 !== "undefined" ? { playerB2: item.playerB2 } : {}),
        scoringType,
        sportName,
        teamMatchID: options?.teamMatchID || "",
        teamNameA: item.teamNameA || "",
        teamNameB: item.teamNameB || "",
    });
}

function buildScheduledSummary(matchID, match, item, options) {
    const playerNames = getCombinedPlayerNames(match.playerA, match.playerB, match.playerA2, match.playerB2);

    return removeUndefined({
        AScore: 0,
        BScore: 0,
        bestOf: match.bestOf || 5,
        bracketRoundIndex: item.bracketRoundIndex,
        bracketSeedIndex: item.bracketSeedIndex,
        competitionID: item.competitionID || options?.competitionID || "",
        competitionSlotID: item.competitionSlotID || "",
        competitionType: item.competitionType || options?.competitionType || "",
        enforceGameScore: match.enforceGameScore,
        formatName: item.formatName || options?.formatName || "",
        groupID: item.groupID || "",
        matchID,
        matchRound: item.matchRound || "",
        order: item.order || 0,
        playerA: playerNames.a,
        playerB: playerNames.b,
        pointsToWinGame: match.pointsToWinGame || 11,
        scheduledOn: new Date().toISOString(),
        scoringType: match.scoringType || "",
        sourceType: options?.sourceType || "",
        sportName: match.sportName || "",
        startTime: item.startTime || "",
        tableNumber: item.tableNumber || "",
        teamNameA: item.teamNameA || "",
        teamNameB: item.teamNameB || "",
    });
}

async function createScheduledMatches(targetPath, items, options = {}) {
    const scheduledMatches = [];

    for (const item of items) {
        const match = buildScheduledMatch(item, options);
        const matchRef = await db.ref("matches").push(match);
        const summary = buildScheduledSummary(matchRef.key, match, item, options);
        const scheduledRef = await db.ref(`${targetPath}/scheduledMatches`).push(summary);
        scheduledMatches.push([scheduledRef.key, summary]);
    }

    return scheduledMatches;
}

export async function createScheduledMatchesForTable(tableID, items, options = {}) {
    return createScheduledMatches(`tables/${tableID}`, items, {
        ...options,
        sourceType: "table",
    });
}

export async function createScheduledMatchesForTeamMatch(teamMatchID, items, options = {}) {
    return createScheduledMatches(`teamMatches/${teamMatchID}`, items, {
        ...options,
        sourceType: "teamMatch",
        teamMatchID,
    });
}

export async function getScheduledTeamMatchMatches(teamMatchID) {
    const scheduledMatchesSnapshot = await db.ref(`teamMatches/${teamMatchID}/scheduledMatches`).get();
    const scheduledMatches = scheduledMatchesSnapshot.val();

    if (scheduledMatches && typeof scheduledMatches === "object") {
        return Object.entries(scheduledMatches);
    }

    return [];
}

function getScheduledTargetPath(sourceType, sourceID) {
    return sourceType === "teamMatch" ? `teamMatches/${sourceID}` : `tables/${sourceID}`;
}

export async function deleteScheduledMatchForSource(sourceType, sourceID, scheduledMatchID) {
    const targetPath = getScheduledTargetPath(sourceType, sourceID);
    await db.ref(`${targetPath}/scheduledMatches/${scheduledMatchID}`).remove();
}

export async function updateScheduledMatchScoresForSource(sourceType, sourceID, scheduledMatchID, matchID, AScore, BScore) {
    const targetPath = getScheduledTargetPath(sourceType, sourceID);
    const cleanAScore = Number.isNaN(parseInt(`${AScore}`, 10)) ? 0 : Math.max(0, parseInt(`${AScore}`, 10));
    const cleanBScore = Number.isNaN(parseInt(`${BScore}`, 10)) ? 0 : Math.max(0, parseInt(`${BScore}`, 10));
    const updates = {
        AScore: cleanAScore,
        BScore: cleanBScore,
        scoreUpdatedOn: new Date().toISOString(),
    };

    await db.ref(`${targetPath}/scheduledMatches/${scheduledMatchID}`).update(updates);

    if (matchID) {
        await db.ref(`matches/${matchID}`).update({
            manualScheduleAScore: cleanAScore,
            manualScheduleBScore: cleanBScore,
            manualScheduleScoreUpdatedOn: updates.scoreUpdatedOn,
        });
    }

    return updates;
}

function getGamesNeeded(bestOf) {
    const parsedBestOf = Number.isNaN(parseInt(`${bestOf}`, 10)) ? 5 : parseInt(`${bestOf}`, 10);
    return Math.floor(parsedBestOf / 2) + 1;
}

function buildGameFieldUpdates(gameScores = []) {
    const timestamp = new Date().toISOString();
    return gameScores.reduce((updates, gameScore, index) => {
        const gameNumber = index + 1;
        updates[`game${gameNumber}AScore`] = Number.isNaN(parseInt(`${gameScore.a}`, 10)) ? 0 : parseInt(`${gameScore.a}`, 10);
        updates[`game${gameNumber}BScore`] = Number.isNaN(parseInt(`${gameScore.b}`, 10)) ? 0 : parseInt(`${gameScore.b}`, 10);
        updates[`isGame${gameNumber}Started`] = true;
        updates[`isGame${gameNumber}Finished`] = true;
        updates[`game${gameNumber}StartTime`] = timestamp;
        updates[`game${gameNumber}EndTime`] = timestamp;
        return updates;
    }, {});
}

export async function finishScheduledMatchForSource(sourceType, sourceID, scheduledMatchID, matchID, result) {
    const targetPath = getScheduledTargetPath(sourceType, sourceID);
    const scheduledMatchSnapshot = await db.ref(`${targetPath}/scheduledMatches/${scheduledMatchID}`).get();
    const existingScheduledMatch = scheduledMatchSnapshot.val() || {};
    const cleanAScore = Number.isNaN(parseInt(`${result?.AScore}`, 10)) ? 0 : Math.max(0, parseInt(`${result?.AScore}`, 10));
    const cleanBScore = Number.isNaN(parseInt(`${result?.BScore}`, 10)) ? 0 : Math.max(0, parseInt(`${result?.BScore}`, 10));
    const cleanGameScores = Array.isArray(result?.gameScores) ?
        result.gameScores.map((gameScore) => ({
            a: Number.isNaN(parseInt(`${gameScore.a}`, 10)) ? 0 : Math.max(0, parseInt(`${gameScore.a}`, 10)),
            b: Number.isNaN(parseInt(`${gameScore.b}`, 10)) ? 0 : Math.max(0, parseInt(`${gameScore.b}`, 10)),
        }))
        : [];
    const timestamp = new Date().toISOString();
    const updates = {
        AScore: cleanAScore,
        BScore: cleanBScore,
        completedOn: timestamp,
        defaultWinner: result?.defaultWinner || "",
        gameScores: cleanGameScores,
        isComplete: true,
        resultMode: result?.resultMode || "games",
        scoreUpdatedOn: timestamp,
    };

    await db.ref(`${targetPath}/scheduledMatches/${scheduledMatchID}`).update(updates);

    if (matchID) {
        await db.ref(`matches/${matchID}`).update({
            ...buildGameFieldUpdates(cleanGameScores),
            isActive: false,
            isInBetweenGames: false,
            isMatchStarted: true,
            matchEndTime: timestamp,
            matchStartTime: timestamp,
            manualScheduleAScore: cleanAScore,
            manualScheduleBScore: cleanBScore,
            manualScheduleResultMode: updates.resultMode,
            manualScheduleScoreUpdatedOn: timestamp,
            showEndOfMatchOptions: false,
            showGameWonConfirmationModal: false,
            showInBetweenGamesModal: false,
            showMatchSetupWizard: false,
        });
    }

    await updateCompetitionResultFromScheduledMatch(existingScheduledMatch.competitionID, scheduledMatchID, {
        ...existingScheduledMatch,
        ...updates,
    });

    return updates;
}
