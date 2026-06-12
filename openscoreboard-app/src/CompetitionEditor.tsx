import React, { useEffect, useMemo, useState } from 'react';
import { Button, FormControl, Input, NativeBaseProvider, ScrollView, Select, Spinner, Switch, Text, View } from 'native-base';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { openScoreboardButtonTextColor, openScoreboardColor, openScoreboardTheme } from '../openscoreboardtheme';
import LoadingPage from './LoadingPage';
import {
    bracketRoundConfig,
    generateEmptyBracket,
    getCompetition,
    syncCompetitionBracketScheduledMatches,
    updateCompetitionGraphic,
} from './functions/competitions';
import { getMyTables, getScheduledTableMatches } from './functions/tables';

const styleSections = [
    {
        fields: [
            { key: "backgroundColor", label: "Background" },
            { key: "borderColor", label: "Border" },
            { key: "color", label: "Text" },
        ],
        key: "boardStyles",
        title: "Board",
    },
    {
        fields: [
            { key: "color", label: "Title color" },
            { key: "fontSize", label: "Title size", type: "number" },
        ],
        key: "titleStyles",
        title: "Title",
    },
    {
        fields: [
            { key: "backgroundColor", label: "Match background" },
            { key: "color", label: "Match text" },
            { key: "fontSize", label: "Match text size", type: "number" },
        ],
        key: "bracketStyles",
        title: "Bracket matches",
    },
    {
        fields: [
            { key: "color", label: "Line color" },
            { key: "width", label: "Line width", type: "number" },
            { key: "borderStyle", label: "Line style" },
        ],
        key: "bracketLineStyles",
        title: "Bracket lines",
    },
    {
        fields: [
            { key: "backgroundColor", label: "Header background" },
            { key: "color", label: "Header text" },
            { key: "fontSize", label: "Header text size", type: "number" },
        ],
        key: "groupHeaderStyles",
        title: "Group headers",
    },
    {
        fields: [
            { key: "backgroundColor", label: "Player background" },
            { key: "color", label: "Player text" },
            { key: "fontSize", label: "Player text size", type: "number" },
        ],
        key: "groupPlayerStyles",
        title: "Group players",
    },
];

function getCompetitionTitle(competition) {
    return competition?.data?.title || competition?.title || "Competition Graphic";
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

function getMatchSortTime(scheduledMatch) {
    const dateValue = scheduledMatch?.startTime ||
        scheduledMatch?.scheduledOn ||
        scheduledMatch?.updatedOn ||
        scheduledMatch?.createdOn ||
        "";
    const time = dateValue ? new Date(dateValue).getTime() : 0;

    return Number.isFinite(time) ? time : 0;
}

function formatDateTime(dateValue) {
    if (!dateValue) {
        return "No start time";
    }

    const date = new Date(dateValue);

    if (!Number.isFinite(date.getTime())) {
        return `${dateValue}`;
    }

    return date.toLocaleString([], {
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        month: "numeric",
        year: "numeric",
    });
}

function getScheduledMatchTitle(match) {
    const playerA = match?.playerA || "TBD";
    const playerB = match?.playerB || "TBD";

    return `${playerA} vs ${playerB}`;
}

function getAvailableMatchSearchText(match) {
    const scheduledMatch = match?.scheduledMatch || {};

    return [
        match?.tableName,
        scheduledMatch.playerA,
        scheduledMatch.playerB,
        scheduledMatch.formatName,
        scheduledMatch.matchRound,
        scheduledMatch.teamNameA,
        scheduledMatch.teamNameB,
        formatDateTime(scheduledMatch.startTime || scheduledMatch.scheduledOn),
    ].filter(Boolean).join(" ").toLowerCase();
}

function getSelectedMatchKey(seed) {
    return seed?.tableID && seed?.scheduledMatchID ?
        `${seed.tableID}:${seed.scheduledMatchID}`
        : "";
}

function Section({ children, icon, subtitle = "", title }) {
    return (
        <View
            backgroundColor={"white"}
            borderColor={"gray.200"}
            borderRadius={8}
            borderWidth={1}
            marginBottom={4}
            padding={4}
        >
            <View alignItems={"center"} flexDirection={"row"} marginBottom={3}>
                <View
                    alignItems={"center"}
                    backgroundColor={"blue.50"}
                    borderColor={"blue.100"}
                    borderRadius={8}
                    borderWidth={1}
                    height={38}
                    justifyContent={"center"}
                    marginRight={3}
                    width={38}
                >
                    {icon}
                </View>
                <View flex={1}>
                    <Text color={"gray.900"} fontSize={"lg"} fontWeight={"bold"}>{title}</Text>
                    {subtitle ? <Text color={"gray.600"} fontSize={"sm"} marginTop={1}>{subtitle}</Text> : null}
                </View>
            </View>
            {children}
        </View>
    );
}

function ColorSwatch({ value }) {
    return (
        <View
            backgroundColor={value || "transparent"}
            borderColor={"gray.300"}
            borderRadius={6}
            borderWidth={1}
            height={28}
            marginRight={2}
            width={28}
        />
    );
}

function StyleField({ field, sectionKey, styles, updateStyle }) {
    const value = styles?.[sectionKey]?.[field.key];

    return (
        <View flexBasis={{ base: "100%", md: "48%" }} marginBottom={3}>
            <FormControl>
                <FormControl.Label>{field.label}</FormControl.Label>
                <View alignItems={"center"} flexDirection={"row"}>
                    {field.type === "number" ? null : <ColorSwatch value={value} />}
                    <Input
                        backgroundColor={"white"}
                        borderColor={"gray.300"}
                        color={"gray.900"}
                        keyboardType={field.type === "number" ? "numeric" : "default"}
                        onChangeText={(nextValue) => {
                            updateStyle(sectionKey, field.key, field.type === "number" ? Number(nextValue) || 0 : nextValue);
                        }}
                        value={`${value ?? ""}`}
                    />
                </View>
            </FormControl>
        </View>
    );
}

function BracketPreview({ bracket, styles }) {
    const matchStyles = styles.bracketStyles || {};
    const roundStyles = styles.roundNameStyles || {};
    const lineStyles = styles.bracketLineStyles || {};

    return (
        <ScrollView horizontal showsHorizontalScrollIndicator>
            <View flexDirection={"row"} paddingBottom={2}>
                {bracket.map((round, roundIndex) => (
                    <View key={`preview-round-${roundIndex}`} marginRight={4} minWidth={210}>
                        <Text
                            color={roundStyles.color || "blue.700"}
                            fontSize={roundStyles.fontSize || 18}
                            fontWeight={"bold"}
                            marginBottom={2}
                        >
                            {round.title}
                        </Text>
                        {(round.seeds || []).map((seed, seedIndex) => (
                            <View
                                key={`preview-seed-${roundIndex}-${seedIndex}`}
                                backgroundColor={matchStyles.backgroundColor || "gray.900"}
                                borderColor={lineStyles.color || "blue.300"}
                                borderRadius={8}
                                borderStyle={lineStyles.borderStyle || "solid"}
                                borderWidth={lineStyles.width || 1}
                                marginBottom={3}
                                padding={2}
                            >
                                {(seed.teams || []).map((team, teamIndex) => (
                                    <View
                                        key={`preview-team-${roundIndex}-${seedIndex}-${teamIndex}`}
                                        alignItems={"center"}
                                        flexDirection={"row"}
                                        justifyContent={"space-between"}
                                        paddingY={1}
                                    >
                                        <Text
                                            color={matchStyles.color || "white"}
                                            flex={1}
                                            fontSize={matchStyles.fontSize || 16}
                                            fontWeight={"bold"}
                                            numberOfLines={1}
                                        >
                                            {team.name || "TBD"}
                                        </Text>
                                        <Text color={matchStyles.color || "white"} fontSize={"sm"} fontWeight={"bold"} marginLeft={2}>
                                            {teamIndex === 0 ? seed.AScore || 0 : seed.BScore || 0}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        ))}
                    </View>
                ))}
            </View>
        </ScrollView>
    );
}

function BracketStructureEditor({
    availableMatches,
    bracket,
    loadingMatches,
    matchSearch,
    setBracket,
    setMatchSearch,
}) {
    const filteredAvailableMatches = useMemo(() => {
        const normalizedSearch = matchSearch.trim().toLowerCase();
        const matches = normalizedSearch ?
            availableMatches.filter((match) => getAvailableMatchSearchText(match).includes(normalizedSearch))
            : availableMatches;

        return matches.slice(0, 60);
    }, [availableMatches, matchSearch]);

    function updateTeamName(roundIndex, seedIndex, teamIndex, name) {
        setBracket((currentBracket) => {
            const nextBracket = cloneBracket(currentBracket);
            nextBracket[roundIndex].seeds[seedIndex].teams[teamIndex].name = name;
            return nextBracket;
        });
    }

    function assignScheduledMatch(roundIndex, seedIndex, selectedValue) {
        const selectedMatch = availableMatches.find((match) => match.key === selectedValue);

        if (!selectedMatch) {
            return;
        }

        setBracket((currentBracket) => {
            const nextBracket = cloneBracket(currentBracket);
            const seed = nextBracket[roundIndex].seeds[seedIndex];
            const scheduledMatch = selectedMatch.scheduledMatch || {};
            const slotID = seed.id || `round-${roundIndex}-seed-${seedIndex}`;

            nextBracket[roundIndex].seeds[seedIndex] = {
                ...seed,
                AScore: scheduledMatch.AScore || 0,
                BScore: scheduledMatch.BScore || 0,
                competitionSlotID: slotID,
                gameScores: Array.isArray(scheduledMatch.gameScores) ? scheduledMatch.gameScores : [],
                isComplete: scheduledMatch.isComplete === true,
                matchID: scheduledMatch.matchID || seed.matchID || "",
                scheduledMatchID: selectedMatch.scheduledMatchID,
                sourceID: selectedMatch.tableID,
                sourceTitle: selectedMatch.tableName,
                sourceType: "table",
                startTime: scheduledMatch.startTime || scheduledMatch.scheduledOn || "",
                tableID: selectedMatch.tableID,
                tableName: selectedMatch.tableName,
                teams: [
                    {
                        ...(seed.teams?.[0] || {}),
                        id: scheduledMatch.playerAID || seed.teams?.[0]?.id || "",
                        name: scheduledMatch.playerA || seed.teams?.[0]?.name || "TBD",
                    },
                    {
                        ...(seed.teams?.[1] || {}),
                        id: scheduledMatch.playerBID || seed.teams?.[1]?.id || "",
                        name: scheduledMatch.playerB || seed.teams?.[1]?.name || "TBD",
                    },
                ],
            };

            return nextBracket;
        });
    }

    function clearScheduledMatch(roundIndex, seedIndex) {
        setBracket((currentBracket) => {
            const nextBracket = cloneBracket(currentBracket);
            const seed = nextBracket[roundIndex].seeds[seedIndex];

            nextBracket[roundIndex].seeds[seedIndex] = {
                ...seed,
                competitionSlotID: seed.id || `round-${roundIndex}-seed-${seedIndex}`,
                gameScores: [],
                matchID: "",
                scheduledMatchID: "",
                sourceID: "",
                sourceTitle: "",
                sourceType: "",
                startTime: "",
                tableID: "",
                tableName: "",
            };

            return nextBracket;
        });
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
                <View alignItems={"center"} flexDirection={"row"} marginBottom={2}>
                    <MaterialCommunityIcons name="table-search" size={20} color={openScoreboardColor} />
                    <Text color={"gray.900"} fontSize={"sm"} fontWeight={"bold"} marginLeft={2}>
                        Scheduled match picker
                    </Text>
                </View>
                <Input
                    backgroundColor={"white"}
                    borderColor={"blue.200"}
                    color={"gray.900"}
                    onChangeText={setMatchSearch}
                    placeholder={"Search by player, table, round, or date"}
                    value={matchSearch}
                />
                <Text color={"gray.600"} fontSize={"xs"} marginTop={2}>
                    {loadingMatches ? "Loading scheduled matches..." : `Showing ${filteredAvailableMatches.length} of ${availableMatches.length} scheduled matches, newest first.`}
                </Text>
            </View>

            {bracket.map((round, roundIndex) => (
                <View key={`round-editor-${roundIndex}`} marginBottom={4}>
                    <Text color={"gray.900"} fontSize={"md"} fontWeight={"bold"} marginBottom={2}>{round.title}</Text>
                    <View flexDirection={"row"} flexWrap={"wrap"} justifyContent={"space-between"}>
                        {(round.seeds || []).map((seed, seedIndex) => (
                            <View
                                key={`seed-editor-${roundIndex}-${seedIndex}`}
                                backgroundColor={"gray.50"}
                                borderColor={"gray.200"}
                                borderRadius={8}
                                borderWidth={1}
                                marginBottom={3}
                                padding={3}
                                width={{ base: "100%", md: "48.5%" }}
                            >
                                <Text color={"gray.500"} fontSize={"2xs"} fontWeight={"bold"} textTransform={"uppercase"}>
                                    Match {seedIndex + 1}
                                </Text>
                                <Select
                                    backgroundColor={"white"}
                                    marginTop={2}
                                    onValueChange={(value) => assignScheduledMatch(roundIndex, seedIndex, value)}
                                    placeholder={filteredAvailableMatches.length > 0 ? "Link scheduled match" : "No scheduled matches found"}
                                    selectedValue={getSelectedMatchKey(seed)}
                                >
                                    {filteredAvailableMatches.map((match) => {
                                        const scheduledMatch = match.scheduledMatch || {};
                                        const matchTime = scheduledMatch.startTime || scheduledMatch.scheduledOn || "";

                                        return (
                                            <Select.Item
                                                key={match.key}
                                                label={`${getScheduledMatchTitle(scheduledMatch)} - ${match.tableName} - ${formatDateTime(matchTime)}`}
                                                value={match.key}
                                            />
                                        );
                                    })}
                                </Select>
                                {seed.scheduledMatchID ? (
                                    <View
                                        backgroundColor={"white"}
                                        borderColor={"gray.200"}
                                        borderRadius={8}
                                        borderWidth={1}
                                        marginTop={2}
                                        padding={2}
                                    >
                                        <Text color={"gray.500"} fontSize={"2xs"} fontWeight={"bold"} textTransform={"uppercase"}>
                                            Linked match
                                        </Text>
                                        <Text color={"gray.900"} fontSize={"sm"} fontWeight={"bold"} marginTop={1}>
                                            {seed.tableName || seed.sourceTitle || "Table"} - {formatDateTime(seed.startTime)}
                                        </Text>
                                        <Button
                                            alignSelf={"flex-start"}
                                            borderRadius={8}
                                            marginTop={2}
                                            onPress={() => clearScheduledMatch(roundIndex, seedIndex)}
                                            size={"sm"}
                                            variant={"outline"}
                                        >
                                            <Text color={"red.700"} fontSize={"xs"} fontWeight={"bold"}>Clear linked match</Text>
                                        </Button>
                                    </View>
                                ) : null}
                                {(seed.teams || []).map((team, teamIndex) => (
                                    <Input
                                        key={`team-input-${roundIndex}-${seedIndex}-${teamIndex}`}
                                        backgroundColor={"white"}
                                        borderColor={"gray.300"}
                                        color={"gray.900"}
                                        marginTop={2}
                                        onChangeText={(name) => updateTeamName(roundIndex, seedIndex, teamIndex, name)}
                                        placeholder={`Player ${teamIndex === 0 ? "A" : "B"}`}
                                        value={team.name || ""}
                                    />
                                ))}
                            </View>
                        ))}
                    </View>
                </View>
            ))}
        </View>
    );
}

function RoundRobinStructureEditor({ groups, setGroups }) {
    function updateGroup(groupID, field, value) {
        setGroups((currentGroups) => ({
            ...currentGroups,
            [groupID]: {
                ...currentGroups[groupID],
                [field]: value,
            },
        }));
    }

    function updatePlayer(groupID, playerID, field, value) {
        setGroups((currentGroups) => ({
            ...currentGroups,
            [groupID]: {
                ...currentGroups[groupID],
                players: {
                    ...(currentGroups[groupID]?.players || {}),
                    [playerID]: {
                        ...(currentGroups[groupID]?.players?.[playerID] || {}),
                        [field]: value,
                    },
                },
            },
        }));
    }

    function addGroup() {
        setGroups((currentGroups) => {
            const groupNumber = Object.keys(currentGroups || {}).length + 1;
            return {
                ...currentGroups,
                [`group-${Date.now()}`]: {
                    groupName: `Group ${groupNumber}`,
                    matches: {},
                    players: {},
                    showOnBoard: true,
                },
            };
        });
    }

    function addPlayer(groupID) {
        setGroups((currentGroups) => {
            const players = currentGroups[groupID]?.players || {};
            const playerNumber = Object.keys(players).length + 1;
            return {
                ...currentGroups,
                [groupID]: {
                    ...currentGroups[groupID],
                    players: {
                        ...players,
                        [`player-${Date.now()}`]: {
                            losses: 0,
                            playerName: `Player ${playerNumber}`,
                            seedPosition: playerNumber,
                            showInGroup: true,
                            wins: 0,
                        },
                    },
                },
            };
        });
    }

    function removePlayer(groupID, playerID) {
        setGroups((currentGroups) => {
            const players = { ...(currentGroups[groupID]?.players || {}) };
            delete players[playerID];
            return {
                ...currentGroups,
                [groupID]: {
                    ...currentGroups[groupID],
                    players,
                },
            };
        });
    }

    return (
        <View>
            {Object.entries(groups || {}).map(([groupID, group]: any) => (
                <View
                    key={groupID}
                    backgroundColor={"gray.50"}
                    borderColor={"gray.200"}
                    borderRadius={8}
                    borderWidth={1}
                    marginBottom={3}
                    padding={3}
                >
                    <View alignItems={"center"} flexDirection={"row"} marginBottom={3}>
                        <View flex={1} marginRight={3}>
                            <FormControl>
                                <FormControl.Label>Group name</FormControl.Label>
                                <Input
                                    backgroundColor={"white"}
                                    color={"gray.900"}
                                    onChangeText={(value) => updateGroup(groupID, "groupName", value)}
                                    value={group.groupName || ""}
                                />
                            </FormControl>
                        </View>
                        <View alignItems={"center"}>
                            <Text color={"gray.600"} fontSize={"xs"} fontWeight={"bold"}>Show</Text>
                            <Switch
                                isChecked={group.showOnBoard !== false}
                                onToggle={(value) => updateGroup(groupID, "showOnBoard", value)}
                            />
                        </View>
                    </View>

                    {Object.entries(group.players || {}).map(([playerID, player]: any) => (
                        <View key={playerID} alignItems={"center"} flexDirection={"row"} marginBottom={2}>
                            <Input
                                backgroundColor={"white"}
                                color={"gray.900"}
                                flex={1}
                                onChangeText={(value) => updatePlayer(groupID, playerID, "playerName", value)}
                                placeholder={"Player name"}
                                value={player.playerName || ""}
                            />
                            <Button
                                backgroundColor={"red.700"}
                                borderRadius={8}
                                marginLeft={2}
                                onPress={() => removePlayer(groupID, playerID)}
                            >
                                <MaterialCommunityIcons name="trash-can-outline" size={18} color={openScoreboardButtonTextColor} />
                            </Button>
                        </View>
                    ))}

                    <Button
                        alignSelf={"flex-start"}
                        backgroundColor={openScoreboardColor}
                        borderRadius={8}
                        marginTop={2}
                        onPress={() => addPlayer(groupID)}
                    >
                        <Text color={openScoreboardButtonTextColor} fontWeight={"bold"}>Add player</Text>
                    </Button>
                </View>
            ))}
            <Button alignSelf={"flex-start"} borderRadius={8} onPress={addGroup} variant={"outline"}>
                <Text color={"blue.700"} fontWeight={"bold"}>Add group</Text>
            </Button>
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
    const [title, setTitle] = useState("");
    const [footer, setFooter] = useState("");
    const [largestRound, setLargestRound] = useState("Quarterfinals");
    const [showBoard, setShowBoard] = useState(true);
    const [bracket, setBracket] = useState([]);
    const [availableMatches, setAvailableMatches] = useState([]);
    const [loadingMatches, setLoadingMatches] = useState(false);
    const [matchSearch, setMatchSearch] = useState("");
    const [groups, setGroups] = useState({});
    const [styles, setStyles] = useState({});

    const isBracket = competition?.type === "singleElimination";

    useEffect(() => {
        async function loadAvailableScheduledMatches() {
            setLoadingMatches(true);
            try {
                const tables = await getMyTables();
                const matchesByTable = await Promise.all(tables.map(async ([tableID, tableInfo]: any) => {
                    const scheduledMatches = await getScheduledTableMatches(tableID);
                    const tableName = tableInfo?.tableName || "Table";

                    return scheduledMatches.map(([scheduledMatchID, scheduledMatch]: any) => {
                        const matchTime = scheduledMatch?.startTime ||
                            scheduledMatch?.scheduledOn ||
                            scheduledMatch?.updatedOn ||
                            scheduledMatch?.createdOn ||
                            "";

                        return {
                            key: `${tableID}:${scheduledMatchID}`,
                            matchID: scheduledMatch?.matchID || "",
                            scheduledMatch,
                            scheduledMatchID,
                            sortTime: getMatchSortTime(scheduledMatch),
                            startTime: matchTime,
                            tableID,
                            tableName,
                        };
                    });
                }));
                const matches = matchesByTable
                    .reduce((list, tableMatches) => list.concat(tableMatches), [])
                    .sort((a, b) => b.sortTime - a.sortTime);

                setAvailableMatches(matches);
            }
            catch (error) {
                console.error("[CompetitionEditor] failed to load scheduled matches", error);
                setAvailableMatches([]);
            }
            finally {
                setLoadingMatches(false);
            }
        }

        async function loadCompetition() {
            setDoneLoading(false);
            const nextCompetition = await getCompetition(competitionID);
            setCompetition(nextCompetition || {});
            setTitle(getCompetitionTitle(nextCompetition));
            setFooter(nextCompetition?.data?.footer || "");
            setLargestRound(nextCompetition?.data?.largestRound || "Quarterfinals");
            setShowBoard(nextCompetition?.showBoard !== false);
            setBracket(cloneBracket(nextCompetition?.data?.brackets || []));
            setGroups(cloneGroups(nextCompetition?.groups || {}));
            setStyles({
                boardStyles: nextCompetition?.boardStyles || {},
                bracketLineStyles: nextCompetition?.bracketLineStyles || {},
                bracketStyles: nextCompetition?.bracketStyles || {},
                footerStyles: nextCompetition?.footerStyles || {},
                groupHeaderStyles: nextCompetition?.groupHeaderStyles || {},
                groupPlayerStyles: nextCompetition?.groupPlayerStyles || {},
                roundNameStyles: nextCompetition?.roundNameStyles || {},
                titleStyles: nextCompetition?.titleStyles || {},
            });
            if (nextCompetition?.type === "singleElimination") {
                await loadAvailableScheduledMatches();
            }
            else {
                setAvailableMatches([]);
            }
            setDoneLoading(true);
        }

        loadCompetition();
    }, [competitionID]);

    const previewStyle = useMemo(() => ({
        backgroundColor: styles.boardStyles?.backgroundColor || "#050816",
        borderColor: styles.boardStyles?.borderColor || "#1D4ED8",
        color: styles.boardStyles?.color || "#FFFFFF",
    }), [styles]);

    function updateStyle(sectionKey, fieldKey, value) {
        setStyles((currentStyles) => ({
            ...currentStyles,
            [sectionKey]: {
                ...(currentStyles[sectionKey] || {}),
                [fieldKey]: value,
            },
        }));
    }

    function resetBracket() {
        setBracket(generateEmptyBracket(largestRound));
    }

    async function saveCompetition() {
        setSaving(true);
        setStatusMessage("");
        setStatusType("success");
        try {
            const nextData = {
                ...(competition?.data || {}),
                ...(isBracket ? {
                    brackets: bracket,
                    largestRound,
                    title,
                } : {
                    footer,
                    title,
                }),
            };
            const nextUpdates = {
                ...styles,
                data: nextData,
                ...(isBracket ? {} : { groups }),
                showBoard,
            };

            await updateCompetitionGraphic(competitionID, nextUpdates);
            if (isBracket) {
                await syncCompetitionBracketScheduledMatches(
                    competitionID,
                    competition?.data?.brackets || [],
                    bracket,
                );
            }
            setCompetition((currentCompetition) => ({
                ...(currentCompetition || {}),
                ...nextUpdates,
            }));
            setStatusType("success");
            setStatusMessage("Competition graphic saved.");
        }
        catch (error) {
            console.error("[CompetitionEditor] failed to save competition", error);
            setStatusType("error");
            setStatusMessage("Competition graphic could not be saved.");
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
            <ScrollView backgroundColor={"gray.50"}>
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
                                    {isBracket ? "Single elimination bracket" : "Round robin group graphic"}
                                </Text>
                                <Text color={"gray.900"} fontSize={"3xl"} fontWeight={"bold"}>{title || "Competition Graphic"}</Text>
                                <Text color={"gray.600"} fontSize={"sm"} marginTop={1}>
                                    Edit the structure and display styling for this competition graphic.
                                </Text>
                            </View>
                            <Button
                                backgroundColor={saving ? "gray.400" : openScoreboardColor}
                                borderRadius={8}
                                isDisabled={saving}
                                marginTop={2}
                                onPress={saveCompetition}
                            >
                                {saving ? (
                                    <Spinner color={openScoreboardButtonTextColor} />
                                ) : (
                                    <Text color={openScoreboardButtonTextColor} fontWeight={"bold"}>Save</Text>
                                )}
                            </Button>
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
                    </View>

                    <View flexDirection={{ base: "column", lg: "row" }}>
                        <View flex={1} paddingRight={{ base: 0, lg: 3 }}>
                            <Section
                                icon={<MaterialCommunityIcons name="tune-variant" size={22} color={openScoreboardColor} />}
                                title={"Graphic settings"}
                                subtitle={"These settings define the board graphic before scheduled matches are linked."}
                            >
                                <FormControl marginBottom={3}>
                                    <FormControl.Label>Graphic title</FormControl.Label>
                                    <Input backgroundColor={"white"} color={"gray.900"} onChangeText={setTitle} value={title} />
                                </FormControl>
                                {!isBracket ? (
                                    <FormControl marginBottom={3}>
                                        <FormControl.Label>Footer</FormControl.Label>
                                        <Input backgroundColor={"white"} color={"gray.900"} onChangeText={setFooter} value={footer} />
                                    </FormControl>
                                ) : null}
                                {isBracket ? (
                                    <View alignItems={"flex-end"} flexDirection={"row"} flexWrap={"wrap"}>
                                        <View flex={1} minWidth={220} marginRight={3}>
                                            <FormControl>
                                                <FormControl.Label>Largest round</FormControl.Label>
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
                                ) : null}
                                <View alignItems={"center"} flexDirection={"row"} justifyContent={"space-between"} marginTop={4}>
                                    <Text color={"gray.900"} fontSize={"sm"} fontWeight={"bold"}>Show graphic publicly</Text>
                                    <Switch isChecked={showBoard} onToggle={setShowBoard} />
                                </View>
                            </Section>

                            <Section
                                icon={<MaterialCommunityIcons name={isBracket ? "tournament" : "table-large"} size={22} color={openScoreboardColor} />}
                                title={isBracket ? "Bracket structure" : "Round robin groups"}
                                subtitle={isBracket ? "Edit match slots. Scheduled matches can later be linked into these slots." : "Create visible groups and player rows for the board."}
                            >
                                {isBracket ? (
                                    <BracketStructureEditor
                                        availableMatches={availableMatches}
                                        bracket={bracket}
                                        loadingMatches={loadingMatches}
                                        matchSearch={matchSearch}
                                        setBracket={setBracket}
                                        setMatchSearch={setMatchSearch}
                                    />
                                ) : (
                                    <RoundRobinStructureEditor groups={groups} setGroups={setGroups} />
                                )}
                            </Section>
                        </View>

                        <View flex={1} paddingLeft={{ base: 0, lg: 3 }}>
                            <Section
                                icon={<MaterialCommunityIcons name="palette-outline" size={22} color={openScoreboardColor} />}
                                title={"Display styling"}
                                subtitle={"Core styling options for the bracket or group graphic."}
                            >
                                {styleSections
                                    .filter((section) => isBracket || !["bracketStyles", "bracketLineStyles", "roundNameStyles"].includes(section.key))
                                    .map((section) => (
                                        <View key={section.key} marginBottom={4}>
                                            <Text color={"gray.900"} fontSize={"md"} fontWeight={"bold"} marginBottom={2}>{section.title}</Text>
                                            <View flexDirection={"row"} flexWrap={"wrap"} justifyContent={"space-between"}>
                                                {section.fields.map((field) => (
                                                    <StyleField
                                                        key={`${section.key}-${field.key}`}
                                                        field={field}
                                                        sectionKey={section.key}
                                                        styles={styles}
                                                        updateStyle={updateStyle}
                                                    />
                                                ))}
                                            </View>
                                        </View>
                                    ))}
                            </Section>

                            <Section
                                icon={<MaterialCommunityIcons name="monitor-eye" size={22} color={openScoreboardColor} />}
                                title={"Structure preview"}
                                subtitle={"A compact preview of the current graphic structure and styling."}
                            >
                                <View
                                    backgroundColor={previewStyle.backgroundColor}
                                    borderColor={previewStyle.borderColor}
                                    borderRadius={8}
                                    borderWidth={2}
                                    padding={4}
                                >
                                    <Text
                                        color={styles.titleStyles?.color || previewStyle.color}
                                        fontSize={styles.titleStyles?.fontSize || 36}
                                        fontWeight={"bold"}
                                        marginBottom={3}
                                    >
                                        {title || "Competition Graphic"}
                                    </Text>
                                    {isBracket ? (
                                        <BracketPreview bracket={bracket} styles={styles} />
                                    ) : (
                                        <View>
                                            {Object.entries(groups || {}).map(([groupID, group]: any) => (
                                                <View key={`preview-${groupID}`} marginBottom={3}>
                                                    <View
                                                        backgroundColor={styles.groupHeaderStyles?.backgroundColor || "#0B1220"}
                                                        borderRadius={8}
                                                        padding={2}
                                                    >
                                                        <Text
                                                            color={styles.groupHeaderStyles?.color || "#FFFFFF"}
                                                            fontSize={styles.groupHeaderStyles?.fontSize || 18}
                                                            fontWeight={"bold"}
                                                        >
                                                            {group.groupName || "Group"}
                                                        </Text>
                                                    </View>
                                                    {Object.entries(group.players || {}).map(([playerID, player]: any) => (
                                                        <View
                                                            key={`preview-player-${playerID}`}
                                                            backgroundColor={styles.groupPlayerStyles?.backgroundColor || "#FFFFFF"}
                                                            borderRadius={6}
                                                            marginTop={2}
                                                            padding={2}
                                                        >
                                                            <Text
                                                                color={styles.groupPlayerStyles?.color || "#111827"}
                                                                fontSize={styles.groupPlayerStyles?.fontSize || 16}
                                                                fontWeight={"bold"}
                                                            >
                                                                {player.playerName || "Player"}
                                                            </Text>
                                                        </View>
                                                    ))}
                                                </View>
                                            ))}
                                            {footer ? (
                                                <Text
                                                    color={styles.footerStyles?.color || "#CBD5E1"}
                                                    fontSize={styles.footerStyles?.fontSize || 16}
                                                    marginTop={2}
                                                >
                                                    {footer}
                                                </Text>
                                            ) : null}
                                        </View>
                                    )}
                                </View>
                            </Section>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </NativeBaseProvider>
    );
}
