import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable } from 'react-native';
import { Button, FormControl, NativeBaseProvider, ScrollView, Select, Spinner, Text, View } from 'native-base';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import db from '../database';
import { openScoreboardButtonTextColor, openScoreboardColor, openScoreboardTheme } from '../openscoreboardtheme';
import LoadingPage from './LoadingPage';
import Unauthorized from './Unauthorized';
import { getCompetition, subscribeToCompetition } from './functions/competitions';
import {
    advanceTeamTieLineupCheckpointFromProgress,
    getDuplicateLineupPlayerIDs,
    getRequiredLineupCodes,
    getTeamCompetitionContests,
    getTeamPlayerOptions,
    getTeamTieSubmissionStatus,
    saveTeamTieSideSubmission,
    subscribeToTeamTieSideSelection,
} from './functions/teamCompetitions';
import { formatTeamTieRuleSummary, normalizeTeamTieFormat } from './functions/teamTieFormats';
import { getTeam, validateTeamManagerPassword } from './functions/teams';

function SubmissionStatus({ ready, side }) {
    return (
        <View alignItems={"center"} flexDirection={"row"}>
            <View backgroundColor={ready ? "green.500" : "yellow.400"} borderRadius={8} height={"9px"} marginRight={2} width={"9px"} />
            <Text color={"gray.600"} fontSize={"2xs"} fontWeight={"bold"}>
                Team {side} {ready ? "submitted" : "waiting"}
            </Text>
        </View>
    );
}

function LineupField({ code, isDisabled, onChange, players, selectedPlayerIDs, value }) {
    return (
        <FormControl marginBottom={2} width={{ base: "100%", md: "48.5%" }}>
            <FormControl.Label>Position {code}</FormControl.Label>
            <Select isDisabled={isDisabled} placeholder={`Choose player for ${code}`} selectedValue={value || ""} onValueChange={onChange}>
                {players.map((player) => (
                    <Select.Item
                        isDisabled={player.id !== value && selectedPlayerIDs.includes(player.id)}
                        key={`${code}-${player.id}`}
                        label={player.id !== value && selectedPlayerIDs.includes(player.id) ? `${player.label} - already assigned` : player.label}
                        value={player.id}
                    />
                ))}
            </Select>
        </FormControl>
    );
}

function OptionalPositionField({ codeOptions, isDisabled, label, lineup, onChange, players, value }) {
    return (
        <FormControl marginBottom={2} width={{ base: "100%", md: "48.5%" }}>
            <FormControl.Label>{label}</FormControl.Label>
            <Select
                isDisabled={isDisabled}
                placeholder={"Choose position"}
                selectedValue={value || ""}
                onValueChange={onChange}
            >
                {codeOptions.map((code) => {
                    const playerID = lineup[code];
                    const player = players.find((nextPlayer) => nextPlayer.id === playerID);
                    return (
                        <Select.Item
                            key={code}
                            label={player ? `${code} - ${player.label}` : `${code} - Player not assigned`}
                            value={code}
                        />
                    );
                })}
            </Select>
        </FormControl>
    );
}

function getTeamTieStatus(teamMatch, format, scoreA, scoreB) {
    if (
        teamMatch?.isComplete === true ||
        teamMatch?.teamTieStatus === "complete" ||
        scoreA >= format.gamesToWin ||
        scoreB >= format.gamesToWin
    ) {
        return { color: "green.700", label: "Complete" };
    }
    if (teamMatch?.teamTieStatus === "active" || scoreA > 0 || scoreB > 0) {
        return { color: "blue.700", label: "In progress" };
    }
    if (teamMatch?.teamTieStatus === "waiting-lineups") {
        return { color: "orange.700", label: "Waiting for lineups" };
    }
    if (teamMatch?.teamTieStatus === "ready") {
        return { color: "blue.700", label: "Lineups ready" };
    }
    return { color: "gray.600", label: "Scheduled" };
}

function formatGameScores(gameScores) {
    if (!Array.isArray(gameScores) || gameScores.length === 0) {
        return "";
    }

    return gameScores.map((gameScore, index) => {
        const scoreA = Number(gameScore?.a ?? gameScore?.AScore ?? gameScore?.scoreA) || 0;
        const scoreB = Number(gameScore?.b ?? gameScore?.BScore ?? gameScore?.scoreB) || 0;
        return `G${index + 1}: ${scoreA}-${scoreB}`;
    }).join("  ");
}

function PlayerMatchResultRow({ match, format }) {
    const isComplete = match?.isComplete === true || match?.status === "complete" || match?.status === "resolved";
    const isActive = match?.status === "active" || match?.isActive === true;
    const playerLabel = match?.lineupPending ?
        formatTeamTieRuleSummary(format.rules.find((rule) => rule.id === match.teamTieRuleID))
        : `${match?.playerA || "TBD"} vs ${match?.playerB || "TBD"}`;
    const assignedTables: any[] = Object.values(match?.tableAssignments || {});
    const tableLabel = match?.claim?.tableID ?
        assignedTables.find((assignment) => assignment?.tableID === match.claim.tableID)?.tableName || match.assignedTableName || "Table"
        : assignedTables.length > 0 ?
            assignedTables.map((assignment) => assignment?.tableName || "Table").join(", ")
            : match?.assignedTableName || "";
    const gameScoreLabel = formatGameScores(match?.gameScores);
    const statusLabel = match?.status === "cancelled" ? "Not needed" :
        isComplete ? "Complete" :
            isActive ? tableLabel ? `Playing on ${tableLabel}` : "Playing" :
                match?.lineupPending ? "Waiting for lineup" :
                    tableLabel ? `Scheduled on ${tableLabel}` : "Ready";

    return (
        <View borderTopColor={"gray.100"} borderTopWidth={1} paddingY={3}>
            <View alignItems={"center"} flexDirection={"row"}>
                <View flex={1} paddingRight={3}>
                    <Text color={"gray.500"} fontSize={"2xs"} fontWeight={"bold"} textTransform={"uppercase"}>
                        {match?.matchRound || `Match ${match?.order || ""}`}
                    </Text>
                    <Text color={"gray.900"} fontSize={"sm"} fontWeight={"bold"} marginTop={1}>
                        {playerLabel}
                    </Text>
                </View>
                {!match?.lineupPending && (isComplete || isActive) ? (
                    <Text color={"gray.900"} fontSize={"lg"} fontWeight={"bold"}>
                        {Number(match?.AScore) || 0}-{Number(match?.BScore) || 0}
                    </Text>
                ) : null}
            </View>
            <Text
                color={isComplete ? "green.700" : isActive ? "blue.700" : match?.lineupPending ? "orange.700" : "gray.600"}
                fontSize={"2xs"}
                fontWeight={"bold"}
                marginTop={1}
            >
                {statusLabel}
            </Text>
            {gameScoreLabel ? (
                <Text color={"gray.500"} fontSize={"2xs"} marginTop={1}>{gameScoreLabel}</Text>
            ) : null}
        </View>
    );
}

function TeamContestSubmissionCard({ accessToken, competitionRecord, contest, team, teamMatch, onStatus }) {
    const side = contest.teamAID === team.id ? "A" : "B";
    const [expanded, setExpanded] = useState(true);
    const [lineup, setLineup] = useState<any>({});
    const [matchCodeSelections, setMatchCodeSelections] = useState<any>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        return subscribeToTeamTieSideSelection(
            contest.match.teamMatchID,
            side,
            accessToken,
            (selection) => {
                setLineup(selection.lineup || {});
                setMatchCodeSelections(selection.matchCodeSelections || {});
            }
        );
    }, [accessToken, contest.match.teamMatchID, side]);

    const format = normalizeTeamTieFormat(teamMatch?.teamTieFormat);
    const checkpoint = Math.max(1, Number(teamMatch?.lineupCheckpoint) || 1);
    const previousCheckpointRef = useRef(checkpoint);
    const codes = getRequiredLineupCodes(format, checkpoint)[side === "A" ? "sideA" : "sideB"];
    const previousCodes = [...new Set<string>(
        format.rules
            .filter((rule) => rule.checkpoint < checkpoint)
            .flatMap((rule) => rule[side === "A" ? "sideAOptions" : "sideBOptions"].flat())
    )];
    const newCodes = codes.filter((code) => !previousCodes.includes(code));
    const editableCodes = codes.filter((code) => newCodes.includes(code) || !lineup[code]);
    const players = getTeamPlayerOptions(team);
    const submissionStatus = getTeamTieSubmissionStatus(teamMatch);
    const ownReady = side === "A" ? submissionStatus.teamAReady : submissionStatus.teamBReady;
    const opponentReady = side === "A" ? submissionStatus.teamBReady : submissionStatus.teamAReady;
    const sideKey = side === "A" ? "sideA" : "sideB";
    const availableRules = format.rules.filter((rule) => rule.checkpoint === checkpoint);
    const isLocked = ownReady || ["scheduled", "active", "complete"].includes(teamMatch?.teamTieStatus);
    const selectedPlayerIDs = codes.map((code) => lineup[code]).filter(Boolean);
    const duplicatePlayerIDs = getDuplicateLineupPlayerIDs(lineup, codes);
    const scoreA = Number(teamMatch?.teamAScore ?? contest?.match?.AScore) || 0;
    const scoreB = Number(teamMatch?.teamBScore ?? contest?.match?.BScore) || 0;
    const ownScore = side === "A" ? scoreA : scoreB;
    const opponentScore = side === "A" ? scoreB : scoreA;
    const opponentName = side === "A" ? contest.teamBName : contest.teamAName;
    const tieStatus = getTeamTieStatus(teamMatch, format, scoreA, scoreB);
    const playerMatches = Object.entries(teamMatch?.scheduledMatches || {})
        .map(([scheduledMatchID, match]: any) => ({ ...match, scheduledMatchID }))
        .sort((firstMatch, secondMatch) => Number(firstMatch?.order || 0) - Number(secondMatch?.order || 0));
    const archivedMatchIDs = new Set(playerMatches.map((match) => match.matchID).filter(Boolean));
    const legacyHistory = Object.entries(teamMatch?.archivedMatches || {})
        .map(([archivedMatchID, match]: any) => ({ ...match, archivedMatchID }))
        .filter((match) => !archivedMatchIDs.has(match.matchID))
        .sort((firstMatch, secondMatch) => {
            return new Date(firstMatch.archivedOn || 0).getTime() - new Date(secondMatch.archivedOn || 0).getTime();
        });
    const activePlayerMatch = playerMatches.find((match) => match.status === "active" || match.isActive === true);

    useEffect(() => {
        if (checkpoint > previousCheckpointRef.current) {
            setExpanded(true);
        }
        previousCheckpointRef.current = checkpoint;
    }, [checkpoint]);

    function updateLineupPlayer(code, playerID) {
        const existingCode = codes.find((nextCode) => nextCode !== code && lineup[nextCode] === playerID);
        if (existingCode) {
            onStatus(`That player is already assigned to position ${existingCode}. Choose a different player for ${code}.`, "error");
            return;
        }
        setLineup((currentLineup) => ({ ...currentLineup, [code]: playerID }));
    }

    function updateMatchSelection(ruleID, slotIndex, code) {
        setMatchCodeSelections((currentSelections) => {
            const ruleSelections = currentSelections[ruleID] || {};
            const sideSelections = [...(ruleSelections[sideKey] || [])];
            sideSelections[slotIndex] = code;
            return {
                ...currentSelections,
                [ruleID]: {
                    ...ruleSelections,
                    [sideKey]: sideSelections,
                },
            };
        });
    }

    async function saveSubmission(isReady) {
        if (duplicatePlayerIDs.length > 0) {
            onStatus("Each player can only be assigned to one lineup position. Replace the duplicate selection before saving.", "error");
            return;
        }
        if (isReady && codes.some((code) => !lineup[code])) {
            onStatus("Assign a player to every required lineup position before submitting.", "error");
            return;
        }
        const missingMatchChoice = availableRules.some((rule) => {
            const optionsForSide = rule[`${sideKey}Options`];
            const ruleSelections = matchCodeSelections[rule.id]?.[sideKey] || [];
            return optionsForSide.some((options, slotIndex) => {
                return options.length > 1 && !options.includes(ruleSelections[slotIndex]);
            });
        });
        if (isReady && missingMatchChoice) {
            onStatus("Choose a player position for every flexible matchup before submitting.", "error");
            return;
        }

        setSaving(true);
        try {
            await saveTeamTieSideSubmission({
                accessToken,
                isReady,
                lineup,
                matchCodeSelections,
                side,
                teamID: team.id,
                teamMatchID: contest.match.teamMatchID,
            });
            onStatus(isReady ? "Lineup submitted to the competition." : "Lineup draft saved.", "success");
        }
        catch (error) {
            onStatus(error?.message || "The lineup could not be saved.", "error");
        }
        finally {
            setSaving(false);
        }
    }

    return (
        <View backgroundColor={"white"} borderColor={"gray.200"} borderRadius={8} borderWidth={1} marginBottom={3} overflow={"hidden"}>
            <Pressable
                onPress={() => setExpanded((currentValue) => !currentValue)}
                style={({ pressed }) => ({
                    backgroundColor: pressed ? "#F8FAFC" : "#FFFFFF",
                    opacity: pressed ? 0.84 : 1,
                    padding: 14,
                })}
            >
                <View alignItems={"center"} flexDirection={"row"}>
                    <View flex={1} paddingRight={3}>
                        <Text color={"gray.500"} fontSize={"2xs"} fontWeight={"bold"} textTransform={"uppercase"}>
                            {contest.roundLabel}
                        </Text>
                        <Text color={"gray.900"} fontSize={"md"} fontWeight={"bold"}>
                            {contest.teamAName} <Text color={"gray.400"}>vs</Text> {contest.teamBName}
                        </Text>
                        <Text color={"blue.700"} fontSize={"2xs"} fontWeight={"bold"} marginTop={1}>
                            {ownScore}-{opponentScore} vs {opponentName} - {tieStatus.label}
                        </Text>
                        <View flexDirection={"row"} flexWrap={"wrap"} marginTop={2}>
                            <View marginRight={3}><SubmissionStatus ready={ownReady} side={side} /></View>
                            <SubmissionStatus ready={opponentReady} side={side === "A" ? "B" : "A"} />
                        </View>
                    </View>
                    <MaterialCommunityIcons name={expanded ? "chevron-up" : "chevron-down"} size={22} color={"#4B5563"} />
                </View>
            </Pressable>

            {expanded ? (
                <View backgroundColor={"gray.50"} borderTopColor={"gray.100"} borderTopWidth={1} padding={4}>
                    <View backgroundColor={"white"} borderColor={"gray.200"} borderRadius={8} borderWidth={1} marginBottom={4} padding={4}>
                        <View alignItems={"center"} flexDirection={"row"}>
                            <View flex={1}>
                                <Text color={"gray.500"} fontSize={"2xs"} fontWeight={"bold"} textTransform={"uppercase"}>Team tie score</Text>
                                <Text color={"gray.900"} fontSize={"md"} fontWeight={"bold"} marginTop={1}>{contest.teamAName}</Text>
                                <Text color={"gray.900"} fontSize={"md"} fontWeight={"bold"} marginTop={1}>{contest.teamBName}</Text>
                            </View>
                            <View alignItems={"flex-end"}>
                                <Text color={"gray.900"} fontSize={"2xl"} fontWeight={"bold"}>{scoreA}</Text>
                                <Text color={"gray.900"} fontSize={"2xl"} fontWeight={"bold"}>{scoreB}</Text>
                            </View>
                        </View>
                        <View alignItems={"center"} borderTopColor={"gray.100"} borderTopWidth={1} flexDirection={"row"} marginTop={3} paddingTop={3}>
                            <Text color={tieStatus.color} flex={1} fontSize={"xs"} fontWeight={"bold"}>{tieStatus.label}</Text>
                            <Text color={"gray.500"} fontSize={"2xs"}>First to {format.gamesToWin}</Text>
                        </View>
                        {competitionRecord ? (
                            <Text color={"gray.600"} fontSize={"xs"} marginTop={2}>
                                Competition record: {competitionRecord.wins}-{competitionRecord.losses} - {competitionRecord.pointsFor}-{competitionRecord.pointsAgainst} in team ties
                            </Text>
                        ) : null}
                    </View>

                    <View backgroundColor={"white"} borderColor={"gray.200"} borderRadius={8} borderWidth={1} marginBottom={4} paddingX={4} paddingTop={3}>
                        <View alignItems={"center"} flexDirection={"row"} paddingBottom={3}>
                            <Text color={"gray.900"} flex={1} fontSize={"sm"} fontWeight={"bold"}>Player matches</Text>
                            <Text color={activePlayerMatch ? "blue.700" : "gray.500"} fontSize={"2xs"} fontWeight={"bold"}>
                                {activePlayerMatch ? "Match in progress" : `${playerMatches.filter((match) => match.isComplete === true || match.status === "complete").length} complete`}
                            </Text>
                        </View>
                        {activePlayerMatch ? (
                            <View backgroundColor={"blue.50"} borderColor={"blue.100"} borderRadius={6} borderWidth={1} marginBottom={2} padding={3}>
                                <Text color={"blue.700"} fontSize={"2xs"} fontWeight={"bold"} textTransform={"uppercase"}>Current player match</Text>
                                <View alignItems={"center"} flexDirection={"row"} marginTop={1}>
                                    <Text color={"blue.900"} flex={1} fontSize={"sm"} fontWeight={"bold"}>
                                        {activePlayerMatch.playerA || "TBD"} vs {activePlayerMatch.playerB || "TBD"}
                                    </Text>
                                    <Text color={"blue.900"} fontSize={"lg"} fontWeight={"bold"}>
                                        {Number(activePlayerMatch.AScore) || 0}-{Number(activePlayerMatch.BScore) || 0}
                                    </Text>
                                </View>
                            </View>
                        ) : null}
                        {playerMatches.length > 0 ? playerMatches.map((match) => (
                            <PlayerMatchResultRow key={match.scheduledMatchID} format={format} match={match} />
                        )) : (
                            <Text color={"gray.600"} fontSize={"xs"} paddingBottom={3}>
                                Player matches will appear after the team tie is generated.
                            </Text>
                        )}
                        {legacyHistory.map((match) => (
                            <PlayerMatchResultRow
                                key={match.archivedMatchID}
                                format={format}
                                match={{ ...match, isComplete: true, status: "complete" }}
                            />
                        ))}
                    </View>

                    <Text color={"gray.900"} fontSize={"sm"} fontWeight={"bold"}>
                        {checkpoint === 1 ? `Opening lineup - Team ${side}` : `Stage ${checkpoint} selections - Team ${side}`}
                    </Text>
                    <Text color={"gray.600"} fontSize={"xs"} marginBottom={3}>
                        {isLocked ?
                            ownReady && teamMatch?.teamTieStatus === "waiting-lineups" ?
                                "Your lineup is locked and hidden from the opposing team until they submit their lineup."
                                : ownReady && teamMatch?.teamTieStatus === "ready" ?
                                    "Both teams submitted locked lineups. Selections remain hidden until the organizer releases the matchups."
                                : `Lineup stage ${checkpoint} is locked because both selections have been released.`
                            : checkpoint === 1 ?
                                "Assign roster players to the opening lineup positions."
                                : "Keep the earlier lineup positions and make the new selections required for this stage."}
                    </Text>
                    {!isLocked ? (
                        <View backgroundColor={"blue.50"} borderColor={"blue.100"} borderRadius={8} borderWidth={1} marginBottom={3} padding={3}>
                            <Text color={"blue.900"} fontSize={"xs"} fontWeight={"bold"}>
                                Blind submission
                            </Text>
                            <Text color={"blue.800"} fontSize={"2xs"} marginTop={1}>
                                The opposing team cannot view these selections before submitting its own locked lineup.
                            </Text>
                        </View>
                    ) : null}
                    {checkpoint > 1 && previousCodes.length > 0 ? (
                        <View backgroundColor={"white"} borderColor={"gray.200"} borderRadius={8} borderWidth={1} marginBottom={3} padding={3}>
                            <Text color={"gray.500"} fontSize={"2xs"} fontWeight={"bold"} textTransform={"uppercase"}>Earlier lineup positions</Text>
                            <View flexDirection={"row"} flexWrap={"wrap"} marginTop={2}>
                                {previousCodes.map((code) => {
                                    const player = players.find((nextPlayer) => nextPlayer.id === lineup[code]);
                                    return (
                                        <View
                                            key={code}
                                            backgroundColor={"gray.50"}
                                            borderColor={"gray.200"}
                                            borderRadius={6}
                                            borderWidth={1}
                                            marginBottom={2}
                                            marginRight={2}
                                            paddingX={3}
                                            paddingY={2}
                                        >
                                            <Text color={"gray.900"} fontSize={"xs"} fontWeight={"bold"}>
                                                {code} - {player?.label || "Not assigned"}
                                            </Text>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>
                    ) : null}
                    {editableCodes.length > 0 ? (
                        <>
                            <Text color={"gray.900"} fontSize={"sm"} fontWeight={"bold"} marginBottom={2}>
                                {checkpoint === 1 ? "Assign lineup positions" : "Assign new positions"}
                            </Text>
                            <View flexDirection={"row"} flexWrap={"wrap"} justifyContent={"space-between"}>
                                {editableCodes.map((code) => (
                                    <LineupField
                                        key={code}
                                        code={code}
                                        isDisabled={isLocked}
                                        onChange={(playerID) => updateLineupPlayer(code, playerID)}
                                        players={players}
                                        selectedPlayerIDs={selectedPlayerIDs}
                                        value={lineup[code]}
                                    />
                                ))}
                            </View>
                        </>
                    ) : checkpoint > 1 ? (
                        <Text color={"gray.600"} fontSize={"xs"} marginBottom={3}>
                            No new roster positions are required for this stage.
                        </Text>
                    ) : null}
                    {duplicatePlayerIDs.length > 0 ? (
                        <View backgroundColor={"red.50"} borderColor={"red.200"} borderRadius={8} borderWidth={1} marginBottom={3} padding={3}>
                            <Text color={"red.800"} fontSize={"xs"} fontWeight={"bold"}>
                                A player is assigned to more than one position. Each roster player may appear only once in this lineup.
                            </Text>
                        </View>
                    ) : null}

                    {availableRules.some((rule) => rule[`${sideKey}Options`].some((options) => options.length > 1)) ? (
                        <View borderTopColor={"gray.200"} borderTopWidth={1} marginTop={2} paddingTop={3}>
                            <Text color={"gray.900"} fontSize={"sm"} fontWeight={"bold"}>Choose this stage's matchups</Text>
                            <Text color={"gray.600"} fontSize={"xs"} marginBottom={2}>
                                Select which eligible lineup position will play each flexible slot. Fixed slots are shown for context.
                            </Text>
                            {availableRules.map((rule) => {
                                const optionsForSide = rule[`${sideKey}Options`];
                                if (!optionsForSide.some((options) => options.length > 1)) {
                                    return null;
                                }
                                const ruleSelections = matchCodeSelections[rule.id] || {};
                                return (
                                    <View key={rule.id} backgroundColor={"white"} borderColor={"gray.200"} borderRadius={8} borderWidth={1} marginBottom={2} padding={3}>
                                        <Text color={"gray.900"} fontSize={"xs"} fontWeight={"bold"}>
                                            {rule.label} - {formatTeamTieRuleSummary(rule)}
                                        </Text>
                                        <View flexDirection={"row"} flexWrap={"wrap"} justifyContent={"space-between"} marginTop={2}>
                                            {optionsForSide.map((options, slotIndex) => (
                                                options.length > 1 ? (
                                                    <OptionalPositionField
                                                        key={`${rule.id}-${slotIndex}`}
                                                        codeOptions={options}
                                                        isDisabled={isLocked}
                                                        label={`Player ${slotIndex + 1}`}
                                                        lineup={lineup}
                                                        onChange={(code) => updateMatchSelection(rule.id, slotIndex, code)}
                                                        players={players}
                                                        value={ruleSelections[sideKey]?.[slotIndex]}
                                                    />
                                                ) : (
                                                    <View
                                                        key={`${rule.id}-${slotIndex}`}
                                                        backgroundColor={"gray.50"}
                                                        borderColor={"gray.200"}
                                                        borderRadius={6}
                                                        borderWidth={1}
                                                        marginBottom={2}
                                                        padding={3}
                                                        width={{ base: "100%", md: "48.5%" }}
                                                    >
                                                        <Text color={"gray.500"} fontSize={"2xs"} fontWeight={"bold"}>PLAYER {slotIndex + 1}</Text>
                                                        <Text color={"gray.900"} fontSize={"xs"} fontWeight={"bold"} marginTop={1}>
                                                            {options[0]} - {players.find((player) => player.id === lineup[options[0]])?.label || "Not assigned"}
                                                        </Text>
                                                    </View>
                                                )
                                            ))}
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    ) : null}

                    <View flexDirection={"row"} flexWrap={"wrap"} marginTop={3}>
                        <Button isDisabled={saving || isLocked} marginBottom={2} marginRight={2} onPress={() => saveSubmission(false)} variant={"outline"}>
                            <Text color={openScoreboardColor} fontWeight={"bold"}>Save draft</Text>
                        </Button>
                        <Button backgroundColor={openScoreboardColor} isDisabled={saving || isLocked} marginBottom={2} onPress={() => saveSubmission(true)}>
                            {saving ? <Spinner color={openScoreboardButtonTextColor} size={"sm"} /> : (
                                <Text color={openScoreboardButtonTextColor} fontWeight={"bold"}>
                                    {ownReady ? "Lineup submitted" : isLocked ? "Lineup scheduled" : "Submit lineup"}
                                </Text>
                            )}
                        </Button>
                    </View>
                </View>
            ) : null}
        </View>
    );
}

export default function TeamCompetitionPortal(props) {
    const routeParams = props.route?.params || {};
    const competitionID = routeParams.competitionID || "";
    const teamID = routeParams.teamID || "";
    const accessToken = routeParams.password || routeParams.accessToken || "";
    const [competition, setCompetition] = useState<any>(null);
    const [team, setTeam] = useState<any>(null);
    const [teamMatches, setTeamMatches] = useState<any>({});
    const [doneLoading, setDoneLoading] = useState(false);
    const [unauthorized, setUnauthorized] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");
    const [statusType, setStatusType] = useState("success");

    useEffect(() => {
        async function loadPortal() {
            const [nextCompetition, nextTeam] = await Promise.all([
                getCompetition(competitionID),
                getTeam(teamID),
            ]);
            if (
                !nextCompetition ||
                !nextTeam ||
                !await validateTeamManagerPassword(teamID, accessToken) ||
                nextCompetition.participantType !== "team"
            ) {
                setUnauthorized(true);
                setDoneLoading(true);
                return;
            }

            setCompetition(nextCompetition);
            setTeam({ ...nextTeam, id: teamID });
            setDoneLoading(true);
        }

        loadPortal();
    }, [accessToken, competitionID, teamID]);

    useEffect(() => {
        if (!competitionID || unauthorized) {
            return;
        }
        return subscribeToCompetition(competitionID, setCompetition);
    }, [competitionID, unauthorized]);

    const contests = useMemo(() => {
        return getTeamCompetitionContests(competition || {}).filter((contest) => {
            return contest.teamAID === teamID || contest.teamBID === teamID;
        });
    }, [competition, teamID]);

    useEffect(() => {
        const cleanups = contests
            .map((contest) => contest.match.teamMatchID)
            .filter(Boolean)
            .map((teamMatchID) => {
                const teamMatchRef = db.ref(`teamMatches/${teamMatchID}`);
                const handleValue = (snapshot) => {
                    const teamMatch = snapshot.val() || {};
                    setTeamMatches((currentMatches) => ({
                        ...currentMatches,
                        [teamMatchID]: teamMatch,
                    }));
                    advanceTeamTieLineupCheckpointFromProgress(teamMatchID).catch((error) => {
                        console.error("[TeamCompetitionPortal] failed to advance lineup stage", error);
                    });
                };
                teamMatchRef.on("value", handleValue);
                return () => teamMatchRef.off("value", handleValue);
            });
        return () => cleanups.forEach((cleanup) => cleanup());
    }, [contests.map((contest) => contest.match.teamMatchID).join("|")]);

    const competitionRecord = useMemo(() => {
        return contests.reduce((record, contest) => {
            const teamMatch = teamMatches[contest.match.teamMatchID] || contest.match || {};
            const format = normalizeTeamTieFormat(teamMatch.teamTieFormat || competition?.data?.teamTieFormat);
            const scoreA = Number(teamMatch.teamAScore ?? teamMatch.AScore) || 0;
            const scoreB = Number(teamMatch.teamBScore ?? teamMatch.BScore) || 0;
            const isComplete = teamMatch.isComplete === true ||
                teamMatch.teamTieStatus === "complete" ||
                scoreA >= format.gamesToWin ||
                scoreB >= format.gamesToWin;
            if (!isComplete || scoreA === scoreB) {
                return record;
            }

            const isTeamA = contest.teamAID === teamID;
            const teamScore = isTeamA ? scoreA : scoreB;
            const opponentScore = isTeamA ? scoreB : scoreA;
            record.pointsFor += teamScore;
            record.pointsAgainst += opponentScore;
            if (teamScore > opponentScore) {
                record.wins += 1;
            }
            else {
                record.losses += 1;
            }
            return record;
        }, { losses: 0, pointsAgainst: 0, pointsFor: 0, wins: 0 });
    }, [competition?.data?.teamTieFormat, contests, teamID, teamMatches]);

    useEffect(() => {
        props.navigation.setOptions({
            title: team?.teamName ? `${team.teamName} - Competition` : "Team Competition Portal",
        });
    }, [props.navigation, team?.teamName]);

    if (!doneLoading) {
        return <LoadingPage />;
    }

    if (unauthorized) {
        return <Unauthorized />;
    }

    const competitionTitle = competition?.data?.title || competition?.title || "Competition";
    const createdContests = contests.filter((contest) => contest.match.teamMatchID);
    const awaitingCreationCount = contests.length - createdContests.length;

    return (
        <NativeBaseProvider theme={openScoreboardTheme}>
            <ScrollView backgroundColor={"gray.50"} contentContainerStyle={{ paddingBottom: 40 }}>
                <View alignSelf={"center"} maxWidth={900} padding={4} width={"100%"}>
                    <View backgroundColor={"white"} borderColor={"gray.200"} borderRadius={8} borderWidth={1} marginBottom={4} padding={4}>
                        <Text color={"gray.500"} fontSize={"2xs"} fontWeight={"bold"} textTransform={"uppercase"}>Team competition portal</Text>
                        <Text color={"gray.900"} fontSize={"2xl"} fontWeight={"bold"} marginTop={1}>{team.teamName}</Text>
                        <Text color={"gray.700"} fontSize={"md"} fontWeight={"bold"} marginTop={1}>{competitionTitle}</Text>
                        <Text color={"gray.600"} fontSize={"xs"} marginTop={2}>
                            Follow team tie scores, player match results, and required lineup selections throughout the competition.
                        </Text>
                        <View borderTopColor={"gray.100"} borderTopWidth={1} flexDirection={"row"} flexWrap={"wrap"} marginTop={3} paddingTop={3}>
                            <View marginBottom={2} marginRight={6}>
                                <Text color={"gray.500"} fontSize={"2xs"} fontWeight={"bold"}>RECORD</Text>
                                <Text color={"gray.900"} fontSize={"lg"} fontWeight={"bold"}>{competitionRecord.wins}-{competitionRecord.losses}</Text>
                            </View>
                            <View marginBottom={2} marginRight={6}>
                                <Text color={"gray.500"} fontSize={"2xs"} fontWeight={"bold"}>TEAM TIE POINTS</Text>
                                <Text color={"gray.900"} fontSize={"lg"} fontWeight={"bold"}>{competitionRecord.pointsFor}-{competitionRecord.pointsAgainst}</Text>
                            </View>
                            <View marginBottom={2}>
                                <Text color={"gray.500"} fontSize={"2xs"} fontWeight={"bold"}>ASSIGNED TIES</Text>
                                <Text color={"gray.900"} fontSize={"lg"} fontWeight={"bold"}>{contests.length}</Text>
                            </View>
                        </View>
                    </View>

                    {statusMessage ? (
                        <View
                            backgroundColor={statusType === "error" ? "red.50" : "green.50"}
                            borderColor={statusType === "error" ? "red.200" : "green.200"}
                            borderRadius={8}
                            borderWidth={1}
                            marginBottom={3}
                            padding={3}
                        >
                            <Text color={statusType === "error" ? "red.800" : "green.800"} fontSize={"sm"} fontWeight={"bold"}>
                                {statusMessage}
                            </Text>
                        </View>
                    ) : null}

                    {createdContests.length > 0 ? createdContests.map((contest) => (
                        <TeamContestSubmissionCard
                            key={contest.key}
                            accessToken={accessToken}
                            competitionRecord={competitionRecord}
                            contest={contest}
                            onStatus={(message, type) => {
                                setStatusMessage(message);
                                setStatusType(type);
                            }}
                            team={team}
                            teamMatch={teamMatches[contest.match.teamMatchID] || {}}
                        />
                    )) : (
                        <View backgroundColor={"white"} borderColor={"gray.200"} borderRadius={8} borderWidth={1} padding={4}>
                            <Text color={"gray.900"} fontSize={"md"} fontWeight={"bold"}>No team contests are ready yet.</Text>
                            <Text color={"gray.600"} fontSize={"sm"} marginTop={1}>
                                The organizer has not generated your team ties. Keep this URL; assigned contests will appear here.
                            </Text>
                        </View>
                    )}

                    {awaitingCreationCount > 0 ? (
                        <Text color={"gray.500"} fontSize={"xs"} marginTop={3}>
                            {awaitingCreationCount} assigned contest{awaitingCreationCount === 1 ? "" : "s"} still waiting for the organizer to create the team tie.
                        </Text>
                    ) : null}
                </View>
            </ScrollView>
        </NativeBaseProvider>
    );
}
