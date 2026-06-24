import React, { useEffect, useMemo, useState } from 'react';
import { Button, FormControl, Input, Menu, Modal, NativeBaseProvider, ScrollView, Select, Spinner, Switch, Text, TextArea, View } from 'native-base';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Platform, Pressable } from 'react-native';
import { openScoreboardButtonTextColor, openScoreboardColor, openScoreboardTheme } from '../openscoreboardtheme';
import { scoreboardBaseURL } from '../openscoreboard.config';
import LoadingPage from './LoadingPage';
import {
    bracketRoundConfig,
    generateEmptyBracket,
    getCompetition,
    getCompetitionSportLabel,
    normalizeCompetitionSportName,
    subscribeToCompetition,
    updateCompetition,
} from './functions/competitions';
import { getMyTables } from './functions/tables';
import { addImportedPlayer as addPlayerToList, getImportPlayerList, getMyPlayerLists, getPlayerFormatted } from './functions/players';
import {
    createScheduledMatchesForTable,
    deleteScheduledMatchForSource,
    finishScheduledMatchForSource,
    getScheduledMatchForSource,
} from './functions/scheduling';
import { getMyBracketGroupStyles } from './functions/bracketGroupStyles';
import { CopyInputRightButton } from './components/CopyButton';
import TeamTournamentManager from './TeamTournamentManager';

function getCompetitionTitle(competition) {
    return competition?.data?.title || competition?.title || "Competition";
}

function getCompetitionTypeLabel(type) {
    if (type === "roundRobin") {
        return "Round robin group";
    }
    if (type === "roundRobinThenSingleElimination") {
        return "Groups + single elimination";
    }
    return "Single elimination bracket";
}

function getCompetitionDisplayPath(type) {
    return type === "roundRobin" ? "groups" : "brackets";
}

function getCompetitionDisplayTypes(competitionType) {
    if (competitionType === "roundRobinThenSingleElimination") {
        return ["roundRobin", "singleElimination"];
    }

    return [competitionType === "roundRobin" ? "roundRobin" : "singleElimination"];
}

function getCompetitionDisplayURL(competitionID, competitionType, styleID = "", displayType = competitionType) {
    const params = new URLSearchParams({
        competitionID,
    });

    if (styleID) {
        params.set("styleID", styleID);
    }

    return `${scoreboardBaseURL}/scoreboard/${getCompetitionDisplayPath(displayType)}/?${params.toString()}`;
}

function hasRoundRobinStage(type = "") {
    return type === "roundRobin" || type === "roundRobinThenSingleElimination";
}

function hasBracketStage(type = "") {
    return type === "singleElimination" || type === "roundRobinThenSingleElimination";
}

function isCombinedCompetitionType(type = "") {
    return type === "roundRobinThenSingleElimination";
}

function cloneBracket(bracket = []) {
    return bracket.map((round) => ({
        ...round,
        seeds: (round.seeds || []).map((seed) => ({
            ...seed,
            teams: (seed.teams || [{ name: "TBD" }, { name: "TBD" }]).map((team) => ({ ...team })),
        })),
    }));
}

function cloneGroups(groups = {}) {
    return Object.entries(groups || {}).reduce((groupMap, [groupID, group]: any) => {
        groupMap[groupID] = {
            ...group,
            matches: { ...(group.matches || {}) },
            players: Object.entries(group.players || {}).reduce((playerMap, [playerID, player]: any) => {
                playerMap[playerID] = { ...player };
                return playerMap;
            }, {}),
        };
        return groupMap;
    }, {});
}

function getEntryID(entry) {
    return entry?.[0] || "";
}

function getEntryName(entry) {
    return getPlayerFormatted(entry?.[1] || {}) || "Unnamed player";
}

function getSeedFromPlayerEntry(entry, seedPosition, selectedPlayerListID) {
    const player = entry?.[1] || {};
    const sourcePlayerID = getEntryID(entry);

    return {
        country: player.country || "",
        firstName: player.firstName || "",
        gender: player.gender || "",
        imageURL: player.imageURL || "",
        lastName: player.lastName || "",
        playerName: getEntryName(entry),
        ranking: player.ranking || "",
        rating: player.rating || "",
        seed: seedPosition,
        sourcePlayerID,
        sourcePlayerListID: sourcePlayerID ? selectedPlayerListID : "",
    };
}

const BYE_PLAYER_NAME = "BYE";
const bestOfOptions = ["1", "3", "5", "7", "9"];
const advancementRankingPresets = [
    {
        label: "Wins, losses, point differential",
        value: "wins-losses-diff",
        order: ["wins", "losses", "pointDifferential", "pointsFor", "pointsAgainst"],
    },
    {
        label: "Point differential first",
        value: "diff-wins-losses",
        order: ["pointDifferential", "wins", "losses", "pointsFor", "pointsAgainst"],
    },
    {
        label: "Points scored first",
        value: "wins-points-for",
        order: ["wins", "pointsFor", "pointDifferential", "losses", "pointsAgainst"],
    },
    {
        label: "Points against tiebreaker",
        value: "wins-points-against",
        order: ["wins", "losses", "pointsAgainst", "pointDifferential", "pointsFor"],
    },
];

function getRankingPresetValue(order = []) {
    const serializedOrder = JSON.stringify(order || []);
    return advancementRankingPresets.find((preset) => JSON.stringify(preset.order) === serializedOrder)?.value || advancementRankingPresets[0].value;
}

function getRankingOrderFromPreset(value) {
    return advancementRankingPresets.find((preset) => preset.value === value)?.order || advancementRankingPresets[0].order;
}

function normalizeNameForLookup(name) {
    return `${name || ""}`.trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizeGender(value = "") {
    return `${value || ""}`.trim().slice(0, 1).toUpperCase();
}

function normalizeNumberField(value) {
    const parsedValue = parseInt(`${value || ""}`, 10);
    return Number.isNaN(parsedValue) ? "" : parsedValue;
}

function getEntrySearchText(entry) {
    const player = entry?.[1] || {};
    return [
        getEntryName(entry),
        player.country || "",
        player.gender || "",
        player.rating || "",
        player.ranking || "",
    ].join(" ").toLowerCase();
}

function isByeName(name) {
    return normalizeNameForLookup(name) === "bye";
}

function splitSeedCSVLine(line) {
    const values = [];
    let currentValue = "";
    let insideQuotes = false;

    for (let index = 0; index < line.length; index++) {
        const character = line[index];
        const nextCharacter = line[index + 1];

        if (character === "\"" && insideQuotes && nextCharacter === "\"") {
            currentValue += "\"";
            index += 1;
            continue;
        }

        if (character === "\"") {
            insideQuotes = !insideQuotes;
            continue;
        }

        if ((character === "," || character === "\t") && !insideQuotes) {
            values.push(currentValue.trim());
            currentValue = "";
            continue;
        }

        currentValue += character;
    }

    values.push(currentValue.trim());
    return values;
}

function parseSeedNumber(value, fallback) {
    const seed = parseInt(`${value || ""}`.replace(/[^0-9]/g, ""), 10);
    return Number.isNaN(seed) || seed <= 0 ? fallback : seed;
}

function getSeedPlayerName(seed) {
    return seed.playerName || `${seed.firstName || ""} ${seed.lastName || ""}`.trim() || "TBD";
}

function parseSeedText(seedText = "") {
    const rows = `${seedText || ""}`
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map(splitSeedCSVLine);
    const firstRow = rows[0] || [];
    const headerLookup = firstRow.reduce((lookup, value, index) => {
        lookup[normalizeNameForLookup(value)] = index;
        return lookup;
    }, {});
    const hasHeader = ["seed", "rank", "first name", "firstname", "last name", "lastname", "name", "player"].some((header) => {
        return typeof headerLookup[header] !== "undefined";
    });
    const dataRows = hasHeader ? rows.slice(1) : rows;

    return dataRows.map((row, rowIndex) => {
        const seedIndex = rowIndex + 1;
        const getHeaderValue = (...keys) => {
            const key = keys.find((nextKey) => typeof headerLookup[nextKey] !== "undefined");
            return key ? row[headerLookup[key]] || "" : "";
        };
        const firstValue = row[0] || "";
        const firstColumnIsSeed = /^\s*#?\d+\s*$/.test(firstValue);
        const seed = hasHeader ?
            parseSeedNumber(getHeaderValue("seed", "rank", "seeding"), seedIndex)
            : parseSeedNumber(firstColumnIsSeed ? firstValue : "", seedIndex);
        const firstName = hasHeader ?
            getHeaderValue("first name", "firstname", "first")
            : firstColumnIsSeed ? row[1] || "" : "";
        const lastName = hasHeader ?
            getHeaderValue("last name", "lastname", "last")
            : firstColumnIsSeed ? row.slice(2).join(" ") : "";
        const explicitName = hasHeader ?
            getHeaderValue("name", "player", "player name", "playername")
            : firstColumnIsSeed ? `${firstName} ${lastName}`.trim() : row.join(" ");
        const playerName = explicitName || `${firstName} ${lastName}`.trim();

        return {
            country: hasHeader ? getHeaderValue("country") : "",
            firstName,
            gender: hasHeader ? normalizeGender(getHeaderValue("gender", "sex")) : "",
            lastName,
            playerName,
            ranking: hasHeader ? normalizeNumberField(getHeaderValue("ranking", "rank")) : "",
            rating: hasHeader ? normalizeNumberField(getHeaderValue("rating")) : "",
            seed,
        };
    })
        .filter((seed) => getSeedPlayerName(seed) && !isByeName(getSeedPlayerName(seed)))
        .sort((seedA, seedB) => seedA.seed - seedB.seed);
}

function enrichSeedEntries(seedEntries, playerEntries, selectedPlayerListID) {
    const playerLookup = (playerEntries || []).reduce((lookup, entry) => {
        lookup[normalizeNameForLookup(getEntryName(entry))] = entry;
        return lookup;
    }, {});

    return seedEntries.map((seed, index) => {
        const playerName = getSeedPlayerName(seed);
        const existingEntry = playerLookup[normalizeNameForLookup(playerName)];
        const existingPlayer: any = existingEntry?.[1] || {};
        const cleanFirstName = seed.firstName || existingPlayer.firstName || playerName.split(/\s+/)[0] || "";
        const cleanLastName = seed.lastName || existingPlayer.lastName || playerName.split(/\s+/).slice(1).join(" ");

        return {
            ...seed,
            country: seed.country || existingPlayer.country || "",
            firstName: cleanFirstName,
            gender: seed.gender || existingPlayer.gender || "",
            imageURL: seed.imageURL || existingPlayer.imageURL || "",
            lastName: cleanLastName,
            playerName: existingEntry ? getEntryName(existingEntry) : playerName,
            ranking: seed.ranking || existingPlayer.ranking || "",
            rating: seed.rating || existingPlayer.rating || "",
            seed: seed.seed || index + 1,
            sourcePlayerID: existingEntry?.[0] || "",
            sourcePlayerListID: existingEntry ? selectedPlayerListID : "",
        };
    });
}

function seedEntryToGroupPlayer(seed, seedPosition, selectedPlayerListID) {
    return {
        country: seed.country || "",
        gender: seed.gender || "",
        imageURL: seed.imageURL || "",
        losses: 0,
        playerName: getSeedPlayerName(seed),
        ranking: seed.ranking || "",
        rating: seed.rating || "",
        seedPosition,
        showInGroup: true,
        sourcePlayerID: seed.sourcePlayerID || "",
        sourcePlayerListID: seed.sourcePlayerID ? selectedPlayerListID : "",
        wins: 0,
    };
}

function seedEntryToBracketTeam(seed) {
    return {
        country: seed.country || "",
        gender: seed.gender || "",
        id: seed.sourcePlayerID || "",
        imageURL: seed.imageURL || "",
        name: getSeedPlayerName(seed),
        ranking: seed.ranking || "",
        rating: seed.rating || "",
        seed: seed.seed || "",
        sourcePlayerListID: seed.sourcePlayerID ? seed.sourcePlayerListID || "" : "",
    };
}

function getGroupIndexForSeed(strategy, seedIndex, groupCount, playerCount) {
    if (groupCount <= 1) {
        return 0;
    }

    if (strategy === "sequential") {
        return Math.min(groupCount - 1, Math.floor(seedIndex / Math.max(1, Math.ceil(playerCount / groupCount))));
    }

    if (strategy === "folded") {
        const foldedIndex = seedIndex % 2 === 0 ? Math.floor(seedIndex / 2) : playerCount - 1 - Math.floor(seedIndex / 2);
        return foldedIndex % groupCount;
    }

    const cycleLength = groupCount * 2;
    const cyclePosition = seedIndex % cycleLength;
    return cyclePosition < groupCount ? cyclePosition : cycleLength - cyclePosition - 1;
}

function getStandardBracketSeedOrder(slotCount) {
    let seedOrder = [1, 2];

    while (seedOrder.length < slotCount) {
        const nextSlotCount = seedOrder.length * 2;
        seedOrder = seedOrder.flatMap((seed) => [seed, nextSlotCount + 1 - seed]);
    }

    return seedOrder.slice(0, slotCount);
}

function getBracketSlotSeedOrder(slotCount, strategy) {
    if (strategy === "sequential") {
        return Array.from({ length: slotCount }).map((_, index) => index + 1);
    }

    if (strategy === "topBottom") {
        return Array.from({ length: slotCount }).map((_, index) => {
            return index % 2 === 0 ? Math.floor(index / 2) + 1 : slotCount - Math.floor(index / 2);
        });
    }

    return getStandardBracketSeedOrder(slotCount);
}

function normalizeSeedWithBye(seed) {
    const teams = seed.teams || [{ name: "TBD" }, { name: "TBD" }];
    const aIsBye = isByeName(teams[0]?.name);
    const bIsBye = isByeName(teams[1]?.name);

    if (aIsBye !== bIsBye) {
        return {
            ...seed,
            AScore: aIsBye ? 0 : 1,
            BScore: bIsBye ? 0 : 1,
            isComplete: true,
            teams,
            winnerTeamIndex: aIsBye ? 1 : 0,
        };
    }

    const hasCompletedResult = seed.isComplete === true ||
        isMatchScoreComplete(seed.AScore, seed.BScore, seed.bestOf || 5) ||
        (Array.isArray(seed.gameScores) && seed.gameScores.length > 0);

    if (!aIsBye && !bIsBye && !hasCompletedResult && typeof seed.winnerTeamIndex !== "undefined") {
        const nextSeed = {
            ...seed,
            teams,
        };
        delete nextSeed.winnerTeamIndex;
        return nextSeed;
    }

    return {
        ...seed,
        teams,
    };
}

function normalizeBracketByesAndAdvance(bracket = []) {
    const nextBracket = cloneBracket(bracket).map((round) => ({
        ...round,
        seeds: (round.seeds || []).map(normalizeSeedWithBye),
    }));

    nextBracket.forEach((round: any, roundIndex) => {
        if (roundIndex >= nextBracket.length - 1) {
            return;
        }

        (round.seeds || []).forEach((seed: any, seedIndex) => {
            if (!seed.isComplete || typeof seed.winnerTeamIndex === "undefined") {
                return;
            }

            const winningTeam = seed.teams?.[seed.winnerTeamIndex];
            const nextRound = nextBracket[roundIndex + 1];
            const nextSeedIndex = Math.floor(seedIndex / 2);
            const nextTeamIndex = seedIndex % 2;

            if (winningTeam && nextRound?.seeds?.[nextSeedIndex]?.teams?.[nextTeamIndex]) {
                nextRound.seeds[nextSeedIndex].teams[nextTeamIndex] = {
                    ...winningTeam,
                };
            }
        });
    });

    return nextBracket;
}

function Section({ children, icon, subtitle = "", title }) {
    return (
        <View
            backgroundColor={"white"}
            borderColor={"gray.200"}
            borderRadius={8}
            borderWidth={1}
            marginBottom={3}
            padding={3}
        >
            <View alignItems={"center"} flexDirection={"row"} marginBottom={2}>
                <View
                    alignItems={"center"}
                    backgroundColor={"blue.50"}
                    borderColor={"blue.100"}
                    borderRadius={8}
                    borderWidth={1}
                    height={34}
                    justifyContent={"center"}
                    marginRight={2}
                    width={34}
                >
                    {icon}
                </View>
                <View flex={1}>
                    <Text color={"gray.900"} fontSize={"md"} fontWeight={"bold"}>{title}</Text>
                    {subtitle ? <Text color={"gray.600"} fontSize={"xs"} marginTop={1} numberOfLines={1}>{subtitle}</Text> : null}
                </View>
            </View>
            {children}
        </View>
    );
}

function FloatingStatusToast({ message, statusType, visible }) {
    if (!message || !visible) {
        return null;
    }

    const isError = statusType === "error";

    return (
        <View
            pointerEvents={"none"}
            style={{
                alignItems: "center",
                left: 0,
                position: (Platform.OS === "web" ? "fixed" : "absolute") as any,
                right: 0,
                top: 88,
                zIndex: 9999,
            }}
        >
            <View
                alignItems={"center"}
                backgroundColor={isError ? "red.700" : "green.700"}
                borderColor={isError ? "red.200" : "green.200"}
                borderRadius={10}
                borderWidth={1}
                flexDirection={"row"}
                maxWidth={720}
                paddingX={4}
                paddingY={3}
                shadow={5}
                width={{ base: "92%", md: "auto" }}
            >
                <MaterialCommunityIcons
                    name={isError ? "alert-circle" : "check-circle"}
                    size={22}
                    color={openScoreboardButtonTextColor}
                />
                <Text
                    color={openScoreboardButtonTextColor}
                    fontSize={"sm"}
                    fontWeight={"bold"}
                    marginLeft={2}
                >
                    {message}
                </Text>
            </View>
        </View>
    );
}

function FloatingSavePrompt({ hasUnsavedChanges, onSave, saving }) {
    if (!hasUnsavedChanges) {
        return null;
    }

    return (
        <View
            style={{
                alignItems: "center",
                bottom: 18,
                left: 0,
                position: (Platform.OS === "web" ? "fixed" : "absolute") as any,
                right: 0,
                zIndex: 9998,
            }}
        >
            <View
                alignItems={"center"}
                backgroundColor={"white"}
                borderColor={"blue.200"}
                borderRadius={12}
                borderWidth={1}
                flexDirection={"row"}
                maxWidth={620}
                padding={3}
                shadow={5}
                width={{ base: "92%", md: "auto" }}
            >
                <MaterialCommunityIcons name="content-save-alert-outline" size={22} color={openScoreboardColor} />
                <View flex={1} marginLeft={2} marginRight={3}>
                    <Text color={"gray.900"} fontSize={"sm"} fontWeight={"bold"}>
                        Unsaved changes
                    </Text>
                    <Text color={"gray.600"} fontSize={"2xs"}>
                        Save before leaving or refreshing this page.
                    </Text>
                </View>
                <Button
                    backgroundColor={saving ? "gray.400" : openScoreboardColor}
                    borderRadius={8}
                    isDisabled={saving}
                    onPress={onSave}
                    size={"sm"}
                >
                    {saving ? (
                        <Spinner color={openScoreboardButtonTextColor} />
                    ) : (
                        <Text color={openScoreboardButtonTextColor} fontSize={"xs"} fontWeight={"bold"}>
                            Save
                        </Text>
                    )}
                </Button>
            </View>
        </View>
    );
}

function FloatingSeedingPrompt({ onApplySeeds, seedCount, seedingApplied, visible }) {
    if (!visible || seedCount === 0) {
        return null;
    }

    return (
        <View
            style={{
                alignItems: "center",
                bottom: 18,
                left: 0,
                position: (Platform.OS === "web" ? "fixed" : "absolute") as any,
                right: 0,
                zIndex: 9999,
            }}
        >
            <View
                alignItems={"center"}
                backgroundColor={"white"}
                borderColor={"blue.200"}
                borderRadius={12}
                borderWidth={1}
                flexDirection={"row"}
                maxWidth={680}
                padding={3}
                shadow={5}
                width={{ base: "92%", md: "auto" }}
            >
                <MaterialCommunityIcons name="format-list-numbered" size={22} color={openScoreboardColor} />
                <View flex={1} marginLeft={2} marginRight={3}>
                    <Text color={"gray.900"} fontSize={"sm"} fontWeight={"bold"}>
                        {seedCount} seed{seedCount === 1 ? "" : "s"} ready
                    </Text>
                    <Text color={"gray.600"} fontSize={"2xs"}>
                        {seedingApplied ? "Reapply if you changed the seed order." : "Apply seeding to save this order into the competition."}
                    </Text>
                </View>
                <Button
                    backgroundColor={openScoreboardColor}
                    borderRadius={8}
                    onPress={onApplySeeds}
                    size={"sm"}
                >
                    <Text color={openScoreboardButtonTextColor} fontSize={"xs"} fontWeight={"bold"}>
                        {seedingApplied ? "Reapply & save" : "Apply & save"}
                    </Text>
                </Button>
            </View>
        </View>
    );
}

function SeedingPanel({
    addingMissingPlayers,
    isBracket,
    loadingPlayers,
    missingSeedEntries,
    onAddMissingPlayers,
    onApplySeeds,
    onSeedFileText,
    playerEntries,
    playerLists,
    playerSearch,
    seedEntries,
    seedingApplied,
    seedSource,
    seedText,
    selectedSeedPlayerIDs,
    selectedPlayerListID,
    seedingStrategy,
    setPlayerSearch,
    setSeedText,
    setSeedSource,
    setSelectedSeedPlayerIDs,
    setSelectedPlayerListID,
    setSeedingStrategy,
}) {
    const strategyOptions = isBracket ? [
        { label: "Standard bracket seeding", value: "standard" },
        { label: "Top vs bottom", value: "topBottom" },
        { label: "List order", value: "sequential" },
    ] : [
        { label: "Snake / serpentine", value: "snake" },
        { label: "Folded high-low", value: "folded" },
        { label: "Sequential groups", value: "sequential" },
    ];
    const isPlayerListSeedSource = seedSource === "playerList";
    const selectedPlayerIDSet = useMemo(() => {
        return new Set(selectedSeedPlayerIDs || []);
    }, [selectedSeedPlayerIDs]);
    const selectedSeedPlayerEntries = useMemo(() => {
        return (selectedSeedPlayerIDs || [])
            .map((playerID) => playerEntries.find((entry) => getEntryID(entry) === playerID))
            .filter(Boolean);
    }, [playerEntries, selectedSeedPlayerIDs]);
    const filteredSeedPlayerEntries = useMemo(() => {
        const normalizedSearch = playerSearch.trim().toLowerCase();
        return playerEntries
            .filter((entry) => !normalizedSearch || getEntrySearchText(entry).includes(normalizedSearch))
            .slice(0, 40);
    }, [playerEntries, playerSearch]);

    function addSeedPlayer(playerID) {
        if (!playerID || selectedPlayerIDSet.has(playerID)) {
            return;
        }

        setSelectedSeedPlayerIDs((currentIDs) => [...currentIDs, playerID]);
    }

    function removeSeedPlayer(playerID) {
        setSelectedSeedPlayerIDs((currentIDs) => currentIDs.filter((currentID) => currentID !== playerID));
    }

    function moveSeedPlayer(playerID, direction) {
        setSelectedSeedPlayerIDs((currentIDs) => {
            const currentIndex = currentIDs.indexOf(playerID);
            const nextIndex = currentIndex + direction;

            if (currentIndex < 0 || nextIndex < 0 || nextIndex >= currentIDs.length) {
                return currentIDs;
            }

            const nextIDs = [...currentIDs];
            const [movedID] = nextIDs.splice(currentIndex, 1);
            nextIDs.splice(nextIndex, 0, movedID);
            return nextIDs;
        });
    }

    function renderSourceTab(label, value, icon) {
        const isActive = seedSource === value;

        return (
            <Button
                backgroundColor={isActive ? openScoreboardColor : "transparent"}
                borderColor={isActive ? openScoreboardColor : "transparent"}
                borderRadius={8}
                flex={1}
                marginX={1}
                onPress={() => setSeedSource(value)}
                size={"sm"}
                variant={isActive ? "solid" : "ghost"}
            >
                <View alignItems={"center"} flexDirection={"row"} justifyContent={"center"}>
                    <MaterialCommunityIcons name={icon} size={16} color={isActive ? openScoreboardButtonTextColor : openScoreboardColor} />
                    <Text color={isActive ? openScoreboardButtonTextColor : openScoreboardColor} fontSize={"sm"} fontWeight={"bold"} marginLeft={2}>
                        {label}
                    </Text>
                </View>
            </Button>
        );
    }

    function renderSelectedSeedsPanel() {
        return (
            <View
                backgroundColor={"white"}
                borderColor={"blue.200"}
                borderRadius={8}
                borderWidth={1}
                padding={3}
                style={Platform.OS === "web" ? ({
                    alignSelf: "flex-start",
                    maxHeight: 520,
                    overflowY: "auto",
                    position: "sticky",
                    top: 12,
                } as any) : undefined}
            >
                <View alignItems={"center"} flexDirection={"row"} justifyContent={"space-between"} marginBottom={2}>
                    <View>
                        <Text color={"gray.900"} fontSize={"sm"} fontWeight={"bold"}>
                            Selected seeds
                        </Text>
                        <Text color={"gray.500"} fontSize={"2xs"}>
                            {selectedSeedPlayerEntries.length} selected
                        </Text>
                    </View>
                    {selectedSeedPlayerEntries.length > 0 ? (
                        <Button
                            borderRadius={8}
                            onPress={() => setSelectedSeedPlayerIDs([])}
                            size={"sm"}
                            variant={"ghost"}
                        >
                            <Text color={"red.700"} fontSize={"xs"} fontWeight={"bold"}>Clear</Text>
                        </Button>
                    ) : null}
                </View>

                {selectedSeedPlayerEntries.length > 0 ? (
                    selectedSeedPlayerEntries.map((entry, index) => {
                        const playerID = getEntryID(entry);

                        return (
                            <View
                                key={`selected-seed-${playerID}`}
                                alignItems={"center"}
                                backgroundColor={"blue.50"}
                                borderColor={"blue.100"}
                                borderRadius={8}
                                borderWidth={1}
                                flexDirection={"row"}
                                marginBottom={2}
                                padding={2}
                            >
                                <View alignItems={"center"} backgroundColor={openScoreboardColor} borderRadius={999} height={26} justifyContent={"center"} marginRight={2} width={26}>
                                    <Text color={openScoreboardButtonTextColor} fontSize={"2xs"} fontWeight={"bold"}>{index + 1}</Text>
                                </View>
                                <Text color={"gray.900"} flex={1} fontSize={"xs"} fontWeight={"bold"} numberOfLines={1}>
                                    {getEntryName(entry)}
                                </Text>
                                <Button borderRadius={8} marginLeft={1} onPress={() => moveSeedPlayer(playerID, -1)} size={"sm"} variant={"ghost"}>
                                    <MaterialCommunityIcons name="arrow-up" size={15} color={openScoreboardColor} />
                                </Button>
                                <Button borderRadius={8} marginLeft={1} onPress={() => moveSeedPlayer(playerID, 1)} size={"sm"} variant={"ghost"}>
                                    <MaterialCommunityIcons name="arrow-down" size={15} color={openScoreboardColor} />
                                </Button>
                                <Button borderRadius={8} marginLeft={1} onPress={() => removeSeedPlayer(playerID)} size={"sm"} variant={"ghost"}>
                                    <MaterialCommunityIcons name="close" size={15} color={"#B91C1C"} />
                                </Button>
                            </View>
                        );
                    })
                ) : (
                    <View
                        alignItems={"center"}
                        backgroundColor={"gray.50"}
                        borderColor={"gray.200"}
                        borderRadius={8}
                        borderWidth={1}
                        padding={4}
                    >
                        <MaterialCommunityIcons name="account-plus-outline" size={22} color={"#6B7280"} />
                        <Text color={"gray.600"} fontSize={"xs"} marginTop={2} textAlign={"center"}>
                            Add players from the list to build the seed order.
                        </Text>
                    </View>
                )}
            </View>
        );
    }

    return (
        <Section
            icon={<MaterialCommunityIcons name="format-list-numbered" size={22} color={openScoreboardColor} />}
            title={"Seeding tools"}
            subtitle={"Choose players directly from a player list or switch to CSV/list import, then auto-place those seeds into groups or bracket slots."}
        >
            <View flexDirection={"row"} flexWrap={"wrap"} justifyContent={"space-between"}>
                <View marginBottom={3} width={"100%"}>
                    <FormControl>
                        <FormControl.Label>Placement strategy</FormControl.Label>
                        <Select backgroundColor={"white"} selectedValue={seedingStrategy} onValueChange={setSeedingStrategy}>
                            {strategyOptions.map((strategy) => (
                                <Select.Item key={strategy.value} label={strategy.label} value={strategy.value} />
                            ))}
                        </Select>
                    </FormControl>
                </View>
            </View>

            <View
                backgroundColor={"gray.100"}
                borderColor={"gray.200"}
                borderRadius={10}
                borderWidth={1}
                flexDirection={"row"}
                marginBottom={3}
                padding={1}
            >
                {renderSourceTab("Player list", "playerList", "account-search")}
                {renderSourceTab("CSV / list", "csv", "file-delimited-outline")}
            </View>

            <View
                alignItems={"center"}
                backgroundColor={"white"}
                borderColor={"gray.200"}
                borderRadius={8}
                borderWidth={1}
                flexDirection={"row"}
                justifyContent={"space-between"}
                marginBottom={3}
                padding={3}
            >
                <View flex={1} marginRight={3}>
                    <Text color={"gray.900"} fontSize={"sm"} fontWeight={"bold"}>
                        {seedEntries.length} seed{seedEntries.length === 1 ? "" : "s"} ready
                    </Text>
                    <Text color={"gray.500"} fontSize={"2xs"} marginTop={1}>
                        {seedingApplied ?
                            `Seeding is already applied and saved. Reapply only if you want to rebuild the ${isBracket ? "bracket slots" : "groups"}.`
                            : `Apply and save the current seed order to the ${isBracket ? "bracket" : "groups"}.`}
                    </Text>
                </View>
                <Button
                    backgroundColor={openScoreboardColor}
                    borderRadius={8}
                    isDisabled={seedEntries.length === 0}
                    onPress={onApplySeeds}
                    size={"sm"}
                >
                    <Text color={openScoreboardButtonTextColor} fontSize={"xs"} fontWeight={"bold"}>
                        {seedingApplied ? "Reapply & save" : "Apply & save"}
                    </Text>
                </Button>
            </View>

            <View
                backgroundColor={seedingApplied ? "green.50" : "amber.50"}
                borderColor={seedingApplied ? "green.200" : "amber.200"}
                borderRadius={8}
                borderWidth={1}
                marginBottom={3}
                padding={3}
            >
                <Text color={seedingApplied ? "green.800" : "amber.900"} fontSize={"sm"} fontWeight={"bold"}>
                    {seedingApplied ? "Seeding has been applied and saved." : "Seeding has not been applied yet."}
                </Text>
                <Text color={seedingApplied ? "green.800" : "amber.900"} fontSize={"xs"} marginTop={1}>
                    {seedingApplied ?
                        "You can still change the selected order and reapply seeding if the bracket or groups need to be rebuilt."
                        : "Select players or import a CSV/list, then apply seeding to save the player order into this competition. No separate Save click is needed after applying."}
                </Text>
            </View>

            {isPlayerListSeedSource ? (
                <View
                    backgroundColor={"blue.50"}
                    borderColor={"blue.100"}
                    borderRadius={8}
                    borderWidth={1}
                    padding={3}
                >
                    <View flexDirection={"row"} flexWrap={"wrap"} justifyContent={"space-between"}>
                        <View marginBottom={3} width={{ base: "100%", md: "48.5%" }}>
                            <FormControl>
                                <FormControl.Label>Player list</FormControl.Label>
                                <Select
                                    backgroundColor={"white"}
                                    onValueChange={setSelectedPlayerListID}
                                    placeholder={"Select a player list"}
                                    selectedValue={selectedPlayerListID}
                                >
                                    {playerLists.map((playerList) => (
                                        <Select.Item
                                            key={playerList?.[1]?.id}
                                            label={`${playerList?.[1]?.playerListName || "Player list"} (${playerList?.[1]?.playerCount || 0})`}
                                            value={playerList?.[1]?.id}
                                        />
                                    ))}
                                </Select>
                            </FormControl>
                        </View>
                        <View marginBottom={3} width={{ base: "100%", md: "48.5%" }}>
                            <FormControl>
                                <FormControl.Label>Search players</FormControl.Label>
                                <Input
                                    backgroundColor={"white"}
                                    color={"gray.900"}
                                    isDisabled={!selectedPlayerListID}
                                    onChangeText={setPlayerSearch}
                                    placeholder={"Search by player name, country, rating, ranking"}
                                    value={playerSearch}
                                />
                            </FormControl>
                        </View>
                    </View>

                    <Text color={"gray.700"} fontSize={"xs"} marginBottom={2}>
                        {loadingPlayers ? "Loading players..." : "Select players in seed order. The order shown below is the order that will be applied."}
                    </Text>

                    <View flexDirection={"row"} flexWrap={"wrap"} justifyContent={"space-between"}>
                        <View width={{ base: "100%", lg: "66%" }}>
                            <ScrollView
                                maxHeight={520}
                                nestedScrollEnabled
                                style={Platform.OS === "web" ? ({ maxHeight: 520 } as any) : undefined}
                            >
                                <View flexDirection={"row"} flexWrap={"wrap"} justifyContent={"space-between"} paddingRight={{ base: 0, lg: 2 }}>
                                    {filteredSeedPlayerEntries.map((entry) => {
                                        const playerID = getEntryID(entry);
                                        const isSelected = selectedPlayerIDSet.has(playerID);
                                        const selectedIndex = selectedSeedPlayerIDs.indexOf(playerID);

                                        return (
                                            <View
                                                key={`seed-player-${playerID}`}
                                                backgroundColor={isSelected ? "green.50" : "white"}
                                                borderColor={isSelected ? "green.200" : "blue.100"}
                                                borderRadius={8}
                                                borderWidth={1}
                                                marginBottom={2}
                                                padding={2}
                                                width={{ base: "100%", md: "48.5%" }}
                                            >
                                                <View alignItems={"center"} flexDirection={"row"}>
                                                    <View flex={1} marginRight={2}>
                                                        <Text color={"gray.900"} fontSize={"xs"} fontWeight={"bold"} numberOfLines={1}>
                                                            {getEntryName(entry)}
                                                        </Text>
                                                        <Text color={"gray.500"} fontSize={"2xs"} numberOfLines={1}>
                                                            {[entry?.[1]?.country, entry?.[1]?.gender, entry?.[1]?.rating ? `Rating ${entry?.[1]?.rating}` : "", entry?.[1]?.ranking ? `Rank ${entry?.[1]?.ranking}` : ""].filter(Boolean).join(" / ") || "Player list entry"}
                                                        </Text>
                                                    </View>
                                                    <Button
                                                        backgroundColor={isSelected ? "white" : openScoreboardColor}
                                                        borderColor={isSelected ? "green.300" : openScoreboardColor}
                                                        borderRadius={8}
                                                        minWidth={isSelected ? 58 : 44}
                                                        onPress={() => isSelected ? removeSeedPlayer(playerID) : addSeedPlayer(playerID)}
                                                        size={"sm"}
                                                        variant={isSelected ? "outline" : "solid"}
                                                    >
                                                        <Text color={isSelected ? "green.700" : openScoreboardButtonTextColor} fontSize={"2xs"} fontWeight={"bold"}>
                                                            {isSelected ? `#${selectedIndex + 1}` : "Add"}
                                                        </Text>
                                                    </Button>
                                                </View>
                                            </View>
                                        );
                                    })}
                                </View>
                            </ScrollView>
                        </View>
                        <View marginTop={{ base: 3, lg: 0 }} width={{ base: "100%", lg: "32%" }}>
                            {renderSelectedSeedsPanel()}
                        </View>
                    </View>
                </View>
            ) : (
                <View
                    backgroundColor={"gray.50"}
                    borderColor={"gray.200"}
                    borderRadius={8}
                    borderWidth={1}
                    padding={3}
                >
                    <FormControl marginBottom={3}>
                        <FormControl.Label>Player list for matching</FormControl.Label>
                        <Select
                            backgroundColor={"white"}
                            onValueChange={setSelectedPlayerListID}
                            placeholder={"Optional player list"}
                            selectedValue={selectedPlayerListID}
                        >
                            {playerLists.map((playerList) => (
                                <Select.Item
                                    key={playerList?.[1]?.id}
                                    label={`${playerList?.[1]?.playerListName || "Player list"} (${playerList?.[1]?.playerCount || 0})`}
                                    value={playerList?.[1]?.id}
                                />
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl>
                        <FormControl.Label>Seeded player list</FormControl.Label>
                        <TextArea
                            autoCompleteType={undefined}
                            backgroundColor={"white"}
                            color={"gray.900"}
                            h={32}
                            onChangeText={setSeedText}
                            placeholder={"Paste one player per line, or CSV rows like seed,firstName,lastName,country"}
                            value={seedText}
                        />
                    </FormControl>

                    {Platform.OS === "web" ? (
                        <View marginTop={3}>
                            {React.createElement("input", {
                                accept: ".csv,text/csv,text/plain",
                                onChange: async (event: any) => {
                                    const file = event?.target?.files?.[0];
                                    if (file?.text) {
                                        onSeedFileText(await file.text());
                                    }
                                    event.target.value = "";
                                },
                                style: {
                                    border: "1px solid #D1D5DB",
                                    borderRadius: 8,
                                    padding: 10,
                                    width: "100%",
                                },
                                type: "file",
                            })}
                        </View>
                    ) : null}
                </View>
            )}

            <View
                backgroundColor={"gray.50"}
                borderColor={"gray.200"}
                borderRadius={8}
                borderWidth={1}
                marginTop={3}
                padding={3}
            >
                <Text color={"gray.900"} fontSize={"sm"} fontWeight={"bold"}>
                    {seedEntries.length} seed{seedEntries.length === 1 ? "" : "s"} ready
                </Text>
                <Text color={missingSeedEntries.length ? "orange.700" : "green.700"} fontSize={"xs"} marginTop={1}>
                    {isPlayerListSeedSource ?
                        "These seeds come directly from the selected player list."
                        : selectedPlayerListID ?
                            `${seedEntries.length - missingSeedEntries.length} matched, ${missingSeedEntries.length} not found in the selected player list.`
                            : "No player list selected. CSV seeds will be inserted as competition-only players."}
                </Text>
                {seedEntries.length > 0 ? (
                    <View flexDirection={"row"} flexWrap={"wrap"} marginTop={2}>
                        {seedEntries.slice(0, 12).map((seed) => (
                            <View
                                key={`${seed.seed}-${getSeedPlayerName(seed)}`}
                                backgroundColor={seed.sourcePlayerID ? "green.50" : "white"}
                                borderColor={seed.sourcePlayerID ? "green.200" : "gray.200"}
                                borderRadius={999}
                                borderWidth={1}
                                marginRight={2}
                                marginTop={2}
                                paddingX={3}
                                paddingY={1}
                            >
                                <Text color={"gray.800"} fontSize={"xs"} fontWeight={"bold"}>
                                    #{seed.seed} {getSeedPlayerName(seed)}
                                </Text>
                            </View>
                        ))}
                    </View>
                ) : null}
                {seedEntries.length > 12 ? (
                    <Text color={"gray.500"} fontSize={"xs"} marginTop={2}>
                        Showing first 12 seeds.
                    </Text>
                ) : null}
            </View>

            <View alignItems={"center"} flexDirection={"row"} flexWrap={"wrap"} marginTop={3}>
                <Button
                    backgroundColor={openScoreboardColor}
                    borderRadius={8}
                    isDisabled={seedEntries.length === 0}
                    marginRight={2}
                    marginTop={2}
                    onPress={onApplySeeds}
                >
                    <Text color={openScoreboardButtonTextColor} fontWeight={"bold"}>
                        Apply & save seeding
                    </Text>
                </Button>
                <Button
                    borderRadius={8}
                    display={isPlayerListSeedSource ? "none" : "flex"}
                    isDisabled={!selectedPlayerListID || missingSeedEntries.length === 0 || addingMissingPlayers}
                    marginTop={2}
                    onPress={onAddMissingPlayers}
                    variant={"outline"}
                >
                    {addingMissingPlayers ? (
                        <Spinner color={openScoreboardColor} />
                    ) : (
                        <Text color={openScoreboardColor} fontWeight={"bold"}>
                            Add missing to player list
                        </Text>
                    )}
                </Button>
            </View>
        </Section>
    );
}

function BracketStructureEditor({
    bracket,
    bracketDefaultBestOf,
    bracketUpgradeBestOf,
    bracketUpgradeRound,
    largestRound,
    resetBracket,
    setBracket,
    setBracketDefaultBestOf,
    setBracketUpgradeBestOf,
    setBracketUpgradeRound,
    setLargestRound,
}) {
    const [activeRoundIndex, setActiveRoundIndex] = useState(0);
    const [matchLengthExpanded, setMatchLengthExpanded] = useState(false);
    const safeActiveRoundIndex = Math.min(activeRoundIndex, Math.max(0, bracket.length - 1));
    const visibleRounds = bracket.length > 0 ?
        bracket.slice(safeActiveRoundIndex, safeActiveRoundIndex + 1)
        : [];

    function updateBracketWithTeam(roundIndex, seedIndex, teamIndex, team) {
        setBracket((currentBracket) => {
            const nextBracket = cloneBracket(currentBracket);
            nextBracket[roundIndex].seeds[seedIndex].teams[teamIndex] = team;
            nextBracket[roundIndex].seeds[seedIndex] = normalizeSeedWithBye(nextBracket[roundIndex].seeds[seedIndex]);
            return normalizeBracketByesAndAdvance(nextBracket);
        });
    }

    function toggleBye(roundIndex, seedIndex, teamIndex) {
        const currentTeam = bracket?.[roundIndex]?.seeds?.[seedIndex]?.teams?.[teamIndex] || {};
        updateBracketWithTeam(roundIndex, seedIndex, teamIndex, {
            ...currentTeam,
            name: isByeName(currentTeam.name) ? "TBD" : BYE_PLAYER_NAME,
        });
    }

    function moveTeamSlot(roundIndex, seedIndex, teamIndex, direction) {
        setBracket((currentBracket) => {
            const nextBracket = cloneBracket(currentBracket);
            const round = nextBracket[roundIndex];
            const flattenedTeams = (round.seeds || []).flatMap((seed) => seed.teams || []);
            const currentIndex = seedIndex * 2 + teamIndex;
            const nextIndex = currentIndex + direction;

            if (nextIndex < 0 || nextIndex >= flattenedTeams.length) {
                return currentBracket;
            }

            const reorderedTeams = [...flattenedTeams];
            const currentTeam = reorderedTeams[currentIndex];
            reorderedTeams[currentIndex] = reorderedTeams[nextIndex];
            reorderedTeams[nextIndex] = currentTeam;

            round.seeds = round.seeds.map((seed, index) => ({
                ...seed,
                teams: [
                    reorderedTeams[index * 2] || { name: "TBD" },
                    reorderedTeams[index * 2 + 1] || { name: "TBD" },
                ],
            })).map(normalizeSeedWithBye);

            return normalizeBracketByesAndAdvance(nextBracket);
        });
    }

    function renderRoundTabs() {
        return (
            <View
                backgroundColor={"gray.100"}
                borderColor={"gray.200"}
                borderRadius={10}
                borderWidth={1}
                flexDirection={"row"}
                flexWrap={"wrap"}
                marginBottom={3}
                padding={1}
            >
                {bracket.map((round, roundIndex) => {
                    const isActive = safeActiveRoundIndex === roundIndex;

                    return (
                        <Button
                            key={`bracket-round-tab-${roundIndex}`}
                            backgroundColor={isActive ? openScoreboardColor : "transparent"}
                            borderRadius={8}
                            margin={1}
                            onPress={() => setActiveRoundIndex(roundIndex)}
                            size={"sm"}
                            variant={"ghost"}
                        >
                            <Text color={isActive ? openScoreboardButtonTextColor : openScoreboardColor} fontSize={"xs"} fontWeight={"bold"}>
                                {round.title || `Round ${roundIndex + 1}`}
                            </Text>
                        </Button>
                    );
                })}
            </View>
        );
    }

    function renderSeedEditor(round, roundIndex, seed, seedIndex) {
        return (
            <View
                key={`seed-editor-${roundIndex}-${seedIndex}`}
                backgroundColor={"gray.50"}
                borderColor={"gray.200"}
                borderRadius={8}
                borderWidth={1}
                marginBottom={3}
                padding={3}
            >
                <Text color={"gray.500"} fontSize={"2xs"} fontWeight={"bold"} textTransform={"uppercase"}>
                    Match {seedIndex + 1}
                </Text>
                {(seed.teams || []).map((team, teamIndex) => (
                    <View key={`team-input-${roundIndex}-${seedIndex}-${teamIndex}`} marginTop={2}>
                        <View alignItems={"center"} flexDirection={"row"}>
                            <View
                                alignItems={"center"}
                                backgroundColor={isByeName(team.name) ? "yellow.50" : "white"}
                                borderColor={isByeName(team.name) ? "yellow.300" : "gray.300"}
                                borderRadius={8}
                                borderWidth={1}
                                flex={1}
                                flexDirection={"row"}
                                minHeight={"40px"}
                                paddingX={2}
                                paddingY={1}
                            >
                                <View
                                    alignItems={"center"}
                                    backgroundColor={isByeName(team.name) ? "yellow.100" : "gray.100"}
                                    borderRadius={999}
                                    height={"26px"}
                                    justifyContent={"center"}
                                    marginRight={2}
                                    width={"26px"}
                                >
                                    <Text color={isByeName(team.name) ? "orange.700" : "gray.700"} fontSize={"2xs"} fontWeight={"bold"}>
                                        {isByeName(team.name) ? "-" : team.seed || "-"}
                                    </Text>
                                </View>
                                <Text color={"gray.900"} flex={1} fontSize={"sm"} fontWeight={"bold"}>
                                    {team.name || "Unassigned seed"}
                                </Text>
                            </View>
                            <Button borderRadius={8} marginLeft={2} onPress={() => moveTeamSlot(roundIndex, seedIndex, teamIndex, -1)} size={"sm"} variant={"outline"}>
                                <MaterialCommunityIcons name="arrow-up" size={16} color={openScoreboardColor} />
                            </Button>
                            <Button borderRadius={8} marginLeft={1} onPress={() => moveTeamSlot(roundIndex, seedIndex, teamIndex, 1)} size={"sm"} variant={"outline"}>
                                <MaterialCommunityIcons name="arrow-down" size={16} color={openScoreboardColor} />
                            </Button>
                            <Button borderRadius={8} marginLeft={1} onPress={() => toggleBye(roundIndex, seedIndex, teamIndex)} size={"sm"} variant={"outline"}>
                                <Text color={isByeName(team.name) ? "orange.700" : openScoreboardColor} fontSize={"xs"} fontWeight={"bold"}>
                                    {isByeName(team.name) ? "Clear" : "BYE"}
                                </Text>
                            </Button>
                        </View>
                    </View>
                ))}
            </View>
        );
    }

    return (
        <View>
            <View alignItems={"flex-end"} flexDirection={"row"} flexWrap={"wrap"} marginBottom={4}>
                <View flex={1} minWidth={220} marginRight={3}>
                    <FormControl>
                        <FormControl.Label>Maximum match round</FormControl.Label>
                        <Select selectedValue={largestRound} onValueChange={setLargestRound}>
                            {bracketRoundConfig.map((round) => (
                                <Select.Item key={round.name} label={round.name} value={round.name} />
                            ))}
                        </Select>
                    </FormControl>
                </View>
                <Button borderRadius={8} marginTop={3} onPress={resetBracket} variant={"outline"}>
                    <Text color={"blue.700"} fontWeight={"bold"}>Reset bracket</Text>
                </Button>
            </View>

            <View
                backgroundColor={"white"}
                borderColor={"gray.200"}
                borderRadius={8}
                borderWidth={1}
                marginBottom={4}
                overflow={"hidden"}
            >
                <Pressable
                    accessibilityRole={"button"}
                    accessibilityState={{ expanded: matchLengthExpanded }}
                    onPress={() => setMatchLengthExpanded((isExpanded) => !isExpanded)}
                    style={({ pressed }) => ({
                        backgroundColor: pressed ? "#F8FAFC" : "#FFFFFF",
                        padding: 14,
                        width: "100%",
                    })}
                >
                    <View alignItems={"center"} flexDirection={"row"}>
                        <View
                            alignItems={"center"}
                            backgroundColor={"blue.50"}
                            borderRadius={7}
                            height={34}
                            justifyContent={"center"}
                            marginRight={3}
                            width={34}
                        >
                            <MaterialCommunityIcons name="format-list-numbered" size={18} color={openScoreboardColor} />
                        </View>
                        <View flex={1} paddingRight={3}>
                            <Text color={"gray.900"} fontSize={"sm"} fontWeight={"bold"}>
                                Match length by round
                            </Text>
                            <Text color={"gray.500"} fontSize={"2xs"} marginTop={1}>
                                Best of {normalizeBestOf(bracketDefaultBestOf)}
                                {bracketUpgradeRound ? ` / Best of ${normalizeBestOf(bracketUpgradeBestOf)} from ${bracketUpgradeRound}` : " for all rounds"}
                            </Text>
                        </View>
                        <MaterialCommunityIcons
                            name={matchLengthExpanded ? "chevron-up" : "chevron-down"}
                            size={22}
                            color={openScoreboardColor}
                        />
                    </View>
                </Pressable>

                {matchLengthExpanded ? (
                    <View backgroundColor={"blue.50"} borderTopColor={"gray.200"} borderTopWidth={1} padding={3}>
                        <View flexDirection={"row"} flexWrap={"wrap"} justifyContent={"space-between"}>
                            <View marginBottom={3} width={{ base: "100%", md: "32%" }}>
                                <FormControl>
                                    <FormControl.Label>Default match length</FormControl.Label>
                                    <Select selectedValue={`${bracketDefaultBestOf}`} onValueChange={setBracketDefaultBestOf}>
                                        {bestOfOptions.map((bestOf) => (
                                            <Select.Item key={`default-best-${bestOf}`} label={getGamesNeededLabel(bestOf)} value={bestOf} />
                                        ))}
                                    </Select>
                                </FormControl>
                            </View>
                            <View marginBottom={3} width={{ base: "100%", md: "32%" }}>
                                <FormControl>
                                    <FormControl.Label>Change starting at</FormControl.Label>
                                    <Select
                                        selectedValue={bracketUpgradeRound || "__none__"}
                                        onValueChange={(value) => setBracketUpgradeRound(value === "__none__" ? "" : value)}
                                    >
                                        <Select.Item label={"Do not change"} value={"__none__"} />
                                        {bracketRoundConfig.map((round) => (
                                            <Select.Item key={`upgrade-round-${round.name}`} label={round.name} value={round.name} />
                                        ))}
                                    </Select>
                                </FormControl>
                            </View>
                            <View marginBottom={3} width={{ base: "100%", md: "32%" }}>
                                <FormControl>
                                    <FormControl.Label>Changed match length</FormControl.Label>
                                    <Select
                                        isDisabled={!bracketUpgradeRound}
                                        selectedValue={`${bracketUpgradeBestOf}`}
                                        onValueChange={setBracketUpgradeBestOf}
                                    >
                                        {bestOfOptions.map((bestOf) => (
                                            <Select.Item key={`upgrade-best-${bestOf}`} label={getGamesNeededLabel(bestOf)} value={bestOf} />
                                        ))}
                                    </Select>
                                </FormControl>
                            </View>
                        </View>
                        <Text color={"blue.900"} fontSize={"xs"}>
                            Matches before the selected round use the default length. The selected round and all later rounds use the changed length.
                        </Text>
                    </View>
                ) : null}
            </View>

            {renderRoundTabs()}

            <View flexDirection={"row"} flexWrap={"wrap"} justifyContent={"space-between"}>
                {visibleRounds.map((round, visibleIndex) => {
                    const roundIndex = safeActiveRoundIndex + visibleIndex;

                    return (
                        <View
                            key={`round-editor-column-${roundIndex}`}
                            width={"100%"}
                        >
                            <View alignItems={"center"} flexDirection={"row"} justifyContent={"space-between"} marginBottom={2}>
                                <Text color={"gray.900"} fontSize={"md"} fontWeight={"bold"}>{round.title}</Text>
                                <Text color={"gray.500"} fontSize={"2xs"} fontWeight={"bold"} textTransform={"uppercase"}>
                                    {(round.seeds || []).length} match{(round.seeds || []).length === 1 ? "" : "es"}
                                </Text>
                            </View>
                            <ScrollView
                                maxHeight={640}
                                nestedScrollEnabled
                                style={Platform.OS === "web" ? ({ maxHeight: 640 } as any) : undefined}
                            >
                                {(round.seeds || []).map((seed, seedIndex) => renderSeedEditor(round, roundIndex, seed, seedIndex))}
                            </ScrollView>
                        </View>
                    );
                })}
            </View>
        </View>
    );
}

function RoundRobinStructureEditor({
    groups,
    onFinalizeGroups,
    roundRobinBestOf,
    setGroups,
    onGoToSeeding,
    setRoundRobinBestOf,
}) {
    const groupEntries = Object.entries(groups || {});
    const [expandedGroupIDs, setExpandedGroupIDs] = useState({});
    const [finalizingGroups, setFinalizingGroups] = useState(false);
    const totalGroupPlayers = groupEntries.reduce((total, [, group]: any) => {
        return total + Object.keys(group.players || {}).length;
    }, 0);

    function getSortedPlayers(group) {
        return Object.entries(group.players || {}).sort(([, playerA]: any, [, playerB]: any) => {
            return (Number(playerA.seedPosition) || 0) - (Number(playerB.seedPosition) || 0);
        });
    }

    function normalizePlayerSeeds(players) {
        return Object.fromEntries(
            Object.entries(players || {})
                .sort(([, playerA]: any, [, playerB]: any) => (Number(playerA.seedPosition) || 0) - (Number(playerB.seedPosition) || 0))
                .map(([playerID, player]: any, index) => [playerID, {
                    ...player,
                    seedPosition: index + 1,
                }])
        );
    }

    function clearGeneratedMatches(nextGroups) {
        return Object.entries(nextGroups || {}).reduce((groupMap, [groupID, group]: any) => {
            groupMap[groupID] = {
                ...group,
                matches: {},
            };
            return groupMap;
        }, {});
    }

    function updateGroup(groupID, field, value) {
        setGroups((currentGroups) => ({
            ...currentGroups,
            [groupID]: {
                ...currentGroups[groupID],
                [field]: value,
            },
        }));
    }

    function updateGroupCount(nextGroupCount) {
        const count = Math.max(1, Number(nextGroupCount) || 1);
        setGroups((currentGroups) => {
            const currentEntries = Object.entries(currentGroups || {});
            const nextGroups = Array.from({ length: count }).reduce((groupMap, _, index) => {
                const existingEntry = currentEntries[index];
                const nextGroupID = existingEntry?.[0] || `group-${index + 1}`;
                const group: any = existingEntry?.[1] || {};

                groupMap[nextGroupID] = {
                    groupName: group.groupName || `Group ${index + 1}`,
                    matches: group.matches || {},
                    players: normalizePlayerSeeds(group.players || {}),
                    showOnBoard: group.showOnBoard !== false,
                };
                return groupMap;
            }, {});

            const lastGroupID = Object.keys(nextGroups)[Object.keys(nextGroups).length - 1];
            if (lastGroupID && currentEntries.length > count) {
                const movedPlayers = currentEntries.slice(count).flatMap(([, group]: any) => {
                    return Object.entries(group?.players || {});
                });
                const lastGroupPlayers = { ...(nextGroups[lastGroupID]?.players || {}) };

                movedPlayers.forEach(([playerID, player]: any) => {
                    lastGroupPlayers[playerID] = {
                        ...player,
                        seedPosition: Object.keys(lastGroupPlayers).length + 1,
                    };
                });

                nextGroups[lastGroupID] = {
                    ...nextGroups[lastGroupID],
                    players: normalizePlayerSeeds(lastGroupPlayers),
                };
            }

            return clearGeneratedMatches(nextGroups);
        });
    }

    function movePlayerToGroup(sourceGroupID, playerID, targetGroupID) {
        if (sourceGroupID === targetGroupID) {
            return;
        }

        setGroups((currentGroups) => {
            const sourcePlayers = { ...(currentGroups[sourceGroupID]?.players || {}) };
            const player = sourcePlayers[playerID];
            if (!player) {
                return currentGroups;
            }
            delete sourcePlayers[playerID];
            const targetPlayers = { ...(currentGroups[targetGroupID]?.players || {}) };
            targetPlayers[playerID] = {
                ...player,
                seedPosition: Object.keys(targetPlayers).length + 1,
            };

            return clearGeneratedMatches({
                ...currentGroups,
                [sourceGroupID]: {
                    ...currentGroups[sourceGroupID],
                    players: normalizePlayerSeeds(sourcePlayers),
                },
                [targetGroupID]: {
                    ...currentGroups[targetGroupID],
                    players: normalizePlayerSeeds(targetPlayers),
                },
            });
        });
    }

    function moveSeed(groupID, playerID, direction) {
        setGroups((currentGroups) => {
            const sortedPlayers = getSortedPlayers(currentGroups[groupID] || {});
            const currentIndex = sortedPlayers.findIndex(([id]) => id === playerID);
            const nextIndex = currentIndex + direction;
            if (currentIndex < 0 || nextIndex < 0 || nextIndex >= sortedPlayers.length) {
                return currentGroups;
            }

            const reorderedPlayers = [...sortedPlayers];
            const [playerEntry] = reorderedPlayers.splice(currentIndex, 1);
            reorderedPlayers.splice(nextIndex, 0, playerEntry);

            return clearGeneratedMatches({
                ...currentGroups,
                [groupID]: {
                    ...currentGroups[groupID],
                    players: Object.fromEntries(reorderedPlayers.map(([id, player]: any, index) => [id, {
                        ...player,
                        seedPosition: index + 1,
                    }])),
                },
            });
        });
    }

    function toggleGroup(groupID) {
        setExpandedGroupIDs((currentExpandedGroups) => ({
            ...currentExpandedGroups,
            [groupID]: currentExpandedGroups[groupID] !== true,
        }));
    }

    async function finalizeGroups() {
        setFinalizingGroups(true);
        try {
            await onFinalizeGroups();
        }
        finally {
            setFinalizingGroups(false);
        }
    }

    return (
        <View>
            <View
                backgroundColor={"blue.50"}
                borderColor={"blue.100"}
                borderRadius={8}
                borderWidth={1}
                marginBottom={4}
                padding={3}
            >
                <Text color={"gray.900"} fontSize={"sm"} fontWeight={"bold"} marginBottom={2}>
                    Group structure
                </Text>
                <Text color={"blue.900"} fontSize={"xs"} marginBottom={3}>
                    Players are added to this competition from Seeding. This page is only for group setup, moving seeded players between groups, and changing the display order inside each group.
                </Text>
                <View flexDirection={"row"} flexWrap={"wrap"} justifyContent={"space-between"}>
                    <View marginBottom={3} width={{ base: "100%", md: "48.5%" }}>
                        <FormControl>
                            <FormControl.Label>Group match length</FormControl.Label>
                            <Select selectedValue={`${roundRobinBestOf}`} onValueChange={setRoundRobinBestOf}>
                                {bestOfOptions.map((bestOf) => (
                                    <Select.Item key={`round-robin-best-${bestOf}`} label={getGamesNeededLabel(bestOf)} value={bestOf} />
                                ))}
                            </Select>
                        </FormControl>
                    </View>
                    <View marginBottom={3} width={{ base: "100%", md: "48.5%" }}>
                        <FormControl>
                            <FormControl.Label>Number of groups</FormControl.Label>
                            <Select selectedValue={`${Math.max(1, groupEntries.length || 1)}`} onValueChange={updateGroupCount}>
                                {["1", "2", "3", "4", "5", "6", "8", "16"].map((count) => (
                                    <Select.Item key={count} label={count} value={count} />
                                ))}
                            </Select>
                        </FormControl>
                    </View>
                </View>
                {totalGroupPlayers === 0 ? (
                    <View
                        backgroundColor={"amber.50"}
                        borderColor={"amber.200"}
                        borderRadius={8}
                        borderWidth={1}
                        padding={3}
                    >
                        <Text color={"amber.900"} fontSize={"sm"} fontWeight={"bold"}>
                            No seeded players are in these groups yet.
                        </Text>
                        <Text color={"amber.900"} fontSize={"xs"} marginTop={1}>
                            Go to Seeding, select the competition players, and apply seeding. The app will place players into groups automatically.
                        </Text>
                        <Button alignSelf={"flex-start"} marginTop={3} onPress={onGoToSeeding} size={"sm"} variant={"outline"}>
                            <Text color={openScoreboardColor} fontSize={"xs"} fontWeight={"bold"}>
                                Open seeding
                            </Text>
                        </Button>
                    </View>
                ) : (
                    <View
                        backgroundColor={"white"}
                        borderColor={"blue.100"}
                        borderRadius={8}
                        borderWidth={1}
                        padding={3}
                    >
                        <Text color={"blue.900"} fontSize={"xs"} fontWeight={"bold"}>
                            {totalGroupPlayers} seeded player{totalGroupPlayers === 1 ? "" : "s"} assigned across {groupEntries.length} group{groupEntries.length === 1 ? "" : "s"}.
                        </Text>
                        <Text color={"blue.900"} fontSize={"xs"} marginTop={1}>
                            To add or remove competition players, return to Seeding and reapply. Use the controls below only to move players between groups.
                        </Text>
                    </View>
                )}
                <Button
                    alignSelf={"flex-start"}
                    backgroundColor={openScoreboardColor}
                    borderRadius={8}
                    isDisabled={totalGroupPlayers < 2 || finalizingGroups}
                    marginTop={3}
                    onPress={finalizeGroups}
                >
                    {finalizingGroups ? (
                        <Spinner color={openScoreboardButtonTextColor} size={"sm"} />
                    ) : (
                        <Text color={openScoreboardButtonTextColor} fontWeight={"bold"}>
                            Finalize groups and generate matches
                        </Text>
                    )}
                </Button>
            </View>

            <View>
                {groupEntries.map(([groupID, group]: any) => {
                    const sortedPlayers = getSortedPlayers(group);
                    const isExpanded = expandedGroupIDs[groupID] === true;

                    return (
                        <View
                            key={groupID}
                            backgroundColor={"white"}
                            borderColor={"gray.200"}
                            borderRadius={8}
                            borderWidth={1}
                            marginBottom={3}
                            overflow={"hidden"}
                            width={"100%"}
                        >
                            <Pressable
                                accessibilityRole={"button"}
                                onPress={() => toggleGroup(groupID)}
                                style={({ pressed }) => ({
                                    backgroundColor: pressed ? "#F8FAFC" : "#FFFFFF",
                                    padding: 14,
                                    width: "100%",
                                })}
                            >
                                <View alignItems={"center"} flexDirection={"row"}>
                                    <View
                                        alignItems={"center"}
                                        backgroundColor={"blue.50"}
                                        borderRadius={7}
                                        height={34}
                                        justifyContent={"center"}
                                        marginRight={3}
                                        width={34}
                                    >
                                        <MaterialCommunityIcons name="table-large" size={18} color={openScoreboardColor} />
                                    </View>
                                    <View flex={1}>
                                        <Text color={"gray.900"} fontSize={"md"} fontWeight={"bold"}>
                                            {group.groupName || groupID}
                                        </Text>
                                        <Text color={"gray.500"} fontSize={"2xs"} marginTop={0.5}>
                                            {sortedPlayers.length} player{sortedPlayers.length === 1 ? "" : "s"} · {group.showOnBoard !== false ? "Visible on scoreboard" : "Hidden from scoreboard"}
                                        </Text>
                                    </View>
                                    <MaterialCommunityIcons
                                        name={isExpanded ? "chevron-up" : "chevron-down"}
                                        size={22}
                                        color={"#6B7280"}
                                    />
                                </View>
                            </Pressable>

                            {isExpanded ? (
                                <View backgroundColor={"gray.50"} borderColor={"gray.200"} borderTopWidth={1} padding={3}>
                                    <View alignItems={"center"} flexDirection={"row"} marginBottom={3}>
                                        <View flex={1} marginRight={3}>
                                            <FormControl>
                                                <FormControl.Label>Group name</FormControl.Label>
                                                <Input
                                                    backgroundColor={"white"}
                                                    color={"gray.900"}
                                                    fontSize={"sm"}
                                                    onChangeText={(value) => updateGroup(groupID, "groupName", value)}
                                                    value={group.groupName || ""}
                                                />
                                            </FormControl>
                                        </View>
                                        <View alignItems={"center"}>
                                            <Text color={"gray.600"} fontSize={"2xs"} fontWeight={"bold"}>Show on board</Text>
                                            <Switch
                                                isChecked={group.showOnBoard !== false}
                                                size={"sm"}
                                                onToggle={(value) => updateGroup(groupID, "showOnBoard", value)}
                                            />
                                        </View>
                                    </View>

                                    {sortedPlayers.map(([playerID, player]: any, index) => (
                                        <View
                                            key={playerID}
                                            backgroundColor={"white"}
                                            borderColor={"gray.200"}
                                            borderRadius={8}
                                            borderWidth={1}
                                            marginBottom={1.5}
                                            padding={2}
                                        >
                                            <View alignItems={"center"} flexDirection={"row"}>
                                                <View alignItems={"center"} backgroundColor={"gray.100"} borderRadius={999} height={24} justifyContent={"center"} marginRight={2} width={24}>
                                                    <Text color={"gray.700"} fontSize={"2xs"} fontWeight={"bold"}>{index + 1}</Text>
                                                </View>
                                                <View flex={1}>
                                                    <Text color={"gray.900"} fontSize={"xs"} fontWeight={"bold"} numberOfLines={1}>
                                                        {player.playerName || "Unnamed seeded player"}
                                                    </Text>
                                                    <Text color={"gray.500"} fontSize={"2xs"} numberOfLines={1}>
                                                        {[player.country, player.gender, player.rating ? `Rating ${player.rating}` : "", player.ranking ? `Rank ${player.ranking}` : ""].filter(Boolean).join(" / ") || "Seeded player"}
                                                    </Text>
                                                </View>
                                                <Button borderRadius={8} marginLeft={1} onPress={() => moveSeed(groupID, playerID, -1)} paddingX={2} size={"sm"} variant={"outline"}>
                                                    <MaterialCommunityIcons name="arrow-up" size={14} color={openScoreboardColor} />
                                                </Button>
                                                <Button borderRadius={8} marginLeft={1} onPress={() => moveSeed(groupID, playerID, 1)} paddingX={2} size={"sm"} variant={"outline"}>
                                                    <MaterialCommunityIcons name="arrow-down" size={14} color={openScoreboardColor} />
                                                </Button>
                                                <View marginLeft={2} minWidth={150}>
                                                    <Select selectedValue={groupID} onValueChange={(targetGroupID) => movePlayerToGroup(groupID, playerID, targetGroupID)}>
                                                        {groupEntries.map(([targetGroupID, targetGroup]: any) => (
                                                            <Select.Item key={targetGroupID} label={targetGroup.groupName || targetGroupID} value={targetGroupID} />
                                                        ))}
                                                    </Select>
                                                </View>
                                            </View>
                                        </View>
                                    ))}

                                    {sortedPlayers.length === 0 ? (
                                        <View backgroundColor={"white"} borderColor={"gray.200"} borderRadius={8} borderWidth={1} padding={3}>
                                            <Text color={"gray.600"} fontSize={"xs"}>
                                                No seeded players are currently assigned here. Move a player from another group, or use Seeding to rebuild the group assignments.
                                            </Text>
                                        </View>
                                    ) : null}
                                </View>
                            ) : null}
                        </View>
                    );
                })}
            </View>
        </View>
    );
}

function getTableNameFromList(tables, tableID) {
    return tables.find(([nextTableID]) => nextTableID === tableID)?.[1]?.tableName || "Table";
}

function getCleanPlayerName(name) {
    const cleanName = `${name || ""}`.trim();
    return cleanName && cleanName !== "TBD" && !isByeName(cleanName) ? cleanName : "";
}

function playerNameToMatchPlayer(name) {
    const cleanName = getCleanPlayerName(name) || "TBD";
    const parts = cleanName.split(/\s+/);
    return {
        firstName: parts[0] || cleanName,
        firstNameInitial: false,
        lastName: parts.slice(1).join(" "),
        lastNameInitial: false,
    };
}

function toScoreValue(value) {
    const nextValue = parseInt(`${value}`, 10);
    return Number.isNaN(nextValue) ? 0 : Math.max(0, nextValue);
}

function normalizeBestOf(value, fallback = 5) {
    const parsedValue = parseInt(`${value}`, 10);
    return bestOfOptions.includes(`${parsedValue}`) ? parsedValue : fallback;
}

function getGamesNeeded(bestOf) {
    return Math.floor(normalizeBestOf(bestOf, 5) / 2) + 1;
}

function getGamesNeededLabel(bestOf) {
    const cleanBestOf = normalizeBestOf(bestOf);
    return `Best of ${cleanBestOf} (first to ${Math.floor(cleanBestOf / 2) + 1})`;
}

function isMatchScoreComplete(aScore, bScore, bestOf) {
    const a = toScoreValue(aScore);
    const b = toScoreValue(bScore);
    const gamesNeeded = getGamesNeeded(bestOf);

    return a !== b && (a >= gamesNeeded || b >= gamesNeeded);
}

function isValidIndividualGameScore(aScore, bScore, pointsToWinGame = 11) {
    const a = toScoreValue(aScore);
    const b = toScoreValue(bScore);

    if (a === b) {
        return false;
    }

    const winnerScore = Math.max(a, b);
    const loserScore = Math.min(a, b);

    return winnerScore >= pointsToWinGame && winnerScore - loserScore >= 2;
}

function getGameWinner(gameScore, pointsToWinGame = 11) {
    const a = toScoreValue(gameScore?.a);
    const b = toScoreValue(gameScore?.b);

    if (!isValidIndividualGameScore(a, b, pointsToWinGame)) {
        return "";
    }

    return a > b ? "A" : "B";
}

function getMatchScoreFromGames(gameScores = [], pointsToWinGame = 11) {
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

function getInitialCompetitionGameScores(match, bestOf) {
    const savedGameScores = Array.isArray(match?.gameScores) ? match.gameScores : [];
    return Array.from({ length: normalizeBestOf(bestOf, 5) }).map((_, index) => ({
        a: savedGameScores[index]?.a !== undefined ? `${savedGameScores[index].a}` : "",
        b: savedGameScores[index]?.b !== undefined ? `${savedGameScores[index].b}` : "",
    }));
}

function getInitialCompetitionMatchScore(match, bestOf, pointsToWinGame = 11) {
    const aScore = toScoreValue(match?.AScore);
    const bScore = toScoreValue(match?.BScore);

    if (aScore || bScore) {
        return {
            a: `${aScore}`,
            b: `${bScore}`,
        };
    }

    const scoreFromGames = getMatchScoreFromGames(Array.isArray(match?.gameScores) ? match.gameScores : [], pointsToWinGame);
    if (scoreFromGames.a || scoreFromGames.b) {
        return {
            a: `${scoreFromGames.a}`,
            b: `${scoreFromGames.b}`,
        };
    }

    return {
        a: "",
        b: "",
    };
}

function getRoundConfigIndex(roundName) {
    return bracketRoundConfig.findIndex((round) => round.name === roundName);
}

function getBestOfForBracketRound(roundTitle, defaultBestOf, upgradeRound, upgradeBestOf) {
    const cleanDefaultBestOf = normalizeBestOf(defaultBestOf, 5);
    const cleanUpgradeBestOf = normalizeBestOf(upgradeBestOf, cleanDefaultBestOf);

    if (!upgradeRound) {
        return cleanDefaultBestOf;
    }

    const roundIndex = getRoundConfigIndex(roundTitle);
    const upgradeRoundIndex = getRoundConfigIndex(upgradeRound);

    if (roundIndex < 0 || upgradeRoundIndex < 0) {
        return cleanDefaultBestOf;
    }

    return roundIndex >= upgradeRoundIndex ? cleanUpgradeBestOf : cleanDefaultBestOf;
}

function getCompetitionMatchRoundLabel(match: any = {}) {
    const roundTitle = `${match.roundTitle || ""}`.trim();
    if (roundTitle.length > 0) {
        return roundTitle;
    }

    if (match.type === "roundRobin" || match.groupID || match.groupName) {
        return "Group Stage";
    }

    return "";
}

function hasBracketSeeding(bracket = []) {
    const firstRoundTeams = bracket?.[0]?.seeds?.flatMap((seed) => seed.teams || []) || [];
    return firstRoundTeams.some((team) => {
        const name = getCleanPlayerName(team?.name);
        return name && name !== "BYE";
    });
}

function hasRoundRobinSeeding(groups = {}) {
    return Object.values(groups || {}).some((group: any) => {
        return Object.keys(group?.players || {}).length > 0;
    });
}

function getSortedGroupPlayers(group) {
    return Object.entries(group?.players || {}).sort(([, playerA]: any, [, playerB]: any) => {
        return (Number(playerA.seedPosition) || 0) - (Number(playerB.seedPosition) || 0);
    });
}

function buildRoundRobinRounds(players = []) {
    const entries = [...players];
    if (entries.length < 2) {
        return [];
    }

    const byeEntry: any = ["__bye__", { playerName: BYE_PLAYER_NAME }];
    let rotation = entries.length % 2 === 1 ? [...entries, byeEntry] : entries;
    const roundCount = rotation.length - 1;
    const rounds = [];

    for (let roundIndex = 0; roundIndex < roundCount; roundIndex++) {
        const roundPairs = [];
        const halfLength = rotation.length / 2;

        for (let pairIndex = 0; pairIndex < halfLength; pairIndex++) {
            const firstEntry = rotation[pairIndex];
            const secondEntry = rotation[rotation.length - 1 - pairIndex];

            if (firstEntry?.[0] === "__bye__" || secondEntry?.[0] === "__bye__") {
                continue;
            }

            roundPairs.push([firstEntry, secondEntry]);
        }

        rounds.push(roundPairs);
        rotation = [rotation[0], rotation[rotation.length - 1], ...rotation.slice(1, rotation.length - 1)];
    }

    return rounds;
}

function buildRoundRobinMatchesForGroups(groups = {}) {
    return Object.entries(groups || {}).reduce((nextGroups, [groupID, group]: any) => {
        const players = getSortedGroupPlayers(group);
        const playerOrder = players.reduce((orderMap, [playerID], index) => {
            orderMap[playerID] = index;
            return orderMap;
        }, {});
        const rounds = buildRoundRobinRounds(players);
        const expectedMatches = {};

        rounds.forEach((roundPairs, roundIndex) => {
            roundPairs.forEach((pair: any, roundMatchIndex) => {
                const [firstEntry, secondEntry] = pair;
                const sortedPair = [firstEntry, secondEntry].sort(([firstPlayerID], [secondPlayerID]) => {
                    return (playerOrder[firstPlayerID] || 0) - (playerOrder[secondPlayerID] || 0);
                });
                const [playerAID, playerA]: any = sortedPair[0];
                const [playerBID, playerB]: any = sortedPair[1];
                const slotID = `${groupID}-match-${playerAID}-${playerBID}`;
                const existingMatch = group.matches?.[slotID] || {};

                expectedMatches[slotID] = {
                    AScore: existingMatch.AScore || 0,
                    BScore: existingMatch.BScore || 0,
                    gameScores: existingMatch.gameScores || [],
                    groupID,
                    isComplete: existingMatch.isComplete === true,
                    matchID: existingMatch.matchID || "",
                    playerA: playerA.playerName || "TBD",
                    playerAID,
                    playerB: playerB.playerName || "TBD",
                    playerBID,
                    order: existingMatch.order || (roundIndex * 100) + roundMatchIndex + 1,
                    roundMatchIndex: roundMatchIndex + 1,
                    roundNumber: roundIndex + 1,
                    scheduledMatchID: existingMatch.scheduledMatchID || "",
                    sourceID: existingMatch.sourceID || existingMatch.tableID || "",
                    sourceTitle: existingMatch.sourceTitle || existingMatch.tableName || "",
                    sourceType: existingMatch.sourceType || "",
                    startTime: existingMatch.startTime || "",
                    tableID: existingMatch.tableID || existingMatch.sourceID || "",
                    tableName: existingMatch.tableName || existingMatch.sourceTitle || "",
                };
            });
        });

        nextGroups[groupID] = {
            ...group,
            matches: expectedMatches,
        };
        return nextGroups;
    }, {});
}

function recalculateGroupStandings(group) {
    const players = Object.entries(group?.players || {}).reduce((playerMap, [playerID, player]: any) => {
        playerMap[playerID] = {
            ...player,
            losses: 0,
            wins: 0,
        };
        return playerMap;
    }, {});

    Object.values(group?.matches || {}).forEach((match: any) => {
        if (!match?.isComplete || match.AScore === match.BScore) {
            return;
        }

        const winnerID = match.AScore > match.BScore ? match.playerAID : match.playerBID;
        const loserID = match.AScore > match.BScore ? match.playerBID : match.playerAID;

        if (players[winnerID]) {
            players[winnerID].wins += 1;
        }

        if (players[loserID]) {
            players[loserID].losses += 1;
        }
    });

    return {
        ...group,
        players,
    };
}

function getGroupPlayerRankingRows(group, rankingOrder = []) {
    const players = Object.entries(group?.players || {}).reduce((playerMap, [playerID, player]: any) => {
        playerMap[playerID] = {
            ...player,
            losses: Number(player.losses) || 0,
            played: 0,
            pointsAgainst: 0,
            pointsFor: 0,
            wins: Number(player.wins) || 0,
        };
        return playerMap;
    }, {});

    Object.values(group?.matches || {}).forEach((match: any) => {
        if (!match?.isComplete || match.AScore === match.BScore) {
            return;
        }

        const aScore = Number(match.AScore) || 0;
        const bScore = Number(match.BScore) || 0;

        if (players[match.playerAID]) {
            players[match.playerAID].played += 1;
            players[match.playerAID].pointsFor += aScore;
            players[match.playerAID].pointsAgainst += bScore;
        }

        if (players[match.playerBID]) {
            players[match.playerBID].played += 1;
            players[match.playerBID].pointsFor += bScore;
            players[match.playerBID].pointsAgainst += aScore;
        }
    });

    const cleanRankingOrder = rankingOrder.length ? rankingOrder : ["wins", "losses", "pointDifferential", "pointsFor", "pointsAgainst"];

    return Object.entries(players).map(([playerID, player]: any) => ({
        ...player,
        playerID,
        pointDifferential: (Number(player.pointsFor) || 0) - (Number(player.pointsAgainst) || 0),
    })).sort((playerA: any, playerB: any) => {
        for (const rankingKey of cleanRankingOrder) {
            if (rankingKey === "wins" && playerA.wins !== playerB.wins) {
                return playerB.wins - playerA.wins;
            }
            if (rankingKey === "losses" && playerA.losses !== playerB.losses) {
                return playerA.losses - playerB.losses;
            }
            if (rankingKey === "pointDifferential" && playerA.pointDifferential !== playerB.pointDifferential) {
                return playerB.pointDifferential - playerA.pointDifferential;
            }
            if (rankingKey === "pointsFor" && playerA.pointsFor !== playerB.pointsFor) {
                return playerB.pointsFor - playerA.pointsFor;
            }
            if (rankingKey === "pointsAgainst" && playerA.pointsAgainst !== playerB.pointsAgainst) {
                return playerA.pointsAgainst - playerB.pointsAgainst;
            }
        }

        return (Number(playerA.seedPosition) || 0) - (Number(playerB.seedPosition) || 0);
    });
}

function groupPlayerToBracketTeam(player: any) {
    return {
        country: player.country || "",
        gender: player.gender || "",
        id: player.sourcePlayerID || player.playerID || "",
        imageURL: player.imageURL || "",
        name: player.playerName || "TBD",
        ranking: player.ranking || "",
        rating: player.rating || "",
        seed: player.advanceSeed || player.seedPosition || "",
        sourcePlayerListID: player.sourcePlayerListID || "",
    };
}

function getBracketMatchItems(bracket = []) {
    return bracket.flatMap((round, roundIndex) => {
        return (round.seeds || []).map((seed, seedIndex) => ({
            AScore: seed.AScore || 0,
            BScore: seed.BScore || 0,
            bracketRoundIndex: roundIndex,
            bracketSeedIndex: seedIndex,
            gameScores: seed.gameScores || [],
            isComplete: seed.isComplete === true,
            key: `bracket-${roundIndex}-${seedIndex}`,
            label: `${round.title || "Round"} - Match ${seedIndex + 1}`,
            bestOf: seed.bestOf || "",
            matchID: seed.matchID || "",
            playerA: seed.teams?.[0]?.name || "TBD",
            playerAID: seed.teams?.[0]?.id || "",
            playerASeed: seed.teams?.[0]?.seed || "",
            playerB: seed.teams?.[1]?.name || "TBD",
            playerBID: seed.teams?.[1]?.id || "",
            playerBSeed: seed.teams?.[1]?.seed || "",
            roundTitle: round.title || "",
            scheduledMatchID: seed.scheduledMatchID || "",
            scheduledStatus: seed.scheduledStatus || "",
            slotID: seed.competitionSlotID || seed.id || `round-${roundIndex}-seed-${seedIndex}`,
            tableID: seed.tableID || seed.sourceID || "",
            tableName: seed.tableName || seed.sourceTitle || "",
            type: "singleElimination",
        }));
    });
}

function getRoundRobinMatchItems(groups = {}) {
    return Object.entries(groups || {}).flatMap(([groupID, group]: any) => {
        return Object.entries(group.matches || {}).map(([slotID, match]: any, matchIndex) => ({
            AScore: match.AScore || 0,
            BScore: match.BScore || 0,
            gameScores: match.gameScores || [],
            groupID,
            groupName: group.groupName || groupID,
            isComplete: match.isComplete === true,
            key: `group-${groupID}-${slotID}`,
            label: `Play round ${match.roundNumber || 1} - Match ${match.roundMatchIndex || matchIndex + 1}`,
            bestOf: match.bestOf || "",
            matchID: match.matchID || "",
            playerA: match.playerA || "TBD",
            playerAID: match.playerAID || "",
            playerASeed: group.players?.[match.playerAID]?.seedPosition || "",
            playerB: match.playerB || "TBD",
            playerBID: match.playerBID || "",
            playerBSeed: group.players?.[match.playerBID]?.seedPosition || "",
            order: match.order || 0,
            roundMatchIndex: match.roundMatchIndex || "",
            roundNumber: match.roundNumber || "",
            scheduledMatchID: match.scheduledMatchID || "",
            scheduledStatus: match.scheduledStatus || "",
            slotID,
            tableID: match.tableID || match.sourceID || "",
            tableName: match.tableName || match.sourceTitle || "",
            type: "roundRobin",
        }));
    });
}

function getRoundRobinRoundSections(matches = []) {
    const roundMap = matches.reduce((sections, match: any) => {
        const roundNumber = Number(match.roundNumber) || 1;
        if (!sections[roundNumber]) {
            sections[roundNumber] = {
                matches: [],
                roundNumber,
                title: `Play round ${roundNumber}`,
            };
        }

        sections[roundNumber].matches.push(match);
        return sections;
    }, {});

    return Object.values(roundMap)
        .sort((roundA: any, roundB: any) => roundA.roundNumber - roundB.roundNumber)
        .map((round: any) => ({
            ...round,
            matches: round.matches.sort((matchA, matchB) => {
                return (Number(matchA.roundMatchIndex) || Number(matchA.order) || 0) -
                    (Number(matchB.roundMatchIndex) || Number(matchB.order) || 0);
            }),
        }));
}

function CompetitionGameScoreModal({ getMatchBestOf, isOpen, isSaving, match, onClose, onSave }) {
    const bestOf = normalizeBestOf(getMatchBestOf ? getMatchBestOf(match || {}) : match?.bestOf || 5, 5);
    const pointsToWinGame = 11;
    const gamesNeeded = getGamesNeeded(bestOf);
    const [gameScores, setGameScores] = useState(getInitialCompetitionGameScores(match, bestOf));
    const [isConfirming, setIsConfirming] = useState(false);
    const [matchScore, setMatchScore] = useState(getInitialCompetitionMatchScore(match, bestOf, pointsToWinGame));

    useEffect(() => {
        if (isOpen) {
            setGameScores(getInitialCompetitionGameScores(match, bestOf));
            setIsConfirming(false);
            setMatchScore(getInitialCompetitionMatchScore(match, bestOf, pointsToWinGame));
        }
    }, [isOpen, match?.key, bestOf]);

    if (!match) {
        return null;
    }

    const cleanMatchScore = {
        a: toScoreValue(matchScore.a),
        b: toScoreValue(matchScore.b),
    };
    const scoreFromGameDetails = getMatchScoreFromGames(gameScores, pointsToWinGame);
    const hasEnteredMatchScore = matchScore.a !== "" || matchScore.b !== "";
    const effectiveMatchScore = hasEnteredMatchScore ? cleanMatchScore : scoreFromGameDetails;
    const isMatchComplete = isMatchScoreComplete(effectiveMatchScore.a, effectiveMatchScore.b, bestOf);
    const cleanGameScores = gameScores
        .map((gameScore) => ({
            a: toScoreValue(gameScore.a),
            b: toScoreValue(gameScore.b),
        }))
        .filter((gameScore) => isValidIndividualGameScore(gameScore.a, gameScore.b, pointsToWinGame));

    function updateGameScore(index, side, value) {
        const cleanValue = `${value || ""}`.replace(/[^0-9]/g, "");
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

    function updateMatchScore(side, value) {
        const cleanValue = `${value || ""}`.replace(/[^0-9]/g, "");
        setMatchScore((currentScore) => ({
            ...currentScore,
            [side]: cleanValue,
        }));
    }

    function saveGameScores() {
        onSave(match, {
            AScore: effectiveMatchScore.a,
            BScore: effectiveMatchScore.b,
            gameScores: cleanGameScores,
            isComplete: true,
            scheduledStatus: "complete",
        });
    }

    return (
        <Modal avoidKeyboard isOpen={isOpen} onClose={onClose} size={"full"}>
            <Modal.Content maxWidth={760}>
                <Modal.CloseButton />
                <Modal.Header>{isConfirming ? "Confirm match result" : "Input game scores"}</Modal.Header>
                <Modal.Body>
                    {isConfirming ? (
                        <View>
                            <View backgroundColor={"gray.50"} borderColor={"gray.200"} borderRadius={8} borderWidth={1} overflow={"hidden"}>
                                {[
                                    { name: match.playerA || "Player A", score: effectiveMatchScore.a },
                                    { name: match.playerB || "Player B", score: effectiveMatchScore.b },
                                ].map((player, index) => (
                                    <View
                                        key={`confirm-result-${index}`}
                                        alignItems={"center"}
                                        backgroundColor={"white"}
                                        borderTopColor={"gray.200"}
                                        borderTopWidth={index === 0 ? 0 : 1}
                                        flexDirection={"row"}
                                        minHeight={"56px"}
                                        paddingX={3}
                                        paddingY={2}
                                    >
                                        <Text color={"gray.900"} flex={1} fontSize={"sm"} fontWeight={"bold"} paddingRight={3}>
                                            {player.name}
                                        </Text>
                                        <Text color={"gray.900"} fontSize={"2xl"} fontWeight={"bold"} textAlign={"center"} width={"48px"}>
                                            {player.score}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                            <View backgroundColor={"amber.50"} borderColor={"amber.200"} borderRadius={8} borderWidth={1} marginTop={3} padding={3}>
                                <Text color={"amber.900"} fontSize={"sm"} fontWeight={"bold"}>
                                    Confirm this final result
                                </Text>
                                <Text color={"amber.900"} fontSize={"xs"} marginTop={1}>
                                    Saving marks the match complete and may advance the winner or update group standings.
                                </Text>
                            </View>
                            {cleanGameScores.length ? (
                                <View marginTop={3}>
                                    <Text color={"gray.500"} fontSize={"2xs"} fontWeight={"bold"} textTransform={"uppercase"}>
                                        Individual games
                                    </Text>
                                    <Text color={"gray.700"} fontSize={"xs"} marginTop={1}>
                                        {cleanGameScores.map((gameScore, index) => `G${index + 1}: ${gameScore.a}-${gameScore.b}`).join("  ")}
                                    </Text>
                                </View>
                            ) : null}
                        </View>
                    ) : (
                        <ScrollView>
                        <View backgroundColor={"gray.50"} borderColor={"gray.200"} borderRadius={8} borderWidth={1} padding={3}>
                            <Text color={"gray.900"} fontSize={"md"} fontWeight={"bold"}>
                                {match.playerA || "TBD"} vs {match.playerB || "TBD"}
                            </Text>
                            <Text color={"gray.500"} fontSize={"xs"} marginTop={1}>
                                Best of {bestOf}. First to {pointsToWinGame}, win by 2.
                            </Text>
                        </View>

                        <View backgroundColor={"blue.50"} borderColor={"blue.100"} borderRadius={8} borderWidth={1} marginTop={3} padding={3}>
                            <Text color={"gray.900"} fontSize={"sm"} fontWeight={"bold"}>
                                Games won
                            </Text>
                            <Text color={"gray.500"} fontSize={"xs"} marginTop={1}>
                                Enter the final match score. Individual game scores are optional.
                            </Text>
                            <View alignItems={"flex-end"} flexDirection={"row"} marginTop={2}>
                                <View flex={1}>
                                    <FormControl>
                                        <FormControl.Label>{match.playerA || "Player A"}</FormControl.Label>
                                        <Input
                                            backgroundColor={"white"}
                                            color={"gray.900"}
                                            fontSize={"lg"}
                                            fontWeight={"bold"}
                                            keyboardType={"numeric"}
                                            onChangeText={(value) => updateMatchScore("a", value)}
                                            placeholder={"0"}
                                            textAlign={"center"}
                                            value={`${matchScore.a}`}
                                        />
                                    </FormControl>
                                </View>
                                <View alignItems={"center"} justifyContent={"center"} paddingBottom={3} width={34}>
                                    <Text color={"gray.500"} fontSize={"md"} fontWeight={"bold"}>-</Text>
                                </View>
                                <View flex={1}>
                                    <FormControl>
                                        <FormControl.Label>{match.playerB || "Player B"}</FormControl.Label>
                                        <Input
                                            backgroundColor={"white"}
                                            color={"gray.900"}
                                            fontSize={"lg"}
                                            fontWeight={"bold"}
                                            keyboardType={"numeric"}
                                            onChangeText={(value) => updateMatchScore("b", value)}
                                            placeholder={"0"}
                                            textAlign={"center"}
                                            value={`${matchScore.b}`}
                                        />
                                    </FormControl>
                                </View>
                            </View>
                            <Text color={isMatchComplete ? "green.700" : "#92400E"} fontSize={"xs"} fontWeight={"bold"} marginTop={2}>
                                {isMatchComplete ?
                                    `Ready to save: ${effectiveMatchScore.a} - ${effectiveMatchScore.b}`
                                    : `One player needs to win ${gamesNeeded} game${gamesNeeded === 1 ? "" : "s"}.`}
                            </Text>
                        </View>

                        <View marginTop={3}>
                            <Text color={"gray.900"} fontSize={"sm"} fontWeight={"bold"} marginBottom={1}>
                                Individual game scores
                            </Text>
                            <Text color={"gray.500"} fontSize={"xs"} marginBottom={2}>
                                Optional details. Only valid completed game rows will be saved.
                            </Text>
                            <View alignItems={"center"} flexDirection={"row"} marginBottom={2}>
                                <View flex={1}>
                                    <Text color={"gray.500"} fontSize={"2xs"} fontWeight={"bold"} textTransform={"uppercase"}>
                                        {match.playerA || "Player A"}
                                    </Text>
                                </View>
                                <View alignItems={"center"} width={42}>
                                    <Text color={"gray.500"} fontSize={"2xs"} fontWeight={"bold"} textTransform={"uppercase"}>Game</Text>
                                </View>
                                <View flex={1}>
                                    <Text color={"gray.500"} fontSize={"2xs"} fontWeight={"bold"} textAlign={"right"} textTransform={"uppercase"}>
                                        {match.playerB || "Player B"}
                                    </Text>
                                </View>
                            </View>
                            {gameScores.map((gameScore, index) => {
                                const isValidScore = isValidIndividualGameScore(gameScore.a, gameScore.b, pointsToWinGame);
                                const hasScore = gameScore.a || gameScore.b;

                                return (
                                    <View key={`competition-game-score-${index}`} alignItems={"center"} flexDirection={"row"} marginBottom={2}>
                                        <View flex={1}>
                                            <Input
                                                backgroundColor={"white"}
                                                borderColor={hasScore ? isValidScore ? "green.300" : "amber.300" : "gray.300"}
                                                color={"gray.900"}
                                                keyboardType={"numeric"}
                                                onChangeText={(value) => updateGameScore(index, "a", value)}
                                                placeholder={"Score"}
                                                value={`${gameScore.a}`}
                                            />
                                        </View>
                                        <View alignItems={"center"} width={42}>
                                            <Text color={"gray.900"} fontSize={"xs"} fontWeight={"bold"}>G{index + 1}</Text>
                                        </View>
                                        <View flex={1}>
                                            <Input
                                                backgroundColor={"white"}
                                                borderColor={hasScore ? isValidScore ? "green.300" : "amber.300" : "gray.300"}
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
                            <Text color={"gray.500"} fontSize={"xs"} marginTop={1}>
                                {cleanGameScores.length ?
                                    `Optional game detail total: ${scoreFromGameDetails.a} - ${scoreFromGameDetails.b}`
                                    : "No individual game scores will be saved unless completed game rows are entered."}
                            </Text>
                        </View>
                        </ScrollView>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <View alignItems={"center"} flexDirection={"row"} justifyContent={"flex-end"} width={"100%"}>
                        {isConfirming ? (
                            <>
                                <Button borderRadius={8} isDisabled={isSaving} marginRight={2} onPress={() => setIsConfirming(false)} size={"sm"} variant={"outline"}>
                                    <Text color={"gray.700"} fontSize={"xs"} fontWeight={"bold"}>Back</Text>
                                </Button>
                                <Button
                                    backgroundColor={"green.700"}
                                    borderRadius={8}
                                    isDisabled={isSaving}
                                    onPress={saveGameScores}
                                    size={"sm"}
                                >
                                    {isSaving ? (
                                        <Spinner color={openScoreboardButtonTextColor} size={"sm"} />
                                    ) : (
                                        <Text color={openScoreboardButtonTextColor} fontSize={"xs"} fontWeight={"bold"}>
                                            Confirm result
                                        </Text>
                                    )}
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button borderRadius={8} isDisabled={isSaving} marginRight={2} onPress={onClose} size={"sm"} variant={"outline"}>
                                    <Text color={"gray.700"} fontSize={"xs"} fontWeight={"bold"}>Cancel</Text>
                                </Button>
                                <Button
                                    backgroundColor={openScoreboardColor}
                                    borderRadius={8}
                                    isDisabled={isSaving || !isMatchComplete}
                                    onPress={() => setIsConfirming(true)}
                                    size={"sm"}
                                >
                                    <Text color={openScoreboardButtonTextColor} fontSize={"xs"} fontWeight={"bold"}>
                                        Review result
                                    </Text>
                                </Button>
                            </>
                        )}
                    </View>
                </Modal.Footer>
            </Modal.Content>
        </Modal>
    );
}

function CompetitionTableAssignmentModal({
    isOpen,
    isSaving,
    match,
    onClose,
    onConfirm,
    onTableChange,
    selectedTableID,
    tables,
}) {
    if (!match) {
        return null;
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} size={"lg"}>
            <Modal.Content maxWidth={520}>
                <Modal.CloseButton />
                <Modal.Header>{match.scheduledMatchID ? "Change assigned table" : "Send match to table"}</Modal.Header>
                <Modal.Body>
                    <View backgroundColor={"gray.50"} borderColor={"gray.200"} borderRadius={8} borderWidth={1} padding={3}>
                        <Text color={"gray.500"} fontSize={"2xs"} fontWeight={"bold"} textTransform={"uppercase"}>
                            {match.label}
                        </Text>
                        <Text color={"gray.900"} fontSize={"sm"} fontWeight={"bold"} marginTop={1}>
                            {match.playerA || "TBD"} vs {match.playerB || "TBD"}
                        </Text>
                    </View>
                    <FormControl marginTop={4}>
                        <FormControl.Label>Table</FormControl.Label>
                        <Select
                            backgroundColor={"white"}
                            onValueChange={onTableChange}
                            placeholder={tables.length ? "Select a table" : "No tables available"}
                            selectedValue={selectedTableID}
                        >
                            {tables.map(([tableID, tableInfo]: any) => (
                                <Select.Item key={tableID} label={tableInfo?.tableName || "Table"} value={tableID} />
                            ))}
                        </Select>
                    </FormControl>
                </Modal.Body>
                <Modal.Footer>
                    <Button borderRadius={8} isDisabled={isSaving} marginRight={2} onPress={onClose} size={"sm"} variant={"outline"}>
                        <Text color={"gray.700"} fontSize={"xs"} fontWeight={"bold"}>Cancel</Text>
                    </Button>
                    <Button
                        backgroundColor={openScoreboardColor}
                        borderRadius={8}
                        isDisabled={!selectedTableID || isSaving}
                        onPress={onConfirm}
                        size={"sm"}
                    >
                        {isSaving ? (
                            <Spinner color={openScoreboardButtonTextColor} size={"sm"} />
                        ) : (
                            <Text color={openScoreboardButtonTextColor} fontSize={"xs"} fontWeight={"bold"}>
                                {match.scheduledMatchID ? "Update table" : "Send to table"}
                            </Text>
                        )}
                    </Button>
                </Modal.Footer>
            </Modal.Content>
        </Modal>
    );
}

function openDisplayURL(url) {
    if (typeof window !== "undefined") {
        window.open(url, "_blank", "noopener,noreferrer");
    }
}

function CompetitionSettingsPanel({
    bracketGroupStyles,
    competitionID,
    competitionType,
    title,
    setTitle,
}) {
    const displayTypes = getCompetitionDisplayTypes(competitionType);
    const compatibleStyles = (bracketGroupStyles || []).filter((styleEntry) => {
        const style = styleEntry?.[1] || {};
        return !style.displayType || displayTypes.includes(style.displayType);
    });
    const displayLinks = displayTypes.flatMap((displayType) => {
        const stylesForType = compatibleStyles.filter((styleEntry) => {
            const style = styleEntry?.[1] || {};
            return !style.displayType || style.displayType === displayType;
        });

        return [
            {
                description: `Default ${getCompetitionTypeLabel(displayType).toLowerCase()} display.`,
                id: `__default__-${displayType}`,
                styleTitle: `${getCompetitionTypeLabel(displayType)} - Default display`,
                url: competitionID ? getCompetitionDisplayURL(competitionID, competitionType, "", displayType) : "",
            },
            ...stylesForType.map((styleEntry) => {
                const style = styleEntry?.[1] || {};
                const styleID = style.id || styleEntry?.[0] || "";

                return {
                    description: getCompetitionTypeLabel(displayType),
                    id: `${displayType}-${styleID}`,
                    styleTitle: style.title || "Untitled display style",
                    url: getCompetitionDisplayURL(competitionID, competitionType, styleID, displayType),
                };
            }),
        ];
    });

    return (
        <Section
            icon={<MaterialCommunityIcons name="tune-variant" size={22} color={openScoreboardColor} />}
            title={"Competition settings"}
            subtitle={"Name the competition, confirm the format, and copy production display links."}
        >
            <FormControl marginBottom={3}>
                <FormControl.Label>Competition title</FormControl.Label>
                <Input backgroundColor={"white"} color={"gray.900"} onChangeText={setTitle} value={title} />
            </FormControl>

            <View
                backgroundColor={"blue.50"}
                borderColor={"blue.100"}
                borderRadius={8}
                borderWidth={1}
                marginBottom={4}
                padding={3}
            >
                <Text color={"gray.500"} fontSize={"2xs"} fontWeight={"bold"} textTransform={"uppercase"}>
                    Competition type
                </Text>
                <Text color={"gray.900"} fontSize={"md"} fontWeight={"bold"} marginTop={1}>
                    {getCompetitionTypeLabel(competitionType)}
                </Text>
                <Text color={"gray.600"} fontSize={"xs"} marginTop={1}>
                    {competitionType === "roundRobinThenSingleElimination" ?
                        "This competition has both group and bracket production views."
                        : `Display links are generated for the ${getCompetitionDisplayPath(competitionType)} production view.`}
                </Text>
            </View>

            <View>
                <View alignItems={"center"} flexDirection={"row"} justifyContent={"space-between"} marginBottom={2}>
                    <View flex={1} paddingRight={3}>
                        <Text color={"gray.900"} fontSize={"md"} fontWeight={"bold"}>
                            Production display links
                        </Text>
                    <Text color={"gray.600"} fontSize={"xs"} marginTop={1}>
                            {competitionType === "roundRobinThenSingleElimination" ?
                                "Group-stage and bracket links are separate so they can use different display styles."
                                : "Each link combines this competition with a compatible bracket/group display style."}
                        </Text>
                    </View>
                    <View
                        backgroundColor={"gray.50"}
                        borderColor={"gray.200"}
                        borderRadius={999}
                        borderWidth={1}
                        paddingX={3}
                        paddingY={1}
                    >
                        <Text color={"gray.600"} fontSize={"xs"} fontWeight={"bold"}>
                            {displayLinks.length} link{displayLinks.length === 1 ? "" : "s"}
                        </Text>
                    </View>
                </View>

                {displayLinks.map((link) => (
                    <View
                        key={link.id}
                        backgroundColor={"white"}
                        borderColor={"gray.200"}
                        borderRadius={8}
                        borderWidth={1}
                        marginTop={3}
                        padding={3}
                    >
                        <View alignItems={"center"} flexDirection={"row"} justifyContent={"space-between"} marginBottom={2}>
                            <View flex={1} paddingRight={2}>
                                <Text color={"gray.900"} fontSize={"sm"} fontWeight={"bold"}>
                                    {link.styleTitle}
                                </Text>
                                <Text color={"gray.500"} fontSize={"2xs"} marginTop={1}>
                                    {link.description}
                                </Text>
                            </View>
                            <Button
                                borderColor={"blue.100"}
                                borderRadius={8}
                                onPress={() => openDisplayURL(link.url)}
                                size={"sm"}
                                variant={"outline"}
                            >
                                <View alignItems={"center"} flexDirection={"row"}>
                                    <MaterialCommunityIcons name="open-in-new" size={15} color={openScoreboardColor} />
                                    <Text color={openScoreboardColor} fontSize={"xs"} fontWeight={"bold"} marginLeft={1}>
                                        Open
                                    </Text>
                                </View>
                            </Button>
                        </View>
                        <Input
                            backgroundColor={"gray.50"}
                            borderColor={"gray.200"}
                            color={"gray.900"}
                            isReadOnly
                            InputRightElement={<CopyInputRightButton text={link.url} />}
                            value={link.url}
                        />
                    </View>
                ))}

                {compatibleStyles.length === 0 ? (
                    <View
                        backgroundColor={"amber.50"}
                        borderColor={"amber.200"}
                        borderRadius={8}
                        borderWidth={1}
                        marginTop={3}
                        padding={3}
                    >
                        <Text color={"amber.900"} fontSize={"sm"} fontWeight={"bold"}>
                            No saved {getCompetitionTypeLabel(competitionType).toLowerCase()} styles yet.
                        </Text>
                        <Text color={"amber.900"} fontSize={"xs"} marginTop={1}>
                            The default link still works. Create bracket/group display styles to generate additional styled links.
                        </Text>
                    </View>
                ) : null}
            </View>
        </Section>
    );
}

function getCompleteMatchCount(matches = {}) {
    return Object.values(matches || {}).filter((match: any) => match?.isComplete === true).length;
}

function getAllGroupMatches(groups = {}) {
    return Object.values(groups || {}).flatMap((group: any) => Object.values(group?.matches || {}));
}

function isGroupMatchStarted(match: any) {
    return Boolean(match?.scheduledMatchID
        || match?.matchID
        || match?.scheduledStatus
        || match?.isComplete === true
        || Number(match?.AScore) > 0
        || Number(match?.BScore) > 0
        || (Array.isArray(match?.gameScores) && match.gameScores.length > 0));
}

function hasBracketMatchActivity(bracket = []) {
    return getBracketMatchItems(bracket).some((match) => {
        return Boolean(match.scheduledMatchID || match.scheduledStatus || match.isComplete);
    });
}

function getRecommendedCompetitionTab(competitionType, bracket = [], groups = {}) {
    const hasGroups = hasRoundRobinStage(competitionType);
    const hasBracket = hasBracketStage(competitionType);
    const hasGroupPlayers = hasRoundRobinSeeding(groups);
    const hasGroupMatches = getAllGroupMatches(groups).length > 0;
    const hasBracketPlayers = hasBracketSeeding(bracket);
    const hasBracketActivity = hasBracketMatchActivity(bracket);

    if (hasBracket && hasBracketActivity) {
        return "bracketMatches";
    }
    if (hasBracket && hasBracketPlayers) {
        return "bracket";
    }
    if (hasGroups && hasGroupMatches) {
        return "groupMatches";
    }
    if (hasGroups && hasGroupPlayers) {
        return "groups";
    }

    return "seeding";
}

function getToneColors(tone = "gray") {
    if (tone === "blue") {
        return {
            backgroundColor: "blue.50",
            borderColor: "blue.100",
            iconColor: openScoreboardColor,
            textColor: "blue.800",
        };
    }
    if (tone === "green") {
        return {
            backgroundColor: "green.50",
            borderColor: "green.200",
            iconColor: "#15803D",
            textColor: "green.800",
        };
    }
    if (tone === "amber") {
        return {
            backgroundColor: "amber.50",
            borderColor: "amber.200",
            iconColor: "#92400E",
            textColor: "amber.900",
        };
    }
    if (tone === "red") {
        return {
            backgroundColor: "red.50",
            borderColor: "red.200",
            iconColor: "#B91C1C",
            textColor: "red.800",
        };
    }

    return {
        backgroundColor: "gray.50",
        borderColor: "gray.200",
        iconColor: "#6B7280",
        textColor: "gray.700",
    };
}

function getMatchCounts(matches = []) {
    const total = matches.length;
    const complete = matches.filter((match: any) => match.isComplete || match.scheduledStatus === "complete").length;
    const active = matches.filter((match: any) => match.scheduledStatus === "active").length;
    const scheduled = matches.filter((match: any) => match.scheduledMatchID && !match.isComplete && match.scheduledStatus !== "complete").length;
    const readyToPush = matches.filter((match: any) => {
        return getCleanPlayerName(match.playerA)
            && getCleanPlayerName(match.playerB)
            && !match.scheduledMatchID
            && !match.isComplete;
    }).length;
    const notReady = matches.filter((match: any) => {
        return !getCleanPlayerName(match.playerA) || !getCleanPlayerName(match.playerB);
    }).length;

    return {
        active,
        complete,
        notReady,
        readyToPush,
        scheduled,
        total,
    };
}

function getGroupInsights(groups = {}) {
    const groupEntries = Object.entries(groups || {});
    const matches = getRoundRobinMatchItems(groups);
    const matchCounts = getMatchCounts(matches);
    const groupsWithPlayers = groupEntries.filter(([, group]: any) => Object.keys(group?.players || {}).length > 0).length;
    const groupsWithMatches = groupEntries.filter(([, group]: any) => Object.keys(group?.matches || {}).length > 0).length;
    const groupsStarted = groupEntries.filter(([, group]: any) => {
        return Object.values(group?.matches || {}).some((match: any) => {
            return match?.scheduledMatchID
                || match?.scheduledStatus
                || match?.isComplete === true
                || Number(match?.AScore) > 0
                || Number(match?.BScore) > 0;
        });
    }).length;
    const groupsFinished = groupEntries.filter(([, group]: any) => {
        const groupMatches = Object.values(group?.matches || {});
        return groupMatches.length > 0 && groupMatches.every((match: any) => match?.isComplete === true || match?.scheduledStatus === "complete");
    }).length;
    const playerCount = groupEntries.reduce((total, [, group]: any) => {
        return total + Object.keys(group?.players || {}).length;
    }, 0);

    return {
        groupsFinished,
        groupsStarted,
        groupsWithMatches,
        groupsWithPlayers,
        matchCounts,
        playerCount,
        totalGroups: groupEntries.length,
    };
}

function getBracketInsights(bracket = []) {
    const firstRoundTeams = bracket?.[0]?.seeds?.flatMap((seed) => seed.teams || []) || [];
    const playerCount = firstRoundTeams.filter((team) => getCleanPlayerName(team?.name)).length;
    const slotCount = firstRoundTeams.length;
    const matches = getBracketMatchItems(bracket);
    const matchCounts = getMatchCounts(matches);
    const roundsWithPlayers = (bracket || []).filter((round: any) => {
        return (round?.seeds || []).some((seed) => {
            return (seed?.teams || []).some((team) => getCleanPlayerName(team?.name));
        });
    }).length;

    return {
        matchCounts,
        playerCount,
        roundCount: bracket.length,
        roundsWithPlayers,
        slotCount,
    };
}

function getNextInsightAction({ bracketInsights, groupInsights, hasBracket, hasGroups, isCombinedCompetition }) {
    if (hasGroups && groupInsights.playerCount === 0) {
        return {
            label: "Add players to seeding",
            message: "No players are in the group stage yet. Seed players first so groups and matches can be generated.",
            tab: "seeding",
            tone: "amber",
        };
    }

    if (hasGroups && groupInsights.groupsWithMatches === 0) {
        return {
            label: "Review groups",
            message: "Players are assigned to groups, but no group matches have been generated yet.",
            tab: "groups",
            tone: "blue",
        };
    }

    if (hasGroups && groupInsights.matchCounts.readyToPush > 0) {
        return {
            label: "Push group matches",
            message: `${groupInsights.matchCounts.readyToPush} group match${groupInsights.matchCounts.readyToPush === 1 ? "" : "es"} are ready to push to a table.`,
            tab: "groupMatches",
            tone: "blue",
        };
    }

    if (hasGroups && groupInsights.matchCounts.active > 0) {
        return {
            label: "Monitor active groups",
            message: `${groupInsights.matchCounts.active} group match${groupInsights.matchCounts.active === 1 ? " is" : "es are"} active right now.`,
            tab: "groupMatches",
            tone: "amber",
        };
    }

    if (isCombinedCompetition && hasBracket && bracketInsights.playerCount === 0 && groupInsights.matchCounts.complete > 0) {
        return {
            label: "Advance players",
            message: "Group results exist. Review standings and intentionally advance players into the bracket.",
            tab: "advance",
            tone: "blue",
        };
    }

    if (hasBracket && bracketInsights.playerCount === 0) {
        return {
            label: "Seed bracket",
            message: "No bracket slots have players yet. Seed players before generating or pushing bracket matches.",
            tab: "seeding",
            tone: "amber",
        };
    }

    if (hasBracket && bracketInsights.matchCounts.readyToPush > 0) {
        return {
            label: "Push bracket matches",
            message: `${bracketInsights.matchCounts.readyToPush} bracket match${bracketInsights.matchCounts.readyToPush === 1 ? "" : "es"} are ready to push to a table.`,
            tab: "bracketMatches",
            tone: "blue",
        };
    }

    if (hasBracket && bracketInsights.matchCounts.active > 0) {
        return {
            label: "Monitor bracket play",
            message: `${bracketInsights.matchCounts.active} bracket match${bracketInsights.matchCounts.active === 1 ? " is" : "es are"} active right now.`,
            tab: "bracketMatches",
            tone: "amber",
        };
    }

    return {
        label: "Review competition",
        message: "Competition data is ready. Use the flow above to jump into the stage you want to manage.",
        tab: hasGroups ? "groupMatches" : "bracketMatches",
        tone: "green",
    };
}

function InsightMetric({ icon, label, onPress, subtext, tone = "gray", value }) {
    const colors = getToneColors(tone);
    const content = (
        <View
            backgroundColor={"white"}
            borderColor={colors.borderColor}
            borderLeftColor={colors.iconColor}
            borderLeftWidth={3}
            borderRadius={8}
            borderWidth={1}
            minHeight={"64px"}
            padding={2}
            width={"100%"}
        >
            <View alignItems={"center"} flexDirection={"row"}>
                <View
                    alignItems={"center"}
                    backgroundColor={colors.backgroundColor}
                    borderRadius={999}
                    height={28}
                    justifyContent={"center"}
                    marginRight={2}
                    width={28}
                >
                    <MaterialCommunityIcons name={icon} size={15} color={colors.iconColor} />
                </View>
                <View flex={1} minWidth={0}>
                    <Text color={"gray.500"} fontSize={"2xs"} fontWeight={"bold"} numberOfLines={1} textTransform={"uppercase"}>
                        {label}
                    </Text>
                    <Text color={"gray.900"} fontSize={"lg"} fontWeight={"bold"} lineHeight={"lg"} numberOfLines={1}>
                        {value}
                    </Text>
                </View>
                {onPress ? (
                    <MaterialCommunityIcons name="chevron-right" size={18} color={colors.iconColor} />
                ) : null}
            </View>
            {subtext ? (
                <Text color={colors.textColor} fontSize={"2xs"} marginTop={1} numberOfLines={1}>
                    {subtext}
                </Text>
            ) : null}
        </View>
    );

    return (
        <View marginBottom={2} paddingX={1} width={{ base: "50%", sm: "33.3333%", md: "25%" }}>
            {onPress ? (
                <Pressable
                    onPress={onPress}
                    style={({ pressed }) => ({
                        opacity: pressed ? 0.88 : 1,
                        width: "100%",
                    })}
                >
                    {content}
                </Pressable>
            ) : content}
        </View>
    );
}

function CompetitionInsightsPanel({
    bracket,
    groups,
    hasBracket,
    hasGroups,
    isCombinedCompetition,
    onTabChange,
}) {
    const groupInsights = getGroupInsights(groups);
    const bracketInsights = getBracketInsights(bracket);
    const action = getNextInsightAction({
        bracketInsights,
        groupInsights,
        hasBracket,
        hasGroups,
        isCombinedCompetition,
    });
    const actionColors = getToneColors(action.tone);

    return (
        <View
            marginTop={3}
        >
            <View
                backgroundColor={"white"}
                borderColor={"gray.200"}
                borderRadius={8}
                borderWidth={1}
                marginBottom={2}
                padding={2}
            >
                <View alignItems={"center"} flexDirection={"row"}>
                    <View
                        alignItems={"center"}
                        backgroundColor={actionColors.backgroundColor}
                        borderRadius={999}
                        height={34}
                        justifyContent={"center"}
                        marginRight={2}
                        width={34}
                    >
                        <MaterialCommunityIcons name="flag-checkered" size={18} color={actionColors.iconColor} />
                    </View>
                    <View flex={1} minWidth={0} paddingRight={2}>
                        <Text color={actionColors.textColor} fontSize={"2xs"} fontWeight={"bold"} textTransform={"uppercase"}>
                            Next step
                        </Text>
                        <Text color={"gray.900"} fontSize={"sm"} fontWeight={"bold"} numberOfLines={1}>
                            {action.label}
                        </Text>
                        <Text color={"gray.500"} fontSize={"2xs"} numberOfLines={1}>
                            {action.message}
                        </Text>
                    </View>
                    <Button
                        backgroundColor={openScoreboardColor}
                        borderRadius={8}
                        onPress={() => onTabChange(action.tab)}
                        size={"sm"}
                    >
                        <Text color={openScoreboardButtonTextColor} fontSize={"xs"} fontWeight={"bold"}>
                            Open
                        </Text>
                    </Button>
                </View>
            </View>

            <View flexDirection={"row"} flexWrap={"wrap"} marginX={-1}>
                <InsightMetric
                    icon="format-list-numbered"
                    label="Seeding"
                    onPress={() => onTabChange("seeding")}
                    subtext={hasGroups ? `${groupInsights.playerCount} player${groupInsights.playerCount === 1 ? "" : "s"} seeded` : `${bracketInsights.playerCount}/${bracketInsights.slotCount} slots filled`}
                    tone={(hasGroups ? groupInsights.playerCount : bracketInsights.playerCount) > 0 ? "green" : "amber"}
                    value={hasGroups ? groupInsights.playerCount : `${bracketInsights.playerCount}/${bracketInsights.slotCount}`}
                />

                {hasGroups ? (
                    <InsightMetric
                        icon="table-large"
                        label="Groups"
                        onPress={() => onTabChange("groups")}
                        subtext={`${groupInsights.groupsStarted} started / ${groupInsights.groupsFinished} finished`}
                        tone={groupInsights.groupsWithPlayers === 0 ? "amber" : groupInsights.groupsFinished === groupInsights.totalGroups && groupInsights.totalGroups > 0 ? "green" : "blue"}
                        value={`${groupInsights.groupsWithPlayers}/${groupInsights.totalGroups}`}
                    />
                ) : null}

                {hasGroups ? (
                    <InsightMetric
                        icon="calendar-sync-outline"
                        label="Group play"
                        onPress={() => onTabChange("groupMatches")}
                        subtext={`${groupInsights.matchCounts.readyToPush} ready / ${groupInsights.matchCounts.active} active`}
                        tone={groupInsights.matchCounts.active > 0 ? "amber" : groupInsights.matchCounts.readyToPush > 0 ? "blue" : groupInsights.matchCounts.complete === groupInsights.matchCounts.total && groupInsights.matchCounts.total > 0 ? "green" : "gray"}
                        value={`${groupInsights.matchCounts.complete}/${groupInsights.matchCounts.total}`}
                    />
                ) : null}

                {isCombinedCompetition ? (
                    <InsightMetric
                        icon="source-branch-sync"
                        label="Advancing seeds"
                        onPress={() => onTabChange("advance")}
                        subtext={`${bracketInsights.playerCount}/${bracketInsights.slotCount} bracket slots filled`}
                        tone={bracketInsights.playerCount > 0 ? "green" : groupInsights.matchCounts.complete > 0 ? "blue" : "gray"}
                        value={`${bracketInsights.playerCount}/${bracketInsights.slotCount}`}
                    />
                ) : null}

                {hasBracket ? (
                    <InsightMetric
                        icon="tournament"
                        label="Bracket"
                        onPress={() => onTabChange("bracket")}
                        subtext={`${bracketInsights.roundsWithPlayers}/${bracketInsights.roundCount} rounds ready`}
                        tone={bracketInsights.playerCount > 0 ? "green" : "amber"}
                        value={`${bracketInsights.playerCount}/${bracketInsights.slotCount}`}
                    />
                ) : null}

                {hasBracket ? (
                    <InsightMetric
                        icon="calendar-check-outline"
                        label="Bracket play"
                        onPress={() => onTabChange("bracketMatches")}
                        subtext={`${bracketInsights.matchCounts.readyToPush} ready / ${bracketInsights.matchCounts.active} active`}
                        tone={bracketInsights.matchCounts.active > 0 ? "amber" : bracketInsights.matchCounts.readyToPush > 0 ? "blue" : bracketInsights.matchCounts.complete === bracketInsights.matchCounts.total && bracketInsights.matchCounts.total > 0 ? "green" : "gray"}
                        value={`${bracketInsights.matchCounts.complete}/${bracketInsights.matchCounts.total}`}
                    />
                ) : null}
            </View>
        </View>
    );
}

function GroupAdvancementPanel({
    advancementPlayersPerGroup,
    advancementRankingOrder,
    bracket,
    groups,
    onAdvanceGroups,
    onAdvancementCountChange,
    onRankingOrderChange,
}) {
    const [advancementSettingsExpanded, setAdvancementSettingsExpanded] = useState(false);
    const groupEntries = Object.entries(groups || {});
    const advanceCount = Math.max(1, parseInt(`${advancementPlayersPerGroup}`, 10) || 1);
    const bracketSlotCount = Math.max(0, ((bracket?.[0]?.seeds || []).length) * 2);
    const rankingPresetValue = getRankingPresetValue(advancementRankingOrder);
    const rankingPresetLabel = advancementRankingPresets.find((preset) => preset.value === rankingPresetValue)?.label
        || advancementRankingPresets[0].label;
    const advancingRows = groupEntries.flatMap(([groupID, group]: any) => {
        return getGroupPlayerRankingRows(group, advancementRankingOrder)
            .slice(0, advanceCount)
            .map((player, index) => ({
                ...player,
                sourceGroupID: groupID,
                sourceGroupName: group.groupName || groupID,
                sourceGroupRank: index + 1,
            }));
    });

    return (
        <Section
            icon={<MaterialCommunityIcons name="source-branch-sync" size={22} color={openScoreboardColor} />}
            title={"Advance groups into bracket"}
            subtitle={"Review standings, choose how many players advance from each group, then intentionally update the single elimination bracket slots."}
        >
            <View
                backgroundColor={"white"}
                borderColor={"gray.200"}
                borderRadius={8}
                borderWidth={1}
                marginBottom={4}
                overflow={"hidden"}
            >
                <Pressable
                    accessibilityRole={"button"}
                    accessibilityState={{ expanded: advancementSettingsExpanded }}
                    onPress={() => setAdvancementSettingsExpanded((isExpanded) => !isExpanded)}
                    style={({ pressed }) => ({
                        backgroundColor: pressed ? "#F8FAFC" : "#FFFFFF",
                        padding: 14,
                        width: "100%",
                    })}
                >
                    <View alignItems={"center"} flexDirection={"row"}>
                        <View
                            alignItems={"center"}
                            backgroundColor={"blue.50"}
                            borderRadius={7}
                            height={34}
                            justifyContent={"center"}
                            marginRight={3}
                            width={34}
                        >
                            <MaterialCommunityIcons name="tune-variant" size={18} color={openScoreboardColor} />
                        </View>
                        <View flex={1} paddingRight={3}>
                            <Text color={"gray.900"} fontSize={"sm"} fontWeight={"bold"}>
                                Advancement settings
                            </Text>
                            <Text color={"gray.500"} fontSize={"2xs"} marginTop={1} numberOfLines={2}>
                                {advanceCount} player{advanceCount === 1 ? "" : "s"} per group / {rankingPresetLabel}
                            </Text>
                        </View>
                        <MaterialCommunityIcons
                            name={advancementSettingsExpanded ? "chevron-up" : "chevron-down"}
                            size={22}
                            color={openScoreboardColor}
                        />
                    </View>
                </Pressable>

                {advancementSettingsExpanded ? (
                    <View backgroundColor={"blue.50"} borderTopColor={"gray.200"} borderTopWidth={1} padding={3}>
                        <View flexDirection={"row"} flexWrap={"wrap"} justifyContent={"space-between"}>
                            <View marginBottom={3} width={{ base: "100%", md: "32%" }}>
                                <FormControl>
                                    <FormControl.Label>Players advancing per group</FormControl.Label>
                                    <Select selectedValue={`${advancementPlayersPerGroup}`} onValueChange={onAdvancementCountChange}>
                                        {["1", "2", "3", "4", "5", "6", "8"].map((count) => (
                                            <Select.Item key={`advance-count-${count}`} label={count} value={count} />
                                        ))}
                                    </Select>
                                </FormControl>
                            </View>
                            <View marginBottom={3} width={{ base: "100%", md: "65%" }}>
                                <FormControl>
                                    <FormControl.Label>Ranking / tiebreaker order</FormControl.Label>
                                    <Select
                                        selectedValue={rankingPresetValue}
                                        onValueChange={(value) => onRankingOrderChange(getRankingOrderFromPreset(value))}
                                    >
                                        {advancementRankingPresets.map((preset) => (
                                            <Select.Item key={preset.value} label={preset.label} value={preset.value} />
                                        ))}
                                    </Select>
                                </FormControl>
                            </View>
                        </View>
                        <Text color={"blue.900"} fontSize={"xs"}>
                            This only previews standings until you press the update button. Bracket slots are not changed automatically when group scores change.
                        </Text>
                    </View>
                ) : null}
            </View>

            <View
                backgroundColor={advancingRows.length > bracketSlotCount ? "amber.50" : "gray.50"}
                borderColor={advancingRows.length > bracketSlotCount ? "amber.200" : "gray.200"}
                borderRadius={8}
                borderWidth={1}
                marginBottom={4}
                padding={3}
            >
                <Text color={"gray.900"} fontSize={"sm"} fontWeight={"bold"}>
                    {advancingRows.length} advancing player{advancingRows.length === 1 ? "" : "s"} / {bracketSlotCount} bracket slot{bracketSlotCount === 1 ? "" : "s"}
                </Text>
                <Text color={advancingRows.length > bracketSlotCount ? "amber.900" : "gray.600"} fontSize={"xs"} marginTop={1}>
                    {advancingRows.length > bracketSlotCount ?
                        "There are more advancing players than bracket slots. Increase the bracket size or reduce players advancing per group."
                        : "Updating the bracket replaces first-round slots with the current advancing players. Matches can be generated after those slots are ready."}
                </Text>
                <Button
                    alignSelf={"flex-start"}
                    backgroundColor={openScoreboardColor}
                    borderRadius={8}
                    isDisabled={advancingRows.length === 0 || bracketSlotCount === 0 || advancingRows.length > bracketSlotCount}
                    marginTop={3}
                    onPress={onAdvanceGroups}
                >
                    <Text color={openScoreboardButtonTextColor} fontWeight={"bold"}>
                        Update bracket from standings
                    </Text>
                </Button>
            </View>

            <View flexDirection={"row"} flexWrap={"wrap"} justifyContent={"space-between"}>
                {groupEntries.map(([groupID, group]: any) => {
                    const rankedPlayers = getGroupPlayerRankingRows(group, advancementRankingOrder);
                    const totalMatches = Object.keys(group.matches || {}).length;
                    const completeMatches = getCompleteMatchCount(group.matches || {});

                    return (
                        <View key={`advance-group-${groupID}`} marginBottom={3} width={{ base: "100%", lg: "48.5%" }}>
                            <View
                                backgroundColor={"white"}
                                borderColor={"gray.200"}
                                borderRadius={8}
                                borderWidth={1}
                                padding={3}
                            >
                                <View alignItems={"center"} flexDirection={"row"} justifyContent={"space-between"} marginBottom={2}>
                                    <View flex={1} paddingRight={2}>
                                        <Text color={"gray.900"} fontSize={"md"} fontWeight={"bold"}>
                                            {group.groupName || groupID}
                                        </Text>
                                        <Text color={"gray.500"} fontSize={"2xs"} marginTop={1}>
                                            {completeMatches} of {totalMatches} matches complete
                                        </Text>
                                    </View>
                                    <View
                                        backgroundColor={completeMatches === totalMatches && totalMatches > 0 ? "green.50" : "amber.50"}
                                        borderColor={completeMatches === totalMatches && totalMatches > 0 ? "green.200" : "amber.200"}
                                        borderRadius={999}
                                        borderWidth={1}
                                        paddingX={2}
                                        paddingY={1}
                                    >
                                        <Text color={completeMatches === totalMatches && totalMatches > 0 ? "green.700" : "amber.900"} fontSize={"2xs"} fontWeight={"bold"}>
                                            {completeMatches === totalMatches && totalMatches > 0 ? "Finished" : "In progress"}
                                        </Text>
                                    </View>
                                </View>
                                {rankedPlayers.length > 0 ? rankedPlayers.map((player: any, index) => {
                                    const advances = index < advanceCount;

                                    return (
                                        <View
                                            key={`${groupID}-${player.playerID}`}
                                            alignItems={"center"}
                                            backgroundColor={advances ? "green.50" : "gray.50"}
                                            borderColor={advances ? "green.200" : "gray.200"}
                                            borderRadius={8}
                                            borderWidth={1}
                                            flexDirection={"row"}
                                            marginBottom={2}
                                            padding={2}
                                        >
                                            <View alignItems={"center"} backgroundColor={advances ? "green.700" : "gray.300"} borderRadius={999} height={28} justifyContent={"center"} marginRight={2} width={28}>
                                                <Text color={advances ? openScoreboardButtonTextColor : "gray.700"} fontSize={"2xs"} fontWeight={"bold"}>{index + 1}</Text>
                                            </View>
                                            <View flex={1}>
                                                <Text color={"gray.900"} fontSize={"sm"} fontWeight={"bold"} numberOfLines={1}>
                                                    {player.playerName || "TBD"}
                                                </Text>
                                                <Text color={"gray.600"} fontSize={"2xs"}>
                                                    {player.wins}-{player.losses} / Diff {player.pointDifferential} / For {player.pointsFor} / Against {player.pointsAgainst}
                                                </Text>
                                            </View>
                                            {advances ? (
                                                <Text color={"green.700"} fontSize={"2xs"} fontWeight={"bold"}>
                                                    Advances
                                                </Text>
                                            ) : null}
                                        </View>
                                    );
                                }) : (
                                    <Text color={"gray.600"} fontSize={"sm"}>No players assigned to this group yet.</Text>
                                )}
                            </View>
                        </View>
                    );
                })}
            </View>
        </Section>
    );
}

function CompetitionMatchesEditor({
    getMatchBestOf,
    groups,
    isBracket,
    bracket,
    onResetRoundRobinMatches,
    onSaveMatchResult,
    onScheduleMatch,
    onScheduleMatchesToTables,
    savingResultKey,
    schedulingMatchKey,
    resettingGroupMatches,
    tableSelections,
    tables,
    setTableSelections,
}) {
    const [activeRoundIndex, setActiveRoundIndex] = useState(0);
    const [expandedMatchGroupIDs, setExpandedMatchGroupIDs] = useState({});
    const [groupTableSelections, setGroupTableSelections] = useState({});
    const [resultEntryMatch, setResultEntryMatch] = useState(null);
    const [scheduleEntryMatch, setScheduleEntryMatch] = useState(null);
    const [scheduleTableID, setScheduleTableID] = useState("");
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const matchItems = isBracket ? getBracketMatchItems(bracket) : getRoundRobinMatchItems(groups);
    const schedulableMatches = matchItems.filter((match) => getCleanPlayerName(match.playerA) && getCleanPlayerName(match.playerB));
    const startedGroupMatches = !isBracket ? matchItems.filter(isGroupMatchStarted) : [];
    const hasGeneratedGroupMatches = !isBracket && matchItems.length > 0;
    const safeActiveRoundIndex = Math.min(activeRoundIndex, Math.max(0, (bracket || []).length - 1));
    const bracketRoundSections = (bracket || []).map((round, roundIndex) => ({
        matches: matchItems.filter((match) => match.bracketRoundIndex === roundIndex),
        roundIndex,
        title: round.title || `Round ${roundIndex + 1}`,
    }));
    const visibleBracketRoundSections = isBracket && bracketRoundSections.length > 0 ?
        bracketRoundSections.slice(safeActiveRoundIndex, safeActiveRoundIndex + 1)
        : [];
    const roundRobinMatchSections = Object.entries(groups || {}).map(([groupID, group]: any) => ({
        groupID,
        matches: matchItems.filter((match) => match.groupID === groupID),
        rounds: getRoundRobinRoundSections(matchItems.filter((match) => match.groupID === groupID)),
        title: group.groupName || groupID,
    })).filter((section) => section.matches.length > 0);

    function toggleGroupTable(groupID, tableID, maxUsefulTables = 99) {
        setGroupTableSelections((currentSelections) => {
            const currentGroupTables = currentSelections[groupID] || [];
            const nextGroupTables = currentGroupTables.includes(tableID) ?
                currentGroupTables.filter((nextTableID) => nextTableID !== tableID)
                : [...currentGroupTables, tableID];
            const cappedGroupTables = nextGroupTables.slice(0, maxUsefulTables);

            return {
                ...currentSelections,
                [groupID]: cappedGroupTables,
            };
        });
    }

    function getSelectedGroupTables(groupID) {
        return groupTableSelections[groupID] || [];
    }

    function getSelectedGroupTableLabel(tableIDs = []) {
        if (tables.length === 0) {
            return "No tables available";
        }

        if (tableIDs.length === 0) {
            return "Select tables";
        }

        if (tableIDs.length === 1) {
            return getTableNameFromList(tables, tableIDs[0]);
        }

        return `${tableIDs.length} tables selected`;
    }

    function toggleMatchGroup(groupID) {
        setExpandedMatchGroupIDs((currentExpandedGroups) => ({
            ...currentExpandedGroups,
            [groupID]: currentExpandedGroups[groupID] !== true,
        }));
    }

    async function requestResetRoundRobinMatches() {
        if (!onResetRoundRobinMatches || isBracket || !hasGeneratedGroupMatches) {
            return;
        }

        if (startedGroupMatches.length > 0 && !showResetConfirm) {
            setShowResetConfirm(true);
            return;
        }

        setShowResetConfirm(false);
        await onResetRoundRobinMatches();
    }

    function renderRoundTabs() {
        if (!isBracket || bracketRoundSections.length === 0) {
            return null;
        }

        return (
            <View
                backgroundColor={"gray.100"}
                borderColor={"gray.200"}
                borderRadius={10}
                borderWidth={1}
                flexDirection={"row"}
                flexWrap={"wrap"}
                marginBottom={3}
                padding={1}
            >
                {bracketRoundSections.map((round) => {
                    const isActive = safeActiveRoundIndex === round.roundIndex;

                    return (
                        <Button
                            key={`match-round-tab-${round.roundIndex}`}
                            backgroundColor={isActive ? openScoreboardColor : "transparent"}
                            borderRadius={8}
                            margin={1}
                            onPress={() => setActiveRoundIndex(round.roundIndex)}
                            size={"sm"}
                            variant={"ghost"}
                        >
                            <Text color={isActive ? openScoreboardButtonTextColor : openScoreboardColor} fontSize={"xs"} fontWeight={"bold"}>
                                {round.title}
                            </Text>
                        </Button>
                    );
                })}
            </View>
        );
    }

    function renderMatchCard(match) {
        const isSchedulable = getCleanPlayerName(match.playerA) && getCleanPlayerName(match.playerB);
        const bestOf = match.scheduledMatchID && match.bestOf ? match.bestOf : getMatchBestOf ? getMatchBestOf(match) : match.bestOf || 5;
        const matchIsComplete = match.isComplete || match.scheduledStatus === "complete";
        const gameScoreSummary = Array.isArray(match.gameScores) && match.gameScores.length > 0 ?
            match.gameScores.map((gameScore, index) => `G${index + 1}: ${toScoreValue(gameScore.a)}-${toScoreValue(gameScore.b)}`).join("  ")
            : "";

        return (
            <View
                key={match.key}
                backgroundColor={"white"}
                borderColor={"gray.200"}
                borderRadius={8}
                borderWidth={1}
                marginBottom={2}
                overflow={"hidden"}
            >
                <View
                    alignItems={"center"}
                    borderBottomColor={"gray.200"}
                    borderBottomWidth={1}
                    flexDirection={"row"}
                    justifyContent={"space-between"}
                    padding={3}
                >
                    <View flex={1} paddingRight={3}>
                        <Text color={"gray.500"} fontSize={"2xs"} fontWeight={"bold"} textTransform={"uppercase"}>
                            {match.label}
                        </Text>
                        <Text color={"gray.700"} fontSize={"xs"} fontWeight={"bold"} marginTop={1}>
                            Best of {normalizeBestOf(bestOf)}
                        </Text>
                    </View>
                    <View
                        accessibilityLabel={matchIsComplete ? "Match complete" : "Match pending or scheduled"}
                        backgroundColor={matchIsComplete ? "#22C55E" : "#FBBF24"}
                        borderColor={matchIsComplete ? "#15803D" : "#D97706"}
                        borderRadius={999}
                        borderWidth={1}
                        height={"14px"}
                        width={"14px"}
                    >
                    </View>
                </View>

                <View padding={3}>
                    <View borderColor={"gray.200"} borderRadius={8} borderWidth={1} overflow={"hidden"}>
                        <View
                            alignItems={"center"}
                            backgroundColor={"gray.100"}
                            flexDirection={"row"}
                            minHeight={"34px"}
                            paddingX={3}
                        >
                            <Text color={"gray.500"} fontSize={"2xs"} fontWeight={"bold"} textAlign={"center"} textTransform={"uppercase"} width={"40px"}>
                                Seed
                            </Text>
                            <Text color={"gray.500"} flex={1} fontSize={"2xs"} fontWeight={"bold"} paddingLeft={3} textTransform={"uppercase"}>
                                Player
                            </Text>
                            <Text color={"gray.500"} fontSize={"2xs"} fontWeight={"bold"} textAlign={"center"} textTransform={"uppercase"} width={"52px"}>
                                Score
                            </Text>
                        </View>
                        {[
                            {
                                name: match.playerA,
                                score: match.AScore,
                                seed: match.playerASeed,
                            },
                            {
                                name: match.playerB,
                                score: match.BScore,
                                seed: match.playerBSeed,
                            },
                        ].map((playerRow, playerIndex) => (
                            <View
                                key={`${match.key}-player-${playerIndex}`}
                                alignItems={"center"}
                                backgroundColor={"white"}
                                borderColor={"gray.200"}
                                borderTopWidth={playerIndex === 0 ? 0 : 1}
                                flexDirection={"row"}
                                minHeight={"58px"}
                                paddingX={3}
                                paddingY={2}
                            >
                                <View
                                    alignItems={"center"}
                                    backgroundColor={"gray.100"}
                                    borderColor={"gray.200"}
                                    borderRadius={999}
                                    borderWidth={1}
                                    height={"32px"}
                                    justifyContent={"center"}
                                    width={"32px"}
                                >
                                    <Text color={"gray.700"} fontSize={"xs"} fontWeight={"bold"} textAlign={"center"}>
                                        {playerRow.seed || "-"}
                                    </Text>
                                </View>
                                <Text color={"gray.900"} flex={1} fontSize={"sm"} fontWeight={"bold"} paddingLeft={3} paddingRight={3}>
                                    {playerRow.name || "TBD"}
                                </Text>
                                <View alignItems={"center"} justifyContent={"center"} width={"52px"}>
                                    <Text color={"gray.900"} fontSize={"xl"} fontWeight={"bold"} textAlign={"center"}>
                                        {toScoreValue(playerRow.score)}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>

                    {gameScoreSummary ? (
                        <Text color={"gray.500"} fontSize={"2xs"} marginTop={2}>
                            {gameScoreSummary}
                        </Text>
                    ) : null}
                    <View flexDirection={{ base: "column", sm: "row" }} marginTop={3}>
                        <Button
                            borderColor={openScoreboardColor}
                            borderRadius={8}
                            isDisabled={!isSchedulable || savingResultKey === match.key}
                            marginBottom={{ base: 2, sm: 0 }}
                            marginRight={{ base: 0, sm: 2 }}
                            onPress={() => setResultEntryMatch(match)}
                            size={"sm"}
                            variant={"outline"}
                            width={{ base: "100%", sm: "auto" }}
                        >
                            <View alignItems={"center"} flexDirection={"row"}>
                                <MaterialCommunityIcons name="scoreboard-outline" size={16} color={openScoreboardColor} />
                                <Text color={openScoreboardColor} fontSize={"xs"} fontWeight={"bold"} marginLeft={1}>
                                    {matchIsComplete ? "Edit result" : "Enter result"}
                                </Text>
                            </View>
                        </Button>
                        <Button
                            backgroundColor={match.scheduledMatchID ? "gray.100" : openScoreboardColor}
                            borderColor={match.scheduledMatchID ? "gray.300" : openScoreboardColor}
                            borderRadius={8}
                            borderWidth={1}
                            isDisabled={!isSchedulable || matchIsComplete || schedulingMatchKey === match.key}
                            onPress={() => {
                                const nextTableID = tableSelections[match.key] || match.tableID || "";
                                setScheduleTableID(nextTableID);
                                setScheduleEntryMatch(match);
                            }}
                            size={"sm"}
                            variant={"solid"}
                            width={{ base: "100%", sm: "auto" }}
                        >
                            {schedulingMatchKey === match.key ? (
                                <Spinner color={match.scheduledMatchID ? openScoreboardColor : openScoreboardButtonTextColor} size={"sm"} />
                            ) : (
                                <View alignItems={"center"} flexDirection={"row"}>
                                    <MaterialCommunityIcons
                                        name={match.scheduledMatchID ? "table-check" : "table-arrow-right"}
                                        size={16}
                                        color={match.scheduledMatchID ? openScoreboardColor : openScoreboardButtonTextColor}
                                    />
                                    <Text
                                        color={match.scheduledMatchID ? openScoreboardColor : openScoreboardButtonTextColor}
                                        fontSize={"xs"}
                                        fontWeight={"bold"}
                                        marginLeft={1}
                                    >
                                        {match.scheduledMatchID ? `Scheduled on ${match.tableName || "table"}` : "Send to table"}
                                    </Text>
                                </View>
                            )}
                        </Button>
                    </View>

                    {!isSchedulable ? (
                        <Text color={"red.700"} fontSize={"xs"} marginTop={2}>
                            Add both players before entering a result or sending this match to a table.
                        </Text>
                    ) : null}
                </View>
            </View>
        );
    }

    return (
        <View>
            <View
                backgroundColor={"blue.50"}
                borderColor={"blue.100"}
                borderRadius={8}
                borderWidth={1}
                marginBottom={4}
                padding={3}
            >
                <Text color={"gray.900"} fontSize={"sm"} fontWeight={"bold"}>
                    Expected matches
                </Text>
                <Text color={"gray.600"} fontSize={"xs"} marginTop={1}>
                    {isBracket ?
                        "Bracket matches are based on the current player slots. Push a match to a table when it is ready to be played."
                        : "After the groups are finalized, generate play rounds where each player appears at most once per round, then push each play round to the table or tables where it should be played."}
                </Text>
                {!isBracket ? (
                    <View flexDirection={"row"} flexWrap={"wrap"} marginTop={3}>
                        {hasGeneratedGroupMatches ? (
                            <Button
                                borderColor={"red.300"}
                                borderRadius={8}
                                borderWidth={1}
                                isDisabled={resettingGroupMatches}
                                marginTop={2}
                                onPress={requestResetRoundRobinMatches}
                                variant={"outline"}
                            >
                                {resettingGroupMatches ? (
                                    <Spinner color={"red.700"} size={"sm"} />
                                ) : (
                                    <Text color={"red.700"} fontWeight={"bold"}>Reset matches and edit groups</Text>
                                )}
                            </Button>
                        ) : null}
                    </View>
                ) : null}
                {!isBracket && showResetConfirm ? (
                    <View
                        backgroundColor={"red.50"}
                        borderColor={"red.200"}
                        borderRadius={8}
                        borderWidth={1}
                        marginTop={3}
                        padding={3}
                    >
                        <Text color={"red.800"} fontSize={"sm"} fontWeight={"bold"}>
                            Reset generated group matches?
                        </Text>
                        <Text color={"red.800"} fontSize={"xs"} marginTop={1}>
                            {startedGroupMatches.length} match{startedGroupMatches.length === 1 ? "" : "es"} already have scheduled links, scores, or activity. Resetting removes the generated match list, clears linked scheduled table matches, and returns you to group setup.
                        </Text>
                        <View flexDirection={"row"} flexWrap={"wrap"} marginTop={3}>
                            <Button
                                backgroundColor={"red.700"}
                                borderRadius={8}
                                isDisabled={resettingGroupMatches}
                                marginRight={2}
                                marginTop={2}
                                onPress={requestResetRoundRobinMatches}
                            >
                                <Text color={openScoreboardButtonTextColor} fontWeight={"bold"}>Reset anyway</Text>
                            </Button>
                            <Button
                                borderRadius={8}
                                isDisabled={resettingGroupMatches}
                                marginTop={2}
                                onPress={() => setShowResetConfirm(false)}
                                variant={"outline"}
                            >
                                <Text color={"gray.700"} fontWeight={"bold"}>Cancel</Text>
                            </Button>
                        </View>
                    </View>
                ) : null}
            </View>

            {matchItems.length === 0 ? (
                <View backgroundColor={"white"} borderColor={"gray.200"} borderRadius={8} borderWidth={1} padding={4}>
                    <Text color={"gray.900"} fontSize={"md"} fontWeight={"bold"}>
                        No matches generated yet
                    </Text>
                    <Text color={"gray.600"} fontSize={"sm"} marginTop={1}>
                        {isBracket ? "Add players to bracket slots first." : "Assign players to groups, then generate the match list."}
                    </Text>
                </View>
            ) : null}

            {isBracket ? (
                <>
                    {renderRoundTabs()}
                    <View flexDirection={"row"} flexWrap={"wrap"} justifyContent={"space-between"}>
                        {visibleBracketRoundSections.map((section) => (
                            <View
                                key={`match-round-column-${section.roundIndex}`}
                                width={"100%"}
                            >
                                <View alignItems={"center"} flexDirection={"row"} justifyContent={"space-between"} marginBottom={2}>
                                    <Text color={"gray.900"} fontSize={"md"} fontWeight={"bold"}>{section.title}</Text>
                                    <Text color={"gray.500"} fontSize={"2xs"} fontWeight={"bold"} textTransform={"uppercase"}>
                                        {section.matches.length} match{section.matches.length === 1 ? "" : "es"}
                                    </Text>
                                </View>
                                <ScrollView
                                    maxHeight={720}
                                    nestedScrollEnabled
                                    style={Platform.OS === "web" ? ({ maxHeight: 720 } as any) : undefined}
                                >
                                    {section.matches.map(renderMatchCard)}
                                </ScrollView>
                            </View>
                        ))}
                    </View>
                </>
            ) : (
                <View>
                    {roundRobinMatchSections.map((section) => {
                        const selectedGroupTableIDs = getSelectedGroupTables(section.groupID);
                        const maxUsefulTables = Math.max(1, ...section.rounds.map((round: any) => round.matches.length));
                        const isExpanded = expandedMatchGroupIDs[section.groupID] === true;
                        const completedMatchCount = section.matches.filter((match) => {
                            return match.isComplete === true || match.scheduledStatus === "complete";
                        }).length;
                        const scheduledMatchCount = section.matches.filter((match) => {
                            return match.scheduledMatchID && match.isComplete !== true && match.scheduledStatus !== "complete";
                        }).length;

                        return (
                            <View
                                key={`group-match-section-${section.groupID}`}
                                backgroundColor={"white"}
                                borderColor={"gray.200"}
                                borderRadius={8}
                                borderWidth={1}
                                marginBottom={3}
                                overflow={"hidden"}
                            >
                                <Pressable
                                    accessibilityRole={"button"}
                                    accessibilityState={{ expanded: isExpanded }}
                                    onPress={() => toggleMatchGroup(section.groupID)}
                                    style={({ pressed }) => ({
                                        backgroundColor: pressed ? "#F8FAFC" : "#FFFFFF",
                                        padding: 14,
                                        width: "100%",
                                    })}
                                >
                                    <View alignItems={"center"} flexDirection={"row"}>
                                        <View
                                            alignItems={"center"}
                                            backgroundColor={"blue.50"}
                                            borderRadius={7}
                                            height={34}
                                            justifyContent={"center"}
                                            marginRight={3}
                                            width={34}
                                        >
                                            <MaterialCommunityIcons name="table-tennis" size={18} color={openScoreboardColor} />
                                        </View>
                                        <View flex={1} paddingRight={3}>
                                            <Text color={"gray.900"} fontSize={"md"} fontWeight={"bold"}>
                                                {section.title}
                                            </Text>
                                            <Text color={"gray.500"} fontSize={"2xs"} fontWeight={"bold"} marginTop={1} textTransform={"uppercase"}>
                                                {section.rounds.length} round{section.rounds.length === 1 ? "" : "s"} / {completedMatchCount}/{section.matches.length} complete
                                                {scheduledMatchCount > 0 ? ` / ${scheduledMatchCount} scheduled` : ""}
                                            </Text>
                                        </View>
                                        <MaterialCommunityIcons
                                            name={isExpanded ? "chevron-up" : "chevron-down"}
                                            size={22}
                                            color={openScoreboardColor}
                                        />
                                    </View>
                                </Pressable>

                                {isExpanded ? (
                                    <View borderTopColor={"gray.200"} borderTopWidth={1} padding={3}>
                                        <View alignItems={"center"} flexDirection={"row"} flexWrap={"wrap"} justifyContent={"flex-end"} marginBottom={2}>
                                            <View marginTop={2} minWidth={220}>
                                                <Menu
                                                    closeOnSelect={false}
                                                    placement={"bottom right"}
                                                    trigger={(triggerProps) => (
                                                        <Button
                                                            {...triggerProps}
                                                            backgroundColor={"white"}
                                                            borderColor={selectedGroupTableIDs.length > 0 ? openScoreboardColor : "blue.200"}
                                                            borderRadius={8}
                                                            borderWidth={1}
                                                            isDisabled={tables.length === 0}
                                                            justifyContent={"space-between"}
                                                            paddingX={3}
                                                            size={"sm"}
                                                            variant={"outline"}
                                                            width={"100%"}
                                                        >
                                                            <View alignItems={"center"} flexDirection={"row"} justifyContent={"space-between"} width={"100%"}>
                                                                <View flex={1} paddingRight={2}>
                                                                    <Text color={"gray.500"} fontSize={"2xs"} fontWeight={"bold"} textTransform={"uppercase"}>
                                                                        Tables
                                                                    </Text>
                                                                    <Text color={selectedGroupTableIDs.length > 0 ? openScoreboardColor : "gray.700"} fontSize={"xs"} fontWeight={"bold"} numberOfLines={1}>
                                                                        {getSelectedGroupTableLabel(selectedGroupTableIDs)}
                                                                    </Text>
                                                                </View>
                                                                <MaterialCommunityIcons name="chevron-down" size={18} color={openScoreboardColor} />
                                                            </View>
                                                        </Button>
                                                    )}
                                                >
                                                    <Menu.Item isDisabled>
                                                        <Text color={"gray.500"} fontSize={"2xs"} fontWeight={"bold"} textTransform={"uppercase"}>
                                                            Select up to {maxUsefulTables}
                                                        </Text>
                                                    </Menu.Item>
                                                    {tables.map(([tableID, tableInfo]: any) => {
                                                        const isSelected = selectedGroupTableIDs.includes(tableID);
                                                        const extraTableWouldSitUnused = !isSelected && selectedGroupTableIDs.length >= maxUsefulTables;

                                                        return (
                                                            <Menu.Item
                                                                key={`group-table-menu-${section.groupID}-${tableID}`}
                                                                isDisabled={extraTableWouldSitUnused}
                                                                onPress={() => toggleGroupTable(section.groupID, tableID, maxUsefulTables)}
                                                            >
                                                                <View alignItems={"center"} flexDirection={"row"} opacity={extraTableWouldSitUnused ? 0.5 : 1}>
                                                                    <MaterialCommunityIcons
                                                                        name={isSelected ? "checkbox-marked" : "checkbox-blank-outline"}
                                                                        size={18}
                                                                        color={isSelected ? openScoreboardColor : "#6B7280"}
                                                                    />
                                                                    <View marginLeft={2}>
                                                                        <Text color={"gray.900"} fontSize={"sm"} fontWeight={"bold"}>
                                                                            {tableInfo?.tableName || "Table"}
                                                                        </Text>
                                                                        {extraTableWouldSitUnused ? (
                                                                            <Text color={"gray.500"} fontSize={"2xs"}>
                                                                                Extra table would sit unused
                                                                            </Text>
                                                                        ) : null}
                                                                    </View>
                                                                </View>
                                                            </Menu.Item>
                                                        );
                                                    })}
                                                </Menu>
                                            </View>
                                        </View>
                                        <Text color={"gray.600"} fontSize={"xs"} marginBottom={3}>
                                            Select up to {maxUsefulTables} table{maxUsefulTables === 1 ? "" : "s"} for this group. Each play round has no overlapping players, so extra tables would sit unused.
                                        </Text>

                                {section.rounds.map((round: any) => {
                                    const roundReadyMatches = round.matches.filter((match) => {
                                        return getCleanPlayerName(match.playerA)
                                            && getCleanPlayerName(match.playerB)
                                            && !match.scheduledMatchID
                                            && !match.isComplete;
                                    });
                                    const bulkKey = `round-${section.groupID}-${round.roundNumber}`;

                                    return (
                                        <View
                                            key={`group-round-${section.groupID}-${round.roundNumber}`}
                                            backgroundColor={"gray.50"}
                                            borderColor={"gray.200"}
                                            borderRadius={8}
                                            borderWidth={1}
                                            marginTop={3}
                                            padding={3}
                                        >
                                            <View alignItems={"center"} flexDirection={"row"} flexWrap={"wrap"} justifyContent={"space-between"} marginBottom={2}>
                                                <View flex={1} minWidth={190} paddingRight={3}>
                                                    <Text color={"gray.900"} fontSize={"sm"} fontWeight={"bold"}>
                                                        {round.title}
                                                    </Text>
                                                    <Text color={"gray.500"} fontSize={"2xs"} marginTop={1}>
                                                        {roundReadyMatches.length} ready to push / {round.matches.length} total
                                                    </Text>
                                                </View>
                                                <Button
                                                    backgroundColor={openScoreboardColor}
                                                    borderRadius={8}
                                                    isDisabled={selectedGroupTableIDs.length === 0 || roundReadyMatches.length === 0 || schedulingMatchKey === bulkKey}
                                                    marginTop={2}
                                                    onPress={() => onScheduleMatchesToTables(round.matches, selectedGroupTableIDs, bulkKey)}
                                                    size={"sm"}
                                                >
                                                    {schedulingMatchKey === bulkKey ? (
                                                        <Spinner color={openScoreboardButtonTextColor} size={"sm"} />
                                                    ) : (
                                                        <Text color={openScoreboardButtonTextColor} fontSize={"xs"} fontWeight={"bold"}>
                                                            Push play round
                                                        </Text>
                                                    )}
                                                </Button>
                                            </View>
                                            <View flexDirection={"row"} flexWrap={"wrap"} justifyContent={"space-between"}>
                                                {round.matches.map((match) => (
                                                    <View key={`group-round-match-wrap-${match.key}`} width={{ base: "100%", xl: "48.5%" }}>
                                                        {renderMatchCard(match)}
                                                    </View>
                                                ))}
                                            </View>
                                        </View>
                                    );
                                })}
                                    </View>
                                ) : null}
                            </View>
                        );
                    })}
                </View>
            )}

            {schedulableMatches.length !== matchItems.length && matchItems.length > 0 ? (
                <Text color={"gray.500"} fontSize={"xs"} marginTop={1}>
                    Matches with TBD players cannot accept results or be sent to a table until both players are set.
                </Text>
            ) : null}
            <CompetitionGameScoreModal
                getMatchBestOf={getMatchBestOf}
                isOpen={Boolean(resultEntryMatch)}
                isSaving={Boolean(resultEntryMatch && savingResultKey === resultEntryMatch.key)}
                match={resultEntryMatch}
                onClose={() => setResultEntryMatch(null)}
                onSave={async (match, resultFields) => {
                    const didSave = await onSaveMatchResult(match, resultFields);
                    if (didSave !== false) {
                        setResultEntryMatch(null);
                    }
                }}
            />
            <CompetitionTableAssignmentModal
                isOpen={Boolean(scheduleEntryMatch)}
                isSaving={Boolean(scheduleEntryMatch && schedulingMatchKey === scheduleEntryMatch.key)}
                match={scheduleEntryMatch}
                onClose={() => setScheduleEntryMatch(null)}
                onConfirm={async () => {
                    if (!scheduleEntryMatch || !scheduleTableID) {
                        return;
                    }

                    const didSchedule = await onScheduleMatch(scheduleEntryMatch, scheduleTableID);
                    if (didSchedule === false) {
                        return;
                    }

                    setTableSelections((currentSelections) => ({
                        ...currentSelections,
                        [scheduleEntryMatch.key]: scheduleTableID,
                    }));
                    setScheduleEntryMatch(null);
                }}
                onTableChange={setScheduleTableID}
                selectedTableID={scheduleTableID}
                tables={tables}
            />
        </View>
    );
}

export default function CompetitionEditor(props) {
    const competitionID = props.route?.params?.competitionID || "";
    const [competition, setCompetition] = useState(null);
    const [doneLoading, setDoneLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");
    const [statusType, setStatusType] = useState("success");
    const [showStatusToast, setShowStatusToast] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [title, setTitle] = useState("");
    const [largestRound, setLargestRound] = useState("Quarterfinals");
    const [bracketDefaultBestOf, setBracketDefaultBestOf] = useState("5");
    const [bracketUpgradeBestOf, setBracketUpgradeBestOf] = useState("7");
    const [bracketUpgradeRound, setBracketUpgradeRound] = useState("");
    const [roundRobinBestOf, setRoundRobinBestOf] = useState("5");
    const [advancementPlayersPerGroup, setAdvancementPlayersPerGroup] = useState("2");
    const [advancementRankingOrder, setAdvancementRankingOrder] = useState(["wins", "losses", "pointDifferential", "pointsFor", "pointsAgainst"]);
    const [bracket, setBracket] = useState([]);
    const [bracketGroupStyles, setBracketGroupStyles] = useState([]);
    const [activeTab, setActiveTab] = useState("settings");
    const [loadingPlayers, setLoadingPlayers] = useState(false);
    const [groups, setGroups] = useState({});
    const [addingMissingSeedPlayers, setAddingMissingSeedPlayers] = useState(false);
    const [playerEntries, setPlayerEntries] = useState([]);
    const [playerLists, setPlayerLists] = useState([]);
    const [playerSearch, setPlayerSearch] = useState("");
    const [seedSource, setSeedSource] = useState("playerList");
    const [seedText, setSeedText] = useState("");
    const [selectedSeedPlayerIDs, setSelectedSeedPlayerIDs] = useState([]);
    const [seedingStrategy, setSeedingStrategy] = useState("snake");
    const [savingResultKey, setSavingResultKey] = useState("");
    const [schedulingMatchKey, setSchedulingMatchKey] = useState("");
    const [resettingGroupMatches, setResettingGroupMatches] = useState(false);
    const [selectedPlayerListID, setSelectedPlayerListID] = useState("");
    const [tableSelections, setTableSelections] = useState({});
    const [tables, setTables] = useState([]);

    const competitionType = competition?.type || "singleElimination";
    const isTeamCompetition = competition?.participantType === "team";
    const competitionSportName = normalizeCompetitionSportName(competition?.sportName || competition?.data?.sportName || "tableTennis");
    const competitionTables = useMemo(() => tables.filter(([, tableInfo]: any) => {
        return normalizeCompetitionSportName(tableInfo?.sportName || "tableTennis") === competitionSportName;
    }), [competitionSportName, tables]);
    const isCombinedCompetition = isCombinedCompetitionType(competitionType);
    const hasGroups = hasRoundRobinStage(competitionType);
    const hasBracket = hasBracketStage(competitionType);
    const activeMatchType = activeTab === "bracketMatches" ? "singleElimination" :
        activeTab === "groupMatches" ? "roundRobin" :
            hasBracket && !hasGroups ? "singleElimination" : "roundRobin";
    const isBracket = activeMatchType === "singleElimination";
    const csvSeedEntries = useMemo(() => {
        return enrichSeedEntries(parseSeedText(seedText), playerEntries, selectedPlayerListID);
    }, [playerEntries, seedText, selectedPlayerListID]);
    const playerListSeedEntries = useMemo(() => {
        return selectedSeedPlayerIDs
            .map((playerID, index) => {
                const entry = playerEntries.find((nextEntry) => getEntryID(nextEntry) === playerID);
                return entry ? getSeedFromPlayerEntry(entry, index + 1, selectedPlayerListID) : null;
            })
            .filter(Boolean);
    }, [playerEntries, selectedPlayerListID, selectedSeedPlayerIDs]);
    const seedEntries = seedSource === "playerList" ? playerListSeedEntries : csvSeedEntries;
    const missingSeedEntries = useMemo(() => {
        return seedSource === "csv" && selectedPlayerListID ? csvSeedEntries.filter((seed) => !seed.sourcePlayerID) : [];
    }, [csvSeedEntries, seedSource, selectedPlayerListID]);
    const seedingApplied = isBracket ? hasBracketSeeding(bracket) : hasRoundRobinSeeding(groups);
    const showFloatingSeedingPrompt = !isTeamCompetition && activeTab === "seeding" && seedEntries.length > 0;

    useEffect(() => {
        async function loadCompetition() {
            setDoneLoading(false);
            const [nextCompetition, nextTables, nextBracketGroupStyles] = await Promise.all([
                getCompetition(competitionID),
                getMyTables(),
                getMyBracketGroupStyles(),
            ]);
            const nextPlayerLists = await getMyPlayerLists();
            setCompetition(nextCompetition || {});
            setTables(nextTables || []);
            setBracketGroupStyles(nextBracketGroupStyles || []);
            setTitle(getCompetitionTitle(nextCompetition));
            setLargestRound(nextCompetition?.data?.largestRound || "Quarterfinals");
            setBracketDefaultBestOf(`${normalizeBestOf(nextCompetition?.data?.bracketDefaultBestOf || 5, 5)}`);
            setBracketUpgradeBestOf(`${normalizeBestOf(nextCompetition?.data?.bracketUpgradeBestOf || 7, 7)}`);
            setBracketUpgradeRound(nextCompetition?.data?.bracketUpgradeRound || "");
            setRoundRobinBestOf(`${normalizeBestOf(nextCompetition?.data?.roundRobinBestOf || 5, 5)}`);
            setAdvancementPlayersPerGroup(`${nextCompetition?.data?.advancementPlayersPerGroup || 2}`);
            setAdvancementRankingOrder(nextCompetition?.data?.advancementRankingOrder || ["wins", "losses", "pointDifferential", "pointsFor", "pointsAgainst"]);
            const nextBracket = cloneBracket(nextCompetition?.data?.brackets || []);
            const nextGroups = cloneGroups(nextCompetition?.groups || {});
            setBracket(nextBracket);
            setGroups(nextGroups);
            setActiveTab(nextCompetition?.participantType === "team" ?
                "teamTournament"
                : getRecommendedCompetitionTab(nextCompetition?.type || "singleElimination", nextBracket, nextGroups));
            setPlayerLists(nextPlayerLists || []);
            setSelectedPlayerListID(nextCompetition?.playerListID || nextPlayerLists?.[0]?.[1]?.id || "");
            setSeedingStrategy(nextCompetition?.type === "singleElimination" ? "standard" : "snake");
            setHasUnsavedChanges(false);
            setDoneLoading(true);
        }

        loadCompetition();
    }, [competitionID]);

    useEffect(() => {
        if (!competitionID || !doneLoading || hasUnsavedChanges) {
            return;
        }

        return subscribeToCompetition(competitionID, (nextCompetition) => {
            if (!nextCompetition) {
                return;
            }

            setCompetition(nextCompetition);
            setBracket(cloneBracket(nextCompetition?.data?.brackets || []));
            setGroups(cloneGroups(nextCompetition?.groups || {}));
        });
    }, [competitionID, doneLoading, hasUnsavedChanges]);

    useEffect(() => {
        async function loadPlayerList() {
            if (!selectedPlayerListID) {
                setPlayerEntries([]);
                return;
            }

            setLoadingPlayers(true);
            try {
                const players = await getImportPlayerList(selectedPlayerListID);
                setPlayerEntries(players);
                setSelectedSeedPlayerIDs([]);
                setPlayerSearch("");
            }
            catch (error) {
                console.error("[CompetitionEditor] failed to load player list", error);
                setPlayerEntries([]);
            }
            finally {
                setLoadingPlayers(false);
            }
        }

        loadPlayerList();
    }, [selectedPlayerListID]);

    useEffect(() => {
        if (!statusMessage) {
            setShowStatusToast(false);
            return;
        }

        setShowStatusToast(true);
        const timeout = setTimeout(() => {
            setShowStatusToast(false);
        }, statusType === "error" ? 6500 : 4500);

        return () => clearTimeout(timeout);
    }, [statusMessage, statusType]);

    function resetBracket() {
        setBracket(generateEmptyBracket(largestRound));
        setHasUnsavedChanges(true);
    }

    function markUnsavedChanges() {
        setHasUnsavedChanges(true);
    }

    function updateTitle(nextTitle) {
        setTitle(nextTitle);
        markUnsavedChanges();
    }

    function updateLargestRound(nextLargestRound) {
        setLargestRound(nextLargestRound);
        markUnsavedChanges();
    }

    function updateBracketDefaultBestOf(nextBestOf) {
        setBracketDefaultBestOf(nextBestOf);
        markUnsavedChanges();
    }

    function updateBracketUpgradeBestOf(nextBestOf) {
        setBracketUpgradeBestOf(nextBestOf);
        markUnsavedChanges();
    }

    function updateBracketUpgradeRound(nextRound) {
        setBracketUpgradeRound(nextRound);
        markUnsavedChanges();
    }

    function updateRoundRobinBestOf(nextBestOf) {
        setRoundRobinBestOf(nextBestOf);
        markUnsavedChanges();
    }

    function updateAdvancementPlayersPerGroup(nextCount) {
        setAdvancementPlayersPerGroup(nextCount);
        markUnsavedChanges();
    }

    function updateAdvancementRankingOrder(nextRankingOrder) {
        setAdvancementRankingOrder(nextRankingOrder);
        markUnsavedChanges();
    }

    function updateSelectedPlayerListID(nextPlayerListID) {
        setSelectedPlayerListID(nextPlayerListID);
        markUnsavedChanges();
    }

    function updateBracketState(updater) {
        setBracket(updater);
        markUnsavedChanges();
    }

    function updateGroupsState(updater) {
        setGroups(updater);
        markUnsavedChanges();
    }

    function buildCompetitionUpdates(nextBracket = bracket, nextGroups = groups) {
        const nextData = {
            ...(competition?.data || {}),
            ...(hasBracket ? {
                bracketDefaultBestOf: normalizeBestOf(bracketDefaultBestOf, 5),
                bracketUpgradeBestOf: normalizeBestOf(bracketUpgradeBestOf, 7),
                bracketUpgradeRound,
                brackets: nextBracket,
                largestRound,
            } : {}),
            ...(hasGroups ? {
                advancementPlayersPerGroup: Math.max(1, parseInt(`${advancementPlayersPerGroup}`, 10) || 1),
                advancementRankingOrder,
                roundRobinBestOf: normalizeBestOf(roundRobinBestOf, 5),
            } : {}),
            title,
        };

        return {
            data: nextData,
            ...(!isTeamCompetition ? { playerListID: selectedPlayerListID } : {}),
            ...(hasGroups ? { groups: nextGroups } : {}),
        };
    }

    function buildSeededRoundRobinGroups() {
        const currentEntries = Object.entries(groups || {});
        const groupCount = Math.max(1, currentEntries.length || 1);
        const nextGroups = currentEntries.reduce((groupMap, [groupID, group]: any) => {
            groupMap[groupID] = {
                ...group,
                matches: {},
                players: {},
            };
            return groupMap;
        }, {});

        seedEntries.forEach((seed, index) => {
            const groupIndex = getGroupIndexForSeed(seedingStrategy, index, groupCount, seedEntries.length);
            const targetEntry: any = currentEntries[groupIndex] || currentEntries[0];
            const targetGroupID = targetEntry?.[0] || "group-1";
            const targetGroup = nextGroups[targetGroupID] || {
                groupName: `Group ${groupIndex + 1}`,
                matches: {},
                players: {},
                showOnBoard: true,
            };
            const playerID = seed.sourcePlayerID ? `player-${seed.sourcePlayerID}` : `seed-${seed.seed}-${normalizeNameForLookup(getSeedPlayerName(seed)).replace(/[^a-z0-9]+/g, "-")}`;
            const seedPosition = Object.keys(targetGroup.players || {}).length + 1;

            nextGroups[targetGroupID] = {
                ...targetGroup,
                players: {
                    ...(targetGroup.players || {}),
                    [playerID]: seedEntryToGroupPlayer(seed, seedPosition, selectedPlayerListID),
                },
            };
        });

        return nextGroups;
    }

    function buildSeededBracket() {
        const nextBracket = cloneBracket(bracket.length > 0 ? bracket : generateEmptyBracket(largestRound));
        const firstRound = nextBracket[0];
        const slotCount = (firstRound?.seeds?.length || 0) * 2;
        const seedOrder = getBracketSlotSeedOrder(slotCount, seedingStrategy);
        const slotTeams = seedOrder.map((seedNumber) => {
            const seed = seedEntries.find((nextSeed) => nextSeed.seed === seedNumber) || seedEntries[seedNumber - 1];
            return seed ? seedEntryToBracketTeam(seed) : { name: BYE_PLAYER_NAME };
        });

        firstRound.seeds = (firstRound.seeds || []).map((seed, seedIndex) => {
            const nextSeed = {
                ...seed,
                AScore: 0,
                BScore: 0,
                gameScores: [],
                isComplete: false,
                matchID: "",
                scheduledMatchID: "",
                scheduledStatus: "",
                sourceID: "",
                sourceTitle: "",
                sourceType: "",
                startTime: "",
                tableID: "",
                tableName: "",
                teams: [
                    slotTeams[seedIndex * 2] || { name: BYE_PLAYER_NAME },
                    slotTeams[seedIndex * 2 + 1] || { name: BYE_PLAYER_NAME },
                ],
            };
            delete nextSeed.winnerTeamIndex;
            return normalizeSeedWithBye(nextSeed);
        });

        return normalizeBracketByesAndAdvance(nextBracket);
    }

    async function applySeeding() {
        if (seedEntries.length === 0) {
            setStatusType("error");
            setStatusMessage(seedSource === "playerList" ? "Select players from the player list before applying seeding." : "Paste or upload seeded players before applying seeding.");
            return;
        }

        setStatusMessage("");
        try {
            if (isBracket) {
                const nextBracket = buildSeededBracket();
                const nextUpdates = buildCompetitionUpdates(nextBracket, groups);
                await updateCompetition(competitionID, nextUpdates);
                setBracket(nextBracket);
                setCompetition((currentCompetition) => ({
                    ...(currentCompetition || {}),
                    ...nextUpdates,
                }));
                setHasUnsavedChanges(false);
                setStatusType("success");
                setStatusMessage("Seeding was applied to the bracket and saved.");
            }
            else {
                const nextGroups = buildSeededRoundRobinGroups();
                const nextUpdates = buildCompetitionUpdates(bracket, nextGroups);
                await updateCompetition(competitionID, nextUpdates);
                setGroups(nextGroups);
                setCompetition((currentCompetition) => ({
                    ...(currentCompetition || {}),
                    ...nextUpdates,
                }));
                setHasUnsavedChanges(false);
                setStatusType("success");
                setStatusMessage("Seeding was applied to the round-robin groups and saved. Review the groups, then generate matches from Group Matches when the groups are finalized.");
            }
        }
        catch (error) {
            console.error("[CompetitionEditor] failed to apply seeding", error);
            setStatusType("error");
            setStatusMessage("Seeding could not be saved.");
        }
    }

    async function addMissingSeedPlayersToList() {
        if (!selectedPlayerListID || missingSeedEntries.length === 0) {
            return;
        }

        setAddingMissingSeedPlayers(true);
        setStatusMessage("");
        try {
            for (const seed of missingSeedEntries) {
                await addPlayerToList(selectedPlayerListID, {
                    country: seed.country || "",
                    firstName: seed.firstName || getSeedPlayerName(seed).split(/\s+/)[0] || "",
                    firstNameInitial: false,
                    gender: seed.gender || "",
                    imageURL: "",
                    isImported: false,
                    lastName: seed.lastName || getSeedPlayerName(seed).split(/\s+/).slice(1).join(" "),
                    lastNameInitial: false,
                    ranking: seed.ranking || "",
                    rating: seed.rating || "",
                });
            }
            const nextPlayers = await getImportPlayerList(selectedPlayerListID);
            setPlayerEntries(nextPlayers || []);
            const nextPlayerLists = await getMyPlayerLists();
            setPlayerLists(nextPlayerLists || []);
            setStatusType("success");
            setStatusMessage(`Added ${missingSeedEntries.length} missing seeded player${missingSeedEntries.length === 1 ? "" : "s"} to the selected player list.`);
        }
        catch (error) {
            console.error("[CompetitionEditor] failed to add missing seed players", error);
            setStatusType("error");
            setStatusMessage("Missing seeded players could not be added to the selected player list.");
        }
        finally {
            setAddingMissingSeedPlayers(false);
        }
    }

    async function generateRoundRobinMatches() {
        setStatusMessage("");
        try {
            const nextGroups = buildRoundRobinMatchesForGroups(groups);
            const nextUpdates = buildCompetitionUpdates(bracket, nextGroups);

            await updateCompetition(competitionID, nextUpdates);
            setGroups(nextGroups);
            setCompetition((currentCompetition) => ({
                ...(currentCompetition || {}),
                ...nextUpdates,
            }));
            setHasUnsavedChanges(false);
            setStatusType("success");
            setStatusMessage("Generated group matches and saved them to this competition.");
            setActiveTab("groupMatches");
        }
        catch (error) {
            console.error("[CompetitionEditor] failed to generate round-robin matches", error);
            setStatusType("error");
            setStatusMessage("Group matches could not be generated and saved.");
        }
    }

    async function resetRoundRobinMatches() {
        setResettingGroupMatches(true);
        setStatusMessage("");
        try {
            const scheduledLinks = getAllGroupMatches(groups)
                .filter((match: any) => match?.scheduledMatchID && (match?.tableID || match?.sourceID))
                .map((match: any) => ({
                    scheduledMatchID: match.scheduledMatchID,
                    tableID: match.tableID || match.sourceID,
                }));
            const seenScheduledLinks = new Set();

            for (const link of scheduledLinks) {
                const linkKey = `${link.tableID}:${link.scheduledMatchID}`;
                if (seenScheduledLinks.has(linkKey)) {
                    continue;
                }

                seenScheduledLinks.add(linkKey);
                await deleteScheduledMatchForSource("table", link.tableID, link.scheduledMatchID, { clearCurrentMatch: true });
            }

            const nextGroups = Object.entries(cloneGroups(groups)).reduce((groupMap, [groupID, group]: any) => {
                groupMap[groupID] = recalculateGroupStandings({
                    ...group,
                    matches: {},
                });
                return groupMap;
            }, {});
            const nextUpdates = buildCompetitionUpdates(bracket, nextGroups);

            await updateCompetition(competitionID, nextUpdates);
            setGroups(nextGroups);
            setCompetition((currentCompetition) => ({
                ...(currentCompetition || {}),
                ...nextUpdates,
            }));
            setHasUnsavedChanges(false);
            setTableSelections((currentSelections) => {
                return Object.entries(currentSelections || {}).reduce((selectionMap, [key, value]) => {
                    if (!key.startsWith("group-")) {
                        selectionMap[key] = value;
                    }
                    return selectionMap;
                }, {});
            });
            setActiveTab("groups");
            setStatusType("success");
            setStatusMessage("Group matches were reset. Review the groups, then generate matches again when they are ready.");
        }
        catch (error) {
            console.error("[CompetitionEditor] failed to reset group matches", error);
            setStatusType("error");
            setStatusMessage("Group matches could not be reset.");
        }
        finally {
            setResettingGroupMatches(false);
        }
    }

    async function advanceGroupsToBracket() {
        const groupEntries = Object.entries(groups || {});
        const advanceCount = Math.max(1, parseInt(`${advancementPlayersPerGroup}`, 10) || 1);
        const rankedGroups = groupEntries.map(([groupID, group]: any) => ({
            group,
            groupID,
            rows: getGroupPlayerRankingRows(group, advancementRankingOrder),
        }));
        const advancingPlayers: any[] = [];

        for (let rankIndex = 0; rankIndex < advanceCount; rankIndex++) {
            rankedGroups.forEach(({ group, groupID, rows }) => {
                const player: any = rows[rankIndex];
                if (!player) {
                    return;
                }

                advancingPlayers.push({
                    ...player,
                    advanceSeed: advancingPlayers.length + 1,
                    sourceGroupID: groupID,
                    sourceGroupName: group.groupName || groupID,
                    sourceGroupRank: rankIndex + 1,
                });
            });
        }

        if (advancingPlayers.length === 0) {
            setStatusType("error");
            setStatusMessage("There are no group players to advance yet.");
            return;
        }

        const nextBracket = cloneBracket(bracket.length > 0 ? bracket : generateEmptyBracket(largestRound));
        const firstRound = nextBracket[0];
        const slotCount = (firstRound?.seeds?.length || 0) * 2;

        if (!firstRound || slotCount === 0) {
            setStatusType("error");
            setStatusMessage("Create or reset the bracket structure before advancing group players.");
            return;
        }

        if (advancingPlayers.length > slotCount) {
            setStatusType("error");
            setStatusMessage("There are more advancing players than bracket slots. Increase the bracket size or reduce players advancing per group.");
            return;
        }

        const seedOrder = getBracketSlotSeedOrder(slotCount, "standard");
        const slotTeams = seedOrder.map((seedNumber) => {
            const player = advancingPlayers[seedNumber - 1];
            return player ? groupPlayerToBracketTeam(player) : { name: "TBD" };
        });

        const resetSeed = (seed, roundIndex, seedIndex) => {
            const nextSeed = {
                ...seed,
                AScore: 0,
                BScore: 0,
                gameScores: [],
                isComplete: false,
                matchID: "",
                scheduledMatchID: "",
                scheduledStatus: "",
                sourceID: "",
                sourceTitle: "",
                sourceType: "",
                startTime: "",
                tableID: "",
                tableName: "",
                teams: roundIndex === 0 ? [
                    slotTeams[seedIndex * 2] || { name: "TBD" },
                    slotTeams[seedIndex * 2 + 1] || { name: "TBD" },
                ] : [
                    { name: "TBD" },
                    { name: "TBD" },
                ],
            };
            delete nextSeed.winnerTeamIndex;
            return nextSeed;
        };

        const rebuiltBracket = nextBracket.map((round, roundIndex) => ({
            ...round,
            seeds: (round.seeds || []).map((seed, seedIndex) => resetSeed(seed, roundIndex, seedIndex)),
        }));
        const normalizedBracket = normalizeBracketByesAndAdvance(rebuiltBracket);
        const nextUpdates = buildCompetitionUpdates(normalizedBracket, groups);

        setStatusMessage("");
        try {
            await updateCompetition(competitionID, nextUpdates);
            setBracket(normalizedBracket);
            setCompetition((currentCompetition) => ({
                ...(currentCompetition || {}),
                ...nextUpdates,
            }));
            setHasUnsavedChanges(false);
            setStatusType("success");
            setStatusMessage("Bracket slots were updated from group standings and saved.");
            setActiveTab("bracket");
        }
        catch (error) {
            console.error("[CompetitionEditor] failed to advance groups to bracket", error);
            setStatusType("error");
            setStatusMessage("Group standings could not be applied to the bracket.");
        }
    }

    function updateCompetitionMatchField(match, field, value) {
        markUnsavedChanges();
        const cleanValue = ["AScore", "BScore"].includes(field) ?
            (Number.isNaN(parseInt(`${value}`, 10)) ? 0 : Math.max(0, parseInt(`${value}`, 10)))
            : value;

        if (match.type === "singleElimination") {
            setBracket((currentBracket) => {
                const nextBracket = cloneBracket(currentBracket);
                const seed = nextBracket?.[match.bracketRoundIndex]?.seeds?.[match.bracketSeedIndex];

                if (!seed) {
                    return currentBracket;
                }

                if (field === "playerA" || field === "playerB") {
                    const teamIndex = field === "playerA" ? 0 : 1;
                    const teams = [...(seed.teams || [{ name: "TBD" }, { name: "TBD" }])];
                    teams[teamIndex] = {
                        ...(teams[teamIndex] || {}),
                        name: cleanValue,
                    };
                    nextBracket[match.bracketRoundIndex].seeds[match.bracketSeedIndex] = normalizeSeedWithBye({
                        ...seed,
                        teams,
                    });
                    return normalizeBracketByesAndAdvance(nextBracket);
                }

                seed[field] = cleanValue;

                if (field === "AScore" || field === "BScore") {
                    seed.isComplete = isMatchScoreComplete(seed.AScore, seed.BScore, getBestOfForCompetitionMatch(match));
                    seed.scheduledStatus = seed.isComplete ? "complete" : seed.scheduledStatus === "complete" ? "" : seed.scheduledStatus;
                }

                if (field === "isComplete" || field === "AScore" || field === "BScore") {
                    if (seed.isComplete && seed.AScore !== seed.BScore) {
                        seed.winnerTeamIndex = Number(seed.AScore) > Number(seed.BScore) ? 0 : 1;
                    }
                    else {
                        delete seed.winnerTeamIndex;
                    }
                }

                return normalizeBracketByesAndAdvance(nextBracket);
            });
            return;
        }

        setGroups((currentGroups) => {
            const nextGroups = cloneGroups(currentGroups);
            const targetGroup = nextGroups?.[match.groupID];
            const targetMatch = targetGroup?.matches?.[match.slotID];

            if (!targetGroup || !targetMatch) {
                return currentGroups;
            }

            const nextMatch = {
                ...targetMatch,
                [field]: cleanValue,
            };

            if (field === "AScore" || field === "BScore") {
                nextMatch.isComplete = isMatchScoreComplete(nextMatch.AScore, nextMatch.BScore, getBestOfForCompetitionMatch(match));
                nextMatch.scheduledStatus = nextMatch.isComplete ? "complete" : nextMatch.scheduledStatus === "complete" ? "" : nextMatch.scheduledStatus;
            }

            targetGroup.matches[match.slotID] = nextMatch;
            nextGroups[match.groupID] = recalculateGroupStandings(targetGroup);

            return nextGroups;
        });
    }

    function getCompetitionUpdatesForMatchFields(match, fields) {
        if (match.type === "singleElimination") {
            const nextBracket = cloneBracket(bracket);
            const seed = nextBracket?.[match.bracketRoundIndex]?.seeds?.[match.bracketSeedIndex];

            if (!seed) {
                throw new Error("Bracket match slot could not be found.");
            }

            const teams = [...(seed.teams || [{ name: "TBD" }, { name: "TBD" }])];
            if (typeof fields.playerA !== "undefined") {
                teams[0] = {
                    ...(teams[0] || {}),
                    name: fields.playerA,
                };
            }
            if (typeof fields.playerB !== "undefined") {
                teams[1] = {
                    ...(teams[1] || {}),
                    name: fields.playerB,
                };
            }
            const { playerA, playerB, ...seedFields } = fields;
            const nextSeed = {
                ...seed,
                ...seedFields,
                teams,
            };

            if (
                (typeof fields.AScore !== "undefined" || typeof fields.BScore !== "undefined") &&
                typeof fields.isComplete === "undefined"
            ) {
                nextSeed.isComplete = isMatchScoreComplete(nextSeed.AScore, nextSeed.BScore, getBestOfForCompetitionMatch(match));
                nextSeed.scheduledStatus = nextSeed.isComplete ? "complete" : nextSeed.scheduledStatus === "complete" ? "" : nextSeed.scheduledStatus;
            }

            if (
                typeof fields.isComplete !== "undefined" ||
                typeof fields.AScore !== "undefined" ||
                typeof fields.BScore !== "undefined"
            ) {
                if (nextSeed.isComplete && nextSeed.AScore !== nextSeed.BScore) {
                    nextSeed.winnerTeamIndex = Number(nextSeed.AScore) > Number(nextSeed.BScore) ? 0 : 1;
                }
                else {
                    delete nextSeed.winnerTeamIndex;
                }
            }

            nextBracket[match.bracketRoundIndex].seeds[match.bracketSeedIndex] = nextSeed;
            const normalizedBracket = normalizeBracketByesAndAdvance(nextBracket);

            return {
                nextBracket: normalizedBracket,
                nextGroups: groups,
                nextUpdates: buildCompetitionUpdates(normalizedBracket, groups),
            };
        }

        const nextGroups = cloneGroups(groups);
        const targetGroup = nextGroups?.[match.groupID];
        const targetMatch = targetGroup?.matches?.[match.slotID];

        if (!targetGroup || !targetMatch) {
            throw new Error("Group match slot could not be found.");
        }

        const nextMatch = {
            ...targetMatch,
            ...fields,
        };

        if (
            (typeof fields.AScore !== "undefined" || typeof fields.BScore !== "undefined") &&
            typeof fields.isComplete === "undefined"
        ) {
            nextMatch.isComplete = isMatchScoreComplete(nextMatch.AScore, nextMatch.BScore, getBestOfForCompetitionMatch(match));
            nextMatch.scheduledStatus = nextMatch.isComplete ? "complete" : nextMatch.scheduledStatus === "complete" ? "" : nextMatch.scheduledStatus;
        }

        targetGroup.matches[match.slotID] = nextMatch;
        nextGroups[match.groupID] = recalculateGroupStandings(targetGroup);

        return {
            nextBracket: bracket,
            nextGroups,
            nextUpdates: buildCompetitionUpdates(bracket, nextGroups),
        };
    }

    function applyCompetitionMatchUpdates(nextBracket, nextGroups, nextUpdates) {
        if (nextBracket) {
            setBracket(nextBracket);
        }
        if (nextGroups) {
            setGroups(nextGroups);
        }

        setCompetition((currentCompetition) => ({
            ...(currentCompetition || {}),
            ...nextUpdates,
        }));
    }

    async function saveCompetitionMatchNames(match) {
        setStatusMessage("");
        try {
            const { nextBracket, nextGroups, nextUpdates } = getCompetitionUpdatesForMatchFields(match, {
                playerA: match.playerA || "TBD",
                playerB: match.playerB || "TBD",
            });

            await updateCompetition(competitionID, nextUpdates);
            applyCompetitionMatchUpdates(nextBracket, nextGroups, nextUpdates);
            setHasUnsavedChanges(false);
            setStatusType("success");
            setStatusMessage("Match names saved.");
        }
        catch (error) {
            console.error("[CompetitionEditor] failed to save match names", error);
            setStatusType("error");
            setStatusMessage("Match names could not be saved.");
        }
    }

    function getBestOfForCompetitionMatch(match) {
        if (match.type === "singleElimination") {
            return getBestOfForBracketRound(match.roundTitle, bracketDefaultBestOf, bracketUpgradeRound, bracketUpgradeBestOf);
        }

        return normalizeBestOf(roundRobinBestOf, 5);
    }

    async function scheduleCompetitionMatch(match, tableID) {
        if (match.isComplete || match.scheduledStatus === "complete") {
            setStatusType("error");
            setStatusMessage("Completed matches cannot be sent to a table.");
            return false;
        }

        if (!tableID) {
            setStatusType("error");
            setStatusMessage("Select a table before pushing this match.");
            return false;
        }

        if (!competitionTables.some(([nextTableID]) => nextTableID === tableID)) {
            setStatusType("error");
            setStatusMessage(`Select a ${getCompetitionSportLabel(competitionSportName)} table before pushing this match.`);
            return false;
        }

        const tableName = getTableNameFromList(competitionTables, tableID);

        let repushingMissingSchedule = false;
        if (match.scheduledMatchID && match.tableID) {
            const existingScheduledMatch = await getScheduledMatchForSource("table", tableID, match.scheduledMatchID);
            if (existingScheduledMatch) {
                setStatusType("success");
                setStatusMessage(existingScheduledMatch.status === "active" ?
                    "This match is already active on that table."
                    : "This match is already scheduled on that table.");
                return true;
            }

            if (match.tableID !== tableID) {
                const existingOriginalScheduledMatch = await getScheduledMatchForSource("table", match.tableID, match.scheduledMatchID);
                if (existingOriginalScheduledMatch?.status === "active" || existingOriginalScheduledMatch?.isActive === true) {
                    setStatusType("error");
                    setStatusMessage("This match cannot be moved while it is active on another table.");
                    return false;
                }
            }

            repushingMissingSchedule = match.tableID === tableID;
        }

        setSchedulingMatchKey(match.key);
        setStatusMessage("");
        try {
            if (match.scheduledMatchID && match.tableID && match.tableID !== tableID) {
                await deleteScheduledMatchForSource("table", match.tableID, match.scheduledMatchID);
            }

            const scheduledMatches = await createScheduledMatchesForTable(tableID, [{
                bestOf: getBestOfForCompetitionMatch(match),
                bracketRoundIndex: match.bracketRoundIndex,
                bracketSeedIndex: match.bracketSeedIndex,
                competitionID,
                competitionSlotID: match.slotID,
                competitionType: competition?.type || match.type || (isBracket ? "singleElimination" : "roundRobin"),
                eventName: getCompetitionTitle(competition),
                formatName: competition?.formatName || "",
                groupID: match.groupID || "",
                matchRound: getCompetitionMatchRoundLabel(match),
                order: match.order || 0,
                playerA: playerNameToMatchPlayer(match.playerA),
                playerAID: match.playerAID || "",
                playerB: playerNameToMatchPlayer(match.playerB),
                playerBID: match.playerBID || "",
                roundMatchIndex: match.roundMatchIndex || "",
                roundNumber: match.roundNumber || "",
            }], {
                competitionID,
                competitionType: competition?.type || match.type || (isBracket ? "singleElimination" : "roundRobin"),
                formatName: competition?.formatName || "",
                scoringType: competition?.scoringType || "",
                sourceTitle: tableName,
                sportName: competitionSportName,
            });
            const [scheduledMatchID, summary]: any = scheduledMatches?.[0] || [];
            const scheduledFields = {
                AScore: match.AScore || summary?.AScore || 0,
                BScore: match.BScore || summary?.BScore || 0,
                bestOf: summary?.bestOf || getBestOfForCompetitionMatch(match),
                competitionSlotID: match.slotID,
                isComplete: match.isComplete === true,
                matchID: summary?.matchID || "",
                order: summary?.order || match.order || 0,
                roundMatchIndex: summary?.roundMatchIndex || match.roundMatchIndex || "",
                roundNumber: summary?.roundNumber || match.roundNumber || "",
                scheduledMatchID,
                scheduledStatus: summary?.status || "scheduled",
                sourceID: tableID,
                sourceTitle: tableName,
                sourceType: "table",
                startTime: summary?.startTime || summary?.scheduledOn || "",
                tableID,
                tableName,
            };

            if (match.type === "singleElimination") {
                const nextBracket = cloneBracket(bracket);
                const seed = nextBracket?.[match.bracketRoundIndex]?.seeds?.[match.bracketSeedIndex];

                if (!seed) {
                    throw new Error("Bracket match slot could not be found.");
                }

                nextBracket[match.bracketRoundIndex].seeds[match.bracketSeedIndex] = {
                    ...seed,
                    ...scheduledFields,
                    teams: seed.teams,
                };

                const nextUpdates = buildCompetitionUpdates(nextBracket, groups);
                await updateCompetition(competitionID, nextUpdates);
                setBracket(nextBracket);
                setCompetition((currentCompetition) => ({
                    ...(currentCompetition || {}),
                    ...nextUpdates,
                }));
                setHasUnsavedChanges(false);
            }
            else {
                const nextGroups = cloneGroups(groups);
                const targetGroup = nextGroups?.[match.groupID];

                if (!targetGroup) {
                    throw new Error("Group match slot could not be found.");
                }

                targetGroup.matches = {
                    ...(targetGroup.matches || {}),
                    [match.slotID]: {
                        ...(targetGroup.matches?.[match.slotID] || {}),
                        ...scheduledFields,
                        groupID: match.groupID,
                        playerA: match.playerA,
                        playerAID: match.playerAID || "",
                        playerB: match.playerB,
                        playerBID: match.playerBID || "",
                    },
                };
                nextGroups[match.groupID] = recalculateGroupStandings(targetGroup);

                const nextUpdates = buildCompetitionUpdates(bracket, nextGroups);
                await updateCompetition(competitionID, nextUpdates);
                setGroups(nextGroups);
                setCompetition((currentCompetition) => ({
                    ...(currentCompetition || {}),
                    ...nextUpdates,
                }));
                setHasUnsavedChanges(false);
            }

            setTableSelections((currentSelections) => ({
                ...currentSelections,
                [match.key]: tableID,
            }));
            setStatusType("success");
            setStatusMessage(`Match ${repushingMissingSchedule ? "re-pushed" : match.scheduledMatchID ? "moved" : "pushed"} to ${tableName}.`);
            return true;
        }
        catch (error) {
            console.error("[CompetitionEditor] failed to schedule competition match", error);
            setStatusType("error");
            setStatusMessage("Match could not be pushed to the selected table.");
            return false;
        }
        finally {
            setSchedulingMatchKey("");
        }
    }

    async function scheduleCompetitionMatchesToTables(matches, tableIDs, actionKey = "bulk-round") {
        const cleanTableIDs = (tableIDs || []).filter((tableID) => {
            return tableID && competitionTables.some(([nextTableID]) => nextTableID === tableID);
        });

        if (cleanTableIDs.length === 0) {
            setStatusType("error");
            setStatusMessage(`Select at least one ${getCompetitionSportLabel(competitionSportName)} table before pushing this round.`);
            return;
        }

        const readyMatches = (matches || [])
            .filter((match) => {
                return match?.type === "roundRobin"
                    && getCleanPlayerName(match.playerA)
                    && getCleanPlayerName(match.playerB)
                    && !match.scheduledMatchID
                    && match.isComplete !== true;
            })
            .sort((matchA, matchB) => {
                return (Number(matchA.roundMatchIndex) || Number(matchA.order) || 0) -
                    (Number(matchB.roundMatchIndex) || Number(matchB.order) || 0);
            });

        if (readyMatches.length === 0) {
            setStatusType("success");
            setStatusMessage("No unscheduled ready matches were found for this round.");
            return;
        }

        setSchedulingMatchKey(actionKey);
        setStatusMessage("");
        try {
            const nextGroups = cloneGroups(groups);
            const nextSelections = { ...tableSelections };

            for (let matchIndex = 0; matchIndex < readyMatches.length; matchIndex += 1) {
                const match = readyMatches[matchIndex];
                const tableID = cleanTableIDs[matchIndex % cleanTableIDs.length];
                const tableName = getTableNameFromList(competitionTables, tableID);
                const scheduledMatches = await createScheduledMatchesForTable(tableID, [{
                    bestOf: getBestOfForCompetitionMatch(match),
                    competitionID,
                    competitionSlotID: match.slotID,
                    competitionType: competition?.type || match.type || "roundRobin",
                    eventName: getCompetitionTitle(competition),
                    formatName: competition?.formatName || "",
                    groupID: match.groupID || "",
                    matchRound: getCompetitionMatchRoundLabel(match),
                    order: match.order || 0,
                    playerA: playerNameToMatchPlayer(match.playerA),
                    playerAID: match.playerAID || "",
                    playerB: playerNameToMatchPlayer(match.playerB),
                    playerBID: match.playerBID || "",
                    roundMatchIndex: match.roundMatchIndex || "",
                    roundNumber: match.roundNumber || "",
                }], {
                    competitionID,
                    competitionType: competition?.type || match.type || "roundRobin",
                    formatName: competition?.formatName || "",
                    scoringType: competition?.scoringType || "",
                    sourceTitle: tableName,
                    sportName: competitionSportName,
                });
                const [scheduledMatchID, summary]: any = scheduledMatches?.[0] || [];
                const targetGroup = nextGroups?.[match.groupID];

                if (!targetGroup) {
                    throw new Error("Group match slot could not be found.");
                }

                targetGroup.matches = {
                    ...(targetGroup.matches || {}),
                    [match.slotID]: {
                        ...(targetGroup.matches?.[match.slotID] || {}),
                        AScore: match.AScore || summary?.AScore || 0,
                        BScore: match.BScore || summary?.BScore || 0,
                        bestOf: summary?.bestOf || getBestOfForCompetitionMatch(match),
                        competitionSlotID: match.slotID,
                        groupID: match.groupID,
                        isComplete: match.isComplete === true,
                        matchID: summary?.matchID || "",
                        order: summary?.order || match.order || 0,
                        playerA: match.playerA,
                        playerAID: match.playerAID || "",
                        playerB: match.playerB,
                        playerBID: match.playerBID || "",
                        roundMatchIndex: summary?.roundMatchIndex || match.roundMatchIndex || "",
                        roundNumber: summary?.roundNumber || match.roundNumber || "",
                        scheduledMatchID,
                        scheduledStatus: summary?.status || "scheduled",
                        sourceID: tableID,
                        sourceTitle: tableName,
                        sourceType: "table",
                        startTime: summary?.startTime || summary?.scheduledOn || "",
                        tableID,
                        tableName,
                    },
                };
                nextGroups[match.groupID] = recalculateGroupStandings(targetGroup);
                nextSelections[match.key] = tableID;
            }

            const nextUpdates = buildCompetitionUpdates(bracket, nextGroups);
            await updateCompetition(competitionID, nextUpdates);
            setGroups(nextGroups);
            setCompetition((currentCompetition) => ({
                ...(currentCompetition || {}),
                ...nextUpdates,
            }));
            setHasUnsavedChanges(false);
            setTableSelections(nextSelections);
            setStatusType("success");
            setStatusMessage(`Pushed ${readyMatches.length} match${readyMatches.length === 1 ? "" : "es"} across ${cleanTableIDs.length} table${cleanTableIDs.length === 1 ? "" : "s"}.`);
        }
        catch (error) {
            console.error("[CompetitionEditor] failed to schedule competition round", error);
            setStatusType("error");
            setStatusMessage("Play round matches could not be pushed to the selected tables.");
        }
        finally {
            setSchedulingMatchKey("");
        }
    }

    async function clearCompetitionMatchSchedule(match) {
        if (!match.scheduledMatchID) {
            return;
        }

        setSchedulingMatchKey(match.key);
        setStatusMessage("");
        try {
            if (match.tableID) {
                await deleteScheduledMatchForSource("table", match.tableID, match.scheduledMatchID, { clearCurrentMatch: true });
            }

            const clearedScheduleFields = {
                matchID: "",
                scheduledMatchID: "",
                scheduledStatus: "",
                sourceID: "",
                sourceTitle: "",
                sourceType: "",
                startTime: "",
                tableID: "",
                tableName: "",
            };
            const { nextBracket, nextGroups, nextUpdates } = getCompetitionUpdatesForMatchFields(match, clearedScheduleFields);
            await updateCompetition(competitionID, nextUpdates);
            applyCompetitionMatchUpdates(nextBracket, nextGroups, nextUpdates);
            setHasUnsavedChanges(false);
            setTableSelections((currentSelections) => {
                const nextSelections = { ...currentSelections };
                delete nextSelections[match.key];
                return nextSelections;
            });
            setStatusType("success");
            setStatusMessage("Scheduled link cleared. You can push this match again.");
        }
        catch (error) {
            console.error("[CompetitionEditor] failed to clear competition match schedule", error);
            setStatusType("error");
            setStatusMessage("Scheduled link could not be cleared.");
        }
        finally {
            setSchedulingMatchKey("");
        }
    }

    async function saveCompetitionMatchResult(match, resultFields = {}) {
        const cleanAScore = typeof resultFields.AScore !== "undefined" ?
            toScoreValue(resultFields.AScore)
            : toScoreValue(match.AScore);
        const cleanBScore = typeof resultFields.BScore !== "undefined" ?
            toScoreValue(resultFields.BScore)
            : toScoreValue(match.BScore);
        const cleanGameScores = Array.isArray(resultFields.gameScores) ? resultFields.gameScores : match.gameScores || [];

        if (cleanAScore === cleanBScore) {
            setStatusType("error");
            setStatusMessage("A completed match needs a winner. Update the score before saving the result.");
            return false;
        }

        setSavingResultKey(match.key);
        setStatusMessage("");
        try {
            const completedFields = {
                AScore: cleanAScore,
                BScore: cleanBScore,
                gameScores: cleanGameScores,
                isComplete: true,
                scheduledStatus: "complete",
            };
            const { nextBracket, nextGroups, nextUpdates } = getCompetitionUpdatesForMatchFields(match, completedFields);
            const scheduledMatch = match.scheduledMatchID && match.tableID ?
                await getScheduledMatchForSource("table", match.tableID, match.scheduledMatchID)
                : null;

            if (scheduledMatch) {
                await finishScheduledMatchForSource("table", match.tableID, match.scheduledMatchID, match.matchID || scheduledMatch.matchID || "", {
                    AScore: cleanAScore,
                    BScore: cleanBScore,
                    gameScores: cleanGameScores,
                    resultMode: "manual",
                });
            }

            await updateCompetition(competitionID, nextUpdates);
            applyCompetitionMatchUpdates(nextBracket, nextGroups, nextUpdates);
            setHasUnsavedChanges(false);
            setStatusType("success");
            setStatusMessage(scheduledMatch ? "Scheduled match result saved." : "Competition match result saved.");
            return true;
        }
        catch (error) {
            console.error("[CompetitionEditor] failed to save competition match result", error);
            setStatusType("error");
            setStatusMessage("Match result could not be saved.");
            return false;
        }
        finally {
            setSavingResultKey("");
        }
    }

    async function saveCompetition() {
        setSaving(true);
        setStatusMessage("");
        setStatusType("success");
        try {
            const nextUpdates = buildCompetitionUpdates();

            await updateCompetition(competitionID, nextUpdates);
            setCompetition((currentCompetition) => ({
                ...(currentCompetition || {}),
                ...nextUpdates,
            }));
            setHasUnsavedChanges(false);
            setStatusType("success");
            setStatusMessage("Competition saved.");
        }
        catch (error) {
            console.error("[CompetitionEditor] failed to save competition", error);
            setStatusType("error");
            setStatusMessage("Competition could not be saved.");
        }
        finally {
            setSaving(false);
        }
    }

    if (!doneLoading) {
        return <LoadingPage />;
    }

    return (
        <NativeBaseProvider theme={openScoreboardTheme}>
            <ScrollView backgroundColor={"gray.50"} contentContainerStyle={{ paddingBottom: hasUnsavedChanges || showFloatingSeedingPrompt ? 104 : 0 }}>
                <View alignSelf={"center"} maxWidth={1180} padding={4} width={"100%"}>
                    <View
                        backgroundColor={"white"}
                        borderColor={"gray.200"}
                        borderRadius={8}
                        borderWidth={1}
                        marginBottom={4}
                        padding={4}
                    >
                        <View alignItems={"center"} flexDirection={"row"} flexWrap={"wrap"}>
                            <View flex={1} minWidth={240} paddingRight={3}>
                                <Text color={"gray.500"} fontSize={"2xs"} fontWeight={"bold"} textTransform={"uppercase"}>
                                    {isTeamCompetition ? "Team tournament · " : ""}{getCompetitionTypeLabel(competitionType)} / {getCompetitionSportLabel(competitionSportName)}
                                </Text>
                                <Text color={"gray.900"} fontSize={"2xl"} fontWeight={"bold"}>{title || "Competition"}</Text>
                            </View>
                            <View alignItems={"center"} flexDirection={"row"} marginTop={2}>
                                {isTeamCompetition ? (
                                    <Button
                                        accessibilityLabel={"Team tournament"}
                                        backgroundColor={activeTab === "teamTournament" ? openScoreboardColor : "gray.100"}
                                        borderColor={activeTab === "teamTournament" ? openScoreboardColor : "gray.200"}
                                        borderRadius={8}
                                        borderWidth={1}
                                        height={"40px"}
                                        marginRight={2}
                                        onPress={() => setActiveTab("teamTournament")}
                                        paddingX={2}
                                        width={"40px"}
                                    >
                                        <MaterialCommunityIcons
                                            name="account-group-outline"
                                            size={20}
                                            color={activeTab === "teamTournament" ? openScoreboardButtonTextColor : "#374151"}
                                        />
                                    </Button>
                                ) : null}
                                <Button
                                    accessibilityLabel={"Competition settings"}
                                    backgroundColor={activeTab === "settings" ? openScoreboardColor : "gray.100"}
                                    borderColor={activeTab === "settings" ? openScoreboardColor : "gray.200"}
                                    borderRadius={8}
                                    borderWidth={1}
                                    height={"40px"}
                                    marginRight={2}
                                    onPress={() => setActiveTab("settings")}
                                    paddingX={2}
                                    width={"40px"}
                                >
                                    <MaterialCommunityIcons
                                        name="cog-outline"
                                        size={20}
                                        color={activeTab === "settings" ? openScoreboardButtonTextColor : "#374151"}
                                    />
                                </Button>
                                <Button
                                    backgroundColor={saving ? "gray.400" : openScoreboardColor}
                                    borderRadius={8}
                                    isDisabled={saving}
                                    onPress={saveCompetition}
                                >
                                    {saving ? (
                                        <Spinner color={openScoreboardButtonTextColor} />
                                    ) : (
                                        <Text color={openScoreboardButtonTextColor} fontWeight={"bold"}>Save</Text>
                                    )}
                                </Button>
                            </View>
                        </View>
                        {statusMessage ? (
                            <View
                                backgroundColor={statusType === "error" ? "red.50" : "green.50"}
                                borderColor={statusType === "error" ? "red.200" : "green.200"}
                                borderRadius={8}
                                borderWidth={1}
                                marginTop={3}
                                padding={3}
                            >
                                <Text
                                    color={statusType === "error" ? "red.800" : "green.800"}
                                    fontSize={"sm"}
                                    fontWeight={"bold"}
                                >
                                    {statusMessage}
                                </Text>
                            </View>
                        ) : null}
                        {!isTeamCompetition ? (
                            <CompetitionInsightsPanel
                                bracket={bracket}
                                groups={groups}
                                hasBracket={hasBracket}
                                hasGroups={hasGroups}
                                isCombinedCompetition={isCombinedCompetition}
                                onTabChange={setActiveTab}
                            />
                        ) : null}
                    </View>

                    {activeTab === "settings" ? (
                        <CompetitionSettingsPanel
                            bracketGroupStyles={bracketGroupStyles}
                            competitionID={competitionID}
                            competitionType={competitionType}
                            setTitle={updateTitle}
                            title={title}
                        />
                    ) : null}

                    {isTeamCompetition && activeTab === "teamTournament" ? (
                        <TeamTournamentManager
                            competition={competition}
                            navigation={props.navigation}
                            onStatus={(message, type = "success") => {
                                setStatusType(type);
                                setStatusMessage(message);
                            }}
                        />
                    ) : null}

                    {!isTeamCompetition && activeTab === "seeding" ? (
                        <SeedingPanel
                            addingMissingPlayers={addingMissingSeedPlayers}
                            isBracket={hasBracket && !hasGroups}
                            loadingPlayers={loadingPlayers}
                            missingSeedEntries={missingSeedEntries}
                            onAddMissingPlayers={addMissingSeedPlayersToList}
                            onApplySeeds={applySeeding}
                            onSeedFileText={(nextSeedText) => setSeedText(nextSeedText)}
                            playerEntries={playerEntries}
                            playerLists={playerLists}
                            playerSearch={playerSearch}
                            seedEntries={seedEntries}
                            seedingApplied={seedingApplied}
                            seedSource={seedSource}
                            seedText={seedText}
                            selectedSeedPlayerIDs={selectedSeedPlayerIDs}
                            selectedPlayerListID={selectedPlayerListID}
                            seedingStrategy={seedingStrategy}
                            setPlayerSearch={setPlayerSearch}
                            setSeedText={setSeedText}
                            setSeedSource={setSeedSource}
                            setSelectedSeedPlayerIDs={setSelectedSeedPlayerIDs}
                            setSelectedPlayerListID={setSelectedPlayerListID}
                            setSeedingStrategy={setSeedingStrategy}
                        />
                    ) : null}

                    {!isTeamCompetition && activeTab === "groups" && hasGroups ? (
                        <Section
                            icon={<MaterialCommunityIcons name="table-large" size={22} color={openScoreboardColor} />}
                            title={"Round robin groups"}
                            subtitle={"Create groups, assign players, and set the seed order used to generate matches."}
                        >
                            <RoundRobinStructureEditor
                                groups={groups}
                                onFinalizeGroups={generateRoundRobinMatches}
                                onGoToSeeding={() => setActiveTab("seeding")}
                                roundRobinBestOf={roundRobinBestOf}
                                setGroups={updateGroupsState}
                                setRoundRobinBestOf={updateRoundRobinBestOf}
                            />
                        </Section>
                    ) : null}

                    {!isTeamCompetition && activeTab === "advance" && isCombinedCompetition ? (
                        <GroupAdvancementPanel
                            advancementPlayersPerGroup={advancementPlayersPerGroup}
                            advancementRankingOrder={advancementRankingOrder}
                            bracket={bracket}
                            groups={groups}
                            onAdvanceGroups={advanceGroupsToBracket}
                            onAdvancementCountChange={updateAdvancementPlayersPerGroup}
                            onRankingOrderChange={updateAdvancementRankingOrder}
                        />
                    ) : null}

                    {!isTeamCompetition && activeTab === "bracket" && hasBracket ? (
                        <Section
                            icon={<MaterialCommunityIcons name="tournament" size={22} color={openScoreboardColor} />}
                            title={"Bracket structure"}
                            subtitle={"Set the maximum match round and fill the match slots before pushing matches to tables."}
                        >
                            <BracketStructureEditor
                                bracket={bracket}
                                bracketDefaultBestOf={bracketDefaultBestOf}
                                bracketUpgradeBestOf={bracketUpgradeBestOf}
                                bracketUpgradeRound={bracketUpgradeRound}
                                largestRound={largestRound}
                                resetBracket={resetBracket}
                                setBracket={updateBracketState}
                                setBracketDefaultBestOf={updateBracketDefaultBestOf}
                                setBracketUpgradeBestOf={updateBracketUpgradeBestOf}
                                setBracketUpgradeRound={updateBracketUpgradeRound}
                                setLargestRound={updateLargestRound}
                            />
                        </Section>
                    ) : null}

                    {!isTeamCompetition && activeTab === "groupMatches" && hasGroups ? (
                        <Section
                            icon={<MaterialCommunityIcons name="calendar-sync-outline" size={22} color={openScoreboardColor} />}
                            title={"Group matches"}
                            subtitle={"Generate expected group matches, manually adjust results, and push matches to the table where they should be played."}
                        >
                            <CompetitionMatchesEditor
                                bracket={bracket}
                                getMatchBestOf={getBestOfForCompetitionMatch}
                                groups={groups}
                                isBracket={false}
                                onResetRoundRobinMatches={resetRoundRobinMatches}
                                onSaveMatchResult={saveCompetitionMatchResult}
                                onScheduleMatch={scheduleCompetitionMatch}
                                onScheduleMatchesToTables={scheduleCompetitionMatchesToTables}
                                resettingGroupMatches={resettingGroupMatches}
                                savingResultKey={savingResultKey}
                                schedulingMatchKey={schedulingMatchKey}
                                setTableSelections={setTableSelections}
                                tableSelections={tableSelections}
                                tables={competitionTables}
                            />
                        </Section>
                    ) : null}

                    {!isTeamCompetition && activeTab === "bracketMatches" && hasBracket ? (
                        <Section
                            icon={<MaterialCommunityIcons name="calendar-check-outline" size={22} color={openScoreboardColor} />}
                            title={"Bracket matches"}
                            subtitle={"Push bracket matches to tables, manually adjust results, and advance winners through the bracket."}
                        >
                            <CompetitionMatchesEditor
                                bracket={bracket}
                                getMatchBestOf={getBestOfForCompetitionMatch}
                                groups={groups}
                                isBracket
                                onResetRoundRobinMatches={resetRoundRobinMatches}
                                onSaveMatchResult={saveCompetitionMatchResult}
                                onScheduleMatch={scheduleCompetitionMatch}
                                onScheduleMatchesToTables={scheduleCompetitionMatchesToTables}
                                resettingGroupMatches={resettingGroupMatches}
                                savingResultKey={savingResultKey}
                                schedulingMatchKey={schedulingMatchKey}
                                setTableSelections={setTableSelections}
                                tableSelections={tableSelections}
                                tables={competitionTables}
                            />
                        </Section>
                    ) : null}
                </View>
            </ScrollView>
            <FloatingStatusToast message={statusMessage} statusType={statusType} visible={showStatusToast} />
            <FloatingSeedingPrompt
                onApplySeeds={applySeeding}
                seedCount={seedEntries.length}
                seedingApplied={seedingApplied}
                visible={showFloatingSeedingPrompt}
            />
            <FloatingSavePrompt hasUnsavedChanges={!showFloatingSeedingPrompt && hasUnsavedChanges} onSave={saveCompetition} saving={saving} />
        </NativeBaseProvider>
    );
}
