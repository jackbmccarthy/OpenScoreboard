import React, { useEffect, useMemo, useState } from 'react';
import { Image } from 'react-native';
import { NativeBaseProvider, ScrollView, Spinner, Text, View } from 'native-base';
import db from '../database';
import { openScoreboardColor, openScoreboardTheme } from "../openscoreboardtheme";
import { getCombinedPlayerNames } from './functions/players';
import { getActiveGameNumber, getCurrentGameScore, getMatchData, getMatchScore } from './functions/scoring';
import { supportedSports } from './functions/sports';
import { getTeam } from './functions/teams';
import { getTeamTieSubmissionStatus } from './functions/teamCompetitions';

function toScore(value) {
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? 0 : parsed;
}

function formatDate(value) {
    const date = new Date(value || 0);
    return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString();
}

function formatDateTime(value) {
    const date = new Date(value || 0);
    return Number.isNaN(date.getTime()) ? "" : `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
}

function getValidDate(value) {
    if (!value) {
        return null;
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

function formatTime(value) {
    const date = getValidDate(value);
    return date ? date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "";
}

function getArchivedDateLabel(matchSummary) {
    const date = getValidDate(matchSummary?.startTime) || getValidDate(matchSummary?.archivedOn);
    return date ? date.toLocaleDateString() : "Date unavailable";
}

function getArchivedTimeLabel(matchSummary) {
    const startTime = formatTime(matchSummary?.startTime);
    const archivedTime = formatTime(matchSummary?.archivedOn);

    if (startTime && archivedTime) {
        return `${startTime} - ${archivedTime}`;
    }

    if (startTime) {
        return `Started ${startTime}`;
    }

    if (archivedTime) {
        return `Finished ${archivedTime}`;
    }

    return "";
}

function getTeamDisplayName(team, fallback) {
    return team?.teamName || team?.name || fallback;
}

function getMatchPlayers(match = {}) {
    const names = getCombinedPlayerNames(match.playerA, match.playerB, match.playerA2, match.playerB2);

    return {
        a: names.a || "TBD",
        b: names.b || "TBD",
    };
}

function getGameScores(match = {}) {
    if (Array.isArray(match?.gameScores)) {
        return match.gameScores;
    }

    return [1, 2, 3, 4, 5, 6, 7, 8, 9]
        .filter((gameNumber) => match[`isGame${gameNumber}Started`] || match[`isGame${gameNumber}Finished`])
        .map((gameNumber) => ({
            gameNumber,
            a: match[`game${gameNumber}AScore`] ?? 0,
            b: match[`game${gameNumber}BScore`] ?? 0,
            isFinished: match[`isGame${gameNumber}Finished`] === true,
        }));
}

async function hydratePreviousMatches(matchSummaries) {
    return Promise.all(matchSummaries.map(async (matchSummary) => {
        if (!matchSummary?.matchID) {
            return {
                ...matchSummary,
                gameScores: [],
            };
        }

        try {
            const match = await getMatchData(matchSummary.matchID);

            return {
                ...matchSummary,
                gameScores: getGameScores(match),
                startTime: matchSummary.startTime || match?.matchStartTime,
            };
        }
        catch (err) {
            console.error(err);
            return {
                ...matchSummary,
                gameScores: [],
            };
        }
    }));
}

function getMatchStatus(matchID, match) {
    if (!matchID) {
        return "Waiting for match";
    }

    if (!match) {
        return "Loading";
    }

    if (match.showEndOfMatchOptions) {
        return "Finished";
    }

    if (match.isInBetweenGames) {
        return "Between games";
    }

    const activeGameNumber = getActiveGameNumber(match);

    if (activeGameNumber) {
        return `Game ${activeGameNumber}`;
    }

    if (match.isMatchStarted) {
        return "In progress";
    }

    return "Ready";
}

function getTimeoutSecondsRemaining(startTime, nowMs) {
    const startMs = new Date(startTime || 0).getTime();

    if (Number.isNaN(startMs) || startMs <= 0) {
        return 60;
    }

    return Math.max(0, 60 - Math.floor((nowMs - startMs) / 1000));
}

function getActiveTimeouts(match = {}, players, nowMs) {
    const activeTimeouts = [];

    if (match.isATimeOutActive === true) {
        activeTimeouts.push({
            label: players.a,
            secondsRemaining: getTimeoutSecondsRemaining(match.timeOutStartTimeA, nowMs),
            side: "A",
        });
    }

    if (match.isBTimeOutActive === true) {
        activeTimeouts.push({
            label: players.b,
            secondsRemaining: getTimeoutSecondsRemaining(match.timeOutStartTimeB, nowMs),
            side: "B",
        });
    }

    return activeTimeouts;
}

function TeamLogo({ logoURL = "", name = "" }) {
    const initials = name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]?.toUpperCase()).join("");

    return (
        <View
            alignItems={"center"}
            backgroundColor={"blue.50"}
            borderColor={"blue.200"}
            borderRadius={8}
            borderWidth={1}
            height={54}
            justifyContent={"center"}
            overflow={"hidden"}
            width={54}
        >
            {logoURL ? (
                <Image
                    resizeMode={"contain"}
                    source={{ uri: logoURL }}
                    style={{
                        backgroundColor: "white",
                        height: 54,
                        width: 54,
                    }}
                />
            ) : (
                <Text color={openScoreboardColor} fontSize={"lg"} fontWeight={"bold"}>{initials || "T"}</Text>
            )}
        </View>
    );
}

function TeamScore({ label, logoURL, name, score }) {
    return (
        <View
            alignItems={"center"}
            backgroundColor={"white"}
            borderColor={"gray.200"}
            borderRadius={8}
            borderWidth={1}
            flex={1}
            flexDirection={"row"}
            minWidth={240}
            padding={3}
        >
            <TeamLogo logoURL={logoURL} name={name} />
            <View flex={1} marginLeft={3} paddingRight={2}>
                <Text color={"gray.500"} fontSize={"xs"} fontWeight={"bold"} textTransform={"uppercase"}>{label}</Text>
                <Text color={"gray.900"} fontSize={"lg"} fontWeight={"bold"} numberOfLines={1}>{name}</Text>
            </View>
            <Text color={openScoreboardColor} fontSize={"4xl"} fontWeight={"bold"}>{score}</Text>
        </View>
    );
}

function Section({ children, subtitle = "", title }) {
    return (
        <View marginTop={5}>
            <Text color={"gray.900"} fontSize={"2xl"} fontWeight={"bold"}>{title}</Text>
            {subtitle ? <Text color={"gray.600"} fontSize={"sm"} marginTop={1}>{subtitle}</Text> : null}
            {children}
        </View>
    );
}

function CurrentMatchCard({ matchInfo, nowMs }) {
    const match = matchInfo.match;
    const players = match ? getMatchPlayers(match) : { a: "TBD", b: "TBD" };
    const currentGameScore = match ? getCurrentGameScore(match) : { a: 0, b: 0 };
    const matchScore = match ? getMatchScore(match) : { a: 0, b: 0 };
    const gameScores = match ? getGameScores(match) : [];
    const status = getMatchStatus(matchInfo.matchID, match);
    const activeTimeouts = match ? getActiveTimeouts(match, players, nowMs) : [];

    return (
        <View
            backgroundColor={"white"}
            borderColor={"gray.200"}
            borderRadius={8}
            borderWidth={1}
            marginTop={3}
            padding={4}
            width={{ base: "100%", lg: "48.8%" }}
        >
            <View alignItems={"center"} flexDirection={"row"} justifyContent={"space-between"}>
                <View>
                    <Text color={"gray.900"} fontSize={"lg"} fontWeight={"bold"}>Table {matchInfo.tableNumber}</Text>
                    <Text color={"blue.700"} fontSize={"xs"} fontWeight={"bold"} marginTop={1} textTransform={"uppercase"}>
                        {status}
                    </Text>
                </View>
                <View alignItems={"center"}>
                    <Text color={"gray.500"} fontSize={"2xs"} fontWeight={"bold"} textTransform={"uppercase"}>Match</Text>
                    <Text color={"gray.900"} fontSize={"lg"} fontWeight={"bold"}>{matchScore.a} - {matchScore.b}</Text>
                </View>
            </View>

            <View marginTop={3}>
                <View alignItems={"center"} flexDirection={"row"} justifyContent={"space-between"}>
                    <Text color={"gray.900"} flex={1} fontSize={"md"} fontWeight={"bold"} numberOfLines={1}>{players.a}</Text>
                    <Text color={openScoreboardColor} fontSize={"2xl"} fontWeight={"bold"} marginLeft={3}>{currentGameScore?.a ?? 0}</Text>
                </View>
                <View alignItems={"center"} flexDirection={"row"} justifyContent={"space-between"} marginTop={2}>
                    <Text color={"gray.900"} flex={1} fontSize={"md"} fontWeight={"bold"} numberOfLines={1}>{players.b}</Text>
                    <Text color={openScoreboardColor} fontSize={"2xl"} fontWeight={"bold"} marginLeft={3}>{currentGameScore?.b ?? 0}</Text>
                </View>
            </View>

            {gameScores.length > 0 ? (
                <View flexDirection={"row"} flexWrap={"wrap"} marginTop={3}>
                    {gameScores.map((game) => (
                        <View
                            key={game.gameNumber}
                            backgroundColor={game.isFinished ? "blue.50" : "gray.50"}
                            borderColor={game.isFinished ? "blue.100" : "gray.200"}
                            borderRadius={6}
                            borderWidth={1}
                            marginRight={2}
                            marginTop={2}
                            paddingX={2}
                            paddingY={1}
                        >
                            <Text color={"gray.500"} fontSize={"2xs"} fontWeight={"bold"}>G{game.gameNumber}</Text>
                            <Text color={"gray.900"} fontSize={"sm"} fontWeight={"bold"}>{game.a} - {game.b}</Text>
                        </View>
                    ))}
                </View>
            ) : null}

            {activeTimeouts.length > 0 ? (
                <View
                    backgroundColor={"red.50"}
                    borderColor={"red.200"}
                    borderRadius={8}
                    borderWidth={1}
                    marginTop={3}
                    padding={2}
                >
                    {activeTimeouts.map((timeout) => (
                        <View alignItems={"center"} flexDirection={"row"} justifyContent={"space-between"} key={timeout.side}>
                            <Text color={"red.800"} flex={1} fontSize={"sm"} fontWeight={"bold"} numberOfLines={1}>
                                {timeout.label} timeout
                            </Text>
                            <Text color={"red.800"} fontSize={"lg"} fontWeight={"bold"} marginLeft={2}>
                                {timeout.secondsRemaining}s
                            </Text>
                        </View>
                    ))}
                </View>
            ) : null}
        </View>
    );
}

const PREVIOUS_GAME_SCORE_COLUMN_WIDTH = 44;
const PREVIOUS_TOTAL_SCORE_COLUMN_WIDTH = 34;

function getWinnerSide(matchSummary) {
    if (toScore(matchSummary?.AScore) > toScore(matchSummary?.BScore)) {
        return "A";
    }

    if (toScore(matchSummary?.BScore) > toScore(matchSummary?.AScore)) {
        return "B";
    }

    return "";
}

function PreviousGridCell({ align = "center", children, flex, isHeader = false, isTotal = false, isWinner = false, width }) {
    return (
        <View
            alignItems={align}
            backgroundColor={isWinner ? "blue.700" : isHeader || isTotal ? "gray.100" : "white"}
            borderColor={"gray.200"}
            borderWidth={1}
            flex={flex}
            justifyContent={"center"}
            minH={30}
            paddingX={2}
            width={width}
        >
            <Text
                color={isWinner ? "white" : isHeader ? "gray.600" : "gray.900"}
                fontSize={isHeader ? "xs" : "sm"}
                fontWeight={isHeader || isTotal || isWinner ? "bold" : "medium"}
                numberOfLines={1}
            >
                {children}
            </Text>
        </View>
    );
}

function PreviousScoreRow({ playerName, scores, side, teamName, total, winnerSide }) {
    const isWinner = winnerSide === side;

    return (
        <View flexDirection={"row"} marginTop={-1}>
            <PreviousGridCell align={"flex-start"} flex={0.9}>{teamName || "Team"}</PreviousGridCell>
            <PreviousGridCell align={"flex-start"} flex={1.1}>{playerName || "TBD"}</PreviousGridCell>
            {scores.map((game) => (
                <PreviousGridCell key={`${side}-game-${game.gameNumber}`} width={PREVIOUS_GAME_SCORE_COLUMN_WIDTH}>
                    {side === "A" ? game.a : game.b}
                </PreviousGridCell>
            ))}
            <PreviousGridCell isTotal isWinner={isWinner} width={PREVIOUS_TOTAL_SCORE_COLUMN_WIDTH}>{total ?? 0}</PreviousGridCell>
        </View>
    );
}

function PreviousMatchCard({ matchSummary, teamAName, teamBName }) {
    const gameScores = getGameScores(matchSummary);
    const winnerSide = getWinnerSide(matchSummary);
    const timeLabel = getArchivedTimeLabel(matchSummary);

    return (
        <View marginTop={3} width={{ base: "100%", lg: "48.8%" }}>
            <View
                backgroundColor={"white"}
                borderColor={"gray.200"}
                borderRadius={8}
                borderWidth={1}
                padding={3}
            >
                <View flexDirection={"row"} justifyContent={"space-between"} marginBottom={2}>
                    <View flex={1} paddingRight={3}>
                        <Text color={"gray.900"} fontSize={"sm"} fontWeight={"bold"} numberOfLines={1}>
                            {getArchivedDateLabel(matchSummary)}
                        </Text>
                        <Text color={"gray.500"} fontSize={"xs"} fontWeight={"medium"} marginTop={1} numberOfLines={1}>
                            {matchSummary.tableNumber ? `Table ${matchSummary.tableNumber}` : "Previous match"}
                        </Text>
                    </View>
                    {timeLabel ? (
                        <Text color={"gray.500"} fontSize={"xs"} fontWeight={"medium"} numberOfLines={1}>
                            {timeLabel}
                        </Text>
                    ) : null}
                </View>

                <View>
                    <View flexDirection={"row"}>
                        <PreviousGridCell align={"flex-start"} flex={0.9} isHeader>Team</PreviousGridCell>
                        <PreviousGridCell align={"flex-start"} flex={1.1} isHeader>Player</PreviousGridCell>
                        {gameScores.map((game) => (
                            <PreviousGridCell key={`header-game-${game.gameNumber}`} isHeader width={PREVIOUS_GAME_SCORE_COLUMN_WIDTH}>
                                {game.gameNumber}
                            </PreviousGridCell>
                        ))}
                        <PreviousGridCell isHeader width={PREVIOUS_TOTAL_SCORE_COLUMN_WIDTH}>T</PreviousGridCell>
                    </View>
                    <PreviousScoreRow
                        playerName={matchSummary.playerA}
                        scores={gameScores}
                        side={"A"}
                        teamName={teamAName}
                        total={matchSummary.AScore}
                        winnerSide={winnerSide}
                    />
                    <PreviousScoreRow
                        playerName={matchSummary.playerB}
                        scores={gameScores}
                        side={"B"}
                        teamName={teamBName}
                        total={matchSummary.BScore}
                        winnerSide={winnerSide}
                    />
                </View>

                {gameScores.length === 0 ? (
                    <Text color={"gray.500"} fontSize={"2xs"} marginTop={2}>
                        No game scores recorded.
                    </Text>
                ) : null}
            </View>
        </View>
    );
}

function ScheduledMatchCard({ matchSummary }) {
    return (
        <View
            backgroundColor={"white"}
            borderColor={"gray.200"}
            borderRadius={8}
            borderWidth={1}
            marginTop={3}
            padding={3}
            width={{ base: "100%", md: "48.8%" }}
        >
            <Text color={"gray.500"} fontSize={"xs"} fontWeight={"bold"}>{formatDateTime(matchSummary.startTime || matchSummary.scheduledOn)}</Text>
            <Text color={"gray.900"} fontSize={"md"} fontWeight={"bold"} marginTop={2} numberOfLines={1}>{matchSummary.playerA || "TBD"}</Text>
            <Text color={"gray.900"} fontSize={"md"} fontWeight={"bold"} marginTop={1} numberOfLines={1}>{matchSummary.playerB || "TBD"}</Text>
        </View>
    );
}

export default function TeamMatchPublicView(props) {
    const routeParams = props.route?.params || {};
    const teamMatchID = routeParams.teamMatchID;
    const isEmbedded = routeParams.embed === true || routeParams.embed === "true";
    const [doneLoading, setDoneLoading] = useState(false);
    const [teamMatch, setTeamMatch] = useState({});
    const [teamA, setTeamA] = useState(null);
    const [teamB, setTeamB] = useState(null);
    const [currentMatchInfo, setCurrentMatchInfo] = useState({});
    const [previousMatches, setPreviousMatches] = useState([]);
    const [nowMs, setNowMs] = useState(Date.now());

    useEffect(() => {
        let isCurrent = true;
        const teamMatchRef = db.ref(`teamMatches/${teamMatchID}`);

        teamMatchRef.on("value", async (snapshot) => {
            const nextTeamMatch = snapshot.val() || {};

            if (!isCurrent) {
                return;
            }

            setTeamMatch(nextTeamMatch);
            setDoneLoading(true);

            const [nextTeamA, nextTeamB] = await Promise.all([
                nextTeamMatch.teamAID ? getTeam(nextTeamMatch.teamAID) : null,
                nextTeamMatch.teamBID ? getTeam(nextTeamMatch.teamBID) : null,
            ]);

            if (isCurrent) {
                setTeamA(nextTeamA);
                setTeamB(nextTeamB);
            }
        });

        return () => {
            isCurrent = false;
            teamMatchRef.off();
        };
    }, [teamMatchID]);

    useEffect(() => {
        const currentMatches = teamMatch.currentMatches || {};
        const visibleCurrentMatches = Object.entries(currentMatches).filter(([tableNumber]) => {
            const parsedTableNumber = parseInt(tableNumber, 10);
            return !Number.isNaN(parsedTableNumber) && parsedTableNumber > 0;
        });
        const matchRefs = [];
        const baseMatchInfo = visibleCurrentMatches.reduce((nextInfo, [tableNumber, matchID]) => {
            nextInfo[tableNumber] = { tableNumber, matchID, match: null };
            return nextInfo;
        }, {});

        setCurrentMatchInfo(baseMatchInfo);

        visibleCurrentMatches.forEach(([tableNumber, matchID]) => {
            if (!matchID) {
                return;
            }

            const matchRef = db.ref(`matches/${matchID}`);
            matchRef.on("value", (snapshot) => {
                const match = snapshot.val();
                setCurrentMatchInfo((previousInfo) => ({
                    ...previousInfo,
                    [tableNumber]: { tableNumber, matchID, match },
                }));
            });
            matchRefs.push(matchRef);
        });

        return () => {
            matchRefs.forEach((matchRef) => matchRef.off());
        };
    }, [JSON.stringify(teamMatch.currentMatches || {})]);

    useEffect(() => {
        const timer = setInterval(() => {
            setNowMs(Date.now());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        let isCurrent = true;
        const archivedMatches = Object.entries(teamMatch.archivedMatches || {})
            .map(([id, matchSummary]) => ({ id, ...matchSummary }))
            .sort((a, b) => new Date(b.archivedOn || b.startTime || 0).getTime() - new Date(a.archivedOn || a.startTime || 0).getTime());

        async function loadPreviousMatches() {
            const hydratedMatches = await hydratePreviousMatches(archivedMatches);

            if (isCurrent) {
                setPreviousMatches(hydratedMatches);
            }
        }

        loadPreviousMatches();

        return () => {
            isCurrent = false;
        };
    }, [JSON.stringify(teamMatch.archivedMatches || {})]);

    const teamAName = getTeamDisplayName(teamA, "Team A");
    const teamBName = getTeamDisplayName(teamB, "Team B");
    const sportDisplayName = supportedSports[teamMatch.sportName]?.displayName || teamMatch.sportName || "Team Match";
    const currentMatches = useMemo(() => {
        return Object.values(currentMatchInfo).sort((a, b) => parseInt(a.tableNumber, 10) > parseInt(b.tableNumber, 10) ? 1 : -1);
    }, [currentMatchInfo]);
    const scheduledMatches = useMemo(() => {
        return Object.entries(teamMatch.scheduledMatches || {})
            .map(([id, matchSummary]) => ({ id, ...matchSummary }))
            .sort((a, b) => new Date(a.startTime || a.scheduledOn || 0).getTime() - new Date(b.startTime || b.scheduledOn || 0).getTime());
    }, [teamMatch.scheduledMatches]);
    const submissionStatus = getTeamTieSubmissionStatus(teamMatch);

    if (!doneLoading) {
        return (
            <NativeBaseProvider theme={openScoreboardTheme}>
                <View alignItems={"center"} backgroundColor={"gray.50"} flex={1} justifyContent={"center"}>
                    <Spinner color={openScoreboardColor} />
                    <Text color={"gray.600"} fontSize={"sm"} marginTop={2}>Loading team match</Text>
                </View>
            </NativeBaseProvider>
        );
    }

    return (
        <NativeBaseProvider theme={openScoreboardTheme}>
            <ScrollView backgroundColor={"gray.50"} contentContainerStyle={{ paddingBottom: 40 }}>
                <View alignSelf={"center"} maxWidth={1180} padding={isEmbedded ? 2 : 4} width={"100%"}>
                    <View
                        backgroundColor={"white"}
                        borderColor={"gray.200"}
                        borderRadius={8}
                        borderWidth={1}
                        padding={4}
                    >
                        <Text color={"gray.500"} fontSize={"xs"} fontWeight={"bold"} textAlign={"center"} textTransform={"uppercase"}>
                            {sportDisplayName}{teamMatch.startTime ? ` - ${formatDate(teamMatch.startTime)}` : ""}
                        </Text>
                        <Text color={"gray.900"} fontSize={"3xl"} fontWeight={"bold"} marginTop={2} textAlign={"center"}>
                            {teamAName} vs {teamBName}
                        </Text>
                        <View flexDirection={"row"} flexWrap={"wrap"} justifyContent={"space-between"} marginTop={4}>
                            <View marginTop={2} width={{ base: "100%", md: "49%" }}>
                                <TeamScore label={"Team A"} logoURL={teamA?.teamLogoURL} name={teamAName} score={toScore(teamMatch.teamAScore)} />
                            </View>
                            <View marginTop={2} width={{ base: "100%", md: "49%" }}>
                                <TeamScore label={"Team B"} logoURL={teamB?.teamLogoURL} name={teamBName} score={toScore(teamMatch.teamBScore)} />
                            </View>
                        </View>
                        {teamMatch.competitionID ? (
                            <View
                                alignItems={"center"}
                                backgroundColor={submissionStatus.ready ? "green.50" : "yellow.50"}
                                borderColor={submissionStatus.ready ? "green.200" : "yellow.200"}
                                borderRadius={8}
                                borderWidth={1}
                                flexDirection={"row"}
                                justifyContent={"center"}
                                marginTop={4}
                                padding={3}
                            >
                                <View
                                    backgroundColor={submissionStatus.ready ? "green.500" : "yellow.400"}
                                    borderRadius={8}
                                    height={"9px"}
                                    marginRight={2}
                                    width={"9px"}
                                />
                                <Text color={"gray.800"} fontSize={"sm"} fontWeight={"bold"} textAlign={"center"}>
                                    {submissionStatus.ready ?
                                        "Both team lineups are submitted."
                                        : `Waiting for ${submissionStatus.waitingFor.join(" and ")} to submit a lineup.`}
                                </Text>
                            </View>
                        ) : null}
                    </View>

                    <Section
                        subtitle={"Live table matches and current scores."}
                        title={"Current matches"}
                    >
                        {currentMatches.length > 0 ? (
                            <View flexDirection={"row"} flexWrap={"wrap"} justifyContent={"space-between"}>
                                {currentMatches.map((matchInfo) => (
                                    <CurrentMatchCard key={matchInfo.tableNumber} matchInfo={matchInfo} nowMs={nowMs} />
                                ))}
                            </View>
                        ) : (
                            <View backgroundColor={"white"} borderColor={"gray.200"} borderRadius={8} borderWidth={1} marginTop={3} padding={4}>
                                <Text color={"gray.900"} fontSize={"md"} fontWeight={"bold"}>No current matches have been added.</Text>
                            </View>
                        )}
                    </Section>

                    {scheduledMatches.length > 0 ? (
                        <Section
                            subtitle={"Upcoming matches for this team match."}
                            title={"Scheduled matches"}
                        >
                            <View flexDirection={"row"} flexWrap={"wrap"} justifyContent={"space-between"}>
                                {scheduledMatches.map((matchSummary) => (
                                    <ScheduledMatchCard key={matchSummary.id} matchSummary={matchSummary} />
                                ))}
                            </View>
                        </Section>
                    ) : null}

                    <Section
                        subtitle={"Completed matches and final match scores."}
                        title={"Previous matches"}
                    >
                        {previousMatches.length > 0 ? (
                            <View flexDirection={"row"} flexWrap={"wrap"} justifyContent={"space-between"}>
                                {previousMatches.slice(0, 24).map((matchSummary) => (
                                    <PreviousMatchCard
                                        key={matchSummary.id}
                                        matchSummary={matchSummary}
                                        teamAName={teamAName}
                                        teamBName={teamBName}
                                    />
                                ))}
                            </View>
                        ) : (
                            <View backgroundColor={"white"} borderColor={"gray.200"} borderRadius={8} borderWidth={1} marginTop={3} padding={4}>
                                <Text color={"gray.900"} fontSize={"md"} fontWeight={"bold"}>No previous matches yet.</Text>
                            </View>
                        )}
                    </Section>
                </View>
            </ScrollView>
        </NativeBaseProvider>
    );
}
