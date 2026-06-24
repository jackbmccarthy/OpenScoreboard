import db, { getUserPath } from '../../database';
import { newTeamMatch } from '../classes/TeamMatch';
import {
    createScheduledMatchesForTeamMatch,
    hydrateTeamTieScheduledMatch,
} from './scheduling';
import { addNewTeamMatch, getTeamMatch } from './teammatches';
import { ensureTeamManagerPassword, getTeam } from './teams';
import { normalizeTeamTieFormat } from './teamTieFormats';
import { getCompetition } from './competitions';

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

function getStandardBracketSeedOrder(slotCount) {
    let seedOrder = [1, 2];

    while (seedOrder.length < slotCount) {
        const nextSlotCount = seedOrder.length * 2;
        seedOrder = seedOrder.flatMap((seed) => [seed, nextSlotCount + 1 - seed]);
    }

    return seedOrder.slice(0, slotCount);
}

function getSnakeGroupIndex(seedIndex, groupCount) {
    if (groupCount <= 1) {
        return 0;
    }

    const cycleLength = groupCount * 2;
    const cyclePosition = seedIndex % cycleLength;
    return cyclePosition < groupCount ? cyclePosition : cycleLength - cyclePosition - 1;
}

function getTeamEntry(team, seedPosition) {
    return {
        losses: 0,
        playerName: team.name,
        seedPosition,
        showInGroup: true,
        teamID: team.id,
        teamLogoURL: team.teamLogoURL || "",
        teamName: team.name,
        wins: 0,
    };
}

function getCompetitionTitle(competition) {
    return competition?.data?.title || competition?.title || "Competition";
}

function buildGroupMatches(groupID, group) {
    const teams = Object.entries(group.players || {}).sort(([, firstTeam]: any, [, secondTeam]: any) => {
        return Number(firstTeam.seedPosition || 0) - Number(secondTeam.seedPosition || 0);
    });
    let matchIndex = 0;

    return teams.reduce((matches, [teamAID, teamA]: any, firstIndex) => {
        teams.slice(firstIndex + 1).forEach(([teamBID, teamB]: any) => {
            matchIndex += 1;
            const matchID = `${groupID}-team-tie-${matchIndex}`;
            matches[matchID] = {
                AScore: 0,
                BScore: 0,
                competitionSlotID: matchID,
                isComplete: false,
                playerA: teamA.playerName,
                playerAID: teamAID,
                playerB: teamB.playerName,
                playerBID: teamBID,
                scheduledStatus: "",
                teamAID,
                teamBID,
                teamTieStatus: "not-created",
            };
        });
        return matches;
    }, {});
}

function seedGroups(groups: any, teams: any[]) {
    const groupEntries: any[] = Object.entries(groups || {});
    const safeGroupEntries: any[] = groupEntries.length > 0 ? groupEntries : [["group-1", {
        groupName: "Group 1",
        matches: {},
        players: {},
        showOnBoard: true,
    }]];
    const nextGroups: any = safeGroupEntries.reduce((groupMap, [groupID, group]: any) => {
        groupMap[groupID] = {
            ...group,
            matches: {},
            players: {},
        };
        return groupMap;
    }, {});

    teams.forEach((team, index) => {
        const groupIndex = getSnakeGroupIndex(index, safeGroupEntries.length);
        const groupID = safeGroupEntries[groupIndex][0];
        const seedPosition = Object.keys(nextGroups[groupID].players || {}).length + 1;
        nextGroups[groupID].players[team.id] = getTeamEntry(team, seedPosition);
    });

    Object.entries(nextGroups).forEach(([groupID, group]: any) => {
        nextGroups[groupID] = {
            ...group,
            matches: buildGroupMatches(groupID, group),
        };
    });

    return nextGroups;
}

function emptyBracketTeam() {
    return { id: "", name: "TBD", teamID: "" };
}

function seedBracket(brackets, teams) {
    const nextBrackets = clone(brackets || []);
    const firstRound = nextBrackets[0];

    if (!firstRound) {
        return nextBrackets;
    }

    const slotCount = (firstRound.seeds || []).length * 2;
    const seedOrder = getStandardBracketSeedOrder(slotCount);
    const slotTeams = seedOrder.map((seedNumber) => {
        const team = teams[seedNumber - 1];
        return team ? {
            id: team.id,
            name: team.name,
            teamID: team.id,
            teamLogoURL: team.teamLogoURL || "",
        } : emptyBracketTeam();
    });

    firstRound.seeds = (firstRound.seeds || []).map((seed, seedIndex) => {
        const teamA = slotTeams[seedIndex * 2] || emptyBracketTeam();
        const teamB = slotTeams[seedIndex * 2 + 1] || emptyBracketTeam();
        const nextSeed = {
            ...seed,
            AScore: 0,
            BScore: 0,
            gameScores: [],
            isComplete: false,
            scheduledStatus: "",
            teamAID: teamA.teamID,
            teamBID: teamB.teamID,
            teamMatchID: "",
            teamTieStatus: teamA.teamID && teamB.teamID ? "not-created" : "",
            teams: [teamA, teamB],
        };
        delete nextSeed.winnerTeamIndex;
        return nextSeed;
    });

    nextBrackets.slice(1).forEach((round) => {
        round.seeds = (round.seeds || []).map((seed) => ({
            ...seed,
            AScore: 0,
            BScore: 0,
            isComplete: false,
            scheduledStatus: "",
            teamAID: "",
            teamBID: "",
            teamMatchID: "",
            teamTieStatus: "",
            teams: [emptyBracketTeam(), emptyBracketTeam()],
        }));
    });

    return nextBrackets;
}

export function buildTeamCompetitionSeeding(competition, selectedTeams) {
    const teams = (selectedTeams || []).filter((team) => team?.id && team?.name);
    const hasGroups = competition?.type === "roundRobin" || competition?.type === "roundRobinThenSingleElimination";
    const hasBracket = competition?.type === "singleElimination";

    return {
        ...(hasGroups ? { groups: seedGroups(competition?.groups || {}, teams) } : {}),
        data: {
            ...(competition?.data || {}),
            ...(hasBracket ? { brackets: seedBracket(competition?.data?.brackets || [], teams) } : {}),
            teamSeedOrder: teams.map((team) => team.id),
        },
        participantType: "team",
    };
}

function getGroupTeamStats(group) {
    const stats = Object.entries(group.players || {}).reduce((teamStats, [teamID, team]: any) => {
        teamStats[teamID] = {
            ...team,
            losses: 0,
            pointsAgainst: 0,
            pointsFor: 0,
            teamID,
            wins: 0,
        };
        return teamStats;
    }, {});

    Object.values(group.matches || {}).forEach((match: any) => {
        if (!match?.isComplete) {
            return;
        }
        const teamAID = match.teamAID || match.playerAID;
        const teamBID = match.teamBID || match.playerBID;
        const AScore = Number(match.AScore) || 0;
        const BScore = Number(match.BScore) || 0;
        if (stats[teamAID]) {
            stats[teamAID].pointsFor += AScore;
            stats[teamAID].pointsAgainst += BScore;
            stats[teamAID][AScore > BScore ? "wins" : "losses"] += AScore === BScore ? 0 : 1;
        }
        if (stats[teamBID]) {
            stats[teamBID].pointsFor += BScore;
            stats[teamBID].pointsAgainst += AScore;
            stats[teamBID][BScore > AScore ? "wins" : "losses"] += AScore === BScore ? 0 : 1;
        }
    });

    return Object.values(stats).map((team: any) => ({
        ...team,
        pointDifferential: team.pointsFor - team.pointsAgainst,
    }));
}

export function buildTeamBracketFromStandings(competition) {
    const advancementCount = Math.max(1, Number(competition?.data?.advancementPlayersPerGroup) || 2);
    const rankingOrder = competition?.data?.advancementRankingOrder || ["wins", "losses", "pointDifferential", "pointsFor", "pointsAgainst"];
    const advancingTeams = Object.values(competition?.groups || {}).flatMap((group: any) => {
        return getGroupTeamStats(group)
            .sort((firstTeam: any, secondTeam: any) => {
                for (const rankingKey of rankingOrder) {
                    const direction = rankingKey === "losses" || rankingKey === "pointsAgainst" ? 1 : -1;
                    const difference = (Number(firstTeam[rankingKey]) || 0) - (Number(secondTeam[rankingKey]) || 0);
                    if (difference !== 0) {
                        return difference * direction;
                    }
                }
                return Number(firstTeam.seedPosition || 0) - Number(secondTeam.seedPosition || 0);
            })
            .slice(0, advancementCount)
            .map((team: any) => ({
                id: team.teamID,
                name: team.teamName || team.playerName,
                teamLogoURL: team.teamLogoURL || "",
            }));
    });

    return seedBracket(competition?.data?.brackets || [], advancingTeams);
}

function isPlayableTeam(team) {
    const name = `${team?.name || ""}`.trim().toLowerCase();
    return !!team?.id && !!name && name !== "tbd" && name !== "bye";
}

export function getTeamCompetitionContests(competition) {
    const contests = [];

    Object.entries(competition?.groups || {}).forEach(([groupID, group]: any) => {
        Object.entries(group.matches || {}).forEach(([matchID, match]: any) => {
            if (!match?.teamAID || !match?.teamBID) {
                return;
            }
            contests.push({
                key: `group:${groupID}:${matchID}`,
                location: { groupID, matchID, stage: "group" },
                match,
                roundLabel: group.groupName || groupID,
                teamAID: match.teamAID || match.playerAID,
                teamAName: match.playerA || "Team A",
                teamBID: match.teamBID || match.playerBID,
                teamBName: match.playerB || "Team B",
            });
        });
    });

    (competition?.data?.brackets || []).forEach((round, roundIndex) => {
        (round.seeds || []).forEach((seed, seedIndex) => {
            const teams = seed.teams || [];
            if (!isPlayableTeam(teams[0]) || !isPlayableTeam(teams[1])) {
                return;
            }
            contests.push({
                key: `bracket:${roundIndex}:${seedIndex}`,
                location: { roundIndex, seedIndex, stage: "bracket" },
                match: seed,
                roundLabel: round.title || `Round ${roundIndex + 1}`,
                teamAID: seed.teamAID || teams[0].teamID || teams[0].id,
                teamAName: teams[0].name,
                teamBID: seed.teamBID || teams[1].teamID || teams[1].id,
                teamBName: teams[1].name,
            });
        });
    });

    return contests;
}

export function subscribeToTeamCompetitions(teamID, callback) {
    if (!teamID) {
        callback([]);
        return () => {};
    }

    const competitionsRef = db.ref("competitions");
    const handleCompetitionsValue = (snapshot) => {
        const competitions = snapshot.val() || {};
        const assignedCompetitions = Object.entries(competitions)
            .map(([competitionID, competition]: any) => ({
                ...competition,
                id: competition?.id || competitionID,
            }))
            .filter((competition) => {
                if (competition.participantType !== "team") {
                    return false;
                }

                return getTeamCompetitionContests(competition).some((contest) => {
                    return contest.teamAID === teamID || contest.teamBID === teamID;
                });
            })
            .sort((firstCompetition, secondCompetition) => {
                const firstArchived = firstCompetition.archived === true || !!firstCompetition.archivedOn;
                const secondArchived = secondCompetition.archived === true || !!secondCompetition.archivedOn;
                if (firstArchived !== secondArchived) {
                    return firstArchived ? 1 : -1;
                }

                const firstTitle = firstCompetition?.data?.title || firstCompetition.title || "";
                const secondTitle = secondCompetition?.data?.title || secondCompetition.title || "";
                return firstTitle.localeCompare(secondTitle);
            });

        callback(assignedCompetitions);
    };

    competitionsRef.on("value", handleCompetitionsValue);

    return () => {
        competitionsRef.off("value", handleCompetitionsValue);
    };
}

export function subscribeToTeamCompetitionIndex(teamIDs = [], callback) {
    const teamIDSet = new Set((teamIDs || []).filter(Boolean));
    if (teamIDSet.size === 0) {
        callback({});
        return () => {};
    }

    const competitionsRef = db.ref("competitions");
    const handleCompetitionsValue = (snapshot) => {
        const competitions = snapshot.val() || {};
        const competitionMap: any = {};
        teamIDSet.forEach((teamID) => {
            competitionMap[teamID] = [];
        });

        Object.entries(competitions)
            .map(([competitionID, competition]: any) => ({
                ...competition,
                id: competition?.id || competitionID,
            }))
            .filter((competition) => competition.participantType === "team")
            .forEach((competition) => {
                const contests = getTeamCompetitionContests(competition);
                teamIDSet.forEach((teamID) => {
                    const teamContests = contests.filter((contest) => {
                        return contest.teamAID === teamID || contest.teamBID === teamID;
                    });

                    if (teamContests.length === 0) {
                        return;
                    }

                    competitionMap[teamID].push({
                        ...competition,
                        teamCompletedContestCount: teamContests.filter((contest) => contest.match?.isComplete === true).length,
                        teamContestCount: teamContests.length,
                    });
                });
            });

        Object.keys(competitionMap).forEach((teamID) => {
            competitionMap[teamID].sort((firstCompetition, secondCompetition) => {
                const firstArchived = firstCompetition.archived === true || !!firstCompetition.archivedOn;
                const secondArchived = secondCompetition.archived === true || !!secondCompetition.archivedOn;
                if (firstArchived !== secondArchived) {
                    return firstArchived ? 1 : -1;
                }

                const firstTitle = firstCompetition?.data?.title || firstCompetition.title || "";
                const secondTitle = secondCompetition?.data?.title || secondCompetition.title || "";
                return firstTitle.localeCompare(secondTitle);
            });
        });

        callback(competitionMap);
    };

    competitionsRef.on("value", handleCompetitionsValue);

    return () => {
        competitionsRef.off("value", handleCompetitionsValue);
    };
}

function getContestPath(competitionID, location) {
    if (location.stage === "group") {
        return `competitions/${competitionID}/groups/${location.groupID}/matches/${location.matchID}`;
    }

    return `competitions/${competitionID}/data/brackets/${location.roundIndex}/seeds/${location.seedIndex}`;
}

function getTeamTieVaultPath(teamMatchID, side, accessToken = "") {
    const sidePath = `teamTieLineupVault/${teamMatchID}/${side}`;
    return accessToken ? `${sidePath}/${accessToken}` : sidePath;
}

function getFirstVaultSelection(sideVault): any {
    if (!sideVault || typeof sideVault !== "object") {
        return {};
    }

    return Object.values(sideVault)[0] || {};
}

export async function getTeamTieSideSelection(teamMatchID, side, accessToken): Promise<any> {
    if (!teamMatchID || !side || !accessToken) {
        return {};
    }

    const selectionSnapshot = await db.ref(getTeamTieVaultPath(teamMatchID, side, accessToken)).get();
    return selectionSnapshot.val() || {};
}

export function subscribeToTeamTieSideSelection(teamMatchID, side, accessToken, callback) {
    if (!teamMatchID || !side || !accessToken) {
        callback({});
        return () => {};
    }

    const selectionRef = db.ref(getTeamTieVaultPath(teamMatchID, side, accessToken));
    const handleSelectionValue = (snapshot) => callback(snapshot.val() || {});
    selectionRef.on("value", handleSelectionValue);

    return () => {
        selectionRef.off("value", handleSelectionValue);
    };
}

export async function getTeamTiePrivateSelections(teamMatchID): Promise<any> {
    if (!teamMatchID) {
        return { A: {}, B: {} };
    }

    const vaultSnapshot = await db.ref(`teamTieLineupVault/${teamMatchID}`).get();
    const vault: any = vaultSnapshot.val() || {};
    return {
        A: getFirstVaultSelection(vault.A),
        B: getFirstVaultSelection(vault.B),
    };
}

export async function migrateLegacyTeamTieSelections(teamMatchID, teamMatch) {
    const legacySubmissions = teamMatch?.lineupSubmissions || {};
    const hasLegacySelections = !!teamMatch?.lineup ||
        !!teamMatch?.matchCodeSelections ||
        !!legacySubmissions.A?.lineup ||
        !!legacySubmissions.A?.matchCodeSelections ||
        !!legacySubmissions.A?.accessToken ||
        !!legacySubmissions.B?.lineup ||
        !!legacySubmissions.B?.matchCodeSelections ||
        !!legacySubmissions.B?.accessToken;

    if (!hasLegacySelections) {
        return false;
    }

    const [teamA, teamB] = await Promise.all([
        getTeam(teamMatch.teamAID),
        getTeam(teamMatch.teamBID),
    ]);
    const [teamAAccessToken, teamBAccessToken] = await Promise.all([
        ensureTeamManagerPassword(teamMatch.teamAID, teamA || {}),
        ensureTeamManagerPassword(teamMatch.teamBID, teamB || {}),
    ]);
    const timestamp = new Date().toISOString();
    const sideASelection = {
        lineup: legacySubmissions.A?.lineup || {},
        matchCodeSelections: legacySubmissions.A?.matchCodeSelections || {},
        ready: legacySubmissions.A?.ready === true,
        teamID: teamMatch.teamAID,
        updatedOn: legacySubmissions.A?.updatedOn || timestamp,
    };
    const sideBSelection = {
        lineup: legacySubmissions.B?.lineup || {},
        matchCodeSelections: legacySubmissions.B?.matchCodeSelections || {},
        ready: legacySubmissions.B?.ready === true,
        teamID: teamMatch.teamBID,
        updatedOn: legacySubmissions.B?.updatedOn || timestamp,
    };

    await Promise.all([
        db.ref(getTeamTieVaultPath(teamMatchID, "A", teamAAccessToken)).set(sideASelection),
        db.ref(getTeamTieVaultPath(teamMatchID, "B", teamBAccessToken)).set(sideBSelection),
        db.ref(`teamMatches/${teamMatchID}/lineup`).remove(),
        db.ref(`teamMatches/${teamMatchID}/matchCodeSelections`).remove(),
    ]);
    await db.ref(`teamMatches/${teamMatchID}/lineupSubmissions`).set({
        A: {
            checkpoint: Math.max(1, Number(teamMatch.lineupCheckpoint) || 1),
            ready: sideASelection.ready,
            teamID: sideASelection.teamID,
            updatedOn: sideASelection.updatedOn,
        },
        B: {
            checkpoint: Math.max(1, Number(teamMatch.lineupCheckpoint) || 1),
            ready: sideBSelection.ready,
            teamID: sideBSelection.teamID,
            updatedOn: sideBSelection.updatedOn,
        },
    });

    return true;
}

export async function createCompetitionTeamTie(competition, contest) {
    if (contest?.match?.teamMatchID) {
        return contest.match.teamMatchID;
    }

    const format = normalizeTeamTieFormat(competition?.data?.teamTieFormat);
    const currentMatches = Array.from({ length: format.tableCount }).reduce((matches, _, index) => {
        matches[index + 1] = "";
        return matches;
    }, {});
    const teamMatch = {
        ...newTeamMatch(contest.teamAID, contest.teamBID, new Date().toISOString(), competition.sportName, competition.scoringType || ""),
        competitionID: competition.id,
        competitionLocation: contest.location,
        competitionSlotID: contest.match.competitionSlotID || contest.match.id || contest.key,
        currentMatches,
        lineup: {},
        lineupCheckpoint: 1,
        lineupSubmissions: {
            A: {
                checkpoint: 1,
                ready: false,
                teamID: contest.teamAID,
                updatedOn: "",
            },
            B: {
                checkpoint: 1,
                ready: false,
                teamID: contest.teamBID,
                updatedOn: "",
            },
        },
        eventName: getCompetitionTitle(competition),
        ownerID: getUserPath(),
        matchRound: getTeamContestMatchRoundLabel(contest),
        teamAName: contest.teamAName,
        teamBName: contest.teamBName,
        teamTieFormat: format,
        teamTieStatus: "waiting-lineups",
    };
    const created = await addNewTeamMatch(teamMatch, {
        addToMyTeamMatches: false,
    });
    const teamMatchID = created?.teamMatchID || "";

    await db.ref(`competitions/${competition.id}/teamMatches/${teamMatchID}`).set({
        ...teamMatch,
        createdOn: new Date().toISOString(),
        teamMatchID,
    });
    await db.ref(getContestPath(competition.id, contest.location)).update({
        teamAID: contest.teamAID,
        teamBID: contest.teamBID,
        teamMatchID,
        teamTieStatus: "waiting-lineups",
    });
    await ensureTeamTieScheduledMatchPlaceholders(teamMatchID);
    await syncCompetitionFromTeamMatch(teamMatchID);

    return teamMatchID;
}

export async function saveTeamTieLineup(teamMatchID, lineup, lineupCheckpoint, matchCodeSelections = {}) {
    const teamMatch = await getTeamMatch(teamMatchID);
    const format = normalizeTeamTieFormat(teamMatch?.teamTieFormat);
    const positions = getRequiredLineupCodes(format, lineupCheckpoint);
    if (!hasUniqueLineupPlayers(lineup, positions.sideA) || !hasUniqueLineupPlayers(lineup, positions.sideB)) {
        throw new Error("Each player can only be assigned to one lineup position for the same team.");
    }
    const sideALineup = positions.sideA.reduce((sideLineup, code) => {
        if (lineup?.[code]) {
            sideLineup[code] = lineup[code];
        }
        return sideLineup;
    }, {});
    const sideBLineup = positions.sideB.reduce((sideLineup, code) => {
        if (lineup?.[code]) {
            sideLineup[code] = lineup[code];
        }
        return sideLineup;
    }, {});
    const timestamp = new Date().toISOString();
    const [teamA, teamB] = await Promise.all([
        getTeam(teamMatch?.teamAID),
        getTeam(teamMatch?.teamBID),
    ]);
    const [teamAAccessToken, teamBAccessToken] = await Promise.all([
        ensureTeamManagerPassword(teamMatch?.teamAID, teamA || {}),
        ensureTeamManagerPassword(teamMatch?.teamBID, teamB || {}),
    ]);
    const sideAMatchCodeSelections = Object.entries(matchCodeSelections || {}).reduce((selections, [ruleID, ruleSelection]: any) => {
        selections[ruleID] = { sideA: ruleSelection?.sideA || [] };
        return selections;
    }, {});
    const sideBMatchCodeSelections = Object.entries(matchCodeSelections || {}).reduce((selections, [ruleID, ruleSelection]: any) => {
        selections[ruleID] = { sideB: ruleSelection?.sideB || [] };
        return selections;
    }, {});

    await Promise.all([
        db.ref(getTeamTieVaultPath(teamMatchID, "A", teamAAccessToken)).set({
            lineup: sideALineup,
            matchCodeSelections: sideAMatchCodeSelections,
            ready: true,
            teamID: teamMatch?.teamAID || "",
            updatedOn: timestamp,
        }),
        db.ref(getTeamTieVaultPath(teamMatchID, "B", teamBAccessToken)).set({
            lineup: sideBLineup,
            matchCodeSelections: sideBMatchCodeSelections,
            ready: true,
            teamID: teamMatch?.teamBID || "",
            updatedOn: timestamp,
        }),
        db.ref(`teamMatches/${teamMatchID}/lineup`).remove(),
        db.ref(`teamMatches/${teamMatchID}/matchCodeSelections`).remove(),
    ]);
    await db.ref(`teamMatches/${teamMatchID}`).update({
        lineupCheckpoint: Math.max(1, Number(lineupCheckpoint) || 1),
        lineupSubmissions: {
            A: {
                checkpoint: Math.max(1, Number(lineupCheckpoint) || 1),
                ready: true,
                teamID: teamMatch?.teamAID || "",
                updatedOn: timestamp,
            },
            B: {
                checkpoint: Math.max(1, Number(lineupCheckpoint) || 1),
                ready: true,
                teamID: teamMatch?.teamBID || "",
                updatedOn: timestamp,
            },
        },
        teamTieStatus: "ready",
    });
}

export function getTeamTieSubmissionStatus(teamMatch) {
    const submissions = teamMatch?.lineupSubmissions || {};
    const teamAReady = submissions.A?.ready === true;
    const teamBReady = submissions.B?.ready === true;

    return {
        ready: teamAReady && teamBReady,
        teamAReady,
        teamBReady,
        waitingFor: [
            ...(!teamAReady ? ["Team A"] : []),
            ...(!teamBReady ? ["Team B"] : []),
        ],
    };
}

export async function openTeamTieLineupCheckpoint(teamMatchID, lineupCheckpoint) {
    const teamMatch = await getTeamMatch(teamMatchID);
    if (!teamMatch) {
        throw new Error("This team tie is no longer available.");
    }

    await Promise.all([
        db.ref(`teamMatches/${teamMatchID}/lineup`).remove(),
        db.ref(`teamMatches/${teamMatchID}/matchCodeSelections`).remove(),
    ]);
    await db.ref(`teamMatches/${teamMatchID}`).update({
        lineupCheckpoint: Math.max(1, Number(lineupCheckpoint) || 1),
        lineupSubmissions: {
            A: {
                checkpoint: Math.max(1, Number(lineupCheckpoint) || 1),
                ready: false,
                teamID: teamMatch.teamAID,
                updatedOn: "",
            },
            B: {
                checkpoint: Math.max(1, Number(lineupCheckpoint) || 1),
                ready: false,
                teamID: teamMatch.teamBID,
                updatedOn: "",
            },
        },
        teamTieStatus: "waiting-lineups",
    });
}

function isScheduledTeamTieRuleComplete(teamMatch, ruleID) {
    const scheduledMatchID = teamMatch?.scheduledRuleIDs?.[ruleID];
    const scheduledMatch = scheduledMatchID ? teamMatch?.scheduledMatches?.[scheduledMatchID] : null;
    return scheduledMatch?.isComplete === true ||
        scheduledMatch?.status === "complete" ||
        !!teamMatch?.completedPlayerMatches?.[scheduledMatch?.matchID] ||
        teamMatch?.completedRuleIDs?.[ruleID] === true;
}

export function getNextTeamTieLineupCheckpoint(teamMatch) {
    const format = normalizeTeamTieFormat(teamMatch?.teamTieFormat);
    const currentCheckpoint = Math.max(1, Number(teamMatch?.lineupCheckpoint) || 1);
    const nextCheckpoint = [...new Set<number>(format.rules.map((rule) => rule.checkpoint))]
        .sort((firstCheckpoint, secondCheckpoint) => firstCheckpoint - secondCheckpoint)
        .find((checkpoint) => checkpoint > currentCheckpoint);

    if (!nextCheckpoint) {
        return null;
    }

    const prerequisiteRules = format.rules.filter((rule) => rule.checkpoint < nextCheckpoint);
    return prerequisiteRules.every((rule) => isScheduledTeamTieRuleComplete(teamMatch, rule.id)) ?
        nextCheckpoint
        : null;
}

function getTeamTieCheckpointRequirements(format, checkpoint) {
    const previousRules = format.rules.filter((rule) => rule.checkpoint < checkpoint);
    const currentRules = format.rules.filter((rule) => rule.checkpoint === checkpoint);
    const previousSideACodes = [...new Set<string>(previousRules.flatMap((rule) => rule.sideAOptions.flat() as string[]))];
    const previousSideBCodes = [...new Set<string>(previousRules.flatMap((rule) => rule.sideBOptions.flat() as string[]))];
    const currentSideACodes = [...new Set<string>(currentRules.flatMap((rule) => rule.sideAOptions.flat() as string[]))];
    const currentSideBCodes = [...new Set<string>(currentRules.flatMap((rule) => rule.sideBOptions.flat() as string[]))];

    return {
        sideA: currentSideACodes.some((code) => !previousSideACodes.includes(code)) ||
            currentRules.some((rule) => rule.sideAOptions.some((options) => options.length > 1)),
        sideB: currentSideBCodes.some((code) => !previousSideBCodes.includes(code)) ||
            currentRules.some((rule) => rule.sideBOptions.some((options) => options.length > 1)),
    };
}

export async function advanceTeamTieLineupCheckpointFromProgress(teamMatchID) {
    let teamMatch = await getTeamMatch(teamMatchID);
    if (!teamMatch) {
        return null;
    }

    const completedRuleIDs = Object.values(teamMatch.scheduledMatches || {}).reduce((ruleIDs: string[], scheduledMatch: any) => {
        if (
            scheduledMatch?.teamTieRuleID &&
            (
                scheduledMatch?.isComplete === true ||
                scheduledMatch?.status === "complete" ||
                !!teamMatch?.completedPlayerMatches?.[scheduledMatch?.matchID]
            ) &&
            teamMatch?.completedRuleIDs?.[scheduledMatch.teamTieRuleID] !== true
        ) {
            ruleIDs.push(scheduledMatch.teamTieRuleID);
        }
        return ruleIDs;
    }, []);
    if (completedRuleIDs.length > 0) {
        await Promise.all(completedRuleIDs.map((ruleID) => {
            return db.ref(`teamMatches/${teamMatchID}/completedRuleIDs/${ruleID}`).set(true);
        }));
        teamMatch = await getTeamMatch(teamMatchID);
    }

    const format = normalizeTeamTieFormat(teamMatch.teamTieFormat);
    if (
        Number(teamMatch.teamAScore) >= format.gamesToWin ||
        Number(teamMatch.teamBScore) >= format.gamesToWin
    ) {
        return null;
    }

    const nextCheckpoint = getNextTeamTieLineupCheckpoint(teamMatch);
    if (!nextCheckpoint) {
        return null;
    }

    const checkpointResult = await db.ref(`teamMatches/${teamMatchID}/lineupCheckpoint`).transaction((currentCheckpoint) => {
        const normalizedCurrentCheckpoint = Math.max(1, Number(currentCheckpoint) || 1);
        if (normalizedCurrentCheckpoint >= nextCheckpoint) {
            return;
        }
        return nextCheckpoint;
    });
    if (!checkpointResult.committed) {
        return null;
    }

    teamMatch = await getTeamMatch(teamMatchID);
    if (Math.max(1, Number(teamMatch?.lineupCheckpoint) || 1) !== nextCheckpoint) {
        return null;
    }

    const requirements = getTeamTieCheckpointRequirements(format, nextCheckpoint);
    const privateSelections = await getTeamTiePrivateSelections(teamMatchID);
    const requiredCodes = getRequiredLineupCodes(format, nextCheckpoint);
    requirements.sideA = requirements.sideA ||
        requiredCodes.sideA.some((code) => !privateSelections.A?.lineup?.[code]);
    requirements.sideB = requirements.sideB ||
        requiredCodes.sideB.some((code) => !privateSelections.B?.lineup?.[code]);
    const submissionWrites = [];
    if (requirements.sideA) {
        submissionWrites.push(
            db.ref(`teamMatches/${teamMatchID}/lineupSubmissions/A`).set({
                checkpoint: nextCheckpoint,
                ready: false,
                teamID: teamMatch.teamAID,
                updatedOn: "",
            })
        );
    }
    if (requirements.sideB) {
        submissionWrites.push(
            db.ref(`teamMatches/${teamMatchID}/lineupSubmissions/B`).set({
                checkpoint: nextCheckpoint,
                ready: false,
                teamID: teamMatch.teamBID,
                updatedOn: "",
            })
        );
    }

    if (submissionWrites.length > 0) {
        await Promise.all(submissionWrites);
        await db.ref(`teamMatches/${teamMatchID}/teamTieStatus`).set("waiting-lineups");
    }
    else {
        await scheduleReadyTeamTieMatches(teamMatchID);
    }

    return nextCheckpoint;
}

export async function saveTeamTieSideSubmission({
    accessToken,
    isReady,
    lineup,
    matchCodeSelections,
    side,
    teamID,
    teamMatchID,
}) {
    const teamMatch = await getTeamMatch(teamMatchID);
    if (!teamMatch) {
        throw new Error("This team tie is no longer available.");
    }

    const expectedTeamID = side === "A" ? teamMatch.teamAID : teamMatch.teamBID;
    if (expectedTeamID !== teamID) {
        throw new Error("This team is not assigned to that side of the team tie.");
    }

    const validAccessSnapshot = await db.ref(`teamManagerAccess/${teamID}/${accessToken}`).get();
    if (validAccessSnapshot.val() !== true) {
        throw new Error("This team portal link is no longer valid.");
    }

    if (teamMatch.lineupSubmissions?.[side]?.ready === true) {
        throw new Error("This lineup has already been submitted and can no longer be changed.");
    }

    const format = normalizeTeamTieFormat(teamMatch.teamTieFormat);
    const checkpoint = Math.max(1, Number(teamMatch.lineupCheckpoint) || 1);
    const positions = getRequiredLineupCodes(format, checkpoint);
    const sideCodes = side === "A" ? positions.sideA : positions.sideB;
    const existingSelection = await getTeamTieSideSelection(teamMatchID, side, accessToken);
    const mergedLineup = {
        ...(existingSelection.lineup || {}),
        ...(lineup || {}),
    };
    const mergedMatchCodeSelections = {
        ...(existingSelection.matchCodeSelections || {}),
        ...(matchCodeSelections || {}),
    };
    if (!hasUniqueLineupPlayers(mergedLineup, sideCodes)) {
        throw new Error("Each player can only be assigned to one lineup position.");
    }
    if (isReady === true && sideCodes.some((code) => !mergedLineup[code])) {
        throw new Error("Assign a player to every required lineup position before submitting.");
    }
    const sideKey = side === "A" ? "sideA" : "sideB";
    const hasMissingMatchChoice = format.rules
        .filter((rule) => rule.checkpoint === checkpoint)
        .some((rule) => {
            const ruleSelections = mergedMatchCodeSelections[rule.id]?.[sideKey] || [];
            return rule[`${sideKey}Options`].some((options, slotIndex) => {
                return options.length > 1 && !options.includes(ruleSelections[slotIndex]);
            });
        });
    if (isReady === true && hasMissingMatchChoice) {
        throw new Error("Choose a player position for every flexible matchup before submitting.");
    }

    const timestamp = new Date().toISOString();
    await db.ref(getTeamTieVaultPath(teamMatchID, side, accessToken)).set({
        lineup: mergedLineup,
        matchCodeSelections: mergedMatchCodeSelections,
        ready: isReady === true,
        teamID,
        updatedOn: timestamp,
    });
    await db.ref(`teamMatches/${teamMatchID}/lineupSubmissions/${side}`).set({
        checkpoint,
        ready: isReady === true,
        teamID,
        updatedOn: timestamp,
    });

    const nextTeamMatch = await getTeamMatch(teamMatchID);
    const submissionStatus = getTeamTieSubmissionStatus(nextTeamMatch);
    await db.ref(`teamMatches/${teamMatchID}/teamTieStatus`).set(submissionStatus.ready ? "ready" : "waiting-lineups");
    if (submissionStatus.ready) {
        await scheduleReadyTeamTieMatches(teamMatchID);
    }

    return submissionStatus;
}

function getPlayerName(player) {
    return `${player?.firstName || ""} ${player?.lastName || ""}`.trim() || player?.name || "Player";
}

function getRosterPlayer(roster, playerID) {
    const player = roster?.players?.[playerID];
    return player ? {
        ...player,
        id: playerID,
        jerseyColor: player.jerseyColor || roster?.teamJerseyColor || "",
        teamJerseyColor: roster?.teamJerseyColor || "",
    } : null;
}

function getSelectedRuleCodes(rule, matchCodeSelections) {
    const ruleSelections = matchCodeSelections?.[rule.id] || {};
    return {
        sideA: rule.sideAOptions.map((options, slotIndex) => {
            const selectedCode = ruleSelections.sideA?.[slotIndex];
            return options.includes(selectedCode) ? selectedCode : options[0];
        }),
        sideB: rule.sideBOptions.map((options, slotIndex) => {
            const selectedCode = ruleSelections.sideB?.[slotIndex];
            return options.includes(selectedCode) ? selectedCode : options[0];
        }),
    };
}

function getRulePlayers(rule, lineup, matchCodeSelections, teamA, teamB) {
    const selectedCodes = getSelectedRuleCodes(rule, matchCodeSelections);
    const sideAPlayers = selectedCodes.sideA.map((code) => getRosterPlayer(teamA, lineup[code])).filter(Boolean);
    const sideBPlayers = selectedCodes.sideB.map((code) => getRosterPlayer(teamB, lineup[code])).filter(Boolean);

    if (sideAPlayers.length !== selectedCodes.sideA.length || sideBPlayers.length !== selectedCodes.sideB.length) {
        return null;
    }

    return { selectedCodes, sideAPlayers, sideBPlayers };
}

export function getDuplicateLineupPlayerIDs(lineup = {}, codes: string[] = []) {
    const playerCounts = codes.reduce<Record<string, number>>((counts, code) => {
        const playerID = lineup?.[code];
        if (playerID) {
            counts[playerID] = (counts[playerID] || 0) + 1;
        }
        return counts;
    }, {});

    return Object.keys(playerCounts).filter((playerID) => playerCounts[playerID] > 1);
}

export function hasUniqueLineupPlayers(lineup = {}, codes: string[] = []) {
    return getDuplicateLineupPlayerIDs(lineup, codes).length === 0;
}

function getCompetitionScheduledStatus(teamTieStatus) {
    return ["scheduled", "active", "complete"].includes(teamTieStatus) ? teamTieStatus : "";
}

function getTeamTieFallbackEventName(teamMatch: any = {}, teamA: any = {}, teamB: any = {}) {
    return `${teamMatch.teamAName || teamA?.teamName || "Team A"} vs ${teamMatch.teamBName || teamB?.teamName || "Team B"}`;
}

async function resolveTeamTieEventName(teamMatch: any = {}) {
    if (`${teamMatch.eventName || ""}`.trim().length > 0) {
        return teamMatch.eventName;
    }

    if (teamMatch.competitionID) {
        const competition = await getCompetition(teamMatch.competitionID);
        return getCompetitionTitle(competition);
    }

    return getTeamTieFallbackEventName(teamMatch);
}

async function ensureTeamTieEventName(teamMatchID, teamMatch) {
    const eventName = await resolveTeamTieEventName(teamMatch);
    if (!eventName || teamMatch?.eventName === eventName) {
        return {
            ...teamMatch,
            eventName: teamMatch?.eventName || eventName,
        };
    }

    await Promise.all([
        db.ref(`teamMatches/${teamMatchID}/eventName`).set(eventName),
        teamMatch?.competitionID ?
            db.ref(`competitions/${teamMatch.competitionID}/teamMatches/${teamMatchID}/eventName`).set(eventName)
            : Promise.resolve(),
    ]);

    return {
        ...teamMatch,
        eventName,
    };
}

function getTeamContestMatchRoundLabel(contest: any = {}) {
    const roundLabel = `${contest.roundLabel || ""}`.trim();

    if (contest.location?.stage === "group") {
        return "Group Stage";
    }

    if (contest.location?.stage === "bracket") {
        return roundLabel || "Bracket";
    }

    return roundLabel || "Team Tie";
}

function getTeamTieMatchRoundLabel(teamMatch: any = {}) {
    const matchRound = `${teamMatch.matchRound || ""}`.trim();
    if (matchRound.length > 0) {
        return matchRound;
    }

    if (teamMatch.competitionLocation?.stage === "group") {
        return "Group Stage";
    }

    if (teamMatch.competitionLocation?.stage === "bracket") {
        return "Bracket";
    }

    return "Team Tie";
}

function buildTeamTieRuleScheduleItem(teamMatch, format, rule, index) {
    return {
        bestOf: rule.bestOf,
        competitionID: teamMatch.competitionID || "",
        eventName: teamMatch.eventName || getTeamTieFallbackEventName(teamMatch),
        formatName: "Team tournament tie",
        isDoubles: rule.matchType === "doubles",
        lineupPending: true,
        matchRound: getTeamTieMatchRoundLabel(teamMatch),
        order: index + 1,
        tableNumber: (index % format.tableCount) + 1,
        teamNameA: teamMatch.teamAName || "",
        teamNameB: teamMatch.teamBName || "",
        teamTieCheckpoint: rule.checkpoint,
        teamTieRuleID: rule.id,
        teamTieSideAOptions: rule.sideAOptions,
        teamTieSideBOptions: rule.sideBOptions,
    };
}

function getScheduledMatchPriority(scheduledMatchID, scheduledMatch, mappedScheduledMatchID) {
    const isActive = scheduledMatch?.status === "active";
    const isComplete = scheduledMatch?.isComplete === true || scheduledMatch?.status === "complete";
    const hasTableAssignments = Object.keys(scheduledMatch?.tableAssignments || {}).length > 0 ||
        !!scheduledMatch?.assignedTableID;
    return [
        isActive ? 1 : 0,
        isComplete ? 1 : 0,
        hasTableAssignments ? 1 : 0,
        scheduledMatchID === mappedScheduledMatchID ? 1 : 0,
    ];
}

function compareScheduledMatchPriority(first, second, mappedScheduledMatchID) {
    const firstPriority = getScheduledMatchPriority(first[0], first[1], mappedScheduledMatchID);
    const secondPriority = getScheduledMatchPriority(second[0], second[1], mappedScheduledMatchID);
    for (let index = 0; index < firstPriority.length; index += 1) {
        if (firstPriority[index] !== secondPriority[index]) {
            return secondPriority[index] - firstPriority[index];
        }
    }

    const firstTime = new Date(first[1]?.scheduledOn || 0).getTime();
    const secondTime = new Date(second[1]?.scheduledOn || 0).getTime();
    if (firstTime !== secondTime) {
        return firstTime - secondTime;
    }
    return `${first[0]}`.localeCompare(`${second[0]}`);
}

async function removeDuplicateTeamTieSchedule(teamMatchID, scheduledMatchID, scheduledMatch) {
    const tableAssignments: any[] = Object.values(scheduledMatch?.tableAssignments || {});
    if (
        scheduledMatch?.assignedTableID &&
        scheduledMatch?.assignedTableScheduledMatchID &&
        !tableAssignments.some((assignment) => {
            return assignment?.tableID === scheduledMatch.assignedTableID &&
                assignment?.scheduledMatchID === scheduledMatch.assignedTableScheduledMatchID;
        })
    ) {
        tableAssignments.push({
            scheduledMatchID: scheduledMatch.assignedTableScheduledMatchID,
            tableID: scheduledMatch.assignedTableID,
        });
    }

    await Promise.all([
        ...tableAssignments.map((assignment) => {
            return assignment?.tableID && assignment?.scheduledMatchID ?
                db.ref(`tables/${assignment.tableID}/scheduledMatches/${assignment.scheduledMatchID}`).remove()
                : Promise.resolve();
        }),
        db.ref(`teamMatches/${teamMatchID}/scheduledMatches/${scheduledMatchID}`).remove(),
    ]);
}

async function reconcileTeamTieScheduledMatches(teamMatchID, teamMatch, format) {
    const scheduledMatches = teamMatch?.scheduledMatches || {};
    const scheduledRuleIDs = teamMatch?.scheduledRuleIDs || {};
    const ruleUpdates = [];

    for (const rule of format.rules) {
        const matchingSchedules: any[] = Object.entries(scheduledMatches)
            .filter(([, scheduledMatch]: any) => scheduledMatch?.teamTieRuleID === rule.id)
            .sort((first: any, second: any) => {
                return compareScheduledMatchPriority(first, second, scheduledRuleIDs[rule.id]);
            });
        if (matchingSchedules.length === 0) {
            continue;
        }

        const [canonicalScheduledMatchID, canonicalScheduledMatch]: any = matchingSchedules[0];
        const desiredEventName = teamMatch.eventName || getTeamTieFallbackEventName(teamMatch);
        const desiredMatchRound = getTeamTieMatchRoundLabel(teamMatch);
        if (scheduledRuleIDs[rule.id] !== canonicalScheduledMatchID) {
            ruleUpdates.push(
                db.ref(`teamMatches/${teamMatchID}/scheduledRuleIDs/${rule.id}`).set(canonicalScheduledMatchID)
            );
        }
        if (desiredEventName && canonicalScheduledMatch?.eventName !== desiredEventName) {
            ruleUpdates.push(
                db.ref(`teamMatches/${teamMatchID}/scheduledMatches/${canonicalScheduledMatchID}/eventName`).set(desiredEventName)
            );
            if (canonicalScheduledMatch?.matchID) {
                ruleUpdates.push(
                    db.ref(`matches/${canonicalScheduledMatch.matchID}/eventName`).set(desiredEventName)
                );
            }
            Object.values(canonicalScheduledMatch?.tableAssignments || {}).forEach((assignment: any) => {
                if (!assignment?.tableID || !assignment?.scheduledMatchID) {
                    return;
                }
                ruleUpdates.push(
                    db.ref(`tables/${assignment.tableID}/scheduledMatches/${assignment.scheduledMatchID}/eventName`).set(desiredEventName)
                );
            });
        }
        if (desiredMatchRound && canonicalScheduledMatch?.matchRound !== desiredMatchRound) {
            ruleUpdates.push(
                db.ref(`teamMatches/${teamMatchID}/scheduledMatches/${canonicalScheduledMatchID}/matchRound`).set(desiredMatchRound)
            );
            if (canonicalScheduledMatch?.matchID) {
                ruleUpdates.push(
                    db.ref(`matches/${canonicalScheduledMatch.matchID}/matchRound`).set(desiredMatchRound)
                );
            }
            Object.values(canonicalScheduledMatch?.tableAssignments || {}).forEach((assignment: any) => {
                if (!assignment?.tableID || !assignment?.scheduledMatchID) {
                    return;
                }
                ruleUpdates.push(
                    db.ref(`tables/${assignment.tableID}/scheduledMatches/${assignment.scheduledMatchID}/matchRound`).set(desiredMatchRound)
                );
            });
        }
        for (const [duplicateScheduledMatchID, duplicateScheduledMatch] of matchingSchedules.slice(1)) {
            if (
                duplicateScheduledMatch?.status === "active" ||
                duplicateScheduledMatch?.status === "complete" ||
                duplicateScheduledMatch?.isComplete === true
            ) {
                continue;
            }
            ruleUpdates.push(
                removeDuplicateTeamTieSchedule(
                    teamMatchID,
                    duplicateScheduledMatchID,
                    duplicateScheduledMatch
                )
            );
        }
    }

    await Promise.all(ruleUpdates);
    return getTeamMatch(teamMatchID);
}

async function inheritTeamTieJerseyColors(teamMatchID, teamMatch) {
    if (!teamMatch?.teamAID || !teamMatch?.teamBID) {
        return;
    }

    const [teamA, teamB] = await Promise.all([
        getTeam(teamMatch.teamAID),
        getTeam(teamMatch.teamBID),
    ]);
    const teamAColor = teamA?.teamJerseyColor || "";
    const teamBColor = teamB?.teamJerseyColor || "";

    await Promise.all(Object.values(teamMatch.scheduledMatches || {}).map(async (scheduledMatch: any) => {
        if (!scheduledMatch?.matchID) {
            return;
        }

        const matchRef = db.ref(`matches/${scheduledMatch.matchID}`);
        const matchSnapshot = await matchRef.get();
        const match = matchSnapshot.val() || {};
        const playerUpdates = {};
        [
            ["playerA", teamAColor],
            ["playerA2", teamAColor],
            ["playerB", teamBColor],
            ["playerB2", teamBColor],
        ].forEach(([playerField, teamColor]) => {
            const player = match[playerField];
            const hasPlayer = player &&
                typeof player === "object" &&
                (player.id || player.firstName || player.lastName || player.name);
            if (!hasPlayer || !teamColor) {
                return;
            }
            if (!player.jerseyColor || !player.teamJerseyColor) {
                playerUpdates[playerField] = {
                    ...player,
                    jerseyColor: player.jerseyColor || teamColor,
                    teamJerseyColor: teamColor,
                };
            }
        });

        if (Object.keys(playerUpdates).length > 0) {
            await matchRef.update(playerUpdates);
        }
    }));
}

function wait(milliseconds) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function waitForTeamTiePlaceholderInitialization(teamMatchID, expectedRuleCount) {
    for (let attempt = 0; attempt < 30; attempt += 1) {
        const teamMatch = await getTeamMatch(teamMatchID);
        if (Object.keys(teamMatch?.scheduledRuleIDs || {}).length >= expectedRuleCount) {
            return teamMatch;
        }
        await wait(100);
    }
    return getTeamMatch(teamMatchID);
}

export async function ensureTeamTieScheduledMatchPlaceholders(teamMatchID) {
    let teamMatch = await getTeamMatch(teamMatchID);
    if (!teamMatch) {
        throw new Error("Team tie could not be found.");
    }
    teamMatch = await ensureTeamTieEventName(teamMatchID, teamMatch);

    const format = normalizeTeamTieFormat(teamMatch.teamTieFormat);
    let reconciledTeamMatch = await reconcileTeamTieScheduledMatches(teamMatchID, teamMatch, format);
    let scheduledRuleIDs = reconciledTeamMatch?.scheduledRuleIDs || {};
    let scheduledMatches = reconciledTeamMatch?.scheduledMatches || {};
    const missingRules = format.rules
        .map((rule, index) => ({ index, rule }))
        .filter(({ rule }) => {
            const scheduledMatchID = scheduledRuleIDs[rule.id];
            return !scheduledMatchID || !scheduledMatches[scheduledMatchID];
        });

    if (missingRules.length === 0) {
        await inheritTeamTieJerseyColors(teamMatchID, reconciledTeamMatch);
        return Object.entries(scheduledMatches);
    }

    const initializationToken = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const initializationRef = db.ref(`teamMatches/${teamMatchID}/placeholderInitialization`);
    const initializationResult = await initializationRef.transaction((currentValue) => {
        const currentStartedOn = new Date(currentValue?.startedOn || 0).getTime();
        const lockIsFresh = Number.isFinite(currentStartedOn) &&
            Date.now() - currentStartedOn < 30000;
        if (
            currentValue !== null &&
            typeof currentValue !== "undefined" &&
            lockIsFresh
        ) {
            return;
        }
        return {
            startedOn: new Date().toISOString(),
            token: initializationToken,
        };
    });
    if (!initializationResult.committed) {
        reconciledTeamMatch = await waitForTeamTiePlaceholderInitialization(teamMatchID, format.rules.length);
        reconciledTeamMatch = await reconcileTeamTieScheduledMatches(teamMatchID, reconciledTeamMatch, format);
        await inheritTeamTieJerseyColors(teamMatchID, reconciledTeamMatch);
        return Object.entries(reconciledTeamMatch?.scheduledMatches || {});
    }

    try {
        reconciledTeamMatch = await getTeamMatch(teamMatchID);
        scheduledRuleIDs = reconciledTeamMatch?.scheduledRuleIDs || {};
        scheduledMatches = reconciledTeamMatch?.scheduledMatches || {};
        const rulesToCreate = format.rules
            .map((rule, index) => ({ index, rule }))
            .filter(({ rule }) => {
                const scheduledMatchID = scheduledRuleIDs[rule.id];
                return !scheduledMatchID || !scheduledMatches[scheduledMatchID];
            });
        if (rulesToCreate.length > 0) {
            const createdMatches = await createScheduledMatchesForTeamMatch(
                teamMatchID,
                rulesToCreate.map(({ index, rule }) => {
                    return buildTeamTieRuleScheduleItem(reconciledTeamMatch, format, rule, index);
                }),
                {
                    competitionID: reconciledTeamMatch.competitionID || "",
                    competitionTeamTie: true,
                    formatName: "Team tournament tie",
                    scoringType: reconciledTeamMatch.scoringType || "",
                    sportName: reconciledTeamMatch.sportName || "tableTennis",
                }
            );
            await Promise.all(rulesToCreate.map(({ rule }, index) => {
                const scheduledMatchID = createdMatches[index]?.[0];
                return scheduledMatchID ?
                    db.ref(`teamMatches/${teamMatchID}/scheduledRuleIDs/${rule.id}`).set(scheduledMatchID)
                    : Promise.resolve();
            }));
        }
    }
    finally {
        const currentInitialization = await initializationRef.get();
        if (currentInitialization.val()?.token === initializationToken) {
            await initializationRef.remove();
        }
    }

    const refreshedTeamMatch = await reconcileTeamTieScheduledMatches(
        teamMatchID,
        await getTeamMatch(teamMatchID),
        format
    );
    await inheritTeamTieJerseyColors(teamMatchID, refreshedTeamMatch);
    return Object.entries(refreshedTeamMatch?.scheduledMatches || {});
}

export async function scheduleReadyTeamTieMatches(teamMatchID) {
    await ensureTeamTieScheduledMatchPlaceholders(teamMatchID);
    const teamMatch = await getTeamMatch(teamMatchID);
    if (!teamMatch) {
        throw new Error("Team tie could not be found.");
    }

    const format = normalizeTeamTieFormat(teamMatch.teamTieFormat);
    const submissionStatus = getTeamTieSubmissionStatus(teamMatch);
    if (teamMatch.competitionID && !submissionStatus.ready) {
        throw new Error(`Waiting for ${submissionStatus.waitingFor.join(" and ")} to submit their lineup.`);
    }
    const privateSelections = await getTeamTiePrivateSelections(teamMatchID);
    const lineup = {
        ...(teamMatch.lineup || {}),
        ...(privateSelections.A?.lineup || {}),
        ...(privateSelections.B?.lineup || {}),
    };
    const matchCodeSelections = Object.keys({
        ...(privateSelections.A?.matchCodeSelections || {}),
        ...(privateSelections.B?.matchCodeSelections || {}),
        ...(teamMatch.matchCodeSelections || {}),
    }).reduce((selections, ruleID) => {
        selections[ruleID] = {
            ...(teamMatch.matchCodeSelections?.[ruleID] || {}),
            ...(privateSelections.A?.matchCodeSelections?.[ruleID] || {}),
            ...(privateSelections.B?.matchCodeSelections?.[ruleID] || {}),
        };
        return selections;
    }, {});
    const checkpoint = Math.max(1, Number(teamMatch.lineupCheckpoint) || 1);
    const scheduledRuleIDs = teamMatch.scheduledRuleIDs || {};
    const configuredRuleIDs = teamMatch.configuredRuleIDs || {};
    if (Number(teamMatch.teamAScore) >= format.gamesToWin || Number(teamMatch.teamBScore) >= format.gamesToWin) {
        return [];
    }
    const readyRules = format.rules.filter((rule) => rule.checkpoint <= checkpoint && !configuredRuleIDs[rule.id]);
    const teamA = await getTeam(teamMatch.teamAID);
    const teamB = await getTeam(teamMatch.teamBID);
    const sideACodes = [...new Set<string>(format.rules.flatMap((rule) => rule.sideAOptions.flat() as string[]))];
    const sideBCodes = [...new Set<string>(format.rules.flatMap((rule) => rule.sideBOptions.flat() as string[]))];

    if (sideACodes.some((code) => sideBCodes.includes(code))) {
        throw new Error("Team A and Team B lineup codes must be different.");
    }

    if (!hasUniqueLineupPlayers(lineup, sideACodes) || !hasUniqueLineupPlayers(lineup, sideBCodes)) {
        throw new Error("Each player can only be assigned to one lineup position for the same team.");
    }

    const readyRuleItems = readyRules.map((rule, index) => {
        const players = getRulePlayers(rule, lineup, matchCodeSelections, teamA, teamB);
        if (!players) {
            return null;
        }

        return {
            item: {
                bestOf: rule.bestOf,
                competitionID: teamMatch.competitionID || "",
                eventName: teamMatch.eventName || getTeamTieFallbackEventName(teamMatch, teamA, teamB),
                formatName: "Team tournament tie",
                isDoubles: rule.matchType === "doubles",
                matchRound: getTeamTieMatchRoundLabel(teamMatch),
                order: format.rules.findIndex((nextRule) => nextRule.id === rule.id) + 1,
                playerA: players.sideAPlayers[0],
                playerA2: players.sideAPlayers[1],
                playerB: players.sideBPlayers[0],
                playerB2: players.sideBPlayers[1],
                playerAID: players.sideAPlayers[0]?.id || "",
                playerA2ID: players.sideAPlayers[1]?.id || "",
                playerBID: players.sideBPlayers[0]?.id || "",
                playerB2ID: players.sideBPlayers[1]?.id || "",
                tableNumber: (index % format.tableCount) + 1,
                teamNameA: teamMatch.teamAName || teamA?.teamName || "",
                teamNameB: teamMatch.teamBName || teamB?.teamName || "",
                teamTieCheckpoint: rule.checkpoint,
                teamTieSideACodes: players.selectedCodes.sideA,
                teamTieSideBCodes: players.selectedCodes.sideB,
                teamTieRuleID: rule.id,
            },
            rule,
        };
    }).filter(Boolean);

    if (readyRules.length > 0 && readyRuleItems.length !== readyRules.length) {
        throw new Error("Assign players to every required lineup position before scheduling this stage.");
    }

    if (readyRuleItems.length === 0) {
        return [];
    }

    const hydratedMatches = [];
    for (const { item, rule } of readyRuleItems) {
        const scheduledMatchID = scheduledRuleIDs[rule.id];
        if (!scheduledMatchID) {
            continue;
        }
        hydratedMatches.push(
            await hydrateTeamTieScheduledMatch(teamMatchID, scheduledMatchID, item, {
                competitionID: teamMatch.competitionID || "",
                competitionTeamTie: true,
                formatName: "Team tournament tie",
                scoringType: teamMatch.scoringType || "",
                sportName: teamMatch.sportName || "tableTennis",
            })
        );
    }

    await Promise.all(readyRuleItems.map(({ rule }) => {
        return db.ref(`teamMatches/${teamMatchID}/configuredRuleIDs/${rule.id}`).set(true);
    }));
    await inheritTeamTieJerseyColors(teamMatchID, await getTeamMatch(teamMatchID));
    const lineupRevealedOn = new Date().toISOString();
    await db.ref(`teamMatches/${teamMatchID}`).update({
        lineupRevealedOn,
        teamTieStatus: "scheduled",
    });
    if (teamMatch.competitionID) {
        await db.ref(`competitions/${teamMatch.competitionID}/teamMatches/${teamMatchID}`).update({
            lineupRevealedOn,
            teamTieStatus: "scheduled",
        });
    }

    return hydratedMatches;
}

function recalculateGroup(group) {
    const players = Object.entries(group.players || {}).reduce((playerMap, [teamID, team]: any) => {
        playerMap[teamID] = { ...team, losses: 0, wins: 0 };
        return playerMap;
    }, {});

    Object.values(group.matches || {}).forEach((match: any) => {
        if (!match?.isComplete || Number(match.AScore) === Number(match.BScore)) {
            return;
        }
        const winnerID = Number(match.AScore) > Number(match.BScore) ? match.teamAID || match.playerAID : match.teamBID || match.playerBID;
        const loserID = Number(match.AScore) > Number(match.BScore) ? match.teamBID || match.playerBID : match.teamAID || match.playerAID;
        if (players[winnerID]) {
            players[winnerID].wins += 1;
        }
        if (players[loserID]) {
            players[loserID].losses += 1;
        }
    });

    return { ...group, players };
}

export async function syncCompetitionFromTeamMatch(teamMatchID) {
    const teamMatch = await getTeamMatch(teamMatchID);
    const competitionID = teamMatch?.competitionID;
    const location = teamMatch?.competitionLocation;

    if (!competitionID || !location) {
        return;
    }

    const competitionSnapshot = await db.ref(`competitions/${competitionID}`).get();
    const competition = competitionSnapshot.val();
    if (!competition) {
        return;
    }
    const userID = getUserPath();
    const canWriteCompetition = !!userID && competition.ownerID === userID;

    const format = normalizeTeamTieFormat(teamMatch.teamTieFormat);
    const AScore = Number(teamMatch.teamAScore) || 0;
    const BScore = Number(teamMatch.teamBScore) || 0;
    const isComplete = AScore >= format.gamesToWin || BScore >= format.gamesToWin;
    const submissionStatus = getTeamTieSubmissionStatus(teamMatch);
    const teamTieStatus = isComplete ? "complete" :
        !submissionStatus.ready ? "waiting-lineups" :
            teamMatch.teamTieStatus === "ready" ? "ready" :
                AScore > 0 || BScore > 0 ? "active" :
                    teamMatch.teamTieStatus === "scheduled" ? "scheduled" :
                        teamMatch.teamTieStatus || "waiting-lineups";
    const scheduledStatus = getCompetitionScheduledStatus(teamTieStatus);
    if (teamMatch.teamTieStatus !== teamTieStatus) {
        await db.ref(`teamMatches/${teamMatchID}/teamTieStatus`).set(teamTieStatus);
    }
    const competitionTeamMatchRef = db.ref(`competitions/${competitionID}/teamMatches/${teamMatchID}`);
    const mirroredOn = new Date().toISOString();
    if (canWriteCompetition) {
        const {
            myTeamMatchID,
            ...competitionTeamMatch
        } = teamMatch;
        await competitionTeamMatchRef.set({
            ...competitionTeamMatch,
            isComplete,
            mirroredOn,
            teamMatchID,
            teamTieStatus,
            updatedOn: mirroredOn,
        });
        if (myTeamMatchID) {
            await Promise.all([
                db.ref(`users/${teamMatch.ownerID}/myTeamMatches/${myTeamMatchID}`).remove(),
                db.ref(`teamMatches/${teamMatchID}/myTeamMatchID`).remove(),
            ]);
        }
    }
    else {
        await competitionTeamMatchRef.update({
            AScore,
            BScore,
            isComplete,
            mirroredOn,
            teamAScore: AScore,
            teamBScore: BScore,
            teamTieStatus,
            updatedOn: mirroredOn,
        });
    }

    if (location.stage === "group") {
        const group = clone(competition.groups?.[location.groupID] || {});
        const match = group.matches?.[location.matchID];
        if (!match) {
            return;
        }
        const needsCompetitionUpdate = Number(match.AScore) !== AScore ||
            Number(match.BScore) !== BScore ||
            match.isComplete !== isComplete ||
            match.teamTieStatus !== teamTieStatus;
        if (needsCompetitionUpdate) {
            group.matches[location.matchID] = {
                ...match,
                AScore,
                BScore,
                isComplete,
                scheduledStatus,
                teamTieStatus,
            };
            const recalculatedGroup: any = recalculateGroup(group);
            if (canWriteCompetition) {
                await db.ref(`competitions/${competitionID}/groups/${location.groupID}`).set(recalculatedGroup);
            }
            else {
                await Promise.all([
                    db.ref(`competitions/${competitionID}/groups/${location.groupID}/matches/${location.matchID}/AScore`).set(AScore),
                    db.ref(`competitions/${competitionID}/groups/${location.groupID}/matches/${location.matchID}/BScore`).set(BScore),
                    db.ref(`competitions/${competitionID}/groups/${location.groupID}/matches/${location.matchID}/isComplete`).set(isComplete),
                    db.ref(`competitions/${competitionID}/groups/${location.groupID}/matches/${location.matchID}/scheduledStatus`).set(scheduledStatus),
                    db.ref(`competitions/${competitionID}/groups/${location.groupID}/matches/${location.matchID}/teamTieStatus`).set(teamTieStatus),
                    ...Object.entries(recalculatedGroup.players || {}).flatMap(([teamID, team]: any) => [
                        db.ref(`competitions/${competitionID}/groups/${location.groupID}/players/${teamID}/wins`).set(Number(team.wins) || 0),
                        db.ref(`competitions/${competitionID}/groups/${location.groupID}/players/${teamID}/losses`).set(Number(team.losses) || 0),
                    ]),
                ]);
            }
        }
    }
    else {
        const brackets = clone(competition.data?.brackets || []);
        const seed = brackets?.[location.roundIndex]?.seeds?.[location.seedIndex];
        if (!seed) {
            return;
        }
        const winnerTeamIndex = AScore > BScore ? 0 : 1;
        const nextRound = brackets?.[location.roundIndex + 1];
        const nextSeedIndex = Math.floor(location.seedIndex / 2);
        const nextTeamIndex = location.seedIndex % 2;
        const expectedWinner = isComplete && AScore !== BScore ? seed.teams?.[winnerTeamIndex] : null;
        const nextRoundWinner = nextRound?.seeds?.[nextSeedIndex]?.teams?.[nextTeamIndex];
        const needsWinnerAdvance = !!expectedWinner && (
            (nextRoundWinner?.teamID || nextRoundWinner?.id || "") !==
            (expectedWinner?.teamID || expectedWinner?.id || "")
        );
        const needsCompetitionUpdate = Number(seed.AScore) !== AScore ||
            Number(seed.BScore) !== BScore ||
            seed.isComplete !== isComplete ||
            seed.teamTieStatus !== teamTieStatus ||
            (isComplete && AScore !== BScore && seed.winnerTeamIndex !== winnerTeamIndex) ||
            needsWinnerAdvance;
        if (needsCompetitionUpdate) {
            seed.AScore = AScore;
            seed.BScore = BScore;
            seed.isComplete = isComplete;
            seed.scheduledStatus = scheduledStatus;
            seed.teamTieStatus = teamTieStatus;

            if (isComplete && AScore !== BScore) {
                seed.winnerTeamIndex = winnerTeamIndex;
                if (nextRound) {
                    const winner = { ...seed.teams[seed.winnerTeamIndex] };
                    nextRound.seeds[nextSeedIndex].teams[nextTeamIndex] = winner;
                    if (nextTeamIndex === 0) {
                        nextRound.seeds[nextSeedIndex].teamAID = winner.teamID || winner.id || "";
                    }
                    else {
                        nextRound.seeds[nextSeedIndex].teamBID = winner.teamID || winner.id || "";
                    }
                }
            }

            if (canWriteCompetition) {
                await db.ref(`competitions/${competitionID}/data/brackets`).set(brackets);
            }
            else {
                const seedPath = `competitions/${competitionID}/data/brackets/${location.roundIndex}/seeds/${location.seedIndex}`;
                const resultWrites: any[] = [
                    db.ref(`${seedPath}/AScore`).set(AScore),
                    db.ref(`${seedPath}/BScore`).set(BScore),
                    db.ref(`${seedPath}/isComplete`).set(isComplete),
                    db.ref(`${seedPath}/scheduledStatus`).set(scheduledStatus),
                    db.ref(`${seedPath}/teamTieStatus`).set(teamTieStatus),
                ];
                if (isComplete && AScore !== BScore) {
                    resultWrites.push(db.ref(`${seedPath}/winnerTeamIndex`).set(seed.winnerTeamIndex));
                }
                await Promise.all(resultWrites);
            }
        }
    }
}

export function getRequiredLineupCodes(format, checkpoint) {
    const normalizedFormat = normalizeTeamTieFormat(format);
    const availableRules = normalizedFormat.rules.filter((rule) => rule.checkpoint <= checkpoint);

    return {
        sideA: [...new Set<string>(availableRules.flatMap((rule) => rule.sideAOptions.flat() as string[]))],
        sideB: [...new Set<string>(availableRules.flatMap((rule) => rule.sideBOptions.flat() as string[]))],
    };
}

export function getTeamPlayerOptions(team) {
    return Object.entries(team?.players || {}).map(([id, player]: any) => ({
        id,
        label: getPlayerName(player),
        player,
    })).sort((firstPlayer, secondPlayer) => firstPlayer.label.localeCompare(secondPlayer.label));
}
