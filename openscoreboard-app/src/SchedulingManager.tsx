import React, { useEffect, useMemo, useState } from 'react';
import { Pressable } from 'react-native';
import { FormControl, Input, Modal, NativeBaseProvider, ScrollView, Select, Spinner, Text, View } from 'native-base';
import { AntDesign, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { openScoreboardButtonTextColor, openScoreboardColor, openScoreboardTheme } from '../openscoreboardtheme';
import LoadingPage from './LoadingPage';
import { getImportPlayerList, getMyPlayerLists, getPlayerFormatted } from './functions/players';
import { getScheduledTableMatches } from './functions/tables';
import { getTableInfo } from './functions/scoring';
import { getTeam } from './functions/teams';
import { getTeamMatch } from './functions/teammatches';
import { supportedSports } from './functions/sports';
import { createCompetitionFromScheduledMatches } from './functions/competitions';
import {
    createScheduledMatchesForTable,
    createScheduledMatchesForTeamMatch,
    deleteScheduledMatchForSource,
    finishScheduledMatchForSource,
    getScheduledTeamMatchMatches,
} from './functions/scheduling';

const tableCompetitionTypes = [
    { value: "roundRobin", label: "Round robin" },
    { value: "singleElimination", label: "Single elimination first round" },
];

const teamMatchFormats = [
    { value: "straightOrder", label: "Straight order" },
    { value: "crossTeamRoundRobin", label: "Cross-team round robin" },
    { value: "fiveMatchStarter", label: "Five-match starter" },
];
const maxVisiblePlayerOptions = 24;
const maxRoundRobinPlayers = 12;
const monthOptions = Array.from({ length: 12 }).map((_, index) => {
    const date = new Date(2024, index, 1);
    return {
        label: date.toLocaleString(undefined, { month: "short" }),
        value: `${index + 1}`.padStart(2, "0"),
    };
});
const hourOptions = Array.from({ length: 12 }).map((_, index) => `${index + 1}`);
const minuteOptions = Array.from({ length: 12 }).map((_, index) => `${index * 5}`.padStart(2, "0"));
const intervalMinuteOptions = ["0", "10", "15", "20", "30", "45", "60"];
const scheduledSortOptions = [
    { label: "Soonest first", value: "timeAsc" },
    { label: "Latest first", value: "timeDesc" },
    { label: "Player A-Z", value: "playerAsc" },
    { label: "Score high-low", value: "scoreDesc" },
];

function getDateParts(date = new Date()) {
    return {
        day: `${date.getDate()}`.padStart(2, "0"),
        month: `${date.getMonth() + 1}`.padStart(2, "0"),
        year: `${date.getFullYear()}`,
    };
}

function getYearOptions() {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }).map((_, index) => `${currentYear + index}`);
}

function getDayOptions(year, month) {
    const daysInMonth = new Date(Number(year), Number(month), 0).getDate();
    return Array.from({ length: daysInMonth }).map((_, index) => `${index + 1}`.padStart(2, "0"));
}

function toScheduledDateTime(scheduleOptions, index, intervalMinutes) {
    if (!scheduleOptions?.includeStartTime) {
        return "";
    }

    const rawHour = Number(scheduleOptions.hour || 12);
    const normalizedHour = scheduleOptions.amPm === "PM" ?
        (rawHour === 12 ? 12 : rawHour + 12)
        : (rawHour === 12 ? 0 : rawHour);
    const startDate = new Date(
        Number(scheduleOptions.year),
        Number(scheduleOptions.month) - 1,
        Number(scheduleOptions.day),
        normalizedHour,
        Number(scheduleOptions.minute || 0),
        0,
        0
    );

    if (Number.isNaN(startDate.getTime())) {
        return "";
    }

    return new Date(startDate.getTime() + index * Math.max(0, Number(intervalMinutes) || 0) * 60000).toISOString();
}

function formatDateTime(value) {
    if (!value) {
        return "No start time";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return "No start time";
    }

    return date.toLocaleString(undefined, {
        month: "numeric",
        day: "numeric",
        year: "2-digit",
        hour: "numeric",
        minute: "2-digit",
    });
}

function getEntryID(entry) {
    return entry?.[0] || "";
}

function getEntryPlayer(entry) {
    return entry?.[1] || {};
}

function getEntryName(entry, fallback = "Player") {
    return getPlayerFormatted(getEntryPlayer(entry)) || fallback;
}

function getSourceTitle(sourceType, tableInfo, teamA, teamB) {
    if (sourceType === "teamMatch") {
        return `${teamA?.teamName || "Team A"} vs ${teamB?.teamName || "Team B"}`;
    }

    return tableInfo?.tableName || "Table/Court";
}

function getScheduledMatchSearchText(item) {
    const scheduledMatch = item?.[1] || {};
    return [
        scheduledMatch.playerA,
        scheduledMatch.playerB,
        scheduledMatch.formatName,
        scheduledMatch.matchRound,
        scheduledMatch.teamNameA,
        scheduledMatch.teamNameB,
        formatDateTime(scheduledMatch.startTime || scheduledMatch.scheduledOn),
    ].join(" ").toLowerCase();
}

function getScheduledMatchTime(item) {
    const scheduledMatch = item?.[1] || {};
    const time = new Date(scheduledMatch.startTime || scheduledMatch.scheduledOn || 0).getTime();
    return Number.isNaN(time) ? 0 : time;
}

function toScoreValue(value) {
    const nextValue = parseInt(`${value}`, 10);
    return Number.isNaN(nextValue) ? 0 : Math.max(0, nextValue);
}

function getGamesNeeded(bestOf) {
    return Math.floor(toScoreValue(bestOf || 5) / 2) + 1;
}

function getScheduledBestOf(scheduledMatch) {
    return toScoreValue(scheduledMatch?.bestOf || 5) || 5;
}

function getScheduledPointsToWin(scheduledMatch) {
    return toScoreValue(scheduledMatch?.pointsToWinGame || 11) || 11;
}

function isValidIndividualGameScore(aScore, bScore, pointsToWinGame) {
    const a = toScoreValue(aScore);
    const b = toScoreValue(bScore);

    if (a === b) {
        return false;
    }

    const winnerScore = Math.max(a, b);
    const loserScore = Math.min(a, b);

    return winnerScore >= pointsToWinGame && winnerScore - loserScore >= 2;
}

function getGameWinner(gameScore, pointsToWinGame) {
    const a = toScoreValue(gameScore?.a);
    const b = toScoreValue(gameScore?.b);

    if (!isValidIndividualGameScore(a, b, pointsToWinGame)) {
        return "";
    }

    return a > b ? "A" : "B";
}

function getMatchScoreFromGames(gameScores, pointsToWinGame) {
    return gameScores.reduce((matchScore, gameScore) => {
        const winner = getGameWinner(gameScore, pointsToWinGame);

        if (winner === "A") {
            matchScore.a += 1;
        }
        else if (winner === "B") {
            matchScore.b += 1;
        }

        return matchScore;
    }, { a: 0, b: 0 });
}

function buildDefaultGameScores(winner, bestOf, pointsToWinGame) {
    const gamesNeeded = getGamesNeeded(bestOf);
    return Array.from({ length: gamesNeeded }).map(() => ({
        a: winner === "A" ? pointsToWinGame : 0,
        b: winner === "B" ? pointsToWinGame : 0,
    }));
}

function getInitialGameScores(scheduledMatch) {
    const bestOf = getScheduledBestOf(scheduledMatch);
    const savedGameScores = Array.isArray(scheduledMatch?.gameScores) ? scheduledMatch.gameScores : [];
    return Array.from({ length: bestOf }).map((_, index) => ({
        a: savedGameScores[index]?.a !== undefined ? `${savedGameScores[index].a}` : "",
        b: savedGameScores[index]?.b !== undefined ? `${savedGameScores[index].b}` : "",
    }));
}

function Section({ children, icon, subtitle, title }) {
    return (
        <View
            backgroundColor={"white"}
            borderColor={"gray.200"}
            borderRadius={8}
            borderWidth={1}
            marginTop={4}
            padding={4}
        >
            <View alignItems={"center"} flexDirection={"row"} marginBottom={subtitle ? 3 : 2}>
                <View
                    alignItems={"center"}
                    backgroundColor={"gray.100"}
                    borderRadius={999}
                    height={36}
                    justifyContent={"center"}
                    marginRight={3}
                    width={36}
                >
                    {icon}
                </View>
                <View flex={1}>
                    <Text color={"gray.900"} fontSize={"lg"} fontWeight={"bold"}>{title}</Text>
                    {subtitle ? (
                        <Text color={"gray.600"} fontSize={"sm"} marginTop={1}>{subtitle}</Text>
                    ) : null}
                </View>
            </View>
            {children}
        </View>
    );
}

function ToggleCard({ isSelected, label, meta = "", onPress }) {
    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => ({
                alignItems: "center",
                backgroundColor: pressed ? "#EFF6FF" : isSelected ? openScoreboardColor : "#FFFFFF",
                borderColor: isSelected ? openScoreboardColor : "#DBEAFE",
                borderRadius: 8,
                borderWidth: 1,
                flexDirection: "row",
                marginRight: 8,
                marginTop: 8,
                minHeight: 38,
                opacity: pressed ? 0.8 : 1,
                paddingHorizontal: 12,
                paddingVertical: 8,
            })}
        >
            <MaterialCommunityIcons
                name={isSelected ? "checkbox-marked-circle" : "checkbox-blank-circle-outline"}
                size={18}
                color={isSelected ? openScoreboardButtonTextColor : openScoreboardColor}
            />
            <View marginLeft={2}>
                <Text color={isSelected ? openScoreboardButtonTextColor : "gray.900"} fontSize={"sm"} fontWeight={"bold"} numberOfLines={1}>
                    {label}
                </Text>
                {meta ? (
                    <Text color={isSelected ? "blue.100" : "gray.500"} fontSize={"2xs"} numberOfLines={1}>{meta}</Text>
                ) : null}
            </View>
        </Pressable>
    );
}

function SmallActionButton({ isDanger = false, isDisabled = false, isPrimary = false, label, onPress }) {
    return (
        <Pressable
            disabled={isDisabled}
            onPress={onPress}
            style={({ pressed }) => ({
                alignItems: "center",
                backgroundColor: isDisabled ? "#E4E4E7" : isPrimary ? openScoreboardColor : "#FFFFFF",
                borderColor: isDanger ? "#FCA5A5" : isPrimary ? openScoreboardColor : "#DBEAFE",
                borderRadius: 8,
                borderWidth: 1,
                justifyContent: "center",
                marginRight: 8,
                marginTop: 8,
                minHeight: 36,
                opacity: pressed && !isDisabled ? 0.8 : 1,
                paddingHorizontal: 12,
                paddingVertical: 8,
            })}
        >
            <Text
                color={isDisabled ? "gray.500" : isPrimary ? openScoreboardButtonTextColor : isDanger ? "red.700" : "blue.700"}
                fontSize={"xs"}
                fontWeight={"bold"}
            >
                {label}
            </Text>
        </Pressable>
    );
}

function GeneratedMatchCard({ isSelected, match, onToggle }) {
    return (
        <View
            backgroundColor={isSelected ? "blue.50" : "white"}
            borderColor={isSelected ? "blue.200" : "gray.200"}
            borderRadius={8}
            borderWidth={1}
            marginTop={2}
            padding={3}
        >
            <View alignItems={"center"} flexDirection={"row"}>
                <View flex={1} paddingRight={3}>
                    <Text color={"gray.500"} fontSize={"2xs"} fontWeight={"bold"} textTransform={"uppercase"}>
                        {match.label}
                    </Text>
                    <Text color={"gray.900"} fontSize={"md"} fontWeight={"bold"} marginTop={1}>
                        {getPlayerFormatted(match.playerA)} vs {getPlayerFormatted(match.playerB)}
                    </Text>
                    <Text color={"gray.500"} fontSize={"xs"} marginTop={1}>
                        {formatDateTime(match.startTime)}
                    </Text>
                </View>
                <Pressable
                    onPress={onToggle}
                    style={({ pressed }) => ({
                        backgroundColor: pressed ? "#EFF6FF" : isSelected ? openScoreboardColor : "#FFFFFF",
                        borderColor: isSelected ? openScoreboardColor : "#DBEAFE",
                        borderRadius: 8,
                        borderWidth: 1,
                        opacity: pressed ? 0.8 : 1,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                    })}
                >
                    <Text color={isSelected ? openScoreboardButtonTextColor : "blue.700"} fontSize={"xs"} fontWeight={"bold"}>
                        {isSelected ? "Included" : "Add"}
                    </Text>
                </Pressable>
            </View>
        </View>
    );
}

function ScheduledMatchCard({
    confirmDelete,
    isLoading,
    item,
    onDelete,
    onEnterResult,
}) {
    const scheduledMatch = item?.[1] || {};
    const scheduledID = item?.[0] || "";
    const gameScores = Array.isArray(scheduledMatch.gameScores) ? scheduledMatch.gameScores : [];

    return (
        <View
            backgroundColor={"gray.50"}
            borderColor={"gray.200"}
            borderRadius={8}
            borderWidth={1}
            marginTop={2}
            padding={3}
        >
            <View alignItems={"center"} flexDirection={"row"}>
                <View flex={1}>
                    <Text color={"gray.500"} fontSize={"2xs"} fontWeight={"bold"} textTransform={"uppercase"}>
                        {scheduledMatch.matchRound || scheduledMatch.formatName || "Scheduled match"}
                    </Text>
                    <Text color={"gray.900"} fontSize={"sm"} fontWeight={"bold"}>
                        {scheduledMatch.playerA || "TBD"} vs {scheduledMatch.playerB || "TBD"}
                    </Text>
                    <Text color={"gray.500"} fontSize={"xs"} marginTop={1}>
                        {formatDateTime(scheduledMatch.startTime)}
                    </Text>
                </View>
                {scheduledMatch.formatName ? (
                    <View
                        backgroundColor={"white"}
                        borderColor={"gray.200"}
                        borderRadius={999}
                        borderWidth={1}
                        paddingX={2}
                        paddingY={1}
                    >
                        <Text color={"gray.600"} fontSize={"2xs"} fontWeight={"bold"}>{scheduledMatch.formatName}</Text>
                    </View>
                ) : null}
            </View>
            <View
                alignItems={"center"}
                backgroundColor={"white"}
                borderColor={"gray.200"}
                borderRadius={8}
                borderWidth={1}
                flexDirection={"row"}
                marginTop={3}
                padding={2}
            >
                <View flex={1}>
                    <Text color={"gray.500"} fontSize={"2xs"} fontWeight={"bold"} textTransform={"uppercase"}>Match result</Text>
                    <Text color={"gray.900"} fontSize={"xl"} fontWeight={"bold"} marginTop={1}>
                        {toScoreValue(scheduledMatch.AScore)} - {toScoreValue(scheduledMatch.BScore)}
                    </Text>
                    {gameScores.length > 0 ? (
                        <Text color={"gray.500"} fontSize={"xs"} marginTop={1}>
                            {gameScores.map((gameScore, index) => `G${index + 1}: ${toScoreValue(gameScore.a)}-${toScoreValue(gameScore.b)}`).join("   ")}
                        </Text>
                    ) : (
                        <Text color={"gray.500"} fontSize={"xs"} marginTop={1}>
                            {scheduledMatch.resultMode === "default" ? "Default result" : "No game scores entered"}
                        </Text>
                    )}
                </View>
                <View alignItems={"flex-end"} flexDirection={"row"} flexWrap={"wrap"} justifyContent={"flex-end"}>
                    <SmallActionButton isPrimary label={"Enter result"} onPress={onEnterResult} />
                    <SmallActionButton
                        isDanger
                        isDisabled={isLoading}
                        label={confirmDelete ? "Confirm delete" : "Delete"}
                        onPress={() => onDelete(scheduledID)}
                    />
                </View>
            </View>
        </View>
    );
}

function MatchResultModal({ isOpen, isSaving, item, onClose, onSave }) {
    const scheduledID = item?.[0] || "";
    const scheduledMatch = item?.[1] || {};
    const bestOf = getScheduledBestOf(scheduledMatch);
    const pointsToWinGame = getScheduledPointsToWin(scheduledMatch);
    const gamesNeeded = getGamesNeeded(bestOf);
    const [resultMode, setResultMode] = useState(scheduledMatch.resultMode === "default" ? "default" : "games");
    const [defaultWinner, setDefaultWinner] = useState("A");
    const [gameScores, setGameScores] = useState(getInitialGameScores(scheduledMatch));

    useEffect(() => {
        if (isOpen) {
            setResultMode(scheduledMatch.resultMode === "default" ? "default" : "games");
            setDefaultWinner("A");
            setGameScores(getInitialGameScores(scheduledMatch));
        }
    }, [isOpen, scheduledID]);

    const matchScore = resultMode === "default" ?
        {
            a: defaultWinner === "A" ? gamesNeeded : 0,
            b: defaultWinner === "B" ? gamesNeeded : 0,
        }
        : getMatchScoreFromGames(gameScores, pointsToWinGame);
    const isMatchComplete = matchScore.a >= gamesNeeded || matchScore.b >= gamesNeeded;
    const cleanGameScores = resultMode === "default" ?
        buildDefaultGameScores(defaultWinner, bestOf, pointsToWinGame)
        : gameScores
            .map((gameScore) => ({
                a: toScoreValue(gameScore.a),
                b: toScoreValue(gameScore.b),
            }))
            .filter((gameScore) => isValidIndividualGameScore(gameScore.a, gameScore.b, pointsToWinGame));

    function updateGameScore(index, side, value) {
        const cleanValue = value.replace(/[^0-9]/g, "");
        setGameScores((currentScores) => {
            const nextScores = currentScores.map((gameScore) => ({ ...gameScore }));
            nextScores[index][side] = cleanValue;

            const scoreNumber = parseInt(cleanValue, 10);
            const otherSide = side === "a" ? "b" : "a";
            if (!Number.isNaN(scoreNumber) && scoreNumber < pointsToWinGame - 1 && nextScores[index][otherSide] === "") {
                nextScores[index][otherSide] = `${pointsToWinGame}`;
            }

            return nextScores;
        });
    }

    function saveResult() {
        onSave(item, {
            AScore: matchScore.a,
            BScore: matchScore.b,
            defaultWinner,
            gameScores: cleanGameScores,
            resultMode,
        });
    }

    return (
        <Modal avoidKeyboard isOpen={isOpen} onClose={onClose} size={"full"}>
            <Modal.Content maxWidth={760}>
                <Modal.CloseButton />
                <Modal.Header>Enter scheduled match result</Modal.Header>
                <Modal.Body>
                    <ScrollView>
                        <View
                            backgroundColor={"gray.50"}
                            borderColor={"gray.200"}
                            borderRadius={8}
                            borderWidth={1}
                            padding={3}
                        >
                            <Text color={"gray.900"} fontSize={"md"} fontWeight={"bold"}>
                                {scheduledMatch.playerA || "TBD"} vs {scheduledMatch.playerB || "TBD"}
                            </Text>
                            <Text color={"gray.500"} fontSize={"xs"} marginTop={1}>
                                Best of {bestOf}. First to {pointsToWinGame}, win by 2.
                            </Text>
                        </View>

                        <View flexDirection={"row"} flexWrap={"wrap"} marginTop={3}>
                            <ToggleCard
                                isSelected={resultMode === "games"}
                                label={"Game scores"}
                                meta={"Enter each game"}
                                onPress={() => setResultMode("games")}
                            />
                            <ToggleCard
                                isSelected={resultMode === "default"}
                                label={"Default result"}
                                meta={"Choose winner"}
                                onPress={() => setResultMode("default")}
                            />
                        </View>

                        {resultMode === "default" ? (
                            <View marginTop={3}>
                                <Text color={"gray.900"} fontSize={"sm"} fontWeight={"bold"}>Default winner</Text>
                                <View flexDirection={"row"} flexWrap={"wrap"}>
                                    <ToggleCard
                                        isSelected={defaultWinner === "A"}
                                        label={scheduledMatch.playerA || "Player A"}
                                        meta={`${gamesNeeded}-0 match result`}
                                        onPress={() => setDefaultWinner("A")}
                                    />
                                    <ToggleCard
                                        isSelected={defaultWinner === "B"}
                                        label={scheduledMatch.playerB || "Player B"}
                                        meta={`${gamesNeeded}-0 match result`}
                                        onPress={() => setDefaultWinner("B")}
                                    />
                                </View>
                            </View>
                        ) : (
                            <View marginTop={3}>
                                <View flexDirection={"row"} alignItems={"center"} marginBottom={2}>
                                    <View flex={1}>
                                        <Text color={"gray.500"} fontSize={"2xs"} fontWeight={"bold"} textTransform={"uppercase"}>
                                            {scheduledMatch.playerA || "Player A"}
                                        </Text>
                                    </View>
                                    <View width={72} alignItems={"center"}>
                                        <Text color={"gray.500"} fontSize={"2xs"} fontWeight={"bold"} textTransform={"uppercase"}>Game</Text>
                                    </View>
                                    <View flex={1}>
                                        <Text color={"gray.500"} fontSize={"2xs"} fontWeight={"bold"} textAlign={"right"} textTransform={"uppercase"}>
                                            {scheduledMatch.playerB || "Player B"}
                                        </Text>
                                    </View>
                                </View>
                                {gameScores.map((gameScore, index) => {
                                    const isValidScore = isValidIndividualGameScore(gameScore.a, gameScore.b, pointsToWinGame);

                                    return (
                                        <View key={`game-score-${index}`} alignItems={"center"} flexDirection={"row"} marginBottom={2}>
                                            <View flex={1}>
                                                <Input
                                                    backgroundColor={"white"}
                                                    borderColor={gameScore.a || gameScore.b ? isValidScore ? "green.300" : "amber.300" : "gray.300"}
                                                    color={"gray.900"}
                                                    keyboardType={"numeric"}
                                                    onChangeText={(value) => updateGameScore(index, "a", value)}
                                                    placeholder={"Score"}
                                                    value={`${gameScore.a}`}
                                                />
                                            </View>
                                            <View width={72} alignItems={"center"}>
                                                <Text color={"gray.900"} fontSize={"sm"} fontWeight={"bold"}>Game {index + 1}</Text>
                                            </View>
                                            <View flex={1}>
                                                <Input
                                                    backgroundColor={"white"}
                                                    borderColor={gameScore.a || gameScore.b ? isValidScore ? "green.300" : "amber.300" : "gray.300"}
                                                    color={"gray.900"}
                                                    keyboardType={"numeric"}
                                                    onChangeText={(value) => updateGameScore(index, "b", value)}
                                                    placeholder={"Score"}
                                                    value={`${gameScore.b}`}
                                                />
                                            </View>
                                        </View>
                                    );
                                })}
                                <Text color={isMatchComplete ? "green.700" : "#92400E"} fontSize={"xs"} fontWeight={"bold"} marginTop={1}>
                                    {isMatchComplete ?
                                        `Match result: ${matchScore.a} - ${matchScore.b}`
                                        : `Enter enough valid games for one player to win ${gamesNeeded} game${gamesNeeded === 1 ? "" : "s"}.`}
                                </Text>
                            </View>
                        )}
                    </ScrollView>
                </Modal.Body>
                <Modal.Footer>
                    <View alignItems={"center"} flexDirection={"row"} justifyContent={"flex-end"} width={"100%"}>
                        <SmallActionButton isDisabled={isSaving} label={"Cancel"} onPress={onClose} />
                        <SmallActionButton
                            isPrimary
                            isDisabled={isSaving || (resultMode === "games" && !isMatchComplete)}
                            label={isSaving ? "Saving..." : "Save result"}
                            onPress={saveResult}
                        />
                    </View>
                </Modal.Footer>
            </Modal.Content>
        </Modal>
    );
}

function buildRoundRobinMatches(players) {
    const matches = [];

    for (let playerAIndex = 0; playerAIndex < players.length; playerAIndex++) {
        for (let playerBIndex = playerAIndex + 1; playerBIndex < players.length; playerBIndex++) {
            matches.push([players[playerAIndex], players[playerBIndex]]);
        }
    }

    return matches;
}

function buildSingleEliminationFirstRound(players) {
    const matches = [];
    const half = Math.floor(players.length / 2);

    for (let index = 0; index < half; index++) {
        matches.push([players[index], players[players.length - 1 - index]]);
    }

    return matches;
}

function buildStraightOrderMatches(teamAPlayers, teamBPlayers) {
    const matchCount = Math.min(teamAPlayers.length, teamBPlayers.length);
    return Array.from({ length: matchCount }).map((_, index) => [teamAPlayers[index], teamBPlayers[index]]);
}

function buildFiveMatchStarter(teamAPlayers, teamBPlayers) {
    const pairIndexes = [
        [0, 0],
        [1, 1],
        [2, 2],
        [0, 1],
        [1, 0],
    ];

    return pairIndexes
        .filter(([teamAIndex, teamBIndex]) => teamAPlayers[teamAIndex] && teamBPlayers[teamBIndex])
        .map(([teamAIndex, teamBIndex]) => [teamAPlayers[teamAIndex], teamBPlayers[teamBIndex]]);
}

export default function SchedulingManager(props) {
    const routeParams = props.route?.params || {};
    const sourceType = routeParams.sourceType || (routeParams.teamMatchID ? "teamMatch" : "table");
    const sourceID = routeParams.sourceID || routeParams.tableID || routeParams.teamMatchID || "";
    const [doneLoading, setDoneLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [tableInfo, setTableInfo] = useState({});
    const [teamMatch, setTeamMatch] = useState({});
    const [teamA, setTeamA] = useState({});
    const [teamB, setTeamB] = useState({});
    const [playerLists, setPlayerLists] = useState([]);
    const [selectedPlayerListID, setSelectedPlayerListID] = useState(routeParams.playerListID || "");
    const [playerEntries, setPlayerEntries] = useState([]);
    const [playerSearch, setPlayerSearch] = useState("");
    const [selectedPlayerIDs, setSelectedPlayerIDs] = useState({});
    const [selectedTeamAPlayerIDs, setSelectedTeamAPlayerIDs] = useState({});
    const [selectedTeamBPlayerIDs, setSelectedTeamBPlayerIDs] = useState({});
    const [competitionType, setCompetitionType] = useState(sourceType === "teamMatch" ? "teamMatch" : "roundRobin");
    const [teamFormat, setTeamFormat] = useState("straightOrder");
    const initialStartDate = getDateParts();
    const [includeStartTime, setIncludeStartTime] = useState(false);
    const [startYear, setStartYear] = useState(initialStartDate.year);
    const [startMonth, setStartMonth] = useState(initialStartDate.month);
    const [startDay, setStartDay] = useState(initialStartDate.day);
    const [startHour, setStartHour] = useState("9");
    const [startMinute, setStartMinute] = useState("00");
    const [startAmPm, setStartAmPm] = useState("AM");
    const [intervalMinutes, setIntervalMinutes] = useState("15");
    const [matchRound, setMatchRound] = useState("");
    const [showGenerator, setShowGenerator] = useState(false);
    const [selectedGeneratedMatches, setSelectedGeneratedMatches] = useState({});
    const [scheduledMatches, setScheduledMatches] = useState([]);
    const [scheduledSearch, setScheduledSearch] = useState("");
    const [scheduledSort, setScheduledSort] = useState("timeAsc");
    const [resultModalMatch, setResultModalMatch] = useState(null);
    const [confirmDeleteScheduledID, setConfirmDeleteScheduledID] = useState("");
    const [scheduledActionLoadingID, setScheduledActionLoadingID] = useState("");
    const [statusMessage, setStatusMessage] = useState("");

    const sportName = routeParams.sportName || tableInfo?.sportName || teamMatch?.sportName || "tableTennis";
    const scoringType = routeParams.scoringType || tableInfo?.scoringType || teamMatch?.scoringType || "";
    const sportDisplayName = supportedSports[sportName]?.displayName || sportName || "Table Tennis";
    const sourceTitle = getSourceTitle(sourceType, tableInfo, teamA, teamB);
    const isStatusWarning = statusMessage.toLowerCase().startsWith("select");
    const dayOptions = useMemo(() => getDayOptions(startYear, startMonth), [startMonth, startYear]);
    const yearOptions = useMemo(() => getYearOptions(), []);

    useEffect(() => {
        if (!dayOptions.includes(startDay)) {
            setStartDay(dayOptions[dayOptions.length - 1]);
        }
    }, [dayOptions, startDay]);

    async function loadScheduledMatches() {
        if (!sourceID) {
            setScheduledMatches([]);
            return;
        }

        const matches = sourceType === "teamMatch" ?
            await getScheduledTeamMatchMatches(sourceID)
            : await getScheduledTableMatches(sourceID);

        setScheduledMatches(matches.sort((a, b) => {
            return new Date(a?.[1]?.startTime || a?.[1]?.scheduledOn || 0).getTime() -
                new Date(b?.[1]?.startTime || b?.[1]?.scheduledOn || 0).getTime();
        }));
    }

    useEffect(() => {
        async function loadSource() {
            setDoneLoading(false);

            if (sourceType === "teamMatch") {
                const nextTeamMatch = await getTeamMatch(sourceID) || {};
                const [nextTeamA, nextTeamB] = await Promise.all([
                    nextTeamMatch.teamAID ? getTeam(nextTeamMatch.teamAID) : null,
                    nextTeamMatch.teamBID ? getTeam(nextTeamMatch.teamBID) : null,
                ]);
                setTeamMatch(nextTeamMatch);
                setTeamA(nextTeamA || {});
                setTeamB(nextTeamB || {});
                setSelectedTeamAPlayerIDs(Object.keys(nextTeamA?.players || {}).reduce((selectedPlayers, playerID) => {
                    selectedPlayers[playerID] = true;
                    return selectedPlayers;
                }, {}));
                setSelectedTeamBPlayerIDs(Object.keys(nextTeamB?.players || {}).reduce((selectedPlayers, playerID) => {
                    selectedPlayers[playerID] = true;
                    return selectedPlayers;
                }, {}));
            }
            else {
                const [nextTableInfo, nextPlayerLists] = await Promise.all([
                    getTableInfo(sourceID),
                    getMyPlayerLists(),
                ]);
                setTableInfo(nextTableInfo || {});
                setPlayerLists(nextPlayerLists || []);
                setSelectedPlayerListID(routeParams.playerListID || nextTableInfo?.playerListID || nextPlayerLists?.[0]?.[1]?.id || "");
            }

            await loadScheduledMatches();
            setDoneLoading(true);
        }

        loadSource();
    }, [sourceID, sourceType]);

    useEffect(() => {
        async function loadPlayerList() {
            if (!selectedPlayerListID || sourceType === "teamMatch") {
                setPlayerEntries([]);
                return;
            }

            const players = await getImportPlayerList(selectedPlayerListID);
            setPlayerEntries(players);
            setSelectedPlayerIDs({});
            setPlayerSearch("");
        }

        loadPlayerList();
    }, [selectedPlayerListID, sourceType]);

    const selectedPlayers = useMemo(() => {
        return playerEntries.filter((entry) => selectedPlayerIDs[getEntryID(entry)]);
    }, [playerEntries, selectedPlayerIDs]);
    const normalizedPlayerSearch = playerSearch.trim().toLowerCase();
    const filteredPlayerEntries = useMemo(() => {
        if (!normalizedPlayerSearch) {
            return playerEntries;
        }

        return playerEntries.filter((entry) => {
            const player = getEntryPlayer(entry);
            return `${getEntryName(entry)} ${player.firstName || ""} ${player.lastName || ""}`.toLowerCase().includes(normalizedPlayerSearch);
        });
    }, [normalizedPlayerSearch, playerEntries]);
    const visiblePlayerEntries = useMemo(() => {
        return filteredPlayerEntries.slice(0, maxVisiblePlayerOptions);
    }, [filteredPlayerEntries]);
    const hiddenPlayerCount = Math.max(0, filteredPlayerEntries.length - visiblePlayerEntries.length);
    const selectedPlayerCount = selectedPlayers.length;
    const isRoundRobinTooLarge = sourceType !== "teamMatch" &&
        competitionType === "roundRobin" &&
        selectedPlayerCount > maxRoundRobinPlayers;

    const selectedTeamAPlayers = useMemo(() => {
        return Object.entries(teamA?.players || {}).filter(([playerID]) => selectedTeamAPlayerIDs[playerID]);
    }, [teamA, selectedTeamAPlayerIDs]);

    const selectedTeamBPlayers = useMemo(() => {
        return Object.entries(teamB?.players || {}).filter(([playerID]) => selectedTeamBPlayerIDs[playerID]);
    }, [teamB, selectedTeamBPlayerIDs]);

    const generatedMatches = useMemo(() => {
        if (sourceType !== "teamMatch" && competitionType === "roundRobin" && selectedPlayers.length > maxRoundRobinPlayers) {
            return [];
        }

        const pairings = sourceType === "teamMatch" ?
            (
                teamFormat === "crossTeamRoundRobin" ?
                    selectedTeamAPlayers.flatMap((teamAPlayer) => selectedTeamBPlayers.map((teamBPlayer) => [teamAPlayer, teamBPlayer]))
                    : teamFormat === "fiveMatchStarter" ?
                        buildFiveMatchStarter(selectedTeamAPlayers, selectedTeamBPlayers)
                        : buildStraightOrderMatches(selectedTeamAPlayers, selectedTeamBPlayers)
            )
            : competitionType === "singleElimination" ?
                buildSingleEliminationFirstRound(selectedPlayers)
                : buildRoundRobinMatches(selectedPlayers);

        return pairings.map(([playerAEntry, playerBEntry], index) => ({
            bracketRoundIndex: sourceType !== "teamMatch" && competitionType === "singleElimination" ? 0 : "",
            bracketSeedIndex: sourceType !== "teamMatch" && competitionType === "singleElimination" ? index : "",
            competitionSlotID: sourceType !== "teamMatch" ?
                (competitionType === "singleElimination" ? `round-0-seed-${index}` : `group-1-match-${index + 1}`)
                : "",
            competitionType,
            formatName: sourceType === "teamMatch" ?
                teamMatchFormats.find((format) => format.value === teamFormat)?.label
                : tableCompetitionTypes.find((format) => format.value === competitionType)?.label,
            groupID: sourceType !== "teamMatch" && competitionType === "roundRobin" ? "group-1" : "",
            key: `${getEntryID(playerAEntry)}-${getEntryID(playerBEntry)}-${index}`,
            label: sourceType === "teamMatch" ? `Team match ${index + 1}` : `Match ${index + 1}`,
            matchRound,
            order: index + 1,
            playerA: getEntryPlayer(playerAEntry),
            playerB: getEntryPlayer(playerBEntry),
            startTime: toScheduledDateTime({
                amPm: startAmPm,
                day: startDay,
                hour: startHour,
                includeStartTime,
                minute: startMinute,
                month: startMonth,
                year: startYear,
            }, index, intervalMinutes),
            teamNameA: sourceType === "teamMatch" ? teamA?.teamName || "Team A" : "",
            teamNameB: sourceType === "teamMatch" ? teamB?.teamName || "Team B" : "",
        }));
    }, [
        competitionType,
        includeStartTime,
        intervalMinutes,
        matchRound,
        selectedPlayers,
        selectedTeamAPlayers,
        selectedTeamBPlayers,
        sourceType,
        startAmPm,
        startDay,
        startHour,
        startMinute,
        startMonth,
        startYear,
        teamA,
        teamB,
        teamFormat,
    ]);
    const generatedMatchSignature = useMemo(() => {
        return generatedMatches.map((match) => match.key).join("|");
    }, [generatedMatches]);
    const filteredScheduledMatches = useMemo(() => {
        const normalizedSearch = scheduledSearch.trim().toLowerCase();
        const matches = normalizedSearch ?
            scheduledMatches.filter((scheduledMatch) => getScheduledMatchSearchText(scheduledMatch).includes(normalizedSearch))
            : scheduledMatches;

        return [...matches].sort((a, b) => {
            if (scheduledSort === "timeDesc") {
                return getScheduledMatchTime(b) - getScheduledMatchTime(a);
            }

            if (scheduledSort === "playerAsc") {
                return `${a?.[1]?.playerA || ""} ${a?.[1]?.playerB || ""}`.localeCompare(`${b?.[1]?.playerA || ""} ${b?.[1]?.playerB || ""}`);
            }

            if (scheduledSort === "scoreDesc") {
                return (toScoreValue(b?.[1]?.AScore) + toScoreValue(b?.[1]?.BScore)) -
                    (toScoreValue(a?.[1]?.AScore) + toScoreValue(a?.[1]?.BScore));
            }

            return getScheduledMatchTime(a) - getScheduledMatchTime(b);
        });
    }, [scheduledMatches, scheduledSearch, scheduledSort]);

    useEffect(() => {
        setSelectedGeneratedMatches(generatedMatches.reduce((selectedMatches, match) => {
            selectedMatches[match.key] = true;
            return selectedMatches;
        }, {}));
    }, [generatedMatchSignature]);

    function toggleSelectedPlayer(playerID) {
        setSelectedPlayerIDs((currentSelections) => ({
            ...currentSelections,
            [playerID]: !currentSelections[playerID],
        }));
    }

    function selectVisiblePlayers() {
        setSelectedPlayerIDs((currentSelections) => {
            const nextSelections = { ...currentSelections };
            visiblePlayerEntries.forEach((entry) => {
                nextSelections[getEntryID(entry)] = true;
            });
            return nextSelections;
        });
    }

    function clearSelectedPlayers() {
        setSelectedPlayerIDs({});
    }

    function toggleSelectedTeamPlayer(side, playerID) {
        const setter = side === "A" ? setSelectedTeamAPlayerIDs : setSelectedTeamBPlayerIDs;
        setter((currentSelections) => ({
            ...currentSelections,
            [playerID]: !currentSelections[playerID],
        }));
    }

    async function scheduleSelectedMatches() {
        const matchesToCreate = generatedMatches.filter((match) => selectedGeneratedMatches[match.key]);
        if (matchesToCreate.length === 0) {
            setStatusMessage("Select at least one generated match to schedule.");
            return;
        }

        setSaving(true);
        setStatusMessage("");
        try {
            let createdScheduledMatches = [];
            const formatName = sourceType === "teamMatch" ?
                teamMatchFormats.find((format) => format.value === teamFormat)?.label
                : tableCompetitionTypes.find((format) => format.value === competitionType)?.label;

            if (sourceType === "teamMatch") {
                createdScheduledMatches = await createScheduledMatchesForTeamMatch(sourceID, matchesToCreate, {
                    competitionType,
                    formatName,
                    scoringType,
                    sportName,
                });
            }
            else {
                createdScheduledMatches = await createScheduledMatchesForTable(sourceID, matchesToCreate, {
                    competitionType,
                    formatName,
                    scoringType,
                    sportName,
                });
                await createCompetitionFromScheduledMatches({
                    competitionType,
                    formatName,
                    scoringType,
                    sourceID,
                    sourceTitle,
                    sourceType,
                    sportName,
                    title: `${sourceTitle} ${formatName}`,
                }, createdScheduledMatches);
            }
            await loadScheduledMatches();
            setStatusMessage(`Scheduled ${matchesToCreate.length} match${matchesToCreate.length === 1 ? "" : "es"}.`);
            setShowGenerator(false);
        }
        finally {
            setSaving(false);
        }
    }

    async function saveScheduledMatchResult(scheduledMatch, result) {
        const scheduledID = scheduledMatch?.[0] || "";
        const scheduledData = scheduledMatch?.[1] || {};
        if (!scheduledID) {
            return;
        }

        setScheduledActionLoadingID(scheduledID);
        setStatusMessage("");
        try {
            await finishScheduledMatchForSource(
                sourceType,
                sourceID,
                scheduledID,
                scheduledData.matchID || "",
                result
            );
            setResultModalMatch(null);
            await loadScheduledMatches();
            setStatusMessage("Scheduled match result saved.");
        }
        finally {
            setScheduledActionLoadingID("");
        }
    }

    async function deleteScheduledMatch(scheduledID) {
        if (!scheduledID) {
            return;
        }

        if (confirmDeleteScheduledID !== scheduledID) {
            setConfirmDeleteScheduledID(scheduledID);
            return;
        }

        setScheduledActionLoadingID(scheduledID);
        setStatusMessage("");
        try {
            await deleteScheduledMatchForSource(sourceType, sourceID, scheduledID);
            setConfirmDeleteScheduledID("");
            if (resultModalMatch?.[0] === scheduledID) {
                setResultModalMatch(null);
            }
            await loadScheduledMatches();
            setStatusMessage("Scheduled match deleted.");
        }
        finally {
            setScheduledActionLoadingID("");
        }
    }

    if (!doneLoading) {
        return <LoadingPage />;
    }

    return (
        <NativeBaseProvider theme={openScoreboardTheme}>
            <ScrollView backgroundColor={"gray.50"}>
                <View padding={4}>
                    <View
                        backgroundColor={"white"}
                        borderColor={"gray.200"}
                        borderRadius={8}
                        borderWidth={1}
                        padding={4}
                    >
                        <Text color={"gray.900"} fontSize={"3xl"} fontWeight={"bold"}>Scheduling Manager</Text>
                        <Text color={"gray.600"} fontSize={"sm"} marginTop={1}>
                            Generate scheduled matches from competition formats, then push selected matches to this {sourceType === "teamMatch" ? "team match" : "table"}.
                        </Text>
                        <View flexDirection={"row"} flexWrap={"wrap"} marginTop={3}>
                            <View
                                backgroundColor={"blue.50"}
                                borderColor={"blue.100"}
                                borderRadius={999}
                                borderWidth={1}
                                marginRight={2}
                                marginTop={2}
                                paddingX={3}
                                paddingY={1}
                            >
                                <Text color={"blue.800"} fontSize={"xs"} fontWeight={"bold"}>{sourceTitle}</Text>
                            </View>
                            <View
                                backgroundColor={"gray.100"}
                                borderColor={"gray.200"}
                                borderRadius={999}
                                borderWidth={1}
                                marginRight={2}
                                marginTop={2}
                                paddingX={3}
                                paddingY={1}
                            >
                                <Text color={"gray.700"} fontSize={"xs"} fontWeight={"bold"}>{sportDisplayName}</Text>
                            </View>
                        </View>
                    </View>

                    <Section
                        icon={<MaterialCommunityIcons name="calendar-clock" size={20} color={openScoreboardColor} />}
                        title={"Scheduled matches"}
                        subtitle={"Manage matches already pushed to this source."}
                    >
                        <View alignItems={"center"} flexDirection={"row"} flexWrap={"wrap"} marginBottom={3}>
                            <View flexBasis={0} flexGrow={1} minWidth={220} marginRight={3} marginTop={2}>
                                <Input
                                    backgroundColor={"white"}
                                    borderColor={"gray.300"}
                                    color={"gray.900"}
                                    onChangeText={setScheduledSearch}
                                    placeholder={"Search scheduled matches"}
                                    value={scheduledSearch}
                                />
                            </View>
                            <View marginRight={3} marginTop={2} minWidth={180}>
                                <Select selectedValue={scheduledSort} onValueChange={setScheduledSort}>
                                    {scheduledSortOptions.map((option) => (
                                        <Select.Item key={option.value} label={option.label} value={option.value} />
                                    ))}
                                </Select>
                            </View>
                            <SmallActionButton
                                isPrimary
                                label={"Add scheduled matches"}
                                onPress={() => setShowGenerator(true)}
                            />
                        </View>
                        <Text color={"gray.500"} fontSize={"xs"} marginBottom={2}>
                            Showing {filteredScheduledMatches.length} of {scheduledMatches.length} scheduled match{scheduledMatches.length === 1 ? "" : "es"}.
                        </Text>
                        {statusMessage ? (
                            <View
                                backgroundColor={isStatusWarning ? "#FFFBEB" : "green.50"}
                                borderColor={isStatusWarning ? "#FDE68A" : "green.200"}
                                borderRadius={8}
                                borderWidth={1}
                                marginBottom={3}
                                padding={3}
                            >
                                <Text color={isStatusWarning ? "#92400E" : "green.800"} fontSize={"sm"} fontWeight={"bold"}>{statusMessage}</Text>
                            </View>
                        ) : null}
                        {filteredScheduledMatches.length > 0 ? filteredScheduledMatches.map((scheduledMatch) => (
                            <ScheduledMatchCard
                                key={scheduledMatch?.[0]}
                                confirmDelete={confirmDeleteScheduledID === scheduledMatch?.[0]}
                                isLoading={scheduledActionLoadingID === scheduledMatch?.[0]}
                                item={scheduledMatch}
                                onDelete={deleteScheduledMatch}
                                onEnterResult={() => {
                                    setResultModalMatch(scheduledMatch);
                                    setConfirmDeleteScheduledID("");
                                }}
                            />
                        )) : (
                            <View
                                backgroundColor={"gray.50"}
                                borderColor={"gray.200"}
                                borderRadius={8}
                                borderWidth={1}
                                padding={3}
                            >
                                <Text color={"gray.600"} fontSize={"sm"}>
                                    {scheduledMatches.length > 0 ? "No scheduled matches match that search." : "No matches have been scheduled yet."}
                                </Text>
                            </View>
                        )}
                    </Section>

                    <Modal isOpen={showGenerator} onClose={() => setShowGenerator(false)} size={"full"}>
                        <Modal.Content maxWidth={960}>
                            <Modal.CloseButton />
                            <Modal.Header>Add scheduled matches</Modal.Header>
                            <Modal.Body>
                                <ScrollView>
                                    <View paddingBottom={3}>
                    <Section
                        icon={<MaterialCommunityIcons name="tournament" size={20} color={openScoreboardColor} />}
                        title={"Competition format"}
                        subtitle={sourceType === "teamMatch" ? "Team matches use team-vs-team formats." : "Choose how matches should be generated from the selected player list."}
                    >
                        {sourceType === "teamMatch" ? (
                            <FormControl>
                                <FormControl.Label>Team match format</FormControl.Label>
                                <Select selectedValue={teamFormat} onValueChange={setTeamFormat}>
                                    {teamMatchFormats.map((format) => (
                                        <Select.Item key={format.value} label={format.label} value={format.value} />
                                    ))}
                                </Select>
                            </FormControl>
                        ) : (
                            <>
                                <FormControl>
                                    <FormControl.Label>Competition type</FormControl.Label>
                                    <Select selectedValue={competitionType} onValueChange={setCompetitionType}>
                                        {tableCompetitionTypes.map((format) => (
                                            <Select.Item key={format.value} label={format.label} value={format.value} />
                                        ))}
                                    </Select>
                                </FormControl>
                                <FormControl marginTop={3}>
                                    <FormControl.Label>Player list</FormControl.Label>
                                    <Select selectedValue={selectedPlayerListID} onValueChange={setSelectedPlayerListID}>
                                        {playerLists.map((playerList) => (
                                            <Select.Item key={playerList?.[1]?.id} label={playerList?.[1]?.playerListName || "Player list"} value={playerList?.[1]?.id} />
                                        ))}
                                    </Select>
                                </FormControl>
                            </>
                        )}
                    </Section>

                    <Section
                        icon={<MaterialCommunityIcons name="clock-outline" size={20} color={openScoreboardColor} />}
                        title={"Schedule details"}
                        subtitle={"Start times are optional. Leave them off when you only need match order."}
                    >
                        <Pressable
                            onPress={() => setIncludeStartTime((currentValue) => !currentValue)}
                            style={({ pressed }) => ({
                                alignItems: "center",
                                backgroundColor: pressed ? "#EFF6FF" : includeStartTime ? "#EFF6FF" : "#FFFFFF",
                                borderColor: includeStartTime ? openScoreboardColor : "#DBEAFE",
                                borderRadius: 8,
                                borderWidth: 1,
                                flexDirection: "row",
                                minHeight: 44,
                                opacity: pressed ? 0.82 : 1,
                                paddingHorizontal: 12,
                                paddingVertical: 10,
                            })}
                        >
                            <MaterialCommunityIcons
                                name={includeStartTime ? "checkbox-marked" : "checkbox-blank-outline"}
                                size={22}
                                color={includeStartTime ? openScoreboardColor : "#71717A"}
                            />
                            <View marginLeft={3} flex={1}>
                                <Text color={"gray.900"} fontSize={"sm"} fontWeight={"bold"}>Add start times to generated matches</Text>
                                <Text color={"gray.500"} fontSize={"xs"} marginTop={1}>
                                    When enabled, each match gets a start time using the first time and minutes apart.
                                </Text>
                            </View>
                        </Pressable>
                        {includeStartTime ? (
                            <>
                                <View flexDirection={"row"} flexWrap={"wrap"} marginTop={3}>
                                    <View marginRight={3} marginTop={2} width={110}>
                                        <FormControl>
                                            <FormControl.Label>Month</FormControl.Label>
                                            <Select selectedValue={startMonth} onValueChange={setStartMonth}>
                                                {monthOptions.map((month) => (
                                                    <Select.Item key={month.value} label={month.label} value={month.value} />
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </View>
                                    <View marginRight={3} marginTop={2} width={90}>
                                        <FormControl>
                                            <FormControl.Label>Day</FormControl.Label>
                                            <Select selectedValue={startDay} onValueChange={setStartDay}>
                                                {dayOptions.map((day) => (
                                                    <Select.Item key={day} label={day} value={day} />
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </View>
                                    <View marginRight={3} marginTop={2} width={110}>
                                        <FormControl>
                                            <FormControl.Label>Year</FormControl.Label>
                                            <Select selectedValue={startYear} onValueChange={setStartYear}>
                                                {yearOptions.map((year) => (
                                                    <Select.Item key={year} label={year} value={year} />
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </View>
                                    <View marginRight={3} marginTop={2} width={90}>
                                        <FormControl>
                                            <FormControl.Label>Hour</FormControl.Label>
                                            <Select selectedValue={startHour} onValueChange={setStartHour}>
                                                {hourOptions.map((hour) => (
                                                    <Select.Item key={hour} label={hour} value={hour} />
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </View>
                                    <View marginRight={3} marginTop={2} width={100}>
                                        <FormControl>
                                            <FormControl.Label>Minute</FormControl.Label>
                                            <Select selectedValue={startMinute} onValueChange={setStartMinute}>
                                                {minuteOptions.map((minute) => (
                                                    <Select.Item key={minute} label={minute} value={minute} />
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </View>
                                    <View marginRight={3} marginTop={2} width={90}>
                                        <FormControl>
                                            <FormControl.Label>AM/PM</FormControl.Label>
                                            <Select selectedValue={startAmPm} onValueChange={setStartAmPm}>
                                                <Select.Item label="AM" value="AM" />
                                                <Select.Item label="PM" value="PM" />
                                            </Select>
                                        </FormControl>
                                    </View>
                                    <View marginTop={2} width={140}>
                                        <FormControl>
                                            <FormControl.Label>Minutes apart</FormControl.Label>
                                            <Select selectedValue={intervalMinutes} onValueChange={setIntervalMinutes}>
                                                {intervalMinuteOptions.map((minutes) => (
                                                    <Select.Item key={minutes} label={`${minutes}`} value={minutes} />
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </View>
                                </View>
                            </>
                        ) : null}
                        <View marginTop={3} maxWidth={260}>
                            <FormControl>
                                <FormControl.Label>Round label</FormControl.Label>
                                <Select selectedValue={matchRound} onValueChange={setMatchRound}>
                                    <Select.Item label="None" value="" />
                                    <Select.Item label="RR - Round Robin" value="RR" />
                                    <Select.Item label="R16 - Round of 16" value="R16" />
                                    <Select.Item label="QF - Quarter-final" value="QF" />
                                    <Select.Item label="SF - Semi-final" value="SF" />
                                    <Select.Item label="F - Final" value="F" />
                                </Select>
                            </FormControl>
                        </View>
                    </Section>

                    <Section
                        icon={<FontAwesome5 name="users" size={16} color={openScoreboardColor} />}
                        title={sourceType === "teamMatch" ? "Eligible players" : "Players"}
                        subtitle={"Select the players that should be used when generating the schedule."}
                    >
                        {sourceType === "teamMatch" ? (
                            <View flexDirection={"row"} flexWrap={"wrap"}>
                                <View flexBasis={0} flexGrow={1} minWidth={260} paddingRight={2}>
                                    <Text color={"gray.900"} fontSize={"sm"} fontWeight={"bold"}>{teamA?.teamName || "Team A"}</Text>
                                    <View flexDirection={"row"} flexWrap={"wrap"}>
                                        {Object.entries(teamA?.players || {}).map(([playerID, player]) => (
                                            <ToggleCard
                                                key={`team-a-${playerID}`}
                                                isSelected={selectedTeamAPlayerIDs[playerID]}
                                                label={getPlayerFormatted(player) || "Player"}
                                                onPress={() => toggleSelectedTeamPlayer("A", playerID)}
                                            />
                                        ))}
                                    </View>
                                </View>
                                <View flexBasis={0} flexGrow={1} minWidth={260} paddingLeft={2}>
                                    <Text color={"gray.900"} fontSize={"sm"} fontWeight={"bold"}>{teamB?.teamName || "Team B"}</Text>
                                    <View flexDirection={"row"} flexWrap={"wrap"}>
                                        {Object.entries(teamB?.players || {}).map(([playerID, player]) => (
                                            <ToggleCard
                                                key={`team-b-${playerID}`}
                                                isSelected={selectedTeamBPlayerIDs[playerID]}
                                                label={getPlayerFormatted(player) || "Player"}
                                                onPress={() => toggleSelectedTeamPlayer("B", playerID)}
                                            />
                                        ))}
                                    </View>
                                </View>
                            </View>
                        ) : (
                            <>
                                {playerEntries.length > 0 ? (
                                    <>
                                        <Input
                                            backgroundColor={"white"}
                                            borderColor={"gray.300"}
                                            color={"gray.900"}
                                            onChangeText={setPlayerSearch}
                                            placeholder={"Search players to add"}
                                            value={playerSearch}
                                        />
                                        <View alignItems={"center"} flexDirection={"row"} flexWrap={"wrap"} marginTop={2}>
                                            <Text color={"gray.600"} fontSize={"xs"} marginRight={2} marginTop={2}>
                                                {selectedPlayerCount} selected. Showing {visiblePlayerEntries.length} of {filteredPlayerEntries.length} matching players.
                                            </Text>
                                            <SmallActionButton
                                                isPrimary
                                                isDisabled={visiblePlayerEntries.length === 0}
                                                label={"Select shown"}
                                                onPress={selectVisiblePlayers}
                                            />
                                            <SmallActionButton
                                                isDisabled={selectedPlayerCount === 0}
                                                label={"Clear"}
                                                onPress={clearSelectedPlayers}
                                            />
                                        </View>
                                        <View flexDirection={"row"} flexWrap={"wrap"} marginTop={1}>
                                            {visiblePlayerEntries.map((entry) => (
                                                <ToggleCard
                                                    key={getEntryID(entry)}
                                                    isSelected={selectedPlayerIDs[getEntryID(entry)]}
                                                    label={getEntryName(entry)}
                                                    onPress={() => toggleSelectedPlayer(getEntryID(entry))}
                                                />
                                            ))}
                                        </View>
                                        {hiddenPlayerCount > 0 ? (
                                            <Text color={"gray.500"} fontSize={"xs"} marginTop={2}>
                                                {hiddenPlayerCount} more matching players hidden. Search by name to narrow the list.
                                            </Text>
                                        ) : null}
                                    </>
                                ) : (
                                    <Text color={"gray.600"} fontSize={"sm"}>Select a player list with players to generate matches.</Text>
                                )}
                            </>
                        )}
                    </Section>

                    <Section
                        icon={<AntDesign name="calendar" size={18} color={openScoreboardColor} />}
                        title={"Generated schedule"}
                        subtitle={`${generatedMatches.length} possible match${generatedMatches.length === 1 ? "" : "es"} generated from the current format.`}
                    >
                        {generatedMatches.length > 0 ? (
                            <>
                                {generatedMatches.map((match) => (
                                    <GeneratedMatchCard
                                        key={match.key}
                                        isSelected={selectedGeneratedMatches[match.key]}
                                        match={match}
                                        onToggle={() => {
                                            setSelectedGeneratedMatches((currentSelections) => ({
                                                ...currentSelections,
                                                [match.key]: !currentSelections[match.key],
                                            }));
                                        }}
                                    />
                                ))}
                                <Pressable
                                    disabled={saving}
                                    onPress={scheduleSelectedMatches}
                                    style={({ pressed }) => ({
                                        alignItems: "center",
                                        alignSelf: "flex-start",
                                        backgroundColor: saving ? "#A1A1AA" : openScoreboardColor,
                                        borderRadius: 8,
                                        justifyContent: "center",
                                        marginTop: 16,
                                        minHeight: 42,
                                        opacity: pressed && !saving ? 0.82 : 1,
                                        paddingHorizontal: 16,
                                        paddingVertical: 10,
                                    })}
                                >
                                    {saving ? (
                                        <Spinner color={openScoreboardButtonTextColor} size={"sm"} />
                                    ) : (
                                        <Text color={openScoreboardButtonTextColor} fontWeight={"bold"}>Schedule selected matches</Text>
                                    )}
                                </Pressable>
                                {statusMessage ? (
                                    <Text color={"green.700"} fontSize={"sm"} fontWeight={"bold"} marginTop={3}>{statusMessage}</Text>
                                ) : null}
                            </>
                        ) : (
                            <View
                                backgroundColor={isRoundRobinTooLarge ? "#FFFBEB" : "gray.50"}
                                borderColor={isRoundRobinTooLarge ? "#FDE68A" : "gray.200"}
                                borderRadius={8}
                                borderWidth={1}
                                padding={3}
                            >
                                <Text color={isRoundRobinTooLarge ? "#92400E" : "gray.600"} fontSize={"sm"} fontWeight={isRoundRobinTooLarge ? "bold" : "normal"}>
                                    {isRoundRobinTooLarge ?
                                        `Round robin is limited to ${maxRoundRobinPlayers} selected players on this page. Split larger lists into groups or choose a smaller group.`
                                        : "Select at least two players to generate matches."}
                                </Text>
                            </View>
                        )}
                    </Section>
                                    </View>
                                </ScrollView>
                            </Modal.Body>
                        </Modal.Content>
                    </Modal>
                </View>
            </ScrollView>
            <MatchResultModal
                isOpen={!!resultModalMatch}
                isSaving={!!scheduledActionLoadingID}
                item={resultModalMatch}
                onClose={() => setResultModalMatch(null)}
                onSave={saveScheduledMatchResult}
            />
        </NativeBaseProvider>
    );
}
