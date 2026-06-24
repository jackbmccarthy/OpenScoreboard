import React, { useEffect, useState } from 'react';
import { Button, Text, View, Modal, Spinner, FlatList } from 'native-base';
import { openScoreboardButtonTextColor, openScoreboardColor } from "../../openscoreboardtheme";
import { archiveMatchForTable, createNewMatch, getMatchScore, unassignedCurrentMatchForTable } from '../functions/scoring';
import { getCombinedPlayerNames } from '../functions/players';
import { archiveMatchForTeamMatch, createTeamMatchNewMatch, removeTeamMatchCurrentMatch } from '../functions/teammatches';
import { getScheduledTableMatches, setScheduledTableMatchToCurrentMatch } from '../functions/tables';
import i18n from '../translations/translate';

export function MatchFinishedModal(props) {

    let [archivedCurrentMatch, setArchivedCurrentMatch] = useState(false);
    let [loadingAction, setLoadingAction] = useState("");
    let [loadingScheduledMatches, setLoadingScheduledMatches] = useState(false);
    let [scheduledMatches, setScheduledMatches] = useState([])
    let [statusMessage, setStatusMessage] = useState("")
    const { playerA, playerA2, playerB, playerB2 } = props;
    const sportName = props.sportName || props.route?.params?.sportName || "tableTennis";
    const scoringType = props.scoringType !== undefined ? props.scoringType : props.route?.params?.scoringType || "normal";

    let playerScore = getMatchScore(props);

    let playerAWon = playerScore.a > playerScore.b;

    function winnerScore(a, b) {
        if (a > b) { return a; }
        else { return b; }
    }
    function loserScore(a, b) {
        if (a < b) { return a; }
        else { return b; }
    }

    async function loadScheduleMatches() {
        if (props.isTeamMatchSource || props.isKioskMode) {
            setScheduledMatches([])
            return
        }

        setLoadingScheduledMatches(true)
        try {
            let matches = await getScheduledTableMatches(props.tableID, { pendingOnly: true })
            setScheduledMatches(matches)
        }
        catch (error) {
            console.error("[MatchFinishedModal] failed to load scheduled matches", error)
            setScheduledMatches([])
        }
        finally {
            setLoadingScheduledMatches(false)
        }
    }

    async function endCurrentMatch() {
        if (archivedCurrentMatch) {
            return
        }

        if (props.isTeamMatchSource) {
            await archiveMatchForTeamMatch(props.teamMatchID, props.tableNumber, props.matchID, props)
        }
        else {
            if (props.parentTeamMatchID) {
                await archiveMatchForTeamMatch(
                    props.parentTeamMatchID,
                    props.teamMatchTableNumber || props.tableNumber || "",
                    props.matchID,
                    props
                )
                await removeTeamMatchCurrentMatch(
                    props.parentTeamMatchID,
                    props.teamMatchTableNumber || props.tableNumber || "1"
                )
            }
            await archiveMatchForTable(props.tableID, props.matchID, props)
        }

        setArchivedCurrentMatch(true)
    }

    async function setupManualNextMatch() {
        setLoadingAction("manual")
        setStatusMessage("")

        try {
            await endCurrentMatch()
            let nextMatchID

            if (props.isTeamMatchSource === true) {
                nextMatchID = await createTeamMatchNewMatch(props.teamMatchID, props.tableNumber, sportName, JSON.parse(JSON.stringify({ ...props, sportName, scoringType })), scoringType)
            }
            else {
                nextMatchID = await createNewMatch(props.tableID, sportName, JSON.parse(JSON.stringify({ ...props, sportName, scoringType })), false, scoringType)
            }

            await props.onNewMatchCreation(nextMatchID, { preferScheduledMatches: false })
            props.onClose()
            props.openSetupWizard({ preferScheduledMatches: false })
        }
        catch (error) {
            console.error("[MatchFinishedModal] failed to set up manual next match", error)
            setStatusMessage("The next match could not be created. Please try again.")
        }
        finally {
            setLoadingAction("")
        }
    }

    async function setupScheduledNextMatch(scheduledMatch) {
        const scheduledMatchID = scheduledMatch?.[0]
        const scheduledMatchData = scheduledMatch?.[1] || {}

        if (!scheduledMatchID || !scheduledMatchData.matchID) {
            setStatusMessage("This scheduled match is missing match data and cannot be loaded.")
            return
        }

        setLoadingAction(scheduledMatchID)
        setStatusMessage("")

        try {
            await endCurrentMatch()
            await setScheduledTableMatchToCurrentMatch(props.tableID, scheduledMatchData.matchID, scheduledMatchID)
            await props.onNewMatchCreation(scheduledMatchData.matchID, { preferScheduledMatches: false })
            props.onClose()
            props.openSetupWizard({ preferScheduledMatches: false })
        }
        catch (error) {
            console.error("[MatchFinishedModal] failed to set up scheduled next match", error)
            setStatusMessage("The scheduled match could not be loaded. Please try again.")
        }
        finally {
            setLoadingAction("")
        }
    }

    async function finishKioskMatch() {
        setLoadingAction("kiosk-finish")
        setStatusMessage("")

        try {
            await endCurrentMatch()
            await unassignedCurrentMatchForTable(props.tableID)
            await props.onNewMatchCreation("", { preferScheduledMatches: false })
            props.onClose()
        }
        catch (error) {
            console.error("[MatchFinishedModal] failed to return kiosk to queue", error)
            setStatusMessage("The match was saved, but this kiosk could not return to its queue.")
        }
        finally {
            setLoadingAction("")
        }
    }

    useEffect(() => {
        if (!props.isOpen) {
            setArchivedCurrentMatch(false)
            setLoadingAction("")
            setStatusMessage("")
            return
        }

        loadScheduleMatches()
    }, [props.isOpen, props.tableID, props.isTeamMatchSource])

    function renderScheduledMatch({ item, index }) {
        const scheduledMatchID = item?.[0]
        const match = item?.[1] || {}
        const playerAName = match.playerA && match.playerA.length > 0 ? match.playerA : "TBD"
        const playerBName = match.playerB && match.playerB.length > 0 ? match.playerB : "TBD"
        const startDate = match.startTime ? new Date(match.startTime) : null
        const startTimeLabel = startDate && !Number.isNaN(startDate.getTime()) ?
            startDate.toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })
            : "No start time"

        return (
            <View
                backgroundColor={index % 2 === 0 ? "gray.50" : "white"}
                borderColor={"gray.200"}
                borderRadius={8}
                borderWidth={1}
                marginBottom={2}
                padding={3}
            >
                <View alignItems={"center"} flexDirection={"row"}>
                    <View flex={1} paddingRight={2}>
                        <Text color={"gray.900"} fontSize={"sm"} fontWeight={"bold"}>
                            {playerAName} vs {playerBName}
                        </Text>
                        <Text color={"gray.500"} fontSize={"2xs"} marginTop={1}>
                            {startTimeLabel}
                        </Text>
                    </View>
                    <Button
                        backgroundColor={openScoreboardColor}
                        borderRadius={8}
                        isDisabled={loadingAction.length > 0}
                        minHeight={36}
                        onPress={() => setupScheduledNextMatch(item)}
                        paddingX={3}
                        paddingY={1}
                    >
                        {loadingAction === scheduledMatchID ? (
                            <Spinner color={openScoreboardButtonTextColor} size={"sm"} />
                        ) : (
                            <Text color={openScoreboardButtonTextColor} fontSize={"xs"} fontWeight={"bold"}>
                                Select
                            </Text>
                        )}
                    </Button>
                </View>
            </View>
        )
    }

    return (
        <Modal isOpen={props.isOpen}>
            <Modal.Content maxWidth={620} width={"94%"}>

                <Modal.Body>
                    <Text textAlign={"center"} fontSize={"3xl"} fontWeight={"bold"}>{i18n.t("matchFinished")}</Text>

                    <View
                        backgroundColor={"gray.50"}
                        borderColor={"gray.200"}
                        borderRadius={8}
                        borderWidth={1}
                        marginTop={3}
                        padding={4}
                    >
                        <Text color={"gray.500"} fontSize={"2xs"} fontWeight={"bold"} textAlign={"center"} textTransform={"uppercase"}>
                            Winner
                        </Text>
                        <Text color={"gray.900"} textAlign={"center"} fontSize={"2xl"} fontWeight={"bold"}>
                            {playerAWon ? getCombinedPlayerNames(playerA, playerB, playerA2, playerB2).a : getCombinedPlayerNames(playerA, playerB, playerA2, playerB2).b}
                        </Text>
                        <Text color={"gray.900"} textAlign={"center"} fontSize={"4xl"} fontWeight={"bold"}>
                            {winnerScore(playerScore.a, playerScore.b)} - {loserScore(playerScore.a, playerScore.b)}
                        </Text>
                    </View>

                    <View marginTop={4}>
                        <Text color={"gray.900"} fontSize={"lg"} fontWeight={"bold"}>
                            {props.isKioskMode ? "Return to kiosk queue" : "Choose the next match"}
                        </Text>
                        <Text color={"gray.600"} fontSize={"sm"} marginTop={1}>
                            {props.isKioskMode ?
                                "The result will be archived and this table will wait for the next scheduled match in queue order."
                                : "The finished match will be archived, then the next match setup wizard will open so the scorekeeper can confirm settings before starting."}
                        </Text>
                    </View>

                    {statusMessage ? (
                        <View backgroundColor={"red.50"} borderColor={"red.200"} borderRadius={8} borderWidth={1} marginTop={3} padding={3}>
                            <Text color={"red.800"} fontSize={"sm"} fontWeight={"bold"}>
                                {statusMessage}
                            </Text>
                        </View>
                    ) : null}

                    {!props.isTeamMatchSource && !props.isKioskMode ? (
                        <View marginTop={4}>
                            <View alignItems={"center"} flexDirection={"row"} justifyContent={"space-between"} marginBottom={2}>
                                <View>
                                    <Text color={"gray.900"} fontSize={"md"} fontWeight={"bold"}>
                                        Scheduled matches
                                    </Text>
                                    <Text color={"gray.500"} fontSize={"xs"}>
                                        {loadingScheduledMatches ? "Checking schedule..." : `${scheduledMatches.length} available`}
                                    </Text>
                                </View>
                                {loadingScheduledMatches ? <Spinner color={openScoreboardColor} /> : null}
                            </View>
                            {scheduledMatches.length > 0 ? (
                                <FlatList
                                    data={scheduledMatches}
                                    keyExtractor={(item: any) => item?.[0] || "scheduled-match"}
                                    maxHeight={240}
                                    renderItem={renderScheduledMatch}
                                />
                            ) : !loadingScheduledMatches ? (
                                <View backgroundColor={"blue.50"} borderColor={"blue.100"} borderRadius={8} borderWidth={1} padding={3}>
                                    <Text color={"blue.900"} fontSize={"sm"} fontWeight={"bold"} textAlign={"center"}>
                                        {i18n.t("noScheduledMatches")}
                                    </Text>
                                    <Text color={"blue.800"} fontSize={"xs"} marginTop={1} textAlign={"center"}>
                                        Set up the next match manually if nothing is scheduled for this table.
                                    </Text>
                                </View>
                            ) : null}
                        </View>
                    ) : null}

                    <View marginTop={4}>
                        {props.isKioskMode ? (
                            <Button
                                backgroundColor={openScoreboardColor}
                                borderRadius={8}
                                isDisabled={loadingAction.length > 0}
                                minHeight={46}
                                onPress={finishKioskMatch}
                            >
                                {loadingAction === "kiosk-finish" ? (
                                    <Spinner color={openScoreboardButtonTextColor}></Spinner>
                                ) : (
                                    <Text color={openScoreboardButtonTextColor} fontWeight={"bold"}>
                                        Finish and return to queue
                                    </Text>
                                )}
                            </Button>
                        ) : (
                            <Button
                                backgroundColor={openScoreboardColor}
                                borderRadius={8}
                                isDisabled={loadingAction.length > 0}
                                minHeight={46}
                                onPress={setupManualNextMatch}
                            >
                                {loadingAction === "manual" ? (
                                    <Spinner color={openScoreboardButtonTextColor}></Spinner>
                                ) : (
                                    <Text color={openScoreboardButtonTextColor} fontWeight={"bold"}>
                                        Set up manually
                                    </Text>
                                )}
                            </Button>
                        )}
                    </View>

                </Modal.Body>

            </Modal.Content>
        </Modal>
    );
}
