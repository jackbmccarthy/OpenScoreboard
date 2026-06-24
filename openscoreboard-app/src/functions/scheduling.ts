import db from '../../database';
import Match from '../classes/Match';
import { updateCompetitionResultFromScheduledMatch } from './competitions';
import { getCombinedPlayerNames } from './players';
import { recordTeamMatchPlayerResult } from './teammatches';

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
        isTeamMatch: isTeamMatch || !!options?.teamMatchID,
        scoringType,
        sportName,
        competitionID: item.competitionID || options?.competitionID || "",
        competitionTeamTie: options?.competitionTeamTie === true,
        teamMatchID: options?.teamMatchID || "",
        teamMatchScheduledMatchID: item.teamMatchScheduledMatchID || options?.teamMatchScheduledMatchID || "",
        teamMatchTableNumber: item.tableNumber || "",
        teamNameA: item.teamNameA || "",
        teamNameB: item.teamNameB || "",
        lineupPending: item.lineupPending === true,
        teamTieRuleID: item.teamTieRuleID || "",
        teamTieSideAOptions: item.teamTieSideAOptions || [],
        teamTieSideBOptions: item.teamTieSideBOptions || [],
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
        eventName: item.eventName || "",
        formatName: item.formatName || options?.formatName || "",
        groupID: item.groupID || "",
        isDoubles: item.isDoubles === true,
        matchID,
        matchRound: item.matchRound || "",
        order: item.order || 0,
        playerA: playerNames.a,
        playerAID: item.playerAID || "",
        playerA2ID: item.playerA2ID || "",
        playerB: playerNames.b,
        playerBID: item.playerBID || "",
        playerB2ID: item.playerB2ID || "",
        pointsToWinGame: match.pointsToWinGame || 11,
        queuePosition: item.queuePosition,
        roundMatchIndex: item.roundMatchIndex || "",
        roundNumber: item.roundNumber || "",
        scheduledOn: new Date().toISOString(),
        scoringType: match.scoringType || "",
        sourceID: options?.sourceID || "",
        sourceTitle: options?.sourceTitle || "",
        sourceType: options?.sourceType || "",
        sportName: match.sportName || "",
        startTime: item.startTime || "",
        status: "scheduled",
        tableNumber: item.tableNumber || "",
        teamMatchID: options?.teamMatchID || "",
        teamNameA: item.teamNameA || "",
        teamNameB: item.teamNameB || "",
        competitionTeamTie: options?.competitionTeamTie === true,
        lineupPending: item.lineupPending === true,
        teamTieCheckpoint: item.teamTieCheckpoint || "",
        teamTieRuleID: item.teamTieRuleID || "",
        teamTieSideAOptions: item.teamTieSideAOptions || [],
        teamTieSideBOptions: item.teamTieSideBOptions || [],
        teamTieSideACodes: item.teamTieSideACodes || [],
        teamTieSideBCodes: item.teamTieSideBCodes || [],
    });
}

async function reserveTableQueuePosition(tableID) {
    const queuePositionRef = db.ref(`tables/${tableID}/nextQueuePosition`);
    const transactionResult = await queuePositionRef.transaction((currentPosition) => {
        return (Number(currentPosition) || 0) + 1;
    });
    return Number(transactionResult.snapshot.val()) || Date.now();
}

async function createScheduledMatches(targetPath, items, options: any = {}) {
    const scheduledMatches = [];

    for (const item of items) {
        const scheduledItem = options?.sourceType === "table" ?
            { ...item, queuePosition: item.queuePosition || await reserveTableQueuePosition(options.sourceID) }
            : item;
        const match = buildScheduledMatch(scheduledItem, options);
        const matchRef = await db.ref("matches").push(match);
        const summary = buildScheduledSummary(matchRef.key, match, scheduledItem, options);
        const scheduledRef = await db.ref(`${targetPath}/scheduledMatches`).push(summary);
        if (options?.teamMatchID) {
            await db.ref(`matches/${matchRef.key}`).update({
                teamMatchScheduledMatchID: scheduledRef.key,
            });
        }
        scheduledMatches.push([scheduledRef.key, summary]);
    }

    return scheduledMatches;
}

export async function createScheduledMatchesForTable(tableID, items, options = {}) {
    return createScheduledMatches(`tables/${tableID}`, items, {
        ...options,
        sourceID: tableID,
        sourceType: "table",
    });
}

export async function createScheduledMatchesForTeamMatch(teamMatchID, items, options = {}) {
    return createScheduledMatches(`teamMatches/${teamMatchID}`, items, {
        ...options,
        sourceID: teamMatchID,
        sourceType: "teamMatch",
        teamMatchID,
    });
}

function getParentTeamSchedule(scheduledMatch, sourceType, sourceID, scheduledMatchID) {
    const teamMatchID = scheduledMatch?.teamMatchID || (sourceType === "teamMatch" ? sourceID : "");
    const teamMatchScheduledMatchID = scheduledMatch?.teamMatchScheduledMatchID ||
        (sourceType === "teamMatch" ? scheduledMatchID : "");

    return {
        teamMatchID,
        teamMatchScheduledMatchID,
    };
}

async function mirrorParentTeamSchedule(scheduledMatch, sourceType, sourceID, scheduledMatchID, updates) {
    const parentSchedule = getParentTeamSchedule(scheduledMatch, sourceType, sourceID, scheduledMatchID);
    if (
        !parentSchedule.teamMatchID ||
        !parentSchedule.teamMatchScheduledMatchID ||
        (sourceType === "teamMatch" &&
            parentSchedule.teamMatchID === sourceID &&
            parentSchedule.teamMatchScheduledMatchID === scheduledMatchID)
    ) {
        return;
    }

    await db.ref(
        `teamMatches/${parentSchedule.teamMatchID}/scheduledMatches/${parentSchedule.teamMatchScheduledMatchID}`
    ).update(updates);
}

async function recordCompletedTeamMatchResult(scheduledMatch, sourceType, sourceID, scheduledMatchID, matchID, AScore, BScore) {
    const parentSchedule = getParentTeamSchedule(scheduledMatch, sourceType, sourceID, scheduledMatchID);
    if (!parentSchedule.teamMatchID || !matchID || Number(AScore) === Number(BScore)) {
        return;
    }

    const recordedResult = await recordTeamMatchPlayerResult(
        parentSchedule.teamMatchID,
        matchID,
        Number(AScore) > Number(BScore) ? "A" : "B"
    );
    if (recordedResult) {
        if (scheduledMatch?.teamTieRuleID) {
            await db.ref(
                `teamMatches/${parentSchedule.teamMatchID}/completedRuleIDs/${scheduledMatch.teamTieRuleID}`
            ).set(true);
        }
        const teamMatchSnapshot = await db.ref(`teamMatches/${parentSchedule.teamMatchID}`).get();
        const teamMatch = teamMatchSnapshot.val() || {};
        const gamesToWin = Number(teamMatch.teamTieFormat?.gamesToWin) || Number.MAX_SAFE_INTEGER;
        if (Number(teamMatch.teamAScore) >= gamesToWin || Number(teamMatch.teamBScore) >= gamesToWin) {
            const cancelledOn = new Date().toISOString();
            const remainingSchedules = Object.entries(teamMatch.scheduledMatches || {})
                .filter(([, nextScheduledMatch]: any) => {
                    return nextScheduledMatch?.status !== "active" &&
                        nextScheduledMatch?.status !== "complete" &&
                        nextScheduledMatch?.status !== "cancelled" &&
                        nextScheduledMatch?.isComplete !== true;
                });
            for (const [nextScheduledMatchID, nextScheduledMatch]: any of remainingSchedules) {
                await Promise.all([
                    ...Object.values(nextScheduledMatch.tableAssignments || {}).map((assignment: any) => {
                        return assignment?.tableID && assignment?.scheduledMatchID ?
                            db.ref(`tables/${assignment.tableID}/scheduledMatches/${assignment.scheduledMatchID}`).remove()
                            : Promise.resolve();
                    }),
                    db.ref(
                        `teamMatches/${parentSchedule.teamMatchID}/scheduledMatches/${nextScheduledMatchID}`
                    ).update({
                        cancelledOn,
                        isActive: false,
                        status: "cancelled",
                    }),
                ]);
            }
        }
        try {
            const {
                advanceTeamTieLineupCheckpointFromProgress,
                syncCompetitionFromTeamMatch,
            } = await import('./teamCompetitions');
            await advanceTeamTieLineupCheckpointFromProgress(parentSchedule.teamMatchID);
            await syncCompetitionFromTeamMatch(parentSchedule.teamMatchID);
        }
        catch (error) {
            console.error("[scheduling] unable to sync competition team tie result", error);
        }
    }
}

function normalizeTableSelections(tableSelections: any[] = []) {
    return tableSelections.reduce((selections, tableSelection) => {
        const tableID = typeof tableSelection === "string" ? tableSelection : tableSelection?.tableID;
        if (tableID && !selections.some((selection) => selection.tableID === tableID)) {
            selections.push({
                tableID,
                tableName: typeof tableSelection === "string" ? "Table" : tableSelection?.tableName || "Table",
            });
        }
        return selections;
    }, []);
}

export async function assignTeamTieScheduledMatchToTables(
    teamMatchID,
    teamMatchScheduledMatchID,
    tableSelections: any[] = []
) {
    const selectedTables = normalizeTableSelections(tableSelections);
    if (!teamMatchID || !teamMatchScheduledMatchID || selectedTables.length === 0) {
        throw new Error("Choose a team tie match and at least one table before scheduling.");
    }

    const scheduledMatchRef = db.ref(
        `teamMatches/${teamMatchID}/scheduledMatches/${teamMatchScheduledMatchID}`
    );
    const scheduledMatchSnapshot = await scheduledMatchRef.get();
    const scheduledMatch = scheduledMatchSnapshot.val() || {};
    if (!scheduledMatch.matchID) {
        throw new Error("The team tie match is missing its scoring match.");
    }
    if (scheduledMatch.isComplete === true || scheduledMatch.status === "complete" || scheduledMatch.status === "resolved") {
        throw new Error("Completed team tie matches cannot be sent to a table.");
    }
    if (scheduledMatch.status === "active") {
        throw new Error("An active team tie match cannot be moved to another table.");
    }

    const currentAssignments = scheduledMatch.tableAssignments || {};
    const nextAssignments = {};
    const selectedTableIDs = new Set(selectedTables.map(({ tableID }) => tableID));
    const removedAssignments = Object.entries(currentAssignments)
        .filter(([tableID]) => !selectedTableIDs.has(tableID));

    await Promise.all(removedAssignments.map(([tableID, assignment]: any) => {
        return assignment?.scheduledMatchID ?
            db.ref(`tables/${assignment.tableID || tableID}/scheduledMatches/${assignment.scheduledMatchID}`).remove()
            : Promise.resolve();
    }));

    for (const { tableID, tableName } of selectedTables) {
        const currentAssignment = currentAssignments[tableID] || {};
        let tableScheduledMatchID = currentAssignment.scheduledMatchID || "";
        const queuePosition = currentAssignment.queuePosition ||
            await reserveTableQueuePosition(tableID);
        const tableSummary = removeUndefined({
            ...scheduledMatch,
            assignedTableID: tableID,
            assignedTableName: tableName,
            assignedTableQueuePosition: queuePosition,
            assignedTableScheduledMatchID: tableScheduledMatchID,
            claim: undefined,
            competitionTeamTie: true,
            isActive: false,
            queuePosition,
            sharedTeamTieSchedule: true,
            sourceID: tableID,
            sourceTitle: tableName,
            sourceType: "table",
            status: "scheduled",
            teamMatchID,
            teamMatchScheduledMatchID,
        });

        if (tableScheduledMatchID) {
            await db.ref(`tables/${tableID}/scheduledMatches/${tableScheduledMatchID}`).set(tableSummary);
        }
        else {
            const tableScheduledRef = await db.ref(`tables/${tableID}/scheduledMatches`).push(tableSummary);
            tableScheduledMatchID = tableScheduledRef.key;
            await tableScheduledRef.update({
                assignedTableScheduledMatchID: tableScheduledMatchID,
            });
        }

        nextAssignments[tableID] = {
            queuePosition,
            scheduledMatchID: tableScheduledMatchID,
            tableID,
            tableName,
        };
    }

    const firstAssignment: any = Object.values(nextAssignments)[0] || {};
    await Promise.all([
        scheduledMatchRef.update({
            assignedTableID: selectedTables.length === 1 ? firstAssignment.tableID || "" : "",
            assignedTableName: selectedTables.length === 1 ? firstAssignment.tableName || "" : "",
            assignedTableQueuePosition: selectedTables.length === 1 ? firstAssignment.queuePosition || null : null,
            assignedTableScheduledMatchID: selectedTables.length === 1 ? firstAssignment.scheduledMatchID || "" : "",
            competitionTeamTie: true,
            sharedTeamTieSchedule: true,
            status: "scheduled",
            tableAssignments: nextAssignments,
        }),
        db.ref(`matches/${scheduledMatch.matchID}`).update({
            competitionID: scheduledMatch.competitionID || "",
            competitionTeamTie: true,
            teamMatchID,
            teamMatchScheduledMatchID,
            teamMatchTableNumber: scheduledMatch.tableNumber || "",
        }),
    ]);

    return nextAssignments;
}

export async function assignTeamTieScheduledMatchToTable(teamMatchID, teamMatchScheduledMatchID, tableID, tableName = "") {
    const assignments = await assignTeamTieScheduledMatchToTables(teamMatchID, teamMatchScheduledMatchID, [{
        tableID,
        tableName,
    }]);
    return assignments?.[tableID]?.scheduledMatchID || "";
}

export async function assignTeamTieScheduledMatchesToTables(
    teamMatchID,
    teamMatchScheduledMatchIDs: string[] = [],
    tableSelections: any[] = []
) {
    const assignments = {};
    for (const scheduledMatchID of teamMatchScheduledMatchIDs) {
        assignments[scheduledMatchID] = await assignTeamTieScheduledMatchToTables(
            teamMatchID,
            scheduledMatchID,
            tableSelections
        );
    }
    return assignments;
}

export async function hydrateTeamTieScheduledMatch(teamMatchID, teamMatchScheduledMatchID, item, options: any = {}) {
    const scheduledMatchRef = db.ref(
        `teamMatches/${teamMatchID}/scheduledMatches/${teamMatchScheduledMatchID}`
    );
    const scheduledMatchSnapshot = await scheduledMatchRef.get();
    const scheduledMatch = scheduledMatchSnapshot.val() || {};
    if (!scheduledMatch.matchID) {
        throw new Error("The team tie match is missing its scoring match.");
    }

    const hydratedMatch = buildScheduledMatch({
        ...scheduledMatch,
        ...item,
        lineupPending: false,
        teamMatchScheduledMatchID,
    }, {
        ...options,
        competitionTeamTie: true,
        sourceID: teamMatchID,
        sourceType: "teamMatch",
        teamMatchID,
    });
    const hydratedSummary = buildScheduledSummary(
        scheduledMatch.matchID,
        hydratedMatch,
        {
            ...scheduledMatch,
            ...item,
            lineupPending: false,
        },
        {
            ...options,
            competitionTeamTie: true,
            sourceID: teamMatchID,
            sourceType: "teamMatch",
            teamMatchID,
        }
    );
    const summaryUpdates = removeUndefined({
        ...hydratedSummary,
        scheduledOn: scheduledMatch.scheduledOn || hydratedSummary.scheduledOn,
        sharedTeamTieSchedule: scheduledMatch.sharedTeamTieSchedule === true,
        tableAssignments: scheduledMatch.tableAssignments || {},
    });

    await Promise.all([
        db.ref(`matches/${scheduledMatch.matchID}`).update({
            ...hydratedMatch,
            teamMatchScheduledMatchID,
        }),
        scheduledMatchRef.update(summaryUpdates),
        ...Object.values(scheduledMatch.tableAssignments || {}).map((assignment: any) => {
            if (!assignment?.tableID || !assignment?.scheduledMatchID) {
                return Promise.resolve();
            }
            return db.ref(
                `tables/${assignment.tableID}/scheduledMatches/${assignment.scheduledMatchID}`
            ).update({
                ...summaryUpdates,
                assignedTableID: assignment.tableID,
                assignedTableName: assignment.tableName || "Table",
                assignedTableQueuePosition: assignment.queuePosition,
                assignedTableScheduledMatchID: assignment.scheduledMatchID,
                queuePosition: assignment.queuePosition,
                sourceID: assignment.tableID,
                sourceTitle: assignment.tableName || "Table",
                sourceType: "table",
                teamMatchScheduledMatchID,
            });
        }),
    ]);

    return [teamMatchScheduledMatchID, summaryUpdates];
}

export async function moveScheduledTableMatch(tableID, scheduledMatchID, direction) {
    if (!tableID || !scheduledMatchID || (direction !== "up" && direction !== "down")) {
        return;
    }

    const scheduledMatchesSnapshot = await db.ref(`tables/${tableID}/scheduledMatches`).get();
    const scheduledMatches = Object.entries(scheduledMatchesSnapshot.val() || {})
        .filter(([, match]: any) => {
            return match?.isComplete !== true &&
                match?.status !== "active" &&
                match?.status !== "complete" &&
                match?.status !== "resolved";
        })
        .sort((firstMatch: any, secondMatch: any) => {
            const firstPosition = Number(firstMatch?.[1]?.queuePosition);
            const secondPosition = Number(secondMatch?.[1]?.queuePosition);
            if (Number.isFinite(firstPosition) && Number.isFinite(secondPosition) && firstPosition !== secondPosition) {
                return firstPosition - secondPosition;
            }
            return `${firstMatch?.[0] || ""}`.localeCompare(`${secondMatch?.[0] || ""}`);
        });
    const currentIndex = scheduledMatches.findIndex(([nextScheduledMatchID]) => nextScheduledMatchID === scheduledMatchID);
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= scheduledMatches.length) {
        return;
    }

    const currentMatch: any = scheduledMatches[currentIndex];
    const targetMatch: any = scheduledMatches[targetIndex];
    const currentPosition = Number(currentMatch?.[1]?.queuePosition) || currentIndex + 1;
    const targetPosition = Number(targetMatch?.[1]?.queuePosition) || targetIndex + 1;
    const reorderWrites: any[] = [
        db.ref(`tables/${tableID}/scheduledMatches/${currentMatch[0]}/queuePosition`).set(targetPosition),
        db.ref(`tables/${tableID}/scheduledMatches/${targetMatch[0]}/queuePosition`).set(currentPosition),
    ];
    if (currentMatch?.[1]?.teamMatchID && currentMatch?.[1]?.teamMatchScheduledMatchID) {
        reorderWrites.push(
            db.ref(
                `teamMatches/${currentMatch[1].teamMatchID}/scheduledMatches/${currentMatch[1].teamMatchScheduledMatchID}/assignedTableQueuePosition`
            ).set(targetPosition)
        );
        if (currentMatch?.[1]?.sharedTeamTieSchedule === true) {
            reorderWrites.push(
                db.ref(
                    `teamMatches/${currentMatch[1].teamMatchID}/scheduledMatches/${currentMatch[1].teamMatchScheduledMatchID}/tableAssignments/${tableID}/queuePosition`
                ).set(targetPosition)
            );
        }
    }
    if (targetMatch?.[1]?.teamMatchID && targetMatch?.[1]?.teamMatchScheduledMatchID) {
        reorderWrites.push(
            db.ref(
                `teamMatches/${targetMatch[1].teamMatchID}/scheduledMatches/${targetMatch[1].teamMatchScheduledMatchID}/assignedTableQueuePosition`
            ).set(currentPosition)
        );
        if (targetMatch?.[1]?.sharedTeamTieSchedule === true) {
            reorderWrites.push(
                db.ref(
                    `teamMatches/${targetMatch[1].teamMatchID}/scheduledMatches/${targetMatch[1].teamMatchScheduledMatchID}/tableAssignments/${tableID}/queuePosition`
                ).set(currentPosition)
            );
        }
    }
    await Promise.all(reorderWrites);
}

export async function getScheduledTeamMatchMatches(teamMatchID, options: any = {}) {
    const scheduledMatchesSnapshot = await db.ref(`teamMatches/${teamMatchID}/scheduledMatches`).get();
    const scheduledMatches = scheduledMatchesSnapshot.val();

    if (scheduledMatches && typeof scheduledMatches === "object") {
        const matches = Object.entries(scheduledMatches);
        return options.pendingOnly === true ?
            matches.filter(([, match]: any) => {
                return match?.status !== "cancelled" &&
                    match?.status !== "complete" &&
                    match?.status !== "resolved";
            })
            : matches;
    }

    return [];
}

async function claimSharedTeamTieScheduledMatch(scheduledMatch, tableID, tableScheduledMatchID) {
    if (
        !scheduledMatch?.sharedTeamTieSchedule ||
        !scheduledMatch?.teamMatchID ||
        !scheduledMatch?.teamMatchScheduledMatchID
    ) {
        return null;
    }
    if (
        scheduledMatch.lineupPending === true ||
        !`${scheduledMatch.playerA || ""}`.trim() ||
        !`${scheduledMatch.playerB || ""}`.trim()
    ) {
        throw new Error("This team match is waiting for both teams to select their players.");
    }

    const canonicalSchedulePath =
        `teamMatches/${scheduledMatch.teamMatchID}/scheduledMatches/${scheduledMatch.teamMatchScheduledMatchID}`;
    const canonicalScheduleRef = db.ref(canonicalSchedulePath);
    const claimRef = db.ref(`${canonicalSchedulePath}/claim`);
    const teamMatchSlotRef = db.ref(
        `teamMatches/${scheduledMatch.teamMatchID}/currentMatches/${scheduledMatch.tableNumber || "1"}`
    );
    const slotResult = await teamMatchSlotRef.transaction((currentMatchID) => {
        if (!currentMatchID || currentMatchID === scheduledMatch.matchID) {
            return scheduledMatch.matchID;
        }
        return;
    });
    if (!slotResult.committed && slotResult.snapshot?.val() !== scheduledMatch.matchID) {
        throw new Error("An earlier team match must finish before this match can use its table slot.");
    }
    const claim = {
        claimedOn: new Date().toISOString(),
        tableID,
        tableScheduledMatchID,
    };
    const result = await claimRef.transaction((currentClaim) => {
        if (currentClaim !== null && typeof currentClaim !== "undefined") {
            return;
        }
        return claim;
    });
    const currentClaim = result.snapshot?.val() || (await claimRef.get()).val();
    if (
        !result.committed &&
        (
            currentClaim?.tableID !== tableID ||
            currentClaim?.tableScheduledMatchID !== tableScheduledMatchID
        )
    ) {
        throw new Error("This match was already started on another table.");
    }

    const canonicalScheduleSnapshot = await canonicalScheduleRef.get();
    const canonicalSchedule = canonicalScheduleSnapshot.val() || {};
    const siblingAssignments = Object.values(canonicalSchedule.tableAssignments || {})
        .filter((assignment: any) => {
            return assignment?.tableID &&
                assignment?.scheduledMatchID &&
                (
                    assignment.tableID !== tableID ||
                    assignment.scheduledMatchID !== tableScheduledMatchID
                );
        });

    await Promise.all(siblingAssignments.map((assignment: any) => {
        return db.ref(
            `tables/${assignment.tableID}/scheduledMatches/${assignment.scheduledMatchID}`
        ).remove();
    }));

    return canonicalSchedule;
}

export async function setScheduledMatchToCurrentForSource(sourceType, sourceID, tableNumber, scheduledMatchID) {
    const targetPath = getScheduledTargetPath(sourceType, sourceID);
    const scheduledMatchSnapshot = await db.ref(`${targetPath}/scheduledMatches/${scheduledMatchID}`).get();
    const scheduledMatch = scheduledMatchSnapshot.val() || {};
    if (!scheduledMatch.matchID) {
        throw new Error("The scheduled match is missing its scoring match.");
    }

    const selectedOn = new Date().toISOString();
    const currentMatchPath = sourceType === "teamMatch" ?
        `${targetPath}/currentMatches/${tableNumber || scheduledMatch.tableNumber || "1"}`
        : `${targetPath}/currentMatch`;
    const scheduledUpdates = {
        isActive: true,
        selectedOn,
        status: "active",
    };
    if (sourceType === "table") {
        await claimSharedTeamTieScheduledMatch(scheduledMatch, sourceID, scheduledMatchID);
    }

    await Promise.all([
        db.ref(currentMatchPath).set(scheduledMatch.matchID),
        db.ref(`${targetPath}/scheduledMatches/${scheduledMatchID}`).update(scheduledUpdates),
        db.ref(`matches/${scheduledMatch.matchID}`).update({
            scheduledMatchID,
            scheduledSourceID: sourceID,
            scheduledSourceType: sourceType,
        }),
        ...(sourceType === "table" && scheduledMatch.teamMatchID ? [
            db.ref(
                `teamMatches/${scheduledMatch.teamMatchID}/currentMatches/${scheduledMatch.tableNumber || "1"}`
            ).set(scheduledMatch.matchID),
        ] : []),
    ]);
    await mirrorParentTeamSchedule(scheduledMatch, sourceType, sourceID, scheduledMatchID, scheduledUpdates);

    await updateCompetitionResultFromScheduledMatch(
        scheduledMatch.competitionID,
        scheduledMatch.teamMatchScheduledMatchID || scheduledMatchID,
        {
        ...scheduledMatch,
        ...scheduledUpdates,
        }
    );
}

function getScheduledTargetPath(sourceType, sourceID) {
    return sourceType === "teamMatch" ? `teamMatches/${sourceID}` : `tables/${sourceID}`;
}

export async function getScheduledMatchForSource(sourceType, sourceID, scheduledMatchID) {
    if (!sourceID || !scheduledMatchID) {
        return null;
    }

    const targetPath = getScheduledTargetPath(sourceType, sourceID);
    const scheduledMatchSnapshot = await db.ref(`${targetPath}/scheduledMatches/${scheduledMatchID}`).get();
    return scheduledMatchSnapshot.val();
}

export async function resetScheduledMatchForSource(sourceType, sourceID, scheduledMatchID, matchID = "") {
    if (!sourceID || !scheduledMatchID) {
        return "";
    }

    const targetPath = getScheduledTargetPath(sourceType, sourceID);
    const scheduledMatchSnapshot = await db.ref(`${targetPath}/scheduledMatches/${scheduledMatchID}`).get();
    const scheduledMatch = scheduledMatchSnapshot.val() || {};
    const currentMatchID = matchID || scheduledMatch.matchID || "";
    const currentMatchSnapshot = currentMatchID ? await db.ref(`matches/${currentMatchID}`).get() : null;
    const currentMatch = currentMatchSnapshot?.val() || {};
    const isSharedTeamTieSchedule = sourceType === "table" &&
        scheduledMatch.sharedTeamTieSchedule === true &&
        !!scheduledMatch.teamMatchID &&
        !!scheduledMatch.teamMatchScheduledMatchID;
    const replacementMatch = buildScheduledMatch({
        ...scheduledMatch,
        ...currentMatch,
    }, {
        competitionID: scheduledMatch.competitionID || "",
        competitionType: scheduledMatch.competitionType || "",
        scoringType: currentMatch.scoringType || scheduledMatch.scoringType || "normal",
        sourceID,
        sourceType,
        sportName: currentMatch.sportName || scheduledMatch.sportName || "tableTennis",
        competitionTeamTie: scheduledMatch.competitionTeamTie === true,
        teamMatchID: scheduledMatch.teamMatchID || (sourceType === "teamMatch" ? sourceID : ""),
    });
    const replacementMatchRef = isSharedTeamTieSchedule ?
        db.ref(`matches/${currentMatchID}`) :
        await db.ref("matches").push(replacementMatch);
    if (isSharedTeamTieSchedule) {
        await replacementMatchRef.set(replacementMatch);
    }
    const replacementMatchID = isSharedTeamTieSchedule ? currentMatchID : replacementMatchRef.key;
    const updates = {
        AScore: 0,
        BScore: 0,
        completedOn: null,
        defaultWinner: null,
        gameScores: [],
        isActive: false,
        isComplete: false,
        matchID: replacementMatchID,
        resultMode: null,
        scoreUpdatedOn: null,
        selectedOn: null,
        status: "scheduled",
    };

    await db.ref(`${targetPath}/scheduledMatches/${scheduledMatchID}`).update(updates);
    const canonicalSchedulePath = isSharedTeamTieSchedule ?
        `teamMatches/${scheduledMatch.teamMatchID}/scheduledMatches/${scheduledMatch.teamMatchScheduledMatchID}`
        : "";
    if (isSharedTeamTieSchedule) {
        await db.ref(`${canonicalSchedulePath}/claim`).remove();
    }
    await mirrorParentTeamSchedule(scheduledMatch, sourceType, sourceID, scheduledMatchID, updates);
    if (isSharedTeamTieSchedule) {
        const canonicalScheduleSnapshot = await db.ref(canonicalSchedulePath).get();
        const canonicalSchedule = canonicalScheduleSnapshot.val() || {};
        await Promise.all(Object.values(canonicalSchedule.tableAssignments || {}).map((assignment: any) => {
            if (!assignment?.tableID || !assignment?.scheduledMatchID || assignment.tableID === sourceID) {
                return Promise.resolve();
            }
            return db.ref(
                `tables/${assignment.tableID}/scheduledMatches/${assignment.scheduledMatchID}`
            ).set(removeUndefined({
                ...canonicalSchedule,
                ...updates,
                assignedTableID: assignment.tableID,
                assignedTableName: assignment.tableName || "Table",
                assignedTableQueuePosition: assignment.queuePosition,
                assignedTableScheduledMatchID: assignment.scheduledMatchID,
                claim: undefined,
                queuePosition: assignment.queuePosition,
                sourceID: assignment.tableID,
                sourceTitle: assignment.tableName || "Table",
                sourceType: "table",
            }));
        }));
    }
    await updateCompetitionResultFromScheduledMatch(
        scheduledMatch.competitionID,
        scheduledMatch.teamMatchScheduledMatchID || scheduledMatchID,
        {
            ...scheduledMatch,
            ...updates,
        }
    );

    return replacementMatchID;
}

export async function deleteScheduledMatchForSource(sourceType, sourceID, scheduledMatchID, options: any = {}) {
    const targetPath = getScheduledTargetPath(sourceType, sourceID);
    const scheduledMatchSnapshot = await db.ref(`${targetPath}/scheduledMatches/${scheduledMatchID}`).get();
    const scheduledMatch = scheduledMatchSnapshot.val();
    await db.ref(`${targetPath}/scheduledMatches/${scheduledMatchID}`).remove();

    if (options.clearCurrentMatch === true && sourceType === "table" && scheduledMatch?.matchID) {
        const currentMatchSnapshot = await db.ref(`tables/${sourceID}/currentMatch`).get();

        if (currentMatchSnapshot.val() === scheduledMatch.matchID) {
            await db.ref(`tables/${sourceID}/currentMatch`).remove();
        }
    }
}

export async function resolveScheduledMatchForSource(sourceType, sourceID, scheduledMatchID) {
    if (!sourceID || !scheduledMatchID) {
        return;
    }

    const targetPath = getScheduledTargetPath(sourceType, sourceID);
    const scheduledMatchSnapshot = await db.ref(`${targetPath}/scheduledMatches/${scheduledMatchID}`).get();
    const scheduledMatch = scheduledMatchSnapshot.val() || {};
    const resolvedOn = new Date().toISOString();

    await db.ref(`${targetPath}/scheduledMatches/${scheduledMatchID}`).update({
        isActive: false,
        resolvedOn,
        status: "resolved",
    });
    await mirrorParentTeamSchedule(scheduledMatch, sourceType, sourceID, scheduledMatchID, {
        isActive: false,
        resolvedOn,
        status: "resolved",
    });

    if (sourceType === "table" && scheduledMatch.matchID) {
        const currentMatchSnapshot = await db.ref(`tables/${sourceID}/currentMatch`).get();

        if (currentMatchSnapshot.val() === scheduledMatch.matchID) {
            await db.ref(`tables/${sourceID}/currentMatch`).remove();
        }
    }
}

export async function updateScheduledMatchScoresForSource(sourceType, sourceID, scheduledMatchID, matchID, AScore, BScore, options: any = {}) {
    const targetPath = getScheduledTargetPath(sourceType, sourceID);
    const scheduledMatchSnapshot = await db.ref(`${targetPath}/scheduledMatches/${scheduledMatchID}`).get();
    const existingScheduledMatch = scheduledMatchSnapshot.val() || {};
    const cleanAScore = Number.isNaN(parseInt(`${AScore}`, 10)) ? 0 : Math.max(0, parseInt(`${AScore}`, 10));
    const cleanBScore = Number.isNaN(parseInt(`${BScore}`, 10)) ? 0 : Math.max(0, parseInt(`${BScore}`, 10));
    const timestamp = new Date().toISOString();
    const isComplete = options?.isComplete === true || existingScheduledMatch.isComplete === true;
    const updates = {
        AScore: cleanAScore,
        BScore: cleanBScore,
        ...(isComplete ? { completedOn: existingScheduledMatch.completedOn || timestamp, isComplete: true, resultMode: options?.resultMode || existingScheduledMatch.resultMode || "scored" } : {}),
        ...(Array.isArray(options?.gameScores) ? { gameScores: options.gameScores } : {}),
        isActive: !isComplete,
        scoreUpdatedOn: timestamp,
        status: isComplete ? "complete" : "active",
    };

    await db.ref(`${targetPath}/scheduledMatches/${scheduledMatchID}`).update(updates);
    await mirrorParentTeamSchedule(existingScheduledMatch, sourceType, sourceID, scheduledMatchID, updates);

    if (matchID) {
        await db.ref(`matches/${matchID}`).update({
            manualScheduleIsComplete: isComplete,
            manualScheduleAScore: cleanAScore,
            manualScheduleBScore: cleanBScore,
            manualScheduleScoreUpdatedOn: updates.scoreUpdatedOn,
        });
    }

    await updateCompetitionResultFromScheduledMatch(
        existingScheduledMatch.competitionID,
        existingScheduledMatch.teamMatchScheduledMatchID || scheduledMatchID,
        {
            ...existingScheduledMatch,
            ...updates,
        }
    );
    if (isComplete) {
        await recordCompletedTeamMatchResult(
            existingScheduledMatch,
            sourceType,
            sourceID,
            scheduledMatchID,
            matchID || existingScheduledMatch.matchID,
            cleanAScore,
            cleanBScore
        );
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
        isActive: false,
        isComplete: true,
        resultMode: result?.resultMode || "games",
        scoreUpdatedOn: timestamp,
        status: "complete",
    };

    await db.ref(`${targetPath}/scheduledMatches/${scheduledMatchID}`).update(updates);
    await mirrorParentTeamSchedule(existingScheduledMatch, sourceType, sourceID, scheduledMatchID, updates);

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

    await updateCompetitionResultFromScheduledMatch(
        existingScheduledMatch.competitionID,
        existingScheduledMatch.teamMatchScheduledMatchID || scheduledMatchID,
        {
            ...existingScheduledMatch,
            ...updates,
        }
    );
    await recordCompletedTeamMatchResult(
        existingScheduledMatch,
        sourceType,
        sourceID,
        scheduledMatchID,
        matchID || existingScheduledMatch.matchID,
        cleanAScore,
        cleanBScore
    );

    return updates;
}
