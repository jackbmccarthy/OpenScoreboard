import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable } from 'react-native';
import { Button, Checkbox, FormControl, Input, Select, Spinner, Text, View } from 'native-base';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import db, { getUserPath } from '../database';
import { openScoreboardButtonTextColor, openScoreboardColor } from '../openscoreboardtheme';
import { subFolderPath } from '../openscoreboard.config';
import { updateCompetition } from './functions/competitions';
import {
    buildTeamCompetitionSeeding,
    buildTeamBracketFromStandings,
    createCompetitionTeamTie,
    getDuplicateLineupPlayerIDs,
    getRequiredLineupCodes,
    getTeamCompetitionContests,
    getTeamPlayerOptions,
    getTeamTiePrivateSelections,
    getTeamTieSubmissionStatus,
    ensureTeamTieScheduledMatchPlaceholders,
    migrateLegacyTeamTieSelections,
    saveTeamTieLineup,
    scheduleReadyTeamTieMatches,
    syncCompetitionFromTeamMatch,
} from './functions/teamCompetitions';
import {
    TEAM_A_POSITION_CODES,
    TEAM_B_POSITION_CODES,
    formatTeamTieRuleSummary,
    getTeamTiePositionCodes,
    normalizeTeamTieFormat,
    validateTeamTiePositionCodes,
} from './functions/teamTieFormats';
import {
    deleteTeamTieFormatPreset,
    getTeamTieFormatPresets,
    saveTeamTieFormatPreset,
    setDefaultTeamTieFormatPreset,
} from './functions/teamTieFormatPresets';
import { getMyTeams } from './functions/teams';
import { CopyInputRightButton } from './components/CopyButton';
import { getMyTables } from './functions/tables';
import { assignTeamTieScheduledMatchesToTables } from './functions/scheduling';

function getTeamCompetitionPortalURL(competitionID, teamID, password) {
    if (typeof window === "undefined" || !competitionID || !teamID || !password) {
        return "";
    }

    return `${window.location.origin}${subFolderPath}/competitions/${competitionID}/team/${teamID}/${password}`;
}

function Panel({ children, defaultExpanded = false, icon, subtitle, summary, title }) {
    const [expanded, setExpanded] = useState(defaultExpanded);

    return (
        <View backgroundColor={"white"} borderColor={"gray.200"} borderRadius={8} borderWidth={1} marginBottom={4} overflow={"hidden"}>
            <Pressable
                accessibilityRole={"button"}
                accessibilityState={{ expanded }}
                onPress={() => setExpanded((currentValue) => !currentValue)}
                style={({ pressed }) => ({
                    backgroundColor: pressed ? "#F8FAFC" : "#FFFFFF",
                    opacity: pressed ? 0.84 : 1,
                })}
            >
                <View
                    alignItems={"center"}
                    borderBottomColor={"gray.100"}
                    borderBottomWidth={expanded ? 1 : 0}
                    flexDirection={"row"}
                    padding={4}
                >
                    <View alignItems={"center"} backgroundColor={"blue.50"} borderRadius={8} height={"38px"} justifyContent={"center"} width={"38px"}>
                        <MaterialCommunityIcons name={icon} size={21} color={openScoreboardColor} />
                    </View>
                    <View flex={1} marginLeft={3} paddingRight={2}>
                        <Text color={"gray.900"} fontSize={"lg"} fontWeight={"bold"}>{title}</Text>
                        {summary ? <Text color={"gray.700"} fontSize={"xs"} fontWeight={"bold"} marginTop={1}>{summary}</Text> : null}
                        {subtitle ? <Text color={"gray.500"} fontSize={"2xs"} marginTop={1}>{subtitle}</Text> : null}
                    </View>
                    <MaterialCommunityIcons name={expanded ? "chevron-up" : "chevron-down"} size={24} color={"#4B5563"} />
                </View>
            </Pressable>
            {expanded ? <View padding={4}>{children}</View> : null}
        </View>
    );
}

function TeamOption({ index, isSelected, onPress, team }) {
    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => ({
                backgroundColor: isSelected ? "#EFF6FF" : pressed ? "#F8FAFC" : "#FFFFFF",
                borderColor: isSelected ? openScoreboardColor : "#E5E7EB",
                borderRadius: 8,
                borderWidth: 1,
                marginBottom: 8,
                opacity: pressed ? 0.8 : 1,
                padding: 12,
            })}
        >
            <View alignItems={"center"} flexDirection={"row"}>
                <View
                    alignItems={"center"}
                    backgroundColor={isSelected ? openScoreboardColor : "gray.100"}
                    borderRadius={20}
                    height={"32px"}
                    justifyContent={"center"}
                    width={"32px"}
                >
                    <Text color={isSelected ? openScoreboardButtonTextColor : "gray.700"} fontSize={"xs"} fontWeight={"bold"}>
                        {isSelected ? index + 1 : ""}
                    </Text>
                    {!isSelected ? <MaterialCommunityIcons name="plus" size={17} color={"#4B5563"} /> : null}
                </View>
                <View flex={1} marginLeft={3}>
                    <Text color={"gray.900"} fontSize={"sm"} fontWeight={"bold"}>{team.name || "Untitled team"}</Text>
                    <Text color={"gray.500"} fontSize={"2xs"}>
                        {Object.keys(team.players || {}).length} roster player{Object.keys(team.players || {}).length === 1 ? "" : "s"}
                    </Text>
                </View>
                {isSelected ? <MaterialCommunityIcons name="check-circle" size={21} color={openScoreboardColor} /> : null}
            </View>
        </Pressable>
    );
}

function getContestSnapshot(contest, teamMatches) {
    const teamMatch = teamMatches[contest?.match?.teamMatchID] || {};
    const scoreA = Number(teamMatch.teamAScore ?? contest?.match?.AScore) || 0;
    const scoreB = Number(teamMatch.teamBScore ?? contest?.match?.BScore) || 0;
    const isComplete = teamMatch.isComplete === true ||
        teamMatch.teamTieStatus === "complete" ||
        contest?.match?.isComplete === true;
    const status = isComplete ? "Complete" :
        teamMatch.teamTieStatus === "active" || scoreA > 0 || scoreB > 0 ? "In progress" :
            teamMatch.teamTieStatus === "scheduled" ? "Scheduled" :
                teamMatch.teamTieStatus === "ready" ? "Ready" :
                    contest?.match?.teamMatchID ? "Waiting for lineups" : "Not created";

    return {
        isComplete,
        scoreA,
        scoreB,
        status,
        teamMatch,
    };
}

function ManagerTab({ active, icon, label, onPress }) {
    return (
        <Pressable
            accessibilityRole={"tab"}
            accessibilityState={{ selected: active }}
            onPress={onPress}
            style={({ pressed }) => ({
                backgroundColor: active ? openScoreboardColor : pressed ? "#F3F4F6" : "#FFFFFF",
                borderColor: active ? openScoreboardColor : "#D1D5DB",
                borderRadius: 6,
                borderWidth: 1,
                flexGrow: 1,
                flexShrink: 1,
                minWidth: 130,
                opacity: pressed ? 0.82 : 1,
                paddingHorizontal: 12,
                paddingVertical: 11,
            })}
        >
            <View alignItems={"center"} flexDirection={"row"} justifyContent={"center"}>
                <MaterialCommunityIcons
                    name={icon}
                    size={18}
                    color={active ? openScoreboardButtonTextColor : "#374151"}
                />
                <Text
                    color={active ? openScoreboardButtonTextColor : "gray.700"}
                    fontSize={"xs"}
                    fontWeight={"bold"}
                    marginLeft={2}
                >
                    {label}
                </Text>
            </View>
        </Pressable>
    );
}

function SummaryMetric({ color = "gray.900", label, value }) {
    return (
        <View
            borderColor={"gray.200"}
            borderRadius={6}
            borderWidth={1}
            marginBottom={2}
            marginRight={2}
            minWidth={122}
            padding={3}
        >
            <Text color={"gray.500"} fontSize={"2xs"} fontWeight={"bold"} textTransform={"uppercase"}>{label}</Text>
            <Text color={color} fontSize={"xl"} fontWeight={"bold"} marginTop={1}>{value}</Text>
        </View>
    );
}

function TeamManagementCard({
    competitionID,
    contests,
    navigation,
    onManageContest,
    team,
    teamMatches,
}: any) {
    const [expanded, setExpanded] = useState(false);
    const portalURL = getTeamCompetitionPortalURL(competitionID, team.id, team.teamManagerPassword);
    const openTeamEditor = () => {
        navigation.navigate("TeamEditor", {
            myTeamID: team.myTeamID,
            teamID: team.id,
        });
    };
    const contestSnapshots = contests.map((contest) => ({
        contest,
        snapshot: getContestSnapshot(contest, teamMatches),
    }));
    const completed = contestSnapshots.filter(({ snapshot }) => snapshot.isComplete);
    const wins = completed.filter(({ contest, snapshot }) => {
        return contest.teamAID === team.id ? snapshot.scoreA > snapshot.scoreB : snapshot.scoreB > snapshot.scoreA;
    }).length;
    const losses = completed.length - wins;
    const activeCount = contestSnapshots.filter(({ snapshot }) => snapshot.status === "In progress").length;
    const waitingCount = contestSnapshots.filter(({ snapshot }) => !snapshot.isComplete && snapshot.status !== "In progress").length;

    return (
        <View borderColor={"gray.200"} borderRadius={8} borderWidth={1} marginBottom={3} overflow={"hidden"}>
            <Pressable
                accessibilityRole={"button"}
                accessibilityState={{ expanded }}
                onPress={() => setExpanded((currentValue) => !currentValue)}
                style={({ pressed }) => ({
                    backgroundColor: pressed ? "#F8FAFC" : "#FFFFFF",
                    opacity: pressed ? 0.84 : 1,
                    padding: 14,
                })}
            >
                <View alignItems={"center"} flexDirection={"row"}>
                    <View
                        alignItems={"center"}
                        backgroundColor={"gray.100"}
                        borderRadius={22}
                        height={"42px"}
                        justifyContent={"center"}
                        overflow={"hidden"}
                        width={"42px"}
                    >
                        <MaterialCommunityIcons name="shield-account-outline" size={23} color={team.teamJerseyColor || "#4B5563"} />
                    </View>
                    <View flex={1} marginLeft={3} paddingRight={2}>
                        <Text color={"gray.900"} fontSize={"md"} fontWeight={"bold"}>{team.name || "Untitled team"}</Text>
                        <Text color={"gray.600"} fontSize={"xs"} marginTop={1}>
                            {wins}-{losses} record - {Object.keys(team.players || {}).length} players
                        </Text>
                    </View>
                    <View alignItems={"flex-end"}>
                        <Text color={activeCount > 0 ? "blue.700" : waitingCount > 0 ? "orange.700" : "green.700"} fontSize={"2xs"} fontWeight={"bold"}>
                            {activeCount > 0 ? `${activeCount} active` : waitingCount > 0 ? `${waitingCount} upcoming` : `${completed.length} complete`}
                        </Text>
                        <MaterialCommunityIcons name={expanded ? "chevron-up" : "chevron-down"} size={22} color={"#4B5563"} />
                    </View>
                </View>
            </Pressable>
            {expanded ? (
                <View backgroundColor={"gray.50"} borderTopColor={"gray.100"} borderTopWidth={1} padding={4}>
                    <View alignItems={"center"} flexDirection={"row"} marginBottom={2}>
                        <Text color={"gray.900"} flex={1} fontSize={"sm"} fontWeight={"bold"}>Team manager portal</Text>
                        <Button onPress={openTeamEditor} size={"sm"} variant={"outline"}>
                            <Text color={openScoreboardColor} fontWeight={"bold"}>Edit team</Text>
                        </Button>
                    </View>
                    {portalURL ? (
                        <View alignItems={"center"} flexDirection={{ base: "column", md: "row" }}>
                            <Input
                                backgroundColor={"white"}
                                flex={1}
                                isReadOnly
                                InputRightElement={<CopyInputRightButton text={portalURL} />}
                                value={portalURL}
                            />
                            <Button
                                alignSelf={{ base: "stretch", md: "center" }}
                                marginLeft={{ base: 0, md: 2 }}
                                marginTop={{ base: 2, md: 0 }}
                                onPress={() => navigation.navigate("TeamCompetitionPortal", {
                                    competitionID,
                                    password: team.teamManagerPassword,
                                    teamID: team.id,
                                })}
                                variant={"outline"}
                            >
                                <Text color={openScoreboardColor} fontWeight={"bold"}>Open portal</Text>
                            </Button>
                        </View>
                    ) : (
                        <Text color={"orange.700"} fontSize={"xs"}>
                            Open this team in Team Manager once to create its manager access link.
                        </Text>
                    )}

                    <Text color={"gray.900"} fontSize={"sm"} fontWeight={"bold"} marginBottom={2} marginTop={4}>Assigned team ties</Text>
                    {contestSnapshots.length === 0 ? (
                        <Text color={"gray.600"} fontSize={"xs"}>No team ties have been generated for this team.</Text>
                    ) : contestSnapshots.map(({ contest, snapshot }) => {
                        const opponentName = contest.teamAID === team.id ? contest.teamBName : contest.teamAName;
                        const teamScore = contest.teamAID === team.id ? snapshot.scoreA : snapshot.scoreB;
                        const opponentScore = contest.teamAID === team.id ? snapshot.scoreB : snapshot.scoreA;
                        return (
                            <View
                                key={contest.key}
                                alignItems={"center"}
                                backgroundColor={"white"}
                                borderColor={"gray.200"}
                                borderRadius={6}
                                borderWidth={1}
                                flexDirection={"row"}
                                marginBottom={2}
                                padding={3}
                            >
                                <View flex={1} paddingRight={2}>
                                    <Text color={"gray.500"} fontSize={"2xs"} fontWeight={"bold"} textTransform={"uppercase"}>{contest.roundLabel}</Text>
                                    <Text color={"gray.900"} fontSize={"sm"} fontWeight={"bold"} marginTop={1}>vs {opponentName}</Text>
                                    <Text color={"gray.600"} fontSize={"xs"} marginTop={1}>{teamScore} - {opponentScore} - {snapshot.status}</Text>
                                </View>
                                <Button onPress={() => onManageContest(contest.key)} size={"sm"} variant={"ghost"}>
                                    <Text color={openScoreboardColor} fontWeight={"bold"}>Manage</Text>
                                </Button>
                            </View>
                        );
                    })}
                </View>
            ) : null}
        </View>
    );
}

function RuleEditor({ index, onChange, onRemove, rule, showRemove }) {
    const updateSlots = (side, slotIndex, value) => {
        const slots = [...(rule[side] || [])];
        slots[slotIndex] = value;
        onChange({ ...rule, [side]: slots });
    };

    return (
        <View borderBottomColor={"gray.100"} borderBottomWidth={1} paddingY={3}>
            <View alignItems={"center"} flexDirection={"row"}>
                <Text color={"gray.900"} flex={1} fontSize={"sm"} fontWeight={"bold"}>Contest match {index + 1}</Text>
                {showRemove ? (
                    <Button accessibilityLabel={"Remove match"} onPress={onRemove} size={"sm"} variant={"ghost"}>
                        <MaterialCommunityIcons name="trash-can-outline" size={18} color={"#B91C1C"} />
                    </Button>
                ) : null}
            </View>
            <View flexDirection={"row"} flexWrap={"wrap"} marginTop={2}>
                <FormControl marginBottom={2} paddingRight={2} width={{ base: "100%", md: "31%" }}>
                    <FormControl.Label>Label</FormControl.Label>
                    <Input value={rule.label} onChangeText={(label) => onChange({ ...rule, label })} />
                </FormControl>
                <FormControl marginBottom={2} paddingRight={2} width={{ base: "50%", md: "23%" }}>
                    <FormControl.Label>Format</FormControl.Label>
                    <Select
                        selectedValue={rule.matchType}
                        onValueChange={(matchType) => {
                            onChange({
                                ...rule,
                                matchType,
                                sideAOptions: matchType === "doubles" ?
                                    [rule.sideAOptions?.[0] || ["A"], rule.sideAOptions?.[1] || ["B"]]
                                    : [rule.sideAOptions?.[0] || ["A"]],
                                sideBOptions: matchType === "doubles" ?
                                    [rule.sideBOptions?.[0] || ["X"], rule.sideBOptions?.[1] || ["Y"]]
                                    : [rule.sideBOptions?.[0] || ["X"]],
                            });
                        }}
                    >
                        <Select.Item label="Singles" value="singles" />
                        <Select.Item label="Doubles" value="doubles" />
                    </Select>
                </FormControl>
                <FormControl marginBottom={2} paddingRight={2} width={{ base: "50%", md: "23%" }}>
                    <FormControl.Label>Best of</FormControl.Label>
                    <Select selectedValue={`${rule.bestOf}`} onValueChange={(bestOf) => onChange({ ...rule, bestOf: Number(bestOf) })}>
                        {[1, 3, 5, 7, 9].map((bestOf) => <Select.Item key={bestOf} label={`${bestOf}`} value={`${bestOf}`} />)}
                    </Select>
                </FormControl>
                <FormControl marginBottom={2} width={{ base: "50%", md: "23%" }}>
                    <FormControl.Label>Lineup stage</FormControl.Label>
                    <Select selectedValue={`${rule.checkpoint}`} onValueChange={(checkpoint) => onChange({ ...rule, checkpoint: Number(checkpoint) })}>
                        <Select.Item label="Opening" value="1" />
                        <Select.Item label="Second submission" value="2" />
                        <Select.Item label="Final submission" value="3" />
                    </Select>
                </FormControl>
            </View>
            <View alignItems={"center"} flexDirection={"row"} flexWrap={"wrap"}>
                <Text color={"gray.600"} fontSize={"xs"} fontWeight={"bold"} marginRight={2}>Team A positions</Text>
                {(rule.sideAOptions || []).map((options, slotIndex) => (
                    <Input
                        key={`A-${slotIndex}`}
                        marginRight={2}
                        maxLength={32}
                        onChangeText={(value) => updateSlots("sideAOptions", slotIndex, value)}
                        placeholder={"A / C"}
                        textAlign={"center"}
                        value={Array.isArray(options) ? options.join(" / ") : options || ""}
                        width={"112px"}
                    />
                ))}
                <Text color={"gray.600"} fontSize={"xs"} fontWeight={"bold"} marginLeft={2} marginRight={2}>Team B positions</Text>
                {(rule.sideBOptions || []).map((options, slotIndex) => (
                    <Input
                        key={`B-${slotIndex}`}
                        marginRight={2}
                        maxLength={32}
                        onChangeText={(value) => updateSlots("sideBOptions", slotIndex, value)}
                        placeholder={"X / Z"}
                        textAlign={"center"}
                        value={Array.isArray(options) ? options.join(" / ") : options || ""}
                        width={"112px"}
                    />
                ))}
            </View>
            <Text color={"gray.500"} fontSize={"2xs"} marginTop={2}>
                Use a slash to offer alternatives for one player slot, for example A / C or X / Z.
            </Text>
        </View>
    );
}

function TeamTieFormatSummary({ format }) {
    const positions = getTeamTiePositionCodes(format);

    return (
        <View backgroundColor={"gray.50"} borderColor={"gray.200"} borderRadius={8} borderWidth={1} marginBottom={3} padding={3}>
            <View alignItems={"center"} flexDirection={"row"} justifyContent={"space-between"}>
                <Text color={"gray.900"} fontSize={"sm"} fontWeight={"bold"}>Format summary</Text>
                <Text color={"gray.500"} fontSize={"2xs"}>
                    First to {format.gamesToWin} - {format.tableCount} table{format.tableCount === 1 ? "" : "s"} - {positions.sideA.length}/{positions.sideB.length} positions
                </Text>
            </View>
            <View flexDirection={"row"} flexWrap={"wrap"} marginTop={2}>
                {format.rules.map((rule, index) => (
                    <View
                        key={rule.id}
                        backgroundColor={"white"}
                        borderColor={"gray.200"}
                        borderRadius={6}
                        borderWidth={1}
                        marginBottom={2}
                        marginRight={2}
                        paddingX={3}
                        paddingY={2}
                    >
                        <Text color={"gray.500"} fontSize={"2xs"} fontWeight={"bold"}>
                            {index + 1} - {rule.matchType === "doubles" ? "Doubles" : "Singles"} - Stage {rule.checkpoint}
                        </Text>
                        <Text color={"gray.900"} fontSize={"xs"} fontWeight={"bold"} marginTop={1}>
                            {formatTeamTieRuleSummary(rule)}
                        </Text>
                    </View>
                ))}
            </View>
        </View>
    );
}

function TeamTiePositionLegend() {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <View backgroundColor={"blue.50"} borderColor={"blue.100"} borderRadius={8} borderWidth={1} marginBottom={3} overflow={"hidden"}>
            <Pressable
                onPress={() => setIsExpanded((currentValue) => !currentValue)}
                style={({ pressed }) => ({
                    opacity: pressed ? 0.78 : 1,
                    padding: 12,
                })}
            >
                <View alignItems={"center"} flexDirection={"row"}>
                    <MaterialCommunityIcons name="information-outline" size={19} color={openScoreboardColor} />
                    <View flex={1} marginLeft={2}>
                        <Text color={"blue.900"} fontSize={"sm"} fontWeight={"bold"}>Position code legend</Text>
                        <Text color={"blue.800"} fontSize={"xs"}>
                            Team A and Team B codes for roster positions 1-10.
                        </Text>
                    </View>
                    <MaterialCommunityIcons name={isExpanded ? "chevron-up" : "chevron-down"} size={22} color={openScoreboardColor} />
                </View>
            </Pressable>
            {isExpanded ? (
                <View borderTopColor={"blue.100"} borderTopWidth={1} padding={3}>
                    <View backgroundColor={"white"} borderColor={"blue.100"} borderRadius={6} borderWidth={1} overflow={"hidden"}>
                        <View backgroundColor={"blue.100"} flexDirection={"row"} paddingX={3} paddingY={2}>
                            <Text color={"blue.900"} fontSize={"2xs"} fontWeight={"bold"} width={"34%"}>PLAYER NUMBER</Text>
                            <Text color={"blue.900"} fontSize={"2xs"} fontWeight={"bold"} textAlign={"center"} width={"33%"}>TEAM A</Text>
                            <Text color={"blue.900"} fontSize={"2xs"} fontWeight={"bold"} textAlign={"center"} width={"33%"}>TEAM B</Text>
                        </View>
                        {TEAM_A_POSITION_CODES.map((teamACode, index) => (
                            <View
                                key={teamACode}
                                backgroundColor={index % 2 === 0 ? "white" : "gray.50"}
                                borderTopColor={"blue.100"}
                                borderTopWidth={index === 0 ? 0 : 1}
                                flexDirection={"row"}
                                paddingX={3}
                                paddingY={2}
                            >
                                <Text color={"gray.700"} fontSize={"xs"} fontWeight={"bold"} width={"34%"}>Player {index + 1}</Text>
                                <Text color={"gray.900"} fontSize={"xs"} fontWeight={"bold"} textAlign={"center"} width={"33%"}>{teamACode}</Text>
                                <Text color={"gray.900"} fontSize={"xs"} fontWeight={"bold"} textAlign={"center"} width={"33%"}>{TEAM_B_POSITION_CODES[index]}</Text>
                            </View>
                        ))}
                    </View>
                    <Text color={"blue.800"} fontSize={"2xs"} marginTop={2}>
                        Alternatives stay on the same side, for example A / C or X / Z. Team A codes cannot be used for Team B.
                    </Text>
                </View>
            ) : null}
        </View>
    );
}

function LineupSelect({ code, onChange, options, selectedPlayerIDs, value }) {
    return (
        <FormControl marginBottom={2} paddingRight={2} width={{ base: "100%", md: "50%" }}>
            <FormControl.Label>Position {code}</FormControl.Label>
            <Select placeholder={`Select ${code}`} selectedValue={value || ""} onValueChange={onChange}>
                {options.map((option) => (
                    <Select.Item
                        isDisabled={option.id !== value && selectedPlayerIDs.includes(option.id)}
                        key={`${code}-${option.id}`}
                        label={option.id !== value && selectedPlayerIDs.includes(option.id) ? `${option.label} - already assigned` : option.label}
                        value={option.id}
                    />
                ))}
            </Select>
        </FormControl>
    );
}

function MatchCodeSelect({ codeOptions, label, lineup, onChange, playerOptions, value }) {
    const availableOptions = codeOptions.map((code) => {
        const playerID = lineup[code];
        const player = playerOptions.find((option) => option.id === playerID);
        return {
            code,
            label: player ? `${code} - ${player.label}` : `${code} - Player not assigned`,
        };
    });

    return (
        <FormControl marginBottom={2} paddingRight={2} width={{ base: "100%", md: "50%" }}>
            <FormControl.Label>{label}</FormControl.Label>
            <Select selectedValue={value || codeOptions[0] || ""} onValueChange={onChange}>
                {availableOptions.map((option) => (
                    <Select.Item key={option.code} label={option.label} value={option.code} />
                ))}
            </Select>
        </FormControl>
    );
}

function TeamTieCard({
    competition,
    contest,
    expanded,
    loading,
    navigation,
    onAction,
    onSelect,
    onStatus,
    onToggle,
    selected,
    teamMatch,
    tables,
    teamsByID,
}: any) {
    const [lineup, setLineup] = useState<any>({});
    const [matchCodeSelections, setMatchCodeSelections] = useState<any>({});
    const [checkpoint, setCheckpoint] = useState(1);
    const [selectedTieTableIDs, setSelectedTieTableIDs] = useState<string[]>([]);
    const [assigningMatchID, setAssigningMatchID] = useState("");
    const preparingPlaceholdersRef = useRef(false);

    useEffect(() => {
        setCheckpoint(Math.max(1, Number(teamMatch?.lineupCheckpoint) || 1));
        if (!contest.match.teamMatchID) {
            setLineup({});
            setMatchCodeSelections({});
            return;
        }

        let isCurrent = true;
        getTeamTiePrivateSelections(contest.match.teamMatchID).then((selections) => {
            if (!isCurrent) {
                return;
            }

            setLineup({
                ...(teamMatch?.lineup || {}),
                ...(selections.A?.lineup || {}),
                ...(selections.B?.lineup || {}),
            });
            const ruleIDs = Object.keys({
                ...(teamMatch?.matchCodeSelections || {}),
                ...(selections.A?.matchCodeSelections || {}),
                ...(selections.B?.matchCodeSelections || {}),
            });
            setMatchCodeSelections(ruleIDs.reduce((nextSelections, ruleID) => {
                nextSelections[ruleID] = {
                    ...(teamMatch?.matchCodeSelections?.[ruleID] || {}),
                    ...(selections.A?.matchCodeSelections?.[ruleID] || {}),
                    ...(selections.B?.matchCodeSelections?.[ruleID] || {}),
                };
                return nextSelections;
            }, {}));
        });

        return () => {
            isCurrent = false;
        };
    }, [
        contest.match.teamMatchID,
        teamMatch?.lineupCheckpoint,
        teamMatch?.lineupSubmissions?.A?.updatedOn,
        teamMatch?.lineupSubmissions?.B?.updatedOn,
    ]);

    const format = normalizeTeamTieFormat(teamMatch?.teamTieFormat || competition?.data?.teamTieFormat);
    const codes = getRequiredLineupCodes(format, checkpoint);
    const teamA = teamsByID[contest.teamAID] || {};
    const teamB = teamsByID[contest.teamBID] || {};
    const teamAPlayers = getTeamPlayerOptions(teamA);
    const teamBPlayers = getTeamPlayerOptions(teamB);
    const eligibleTables = tables.filter(([, table]: any) => {
        return !table?.sportName || table.sportName === competition.sportName;
    });
    const selectedTeamAPlayerIDs = codes.sideA.map((code) => lineup[code]).filter(Boolean);
    const selectedTeamBPlayerIDs = codes.sideB.map((code) => lineup[code]).filter(Boolean);
    const duplicateTeamAPlayerIDs = getDuplicateLineupPlayerIDs(lineup, codes.sideA);
    const duplicateTeamBPlayerIDs = getDuplicateLineupPlayerIDs(lineup, codes.sideB);
    const scoreA = Number(teamMatch?.teamAScore ?? contest.match.AScore) || 0;
    const scoreB = Number(teamMatch?.teamBScore ?? contest.match.BScore) || 0;
    const submissionStatus = getTeamTieSubmissionStatus(teamMatch);
    const scheduledPlayerMatches = Object.entries(teamMatch?.scheduledMatches || {}).sort(([, firstMatch]: any, [, secondMatch]: any) => {
        return Number(firstMatch?.order || 0) - Number(secondMatch?.order || 0);
    });
    const status = contest.match.isComplete ? "Complete" :
        teamMatch?.teamTieStatus === "active" ? "In progress" :
            teamMatch?.teamTieStatus === "scheduled" ? "Scheduled" :
                teamMatch?.teamTieStatus === "ready" ? "Ready" :
                contest.match.teamMatchID ? "Lineup" : "Not created";
    const statusColor = status === "Complete" ? "#16A34A" : status === "Not created" ? "#9CA3AF" : "#EAB308";

    useEffect(() => {
        if (
            !contest.match.teamMatchID ||
            !teamMatch ||
            preparingPlaceholdersRef.current
        ) {
            return;
        }

        preparingPlaceholdersRef.current = true;
        ensureTeamTieScheduledMatchPlaceholders(contest.match.teamMatchID)
            .catch((error) => {
                console.error("[TeamTournamentManager] failed to prepare team tie placeholders", error);
                onStatus(error?.message || "The team tie match slots could not be prepared.", "error");
            })
            .finally(() => {
                preparingPlaceholdersRef.current = false;
            });
    }, [contest.match.teamMatchID, !!teamMatch]);

    useEffect(() => {
        if (selectedTieTableIDs.length > 0) {
            return;
        }
        const assignedTableIDs = [...new Set<string>(scheduledPlayerMatches.flatMap(([, scheduledMatch]: any) => {
            const sharedTableIDs = Object.keys(scheduledMatch.tableAssignments || {});
            return sharedTableIDs.length > 0 ?
                sharedTableIDs
                : scheduledMatch.assignedTableID ? [scheduledMatch.assignedTableID] : [];
        }))];
        if (assignedTableIDs.length > 0) {
            setSelectedTieTableIDs(assignedTableIDs);
        }
    }, [scheduledPlayerMatches.map(([scheduledMatchID, scheduledMatch]: any) => {
        return `${scheduledMatchID}:${Object.keys(scheduledMatch.tableAssignments || {}).join(",")}:${scheduledMatch.assignedTableID || ""}`;
    }).join("|")]);

    async function createTie() {
        await onAction(contest.key, async () => {
            await createCompetitionTeamTie(competition, contest);
            onStatus("Team tie created. Its ordered match slots are ready for table assignment while teams prepare their lineups.", "success");
        });
    }

    async function saveLineup() {
        if (duplicateTeamAPlayerIDs.length > 0 || duplicateTeamBPlayerIDs.length > 0) {
            onStatus("Each player can only be assigned to one lineup position for the same team.", "error");
            return;
        }
        await onAction(contest.key, async () => {
            await saveTeamTieLineup(contest.match.teamMatchID, lineup, checkpoint, matchCodeSelections);
            onStatus("Lineup saved.", "success");
        });
    }

    function updateMatchCodeSelection(ruleID, side, slotIndex, code) {
        setMatchCodeSelections((currentSelections) => {
            const ruleSelections = currentSelections[ruleID] || {};
            const sideSelections = [...(ruleSelections[side] || [])];
            sideSelections[slotIndex] = code;

            return {
                ...currentSelections,
                [ruleID]: {
                    ...ruleSelections,
                    [side]: sideSelections,
                },
            };
        });
    }

    function updateLineupPlayer(code, playerID, sideCodes) {
        const existingCode = sideCodes.find((nextCode) => nextCode !== code && lineup[nextCode] === playerID);
        if (existingCode) {
            onStatus(`That player is already assigned to position ${existingCode}. Choose a different player for ${code}.`, "error");
            return;
        }
        setLineup((currentLineup) => ({ ...currentLineup, [code]: playerID }));
    }

    async function scheduleReady() {
        if (duplicateTeamAPlayerIDs.length > 0 || duplicateTeamBPlayerIDs.length > 0) {
            onStatus("Each player can only be assigned to one lineup position for the same team.", "error");
            return;
        }
        await onAction(contest.key, async () => {
            await saveTeamTieLineup(contest.match.teamMatchID, lineup, checkpoint, matchCodeSelections);
            const scheduled = await scheduleReadyTeamTieMatches(contest.match.teamMatchID);
            onStatus(
                scheduled.length > 0 ?
                    `Updated ${scheduled.length} match${scheduled.length === 1 ? "" : "es"} with the revealed player selections.`
                    : "No additional matches are ready. Complete the required lineup stage or check the existing schedule.",
                scheduled.length > 0 ? "success" : "error"
            );
        });
    }

    function toggleTieTable(tableID) {
        setSelectedTieTableIDs((currentTableIDs) => {
            return currentTableIDs.includes(tableID) ?
                currentTableIDs.filter((currentTableID) => currentTableID !== tableID)
                : [...currentTableIDs, tableID];
        });
    }

    async function sendAllMatchesToTables() {
        const selectedTableEntries = eligibleTables
            .filter(([tableID]) => selectedTieTableIDs.includes(tableID))
            .map(([tableID, table]: any) => ({
                tableID,
                tableName: table?.tableName || "Table",
            }));
        if (selectedTableEntries.length === 0) {
            onStatus("Choose at least one table before sending the team tie.", "error");
            return;
        }

        const scheduledMatchIDs = scheduledPlayerMatches
            .filter(([, scheduledMatch]: any) => {
                return scheduledMatch?.isComplete !== true &&
                    scheduledMatch?.status !== "active" &&
                    scheduledMatch?.status !== "cancelled" &&
                    scheduledMatch?.status !== "complete" &&
                    scheduledMatch?.status !== "resolved";
            })
            .map(([scheduledMatchID]) => scheduledMatchID);
        if (scheduledMatchIDs.length === 0) {
            onStatus("There are no pending team tie matches to schedule.", "error");
            return;
        }

        setAssigningMatchID("all");
        try {
            await onAction(`${contest.key}-all-tables`, async () => {
                await assignTeamTieScheduledMatchesToTables(
                    contest.match.teamMatchID,
                    scheduledMatchIDs,
                    selectedTableEntries
                );
                onStatus(
                    `${scheduledMatchIDs.length} match${scheduledMatchIDs.length === 1 ? "" : "es"} shared across ${selectedTableEntries.length} table${selectedTableEntries.length === 1 ? "" : "s"}.`,
                    "success"
                );
            });
        }
        finally {
            setAssigningMatchID("");
        }
    }

    return (
        <View borderColor={"gray.200"} borderRadius={8} borderWidth={1} marginBottom={3} overflow={"hidden"}>
            <View alignItems={"stretch"} flexDirection={"row"}>
                <View alignItems={"center"} justifyContent={"center"} paddingLeft={3}>
                    <Checkbox
                        accessibilityLabel={`Select ${contest.teamAName} versus ${contest.teamBName}`}
                        isChecked={selected}
                        isDisabled={!!contest.match.teamMatchID}
                        onChange={onSelect}
                        value={contest.key}
                    />
                </View>
                <Pressable
                    onPress={onToggle}
                    style={({ pressed }) => ({
                        backgroundColor: pressed ? "#F8FAFC" : "#FFFFFF",
                        flex: 1,
                        opacity: pressed ? 0.85 : 1,
                        padding: 14,
                    })}
                >
                    <View alignItems={"center"} flexDirection={"row"}>
                        <View flex={1} paddingRight={3}>
                            <Text color={"gray.500"} fontSize={"2xs"} fontWeight={"bold"} textTransform={"uppercase"}>{contest.roundLabel}</Text>
                            <Text color={"gray.900"} fontSize={"md"} fontWeight={"bold"} numberOfLines={2}>
                                {contest.teamAName} <Text color={"gray.400"}>vs</Text> {contest.teamBName}
                            </Text>
                            <Text color={"gray.600"} fontSize={"xs"} marginTop={1}>{scoreA} - {scoreB} - First to {format.gamesToWin}</Text>
                            {contest.match.teamMatchID ? (
                                <Text color={submissionStatus.ready ? "green.700" : "orange.700"} fontSize={"2xs"} fontWeight={"bold"} marginTop={1}>
                                    {submissionStatus.ready ?
                                        "Both teams submitted"
                                        : `Waiting for ${submissionStatus.waitingFor.join(" and ")}`}
                                </Text>
                            ) : null}
                        </View>
                        <View alignItems={"flex-end"}>
                            <View alignItems={"center"} flexDirection={"row"}>
                                <View backgroundColor={statusColor} borderRadius={10} height={"10px"} marginRight={2} width={"10px"} />
                                <Text color={"gray.600"} fontSize={"2xs"} fontWeight={"bold"}>{status}</Text>
                            </View>
                            <MaterialCommunityIcons name={expanded ? "chevron-up" : "chevron-down"} size={22} color={"#4B5563"} />
                        </View>
                    </View>
                </Pressable>
            </View>

            {expanded ? (
                <View backgroundColor={"gray.50"} borderTopColor={"gray.100"} borderTopWidth={1} padding={4}>
                    {!contest.match.teamMatchID ? (
                        <Button backgroundColor={openScoreboardColor} isDisabled={loading} onPress={createTie}>
                            {loading ? <Spinner color={openScoreboardButtonTextColor} /> : (
                                <Text color={openScoreboardButtonTextColor} fontWeight={"bold"}>Create team tie</Text>
                            )}
                        </Button>
                    ) : (
                        <>
                            <View flexDirection={"row"} flexWrap={"wrap"} justifyContent={"space-between"}>
                                <View width={{ base: "100%", md: "48.5%" }}>
                                    <Text color={"gray.900"} fontSize={"sm"} fontWeight={"bold"} marginBottom={2}>{contest.teamAName}</Text>
                                    {codes.sideA.map((code) => (
                                        <LineupSelect
                                            key={`A-${code}`}
                                            code={code}
                                            onChange={(playerID) => updateLineupPlayer(code, playerID, codes.sideA)}
                                            options={teamAPlayers}
                                            selectedPlayerIDs={selectedTeamAPlayerIDs}
                                            value={lineup[code]}
                                        />
                                    ))}
                                    {duplicateTeamAPlayerIDs.length > 0 ? (
                                        <Text color={"red.700"} fontSize={"xs"} fontWeight={"bold"} marginBottom={2}>
                                            Each player may occupy only one {contest.teamAName} lineup position.
                                        </Text>
                                    ) : null}
                                </View>
                                <View width={{ base: "100%", md: "48.5%" }}>
                                    <Text color={"gray.900"} fontSize={"sm"} fontWeight={"bold"} marginBottom={2}>{contest.teamBName}</Text>
                                    {codes.sideB.map((code) => (
                                        <LineupSelect
                                            key={`B-${code}`}
                                            code={code}
                                            onChange={(playerID) => updateLineupPlayer(code, playerID, codes.sideB)}
                                            options={teamBPlayers}
                                            selectedPlayerIDs={selectedTeamBPlayerIDs}
                                            value={lineup[code]}
                                        />
                                    ))}
                                    {duplicateTeamBPlayerIDs.length > 0 ? (
                                        <Text color={"red.700"} fontSize={"xs"} fontWeight={"bold"} marginBottom={2}>
                                            Each player may occupy only one {contest.teamBName} lineup position.
                                        </Text>
                                    ) : null}
                                </View>
                            </View>
                            {format.rules.some((rule) => {
                                return rule.checkpoint <= checkpoint &&
                                    [...rule.sideAOptions, ...rule.sideBOptions].some((options) => options.length > 1);
                            }) ? (
                                <View borderTopColor={"gray.200"} borderTopWidth={1} marginTop={3} paddingTop={3}>
                                    <Text color={"gray.900"} fontSize={"sm"} fontWeight={"bold"}>Choose optional match positions</Text>
                                    <Text color={"gray.600"} fontSize={"xs"} marginBottom={2}>
                                        Choose which eligible lineup position will play before these matches are scheduled.
                                    </Text>
                                    {format.rules
                                        .filter((rule) => rule.checkpoint <= checkpoint)
                                        .map((rule, ruleIndex) => {
                                            const hasOptions = [...rule.sideAOptions, ...rule.sideBOptions].some((options) => options.length > 1);
                                            if (!hasOptions) {
                                                return null;
                                            }
                                            const selections = matchCodeSelections[rule.id] || {};
                                            return (
                                                <View key={rule.id} backgroundColor={"white"} borderColor={"gray.200"} borderRadius={8} borderWidth={1} marginBottom={2} padding={3}>
                                                    <Text color={"gray.900"} fontSize={"xs"} fontWeight={"bold"}>
                                                        {rule.label || `Match ${ruleIndex + 1}`} - {formatTeamTieRuleSummary(rule)}
                                                    </Text>
                                                    <View flexDirection={"row"} flexWrap={"wrap"} marginTop={2}>
                                                        {rule.sideAOptions.map((options, slotIndex) => (
                                                            options.length > 1 ? (
                                                                <MatchCodeSelect
                                                                    key={`A-${slotIndex}`}
                                                                    codeOptions={options}
                                                                    label={`${contest.teamAName} player ${slotIndex + 1}`}
                                                                    lineup={lineup}
                                                                    onChange={(code) => updateMatchCodeSelection(rule.id, "sideA", slotIndex, code)}
                                                                    playerOptions={teamAPlayers}
                                                                    value={selections.sideA?.[slotIndex]}
                                                                />
                                                            ) : null
                                                        ))}
                                                        {rule.sideBOptions.map((options, slotIndex) => (
                                                            options.length > 1 ? (
                                                                <MatchCodeSelect
                                                                    key={`B-${slotIndex}`}
                                                                    codeOptions={options}
                                                                    label={`${contest.teamBName} player ${slotIndex + 1}`}
                                                                    lineup={lineup}
                                                                    onChange={(code) => updateMatchCodeSelection(rule.id, "sideB", slotIndex, code)}
                                                                    playerOptions={teamBPlayers}
                                                                    value={selections.sideB?.[slotIndex]}
                                                                />
                                                            ) : null
                                                        ))}
                                                    </View>
                                                </View>
                                            );
                                        })}
                                </View>
                            ) : null}
                            <View flexDirection={"row"} flexWrap={"wrap"} marginTop={2}>
                                <Button backgroundColor={openScoreboardColor} isDisabled={loading} marginBottom={2} marginRight={2} onPress={saveLineup}>
                                    <Text color={openScoreboardButtonTextColor} fontWeight={"bold"}>Save lineup</Text>
                                </Button>
                                <Button isDisabled={loading} marginBottom={2} marginRight={2} onPress={scheduleReady} variant={"outline"}>
                                    <Text color={openScoreboardColor} fontWeight={"bold"}>Apply lineup to ready matches</Text>
                                </Button>
                                <Button
                                    marginBottom={2}
                                    onPress={() => navigation.navigate("SchedulingManager", {
                                        sourceID: contest.match.teamMatchID,
                                        sourceType: "teamMatch",
                                        teamAID: contest.teamAID,
                                        teamBID: contest.teamBID,
                                        teamMatchID: contest.match.teamMatchID,
                                        sportName: competition.sportName,
                                    })}
                                    variant={"ghost"}
                                >
                                    <Text color={"gray.700"} fontWeight={"bold"}>Open schedule</Text>
                                </Button>
                            </View>
                            {checkpoint < Math.max(...format.rules.map((rule) => rule.checkpoint)) ? (
                                <Text color={"gray.600"} fontSize={"xs"} marginBottom={2}>
                                    The next lineup stage opens automatically after every match in the current stage is complete.
                                </Text>
                            ) : null}
                            {scheduledPlayerMatches.length > 0 ? (
                                <View borderTopColor={"gray.200"} borderTopWidth={1} marginTop={3} paddingTop={3}>
                                    <Text color={"gray.900"} fontSize={"sm"} fontWeight={"bold"}>Player matches</Text>
                                    <Text color={"gray.600"} fontSize={"xs"} marginBottom={2}>
                                        Share every match with the normal tables that may host this tie. Player names will fill in after both teams submit their lineup.
                                    </Text>
                                    <View backgroundColor={"blue.50"} borderColor={"blue.100"} borderRadius={8} borderWidth={1} marginBottom={3} padding={3}>
                                        <Text color={"blue.900"} fontSize={"xs"} fontWeight={"bold"}>Eligible scoring tables</Text>
                                        <Text color={"blue.800"} fontSize={"2xs"} marginBottom={2} marginTop={1}>
                                            Each selected table receives the same ordered match queue. The first table to start a match removes it from every other table.
                                        </Text>
                                        <View flexDirection={"row"} flexWrap={"wrap"}>
                                            {eligibleTables.map(([tableID, table]: any) => (
                                                <Checkbox
                                                    accessibilityLabel={`Use ${table?.tableName || "table"} for this team tie`}
                                                    isChecked={selectedTieTableIDs.includes(tableID)}
                                                    key={tableID}
                                                    marginBottom={2}
                                                    marginRight={4}
                                                    onChange={() => toggleTieTable(tableID)}
                                                    value={tableID}
                                                >
                                                    {table?.tableName || "Table"}
                                                </Checkbox>
                                            ))}
                                        </View>
                                        <Button
                                            alignSelf={"flex-start"}
                                            backgroundColor={openScoreboardColor}
                                            isDisabled={selectedTieTableIDs.length === 0 || loading || assigningMatchID === "all"}
                                            marginTop={2}
                                            onPress={sendAllMatchesToTables}
                                            size={"sm"}
                                        >
                                            {assigningMatchID === "all" ? (
                                                <Spinner color={openScoreboardButtonTextColor} size={"sm"} />
                                            ) : (
                                                <Text color={openScoreboardButtonTextColor} fontWeight={"bold"}>
                                                    Send all matches to selected tables
                                                </Text>
                                            )}
                                        </Button>
                                    </View>
                                    {scheduledPlayerMatches.map(([scheduledMatchID, scheduledMatch]: any) => {
                                        const isFinished = scheduledMatch.isComplete === true ||
                                            scheduledMatch.status === "cancelled" ||
                                            scheduledMatch.status === "complete" ||
                                            scheduledMatch.status === "resolved";
                                        const isActive = scheduledMatch.status === "active";
                                        const assignedTables: any[] = Object.values(scheduledMatch.tableAssignments || {});
                                        const assignedTableLabel = assignedTables.length > 0 ?
                                            assignedTables.map((assignment) => assignment.tableName || "Table").join(", ")
                                            : scheduledMatch.assignedTableID ? scheduledMatch.assignedTableName || "Table" : "";
                                        const claimedTableName = scheduledMatch.claim?.tableID ?
                                            scheduledMatch.tableAssignments?.[scheduledMatch.claim.tableID]?.tableName || "table"
                                            : scheduledMatch.assignedTableName || "table";

                                        return (
                                            <View
                                                key={scheduledMatchID}
                                                backgroundColor={"white"}
                                                borderColor={"gray.200"}
                                                borderRadius={8}
                                                borderWidth={1}
                                                marginTop={2}
                                                padding={3}
                                            >
                                                <Text color={"gray.500"} fontSize={"2xs"} fontWeight={"bold"} textTransform={"uppercase"}>
                                                    {scheduledMatch.matchRound || `Match ${scheduledMatch.order || ""}`}
                                                </Text>
                                                <Text color={"gray.900"} fontSize={"sm"} fontWeight={"bold"} marginTop={1}>
                                                    {scheduledMatch.lineupPending ?
                                                        formatTeamTieRuleSummary(format.rules.find((rule) => rule.id === scheduledMatch.teamTieRuleID))
                                                        : `${scheduledMatch.playerA || "TBD"} vs ${scheduledMatch.playerB || "TBD"}`}
                                                </Text>
                                                <Text
                                                    color={isFinished ? "green.700" : isActive ? "blue.700" : assignedTableLabel ? "gray.600" : "orange.700"}
                                                    fontSize={"2xs"}
                                                    fontWeight={"bold"}
                                                    marginTop={2}
                                                >
                                                    {scheduledMatch.status === "cancelled" ? "Not needed - team tie completed" :
                                                        isFinished ? "Completed" :
                                                        isActive ? `Playing on ${claimedTableName}` :
                                                        assignedTableLabel ? `Available on ${assignedTableLabel}` :
                                                        "Not sent to a table"}
                                                </Text>
                                            </View>
                                        );
                                    })}
                                </View>
                            ) : null}
                        </>
                    )}
                </View>
            ) : null}
        </View>
    );
}

export default function TeamTournamentManager({ competition, navigation, onStatus }: any) {
    const [teams, setTeams] = useState<any[]>([]);
    const [tables, setTables] = useState<any[]>([]);
    const [selectedTeamIDs, setSelectedTeamIDs] = useState(competition?.data?.teamSeedOrder || []);
    const [format, setFormat] = useState<any>(normalizeTeamTieFormat(competition?.data?.teamTieFormat));
    const [activeManagerTab, setActiveManagerTab] = useState(
        (competition?.data?.teamSeedOrder || []).length >= 2 ? "overview" : "settings"
    );
    const [showEntrantEditor, setShowEntrantEditor] = useState(
        (competition?.data?.teamSeedOrder || []).length < 2
    );
    const [showFormatEditor, setShowFormatEditor] = useState(false);
    const [loadingAction, setLoadingAction] = useState("");
    const [teamMatches, setTeamMatches] = useState<any>({});
    const [expandedContest, setExpandedContest] = useState("");
    const [selectedContestKeys, setSelectedContestKeys] = useState<string[]>([]);
    const [presets, setPresets] = useState<any[]>([]);
    const [defaultPresetID, setDefaultPresetID] = useState("");
    const [selectedPresetID, setSelectedPresetID] = useState(competition?.data?.teamTieFormatPresetID || "");
    const [presetName, setPresetName] = useState("");
    const [confirmDeletePreset, setConfirmDeletePreset] = useState(false);
    const schedulingTeamTieIDsRef = useRef(new Set());

    const contests = useMemo(() => getTeamCompetitionContests(competition), [competition]);
    const pendingContests = useMemo(() => contests.filter((contest) => !contest.match.teamMatchID), [contests]);
    const createdContestCount = contests.length - pendingContests.length;
    const contestSnapshots = useMemo(() => {
        return contests.map((contest) => ({
            contest,
            snapshot: getContestSnapshot(contest, teamMatches),
        }));
    }, [contests, teamMatches]);
    const completedContestCount = contestSnapshots.filter(({ snapshot }) => snapshot.isComplete).length;
    const activeContestCount = contestSnapshots.filter(({ snapshot }) => snapshot.status === "In progress").length;
    const waitingLineupCount = contestSnapshots.filter(({ snapshot }) => snapshot.status === "Waiting for lineups").length;
    const setupLocked = contests.length > 0;
    const formatInUse = createdContestCount > 0;
    const normalizedFormat = normalizeTeamTieFormat(format);
    const teamsByID: any = useMemo(() => {
        return teams.reduce((teamMap: any, [myTeamID, team]: any) => {
            if (team?.id) {
                teamMap[team.id] = {
                    ...team,
                    myTeamID,
                };
            }
            return teamMap;
        }, {});
    }, [teams]);
    const selectedTeams = selectedTeamIDs.map((teamID) => teamsByID[teamID]).filter(Boolean);
    const operationalContests = useMemo(() => {
        const statusOrder = {
            "In progress": 0,
            "Ready": 1,
            "Scheduled": 2,
            "Waiting for lineups": 3,
            "Not created": 4,
            "Complete": 5,
        };
        return [...contestSnapshots].sort((firstContest, secondContest) => {
            return (statusOrder[firstContest.snapshot.status] ?? 9) - (statusOrder[secondContest.snapshot.status] ?? 9);
        });
    }, [contestSnapshots]);
    const teamStandings = useMemo(() => {
        return selectedTeamIDs
            .map((teamID, seedIndex) => {
                const team = teamsByID[teamID];
                const completedTeamContests = contestSnapshots.filter(({ contest, snapshot }) => {
                    return snapshot.isComplete && (contest.teamAID === teamID || contest.teamBID === teamID);
                });
                const totals = completedTeamContests.reduce((record, { contest, snapshot }) => {
                    const isTeamA = contest.teamAID === teamID;
                    const teamScore = isTeamA ? snapshot.scoreA : snapshot.scoreB;
                    const opponentScore = isTeamA ? snapshot.scoreB : snapshot.scoreA;
                    record.pointsFor += teamScore;
                    record.pointsAgainst += opponentScore;
                    if (teamScore > opponentScore) {
                        record.wins += 1;
                    }
                    else if (teamScore < opponentScore) {
                        record.losses += 1;
                    }
                    return record;
                }, { losses: 0, pointsAgainst: 0, pointsFor: 0, wins: 0 });

                return {
                    ...totals,
                    id: teamID,
                    name: team?.name || "Unknown team",
                    seedIndex,
                };
            })
            .sort((firstTeam, secondTeam) => {
                return secondTeam.wins - firstTeam.wins ||
                    firstTeam.losses - secondTeam.losses ||
                    (secondTeam.pointsFor - secondTeam.pointsAgainst) - (firstTeam.pointsFor - firstTeam.pointsAgainst) ||
                    firstTeam.seedIndex - secondTeam.seedIndex;
            });
    }, [contestSnapshots, selectedTeamIDs, teamsByID]);

    useEffect(() => {
        Promise.all([
            getMyTeams(getUserPath()),
            getMyTables(),
            getTeamTieFormatPresets(),
        ]).then(([nextTeams, nextTables, presetData]) => {
            setTeams(nextTeams);
            setTables(nextTables);
            setPresets(presetData.presets);
            setDefaultPresetID(presetData.defaultID);
        });
    }, []);

    useEffect(() => {
        setFormat(normalizeTeamTieFormat(competition?.data?.teamTieFormat));
        setSelectedTeamIDs(competition?.data?.teamSeedOrder || []);
        setSelectedPresetID(competition?.data?.teamTieFormatPresetID || "");
    }, [competition?.data?.teamSeedOrder, competition?.data?.teamTieFormat, competition?.data?.teamTieFormatPresetID]);

    useEffect(() => {
        const selectedPreset = presets.find((preset) => preset.id === selectedPresetID);
        if (selectedPreset) {
            setPresetName(selectedPreset.name || "");
        }
    }, [presets, selectedPresetID]);

    useEffect(() => {
        const pendingContestKeys = new Set(pendingContests.map((contest) => contest.key));
        setSelectedContestKeys((currentKeys) => currentKeys.filter((key) => pendingContestKeys.has(key)));
    }, [pendingContests.map((contest) => contest.key).join("|")]);

    useEffect(() => {
        const subscriptions = contests
            .map((contest) => contest.match.teamMatchID)
            .filter(Boolean)
            .map((teamMatchID) => {
                const teamMatchRef = db.ref(`teamMatches/${teamMatchID}`);
                const handleValue = async (snapshot) => {
                    const teamMatch = snapshot.val() || {};
                    setTeamMatches((currentMatches) => ({ ...currentMatches, [teamMatchID]: teamMatch }));
                    try {
                        const migrated = await migrateLegacyTeamTieSelections(teamMatchID, teamMatch);
                        if (migrated) {
                            return;
                        }
                    }
                    catch (error) {
                        console.error("[TeamTournamentManager] failed to migrate private team selections", error);
                    }
                    const submissionStatus = getTeamTieSubmissionStatus(teamMatch);
                    if (
                        submissionStatus.ready &&
                        teamMatch.teamTieStatus === "ready" &&
                        !schedulingTeamTieIDsRef.current.has(teamMatchID)
                    ) {
                        schedulingTeamTieIDsRef.current.add(teamMatchID);
                        scheduleReadyTeamTieMatches(teamMatchID)
                            .catch((error) => {
                                console.error("[TeamTournamentManager] failed to reveal and schedule team tie", error);
                                onStatus(error?.message || "The submitted lineups could not be scheduled.", "error");
                            })
                            .finally(() => {
                                schedulingTeamTieIDsRef.current.delete(teamMatchID);
                            });
                    }
                    syncCompetitionFromTeamMatch(teamMatchID).catch((error) => {
                        console.error("[TeamTournamentManager] failed to sync team tie", error);
                        onStatus(error?.message || "The team tie score could not be synced to the competition.", "error");
                    });
                };
                teamMatchRef.on("value", handleValue);
                return () => teamMatchRef.off("value", handleValue);
            });

        return () => subscriptions.forEach((unsubscribe) => unsubscribe());
    }, [contests.map((contest) => contest.match.teamMatchID).join("|")]);

    async function runAction(key, action) {
        setLoadingAction(key);
        try {
            await action();
        }
        catch (error) {
            console.error("[TeamTournamentManager] action failed", error);
            onStatus(error?.message || "The team tournament change could not be saved.", "error");
        }
        finally {
            setLoadingAction("");
        }
    }

    function toggleTeam(teamID) {
        setSelectedTeamIDs((currentIDs) => {
            return currentIDs.includes(teamID) ?
                currentIDs.filter((currentID) => currentID !== teamID)
                : [...currentIDs, teamID];
        });
    }

    async function applyTeamSeeding() {
        if (selectedTeamIDs.length < 2) {
            onStatus("Select at least two teams before applying the team seeding.", "error");
            return;
        }

        await runAction("seeding", async () => {
            const selectedTeams = selectedTeamIDs.map((teamID) => teamsByID[teamID]).filter(Boolean);
            const updates = buildTeamCompetitionSeeding(competition, selectedTeams);
            await updateCompetition(competition.id, updates);
            setShowEntrantEditor(false);
            setActiveManagerTab("overview");
            onStatus("Teams were seeded and the team contests were generated.", "success");
        });
    }

    function getValidatedFormat() {
        const codeValidation = validateTeamTiePositionCodes(format);
        if (!codeValidation.isValid) {
            const invalidDetails = [
                codeValidation.invalidTeamACodes.length > 0 ? `Team A: ${codeValidation.invalidTeamACodes.join(", ")}` : "",
                codeValidation.invalidTeamBCodes.length > 0 ? `Team B: ${codeValidation.invalidTeamBCodes.join(", ")}` : "",
            ].filter(Boolean).join(". ");
            throw new Error(`Use only position codes shown in the legend. ${invalidDetails}`);
        }

        const normalizedFormat = normalizeTeamTieFormat(format);
        const positions = getTeamTiePositionCodes(normalizedFormat);
        if (positions.sideA.length < 2 || positions.sideB.length < 2) {
            throw new Error("A team tie format needs at least two lineup positions for each team.");
        }
        if (positions.sideA.length > 10 || positions.sideB.length > 10) {
            throw new Error("A team tie format can use up to ten lineup positions for each team.");
        }
        if (positions.sideA.some((code) => positions.sideB.includes(code))) {
            throw new Error("Team A and Team B must use different lineup position codes.");
        }

        return normalizedFormat;
    }

    async function saveFormat() {
        await runAction("format", async () => {
            const normalizedFormat = getValidatedFormat();
            await updateCompetition(competition.id, {
                data: {
                    ...(competition.data || {}),
                    teamTieFormat: normalizedFormat,
                    teamTieFormatPresetID: selectedPresetID || "",
                },
                participantType: "team",
            });
            setFormat(normalizedFormat);
            setShowFormatEditor(false);
            onStatus("The team tie format was saved to this competition.", "success");
        });
    }

    async function reloadPresets(preferredPresetID = "") {
        const presetData = await getTeamTieFormatPresets();
        setPresets(presetData.presets);
        setDefaultPresetID(presetData.defaultID);
        if (preferredPresetID) {
            setSelectedPresetID(preferredPresetID);
        }
    }

    async function selectPreset(presetID) {
        setSelectedPresetID(presetID);
        setConfirmDeletePreset(false);
        const preset = presets.find((nextPreset) => nextPreset.id === presetID);
        if (preset) {
            const nextFormat = normalizeTeamTieFormat(preset.format);
            setPresetName(preset.name || "");
            setFormat(nextFormat);
            await runAction("preset-apply", async () => {
                await updateCompetition(competition.id, {
                    data: {
                        ...(competition.data || {}),
                        teamTieFormat: nextFormat,
                        teamTieFormatPresetID: preset.id,
                    },
                });
                onStatus(`Applied the ${preset.name} tie format to this competition.`, "success");
            });
        }
    }

    async function savePreset() {
        await runAction("preset", async () => {
            const normalizedFormat = getValidatedFormat();
            const savedPreset = await saveTeamTieFormatPreset({
                format: normalizedFormat,
                name: presetName,
                presetID: selectedPresetID,
            });
            await reloadPresets(savedPreset.id);
            setPresetName(savedPreset.name);
            onStatus(selectedPresetID ? "The team tie preset was updated." : "The team tie preset was saved.", "success");
        });
    }

    async function makePresetDefault() {
        if (!selectedPresetID) {
            onStatus("Save or select a preset before making it the default.", "error");
            return;
        }

        await runAction("preset-default", async () => {
            await setDefaultTeamTieFormatPreset(selectedPresetID);
            await reloadPresets(selectedPresetID);
            onStatus("New team competitions will use this tie format by default.", "success");
        });
    }

    async function deletePreset() {
        if (!selectedPresetID) {
            return;
        }

        if (!confirmDeletePreset) {
            setConfirmDeletePreset(true);
            return;
        }

        await runAction("preset-delete", async () => {
            await deleteTeamTieFormatPreset(selectedPresetID);
            setSelectedPresetID("");
            setPresetName("");
            setConfirmDeletePreset(false);
            await reloadPresets();
            onStatus("The saved team tie preset was deleted.", "success");
        });
    }

    async function updateBracketFromStandings() {
        await runAction("standings", async () => {
            const brackets = buildTeamBracketFromStandings(competition);
            await updateCompetition(competition.id, {
                data: {
                    ...(competition.data || {}),
                    brackets,
                },
            });
            onStatus("The bracket was updated from the current group standings.", "success");
        });
    }

    function toggleContestSelection(contestKey, isSelected) {
        setSelectedContestKeys((currentKeys) => {
            if (isSelected) {
                return currentKeys.includes(contestKey) ? currentKeys : [...currentKeys, contestKey];
            }
            return currentKeys.filter((key) => key !== contestKey);
        });
    }

    async function createSelectedTeamTies() {
        const selectedContests = pendingContests.filter((contest) => selectedContestKeys.includes(contest.key));
        if (selectedContests.length === 0) {
            onStatus("Select at least one pending team contest.", "error");
            return;
        }

        await runAction("bulk-contests", async () => {
            await Promise.all(selectedContests.map((contest) => createCompetitionTeamTie(competition, contest)));
            setSelectedContestKeys([]);
            onStatus(
                `Created ${selectedContests.length} team tie${selectedContests.length === 1 ? "" : "s"}.`,
                "success"
            );
        });
    }

    function updateRule(index, nextRule) {
        setFormat((currentFormat) => ({
            ...currentFormat,
            rules: currentFormat.rules.map((rule, ruleIndex) => ruleIndex === index ? nextRule : rule),
        }));
    }

    function removeRule(index) {
        setFormat((currentFormat) => ({
            ...currentFormat,
            rules: currentFormat.rules.filter((_, ruleIndex) => ruleIndex !== index),
        }));
    }

    function addRule() {
        setFormat((currentFormat) => ({
            ...currentFormat,
            rules: [
                ...currentFormat.rules,
                {
                    bestOf: 5,
                    checkpoint: 2,
                    id: `match-${Date.now()}`,
                    label: `Match ${currentFormat.rules.length + 1}`,
                    matchType: "singles",
                    sideAOptions: [["A"]],
                    sideBOptions: [["X"]],
                },
            ],
        }));
    }

    return (
        <>
            <View marginBottom={4}>
                <View flexDirection={"row"} flexWrap={"wrap"} marginBottom={2} style={{ gap: 8 }}>
                    <ManagerTab
                        active={activeManagerTab === "overview"}
                        icon={"view-dashboard-outline"}
                        label={"Overview"}
                        onPress={() => setActiveManagerTab("overview")}
                    />
                    <ManagerTab
                        active={activeManagerTab === "teams"}
                        icon={"account-group-outline"}
                        label={"Teams"}
                        onPress={() => setActiveManagerTab("teams")}
                    />
                    <ManagerTab
                        active={activeManagerTab === "contests"}
                        icon={"tournament"}
                        label={"Contests"}
                        onPress={() => setActiveManagerTab("contests")}
                    />
                    <ManagerTab
                        active={activeManagerTab === "settings"}
                        icon={"cog-outline"}
                        label={"Settings"}
                        onPress={() => setActiveManagerTab("settings")}
                    />
                </View>
            </View>

            {activeManagerTab === "overview" ? (
                <>
                    <View marginBottom={4}>
                        <Text color={"gray.900"} fontSize={"xl"} fontWeight={"bold"}>Competition overview</Text>
                        <Text color={"gray.600"} fontSize={"sm"} marginTop={1}>
                            Current team records, lineup readiness, and live team ties.
                        </Text>
                    </View>
                    <View flexDirection={"row"} flexWrap={"wrap"} marginBottom={2}>
                        <SummaryMetric label={"Teams"} value={selectedTeamIDs.length} />
                        <SummaryMetric label={"Team ties"} value={contests.length} />
                        <SummaryMetric color={activeContestCount > 0 ? "blue.700" : "gray.900"} label={"In progress"} value={activeContestCount} />
                        <SummaryMetric color={"green.700"} label={"Complete"} value={completedContestCount} />
                    </View>

                    {teamStandings.length > 0 ? (
                        <View marginBottom={4}>
                            <View alignItems={"center"} flexDirection={"row"} marginBottom={2}>
                                <Text color={"gray.900"} flex={1} fontSize={"lg"} fontWeight={"bold"}>Team records</Text>
                                <Button onPress={() => setActiveManagerTab("teams")} size={"sm"} variant={"ghost"}>
                                    <Text color={openScoreboardColor} fontWeight={"bold"}>Manage teams</Text>
                                </Button>
                            </View>
                            <View borderColor={"gray.200"} borderRadius={8} borderWidth={1} overflow={"hidden"}>
                                {teamStandings.map((team, index) => (
                                    <Pressable
                                        key={team.id}
                                        onPress={() => setActiveManagerTab("teams")}
                                        style={({ pressed }) => ({
                                            backgroundColor: pressed ? "#F8FAFC" : index % 2 === 0 ? "#FFFFFF" : "#F9FAFB",
                                            opacity: pressed ? 0.84 : 1,
                                        })}
                                    >
                                        <View
                                            alignItems={"center"}
                                            borderTopColor={"gray.100"}
                                            borderTopWidth={index === 0 ? 0 : 1}
                                            flexDirection={"row"}
                                            paddingX={3}
                                            paddingY={3}
                                        >
                                            <Text color={"gray.500"} fontSize={"xs"} fontWeight={"bold"} width={"32px"}>{index + 1}</Text>
                                            <Text color={"gray.900"} flex={1} fontSize={"sm"} fontWeight={"bold"} numberOfLines={1}>{team.name}</Text>
                                            <Text color={"gray.700"} fontSize={"xs"} fontWeight={"bold"} marginLeft={3}>
                                                {team.wins}-{team.losses}
                                            </Text>
                                            <Text color={"gray.500"} fontSize={"2xs"} marginLeft={3}>
                                                {team.pointsFor}-{team.pointsAgainst}
                                            </Text>
                                        </View>
                                    </Pressable>
                                ))}
                            </View>
                        </View>
                    ) : null}

                    {waitingLineupCount > 0 || pendingContests.length > 0 ? (
                        <View
                            alignItems={"center"}
                            backgroundColor={"orange.50"}
                            borderColor={"orange.200"}
                            borderRadius={8}
                            borderWidth={1}
                            flexDirection={"row"}
                            marginBottom={4}
                            padding={3}
                        >
                            <MaterialCommunityIcons name="alert-circle-outline" size={21} color={"#C2410C"} />
                            <View flex={1} marginLeft={3}>
                                <Text color={"orange.900"} fontSize={"sm"} fontWeight={"bold"}>Needs attention</Text>
                                <Text color={"orange.800"} fontSize={"xs"} marginTop={1}>
                                    {waitingLineupCount > 0 ? `${waitingLineupCount} waiting for team lineups. ` : ""}
                                    {pendingContests.length > 0 ? `${pendingContests.length} team ties still need to be created.` : ""}
                                </Text>
                            </View>
                            <Button onPress={() => setActiveManagerTab("contests")} size={"sm"} variant={"outline"}>
                                <Text color={"orange.800"} fontWeight={"bold"}>Review</Text>
                            </Button>
                        </View>
                    ) : null}

                    <View marginBottom={4}>
                        <View alignItems={"center"} flexDirection={"row"} marginBottom={2}>
                            <Text color={"gray.900"} flex={1} fontSize={"lg"} fontWeight={"bold"}>Team ties</Text>
                            <Button onPress={() => setActiveManagerTab("contests")} size={"sm"} variant={"ghost"}>
                                <Text color={openScoreboardColor} fontWeight={"bold"}>View all</Text>
                            </Button>
                        </View>
                        {operationalContests.length === 0 ? (
                            <View borderColor={"gray.200"} borderRadius={8} borderWidth={1} padding={4}>
                                <Text color={"gray.600"} fontSize={"sm"}>
                                    Add and seed team entrants in Settings to generate the competition schedule.
                                </Text>
                            </View>
                        ) : operationalContests.slice(0, 6).map(({ contest, snapshot }) => (
                            <Pressable
                                key={contest.key}
                                onPress={() => {
                                    setExpandedContest(contest.key);
                                    setActiveManagerTab("contests");
                                }}
                                style={({ pressed }) => ({
                                    backgroundColor: pressed ? "#F8FAFC" : "#FFFFFF",
                                    borderColor: "#E5E7EB",
                                    borderRadius: 8,
                                    borderWidth: 1,
                                    marginBottom: 8,
                                    opacity: pressed ? 0.84 : 1,
                                    padding: 14,
                                })}
                            >
                                <View alignItems={"center"} flexDirection={"row"}>
                                    <View flex={1} paddingRight={3}>
                                        <Text color={"gray.500"} fontSize={"2xs"} fontWeight={"bold"} textTransform={"uppercase"}>{contest.roundLabel}</Text>
                                        <Text color={"gray.900"} fontSize={"sm"} fontWeight={"bold"} marginTop={1}>
                                            {contest.teamAName} <Text color={"gray.400"}>vs</Text> {contest.teamBName}
                                        </Text>
                                        <Text color={"gray.600"} fontSize={"xs"} marginTop={1}>{snapshot.scoreA} - {snapshot.scoreB}</Text>
                                    </View>
                                    <View alignItems={"flex-end"}>
                                        <Text
                                            color={snapshot.isComplete ? "green.700" : snapshot.status === "In progress" ? "blue.700" : "orange.700"}
                                            fontSize={"2xs"}
                                            fontWeight={"bold"}
                                        >
                                            {snapshot.status}
                                        </Text>
                                        <MaterialCommunityIcons name="chevron-right" size={21} color={"#4B5563"} />
                                    </View>
                                </View>
                            </Pressable>
                        ))}
                    </View>
                </>
            ) : null}

            {activeManagerTab === "teams" ? (
                <View>
                    <View marginBottom={4}>
                        <Text color={"gray.900"} fontSize={"xl"} fontWeight={"bold"}>Participating teams</Text>
                        <Text color={"gray.600"} fontSize={"sm"} marginTop={1}>
                            Open a team to review its record, assigned ties, and manager portal.
                        </Text>
                    </View>
                    {selectedTeams.length === 0 ? (
                        <View borderColor={"gray.200"} borderRadius={8} borderWidth={1} padding={4}>
                            <Text color={"gray.600"} fontSize={"sm"}>No teams have been seeded into this competition.</Text>
                            <Button alignSelf={"flex-start"} marginTop={3} onPress={() => setActiveManagerTab("settings")} variant={"outline"}>
                                <Text color={openScoreboardColor} fontWeight={"bold"}>Open settings</Text>
                            </Button>
                        </View>
                    ) : selectedTeams.map((team) => (
                        <TeamManagementCard
                            key={team.id}
                            competitionID={competition.id}
                            contests={contests.filter((contest) => contest.teamAID === team.id || contest.teamBID === team.id)}
                            navigation={navigation}
                            onManageContest={(contestKey) => {
                                setExpandedContest(contestKey);
                                setActiveManagerTab("contests");
                            }}
                            team={team}
                            teamMatches={teamMatches}
                        />
                    ))}
                </View>
            ) : null}

            {activeManagerTab === "settings" ? (
                <>

            <Panel
                defaultExpanded={!setupLocked}
                icon={"account-group-outline"}
                summary={`${selectedTeamIDs.length} selected of ${teams.length} available`}
                subtitle={setupLocked ? "Entrants are set for the active competition." : "Choose teams in seed order before generating the competition schedule."}
                title={"Team entrants"}
            >
                {selectedTeams.length > 0 ? (
                    <View flexDirection={"row"} flexWrap={"wrap"} marginBottom={3}>
                        {selectedTeams.map((team, index) => (
                            <View
                                key={team.id}
                                alignItems={"center"}
                                backgroundColor={"gray.50"}
                                borderColor={"gray.200"}
                                borderRadius={6}
                                borderWidth={1}
                                flexDirection={"row"}
                                marginBottom={2}
                                marginRight={2}
                                paddingX={3}
                                paddingY={2}
                            >
                                <Text color={"gray.500"} fontSize={"2xs"} fontWeight={"bold"} marginRight={2}>#{index + 1}</Text>
                                <Text color={"gray.900"} fontSize={"xs"} fontWeight={"bold"}>{team.name}</Text>
                            </View>
                        ))}
                    </View>
                ) : null}
                {setupLocked && !showEntrantEditor ? (
                    <View>
                        <View backgroundColor={"orange.50"} borderColor={"orange.200"} borderRadius={8} borderWidth={1} padding={3}>
                            <Text color={"orange.900"} fontSize={"sm"} fontWeight={"bold"}>Competition schedule already generated</Text>
                            <Text color={"orange.800"} fontSize={"xs"} marginTop={1}>
                                Changing entrants regenerates groups or the opening bracket and can invalidate existing team ties.
                            </Text>
                        </View>
                        <Button alignSelf={"flex-start"} marginTop={3} onPress={() => setShowEntrantEditor(true)} variant={"outline"}>
                            <Text color={"orange.800"} fontWeight={"bold"}>Change team entrants</Text>
                        </Button>
                    </View>
                ) : teams.length === 0 ? (
                    <Text color={"gray.600"} fontSize={"sm"}>Create teams and add roster players before seeding this competition.</Text>
                ) : (
                    <>
                        {setupLocked ? (
                            <View backgroundColor={"red.50"} borderColor={"red.200"} borderRadius={8} borderWidth={1} marginBottom={3} padding={3}>
                                <Text color={"red.800"} fontSize={"xs"} fontWeight={"bold"}>
                                    You are editing entrants after the schedule was generated. Applying this change can replace current matchups.
                                </Text>
                            </View>
                        ) : null}
                        <View flexDirection={"row"} flexWrap={"wrap"} justifyContent={"space-between"}>
                            {teams.map(([, team]) => {
                                const selectedIndex = selectedTeamIDs.indexOf(team.id);
                                return (
                                    <View key={team.id} width={{ base: "100%", md: "48.5%" }}>
                                        <TeamOption
                                            index={selectedIndex}
                                            isSelected={selectedIndex >= 0}
                                            onPress={() => toggleTeam(team.id)}
                                            team={team}
                                        />
                                    </View>
                                );
                            })}
                        </View>
                        <Button
                            alignSelf={"flex-start"}
                            backgroundColor={openScoreboardColor}
                            isDisabled={loadingAction === "seeding"}
                            marginTop={2}
                            onPress={applyTeamSeeding}
                        >
                            {loadingAction === "seeding" ? <Spinner color={openScoreboardButtonTextColor} /> : (
                                <Text color={openScoreboardButtonTextColor} fontWeight={"bold"}>Apply team seeding</Text>
                            )}
                        </Button>
                    </>
                )}
            </Panel>

            <Panel
                defaultExpanded={!formatInUse}
                icon={"format-list-checks"}
                summary={`${normalizedFormat.rules.length} contest matches - first to ${normalizedFormat.gamesToWin} - ${normalizedFormat.tableCount} table${normalizedFormat.tableCount === 1 ? "" : "s"}`}
                subtitle={formatInUse ? "This format is already being used by generated team ties." : "Set the match order and lineup rules before creating team ties."}
                title={"Team tie format"}
            >
                <TeamTieFormatSummary format={normalizedFormat} />
                {formatInUse && !showFormatEditor ? (
                    <View>
                        <View backgroundColor={"orange.50"} borderColor={"orange.200"} borderRadius={8} borderWidth={1} padding={3}>
                            <Text color={"orange.900"} fontSize={"sm"} fontWeight={"bold"}>Tie format is in use</Text>
                            <Text color={"orange.800"} fontSize={"xs"} marginTop={1}>
                                Existing team ties keep the format they were created with. Changes apply to future ties and may make the competition inconsistent.
                            </Text>
                        </View>
                        <Button alignSelf={"flex-start"} marginTop={3} onPress={() => setShowFormatEditor(true)} variant={"outline"}>
                            <Text color={"orange.800"} fontWeight={"bold"}>Edit tie format</Text>
                        </Button>
                    </View>
                ) : (
                    <>
                {formatInUse ? (
                    <View backgroundColor={"red.50"} borderColor={"red.200"} borderRadius={8} borderWidth={1} marginBottom={3} padding={3}>
                        <Text color={"red.800"} fontSize={"xs"} fontWeight={"bold"}>
                            Existing ties will not be rewritten. Confirm that new and existing ties may use different formats before saving.
                        </Text>
                    </View>
                ) : null}
                <View backgroundColor={"gray.50"} borderColor={"gray.200"} borderRadius={8} borderWidth={1} marginBottom={3} padding={3}>
                    <View alignItems={"center"} flexDirection={"row"}>
                        <MaterialCommunityIcons name="content-save-outline" size={19} color={openScoreboardColor} />
                        <View flex={1} marginLeft={2}>
                            <Text color={"gray.900"} fontSize={"sm"} fontWeight={"bold"}>Saved tie format presets</Text>
                            <Text color={"gray.600"} fontSize={"xs"}>
                                Reuse league formats across competitions and choose the default for new team tournaments.
                            </Text>
                        </View>
                    </View>
                    <View flexDirection={"row"} flexWrap={"wrap"} marginTop={3}>
                        <FormControl marginBottom={2} paddingRight={2} width={{ base: "100%", md: "50%" }}>
                            <FormControl.Label>Saved preset</FormControl.Label>
                            <Select
                                placeholder={"Choose a preset"}
                                selectedValue={selectedPresetID}
                                onValueChange={selectPreset}
                            >
                                {presets.map((preset) => (
                                    <Select.Item
                                        key={preset.id}
                                        label={`${preset.name}${preset.id === defaultPresetID ? " - Default" : ""}`}
                                        value={preset.id}
                                    />
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl marginBottom={2} width={{ base: "100%", md: "50%" }}>
                            <FormControl.Label>Preset name</FormControl.Label>
                            <Input
                                onChangeText={setPresetName}
                                placeholder={"League five-match format"}
                                value={presetName}
                            />
                        </FormControl>
                    </View>
                    <View flexDirection={"row"} flexWrap={"wrap"}>
                        <Button
                            backgroundColor={openScoreboardColor}
                            isDisabled={loadingAction === "preset"}
                            marginBottom={2}
                            marginRight={2}
                            onPress={savePreset}
                            size={"sm"}
                        >
                            {loadingAction === "preset" ? <Spinner color={openScoreboardButtonTextColor} size={"sm"} /> : (
                                <Text color={openScoreboardButtonTextColor} fontWeight={"bold"}>
                                    {selectedPresetID ? "Update preset" : "Save new preset"}
                                </Text>
                            )}
                        </Button>
                        <Button
                            marginBottom={2}
                            marginRight={2}
                            onPress={() => {
                                setSelectedPresetID("");
                                setPresetName("");
                                setConfirmDeletePreset(false);
                            }}
                            size={"sm"}
                            variant={"outline"}
                        >
                            <Text color={openScoreboardColor} fontWeight={"bold"}>New preset</Text>
                        </Button>
                        <Button
                            isDisabled={!selectedPresetID || loadingAction === "preset-default"}
                            marginBottom={2}
                            marginRight={2}
                            onPress={makePresetDefault}
                            size={"sm"}
                            variant={"outline"}
                        >
                            <Text color={openScoreboardColor} fontWeight={"bold"}>
                                {selectedPresetID === defaultPresetID ? "Default preset" : "Make default"}
                            </Text>
                        </Button>
                        {selectedPresetID ? (
                            <Button marginBottom={2} onPress={deletePreset} size={"sm"} variant={"ghost"}>
                                <Text color={"red.700"} fontWeight={"bold"}>
                                    {confirmDeletePreset ? "Confirm delete" : "Delete preset"}
                                </Text>
                            </Button>
                        ) : null}
                    </View>
                </View>
                <TeamTiePositionLegend />
                <View flexDirection={"row"} flexWrap={"wrap"}>
                    <FormControl marginBottom={2} paddingRight={2} width={{ base: "50%", md: "25%" }}>
                        <FormControl.Label>Points to win tie</FormControl.Label>
                        <Select selectedValue={`${format.gamesToWin}`} onValueChange={(gamesToWin) => setFormat({ ...format, gamesToWin: Number(gamesToWin) })}>
                            {Array.from({ length: Math.max(1, format.rules.length) }).map((_, index) => (
                                <Select.Item key={index + 1} label={`${index + 1}`} value={`${index + 1}`} />
                            ))}
                        </Select>
                    </FormControl>
                    <FormControl marginBottom={2} width={{ base: "50%", md: "25%" }}>
                        <FormControl.Label>Team tie tables</FormControl.Label>
                        <Select selectedValue={`${format.tableCount}`} onValueChange={(tableCount) => setFormat({ ...format, tableCount: Number(tableCount) })}>
                            <Select.Item label="1 table" value="1" />
                            <Select.Item label="2 tables" value="2" />
                        </Select>
                    </FormControl>
                </View>
                {format.rules.map((rule, index) => (
                    <RuleEditor
                        key={rule.id}
                        index={index}
                        onChange={(nextRule) => updateRule(index, nextRule)}
                        onRemove={() => removeRule(index)}
                        rule={rule}
                        showRemove={format.rules.length > 1}
                    />
                ))}
                <View flexDirection={"row"} flexWrap={"wrap"} marginTop={3}>
                    <Button marginBottom={2} marginRight={2} onPress={addRule} variant={"outline"}>
                        <Text color={openScoreboardColor} fontWeight={"bold"}>Add contest match</Text>
                    </Button>
                    <Button backgroundColor={openScoreboardColor} isDisabled={loadingAction === "format"} marginBottom={2} onPress={saveFormat}>
                        {loadingAction === "format" ? <Spinner color={openScoreboardButtonTextColor} /> : (
                            <Text color={openScoreboardButtonTextColor} fontWeight={"bold"}>Save tie format</Text>
                        )}
                    </Button>
                </View>
                    </>
                )}
            </Panel>

                </>
            ) : null}

            {activeManagerTab === "contests" ? (
            <Panel
                defaultExpanded
                icon={"tournament"}
                summary={`${contests.length} total - ${createdContestCount} created - ${pendingContests.length} pending - ${completedContestCount} complete`}
                subtitle={"Manage the competition-owned team ties, lineups, scores, and table assignments."}
                title={"Team contests"}
            >
                {competition.type === "roundRobinThenSingleElimination" ? (
                    <View backgroundColor={"blue.50"} borderColor={"blue.100"} borderRadius={8} borderWidth={1} marginBottom={3} padding={3}>
                        <Text color={"blue.900"} fontSize={"sm"} fontWeight={"bold"}>Bracket advancement</Text>
                        <Text color={"blue.800"} fontSize={"xs"} marginTop={1}>
                            Seed the elimination bracket from the current group standings before creating the next team ties.
                        </Text>
                        <Button
                            alignSelf={"flex-start"}
                            backgroundColor={openScoreboardColor}
                            isDisabled={loadingAction === "standings"}
                            marginTop={3}
                            onPress={updateBracketFromStandings}
                            size={"sm"}
                        >
                            {loadingAction === "standings" ? <Spinner color={openScoreboardButtonTextColor} /> : (
                                <Text color={openScoreboardButtonTextColor} fontWeight={"bold"}>Update bracket from standings</Text>
                            )}
                        </Button>
                    </View>
                ) : null}
                {pendingContests.length > 0 ? (
                    <View
                        alignItems={"center"}
                        backgroundColor={"gray.50"}
                        borderColor={"gray.200"}
                        borderRadius={8}
                        borderWidth={1}
                        flexDirection={"row"}
                        flexWrap={"wrap"}
                        marginBottom={3}
                        padding={3}
                    >
                        <View flex={1} minWidth={180} paddingRight={3}>
                            <Text color={"gray.900"} fontSize={"sm"} fontWeight={"bold"}>
                                {selectedContestKeys.length} of {pendingContests.length} pending selected
                            </Text>
                            <Text color={"gray.600"} fontSize={"2xs"} marginTop={1}>
                                Select the team contests that should be generated now.
                            </Text>
                        </View>
                        <View alignItems={"center"} flexDirection={"row"} flexWrap={"wrap"} marginTop={1}>
                            <Button
                                marginBottom={1}
                                marginRight={2}
                                onPress={() => {
                                    const allPendingKeys = pendingContests.map((contest) => contest.key);
                                    setSelectedContestKeys(
                                        selectedContestKeys.length === allPendingKeys.length ? [] : allPendingKeys
                                    );
                                }}
                                size={"sm"}
                                variant={"outline"}
                            >
                                <Text color={openScoreboardColor} fontWeight={"bold"}>
                                    {selectedContestKeys.length === pendingContests.length ? "Clear selection" : "Select all pending"}
                                </Text>
                            </Button>
                            <Button
                                backgroundColor={openScoreboardColor}
                                isDisabled={selectedContestKeys.length === 0 || loadingAction === "bulk-contests"}
                                marginBottom={1}
                                onPress={createSelectedTeamTies}
                                size={"sm"}
                            >
                                {loadingAction === "bulk-contests" ? (
                                    <Spinner color={openScoreboardButtonTextColor} size={"sm"} />
                                ) : (
                                    <Text color={openScoreboardButtonTextColor} fontWeight={"bold"}>
                                        Create selected ties
                                    </Text>
                                )}
                            </Button>
                        </View>
                    </View>
                ) : null}
                {contests.length === 0 ? (
                    <Text color={"gray.600"} fontSize={"sm"}>
                        Apply team seeding first. Bracket rounds appear here as teams advance, and group ties appear immediately after seeding.
                    </Text>
                ) : contests.map((contest) => (
                    <TeamTieCard
                        key={contest.key}
                        competition={competition}
                        contest={contest}
                        expanded={expandedContest === contest.key}
                        loading={loadingAction === contest.key}
                        navigation={navigation}
                        onAction={runAction}
                        onSelect={(isSelected) => toggleContestSelection(contest.key, isSelected)}
                        onStatus={onStatus}
                        onToggle={() => setExpandedContest(expandedContest === contest.key ? "" : contest.key)}
                        selected={selectedContestKeys.includes(contest.key)}
                        teamMatch={teamMatches[contest.match.teamMatchID]}
                        tables={tables}
                        teamsByID={teamsByID}
                    />
                ))}
            </Panel>
            ) : null}
        </>
    );
}
