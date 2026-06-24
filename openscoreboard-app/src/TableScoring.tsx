import React, { Component, useEffect, useRef, useState } from 'react';
import { PanResponder, TouchableOpacity } from 'react-native';

import { NativeBaseProvider, View } from 'native-base';
import db from '../database';
import { openScoreboardTheme } from "../openscoreboardtheme";
import LoadingPage from './LoadingPage';
import { abandonMatch, createNewMatch, getCurrentGameNumber, getCurrentMatchForTable, getMatchData, hasActiveGame, isGameFinished, isMatchFinished, subscribeToAllMatchFields, unassignedCurrentMatchForTable, unsubscribeToAllMatchFields, watchForPasswordChange } from './functions/scoring';
import TableNewMatchModal from './modals/TableNewMatchModal';

import { ScoringSide } from './components/ScoringSide';

import { MatchPenaltyButtonModal } from './modals/MatchPenaltyButtonModal';
import { ServiceSettingsModal } from './modals/ServiceSettingsModal';
import { TimeOutModal } from './modals/TimeOutModal';
import { SignificantPointModal } from './modals/SignificantPointModal';
import { newImportedPlayer } from './classes/Player';
import { EditPlayerModal } from './modals/EditPlayerModal';
import { TopScoringSettings } from './components/TopScoringSettings';
import { AdvanceSettingsModal } from './modals/AdvanceSettingsModal';
import { MatchSetupWizard } from './modals/MatchSetupWizard';
import { InBetweenGamesModal } from './modals/InBetweenGamesModal';
import { GameWonConfirmationModal } from './modals/GameWonConfirmationModal';
import { MatchFinishedModal } from './modals/MatchFinishedModal';
import { addWinToTeamMatchTeamScore, createTeamMatchNewMatch, getTeamMatchCurrentMatch, removeTeamMatchCurrentMatch } from './functions/teammatches';
import Unauthorized from './Unauthorized';
import { getTableInfo, getTablePassword, isPendingScheduledTableMatch, setScheduledTableMatchToCurrentMatch, sortScheduledTableMatches } from './functions/tables';
import { ScoringSidePickleball } from './components/ScoringSidePickleball';
import Match from './classes/Match';
import { getScorekeeperTargetFromRoute, startScorekeeperSession } from './functions/scorekeeperSessions';
import { resetScheduledMatchForSource } from './functions/scheduling';
import { KioskQueueScreen } from './components/KioskQueueScreen';


export default function TableScoring(props) {

    React.useEffect(() => {
        props.navigation.setOptions({
            title: decodeURI(props.route.params.name),
        });
    }, [props.navigation]);

    let matchIDRef = useRef("")
    let activeListeners = useRef([])
    let teamMatchIDRef = useRef(props.route.params.teamMatchID)
    let isTeamMatchRef = useRef(props.route.params.isTeamMatch === true || props.route.params.isTeamMatch === "true")
    let parentTeamMatchIDRef = useRef(props.route.params.teamMatchID || "")
    let teamMatchTableNumber = useRef(props.route.params.tableNumber)
    let scorekeeperSessionCleanupRef = useRef(null)

    let [doneLoading, setDoneLoading] = useState(false)
    let [matchSettings, setMatchSettings] = useState<any>({})
    let [currentMatchExists, setCurrentMatchExists] = useState(null)
    let fieldLoadedCount = useRef(0)
    let matchSettingsCount = useRef(0)
    let pendingMatchUpdatesRef = useRef({})
    let pendingMatchUpdateFrameRef = useRef(null)


    let [unAuthorized, setUnAuthorized] = useState(false)

    let [editPlayer, setEditPlayer] = useState("")
    let [showEditPlayer, setShowEditPlayer] = useState(false)
    let [showGameWonConfirmationModal, setShowGameWonConfirmationModal] = useState(false)
    let [showPenaltyModal, setShowPenaltyModal] = useState(false)
    let [showTimeOutModal, setShowTimeOutModal] = useState(false)
    let [showSignificantPointsModal, setShowSignificantPointsModal] = useState(false)
    let [showServiceModal, setShowServiceModal] = useState(false)
    let [showInBetweenGamesModal, setShowInBetweenGamesModal] = useState(false)
    let [showEndOfGameModal, setShowEndOfGameModal] = useState(false)
    let [showAdvanceSettingsModal, setShowAdvanceSettingsModal] = useState(false)
    let [showMatchSetupWizard, setShowMatchSetupWizard] = useState(false)
    let [setupWizardPreferScheduledMatches, setSetupWizardPreferScheduledMatches] = useState(true)
    let [showEndOfMatchOptions, setShowEndOfMatchOptions] = useState(false)
    let [isKioskMode, setIsKioskMode] = useState(false)
    let [kioskQueue, setKioskQueue] = useState<any[]>([])
    let [startingKioskMatch, setStartingKioskMatch] = useState(false)
    let [kioskStatusMessage, setKioskStatusMessage] = useState("")

    const cancelPendingMatchFieldFlush = () => {
        if (!pendingMatchUpdateFrameRef.current) {
            return
        }

        const pendingFlush = pendingMatchUpdateFrameRef.current
        if (pendingFlush.type === "raf" && typeof cancelAnimationFrame === "function") {
            cancelAnimationFrame(pendingFlush.id)
        }
        else {
            clearTimeout(pendingFlush.id)
        }
        pendingMatchUpdateFrameRef.current = null
    }

    const flushPendingMatchFieldUpdates = () => {
        pendingMatchUpdateFrameRef.current = null
        const pendingUpdates = pendingMatchUpdatesRef.current
        pendingMatchUpdatesRef.current = {}

        setMatchSettings((previousState) => {
            let hasChange = false
            const nextState = previousState ? { ...previousState } : {}

            Object.entries(pendingUpdates).forEach(([key, value]) => {
                if (nextState[key] !== value) {
                    nextState[key] = value
                    hasChange = true
                }
            })

            return hasChange ? nextState : previousState
        })
    }

    const queueMatchFieldUpdate = (key, value) => {
        pendingMatchUpdatesRef.current = {
            ...pendingMatchUpdatesRef.current,
            [key]: value,
        }

        if (pendingMatchUpdateFrameRef.current) {
            return
        }

        if (typeof requestAnimationFrame === "function") {
            pendingMatchUpdateFrameRef.current = {
                id: requestAnimationFrame(flushPendingMatchFieldUpdates),
                type: "raf",
            }
        }
        else {
            pendingMatchUpdateFrameRef.current = {
                id: setTimeout(flushPendingMatchFieldUpdates, 0),
                type: "timeout",
            }
        }
    }

    const detachActiveListeners = () => {
        activeListeners.current.forEach(offFunc => {
            if (typeof offFunc === "function") {
                offFunc()
            }
        });
        activeListeners.current = []
        cancelPendingMatchFieldFlush()
        pendingMatchUpdatesRef.current = {}
    }

    const stopScorekeeperSession = () => {
        if (typeof scorekeeperSessionCleanupRef.current === "function") {
            scorekeeperSessionCleanupRef.current()
            scorekeeperSessionCleanupRef.current = null
        }
    }

    useEffect(() => {
        if (isTeamMatchRef.current) {
            return () => {}
        }

        let unSub = watchForPasswordChange(props.route.params.tableID, (password) => {
            if (!isTeamMatchRef.current && password !== props.route.params.password) {
                stopScorekeeperSession()
                setUnAuthorized(true)
                setDoneLoading(false)
            }
        })
        return unSub
    }, [])


    const renderSportScoring = (matchProps) => {
        const isSwitched = matchProps?.isSwitched;

        switch (props.route.params.sportName) {
            case "pickleball":
                if (matchProps) {
                    return (
                        <View flexDirection={"row"} width="100%" flex={1} minHeight={0} overflow={"hidden"}>
                            {
                                isSwitched ?
                                    <ScoringSidePickleball matchID={matchIDRef.current}
                                        openGameWonConfirmationModal={openGameWonConfirmationModal}

                                        openPlayerModal={openPlayerModal}
                                        lockPlayerEditing={isKioskMode}

                                        isA={false} {...matchProps}></ScoringSidePickleball> :
                                    <ScoringSidePickleball matchID={matchIDRef.current}
                                        openGameWonConfirmationModal={openGameWonConfirmationModal}

                                        openPlayerModal={openPlayerModal}
                                        lockPlayerEditing={isKioskMode}
                                        isA={true} {...matchProps}></ScoringSidePickleball>
                            }
                            {
                                isSwitched ?
                                    <ScoringSidePickleball matchID={matchIDRef.current}
                                        openGameWonConfirmationModal={openGameWonConfirmationModal}

                                        openPlayerModal={openPlayerModal}
                                        lockPlayerEditing={isKioskMode}
                                        isA={true} {...matchProps}></ScoringSidePickleball>
                                    :
                                    <ScoringSidePickleball matchID={matchIDRef.current}
                                        openGameWonConfirmationModal={openGameWonConfirmationModal}

                                        openPlayerModal={openPlayerModal}
                                        lockPlayerEditing={isKioskMode}
                                        isA={false} {...matchProps}></ScoringSidePickleball>
                            }
                        </View>
                    )
                }

                break;

            default:
                return (
                    <View flexDirection={"row"} width="100%" flex={1} minHeight={0} overflow={"hidden"}>
                        {
                            isSwitched ?
                            <ScoringSide matchID={matchIDRef.current}
                                    openGameWonConfirmationModal={openGameWonConfirmationModal}

                                openPlayerModal={openPlayerModal}
                                lockPlayerEditing={isKioskMode}

                                    isA={false} {...matchProps}></ScoringSide> :
                            <ScoringSide matchID={matchIDRef.current}
                                    openGameWonConfirmationModal={openGameWonConfirmationModal}

                                openPlayerModal={openPlayerModal}
                                lockPlayerEditing={isKioskMode}
                                    isA={true} {...matchProps}></ScoringSide>
                        }
                        {
                            isSwitched ?
                            <ScoringSide matchID={matchIDRef.current}
                                    openGameWonConfirmationModal={openGameWonConfirmationModal}

                                openPlayerModal={openPlayerModal}
                                lockPlayerEditing={isKioskMode}
                                    isA={true} {...matchProps}></ScoringSide>
                                :
                            <ScoringSide matchID={matchIDRef.current}
                                    openGameWonConfirmationModal={openGameWonConfirmationModal}

                                openPlayerModal={openPlayerModal}
                                lockPlayerEditing={isKioskMode}
                                    isA={false} {...matchProps}></ScoringSide>
                        }
                        {/* <ScoringSide isA={true} {...matchSettings}></ScoringSide>
        <ScoringSide isA={false} {...matchSettings}></ScoringSide> */}
                    </View>
                )
                break;
        }


    }


    async function loadTableScoring(tableId, options: any = {}) {
        const preferScheduledMatches = options?.preferScheduledMatches !== false
        detachActiveListeners()
        fieldLoadedCount.current = 0
        matchSettingsCount.current = 0
        setDoneLoading(false)

        if (!isTeamMatchRef.current) {
            const [password, tableInfo] = await Promise.all([
                getTablePassword(tableId),
                getTableInfo(tableId),
            ])
            setIsKioskMode(tableInfo?.tableMode === "kiosk")

            if (password !== props.route.params.password) {
                setUnAuthorized(true)
                setDoneLoading(false)
                return
            }
        }



        let currentMatchID
        if (isTeamMatchRef.current === true) {
            currentMatchID = await getTeamMatchCurrentMatch(teamMatchIDRef.current, teamMatchTableNumber.current)
        } else {
            currentMatchID = await getCurrentMatchForTable(tableId)
        }

        matchIDRef.current = currentMatchID
        if (typeof currentMatchID === "string" && currentMatchID.length > 0) {
            setCurrentMatchExists(true)
            let matchData = await getMatchData(currentMatchID) || {}
            parentTeamMatchIDRef.current = matchData.teamMatchID || teamMatchIDRef.current || ""
            setMatchSettings({ ...matchData })
            matchSettingsCount.current = Object.keys(matchData).length

            //See what prompts need to be displayed when the page is loaded.
            if (!hasActiveGame(matchData)) {
                if (isMatchFinished(matchData)) {
                    setShowEndOfMatchOptions(true)
                }
                else {
                    switch (getCurrentGameNumber(matchData)) {
                        case 1:
                            setSetupWizardPreferScheduledMatches(preferScheduledMatches)
                            setShowMatchSetupWizard(true)
                            break;

                        default:
                            setShowInBetweenGamesModal(true)
                            break;
                    }

                    let gameNumber = getCurrentGameNumber(matchData)
                    let isGameDone = isGameFinished(matchData.enforceGameScore, matchData[`game${gameNumber}AScore`], matchData[`game${gameNumber}BScore`], matchData.pointsToWinGame)
                    if (isGameDone) {
                        openGameWonConfirmationModal()
                    }
                }

                //setShowInBetweenGamesModal(true)
            }



            //Adds listeners for each individual field, to save data on updates
            let allFieldListeners = await subscribeToAllMatchFields(currentMatchID, (value, key) => {
                queueMatchFieldUpdate(key, value)
                fieldLoadedCount.current = fieldLoadedCount.current + 1

                if (fieldLoadedCount.current >= matchSettingsCount.current) {
                    setDoneLoading(true)
                }

            })
            activeListeners.current = allFieldListeners
            if (matchSettingsCount.current === 0) {
                setDoneLoading(true)
            }
            return matchData
        }
        else {
            setMatchSettings({})
            setCurrentMatchExists(false)
            setDoneLoading(true)
        }

    }

    function getScorekeeperSessionSnapshot() {
        return {
            currentMatchID: matchIDRef.current || "",
            scoringName: decodeURI(props.route.params.name || ""),
            scoringType: props.route.params.scoringType || "",
            sportName: props.route.params.sportName || "",
            tableID: props.route.params.tableID || "",
            tableNumber: teamMatchTableNumber.current || "",
            teamMatchID: teamMatchIDRef.current || "",
        }
    }

    async function handleScorekeeperCommand(command) {
        switch (command?.type) {
            case "block":
            case "blocked":
            case "disconnect":
            case "kick":
                stopScorekeeperSession()
                setUnAuthorized(true)
                setDoneLoading(false)
                return

            case "reload":
            case "reload-current-match":
                await loadTableScoring(props.route.params.tableID)
                return

            default:
                return
        }
    }

    useEffect(() => {
        let isMounted = true

        loadTableScoring(props.route.params.tableID)

        getScorekeeperTargetFromRoute(props.route.params).then((scorekeeperTarget) => {
            if (!isMounted || !scorekeeperTarget) {
                return
            }

            startScorekeeperSession(scorekeeperTarget, getScorekeeperSessionSnapshot, handleScorekeeperCommand).then((cleanup) => {
                if (!isMounted) {
                    cleanup()
                    return
                }

                scorekeeperSessionCleanupRef.current = cleanup
            }).catch((err) => {
                console.error("[scorekeeperSessions] unable to start scoring session", err)
            })
        }).catch((err) => {
            console.error("[scorekeeperSessions] unable to resolve scoring session target", err)
        })

        return () => {
            isMounted = false

            detachActiveListeners()
            stopScorekeeperSession()

        }
    }, [])

    useEffect(() => {
        if (isTeamMatchRef.current || !props.route.params.tableID) {
            return
        }

        const tableModeRef = db.ref(`tables/${props.route.params.tableID}/tableMode`)
        const scheduledMatchesRef = db.ref(`tables/${props.route.params.tableID}/scheduledMatches`)
        const handleTableMode = (snapshot) => {
            setIsKioskMode(snapshot.val() === "kiosk")
        }
        const handleScheduledMatches = (snapshot) => {
            const scheduledMatches = snapshot.val()
            const queue = scheduledMatches && typeof scheduledMatches === "object" ?
                sortScheduledTableMatches(Object.entries(scheduledMatches))
                    .filter(([, match]: any) => isPendingScheduledTableMatch(match))
                : []
            setKioskQueue(queue)
        }

        tableModeRef.on("value", handleTableMode)
        scheduledMatchesRef.on("value", handleScheduledMatches)

        return () => {
            tableModeRef.off("value", handleTableMode)
            scheduledMatchesRef.off("value", handleScheduledMatches)
        }
    }, [props.route.params.tableID])

    useEffect(() => {

    }, [
        matchSettings["isGame1Finished"],
        matchSettings["isGame2Finished"],
        matchSettings["isGame3Finished"],
        matchSettings["isGame4Finished"],
        matchSettings["isGame5Finished"],
        matchSettings["isGame6Finished"],
        matchSettings["isGame7Finished"],
        matchSettings["isGame8Finished"],
        matchSettings["isGame9Finished"],
    ])




    const openPlayerModal = (player) => {
        if (isKioskMode) {
            return
        }
        setEditPlayer(player)
        setShowEditPlayer(true)
    }
    const closePlayerModal = () => {
        setEditPlayer("")
        setShowEditPlayer(false)
    }
    const openGameWonConfirmationModal = () => {
        setShowGameWonConfirmationModal(true)

    }
    const closeGameWonConfirmationModal = () => {
        setShowGameWonConfirmationModal(false)

    }
    const openTimeOutModal = () => {
        setShowTimeOutModal(true)
    }
    const openPenaltyModal = () => {
        setShowPenaltyModal(true)
    }
    const openSignificantPointsModal = () => {
        setShowSignificantPointsModal(true)
    }
    const openServiceModal = () => {
        setShowServiceModal(true)
    }
    const openAfterGamePrompt = (newerMatchSettings) => {
        if (isMatchFinished(newerMatchSettings)) {
            setShowEndOfMatchOptions(true)
        }
        else {
            setShowInBetweenGamesModal(true)
        }
    }
    const openAdvanceSettingsModal = () => {
        setShowAdvanceSettingsModal(true)
    }
    const openSetupWizard = (options: any = {}) => {
        setSetupWizardPreferScheduledMatches(options?.preferScheduledMatches !== false)
        setShowMatchSetupWizard(true)
    }

    const onNewMatchCreation = async (matchID, options: any = {}) => {
        await unsubscribeToAllMatchFields(matchIDRef.current, matchSettings)
        // let matchData = await getMatchData(matchID)
        // matchIDRef.current = matchID
        // setMatchSettings(matchData)
        // subscribeToAllMatchFields(matchIDRef.current, matchData)
        await loadTableScoring(props.route.params.tableID, options)
    }

    const abandonCurrentMatch = async () => {
        const currentMatchID = matchIDRef.current
        const sportName = matchSettings.sportName || props.route.params.sportName || "tableTennis"
        const scoringType = matchSettings.scoringType !== undefined ? matchSettings.scoringType : props.route.params.scoringType || "normal"

        await abandonMatch(currentMatchID)

        if (matchSettings.scheduledMatchID) {
            const scheduledSourceType = matchSettings.scheduledSourceType || (isTeamMatchRef.current ? "teamMatch" : "table")
            const scheduledSourceID = matchSettings.scheduledSourceID || (isTeamMatchRef.current ? teamMatchIDRef.current : props.route.params.tableID)
            await resetScheduledMatchForSource(
                scheduledSourceType,
                scheduledSourceID,
                matchSettings.scheduledMatchID,
                currentMatchID,
            )
        }

        if (isKioskMode && !isTeamMatchRef.current) {
            if (matchSettings.teamMatchID) {
                await removeTeamMatchCurrentMatch(
                    matchSettings.teamMatchID,
                    matchSettings.teamMatchTableNumber || "1"
                )
            }
            await unassignedCurrentMatchForTable(props.route.params.tableID)
            setShowAdvanceSettingsModal(false)
            await loadTableScoring(props.route.params.tableID, { preferScheduledMatches: false })
            return
        }

        let nextMatchID
        if (isTeamMatchRef.current) {
            nextMatchID = await createTeamMatchNewMatch(
                teamMatchIDRef.current,
                teamMatchTableNumber.current,
                sportName,
                null,
                scoringType,
            )
        }
        else {
            nextMatchID = await createNewMatch(
                props.route.params.tableID,
                sportName,
                null,
                false,
                scoringType,
            )
        }

        setShowAdvanceSettingsModal(false)
        await onNewMatchCreation(nextMatchID, { preferScheduledMatches: true })
        openSetupWizard({ preferScheduledMatches: true })
    }

    const activeTeamMatchID = matchSettings.teamMatchID || parentTeamMatchIDRef.current || teamMatchIDRef.current || ""
    const isTeamMatchContext = isTeamMatchRef.current || activeTeamMatchID.length > 0

    async function startNextKioskMatch() {
        const nextScheduledMatch = kioskQueue[0]
        const scheduledMatchID = nextScheduledMatch?.[0]
        const scheduledMatch = nextScheduledMatch?.[1] || {}
        if (!scheduledMatchID || !scheduledMatch.matchID || !scheduledMatch.playerA?.trim() || !scheduledMatch.playerB?.trim()) {
            return
        }

        setStartingKioskMatch(true)
        setKioskStatusMessage("")
        try {
            await setScheduledTableMatchToCurrentMatch(
                props.route.params.tableID,
                scheduledMatch.matchID,
                scheduledMatchID
            )
            await loadTableScoring(props.route.params.tableID, { preferScheduledMatches: false })
        }
        catch (error) {
            setKioskStatusMessage(error instanceof Error ? error.message : "This match could not be started.")
        }
        finally {
            setStartingKioskMatch(false)
        }
    }

    if (doneLoading && isKioskMode && currentMatchExists === false) {
        return (
            <NativeBaseProvider theme={openScoreboardTheme}>
                <KioskQueueScreen
                    isStarting={startingKioskMatch}
                    nextMatch={kioskQueue[0] || null}
                    onContinue={startNextKioskMatch}
                    queueCount={kioskQueue.length}
                    statusMessage={kioskStatusMessage}
                    tableName={decodeURI(props.route.params.name || "")}
                />
            </NativeBaseProvider>
        )
    }


    if (doneLoading) {
        return (
            <NativeBaseProvider theme={openScoreboardTheme}>
                <View flex={1} height={"100%"} minHeight={0} width="100%" overflow={"hidden"} backgroundColor={"gray.900"}>
                    <TopScoringSettings
                        openPenaltyModal={openPenaltyModal}
                        openTimeOutModal={openTimeOutModal}
                        openServiceModal={openServiceModal}
                        openSignificantPointsModal={openSignificantPointsModal}
                        openAdvanceSettingsModal={openAdvanceSettingsModal}
                        {...matchSettings}
                        {...props}
                        matchID={matchIDRef.current}
                    ></TopScoringSettings>
                    {renderSportScoring(matchSettings)}

                    {
                        showEndOfMatchOptions ?
                            <MatchFinishedModal
                                loadTableScoring={loadTableScoring}
                                openSetupWizard={openSetupWizard} onNewMatchCreation={onNewMatchCreation} tableID={props.route.params.tableID} matchID={matchIDRef.current}
                                isOpen={showEndOfMatchOptions}
                                onClose={() => { setShowEndOfMatchOptions(false) }}
                                {...matchSettings}
                                {...props}
                                isTeamMatch={isTeamMatchContext}
                                isTeamMatchSource={isTeamMatchRef.current}
                                parentTeamMatchID={activeTeamMatchID}
                                tableNumber={teamMatchTableNumber.current}
                                teamMatchTableNumber={matchSettings.teamMatchTableNumber}
                                isKioskMode={isKioskMode}
                                teamMatchID={activeTeamMatchID}></MatchFinishedModal>
                            : null
                    }

                    {showPenaltyModal ?
                        <MatchPenaltyButtonModal matchID={matchIDRef.current} isOpen={showPenaltyModal} onClose={() => { setShowPenaltyModal(false) }} {...matchSettings} {...props}></MatchPenaltyButtonModal>

                        : null
                    }
                    {
                        showMatchSetupWizard ?
                            <MatchSetupWizard
                                loadTableScoring={loadTableScoring}
                                matchID={matchIDRef.current}
                                {...matchSettings}
                                isOpen={showMatchSetupWizard}
                                preferScheduledMatches={setupWizardPreferScheduledMatches}
                                {...props}
                                player={editPlayer}
                                setEditPlayer={setEditPlayer}
                                onClose={() => { setShowMatchSetupWizard(false) }}
                                isKioskMode={isKioskMode}
                                isTeamMatch={isTeamMatchRef.current}
                                tableNumber={teamMatchTableNumber.current}
                                teamMatchID={teamMatchIDRef.current}
                            ></MatchSetupWizard>
                            : null
                    }

                    {
                        showInBetweenGamesModal ?
                            <InBetweenGamesModal
                                {...matchSettings}
                                {...props}
                                matchID={matchIDRef.current}
                                isOpen={showInBetweenGamesModal}
                                onClose={() => { setShowInBetweenGamesModal(false) }} />
                            : null
                    }

                    {
                        showSignificantPointsModal ?
                            <SignificantPointModal
                                {...matchSettings}
                                {...props} matchID={matchIDRef.current}
                                isOpen={showSignificantPointsModal}
                                onClose={() => { setShowSignificantPointsModal(false) }}></SignificantPointModal>
                            : null
                    }
                    {
                        showServiceModal ?
                            <ServiceSettingsModal
                                {...matchSettings}
                                {...props}
                                matchID={matchIDRef.current}
                                isOpen={showServiceModal}
                                onClose={() => { setShowServiceModal(false) }} ></ServiceSettingsModal>

                            : null
                    }
                    {currentMatchExists === false && !isKioskMode ?
                        <TableNewMatchModal
                            onClose={() => {
                                setCurrentMatchExists(true)
                                loadTableScoring(props.route.params.tableID)
                            }}
                            isOpen={currentMatchExists === false}
                            {...props}
                            isTeamMatch={isTeamMatchRef.current}
                            tableNumber={teamMatchTableNumber.current}
                            teamMatchID={teamMatchIDRef.current} />
                        : null
                    }

                    {
                        showTimeOutModal ?
                            <TimeOutModal matchID={matchIDRef.current}
                                isOpen={showTimeOutModal}
                                onClose={() => { setShowTimeOutModal(false) }}
                                {...matchSettings}
                                {...props}></TimeOutModal>
                            : null
                    }

                    {
                        showGameWonConfirmationModal ?
                            <GameWonConfirmationModal
                                matchID={matchIDRef.current}
                                openAfterGamePrompt={openAfterGamePrompt}
                                onClose={closeGameWonConfirmationModal}
                                isOpen={showGameWonConfirmationModal}
                                {...matchSettings}
                                {...props}
                                isTeamMatch={isTeamMatchContext}
                                tableNumber={teamMatchTableNumber.current}
                                teamMatchID={activeTeamMatchID} ></GameWonConfirmationModal>
                            : null
                    }

                    {
                        showEditPlayer && !isKioskMode ?
                            <EditPlayerModal
                                matchID={matchIDRef.current}
                                player={editPlayer}
                                isOpen={showEditPlayer}
                                onClose={closePlayerModal}
                                {...matchSettings}
                                {...props} isTeamMatch={isTeamMatchContext}
                                tableNumber={teamMatchTableNumber.current}
                                teamMatchID={activeTeamMatchID}></EditPlayerModal>
                            : null
                    }


                    {
                        showAdvanceSettingsModal ?
                            <AdvanceSettingsModal {...matchSettings}
                                {...props}
                                abandonCurrentMatch={abandonCurrentMatch}
                                isKioskMode={isKioskMode}
                                matchID={matchIDRef.current}
                                onClose={() => setShowAdvanceSettingsModal(false)}
                                isOpen={showAdvanceSettingsModal}
                                openAfterGamePrompt={openAfterGamePrompt}  ></AdvanceSettingsModal>
                            : null
                    }

                </View>
            </NativeBaseProvider>
        )
    }
    else {
        return (
            unAuthorized ? <Unauthorized></Unauthorized> : <LoadingPage></LoadingPage>
        )

    }

}
