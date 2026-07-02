import React, { Component, useEffect, useRef, useState } from 'react';
import { PanResponder, TouchableOpacity } from 'react-native';

import { NativeBaseProvider, View } from 'native-base';
import db from '../database';
import { openScoreboardTheme } from "../openscoreboardtheme";
import LoadingPage from './LoadingPage';
import { abandonMatch, AddPoint, archiveMatchForTable, AWonRally_PB, BWonRally_PB, createNewMatch, endGame, getCurrentGameNumber, getCurrentGameScore, getCurrentMatchForTable, getMatchData, getMatchScore, hasActiveGame, isFinalGame, isGameFinished, isGamePoint, isMatchFinished, setIsGamePoint, setIsMatchPoint, startGame, subscribeToAllMatchFields, switchSides, unassignedCurrentMatchForTable, unsubscribeToAllMatchFields, updateCurrentPlayer, updateService, watchForPasswordChange } from './functions/scoring';
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
import { addWinToTeamMatchTeamScore, archiveMatchForTeamMatch, createTeamMatchNewMatch, getImportTeamMembersList, getTeamMatchCurrentMatch, removeTeamMatchCurrentMatch } from './functions/teammatches';
import Unauthorized from './Unauthorized';
import { getPlayerListIDForTable, getTableInfo, getTablePassword, isPendingScheduledTableMatch, setScheduledTableMatchToCurrentMatch, sortScheduledTableMatches } from './functions/tables';
import { ScoringSidePickleball } from './components/ScoringSidePickleball';
import Match from './classes/Match';
import { getScorekeeperTargetFromRoute, startScorekeeperSession } from './functions/scorekeeperSessions';
import { resetScheduledMatchForSource, updateScheduledMatchScoresForSource } from './functions/scheduling';
import { KioskQueueScreen } from './components/KioskQueueScreen';
import { getImportPlayerList, getPlayerFormatted } from './functions/players';
import { isCompactScoringPage, isEmbeddedScoringPage, isOpenScoreboardLiveSource, isWatchBridgeEnabled, publishWatchState, publishWatchStatus, publishWhenBridgeReady, subscribeToWatchActions } from './functions/watchBridge';


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
    let matchSettingsRef = useRef<any>({})
    let watchAvailablePlayersRef = useRef<any[]>([])
    let watchUIStateRef = useRef<any>({})
    let watchActionInFlightRef = useRef(false)

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
    let [watchAvailablePlayers, setWatchAvailablePlayers] = useState<any[]>([])

    useEffect(() => {
        matchSettingsRef.current = matchSettings || {}
    }, [matchSettings])

    useEffect(() => {
        watchAvailablePlayersRef.current = watchAvailablePlayers || []
    }, [watchAvailablePlayers])

    useEffect(() => {
        watchUIStateRef.current = {
            currentMatchExists,
            isKioskMode,
            showEndOfMatchOptions,
            showGameWonConfirmationModal,
            showInBetweenGamesModal,
            showMatchSetupWizard,
        }
    }, [
        currentMatchExists,
        isKioskMode,
        showEndOfMatchOptions,
        showGameWonConfirmationModal,
        showInBetweenGamesModal,
        showMatchSetupWizard,
        watchAvailablePlayers,
    ])

    useEffect(() => {
        if (isEmbeddedScoringPage() || isCompactScoringPage() || isOpenScoreboardLiveSource()) {
            props.navigation.setOptions({
                headerShown: false,
            })
        }
    }, [props.navigation])

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

    useEffect(() => {
        if (!isWatchBridgeEnabled()) {
            return
        }

        let isMounted = true

        async function loadWatchPlayers() {
            try {
                if (isTeamMatchContext && activeTeamMatchID) {
                    const [teamAPlayers, teamBPlayers] = await Promise.all([
                        getImportTeamMembersList("playerA", activeTeamMatchID),
                        getImportTeamMembersList("playerB", activeTeamMatchID),
                    ])
                    if (!isMounted) {
                        return
                    }
                    setWatchAvailablePlayers([
                        ...teamAPlayers.map(([playerID, player]: any) => ({
                            id: player?.id || playerID,
                            player: { ...player, id: player?.id || playerID },
                            statePlayer: {
                                id: player?.id || playerID,
                                name: getPlayerFormatted(player),
                                team: "A",
                            },
                        })),
                        ...teamBPlayers.map(([playerID, player]: any) => ({
                            id: player?.id || playerID,
                            player: { ...player, id: player?.id || playerID },
                            statePlayer: {
                                id: player?.id || playerID,
                                name: getPlayerFormatted(player),
                                team: "B",
                            },
                        })),
                    ].filter((entry) => entry.statePlayer.id && entry.statePlayer.name))
                    return
                }

                if (props.route.params.tableID) {
                    const playerListID = await getPlayerListIDForTable(props.route.params.tableID)
                    const players = playerListID ? await getImportPlayerList(playerListID) : []
                    if (!isMounted) {
                        return
                    }
                    setWatchAvailablePlayers(players.map(([playerID, player]: any) => ({
                        id: player?.id || playerID,
                        player: { ...player, id: player?.id || playerID },
                        statePlayer: {
                            id: player?.id || playerID,
                            name: getPlayerFormatted(player),
                        },
                    })).filter((entry) => entry.statePlayer.id && entry.statePlayer.name))
                }
            }
            catch (error) {
                console.error("[watchBridge] failed to load selectable players", error)
                if (isMounted) {
                    setWatchAvailablePlayers([])
                }
            }
        }

        loadWatchPlayers()

        return () => {
            isMounted = false
        }
    }, [activeTeamMatchID, isTeamMatchContext, props.route.params.tableID])

    function getFinishedGameScoresForWatch(match) {
        return Array.from({ length: 9 }).reduce((scores, _, index) => {
            const gameIndex = index + 1
            if (match[`isGame${gameIndex}Finished`] !== true) {
                return scores
            }

            scores.push({
                a: Number(match[`game${gameIndex}AScore`]) || 0,
                b: Number(match[`game${gameIndex}BScore`]) || 0,
            })
            return scores
        }, [])
    }

    function getWatchNumber(value, fallback) {
        const numberValue = Number(value)
        return Number.isFinite(numberValue) ? numberValue : fallback
    }

    function getWatchSideLabel(playerEntries, team) {
        const names = playerEntries
            .filter((entry) => entry.statePlayer.team === team)
            .map((entry) => entry.statePlayer.name)
            .filter((name) => `${name || ""}`.trim().length > 0)

        return names.join(" / ")
    }

    function getWatchMatchSettings(match) {
        return {
            bestOf: getWatchNumber(match?.bestOf, 5),
            doubles: match?.isDoubles === true,
            pointsToWin: getWatchNumber(match?.pointsToWinGame, 11),
            serveEvery: getWatchNumber(match?.changeServeEveryXPoints, 2),
            winBy: match?.enforceGameScore === false ? 1 : 2,
        }
    }

    function getWatchMatchSettingOptions() {
        return {
            bestOf: [1, 3, 5, 7, 9],
            doubles: [false, true],
            pointsToWin: [11, 15, 21],
            serveEvery: [1, 2, 5],
            winBy: [1, 2],
        }
    }

    function getLastCompletedGameForWatch(match, score, isPendingGameConfirmation = false) {
        if (isPendingGameConfirmation) {
            return {
                a: score.a,
                b: score.b,
            }
        }

        for (let gameIndex = 9; gameIndex >= 1; gameIndex = gameIndex - 1) {
            if (match?.[`isGame${gameIndex}Finished`] === true) {
                return {
                    a: Number(match[`game${gameIndex}AScore`]) || 0,
                    b: Number(match[`game${gameIndex}BScore`]) || 0,
                }
            }
        }

        return undefined
    }

    function getWatchPlayerID(playerField, player) {
        if (!player || typeof player !== "object") {
            return ""
        }

        return player.id || player.playerID || player.uid || player.importedPlayerID || `${playerField}:${getPlayerFormatted(player)}`
    }

    function getWatchPlayerEntries(match) {
        const playerFields = [
            ["a1", "playerA", "A"],
            ["a2", "playerA2", "A"],
            ["b1", "playerB", "B"],
            ["b2", "playerB2", "B"],
        ]

        return playerFields.reduce((players, [slot, field, team]) => {
            const player = match?.[field]
            const name = getPlayerFormatted(player)
            const id = getWatchPlayerID(field, player)

            if (!id || !name) {
                return players
            }

            players.push({
                field,
                player,
                slot,
                statePlayer: {
                    id,
                    name,
                    team,
                },
            })
            return players
        }, [])
    }

    function getAllWatchPlayerEntries(match) {
        const entriesByID = new Map()

        watchAvailablePlayersRef.current.forEach((entry) => {
            if (entry?.statePlayer?.id) {
                entriesByID.set(entry.statePlayer.id, entry)
            }
        })

        getWatchPlayerEntries(match).forEach((entry) => {
            if (entry?.statePlayer?.id) {
                entriesByID.set(entry.statePlayer.id, entry)
            }
        })

        return Array.from(entriesByID.values())
    }

    function buildCurrentWatchState() {
        const current = matchSettingsRef.current || {}
        const watchUIState = watchUIStateRef.current || {}
        const playerEntries = getWatchPlayerEntries(current)
        const allPlayerEntries = getAllWatchPlayerEntries(current)
        const selectedPlayers = playerEntries.reduce((selection, entry) => {
            selection[entry.slot] = entry.statePlayer.id
            return selection
        }, {})
        const currentGameNumber = getCurrentGameNumber(current) || 1
        const matchScore = getMatchScore(current)
        const score = {
            a: Number(current[`game${currentGameNumber}AScore`]) || 0,
            b: Number(current[`game${currentGameNumber}BScore`]) || 0,
            gameA: matchScore.a,
            gameB: matchScore.b,
        }
        const lastCompletedGame = getLastCompletedGameForWatch(current, score, watchUIState.showGameWonConfirmationModal)
        let matchStatus: any = "setup"
        let availableActions: string[] = ["createNewMatch", "setupNewMatch"]
        let prompt: any = undefined

        if (watchUIState.showGameWonConfirmationModal) {
            matchStatus = "inGame"
            availableActions = ["confirmGame"]
            prompt = {
                type: "confirmGame",
                title: "End game?",
                message: "Confirm the game winner on the scoring app.",
            }
        }
        else if (watchUIState.showEndOfMatchOptions || isMatchFinished(current)) {
            matchStatus = "matchOver"
            availableActions = ["setupNewMatch", "createNewMatch", "confirmMatch"]
            prompt = {
                type: "setupNewMatch",
                title: "Match complete",
                message: "Set up the next match from the watch or scoring screen.",
            }
        }
        else if (watchUIState.showInBetweenGamesModal || current.isInBetweenGames === true) {
            matchStatus = "gameOver"
            availableActions = ["startNextGame"]
            prompt = {
                type: "startNextGame",
                title: "Start next game?",
                message: "The scoring app is between games.",
            }
        }
        else if (watchUIState.currentMatchExists === true && hasActiveGame(current)) {
            matchStatus = "inGame"
            availableActions = ["rallyWon"]
        }
        else if (watchUIState.showMatchSetupWizard || watchUIState.currentMatchExists === false || !matchIDRef.current) {
            matchStatus = "setup"
            availableActions = matchIDRef.current
                ? ["selectPlayer", "setMatchFormat", "startMatch"]
                : ["createNewMatch", "setupNewMatch"]
            prompt = {
                type: "setupMatch",
                title: "Set up match",
                message: "Select players and match format from the watch.",
            }
        }

        return {
            availableActions,
            ...(lastCompletedGame ? { lastCompletedGame } : {}),
            matchSettingOptions: getWatchMatchSettingOptions(),
            matchSettings: getWatchMatchSettings(current),
            matchStatus,
            players: allPlayerEntries.map((entry) => entry.statePlayer),
            prompt,
            score,
            selectedPlayers,
            sideALabel: getWatchSideLabel(playerEntries, "A"),
            sideBLabel: getWatchSideLabel(playerEntries, "B"),
        }
    }

    async function updateWatchPointFlags(nextMatch) {
        if (isGamePoint(nextMatch) && isFinalGame(nextMatch)) {
            await Promise.all([
                setIsMatchPoint(matchIDRef.current, true),
                setIsGamePoint(matchIDRef.current, false),
            ])
            return
        }

        if (isGamePoint(nextMatch)) {
            await Promise.all([
                setIsGamePoint(matchIDRef.current, true),
                setIsMatchPoint(matchIDRef.current, false),
            ])
            return
        }

        await Promise.all([
            setIsGamePoint(matchIDRef.current, false),
            setIsMatchPoint(matchIDRef.current, false),
        ])
    }

    async function scoreWatchRally(side) {
        if (watchActionInFlightRef.current) {
            return
        }

        const current = matchSettingsRef.current || {}
        const matchID = matchIDRef.current
        if (!matchID || !hasActiveGame(current) || watchUIStateRef.current?.showGameWonConfirmationModal) {
            publishWatchStatus("No active rally action is available.")
            return
        }

        watchActionInFlightRef.current = true
        try {
            const gameNumber = getCurrentGameNumber(current)
            let newScore: any = false

            if (current.sportName === "pickleball") {
                const shouldAutoUpdateService = !current.isManualServiceMode
                const servicePlayers = {
                    currentReceiverPlayerField: current.currentReceiverPlayerField,
                    currentServerPlayerField: current.currentServerPlayerField,
                }

                if (side === "A") {
                    newScore = await AWonRally_PB(matchID, gameNumber, current.isACurrentlyServing, current.isSecondServer, current.isDoubles, current.scoringType === "rally", current.pointsToWinGame, current[`game${gameNumber}AScore`], shouldAutoUpdateService, servicePlayers)
                }
                else {
                    newScore = await BWonRally_PB(matchID, gameNumber, current.isACurrentlyServing, current.isSecondServer, current.isDoubles, current.scoringType === "rally", current.pointsToWinGame, current[`game${gameNumber}BScore`], shouldAutoUpdateService, servicePlayers)
                }
            }
            else {
                newScore = await AddPoint(matchID, gameNumber, side)
                if (!current.isManualServiceMode) {
                    const otherSide = side === "A" ? "B" : "A"
                    await updateService(matchID, current.isAInitialServer, gameNumber, newScore + (Number(current[`game${gameNumber}${otherSide}Score`]) || 0), current.changeServeEveryXPoints, current.pointsToWinGame, current.sportName, current.scoringType)
                }
            }

            if (typeof newScore !== "number") {
                publishWatchStatus("Rally updated.")
                return
            }

            const nextMatch = {
                ...current,
                [`game${gameNumber}${side}Score`]: newScore,
            }
            const nextGameScore = getCurrentGameScore(nextMatch)
            const isGameDone = isGameFinished(current.enforceGameScore, nextGameScore.a, nextGameScore.b, current.pointsToWinGame)

            await updateWatchPointFlags(nextMatch)
            if (isGameDone) {
                openGameWonConfirmationModal()
            }
        }
        finally {
            watchActionInFlightRef.current = false
        }
    }

    async function confirmCurrentGameFromWatch() {
        const current = matchSettingsRef.current || {}
        const matchID = matchIDRef.current
        if (!matchID || !watchUIStateRef.current?.showGameWonConfirmationModal) {
            publishWatchStatus("No game confirmation is waiting.")
            return
        }

        const gameNumber = getCurrentGameNumber(current)
        const updatedGameValues = await endGame(matchID, gameNumber)
        const updatedMatch = { ...current, ...updatedGameValues }
        const matchFinished = isMatchFinished(updatedMatch)

        if (current.scheduledMatchID) {
            const nextMatchScore = getMatchScore(updatedMatch)
            await updateScheduledMatchScoresForSource(
                current.scheduledSourceType || "table",
                current.scheduledSourceID || props.route.params.tableID,
                current.scheduledMatchID,
                matchID,
                nextMatchScore.a,
                nextMatchScore.b,
                {
                    gameScores: getFinishedGameScoresForWatch(updatedMatch),
                    isComplete: matchFinished,
                }
            )
        }

        const teamMatchIDForScore = current.teamMatchID || parentTeamMatchIDRef.current || teamMatchIDRef.current || ""
        if ((isTeamMatchRef.current || teamMatchIDForScore.length > 0) && !current.scheduledMatchID && matchFinished) {
            const finalScore = getMatchScore(updatedMatch)
            await addWinToTeamMatchTeamScore(teamMatchIDForScore, finalScore.a > finalScore.b ? "A" : "B")
        }

        closeGameWonConfirmationModal()
        openAfterGamePrompt(updatedMatch)
    }

    async function startNextGameFromWatch() {
        const current = matchSettingsRef.current || {}
        const matchID = matchIDRef.current
        if (!matchID || !(watchUIStateRef.current?.showInBetweenGamesModal || current.isInBetweenGames === true)) {
            publishWatchStatus("No next game is waiting.")
            return
        }

        const gameNumber = getCurrentGameNumber(current)
        await Promise.all([
            startGame(matchID, gameNumber),
            switchSides(matchID),
            updateService(matchID, current.isAInitialServer, gameNumber, 0, current.changeServeEveryXPoints, current.pointsToWinGame, current.sportName, current.scoringType),
        ])
        setShowInBetweenGamesModal(false)
    }

    async function archiveCurrentMatchForWatch(current, matchID) {
        if (isTeamMatchRef.current) {
            await archiveMatchForTeamMatch(teamMatchIDRef.current, teamMatchTableNumber.current, matchID, current)
            return
        }

        const teamMatchIDForArchive = current.teamMatchID || parentTeamMatchIDRef.current || ""
        if (teamMatchIDForArchive) {
            await archiveMatchForTeamMatch(
                teamMatchIDForArchive,
                current.teamMatchTableNumber || teamMatchTableNumber.current || "",
                matchID,
                current,
            )
            await removeTeamMatchCurrentMatch(
                teamMatchIDForArchive,
                current.teamMatchTableNumber || teamMatchTableNumber.current || "1",
            )
        }

        await archiveMatchForTable(props.route.params.tableID, matchID, current)
    }

    async function setupNewMatchFromWatch() {
        if (watchActionInFlightRef.current) {
            return
        }

        if (watchUIStateRef.current?.isKioskMode) {
            publishWatchStatus("New match setup is not available in kiosk mode.")
            return
        }

        const current = matchSettingsRef.current || {}
        const matchID = matchIDRef.current
        const currentMatchLoaded = watchUIStateRef.current?.currentMatchExists !== false && !!matchID
        const currentMatchComplete = currentMatchLoaded && (watchUIStateRef.current?.showEndOfMatchOptions || isMatchFinished(current))

        if (currentMatchLoaded && !currentMatchComplete) {
            publishWatchStatus("Finish the current match before setting up a new match.")
            return
        }

        watchActionInFlightRef.current = true
        try {
            const sportName = current.sportName || props.route.params.sportName || "tableTennis"
            const scoringType = current.scoringType !== undefined ? current.scoringType : props.route.params.scoringType || "normal"
            const previousMatchObj = currentMatchComplete
                ? JSON.parse(JSON.stringify({ ...current, sportName, scoringType }))
                : null
            let nextMatchID = ""

            if (currentMatchComplete) {
                await archiveCurrentMatchForWatch(current, matchID)
            }

            if (isTeamMatchRef.current) {
                nextMatchID = await createTeamMatchNewMatch(
                    teamMatchIDRef.current,
                    teamMatchTableNumber.current,
                    sportName,
                    previousMatchObj,
                    scoringType,
                )
            }
            else {
                nextMatchID = await createNewMatch(
                    props.route.params.tableID,
                    sportName,
                    previousMatchObj,
                    false,
                    scoringType,
                )
            }

            closeGameWonConfirmationModal()
            setShowEndOfMatchOptions(false)
            setShowInBetweenGamesModal(false)
            await onNewMatchCreation(nextMatchID, { preferScheduledMatches: false })
            openSetupWizard({ preferScheduledMatches: false })
            publishWatchStatus("New match setup ready.")
        }
        finally {
            watchActionInFlightRef.current = false
        }
    }

    async function startMatchFromWatch() {
        const current = matchSettingsRef.current || {}
        const matchID = matchIDRef.current

        if (!matchID) {
            publishWatchStatus("No configured match is ready to start.")
            return
        }

        if (hasActiveGame(current)) {
            publishWatchStatus("The match is already in progress.")
            return
        }

        if (current.isInBetweenGames === true || getCurrentGameNumber(current) !== 1) {
            publishWatchStatus("Use start next game while the match is between games.")
            return
        }

        const gameNumber = getCurrentGameNumber(current)
        const sportName = current.sportName || props.route.params.sportName || "tableTennis"
        const scoringType = current.scoringType || props.route.params.scoringType || "normal"
        const changeServeEvery = getWatchNumber(current.changeServeEveryXPoints, 2)
        const pointsToWinGame = getWatchNumber(current.pointsToWinGame, 11)
        await Promise.all([
            startGame(matchID, gameNumber),
            updateService(matchID, current.isAInitialServer === true, gameNumber, 0, changeServeEvery, pointsToWinGame, sportName, scoringType),
        ])
        setShowMatchSetupWizard(false)
        publishWatchStatus("Match started.")
    }

    async function selectPlayerFromWatch(slot, playerID) {
        const fieldBySlot = {
            a1: "playerA",
            a2: "playerA2",
            b1: "playerB",
            b2: "playerB2",
        }
        const targetField = fieldBySlot[slot]
        const selectedPlayerEntry = getAllWatchPlayerEntries(matchSettingsRef.current || {}).find((entry) => entry.statePlayer.id === playerID)

        if (!targetField || !selectedPlayerEntry) {
            publishWatchStatus("Player selection is not available for that player.")
            return
        }

        await updateCurrentPlayer(matchIDRef.current, targetField, selectedPlayerEntry.player)
    }

    async function setMatchFormatFromWatch(payload: Record<string, unknown> = {}) {
        if (!matchIDRef.current || !payload || typeof payload !== "object") {
            return
        }

        const translatedPayload = {
            ...payload,
            ...(typeof payload.doubles !== "undefined" ? { isDoubles: payload.doubles } : {}),
            ...(typeof payload.pointsToWin !== "undefined" ? { pointsToWinGame: payload.pointsToWin } : {}),
            ...(typeof payload.serveEvery !== "undefined" ? { changeServeEveryXPoints: payload.serveEvery } : {}),
            ...(typeof payload.winBy !== "undefined" ? { enforceGameScore: Number(payload.winBy) > 1 } : {}),
        }
        const allowedFields = ["bestOf", "pointsToWinGame", "changeServeEveryXPoints", "enforceGameScore", "isDoubles", "scoringType", "sportName"]
        const updates = allowedFields.reduce((nextUpdates, field) => {
            if (typeof translatedPayload[field] !== "undefined") {
                nextUpdates[field] = translatedPayload[field]
            }
            return nextUpdates
        }, {})

        if (Object.keys(updates).length > 0) {
            await db.ref(`matches/${matchIDRef.current}`).update(updates)
        }
    }

    async function handleWatchAction(action) {
        switch (action?.action) {
            case "rallyWon":
                if (action.side === "A" || action.side === "B") {
                    await scoreWatchRally(action.side)
                }
                return

            case "startMatch":
                await startMatchFromWatch()
                return

            case "confirmGame":
                await confirmCurrentGameFromWatch()
                return

            case "startNextGame":
                await startNextGameFromWatch()
                return

            case "confirmMatch":
                publishWatchStatus("Match complete. Finish match handling on the scoring screen.")
                return

            case "createNewMatch":
            case "setupNewMatch":
                await setupNewMatchFromWatch()
                return

            case "selectPlayer":
                await selectPlayerFromWatch(action.slot, action.playerId)
                return

            case "setMatchFormat":
                await setMatchFormatFromWatch(action.payload)
                return

            case "scoringAction":
            default:
                publishWatchStatus("Watch action ignored.")
                return
        }
    }

    useEffect(() => {
        if (!isWatchBridgeEnabled()) {
            return
        }

        return publishWhenBridgeReady(buildCurrentWatchState)
    }, [])

    useEffect(() => {
        if (!isWatchBridgeEnabled()) {
            return
        }

        publishWatchStatus(doneLoading ? "ready" : "loading")
        publishWatchState(buildCurrentWatchState())
    }, [
        currentMatchExists,
        doneLoading,
        matchSettings,
        showEndOfMatchOptions,
        showGameWonConfirmationModal,
        showInBetweenGamesModal,
        showMatchSetupWizard,
    ])

    useEffect(() => {
        if (!isWatchBridgeEnabled()) {
            return
        }

        return subscribeToWatchActions(handleWatchAction)
    }, [])

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
