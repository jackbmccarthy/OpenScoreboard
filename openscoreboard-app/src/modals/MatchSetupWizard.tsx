import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView } from 'react-native';
import { Button, Input, Text, View, Modal, Divider, Spinner } from 'native-base';
import { openScoreboardButtonTextColor, openScoreboardColor } from "../../openscoreboardtheme";
import { clearPlayer, getCurrentGameNumber, getCurrentGameScore, resetDoublesServicePlayerFields, setBestOf, setInitialMatchServer, setInitialReceiverPlayerField, setInitialServerPlayerField, setIsDoubles, setRoundName, start2MinuteWarmUp, startGame, stop2MinuteWarmUp, updateCurrentPlayer, updateScheduledMatch, updateService } from '../functions/scoring';
import { getCombinedPlayerNames, getImportPlayerList, getPlayerFormatted, sortPlayers } from '../functions/players';
import CountDownTimerText from '../components/CountDownTimerText';
import { getPlayerListIDForTable, getScheduledTableMatches } from '../functions/tables';
import JerseyColorOptions from '../components/JerseyColorOptions';
import { getImportTeamMembersList, getTeamJerseyColorForMatchPlayer } from '../functions/teammatches';
import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ScoringGradientButton } from '../components/ScoringGradientButton';
import { getScheduledTeamMatchMatches, setScheduledMatchToCurrentForSource } from '../functions/scheduling';
import { getTeamMatch } from '../functions/teammatches';
import { getTeamTieSubmissionStatus } from '../functions/teamCompetitions';
import db from '../../database';

import i18n from '../translations/translate';

const bestOfOptions = [1, 3, 5, 7, 9];
const maxVisibleScheduledMatches = 3;
const maxVisibleRoundOptions = 12;
const maxVisibleModalPlayers = 16;

const roundStageOptions = [
    { value: "", label: "None", keywords: ["clear", "no round", "unset"] },
    { value: "F", label: "Final", keywords: ["championship", "title"] },
    { value: "GF", label: "Grand Final", keywords: ["grand championship"] },
    { value: "CF", label: "Championship Final", keywords: ["championship match"] },
    { value: "3P", label: "Third-place Match", keywords: ["third place", "bronze", "consolation final"] },
    { value: "BR", label: "Bronze Medal Match", keywords: ["bronze", "third place"] },
    { value: "SF", label: "Semi-final", keywords: ["semifinal", "semi final", "round of 4", "r4"] },
    { value: "QF", label: "Quarter-final", keywords: ["quarterfinal", "quarter final", "round of 8", "r8"] },
    { value: "PQF", label: "Pre-quarter Final", keywords: ["pre quarter", "round before quarter"] },
    { value: "R256", label: "Round of 256", keywords: ["round 256"] },
    { value: "R128", label: "Round of 128", keywords: ["round 128"] },
    { value: "R64", label: "Round of 64", keywords: ["round 64"] },
    { value: "R32", label: "Round of 32", keywords: ["round 32"] },
    { value: "R16", label: "Round of 16", keywords: ["round 16", "sweet sixteen"] },
    { value: "R8", label: "Round of 8", keywords: ["quarter final", "quarterfinal"] },
    { value: "R4", label: "Round of 4", keywords: ["semi final", "semifinal"] },
    { value: "R2", label: "Round of 2", keywords: ["final"] },
    { value: "RD1", label: "Round 1", keywords: ["first round"] },
    { value: "RD2", label: "Round 2", keywords: ["second round"] },
    { value: "RD3", label: "Round 3", keywords: ["third round"] },
    { value: "RD4", label: "Round 4", keywords: ["fourth round"] },
    { value: "RD5", label: "Round 5", keywords: ["fifth round"] },
    { value: "RR", label: "Round Robin", keywords: ["round-robin", "league stage"] },
    { value: "GS", label: "Group Stage", keywords: ["groups"] },
    { value: "G1", label: "Group Stage 1", keywords: ["group round one"] },
    { value: "G2", label: "Group Stage 2", keywords: ["group round two"] },
    { value: "GA", label: "Group A", keywords: ["group stage a"] },
    { value: "GB", label: "Group B", keywords: ["group stage b"] },
    { value: "GC", label: "Group C", keywords: ["group stage c"] },
    { value: "GD", label: "Group D", keywords: ["group stage d"] },
    { value: "PS", label: "Pool Stage", keywords: ["pools"] },
    { value: "PA", label: "Pool A", keywords: ["pool stage a"] },
    { value: "PB", label: "Pool B", keywords: ["pool stage b"] },
    { value: "PC", label: "Pool C", keywords: ["pool stage c"] },
    { value: "PD", label: "Pool D", keywords: ["pool stage d"] },
    { value: "QUAL", label: "Qualification", keywords: ["qualifier", "qualifying"] },
    { value: "QR1", label: "Qualifying Round 1", keywords: ["qualification round one"] },
    { value: "QR2", label: "Qualifying Round 2", keywords: ["qualification round two"] },
    { value: "QR3", label: "Qualifying Round 3", keywords: ["qualification round three"] },
    { value: "PRE", label: "Preliminary Round", keywords: ["prelim", "preliminary"] },
    { value: "PI", label: "Play-in", keywords: ["play in"] },
    { value: "PO", label: "Playoff", keywords: ["playoffs"] },
    { value: "WB", label: "Winners Bracket", keywords: ["winner bracket", "upper bracket"] },
    { value: "LB", label: "Losers Bracket", keywords: ["lower bracket", "elimination bracket"] },
    { value: "ELIM", label: "Elimination Round", keywords: ["knockout", "single elimination"] },
    { value: "CONS", label: "Consolation Round", keywords: ["consolation bracket"] },
    { value: "PLACE", label: "Placement Round", keywords: ["placing", "classification"] },
    { value: "CLASS", label: "Classification Round", keywords: ["placement"] },
    { value: "XOVER", label: "Crossover Match", keywords: ["cross over"] },
    { value: "SEED", label: "Seeding Round", keywords: ["seed"] },
    { value: "EXH", label: "Exhibition", keywords: ["friendly", "scrimmage"] },
];

function getRoundOptionSearchText(option) {
    return `${option.value} ${option.label} ${(option.keywords || []).join(" ")}`.toLowerCase();
}

function getRoundOptionForValue(value) {
    if (!value) {
        return roundStageOptions[0];
    }

    const normalizedValue = `${value}`.trim().toLowerCase();
    return roundStageOptions.find((option) => {
        const normalizedOptionValue = option.value.toLowerCase();
        const normalizedOptionLabel = option.label.toLowerCase();
        return normalizedOptionValue === normalizedValue ||
            normalizedOptionLabel === normalizedValue ||
            (option.keywords || []).some((keyword) => keyword.toLowerCase() === normalizedValue);
    });
}

function getRoundOptionDisplay(option) {
    if (!option) {
        return "";
    }
    return option.value ? `${option.value} - ${option.label}` : option.label;
}

function clonePlayer(player) {
    return player ? JSON.parse(JSON.stringify(player)) : {};
}

function normalizePlayerForMatch(player, isImported) {
    return {
        ...clonePlayer(player),
        firstName: player?.firstName || "",
        isImported,
        jerseyColor: player?.jerseyColor || "",
        lastName: player?.lastName || "",
    };
}

function formatScheduledMatchTime(startTime) {
    if (!startTime) {
        return "No start time";
    }

    const startDate = new Date(startTime);
    if (Number.isNaN(startDate.getTime())) {
        return "No start time";
    }

    return startDate.toLocaleString(undefined, {
        month: "numeric",
        day: "numeric",
        year: "2-digit",
        hour: "numeric",
        minute: "2-digit",
    });
}

function getScheduledMatchContextLabel(match: any = {}) {
    const isCompetitionMatch = !!match.competitionID || !!match.competitionSlotID || !!match.competitionType;
    if (!isCompetitionMatch) {
        return "";
    }

    const eventName = `${match.eventName || ""}`.trim();
    const matchRound = `${match.matchRound || ""}`.trim();
    const contextParts = [];

    if (eventName.length > 0) {
        contextParts.push(eventName);
    }
    if (matchRound.length > 0 && matchRound.toLowerCase() !== eventName.toLowerCase()) {
        contextParts.push(matchRound);
    }

    return contextParts.join(" · ");
}

function getScheduledMatchSecondaryText(match: any = {}, isWaitingForLineup = false) {
    const contextLabel = getScheduledMatchContextLabel(match);
    if (contextLabel.length > 0) {
        return isWaitingForLineup ? `${contextLabel} · Waiting for lineups` : contextLabel;
    }

    return isWaitingForLineup ? "Waiting for team lineup selections" : formatScheduledMatchTime(match.startTime);
}

function WizardProgress({ pageNumber, totalSteps }) {
    const safePageNumber = Math.min(pageNumber, totalSteps);

    return (
        <View marginBottom={3}>
            <View flexDirection={"row"} justifyContent={"space-between"} marginBottom={1}>
                <Text color={"gray.500"} fontSize={"xs"} fontWeight={"bold"} textTransform={"uppercase"}>
                    Step {safePageNumber} of {totalSteps}
                </Text>
                <Text color={"gray.500"} fontSize={"xs"} fontWeight={"bold"}>
                    Match setup
                </Text>
            </View>
            <View flexDirection={"row"}>
                {Array.from({ length: totalSteps }).map((_, index) => (
                    <View
                        key={`setup-step-${index}`}
                        backgroundColor={index + 1 <= safePageNumber ? openScoreboardColor : "gray.200"}
                        borderRadius={999}
                        flex={1}
                        height={4}
                        marginRight={index + 1 === totalSteps ? 0 : 1}
                    />
                ))}
            </View>
        </View>
    );
}

function WizardCard({ title, description, icon, children }) {
    return (
        <View
            backgroundColor={"white"}
            borderColor={"gray.200"}
            borderRadius={8}
            borderWidth={1}
            padding={3}
        >
            <View alignItems={"center"} flexDirection={"row"} marginBottom={description ? 2 : 3}>
                <View
                    alignItems={"center"}
                    backgroundColor={"blue.50"}
                    borderColor={"blue.100"}
                    borderRadius={8}
                    borderWidth={1}
                    height={34}
                    justifyContent={"center"}
                    marginRight={3}
                    width={34}
                >
                    {icon}
                </View>
                <View flex={1}>
                    <Text color={"gray.900"} fontSize={"lg"} fontWeight={"bold"}>{title}</Text>
                    {description ? (
                        <Text color={"gray.600"} fontSize={"xs"} marginTop={1}>{description}</Text>
                    ) : null}
                </View>
            </View>
            {children}
        </View>
    );
}

function ChoiceButton({ description = null, icon = null, isDisabled = false, label, onPress, selected = false }) {
    if (selected) {
        return (
            <ScoringGradientButton
                disabled={isDisabled}
                onPress={onPress}
                style={{
                    minHeight: 44,
                    width: "100%",
                }}
                contentStyle={{
                    alignItems: "stretch",
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                }}
            >
                <View alignItems={"center"} flexDirection={"row"} width={"100%"}>
                    {icon ? (
                        <View marginRight={3}>{icon(openScoreboardButtonTextColor)}</View>
                    ) : null}
                    <View flex={1}>
                        <Text color={openScoreboardButtonTextColor} fontSize={"sm"} fontWeight={"bold"} numberOfLines={1}>
                            {label}
                        </Text>
                        {description ? (
                            <Text color={"gray.100"} fontSize={"xs"} marginTop={1}>
                                {description}
                            </Text>
                        ) : null}
                    </View>
                </View>
            </ScoringGradientButton>
        );
    }

    return (
        <Button
            backgroundColor={"white"}
            borderColor={"blue.100"}
            borderRadius={8}
            borderWidth={1}
            isDisabled={isDisabled}
            justifyContent={"flex-start"}
            minHeight={44}
            onPress={onPress}
            paddingX={3}
            paddingY={2}
            variant={"outline"}
            width={"100%"}
            _pressed={{ backgroundColor: "blue.50" }}
        >
            <View alignItems={"center"} flexDirection={"row"} width={"100%"}>
                {icon ? (
                    <View marginRight={3}>{icon(openScoreboardColor)}</View>
                ) : null}
                <View flex={1}>
                    <Text color={"gray.900"} fontSize={"sm"} fontWeight={"bold"} numberOfLines={1}>
                        {label}
                    </Text>
                    {description ? (
                        <Text color={"gray.600"} fontSize={"xs"} marginTop={1}>
                            {description}
                        </Text>
                    ) : null}
                </View>
            </View>
        </Button>
    );
}

function ServerChoiceCard({ isDisabled = false, label, onPress, selected = false, sideLabel }) {
    const backgroundColor = selected ? openScoreboardColor : "#FFFFFF";
    const borderColor = selected ? openScoreboardColor : "#BFDBFE";
    const textColor = selected ? openScoreboardButtonTextColor : "#18181B";
    const secondaryTextColor = selected ? "#E0E7FF" : "#71717A";
    const content = (
        <View alignItems={"center"} flexDirection={"row"} justifyContent={"center"} width={"100%"}>
            {selected ? (
                <View
                    alignItems={"center"}
                    height={28}
                    justifyContent={"center"}
                    width={28}
                >
                    <FontAwesome5 name="table-tennis" size={15} color={openScoreboardButtonTextColor} />
                </View>
            ) : null}
            <View alignItems={"center"} flex={1} paddingX={selected ? 2 : 0}>
                <Text color={secondaryTextColor} fontSize={"2xs"} fontWeight={"bold"} marginBottom={1} textAlign={"center"} textTransform={"uppercase"}>
                    {sideLabel}
                </Text>
                <Text color={textColor} fontSize={"sm"} fontWeight={"bold"} numberOfLines={2} textAlign={"center"}>
                    {label}
                </Text>
            </View>
            {selected ? (
                <View height={28} width={28} />
            ) : null}
        </View>
    );

    if (selected) {
        return (
            <ScoringGradientButton
                disabled={isDisabled}
                onPress={onPress}
                style={{
                    minHeight: 64,
                    width: "100%",
                }}
                contentStyle={{
                    alignItems: "center",
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                }}
            >
                {content}
            </ScoringGradientButton>
        );
    }

    return (
        <Pressable
            disabled={isDisabled}
            onPress={onPress}
            style={({ pressed }) => ({
                alignItems: "center",
                backgroundColor: pressed && !isDisabled ? "#EFF6FF" : backgroundColor,
                borderColor,
                borderRadius: 10,
                borderWidth: 1,
                justifyContent: "center",
                minHeight: 64,
                opacity: isDisabled ? 0.7 : 1,
                paddingHorizontal: 12,
                paddingVertical: 8,
                width: "100%",
            })}
        >
            {content}
        </Pressable>
    );
}

function CompactOptionButton({ icon = null, isDisabled = false, label, onPress, selected = false }) {
    const textColor = selected ? openScoreboardButtonTextColor : "gray.900";
    const iconColor = selected ? openScoreboardButtonTextColor : openScoreboardColor;
    const content = (
        <>
            {icon ? (
                <View marginRight={2}>{icon(iconColor)}</View>
            ) : null}
            <Text color={textColor} fontSize={"sm"} fontWeight={"bold"} numberOfLines={1}>
                {label}
            </Text>
        </>
    );

    if (selected) {
        return (
            <ScoringGradientButton
                disabled={isDisabled}
                onPress={onPress}
                style={{
                    height: 38,
                    opacity: isDisabled ? 0.7 : 1,
                    width: "100%",
                }}
                contentStyle={{
                    flexDirection: "row",
                    paddingHorizontal: 8,
                }}
            >
                {content}
            </ScoringGradientButton>
        );
    }

    return (
        <Pressable
            disabled={isDisabled}
            onPress={onPress}
            style={({ pressed }) => ({
                alignItems: "center",
                backgroundColor: pressed && !isDisabled ? "#EFF6FF" : "#FFFFFF",
                borderColor: "#BFDBFE",
                borderRadius: 8,
                borderWidth: 1,
                flexDirection: "row",
                height: 38,
                justifyContent: "center",
                opacity: isDisabled ? 0.7 : 1,
                paddingHorizontal: 8,
                width: "100%",
            })}
        >
            {content}
        </Pressable>
    );
}

function getPlayerStepDefinitions(isSingles) {
    if (isSingles) {
        return [
            {
                description: "Select the player on side A.",
                field: "playerA",
                shortLabel: "A",
                title: "Player A",
            },
            {
                description: "Select the player on side B.",
                field: "playerB",
                shortLabel: "B",
                title: "Player B",
            },
        ];
    }

    return [
        {
            description: "Select the first player on side A.",
            field: "playerA",
            shortLabel: "1A",
            title: "Player 1A",
        },
        {
            description: "Select the second player on side A.",
            field: "playerA2",
            shortLabel: "2A",
            title: "Player 2A",
        },
        {
            description: "Select the first player on side B.",
            field: "playerB",
            shortLabel: "1B",
            title: "Player 1B",
        },
        {
            description: "Select the second player on side B.",
            field: "playerB2",
            shortLabel: "2B",
            title: "Player 2B",
        },
    ];
}

function getWizardSteps(isSingles, isScheduling, isKioskScheduledMatch = false, hasActiveScheduledMatch = false) {
    const doublesServiceOrderSteps = !isSingles && !isScheduling ? [
        { type: "servePlayer" },
        { type: "receivePlayer" },
    ] : [];
    const scheduledColorSteps = hasActiveScheduledMatch && !isScheduling ? [
        { type: "colors" },
    ] : [];

    if (isKioskScheduledMatch) {
        return [
            { type: "welcome" },
            ...scheduledColorSteps,
            { type: "serve" },
            ...doublesServiceOrderSteps,
            { type: "warmup" },
            { type: "start" },
        ];
    }

    return [
        { type: "welcome" },
        { type: "format" },
        { type: "round" },
        ...getPlayerStepDefinitions(isSingles).map((playerStep) => ({
            type: "player",
            ...playerStep,
        })),
        ...scheduledColorSteps,
        isScheduling ? { type: "scheduleDone" } : { type: "serve" },
        ...doublesServiceOrderSteps,
        ...(!isScheduling ? [{ type: "warmup" }, { type: "start" }] : []),
    ];
}

function FooterButton({ children, isDisabled = false, isPrimary = false, onPress }) {
    const backgroundColor = isPrimary ? (isDisabled ? "#D4D4D8" : openScoreboardColor) : "#FFFFFF";
    const borderColor = isPrimary ? (isDisabled ? "#D4D4D8" : openScoreboardColor) : "#BFDBFE";
    const textColor = isPrimary ? openScoreboardButtonTextColor : "blue.700";

    if (isPrimary) {
        return (
            <ScoringGradientButton
                disabled={isDisabled}
                onPress={onPress}
                style={{
                    height: 40,
                    maxHeight: 40,
                    width: "100%",
                }}
                contentStyle={{
                    paddingHorizontal: 12,
                }}
            >
                <Text color={openScoreboardButtonTextColor} fontWeight={"bold"} numberOfLines={1}>
                    {children}
                </Text>
            </ScoringGradientButton>
        );
    }

    return (
        <Pressable
            disabled={isDisabled}
            onPress={onPress}
            style={({ pressed }) => ({
                alignItems: "center",
                backgroundColor: pressed && !isDisabled ? "#EFF6FF" : backgroundColor,
                borderColor,
                borderRadius: 8,
                borderWidth: 1,
                height: 40,
                justifyContent: "center",
                maxHeight: 40,
                opacity: isDisabled ? 0.7 : 1,
                paddingHorizontal: 12,
                width: "100%",
            })}
        >
            <Text color={textColor} fontWeight={"bold"} numberOfLines={1}>
                {children}
            </Text>
        </Pressable>
    );
}

function ScheduledMatchCompactItem({ index, item, onConfirm, sourceID, sourceType, tableNumber }) {
    const [loadingNewMatch, setLoadingNewMatch] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");
    const scheduledMatchID = item?.[0];
    const match = item?.[1] || {};
    const playerA = match.playerA && match.playerA.length > 0 ? match.playerA : "TBD";
    const playerB = match.playerB && match.playerB.length > 0 ? match.playerB : "TBD";
    const isWaitingForLineup = match.lineupPending === true || playerA === "TBD" || playerB === "TBD";

    async function confirmScheduledMatch() {
        setLoadingNewMatch(true);
        setStatusMessage("");
        try {
            await setScheduledMatchToCurrentForSource(sourceType, sourceID, tableNumber, scheduledMatchID);
            await onConfirm();
        }
        catch (error) {
            setShowConfirm(false);
            setStatusMessage(error instanceof Error ? error.message : "This match could not be started.");
        }
        finally {
            setLoadingNewMatch(false);
        }
    }

    return (
        <View
            alignItems={"center"}
            backgroundColor={index % 2 === 0 ? "gray.50" : "white"}
            borderColor={"gray.200"}
            borderRadius={8}
            borderWidth={1}
            flexDirection={"row"}
            marginBottom={2}
            padding={2}
        >
            <View flex={1} marginRight={2}>
                <Text color={"gray.900"} fontSize={"sm"} fontWeight={"bold"} numberOfLines={1}>
                    {playerA} vs {playerB}
                </Text>
                <Text color={getScheduledMatchContextLabel(match) ? "blue.700" : "gray.500"} fontSize={"2xs"} marginTop={1} numberOfLines={2}>
                    {getScheduledMatchSecondaryText(match, isWaitingForLineup)}
                </Text>
                {statusMessage ? (
                    <Text color={"red.700"} fontSize={"2xs"} fontWeight={"bold"} marginTop={1}>
                        {statusMessage}
                    </Text>
                ) : null}
            </View>
            {showConfirm ? (
                <View flexDirection={"row"}>
                    <ScoringGradientButton
                        onPress={confirmScheduledMatch}
                        style={{ minHeight: 34 }}
                        contentStyle={{ paddingHorizontal: 12, paddingVertical: 4 }}
                    >
                        {loadingNewMatch ? (
                            <Spinner color={openScoreboardButtonTextColor} size={"sm"} />
                        ) : (
                            <Text color={openScoreboardButtonTextColor} fontSize={"xs"} fontWeight={"bold"}>
                                {i18n.t("confirm")}
                            </Text>
                        )}
                    </ScoringGradientButton>
                    <Button
                        borderRadius={8}
                        minHeight={34}
                        onPress={() => setShowConfirm(false)}
                        paddingX={2}
                        paddingY={1}
                        variant={"ghost"}
                    >
                        <Text color={"gray.600"} fontSize={"xs"} fontWeight={"bold"}>
                            {i18n.t("back")}
                        </Text>
                    </Button>
                </View>
            ) : (
                <ScoringGradientButton
                    disabled={isWaitingForLineup}
                    onPress={() => setShowConfirm(true)}
                    style={{ minHeight: 34 }}
                    contentStyle={{ flexDirection: "row", paddingHorizontal: 12, paddingVertical: 4 }}
                >
                    <View alignItems={"center"} flexDirection={"row"}>
                        <FontAwesome5 name="table-tennis" size={12} color={openScoreboardButtonTextColor} />
                        <Text color={openScoreboardButtonTextColor} fontSize={"xs"} fontWeight={"bold"} marginLeft={1}>
                            {isWaitingForLineup ? "Waiting" : "Select"}
                        </Text>
                    </View>
                </ScoringGradientButton>
            )}
        </View>
    );
}

function MatchRoundSearchSelect({ onChange, value }) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchText, setSearchText] = useState("");
    const selectedOption = getRoundOptionForValue(value);
    const normalizedSearchText = searchText.trim().toLowerCase();
    const filteredOptions = normalizedSearchText.length > 0 ?
        roundStageOptions.filter((option) => getRoundOptionSearchText(option).includes(normalizedSearchText))
        : roundStageOptions;
    const visibleOptions = filteredOptions.slice(0, maxVisibleRoundOptions);
    const selectedDisplayValue = selectedOption ? getRoundOptionDisplay(selectedOption) : value || "";

    function selectRound(option) {
        onChange(option.value);
        setSearchText("");
        setIsOpen(false);
    }

    function selectCustomRound() {
        const customRound = searchText.trim();
        if (customRound.length === 0) {
            return;
        }
        onChange(customRound);
        setSearchText("");
        setIsOpen(false);
    }

    return (
        <View>
            <Pressable
                onPress={() => setIsOpen(true)}
                style={({ pressed }) => ({
                    alignItems: "center",
                    backgroundColor: pressed ? "#EFF6FF" : "#FFFFFF",
                    borderColor: "#BFDBFE",
                    borderRadius: 8,
                    borderWidth: 1,
                    flexDirection: "row",
                    minHeight: 40,
                    paddingHorizontal: 10,
                    width: "100%",
                })}
            >
                <View flex={1}>
                    <Text color={"gray.500"} fontSize={"2xs"} fontWeight={"bold"} textTransform={"uppercase"}>
                        Match round
                    </Text>
                    <Text color={"gray.900"} fontSize={"sm"} fontWeight={"bold"} numberOfLines={1}>
                        {selectedDisplayValue || "No round selected"}
                    </Text>
                </View>
                <Ionicons name="search" size={16} color={openScoreboardColor} />
            </Pressable>

            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
                <Modal.Content maxWidth={460} width={"92%"}>
                    <Modal.Header>Match Round (optional)</Modal.Header>
                    <Modal.Body>
                        <Input
                            autoFocus
                            backgroundColor={"white"}
                            borderColor={"gray.300"}
                            borderRadius={8}
                            fontSize={"sm"}
                            marginBottom={2}
                            minHeight={38}
                            onChangeText={setSearchText}
                            placeholder={"Search rounds, like SF, QF, group, pool"}
                            value={searchText}
                        />
                        <ScrollView style={{ maxHeight: 300 }}>
                            {visibleOptions.length > 0 ? visibleOptions.map((option) => (
                                <Pressable
                                    key={`${option.value}-${option.label}`}
                                    onPress={() => selectRound(option)}
                                    style={({ pressed }) => ({
                                        alignItems: "center",
                                        backgroundColor: option.value === value ? "#EFF6FF" : pressed ? "#F4F4F5" : "#FFFFFF",
                                        borderRadius: 8,
                                        flexDirection: "row",
                                        minHeight: 38,
                                        paddingHorizontal: 8,
                                        paddingVertical: 6,
                                    })}
                                >
                                    <Text color={"blue.700"} fontSize={"xs"} fontWeight={"bold"} minWidth={52}>
                                        {option.value || "-"}
                                    </Text>
                                    <Text color={"gray.900"} flex={1} fontSize={"sm"} fontWeight={"bold"} numberOfLines={1}>
                                        {option.label}
                                    </Text>
                                </Pressable>
                            )) : (
                                <Pressable
                                    onPress={selectCustomRound}
                                    style={({ pressed }) => ({
                                        backgroundColor: pressed ? "#EFF6FF" : "#FFFFFF",
                                        borderRadius: 8,
                                        minHeight: 38,
                                        justifyContent: "center",
                                        paddingHorizontal: 8,
                                    })}
                                >
                                    <Text color={"gray.900"} fontSize={"sm"} fontWeight={"bold"} numberOfLines={1}>
                                        Use "{searchText.trim()}"
                                    </Text>
                                </Pressable>
                            )}
                        </ScrollView>
                        {filteredOptions.length > visibleOptions.length ? (
                            <Text color={"gray.500"} fontSize={"2xs"} marginTop={2}>
                                Showing {visibleOptions.length} of {filteredOptions.length}. Keep typing to narrow the list.
                            </Text>
                        ) : null}
                    </Modal.Body>
                    <Modal.Footer>
                        {value ? (
                            <Button
                                borderRadius={8}
                                marginRight={2}
                                onPress={() => selectRound(roundStageOptions[0])}
                                variant={"ghost"}
                            >
                                <Text color={"gray.700"} fontWeight={"bold"}>Clear</Text>
                            </Button>
                        ) : null}
                        <Button backgroundColor={openScoreboardColor} borderRadius={8} onPress={() => setIsOpen(false)}>
                            <Text color={openScoreboardButtonTextColor} fontWeight={"bold"}>Done</Text>
                        </Button>
                    </Modal.Footer>
                </Modal.Content>
            </Modal>
        </View>
    );
}

function JerseyColorModal({ color, isOpen, onClose, onSelect }) {
    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <Modal.Content maxWidth={420} width={"92%"}>
                <Modal.Header>Jersey Color</Modal.Header>
                <Modal.Body>
                    <Text color={"gray.600"} fontSize={"sm"} marginBottom={2}>
                        Pick a jersey color from the grid.
                    </Text>
                    <JerseyColorOptions
                        color={color}
                        onSelect={(selectedColor) => {
                            onSelect(selectedColor);
                        }}
                    />
                </Modal.Body>
                <Modal.Footer>
                    <Button backgroundColor={openScoreboardColor} borderRadius={8} onPress={onClose}>
                        <Text color={openScoreboardButtonTextColor} fontWeight={"bold"}>Done</Text>
                    </Button>
                </Modal.Footer>
            </Modal.Content>
        </Modal>
    );
}

function PlayerSearchOption({ onPress, player }) {
    const playerName = getPlayerFormatted(player);

    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => ({
                alignItems: "center",
                backgroundColor: pressed ? "#EFF6FF" : "#FFFFFF",
                borderRadius: 6,
                flexDirection: "row",
                minHeight: 28,
                paddingHorizontal: 7,
                paddingVertical: 3,
                width: "100%",
            })}
        >
            <View
                alignItems={"center"}
                backgroundColor={player.jerseyColor || "gray.100"}
                borderColor={"gray.200"}
                borderRadius={999}
                borderWidth={1}
                height={16}
                justifyContent={"center"}
                marginRight={2}
                width={16}
            >
                <FontAwesome5 name="user" size={7} color={player.jerseyColor ? "#FFFFFF" : "#71717A"} />
            </View>
            <Text color={"gray.900"} flex={1} fontSize={"xs"} fontWeight={"bold"} numberOfLines={1}>
                {playerName || "Unnamed Player"}
            </Text>
        </Pressable>
    );
}

function PlayerSearchModal({ importPlayers, isOpen, onClose, onSelectPlayer, selectedPlayer }) {
    const [searchText, setSearchText] = useState("");
    const normalizedSearchText = searchText.trim().toLowerCase();
    const filteredPlayers = normalizedSearchText.length > 0 ?
        importPlayers.filter(([, player]) => getPlayerFormatted(player).toLowerCase().includes(normalizedSearchText))
        : importPlayers;
    const visiblePlayers = filteredPlayers.slice(0, maxVisibleModalPlayers);

    useEffect(() => {
        if (!isOpen) {
            setSearchText("");
        }
    }, [isOpen]);

    function selectPlayer(playerID, player) {
        onSelectPlayer(playerID, player);
        onClose();
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <Modal.Content maxWidth={460} width={"92%"}>
                <Modal.Header>Import Player</Modal.Header>
                <Modal.Body>
                    <Input
                        autoFocus
                        backgroundColor={"white"}
                        borderColor={"gray.300"}
                        borderRadius={8}
                        fontSize={"sm"}
                        marginBottom={2}
                        minHeight={38}
                        onChangeText={setSearchText}
                        placeholder={"Search by player name"}
                        value={searchText}
                    />
                    <ScrollView style={{ maxHeight: 320 }}>
                        {visiblePlayers.length > 0 ? visiblePlayers.map(([playerID, player]) => (
                            <View
                                key={`import-player-${playerID}`}
                                backgroundColor={selectedPlayer?.id === playerID ? "blue.50" : "white"}
                                borderRadius={8}
                                marginBottom={1}
                            >
                                <PlayerSearchOption
                                    player={player}
                                    onPress={() => selectPlayer(playerID, player)}
                                />
                            </View>
                        )) : (
                            <View backgroundColor={"gray.50"} borderColor={"gray.200"} borderRadius={8} borderWidth={1} padding={3}>
                                <Text color={"gray.700"} fontSize={"sm"} fontWeight={"bold"} textAlign={"center"}>
                                    No players match that search.
                                </Text>
                            </View>
                        )}
                    </ScrollView>
                    {filteredPlayers.length > visiblePlayers.length ? (
                        <Text color={"gray.500"} fontSize={"2xs"} marginTop={2}>
                            Showing {visiblePlayers.length} of {filteredPlayers.length}. Keep typing to narrow the list.
                        </Text>
                    ) : null}
                </Modal.Body>
                <Modal.Footer>
                    <Button backgroundColor={openScoreboardColor} borderRadius={8} onPress={onClose}>
                        <Text color={openScoreboardButtonTextColor} fontWeight={"bold"}>Done</Text>
                    </Button>
                </Modal.Footer>
            </Modal.Content>
        </Modal>
    );
}

function WizardPlayerSelector({ matchProps, onChangePlayer, playerField, selectedPlayer }) {
    const [importPlayers, setImportPlayers] = useState([]);
    const [loadingImportPlayers, setLoadingImportPlayers] = useState(true);
    const [defaultJerseyColor, setDefaultJerseyColor] = useState("");
    const [showPlayerSearch, setShowPlayerSearch] = useState(false);
    const [showColorModal, setShowColorModal] = useState(false);
    const [entryMode, setEntryMode] = useState(selectedPlayer?.isImported === false ? "manual" : "list");
    const [manualFirstName, setManualFirstName] = useState(selectedPlayer?.firstName || "");
    const [manualLastName, setManualLastName] = useState(selectedPlayer?.lastName || "");
    const selectedName = getPlayerFormatted(selectedPlayer);
    const effectiveJerseyColor = selectedPlayer?.jerseyColor || defaultJerseyColor || "";
    const hasImportPlayers = importPlayers.length > 0;

    useEffect(() => {
        setManualFirstName(selectedPlayer?.firstName || "");
        setManualLastName(selectedPlayer?.lastName || "");
    }, [selectedPlayer?.firstName, selectedPlayer?.lastName, playerField]);

    useEffect(() => {
        let isMounted = true;

        async function loadImportPlayers() {
            setLoadingImportPlayers(true);
            try {
                let playerList = [];
                if (matchProps.isTeamMatch) {
                    const [teamPlayers, teamJerseyColor] = await Promise.all([
                        getImportTeamMembersList(playerField, matchProps.teamMatchID),
                        getTeamJerseyColorForMatchPlayer(playerField, matchProps.teamMatchID),
                    ]);
                    playerList = teamPlayers;
                    if (isMounted) {
                        setDefaultJerseyColor(teamJerseyColor || "");
                    }
                }
                else {
                    if (isMounted) {
                        setDefaultJerseyColor("");
                    }
                    const playerListID = await getPlayerListIDForTable(matchProps.route.params.tableID);
                    if (playerListID && playerListID.length > 0) {
                        playerList = await getImportPlayerList(playerListID);
                    }
                }

                if (isMounted) {
                    setImportPlayers(sortPlayers(playerList || []));
                }
            }
            finally {
                if (isMounted) {
                    setLoadingImportPlayers(false);
                }
            }
        }

        loadImportPlayers();

        return () => {
            isMounted = false;
        };
    }, [matchProps.isTeamMatch, matchProps.route?.params?.tableID, matchProps.teamMatchID, playerField]);

    function selectImportPlayer(playerID, player) {
        const playerForMatch = normalizePlayerForMatch({ ...player, id: playerID, jerseyColor: player?.jerseyColor || defaultJerseyColor }, true);
        onChangePlayer(playerField, playerForMatch);
        setEntryMode("list");
        setShowPlayerSearch(false);
    }

    function updateManualPlayer(partialPlayer) {
        const playerForMatch = normalizePlayerForMatch({
            ...selectedPlayer,
            firstName: manualFirstName,
            jerseyColor: selectedPlayer?.jerseyColor || defaultJerseyColor,
            lastName: manualLastName,
            ...partialPlayer,
        }, false);
        onChangePlayer(playerField, playerForMatch);
    }

    function openPlayerSearch() {
        if (hasImportPlayers) {
            setEntryMode("list");
            setShowPlayerSearch(true);
            return;
        }

        setEntryMode("manual");
    }

    function updateJerseyColor(color) {
        onChangePlayer(playerField, normalizePlayerForMatch({
            ...selectedPlayer,
            firstName: selectedPlayer?.firstName || manualFirstName,
            jerseyColor: color || defaultJerseyColor,
            lastName: selectedPlayer?.lastName || manualLastName,
        }, selectedPlayer?.isImported === true));
    }

    return (
        <View>
            <View
                alignItems={"center"}
                backgroundColor={"gray.50"}
                borderColor={"gray.200"}
                borderRadius={8}
                borderWidth={1}
                flexDirection={"row"}
                marginBottom={2}
                padding={2}
            >
                <Pressable
                    onPress={openPlayerSearch}
                    style={({ pressed }) => ({
                        alignItems: "center",
                        backgroundColor: pressed ? "#EFF6FF" : "transparent",
                        borderRadius: 8,
                        flex: 1,
                        flexDirection: "row",
                        marginRight: 8,
                        padding: 2,
                    })}
                >
                    <View
                        alignItems={"center"}
                        backgroundColor={selectedPlayer?.jerseyColor || defaultJerseyColor || "white"}
                        borderColor={"gray.200"}
                        borderRadius={999}
                        borderWidth={1}
                        height={30}
                        justifyContent={"center"}
                        marginRight={2}
                        width={30}
                    >
                        <FontAwesome5 name="user" size={12} color={(selectedPlayer?.jerseyColor || defaultJerseyColor) ? "#FFFFFF" : "#71717A"} />
                    </View>
                    <View flex={1}>
                        <Text color={"gray.500"} fontSize={"2xs"} fontWeight={"bold"} textTransform={"uppercase"}>
                            Selected player
                        </Text>
                        <Text color={"gray.900"} fontSize={"sm"} fontWeight={"bold"} numberOfLines={1}>
                            {selectedName || (hasImportPlayers ? "Tap to select from player list" : "Type player name manually")}
                        </Text>
                    </View>
                    {hasImportPlayers ? (
                        <Ionicons name="search" size={16} color={openScoreboardColor} />
                    ) : null}
                </Pressable>
                <Pressable
                    onPress={() => setShowColorModal(true)}
                    style={({ pressed }) => ({
                        alignItems: "center",
                        backgroundColor: pressed ? "#EFF6FF" : effectiveJerseyColor ? "#FFFFFF" : "#FFFBEB",
                        borderColor: effectiveJerseyColor ? "#BFDBFE" : "#F59E0B",
                        borderRadius: 8,
                        borderWidth: effectiveJerseyColor ? 1 : 2,
                        flexDirection: "row",
                        height: 38,
                        justifyContent: "center",
                        paddingHorizontal: 10,
                    })}
                >
                    <View
                        backgroundColor={effectiveJerseyColor || "gray.200"}
                        borderColor={effectiveJerseyColor ? "gray.200" : "amber.300"}
                        borderWidth={1}
                        flexShrink={0}
                        marginRight={1}
                        style={{
                            borderRadius: 999,
                            height: 16,
                            width: 16,
                        }}
                    />
                    <Text color={effectiveJerseyColor ? "blue.700" : "amber.800"} fontSize={"2xs"} fontWeight={"bold"}>
                        Jersey color
                    </Text>
                </Pressable>
            </View>
            {!effectiveJerseyColor ? (
                <View backgroundColor={"amber.50"} borderColor={"amber.200"} borderRadius={8} borderWidth={1} marginBottom={2} padding={2}>
                    <Text color={"amber.900"} fontSize={"xs"} fontWeight={"semibold"}>
                        Choose a jersey color so the scoring side gets the correct background color.
                    </Text>
                </View>
            ) : null}

            {loadingImportPlayers ? (
                <View alignItems={"center"} backgroundColor={"gray.50"} borderColor={"gray.200"} borderRadius={8} borderWidth={1} flexDirection={"row"} padding={2}>
                    <Spinner color={openScoreboardColor} size={"sm"} />
                    <Text color={"gray.600"} fontSize={"xs"} marginLeft={2}>
                        Loading players...
                    </Text>
                </View>
            ) : (
                <View>
                    {hasImportPlayers ? (
                        <View flexDirection={"row"} marginBottom={2}>
                            <View flex={1} marginRight={1}>
                                <CompactOptionButton
                                    icon={(color) => <Ionicons name="search" size={15} color={color} />}
                                    label={"Select from list"}
                                    onPress={() => {
                                        setEntryMode("list");
                                        setShowPlayerSearch(true);
                                    }}
                                    selected={entryMode === "list"}
                                />
                            </View>
                            <View flex={1} marginLeft={1}>
                                <CompactOptionButton
                                    icon={(color) => <Ionicons name="create-outline" size={16} color={color} />}
                                    label={"Type manually"}
                                    onPress={() => setEntryMode("manual")}
                                    selected={entryMode === "manual"}
                                />
                            </View>
                        </View>
                    ) : (
                        <Text color={"gray.600"} fontSize={"xs"} marginBottom={2}>
                            No importable players are linked to this table yet. Enter a player name for this match.
                        </Text>
                    )}

                    {entryMode === "manual" || !hasImportPlayers ? (
                        <View flexDirection={"row"}>
                            <Input
                                backgroundColor={"white"}
                                borderColor={"gray.300"}
                                borderRadius={8}
                                flex={1}
                                fontSize={"sm"}
                                marginRight={1}
                                minHeight={38}
                                onChangeText={(firstName) => {
                                    setManualFirstName(firstName);
                                    updateManualPlayer({ firstName });
                                }}
                                placeholder={"First name"}
                                value={manualFirstName}
                            />
                            <Input
                                backgroundColor={"white"}
                                borderColor={"gray.300"}
                                borderRadius={8}
                                flex={1}
                                fontSize={"sm"}
                                marginLeft={1}
                                minHeight={38}
                                onChangeText={(lastName) => {
                                    setManualLastName(lastName);
                                    updateManualPlayer({ lastName });
                                }}
                                placeholder={"Last name"}
                                value={manualLastName}
                            />
                        </View>
                    ) : null}
                </View>
            )}

            <JerseyColorModal
                color={selectedPlayer?.jerseyColor || defaultJerseyColor || ""}
                isOpen={showColorModal}
                onClose={() => setShowColorModal(false)}
                onSelect={updateJerseyColor}
            />
            <PlayerSearchModal
                importPlayers={importPlayers}
                isOpen={showPlayerSearch}
                onClose={() => setShowPlayerSearch(false)}
                onSelectPlayer={selectImportPlayer}
                selectedPlayer={selectedPlayer}
            />
        </View>
    );
}

function JerseyColorAssignmentCard({ matchProps, onSelectColor, player, playerField, title }) {
    const [defaultJerseyColor, setDefaultJerseyColor] = useState("");
    const [showColorModal, setShowColorModal] = useState(false);
    const playerName = getPlayerFormatted(player);
    const hasPlayer = playerName.length > 0 || typeof player?.id !== "undefined";
    const effectiveJerseyColor = player?.jerseyColor || defaultJerseyColor || "";

    useEffect(() => {
        let isMounted = true;

        async function loadDefaultJerseyColor() {
            if (!matchProps.isTeamMatch || !matchProps.teamMatchID) {
                if (isMounted) {
                    setDefaultJerseyColor("");
                }
                return;
            }

            const teamJerseyColor = await getTeamJerseyColorForMatchPlayer(playerField, matchProps.teamMatchID);
            if (isMounted) {
                setDefaultJerseyColor(teamJerseyColor || "");
            }
        }

        loadDefaultJerseyColor();

        return () => {
            isMounted = false;
        };
    }, [matchProps.isTeamMatch, matchProps.teamMatchID, playerField]);

    useEffect(() => {
        if (hasPlayer && defaultJerseyColor && !player?.jerseyColor) {
            onSelectColor(defaultJerseyColor);
        }
    }, [defaultJerseyColor, hasPlayer, onSelectColor, player?.jerseyColor]);

    return (
        <View
            backgroundColor={effectiveJerseyColor ? "white" : "amber.50"}
            borderColor={effectiveJerseyColor ? "gray.200" : "amber.300"}
            borderRadius={8}
            borderWidth={effectiveJerseyColor ? 1 : 2}
            marginBottom={2}
            padding={3}
        >
            <View alignItems={"center"} flexDirection={"row"}>
                <View
                    alignItems={"center"}
                    backgroundColor={effectiveJerseyColor || "#F4F4F5"}
                    borderColor={effectiveJerseyColor ? "gray.200" : "amber.300"}
                    borderRadius={999}
                    borderWidth={1}
                    height={42}
                    justifyContent={"center"}
                    marginRight={3}
                    width={42}
                >
                    <MaterialCommunityIcons name="palette" size={18} color={effectiveJerseyColor ? "#FFFFFF" : "#A16207"} />
                </View>
                <View flex={1}>
                    <Text color={"gray.500"} fontSize={"2xs"} fontWeight={"bold"} textTransform={"uppercase"}>
                        {title}
                    </Text>
                    <Text color={"gray.900"} fontSize={"sm"} fontWeight={"bold"} numberOfLines={2}>
                        {playerName || "Player not selected"}
                    </Text>
                    {!effectiveJerseyColor ? (
                        <Text color={"amber.800"} fontSize={"2xs"} fontWeight={"semibold"} marginTop={0.5}>
                            Jersey color required before scoring.
                        </Text>
                    ) : null}
                </View>
                <Pressable
                    disabled={!hasPlayer}
                    onPress={() => setShowColorModal(true)}
                    style={({ pressed }) => ({
                        alignItems: "center",
                        backgroundColor: pressed && hasPlayer ? "#EFF6FF" : effectiveJerseyColor ? "#FFFFFF" : "#FEF3C7",
                        borderColor: effectiveJerseyColor ? "#BFDBFE" : "#F59E0B",
                        borderRadius: 8,
                        borderWidth: 1,
                        justifyContent: "center",
                        minHeight: 38,
                        opacity: hasPlayer ? 1 : 0.55,
                        paddingHorizontal: 12,
                    })}
                >
                    <Text color={effectiveJerseyColor ? "blue.700" : "amber.900"} fontSize={"xs"} fontWeight={"bold"}>
                        {effectiveJerseyColor ? "Change" : "Choose"}
                    </Text>
                </Pressable>
            </View>
            <JerseyColorModal
                color={effectiveJerseyColor}
                isOpen={showColorModal}
                onClose={() => setShowColorModal(false)}
                onSelect={onSelectColor}
            />
        </View>
    );
}

export function MatchSetup(props) {

    let [isSingles, setIsSingles] = useState(props.isDoubles ? false : true);
    let [pageNumber, setPageNumber] = useState(1);
    let [loadingMatchServer, setLoadingMatchServer] = useState(false);
    let [initialServerIsA, setInitialServerIsA] = useState(props.isAInitialServer === true);
    let [selectedInitialServerPlayerField, setSelectedInitialServerPlayerField] = useState(props.initialServerPlayerField || props.currentServerPlayerField || "");
    let [selectedInitialReceiverPlayerField, setSelectedInitialReceiverPlayerField] = useState(props.initialReceiverPlayerField || props.currentReceiverPlayerField || "");
    let [loadingServicePlayerOrder, setLoadingServicePlayerOrder] = useState(false);
    let [showWarmUpTimer, setShowWarmUpTimer] = useState(false);
    let [warmUpStartTimeCounter, setWarmUpStartTimeCounter] = useState(new Date());
    let [showLoadingScheduledMatch, setLoadingScheduledMatch] = useState(false)
    let [showScheduledMatches, setShowScheduledMatches] = useState(false)
    let [loadingScheduledMatches, setLoadingScheduledMatches] = useState(false)
    let [scheduledMatchesLoaded, setScheduledMatchesLoaded] = useState(false)
    let [scheduledMatchSearch, setScheduledMatchSearch] = useState("")

    let [bestOfGames, setBestOfGames] = useState(props.bestOf || 5)
    let [matchRound, setMatchRound] = useState(props.matchRound || "")
    let [pendingPlayers, setPendingPlayers] = useState<any>({})
    let [savingCurrentPlayer, setSavingCurrentPlayer] = useState(false)
    let [scheduledMatches, setScheduledMatches] = useState([])
    let [teamTieWaitingFor, setTeamTieWaitingFor] = useState([])
    let [teamTieWaitingMessage, setTeamTieWaitingMessage] = useState("")
    const hasActiveScheduledMatch = !props.isScheduling && typeof props.scheduledMatchID === "string" && props.scheduledMatchID.length > 0;
    const isKioskScheduledMatch = props.isKioskMode === true && hasActiveScheduledMatch;
    const canUseScheduledMatches = !props.isScheduling && !hasActiveScheduledMatch;
    const hasScheduledMatches = scheduledMatches.length > 0;
    const normalizedScheduledMatchSearch = scheduledMatchSearch.trim().toLowerCase();
    const filteredScheduledMatches = normalizedScheduledMatchSearch.length > 0 ?
        scheduledMatches.filter((scheduledMatch) => {
            const match = scheduledMatch?.[1] || {};
            return `${match.playerA || ""} ${match.playerB || ""}`.toLowerCase().includes(normalizedScheduledMatchSearch);
        })
        : scheduledMatches;
    const visibleScheduledMatches = filteredScheduledMatches.slice(0, maxVisibleScheduledMatches);
    const hiddenScheduledMatchCount = filteredScheduledMatches.length - visibleScheduledMatches.length;
    const wizardSteps = getWizardSteps(isSingles, props.isScheduling, isKioskScheduledMatch, hasActiveScheduledMatch);
    const totalSteps = wizardSteps.length;
    const currentStep = wizardSteps[Math.min(pageNumber - 1, totalSteps - 1)];

    async function loadScheduleMatches(preferScheduledMatches = false) {
        if (!canUseScheduledMatches) {
            return
        }

        setLoadingScheduledMatches(true)
        try {
            let matches
            let waitingFor = []
            if (props.isTeamMatch) {
                const teamMatch = await getTeamMatch(props.teamMatchID) || {};
                const submissionStatus = getTeamTieSubmissionStatus(teamMatch);
                waitingFor = teamMatch.competitionID && !submissionStatus.ready ? submissionStatus.waitingFor : [];
                const waitingForRelease = teamMatch.competitionID &&
                    submissionStatus.ready &&
                    teamMatch.teamTieStatus === "ready";
                if (waitingForRelease) {
                    waitingFor = ["Organizer"];
                }
                setTeamTieWaitingFor(waitingFor);
                setTeamTieWaitingMessage(
                    waitingForRelease ?
                        "Both teams submitted locked lineups. The organizer is releasing the matches for scoring."
                        : waitingFor.length > 0 ?
                            `${waitingFor.join(" and ")} must submit their lineup before matches can be released for scoring.`
                            : ""
                );
                matches = await getScheduledTeamMatchMatches(props.teamMatchID, { pendingOnly: true });
            }
            else {
                setTeamTieWaitingFor([]);
                setTeamTieWaitingMessage("");
                matches = await getScheduledTableMatches(props.route.params.tableID, { pendingOnly: true })
            }
            setScheduledMatches(matches)
            if (matches.length > 0 && preferScheduledMatches) {
                setShowScheduledMatches(true)
            }
            if (matches.length === 0 && !(props.isTeamMatch && waitingFor.length > 0)) {
                setShowScheduledMatches(false)
            }
            if (props.isTeamMatch && waitingFor.length > 0) {
                setShowScheduledMatches(true)
            }
        }
        finally {
            setLoadingScheduledMatches(false)
            setScheduledMatchesLoaded(true)
        }
    }

    useEffect(() => {
        setBestOfGames(props.bestOf || 5)
    }, [props.bestOf])

    useEffect(() => {
        setIsSingles(props.isDoubles !== true)
    }, [props.isDoubles])

    useEffect(() => {
        setInitialServerIsA(props.isAInitialServer === true)
    }, [props.isAInitialServer])

    useEffect(() => {
        setSelectedInitialServerPlayerField(props.initialServerPlayerField || props.currentServerPlayerField || "")
    }, [props.initialServerPlayerField, props.currentServerPlayerField])

    useEffect(() => {
        setSelectedInitialReceiverPlayerField(props.initialReceiverPlayerField || props.currentReceiverPlayerField || "")
    }, [props.initialReceiverPlayerField, props.currentReceiverPlayerField])

    useEffect(() => {
        if (canUseScheduledMatches) {
            loadScheduleMatches(props.preferScheduledMatches !== false)
        }
    }, [canUseScheduledMatches, props.preferScheduledMatches, props.route?.params?.tableID, props.teamMatchID])

    useEffect(() => {
        if (!canUseScheduledMatches || !props.isTeamMatch || !props.teamMatchID) {
            return;
        }

        const teamMatchRef = db.ref(`teamMatches/${props.teamMatchID}`);
        const handleTeamMatchUpdate = () => {
            loadScheduleMatches(true);
        };
        teamMatchRef.on("value", handleTeamMatchUpdate);

        return () => {
            teamMatchRef.off("value", handleTeamMatchUpdate);
        };
    }, [canUseScheduledMatches, props.isTeamMatch, props.teamMatchID])

    useEffect(() => {
        setPageNumber((currentPageNumber) => Math.min(currentPageNumber, totalSteps))
    }, [totalSteps])

    const disableNextButton = () => {
        if (!currentStep) {
            return true;
        }

        if (currentStep.type === "welcome") {
            if (showScheduledMatches) {
                return true
            }
            if (canUseScheduledMatches && loadingScheduledMatches && !scheduledMatchesLoaded) {
                return true
            }
        }

        if (currentStep.type === "player" && "field" in currentStep) {
            return savingCurrentPlayer || getPlayerFormatted(getPlayerForStep(currentStep.field)).length === 0;
        }

        if (currentStep.type === "colors") {
            const colorPlayerFields = getColorPlayerFields();
            return savingCurrentPlayer ||
                colorPlayerFields.length === 0 ||
                colorPlayerFields.some((playerField) => !`${getPlayerForStep(playerField)?.jerseyColor || ""}`.trim());
        }

        if (currentStep.type === "servePlayer") {
            return loadingServicePlayerOrder || selectedInitialServerPlayerField.length === 0;
        }

        if (currentStep.type === "receivePlayer") {
            return loadingServicePlayerOrder || selectedInitialReceiverPlayerField.length === 0;
        }

        if (currentStep.type === "scheduleDone" || currentStep.type === "start") {
            return true;
        }

        return false;
    };

    const { playerA, playerB, playerA2, playerB2 } = props;

    function getPlayerForStep(playerField) {
        return pendingPlayers[playerField] || props[playerField] || {};
    }

    function updatePendingPlayer(playerField, player) {
        setPendingPlayers((currentPlayers) => ({
            ...currentPlayers,
            [playerField]: player,
        }));
    }

    function getColorPlayerFields() {
        const playerFields = isSingles ? ["playerA", "playerB"] : ["playerA", "playerA2", "playerB", "playerB2"];

        return playerFields.filter((playerField) => {
            const player = getPlayerForStep(playerField);
            return getPlayerFormatted(player).length > 0 || typeof player?.id !== "undefined";
        });
    }

    function getColorPlayerTitle(playerField) {
        switch (playerField) {
            case "playerA":
                return isSingles ? "Side A" : "Side A player 1";
            case "playerA2":
                return "Side A player 2";
            case "playerB":
                return isSingles ? "Side B" : "Side B player 1";
            case "playerB2":
                return "Side B player 2";
            default:
                return "Player";
        }
    }

    function updatePlayerJerseyColor(playerField, color) {
        updatePendingPlayer(playerField, {
            ...getPlayerForStep(playerField),
            jerseyColor: color || "",
        });
    }

    async function savePlayerStep(playerStep) {
        if (!playerStep || playerStep.type !== "player" || !("field" in playerStep)) {
            return;
        }

        const player = getPlayerForStep(playerStep.field);
        if (getPlayerFormatted(player).length === 0) {
            return;
        }

        setSavingCurrentPlayer(true);
        try {
            await updateCurrentPlayer(props.matchID, playerStep.field, player);
            if (typeof props.updateMatchPlayer === "function") {
                props.updateMatchPlayer(playerStep.field, player);
            }
        }
        finally {
            setSavingCurrentPlayer(false);
        }
    }

    async function saveColorStep() {
        const colorPlayerFields = getColorPlayerFields();
        if (colorPlayerFields.length === 0) {
            return;
        }

        setSavingCurrentPlayer(true);
        try {
            await Promise.all(colorPlayerFields.map(async (playerField) => {
                const player = getPlayerForStep(playerField);
                if (getPlayerFormatted(player).length === 0 && typeof player?.id === "undefined") {
                    return;
                }

                await updateCurrentPlayer(props.matchID, playerField, player);
                if (typeof props.updateMatchPlayer === "function") {
                    props.updateMatchPlayer(playerField, player);
                }
            }));
        }
        finally {
            setSavingCurrentPlayer(false);
        }
    }

    async function moveToNextStep() {
        if (currentStep?.type === "player") {
            await savePlayerStep(currentStep);
        }
        if (currentStep?.type === "colors") {
            await saveColorStep();
        }
        setPageNumber((currentPageNumber) => Math.min(currentPageNumber + 1, totalSteps));
    }

    async function selectInitialServer(isA) {
        const serviceSideChanged = initialServerIsA !== isA;
        setInitialServerIsA(isA);
        if (serviceSideChanged) {
            setSelectedInitialServerPlayerField("");
            setSelectedInitialReceiverPlayerField("");
        }
        setLoadingMatchServer(true);
        try {
            await setInitialMatchServer(props.matchID, isA);
            if (serviceSideChanged) {
                await resetDoublesServicePlayerFields(props.matchID);
            }
            let currentScore = getCurrentGameScore(props);
            await updateService(props.matchID, isA, getCurrentGameNumber(props), currentScore.a + currentScore.b, props.changeServeEveryXPoints, props.pointsToWinGame, props.sportName, props.scoringType);
        }
        finally {
            setLoadingMatchServer(false);
        }
    }

    function renderWelcomeStep() {
        if (hasActiveScheduledMatch) {
            return (
                <WizardCard
                    title={"Scheduled match loaded"}
                    description={isKioskScheduledMatch ?
                        "This match was configured by the administrator. Confirm jersey colors, then choose the opening server and receiver."
                        : "Review the preset match settings, make any needed player or jersey color updates, then start the match."}
                    icon={<MaterialCommunityIcons name="calendar-check" size={22} color={openScoreboardColor} />}
                >
                    <View backgroundColor={"blue.50"} borderColor={"blue.100"} borderRadius={8} borderWidth={1} padding={3}>
                        <Text color={"gray.500"} fontSize={"2xs"} fontWeight={"bold"} textTransform={"uppercase"}>
                            Selected match
                        </Text>
                        <Text color={"gray.900"} fontSize={"md"} fontWeight={"bold"} marginTop={1}>
                            {getPlayerFormatted(props.playerA) || "TBD"} vs {getPlayerFormatted(props.playerB) || "TBD"}
                        </Text>
                        {props.matchRound ? (
                            <Text color={"gray.600"} fontSize={"xs"} marginTop={1}>
                                {props.matchRound}
                            </Text>
                        ) : null}
                    </View>
                </WizardCard>
            );
        }

        if (showScheduledMatches) {
            return (
                <WizardCard
                    title={i18n.t("selectMatch")}
                    description={"Choose a scheduled match to load onto this table, or search by player name."}
                    icon={<MaterialCommunityIcons name="calendar-clock" size={21} color={openScoreboardColor} />}
                >
                    {loadingScheduledMatches && !scheduledMatchesLoaded ? (
                        <View alignItems={"center"} padding={4}>
                            <Spinner color={openScoreboardColor} />
                            <Text color={"gray.600"} fontSize={"sm"} marginTop={2}>
                                Checking scheduled matches...
                            </Text>
                        </View>
                    ) : scheduledMatches.length > 0 ? (
                        <View>
                            <Input
                                backgroundColor={"white"}
                                borderColor={"gray.300"}
                                borderRadius={8}
                                fontSize={"sm"}
                                marginBottom={2}
                                minHeight={38}
                                onChangeText={setScheduledMatchSearch}
                                placeholder={"Search by player name"}
                                value={scheduledMatchSearch}
                            />
                            {filteredScheduledMatches.length > 0 ? visibleScheduledMatches.map((scheduledMatch, index) => (
                                <ScheduledMatchCompactItem
                                    key={`${scheduledMatch?.[0] || "scheduled"}-${index}`}
                                    index={index}
                                    item={scheduledMatch}
                                    onConfirm={async () => {
                                        await props.loadTableScoring(props.route.params.tableID, { preferScheduledMatches: false })
                                    }}
                                    sourceID={props.isTeamMatch ? props.teamMatchID : props.route.params.tableID}
                                    sourceType={props.isTeamMatch ? "teamMatch" : "table"}
                                    tableNumber={props.tableNumber}
                                />
                            )) : (
                                <View backgroundColor={"gray.50"} borderColor={"gray.200"} borderRadius={8} borderWidth={1} padding={3}>
                                    <Text color={"gray.700"} fontSize={"sm"} fontWeight={"bold"} textAlign={"center"}>
                                        No scheduled matches match that search.
                                    </Text>
                                </View>
                            )}
                            {hiddenScheduledMatchCount > 0 ? (
                                <Text color={"gray.500"} fontSize={"2xs"} marginTop={1}>
                                    Showing {visibleScheduledMatches.length} of {filteredScheduledMatches.length}. Search by player name to narrow the list.
                                </Text>
                            ) : null}
                            <Text color={"blue.800"} fontSize={"xs"} fontWeight={"bold"} marginTop={2}>
                                Scheduled matches are ready for this table. Select one when possible to keep the schedule accurate.
                            </Text>
                        </View>
                    ) : (
                        <View backgroundColor={"gray.50"} borderColor={"gray.200"} borderRadius={8} borderWidth={1} padding={3}>
                            {props.isTeamMatch && teamTieWaitingFor.length > 0 ? (
                                <>
                                    <MaterialCommunityIcons name="account-clock-outline" size={28} color={"#D97706"} style={{ alignSelf: "center" }} />
                                    <Text color={"gray.900"} fontSize={"sm"} fontWeight={"bold"} marginTop={2} textAlign={"center"}>
                                        Waiting for team selections
                                    </Text>
                                    <Text color={"gray.600"} fontSize={"xs"} marginTop={1} textAlign={"center"}>
                                        {teamTieWaitingMessage}
                                    </Text>
                                </>
                            ) : (
                                <Text color={"gray.700"} fontSize={"sm"} fontWeight={"bold"} textAlign={"center"}>{i18n.t("noScheduledMatches")}</Text>
                            )}
                        </View>
                    )}
                </WizardCard>
            );
        }

        return (
            <WizardCard
                title={i18n.t("welcomeNewMatch")}
                description={i18n.t("pressNextToBegin")}
                icon={<MaterialCommunityIcons name="scoreboard-outline" size={22} color={openScoreboardColor} />}
            >
                {canUseScheduledMatches && loadingScheduledMatches && !scheduledMatchesLoaded ? (
                    <View alignItems={"center"} backgroundColor={"gray.50"} borderColor={"gray.200"} borderRadius={8} borderWidth={1} flexDirection={"row"} padding={2}>
                        <Spinner color={openScoreboardColor} size={"sm"} />
                        <Text color={"gray.600"} fontSize={"xs"} marginLeft={2}>
                            Checking scheduled matches...
                        </Text>
                    </View>
                ) : null}
            </WizardCard>
        );
    }

    function renderFormatStep() {
        return (
            <WizardCard
                title={"Match format"}
                description={"Choose the player format and match length."}
                icon={<MaterialCommunityIcons name="format-list-checks" size={22} color={openScoreboardColor} />}
            >
                <Text color={"gray.700"} fontSize={"sm"} fontWeight={"bold"} marginBottom={2}>{i18n.t("playingSinglesOrDoubles")}</Text>
                {hasActiveScheduledMatch ? (
                    <View
                        alignItems={"center"}
                        backgroundColor={"amber.50"}
                        borderColor={"amber.200"}
                        borderRadius={8}
                        borderWidth={1}
                        flexDirection={"row"}
                        marginBottom={2}
                        padding={2}
                    >
                        <MaterialCommunityIcons name="lock-outline" size={16} color={"#92400E"} />
                        <Text color={"amber.800"} flex={1} fontSize={"xs"} fontWeight={"bold"} marginLeft={2}>
                            Match format is locked by the schedule.
                        </Text>
                    </View>
                ) : null}
                <View flexDirection={"row"} marginBottom={2}>
                    <View flex={1} marginRight={1}>
                        <CompactOptionButton
                            icon={(color) => <FontAwesome5 name="user" size={17} color={color} />}
                            isDisabled={hasActiveScheduledMatch}
                            label={i18n.t("singles")}
                            selected={isSingles}
                            onPress={() => {
                                setIsSingles(true);
                                clearPlayer(props.matchID, "playerA2");
                                clearPlayer(props.matchID, "playerB2");
                                setSelectedInitialServerPlayerField("");
                                setSelectedInitialReceiverPlayerField("");
                                resetDoublesServicePlayerFields(props.matchID);
                                setPendingPlayers((currentPlayers) => {
                                    const nextPlayers = { ...currentPlayers };
                                    delete nextPlayers.playerA2;
                                    delete nextPlayers.playerB2;
                                    return nextPlayers;
                                });
                                setIsDoubles(props.matchID, false)
                            }}
                        />
                    </View>
                    <View flex={1} marginLeft={1}>
                        <CompactOptionButton
                            icon={(color) => <FontAwesome5 name="user-friends" size={17} color={color} />}
                            isDisabled={hasActiveScheduledMatch}
                            label={i18n.t("doubles")}
                            selected={!isSingles}
                            onPress={() => {
                                setIsSingles(false);
                                setIsDoubles(props.matchID, true)
                            }}
                        />
                    </View>
                </View>

                <Text color={"gray.700"} fontSize={"sm"} fontWeight={"bold"} marginBottom={2} marginTop={2}>{i18n.t("winBestOf")}</Text>
                <View flexDirection={"row"}>
                    {bestOfOptions.map((option) => (
                        <View key={`best-of-${option}`} flex={1} marginRight={option === bestOfOptions[bestOfOptions.length - 1] ? 0 : 1}>
                            <CompactOptionButton
                                label={`${option}`}
                                selected={bestOfGames === option}
                                onPress={() => {
                                    setBestOfGames(option)
                                    setBestOf(props.matchID, option)
                                }}
                            />
                        </View>
                    ))}
                </View>

            </WizardCard>
        );
    }

    function renderRoundStep() {
        return (
            <WizardCard
                title={"Match Round (optional)"}
                description={"Add a round label like SF, QF, Final, Group Stage, or skip this step."}
                icon={<MaterialCommunityIcons name="tournament" size={22} color={openScoreboardColor} />}
            >
                <MatchRoundSearchSelect
                    value={matchRound}
                    onChange={(round) => {
                        setMatchRound(round)
                        setRoundName(props.matchID, round)
                    }}
                />
            </WizardCard>
        );
    }

    function renderPlayerStep(playerStep) {
        return (
            <WizardCard
                title={playerStep.title}
                description={playerStep.description}
                icon={<FontAwesome5 name="users" size={19} color={openScoreboardColor} />}
            >
                <WizardPlayerSelector
                    matchProps={props}
                    onChangePlayer={updatePendingPlayer}
                    playerField={playerStep.field}
                    selectedPlayer={getPlayerForStep(playerStep.field)}
                />
            </WizardCard>
        );
    }

    function renderColorStep() {
        const colorPlayerFields = getColorPlayerFields();
        const missingColorCount = colorPlayerFields.filter((playerField) => !`${getPlayerForStep(playerField)?.jerseyColor || ""}`.trim()).length;

        return (
            <WizardCard
                title={"Jersey colors"}
                description={"These colors tint the scoring sides. Scheduled players stay locked, but the jersey colors can still be changed."}
                icon={<MaterialCommunityIcons name="palette-outline" size={22} color={openScoreboardColor} />}
            >
                <View
                    backgroundColor={missingColorCount > 0 ? "amber.50" : "green.50"}
                    borderColor={missingColorCount > 0 ? "amber.200" : "green.200"}
                    borderRadius={8}
                    borderWidth={1}
                    marginBottom={3}
                    padding={3}
                >
                    <Text color={missingColorCount > 0 ? "amber.900" : "green.800"} fontSize={"xs"} fontWeight={"bold"}>
                        {missingColorCount > 0 ?
                            "Choose jersey colors before scoring so the table display uses the right background colors."
                            : "Jersey colors are ready for this match."}
                    </Text>
                </View>
                {colorPlayerFields.map((playerField) => (
                    <JerseyColorAssignmentCard
                        key={playerField}
                        matchProps={props}
                        onSelectColor={(color) => updatePlayerJerseyColor(playerField, color)}
                        player={getPlayerForStep(playerField)}
                        playerField={playerField}
                        title={getColorPlayerTitle(playerField)}
                    />
                ))}
            </WizardCard>
        );
    }

    function renderServeStep() {
        const playerNames = getCombinedPlayerNames(playerA, playerB, playerA2, playerB2);

        return (
            <WizardCard
                title={"Who serves first?"}
                description={"Choose the side that will start serving this match."}
                icon={<FontAwesome5 name="table-tennis" size={20} color={openScoreboardColor} />}
            >
                <Text color={"gray.900"} fontSize={"lg"} fontWeight={"bold"} marginBottom={3}>
                    {i18n.t("whoServeFirst")}
                </Text>
                <View flexDirection={"row"} justifyContent={"space-between"}>
                    <View width={"49%"}>
                        <ServerChoiceCard
                            isDisabled={loadingMatchServer}
                            label={playerNames.a || "Player A"}
                            onPress={() => selectInitialServer(true)}
                            selected={initialServerIsA}
                            sideLabel={"Side A"}
                        />
                    </View>
                    <View width={"49%"}>
                        <ServerChoiceCard
                            isDisabled={loadingMatchServer}
                            label={playerNames.b || "Player B"}
                            onPress={() => selectInitialServer(false)}
                            selected={!initialServerIsA}
                            sideLabel={"Side B"}
                        />
                    </View>
                </View>
                <View alignItems={"center"} height={5} justifyContent={"center"} marginTop={2}>
                    {loadingMatchServer ? (
                        <Text color={"gray.500"} fontSize={"2xs"} textAlign={"center"}>
                            Saving server...
                        </Text>
                    ) : null}
                </View>
            </WizardCard>
        );
    }

    function getDoublesPlayerFieldsForSide(isASide) {
        return isASide ? ["playerA", "playerA2"] : ["playerB", "playerB2"];
    }

    function getPlayerFieldLabel(playerField) {
        switch (playerField) {
            case "playerA":
                return "Player 1A";
            case "playerA2":
                return "Player 2A";
            case "playerB":
                return "Player 1B";
            case "playerB2":
                return "Player 2B";
            default:
                return "Player";
        }
    }

    function getPlayerNameForField(playerField) {
        return getPlayerFormatted(getPlayerForStep(playerField)) || getPlayerFieldLabel(playerField);
    }

    async function selectInitialServerPlayer(playerField) {
        setSelectedInitialServerPlayerField(playerField);
        setLoadingServicePlayerOrder(true);
        try {
            await setInitialServerPlayerField(props.matchID, playerField);
        }
        finally {
            setLoadingServicePlayerOrder(false);
        }
    }

    async function selectInitialReceiverPlayer(playerField) {
        setSelectedInitialReceiverPlayerField(playerField);
        setLoadingServicePlayerOrder(true);
        try {
            await setInitialReceiverPlayerField(props.matchID, playerField);
        }
        finally {
            setLoadingServicePlayerOrder(false);
        }
    }

    function renderServePlayerStep() {
        const servingPlayerFields = getDoublesPlayerFieldsForSide(initialServerIsA);

        return (
            <WizardCard
                title={"Which player serves first?"}
                description={"Choose the doubles player who starts the match from the right side."}
                icon={<MaterialCommunityIcons name="table-tennis" size={22} color={openScoreboardColor} />}
            >
                <View flexDirection={"row"} justifyContent={"space-between"}>
                    {servingPlayerFields.map((playerField, index) => (
                        <View key={`initial-server-${playerField}`} width={"49%"}>
                            <ServerChoiceCard
                                isDisabled={loadingServicePlayerOrder}
                                label={getPlayerNameForField(playerField)}
                                onPress={() => selectInitialServerPlayer(playerField)}
                                selected={selectedInitialServerPlayerField === playerField}
                                sideLabel={`Server ${index + 1}`}
                            />
                        </View>
                    ))}
                </View>
                <View alignItems={"center"} height={5} justifyContent={"center"} marginTop={2}>
                    {loadingServicePlayerOrder ? (
                        <Text color={"gray.500"} fontSize={"2xs"} textAlign={"center"}>
                            Saving serving player...
                        </Text>
                    ) : null}
                </View>
            </WizardCard>
        );
    }

    function renderReceivePlayerStep() {
        const receivingPlayerFields = getDoublesPlayerFieldsForSide(!initialServerIsA);

        return (
            <WizardCard
                title={"Who receives first?"}
                description={"Choose the opponent who receives the first serve."}
                icon={<MaterialCommunityIcons name="arrow-decision-outline" size={22} color={openScoreboardColor} />}
            >
                <View flexDirection={"row"} justifyContent={"space-between"}>
                    {receivingPlayerFields.map((playerField, index) => (
                        <View key={`initial-receiver-${playerField}`} width={"49%"}>
                            <ServerChoiceCard
                                isDisabled={loadingServicePlayerOrder}
                                label={getPlayerNameForField(playerField)}
                                onPress={() => selectInitialReceiverPlayer(playerField)}
                                selected={selectedInitialReceiverPlayerField === playerField}
                                sideLabel={`Receiver ${index + 1}`}
                            />
                        </View>
                    ))}
                </View>
                <View alignItems={"center"} height={5} justifyContent={"center"} marginTop={2}>
                    {loadingServicePlayerOrder ? (
                        <Text color={"gray.500"} fontSize={"2xs"} textAlign={"center"}>
                            Saving receiving player...
                        </Text>
                    ) : null}
                </View>
            </WizardCard>
        );
    }

    function renderWarmupStep() {
        return (
            <WizardCard
                title={"Warmup (optional)"}
                description={"Start a two-minute warmup timer, or press Next to skip."}
                icon={<Ionicons name="timer-outline" size={22} color={openScoreboardColor} />}
            >
                <View>
                    {showWarmUpTimer ?
                        <View alignItems={"center"} backgroundColor={"gray.50"} borderColor={"gray.200"} borderRadius={8} borderWidth={1} justifyContent="center" padding={3}>
                            <CountDownTimerText fontSize={"5xl"} startTime={warmUpStartTimeCounter} isOpen={showWarmUpTimer} counterStart={120} onFinish={() => {
                                stop2MinuteWarmUp(props.matchID);
                                setShowWarmUpTimer(false);
                            }}></CountDownTimerText>
                        </View>
                        :
                        <ChoiceButton
                            icon={(color) => <Ionicons name="timer-outline" size={21} color={color} />}
                            isDisabled={props.isWarmUpFinished}
                            label={props.isWarmUpFinished ? i18n.t("warmUpComplete") : i18n.t("startTwoMinuteWarmUp")}
                            selected={!props.isWarmUpFinished}
                            onPress={() => {
                                setShowWarmUpTimer(true);
                                setWarmUpStartTimeCounter(new Date());
                                start2MinuteWarmUp(props.matchID);

                            }}
                        />
                    }
                </View>
            </WizardCard>
        );
    }

    function renderSchedulingDoneStep() {
        return (
            <WizardCard
                title={i18n.t("allDoneScheduling")}
                description={"Save this scheduled match setup for the table."}
                icon={<MaterialCommunityIcons name="calendar-check" size={22} color={openScoreboardColor} />}
            >
                <ScoringGradientButton
                    onPress={async () => {
                        setLoadingScheduledMatch(true)
                        await updateScheduledMatch(props.route.params.tableID, props.scheduledMatchID, props.matchID, props.schedMatchStartTime)
                        props.onClose(true);
                        setPageNumber(1)
                        setLoadingScheduledMatch(false)
                    }}
                    style={{ minHeight: 46 }}
                >
                    {
                        showLoadingScheduledMatch ?
                            <Spinner color={openScoreboardButtonTextColor}></Spinner>
                            :
                            <Text color={openScoreboardButtonTextColor} fontWeight={"bold"}>{i18n.t("done")}</Text>
                    }

                </ScoringGradientButton>
            </WizardCard>
        );
    }

    function renderStartStep() {
        return (
            <WizardCard
                title={"Ready to score"}
                description={"Start the first game with these match settings."}
                icon={<MaterialCommunityIcons name="play-circle-outline" size={24} color={openScoreboardColor} />}
            >
                <ScoringGradientButton
                    onPress={() => {
                        startGame(props.matchID, getCurrentGameNumber(props));
                        updateService(props.matchID, initialServerIsA, 1, 0, props.changeServeEveryXPoints, props.pointsToWinGame, props.sportName, props.scoringType);
                        props.onClose();
                        setPageNumber(1)
                    }}
                    style={{ minHeight: 54 }}
                    contentStyle={{ flexDirection: "row" }}
                >
                    <View alignItems={"center"} flexDirection={"row"}>
                        <Ionicons name="play" size={20} color={openScoreboardButtonTextColor} />
                        <Text color={openScoreboardButtonTextColor} fontSize={"md"} fontWeight={"bold"} marginLeft={2}>{i18n.t("startGame")}</Text>
                    </View>
                </ScoringGradientButton>
            </WizardCard>
        );
    }

    function getLeftButtonLabel() {
        if (showScheduledMatches) {
            return "Set up manually";
        }
        if (pageNumber === 1 && canUseScheduledMatches && hasScheduledMatches) {
            return i18n.t("scheduled");
        }

        return i18n.t("back");
    }

    function shouldShowLeftButton() {
        if (showScheduledMatches) {
            return true;
        }
        if (pageNumber > 1) {
            return true;
        }
        return pageNumber === 1 && canUseScheduledMatches && hasScheduledMatches;
    }

    function onLeftButtonPress() {
        if (showScheduledMatches) {
            setShowScheduledMatches(false)
            return
        }
        else if (pageNumber === 1 && canUseScheduledMatches && hasScheduledMatches) {
            setShowScheduledMatches(true)
            return
        }

        setPageNumber(pageNumber > 1 ? pageNumber - 1 : pageNumber);
    }

    return (
        <>
            <WizardProgress pageNumber={pageNumber} totalSteps={totalSteps} />
            {currentStep?.type === "welcome" ? renderWelcomeStep() : null}
            {currentStep?.type === "format" ? renderFormatStep() : null}
            {currentStep?.type === "round" ? renderRoundStep() : null}
            {currentStep?.type === "player" ? renderPlayerStep(currentStep) : null}
            {currentStep?.type === "colors" ? renderColorStep() : null}
            {currentStep?.type === "serve" ? renderServeStep() : null}
            {currentStep?.type === "servePlayer" ? renderServePlayerStep() : null}
            {currentStep?.type === "receivePlayer" ? renderReceivePlayerStep() : null}
            {currentStep?.type === "warmup" ? renderWarmupStep() : null}
            {currentStep?.type === "scheduleDone" ? renderSchedulingDoneStep() : null}
            {currentStep?.type === "start" ? renderStartStep() : null}

            <Divider marginY={3}></Divider>
            <View alignItems={"center"} flexDirection={"row"} flexShrink={0}>
                {shouldShowLeftButton() ? (
                    <View paddingRight={1} flexBasis={0} flexGrow={1} flexShrink={1}>
                        <FooterButton onPress={onLeftButtonPress}>
                            {getLeftButtonLabel()}
                        </FooterButton>
                    </View>
                ) : null}
                <View paddingLeft={shouldShowLeftButton() ? 1 : 0} flexBasis={0} flexGrow={1} flexShrink={1}>
                    <FooterButton
                        isPrimary
                        isDisabled={disableNextButton()}
                        onPress={async () => {
                            await moveToNextStep();
                        }}
                    >
                        {savingCurrentPlayer ? "Saving..." : i18n.t("next")}
                    </FooterButton>
                </View>
            </View>
        </>
    )

}

export function MatchSetupWizard(props) {


    return (
        <Modal
            closeOnOverlayClick={false}
            isKeyboardDismissable={false}
            isOpen={props.isOpen}
            onClose={props.onClose}
        >
            <Modal.Content maxWidth={640} width={"95%"}>
                <Modal.Header>{i18n.t("matchSetup")}</Modal.Header>
                <Modal.Body padding={3}>
                    <MatchSetup {...props} />
                </Modal.Body>

            </Modal.Content>
        </Modal>
    );
}
