import db, { getUserPath } from '../../database';
import { supportedSports } from './sports';
import { DEFAULT_TEAM_TIE_FORMAT } from './teamTieFormats';
import { getDefaultTeamTieFormatPreset } from './teamTieFormatPresets';

export const bracketRoundConfig = [
    { name: "Round of 256", seedsCount: 128 },
    { name: "Round of 128", seedsCount: 64 },
    { name: "Round of 64", seedsCount: 32 },
    { name: "Round of 32", seedsCount: 16 },
    { name: "Round of 16", seedsCount: 8 },
    { name: "Quarterfinals", seedsCount: 4 },
    { name: "Semifinals", seedsCount: 2 },
    { name: "Final", seedsCount: 1 },
];

export function normalizeCompetitionSportName(sportName = "") {
    return supportedSports[sportName] ? sportName : "tableTennis";
}

export function getCompetitionSportLabel(sportName = "") {
    const normalizedSportName = normalizeCompetitionSportName(sportName);
    return supportedSports[normalizedSportName]?.displayName || "Table Tennis";
}

export function getSupportedCompetitionSports() {
    return Object.entries(supportedSports).map(([value, sport]: any) => ({
        label: sport.displayName || value,
        value,
    }));
}

function getTargetPath(sourceType, sourceID) {
    return sourceType === "teamMatch" ? `teamMatches/${sourceID}` : `tables/${sourceID}`;
}

function getRoundTitleForSeedCount(seedCount) {
    return bracketRoundConfig.find((round) => round.seedsCount === seedCount)?.name || `Round of ${seedCount * 2}`;
}

function getSeedCountForRound(roundName) {
    return bracketRoundConfig.find((round) => round.name === roundName)?.seedsCount || 4;
}

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

function getPlayerKey(name, index) {
    return `${index + 1}-${`${name || "TBD"}`.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

function getUniquePlayers(matches) {
    const seenNames = {};
    const players = [];

    matches.forEach((match) => {
        [match.playerA, match.playerB].forEach((playerName) => {
            const cleanName = playerName || "TBD";
            const searchName = cleanName.toLowerCase();
            if (!seenNames[searchName]) {
                seenNames[searchName] = true;
                players.push(cleanName);
            }
        });
    });

    return players;
}

function getLinkedMatches(scheduledMatches, competitionType, config: any = {}) {
    return scheduledMatches.map(([scheduledMatchID, summary], index) => {
        const slotID = summary.competitionSlotID ||
            (competitionType === "singleElimination" ? `round-0-seed-${index}` : `group-1-match-${index + 1}`);
        const sourceType = summary.sourceType || config.sourceType || "";
        const sourceID = summary.sourceID || config.sourceID || "";
        const sourceTitle = summary.sourceTitle || config.sourceTitle || "";

        return {
            ...summary,
            bracketRoundIndex: competitionType === "singleElimination" ? 0 : "",
            bracketSeedIndex: competitionType === "singleElimination" ? index : "",
            competitionSlotID: slotID,
            groupID: competitionType === "roundRobin" ? "group-1" : "",
            scheduledMatchID,
            sourceID,
            sourceTitle,
            sourceType,
            tableID: sourceType === "table" ? sourceID : "",
            tableName: sourceType === "table" ? sourceTitle : "",
        };
    });
}

function buildRoundRobinCompetition(linkedMatches, title) {
    const players = getUniquePlayers(linkedMatches).reduce((playerMap, playerName, index) => {
        playerMap[getPlayerKey(playerName, index)] = {
            losses: 0,
            playerName,
            seedPosition: index + 1,
            showInGroup: true,
            wins: 0,
        };
        return playerMap;
    }, {});
    const matches = linkedMatches.reduce((matchMap, match) => {
        matchMap[match.competitionSlotID] = {
            AScore: match.AScore || 0,
            BScore: match.BScore || 0,
            isComplete: match.isComplete === true,
            matchID: match.matchID || "",
            playerA: match.playerA || "TBD",
            playerB: match.playerB || "TBD",
            scheduledMatchID: match.scheduledMatchID,
            startTime: match.startTime || "",
        };
        return matchMap;
    }, {});

    return {
        data: {
            title,
        },
        groups: {
            "group-1": {
                groupName: "Group 1",
                matches,
                players,
                showOnBoard: true,
            },
        },
    };
}

function buildBracketCompetition(linkedMatches, title) {
    const rounds = [];
    let seedCount = Math.max(1, linkedMatches.length);

    while (seedCount >= 1) {
        const roundIndex = rounds.length;
        const seeds = Array.from({ length: seedCount }).map((_, seedIndex) => {
            const match = roundIndex === 0 ? linkedMatches[seedIndex] : null;
            return {
                AScore: match?.AScore || 0,
                BScore: match?.BScore || 0,
                id: `round-${roundIndex}-seed-${seedIndex}`,
                isComplete: match?.isComplete === true,
                matchID: match?.matchID || "",
                competitionSlotID: match?.competitionSlotID || `round-${roundIndex}-seed-${seedIndex}`,
                scheduledMatchID: match?.scheduledMatchID || "",
                sourceID: match?.sourceID || "",
                sourceTitle: match?.sourceTitle || "",
                sourceType: match?.sourceType || "",
                startTime: match?.startTime || match?.scheduledOn || "",
                tableID: match?.tableID || "",
                tableName: match?.tableName || "",
                teams: [
                    { id: match?.playerAID || "", name: match?.playerA || "TBD" },
                    { id: match?.playerBID || "", name: match?.playerB || "TBD" },
                ],
            };
        });

        rounds.push({
            seeds,
            title: getRoundTitleForSeedCount(seedCount),
        });

        seedCount = seedCount / 2;
    }

    return {
        data: {
            brackets: rounds,
            largestRound: rounds[0]?.title || "Final",
            title,
        },
    };
}

export function generateEmptyBracket(largestRound = "Quarterfinals") {
    const rounds = [];
    let seedCount = getSeedCountForRound(largestRound);

    while (seedCount >= 1) {
        const roundIndex = rounds.length;
        rounds.push({
            seeds: Array.from({ length: seedCount }).map((_, seedIndex) => ({
                AScore: 0,
                BScore: 0,
                id: `round-${roundIndex}-seed-${seedIndex}`,
                isComplete: false,
                matchID: "",
                scheduledMatchID: "",
                teams: [
                    { id: "", name: "TBD" },
                    { id: "", name: "TBD" },
                ],
            })),
            title: getRoundTitleForSeedCount(seedCount),
        });

        seedCount = seedCount / 2;
    }

    return rounds;
}

function buildEmptyRoundRobinGroups(groupCount = 1) {
    return Array.from({ length: Math.max(1, Number(groupCount) || 1) }).reduce((groupMap, _, index) => {
        groupMap[`group-${index + 1}`] = {
            groupName: `Group ${index + 1}`,
            matches: {},
            players: {},
            showOnBoard: true,
        };
        return groupMap;
    }, {});
}

export function isRoundRobinCompetitionType(type = "") {
    return type === "roundRobin" || type === "roundRobinThenSingleElimination";
}

export function isBracketCompetitionType(type = "") {
    return type === "singleElimination" || type === "roundRobinThenSingleElimination";
}

export async function createCompetition({
    groupCount = 1,
    largestRound = "Quarterfinals",
    participantType = "individual",
    sportName = "tableTennis",
    title,
    type = "singleElimination",
}: any = {}) {
    const timestamp = new Date().toISOString();
    const competitionRef = db.ref("competitions").push();
    const competitionID = competitionRef.key;
    const isCombined = type === "roundRobinThenSingleElimination";
    const hasGroups = isRoundRobinCompetitionType(type);
    const hasBracket = isBracketCompetitionType(type);
    const cleanTitle = title?.trim() || (type === "roundRobin" ? "Round Robin Group" : isCombined ? "Group Stage + Bracket" : "Bracket");
    const resolvedSportName = normalizeCompetitionSportName(sportName);
    const defaultTeamTiePreset = participantType === "team" ? await getDefaultTeamTieFormatPreset() : null;
    const competition = {
        createdOn: timestamp,
        deleted: false,
        formatName: type === "roundRobin" ? "Round robin group" : isCombined ? "Group stage + single elimination bracket" : "Single elimination bracket",
        id: competitionID,
        ownerID: getUserPath(),
        participantType: participantType === "team" ? "team" : "individual",
        scoringType: "",
        showBoard: true,
        sourceID: "",
        sourceTitle: "",
        sourceType: "",
        sportName: resolvedSportName,
        type,
        updatedOn: timestamp,
        data: {
            ...(hasBracket ? {
                brackets: generateEmptyBracket(largestRound),
                bracketDefaultBestOf: 5,
                bracketUpgradeBestOf: 7,
                bracketUpgradeRound: "",
                largestRound,
            } : {}),
            ...(hasGroups ? {
                advancementPlayersPerGroup: 2,
                advancementRankingOrder: ["wins", "losses", "pointDifferential", "pointsFor", "pointsAgainst"],
                footer: "",
                roundRobinBestOf: 5,
            } : {}),
            ...(participantType === "team" ? {
                teamTieFormat: defaultTeamTiePreset?.format || DEFAULT_TEAM_TIE_FORMAT,
                teamTieFormatPresetID: defaultTeamTiePreset?.id || "",
                teamSeedOrder: [],
            } : {}),
            title: cleanTitle,
        },
        ...(hasGroups ? {
            groups: buildEmptyRoundRobinGroups(groupCount),
        } : {}),
    };

    await competitionRef.set(competition);
    await db.ref(`users/${getUserPath()}/myCompetitions`).push({
        createdOn: timestamp,
        formatName: competition.formatName,
        id: competitionID,
        participantType: competition.participantType,
        sourceTitle: "",
        sportName: resolvedSportName,
        type: competition.type,
        title: cleanTitle,
    });

    return competition;
}

export async function createCompetitionGraphic(options = {}) {
    return createCompetition(options);
}

export async function updateCompetition(competitionID, updates: any = {}) {
    const timestamp = new Date().toISOString();
    const competitionSnapshot = await db.ref(`competitions/${competitionID}`).get();
    const competition = competitionSnapshot.val() || {};
    const userID = getUserPath();
    const cleanUpdates = removeUndefined({
        ...updates,
        ...(!competition.ownerID && userID ? { ownerID: userID } : {}),
        updatedOn: timestamp,
    });

    await db.ref(`competitions/${competitionID}`).update({
        ...cleanUpdates,
    });

    const title = updates?.data?.title;
    const sportName = updates?.sportName || updates?.data?.sportName;
    if (title || sportName) {
        const myCompetitionsSnapshot = await db.ref(`users/${getUserPath()}/myCompetitions`).get();
        const myCompetitions = myCompetitionsSnapshot.val() || {};
        const matchingEntry = Object.entries(myCompetitions).find(([, value]: any) => value?.id === competitionID);

        if (matchingEntry) {
            await db.ref(`users/${getUserPath()}/myCompetitions/${matchingEntry[0]}`).update(removeUndefined({
                ...(title ? { title } : {}),
                ...(sportName ? { sportName: normalizeCompetitionSportName(sportName) } : {}),
                updatedOn: timestamp,
            }));
        }
    }
}

export async function updateCompetitionGraphic(competitionID, updates = {}) {
    return updateCompetition(competitionID, updates);
}

export async function archiveCompetition(myCompetitionID, competitionID) {
    if (!myCompetitionID || !competitionID) {
        return;
    }

    const timestamp = new Date().toISOString();
    await Promise.all([
        db.ref(`competitions/${competitionID}`).update({
            archived: true,
            archivedOn: timestamp,
            updatedOn: timestamp,
        }),
        db.ref(`users/${getUserPath()}/myCompetitions/${myCompetitionID}`).update({
            archived: true,
            archivedOn: timestamp,
            updatedOn: timestamp,
        }),
    ]);
}

function collectBracketScheduledMatchAssignments(brackets = []) {
    const assignments = [];

    brackets.forEach((round: any, roundIndex) => {
        (round.seeds || []).forEach((seed: any, seedIndex) => {
            const sourceID = seed.tableID || seed.sourceID || "";
            const sourceType = seed.sourceType || "table";
            const scheduledMatchID = seed.scheduledMatchID || "";

            if (!sourceID || !scheduledMatchID) {
                return;
            }

            assignments.push({
                bracketRoundIndex: roundIndex,
                bracketSeedIndex: seedIndex,
                competitionSlotID: seed.competitionSlotID || seed.id || `round-${roundIndex}-seed-${seedIndex}`,
                scheduledMatchID,
                sourceID,
                sourceType,
            });
        });
    });

    return assignments;
}

function getAssignmentKey(assignment) {
    return [
        assignment.sourceType,
        assignment.sourceID,
        assignment.scheduledMatchID,
        assignment.competitionSlotID,
    ].join(":");
}

async function unlinkScheduledMatchFromCompetition(competitionID, assignment) {
    const scheduledMatchRef = db.ref(`${getTargetPath(assignment.sourceType, assignment.sourceID)}/scheduledMatches/${assignment.scheduledMatchID}`);
    const scheduledMatchSnapshot = await scheduledMatchRef.get();
    const scheduledMatch = scheduledMatchSnapshot.val();

    if (
        scheduledMatch?.competitionID !== competitionID ||
        scheduledMatch?.competitionSlotID !== assignment.competitionSlotID
    ) {
        return;
    }

    await scheduledMatchRef.update({
        bracketRoundIndex: null,
        bracketSeedIndex: null,
        competitionID: null,
        competitionSlotID: null,
        groupID: null,
    });
}

export async function syncCompetitionBracketScheduledMatches(competitionID, previousBrackets = [], nextBrackets = []) {
    const previousAssignments = collectBracketScheduledMatchAssignments(previousBrackets);
    const nextAssignments = collectBracketScheduledMatchAssignments(nextBrackets);
    const nextAssignmentKeys = new Set(nextAssignments.map(getAssignmentKey));

    await Promise.all([
        ...previousAssignments
            .filter((assignment) => !nextAssignmentKeys.has(getAssignmentKey(assignment)))
            .map((assignment) => unlinkScheduledMatchFromCompetition(competitionID, assignment)),
        ...nextAssignments.map((assignment) => {
            return db.ref(`${getTargetPath(assignment.sourceType, assignment.sourceID)}/scheduledMatches/${assignment.scheduledMatchID}`).update({
                bracketRoundIndex: assignment.bracketRoundIndex,
                bracketSeedIndex: assignment.bracketSeedIndex,
                competitionID,
                competitionSlotID: assignment.competitionSlotID,
                groupID: "",
            });
        }),
    ]);
}

export async function createCompetitionFromScheduledMatches(config, scheduledMatches) {
    if (!["roundRobin", "singleElimination"].includes(config?.competitionType) || scheduledMatches.length === 0) {
        return null;
    }

    const linkedMatches = getLinkedMatches(scheduledMatches, config.competitionType, config);
    const timestamp = new Date().toISOString();
    const competitionRef = db.ref("competitions").push();
    const competitionID = competitionRef.key;
    const title = config.title || `${config.formatName || "Competition"} ${new Date().toLocaleDateString()}`;
    const competitionBody = config.competitionType === "roundRobin" ?
        buildRoundRobinCompetition(linkedMatches, title)
        : buildBracketCompetition(linkedMatches, title);
    const resolvedSportName = normalizeCompetitionSportName(config.sportName || "tableTennis");
    const competition = {
        ...competitionBody,
        createdOn: timestamp,
        deleted: false,
        formatName: config.formatName || "",
        id: competitionID,
        ownerID: getUserPath(),
        scoringType: config.scoringType || "",
        showBoard: true,
        sourceID: config.sourceID || "",
        sourceTitle: config.sourceTitle || "",
        sourceType: config.sourceType || "",
        sportName: resolvedSportName,
        type: config.competitionType,
        updatedOn: timestamp,
    };

    await competitionRef.set(competition);
    await db.ref(`users/${getUserPath()}/myCompetitions`).push({
        createdOn: timestamp,
        formatName: competition.formatName,
        id: competitionID,
        sourceTitle: competition.sourceTitle,
        sportName: resolvedSportName,
        type: competition.type,
        title,
    });

    await Promise.all(linkedMatches.map((match) => {
        return db.ref(`${getTargetPath(config.sourceType, config.sourceID)}/scheduledMatches/${match.scheduledMatchID}`).update({
            bracketRoundIndex: match.bracketRoundIndex,
            bracketSeedIndex: match.bracketSeedIndex,
            competitionID,
            competitionSlotID: match.competitionSlotID,
            groupID: match.groupID,
        });
    }));

    return competition;
}

export async function getMyCompetitions(userID = getUserPath()) {
    const myCompetitionsSnapshot = await db.ref(`users/${userID}/myCompetitions`).get();
    const myCompetitions = myCompetitionsSnapshot.val();

    if (!myCompetitions || typeof myCompetitions !== "object") {
        return [];
    }

    return Promise.all(Object.entries(myCompetitions).map(async ([myCompetitionID, data]: any) => {
        const competitionID = data?.id;
        const competitionSnapshot = competitionID ? await db.ref(`competitions/${competitionID}`).get() : null;
        const competition = competitionSnapshot?.val() || {};

        return [myCompetitionID, {
            ...data,
            ...competition,
            title: competition?.data?.title || data?.title,
        }];
    }));
}

export async function getCompetition(competitionID) {
    const competitionSnapshot = await db.ref(`competitions/${competitionID}`).get();
    return competitionSnapshot.val();
}

export function subscribeToCompetition(competitionID, callback) {
    if (!competitionID) {
        return () => {};
    }

    const competitionRef = db.ref(`competitions/${competitionID}`);
    const handleCompetitionValue = (competitionSnapshot) => {
        callback(competitionSnapshot.val());
    };

    competitionRef.on("value", handleCompetitionValue);

    return () => {
        competitionRef.off("value", handleCompetitionValue);
    };
}

function recalculateRoundRobinGroup(group) {
    const players = Object.entries(group.players || {}).reduce((playerMap, [playerID, player]: any) => {
        playerMap[playerID] = {
            ...player,
            losses: 0,
            wins: 0,
        };
        return playerMap;
    }, {});

    Object.values(group.matches || {}).forEach((match: any) => {
        if (!match?.isComplete || match.AScore === match.BScore) {
            return;
        }

        const winnerID = match.AScore > match.BScore ? match.playerAID : match.playerBID;
        const loserID = match.AScore > match.BScore ? match.playerBID : match.playerAID;
        const winnerName = match.AScore > match.BScore ? match.playerA : match.playerB;
        const loserName = match.AScore > match.BScore ? match.playerB : match.playerA;
        const winnerEntry = players[winnerID] ?
            [winnerID, players[winnerID]]
            : Object.entries(players).find(([, player]: any) => player.playerName === winnerName);
        const loserEntry = players[loserID] ?
            [loserID, players[loserID]]
            : Object.entries(players).find(([, player]: any) => player.playerName === loserName);

        if (winnerEntry) {
            players[winnerEntry[0]].wins += 1;
        }

        if (loserEntry) {
            players[loserEntry[0]].losses += 1;
        }
    });

    return {
        ...group,
        players,
    };
}

function updateBracketResult(competition, scheduledMatchID, summary) {
    const brackets = [...(competition.data?.brackets || [])].map((round) => ({
        ...round,
        seeds: [...(round.seeds || [])].map((seed) => ({
            ...seed,
            teams: [...(seed.teams || [])],
        })),
    }));

    brackets.forEach((round, roundIndex) => {
        round.seeds.forEach((seed, seedIndex) => {
            if (seed.scheduledMatchID !== scheduledMatchID) {
                return;
            }

            seed.AScore = summary.AScore;
            seed.BScore = summary.BScore;
            seed.gameScores = summary.gameScores || [];
            seed.isComplete = summary.isComplete === true;
            seed.scheduledStatus = summary.status || (summary.isComplete === true ? "complete" : seed.scheduledStatus || "");
            const hasWinner = seed.isComplete && Number(summary.AScore) !== Number(summary.BScore);
            const winnerTeamIndex = Number(summary.AScore) > Number(summary.BScore) ? 0 : 1;

            if (hasWinner) {
                seed.winnerTeamIndex = winnerTeamIndex;
            }
            else {
                delete seed.winnerTeamIndex;
            }

            const nextRound = hasWinner ? brackets[roundIndex + 1] : null;
            if (nextRound) {
                const nextSeedIndex = Math.floor(seedIndex / 2);
                const nextTeamIndex = seedIndex % 2;
                nextRound.seeds[nextSeedIndex].teams[nextTeamIndex] = {
                    ...seed.teams[winnerTeamIndex],
                };
            }
        });
    });

    return {
        ...competition,
        data: {
            ...competition.data,
            brackets,
        },
    };
}

async function writeCompetitionResultLeaves(competitionID, resultUpdates) {
    await Promise.all(Object.entries(resultUpdates).map(([path, value]) => {
        return db.ref(`competitions/${competitionID}/${path}`).set(value);
    }));
}

export async function updateCompetitionResultFromScheduledMatch(competitionID, scheduledMatchID, summary) {
    if (!competitionID) {
        return;
    }

    const competition = await getCompetition(competitionID);
    if (!competition) {
        return;
    }

    const shouldUpdateRoundRobin = competition.type === "roundRobin" ||
        (competition.type === "roundRobinThenSingleElimination" && summary?.groupID);
    const shouldUpdateBracket = competition.type === "singleElimination" ||
        (competition.type === "roundRobinThenSingleElimination" && typeof summary?.bracketRoundIndex !== "undefined");

    if (shouldUpdateRoundRobin) {
        let matchedGroupID = "";
        let matchedSlotID = "";
        const groups = Object.entries(competition.groups || {}).reduce((groupMap, [groupID, group]: any) => {
            const matches = { ...(group.matches || {}) };
            Object.entries(matches).forEach(([slotID, match]: any) => {
                if (match.scheduledMatchID === scheduledMatchID) {
                    matchedGroupID = groupID;
                    matchedSlotID = slotID;
                    matches[slotID] = {
                        ...match,
                        AScore: summary.AScore,
                        BScore: summary.BScore,
                        gameScores: summary.gameScores || [],
                        isComplete: summary.isComplete === true,
                        scheduledStatus: summary.status || (summary.isComplete === true ? "complete" : match.scheduledStatus || ""),
                    };
                }
            });
            groupMap[groupID] = recalculateRoundRobinGroup({
                ...group,
                matches,
            });
            return groupMap;
        }, {});

        if (!matchedGroupID || !matchedSlotID) {
            return;
        }

        const matchedGroup: any = groups[matchedGroupID] || {};
        const resultUpdates: any = {
            [`groups/${matchedGroupID}/matches/${matchedSlotID}/AScore`]: summary.AScore,
            [`groups/${matchedGroupID}/matches/${matchedSlotID}/BScore`]: summary.BScore,
            [`groups/${matchedGroupID}/matches/${matchedSlotID}/gameScores`]: summary.gameScores || [],
            [`groups/${matchedGroupID}/matches/${matchedSlotID}/isComplete`]: summary.isComplete === true,
            [`groups/${matchedGroupID}/matches/${matchedSlotID}/scheduledStatus`]: summary.status || (summary.isComplete === true ? "complete" : ""),
        };

        Object.entries(matchedGroup.players || {}).forEach(([playerID, player]: any) => {
            resultUpdates[`groups/${matchedGroupID}/players/${playerID}/wins`] = Number(player.wins) || 0;
            resultUpdates[`groups/${matchedGroupID}/players/${playerID}/losses`] = Number(player.losses) || 0;
        });

        await writeCompetitionResultLeaves(competitionID, resultUpdates);
        return;
    }

    if (shouldUpdateBracket) {
        const nextCompetition = updateBracketResult(competition, scheduledMatchID, summary);
        const currentBrackets = competition.data?.brackets || [];
        const nextBrackets = nextCompetition.data?.brackets || [];
        const resultUpdates: any = {};
        let foundScheduledMatch = false;

        currentBrackets.forEach((round: any, roundIndex) => {
            (round.seeds || []).forEach((seed: any, seedIndex) => {
                if (seed.scheduledMatchID !== scheduledMatchID) {
                    return;
                }

                foundScheduledMatch = true;
                const nextSeed = nextBrackets?.[roundIndex]?.seeds?.[seedIndex] || {};
                const seedPath = `data/brackets/${roundIndex}/seeds/${seedIndex}`;
                resultUpdates[`${seedPath}/AScore`] = nextSeed.AScore || 0;
                resultUpdates[`${seedPath}/BScore`] = nextSeed.BScore || 0;
                resultUpdates[`${seedPath}/gameScores`] = nextSeed.gameScores || [];
                resultUpdates[`${seedPath}/isComplete`] = nextSeed.isComplete === true;
                resultUpdates[`${seedPath}/scheduledStatus`] = nextSeed.scheduledStatus || "";
                resultUpdates[`${seedPath}/winnerTeamIndex`] = typeof nextSeed.winnerTeamIndex === "undefined" ? null : nextSeed.winnerTeamIndex;

                const nextRound = nextBrackets?.[roundIndex + 1];
                if (nextRound && nextSeed.isComplete === true && typeof nextSeed.winnerTeamIndex !== "undefined") {
                    const nextSeedIndex = Math.floor(seedIndex / 2);
                    const nextTeamIndex = seedIndex % 2;
                    resultUpdates[`data/brackets/${roundIndex + 1}/seeds/${nextSeedIndex}/teams/${nextTeamIndex}`] =
                        nextRound.seeds?.[nextSeedIndex]?.teams?.[nextTeamIndex] || {};
                }
            });
        });

        if (foundScheduledMatch) {
            await writeCompetitionResultLeaves(competitionID, resultUpdates);
        }
    }
}
