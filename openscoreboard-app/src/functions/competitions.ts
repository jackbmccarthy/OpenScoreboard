import db, { getUserPath } from '../../database';

export const bracketRoundConfig = [
    { name: "Round of 64", seedsCount: 32 },
    { name: "Round of 32", seedsCount: 16 },
    { name: "Round of 16", seedsCount: 8 },
    { name: "Quarterfinals", seedsCount: 4 },
    { name: "Semifinals", seedsCount: 2 },
    { name: "Final", seedsCount: 1 },
];

export const defaultCompetitionStyles = {
    boardStyles: {
        backgroundColor: "#050816",
        borderColor: "#1D4ED8",
        color: "#FFFFFF",
    },
    bracketLineStyles: {
        borderStyle: "solid",
        color: "#38BDF8",
        width: 2,
    },
    bracketStyles: {
        backgroundColor: "#0B1220",
        color: "#FFFFFF",
        fontSize: 16,
    },
    footerStyles: {
        color: "#CBD5E1",
        fontSize: 16,
    },
    groupHeaderStyles: {
        backgroundColor: "#0B1220",
        color: "#FFFFFF",
        fontSize: 18,
    },
    groupPlayerStyles: {
        backgroundColor: "#FFFFFF",
        color: "#111827",
        fontSize: 16,
    },
    roundNameStyles: {
        color: "#93C5FD",
        fontSize: 18,
    },
    titleStyles: {
        color: "#FFFFFF",
        fontSize: 36,
    },
};

function getTargetPath(sourceType, sourceID) {
    return sourceType === "teamMatch" ? `teamMatches/${sourceID}` : `tables/${sourceID}`;
}

function getRoundTitleForSeedCount(seedCount) {
    return bracketRoundConfig.find((round) => round.seedsCount === seedCount)?.name || `Round of ${seedCount * 2}`;
}

function getSeedCountForRound(roundName) {
    return bracketRoundConfig.find((round) => round.name === roundName)?.seedsCount || 4;
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

export async function createCompetitionGraphic({
    groupCount = 1,
    largestRound = "Quarterfinals",
    title,
    type = "singleElimination",
} = {}) {
    const timestamp = new Date().toISOString();
    const competitionRef = db.ref("competitions").push();
    const competitionID = competitionRef.key;
    const cleanTitle = title?.trim() || (type === "roundRobin" ? "Round Robin Group" : "Bracket");
    const competition = {
        ...defaultCompetitionStyles,
        createdOn: timestamp,
        deleted: false,
        formatName: type === "roundRobin" ? "Round robin group" : "Single elimination bracket",
        id: competitionID,
        ownerID: getUserPath(),
        scoringType: "",
        showBoard: true,
        sourceID: "",
        sourceTitle: "",
        sourceType: "",
        sportName: "",
        type,
        updatedOn: timestamp,
        ...(type === "roundRobin" ? {
            data: {
                footer: "",
                title: cleanTitle,
            },
            groups: buildEmptyRoundRobinGroups(groupCount),
        } : {
            data: {
                brackets: generateEmptyBracket(largestRound),
                largestRound,
                title: cleanTitle,
            },
        }),
    };

    await competitionRef.set(competition);
    await db.ref(`users/${getUserPath()}/myCompetitions`).push({
        createdOn: timestamp,
        formatName: competition.formatName,
        id: competitionID,
        sourceTitle: "",
        type: competition.type,
        title: cleanTitle,
    });

    return competition;
}

export async function updateCompetitionGraphic(competitionID, updates = {}) {
    const timestamp = new Date().toISOString();
    await db.ref(`competitions/${competitionID}`).update({
        ...updates,
        updatedOn: timestamp,
    });

    const title = updates?.data?.title;
    if (title) {
        const myCompetitionsSnapshot = await db.ref(`users/${getUserPath()}/myCompetitions`).get();
        const myCompetitions = myCompetitionsSnapshot.val() || {};
        const matchingEntry = Object.entries(myCompetitions).find(([, value]: any) => value?.id === competitionID);

        if (matchingEntry) {
            await db.ref(`users/${getUserPath()}/myCompetitions/${matchingEntry[0]}`).update({
                title,
                updatedOn: timestamp,
            });
        }
    }
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
        sportName: config.sportName || "",
        type: config.competitionType,
        updatedOn: timestamp,
    };

    await competitionRef.set(competition);
    await db.ref(`users/${getUserPath()}/myCompetitions`).push({
        createdOn: timestamp,
        formatName: competition.formatName,
        id: competitionID,
        sourceTitle: competition.sourceTitle,
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

function recalculateRoundRobinGroup(group) {
    const players = Object.entries(group.players || {}).reduce((playerMap, [playerID, player]) => {
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

        const winnerName = match.AScore > match.BScore ? match.playerA : match.playerB;
        const loserName = match.AScore > match.BScore ? match.playerB : match.playerA;
        const winnerEntry = Object.entries(players).find(([, player]: any) => player.playerName === winnerName);
        const loserEntry = Object.entries(players).find(([, player]: any) => player.playerName === loserName);

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
            const winnerTeamIndex = summary.AScore > summary.BScore ? 0 : 1;
            seed.winnerTeamIndex = winnerTeamIndex;

            const nextRound = brackets[roundIndex + 1];
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

export async function updateCompetitionResultFromScheduledMatch(competitionID, scheduledMatchID, summary) {
    if (!competitionID) {
        return;
    }

    const competition = await getCompetition(competitionID);
    if (!competition) {
        return;
    }

    const timestamp = new Date().toISOString();

    if (competition.type === "roundRobin") {
        const groups = Object.entries(competition.groups || {}).reduce((groupMap, [groupID, group]: any) => {
            const matches = { ...(group.matches || {}) };
            Object.entries(matches).forEach(([slotID, match]: any) => {
                if (match.scheduledMatchID === scheduledMatchID) {
                    matches[slotID] = {
                        ...match,
                        AScore: summary.AScore,
                        BScore: summary.BScore,
                        gameScores: summary.gameScores || [],
                        isComplete: summary.isComplete === true,
                    };
                }
            });
            groupMap[groupID] = recalculateRoundRobinGroup({
                ...group,
                matches,
            });
            return groupMap;
        }, {});

        await db.ref(`competitions/${competitionID}`).update({
            groups,
            updatedOn: timestamp,
        });
        return;
    }

    if (competition.type === "singleElimination") {
        const nextCompetition = updateBracketResult(competition, scheduledMatchID, summary);
        await db.ref(`competitions/${competitionID}`).update({
            data: nextCompetition.data,
            updatedOn: timestamp,
        });
    }
}
