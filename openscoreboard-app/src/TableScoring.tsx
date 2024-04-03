import React, { Component, useEffect, useRef, useState } from 'react';
import { PanResponder, TouchableOpacity } from 'react-native';

import { Icon, NativeBaseProvider, View, ScrollView } from 'native-base';
import { openScoreboardTheme } from "../openscoreboardtheme";
import LoadingPage from './LoadingPage';
import { getCurrentGameNumber, getCurrentMatchForTable, getMatchData,  hasActiveGame, isGameFinished, isMatchFinished, subscribeToAllMatchFields, unsubscribeToAllMatchFields, watchForPasswordChange } from './functions/scoring';
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
import { addWinToTeamMatchTeamScore, getTeamMatchCurrentMatch } from './functions/teammatches';
import Unauthorized from './Unauthorized';
import { getTablePassword } from './functions/tables';
import { ScoringSidePickleball } from './components/ScoringSidePickleball';
import Match from './classes/Match';


export default function TableScoring(props) {

    React.useEffect(() => {
        props.navigation.setOptions({
            title: decodeURI(props.route.params.name),
        });
    }, [props.navigation]);

    let matchIDRef = useRef("")
    let activeListeners = useRef([])
    let teamMatchIDRef = useRef(props.route.params.teamMatchID)
    let isTeamMatchRef = useRef(props.route.params.isTeamMatch)
    let teamMatchTableNumber = useRef(props.route.params.tableNumber)

    let [doneLoading, setDoneLoading] = useState(false)
    let [matchSettings, setMatchSettings] = useState({})
    let [currentMatchExists, setCurrentMatchExists] = useState(null)
    let fieldLoadedCount = useRef(0)
    let matchSettingsCount = useRef(0)
 

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
    let [showEndOfMatchOptions, setShowEndOfMatchOptions] = useState(false)

    useEffect(()=>{
       let unSub =  watchForPasswordChange(props.route.params.tableID, (password)=>{
            if(!isTeamMatchRef.current && password !== props.route.params.password){
                setUnAuthorized(true)
                setDoneLoading(false)
            }
        })
        return unSub
    }, [])


    const SportScoring = (matchProps) =>{

        const [isSwitched, setIsSwitched] = useState(matchProps.isSwitched)


        useEffect(()=>{
            if(isSwitched !== matchProps.isSwitched){
                setIsSwitched(matchProps.isSwitched)
            }
        }, [matchProps.isSwitched])
        switch (props.route.params.sportName) {
            case "pickleball":
            if(matchSettings){
                return(
                    <View flexDirection={"row"} width="100%" flex={1}>
                        {
                isSwitched ?
                    <ScoringSidePickleball matchID={matchIDRef.current}
                        openGameWonConfirmationModal={openGameWonConfirmationModal}

                        openPlayerModal={openPlayerModal}

                        isA={false} {...matchSettings}></ScoringSidePickleball> :
                    <ScoringSidePickleball matchID={matchIDRef.current}
                        openGameWonConfirmationModal={openGameWonConfirmationModal}

                        openPlayerModal={openPlayerModal}
                        isA={true} {...matchSettings}></ScoringSidePickleball>
            }
            {
                isSwitched ?
                    <ScoringSidePickleball matchID={matchIDRef.current}
                        openGameWonConfirmationModal={openGameWonConfirmationModal}

                        openPlayerModal={openPlayerModal}
                        isA={true} {...matchSettings}></ScoringSidePickleball>
                    :
                    <ScoringSidePickleball matchID={matchIDRef.current}
                        openGameWonConfirmationModal={openGameWonConfirmationModal}

                        openPlayerModal={openPlayerModal}
                        isA={false} {...matchSettings}></ScoringSidePickleball>
            }
                    </View>
                )
            }
                
                break;
        
            default:
                return (
        <View flexDirection={"row"} width="100%" flex={1}>
            {
                matchSettings?.isSwitched ?
                    <ScoringSide matchID={matchIDRef.current}
                        openGameWonConfirmationModal={openGameWonConfirmationModal}

                        openPlayerModal={openPlayerModal}

                        isA={false} {...matchSettings}></ScoringSide> :
                    <ScoringSide matchID={matchIDRef.current}
                        openGameWonConfirmationModal={openGameWonConfirmationModal}

                        openPlayerModal={openPlayerModal}
                        isA={true} {...matchSettings}></ScoringSide>
            }
            {
                matchSettings?.isSwitched ?
                    <ScoringSide matchID={matchIDRef.current}
                        openGameWonConfirmationModal={openGameWonConfirmationModal}

                        openPlayerModal={openPlayerModal}
                        isA={true} {...matchSettings}></ScoringSide>
                    :
                    <ScoringSide matchID={matchIDRef.current}
                        openGameWonConfirmationModal={openGameWonConfirmationModal}

                        openPlayerModal={openPlayerModal}
                        isA={false} {...matchSettings}></ScoringSide>
            }
            {/* <ScoringSide isA={true} {...matchSettings}></ScoringSide>
        <ScoringSide isA={false} {...matchSettings}></ScoringSide> */}
        </View>            
                )
                break;
        }
        
        
    }


    async function loadTableScoring(tableId) {

        let password = await getTablePassword(tableId)

        
        if(!isTeamMatchRef.current && password !== props.route.params.password){
            setUnAuthorized(true)
            setDoneLoading(false)
            return
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
            let matchData = await getMatchData(currentMatchID)
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
                setMatchSettings((previousState) => {
                    if (previousState && previousState[key] !== value) {
                       
                        return { ...previousState, [key]: value }
                    }
                    else {
                        return previousState
                    }
                })
                fieldLoadedCount.current = fieldLoadedCount.current + 1

                if (doneLoading === false && fieldLoadedCount.current >= matchSettingsCount.current) {
                    setDoneLoading(true)
                }
          
            })
            activeListeners.current = allFieldListeners
            return matchData
        }
        else {
            setCurrentMatchExists(false)
            setDoneLoading(true)
        }

    }
    useEffect(() => {


        let matchInitialValues = loadTableScoring(props.route.params.tableID)
        return () => {
            
            activeListeners.current.forEach(offFunc => {
                offFunc()
            });

        }
    }, [])

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
    const openSetupWizard = () => {
        setShowMatchSetupWizard(true)
    }

    const onNewMatchCreation = async (matchID) => {
        await unsubscribeToAllMatchFields(matchIDRef.current, matchSettings)
        // let matchData = await getMatchData(matchID)
        // matchIDRef.current = matchID
        // setMatchSettings(matchData)
        // subscribeToAllMatchFields(matchIDRef.current, matchData)
        loadTableScoring(props.route.params.tableID)
    }


    if (doneLoading) {
        return (
            <NativeBaseProvider theme={openScoreboardTheme}>
                <View flex={1} height={"100%"} width="100%">
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
                    <SportScoring {...matchSettings}></SportScoring>

                    {
                        showEndOfMatchOptions ?
                            <MatchFinishedModal
                                loadTableScoring={loadTableScoring}
                                openSetupWizard={openSetupWizard} onNewMatchCreation={onNewMatchCreation} tableID={props.route.params.tableID} matchID={matchIDRef.current}
                                isOpen={showEndOfMatchOptions}
                                onClose={() => { setShowEndOfMatchOptions(false) }}
                                {...matchSettings}
                                {...props}
                                isTeamMatch={isTeamMatchRef.current}
                                tableNumber={teamMatchTableNumber.current}
                                teamMatchID={teamMatchIDRef.current}></MatchFinishedModal>
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
                                {...props}
                                player={editPlayer}
                                setEditPlayer={setEditPlayer}
                                onClose={() => { setShowMatchSetupWizard(false) }}
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
                    {currentMatchExists === false ?
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
                                isTeamMatch={isTeamMatchRef.current}
                                tableNumber={teamMatchTableNumber.current}
                                teamMatchID={teamMatchIDRef.current} ></GameWonConfirmationModal>
                            : null
                    }

                    {
                        showEditPlayer ?
                            <EditPlayerModal
                            matchID={matchIDRef.current}
                                player={editPlayer}
                                isOpen={showEditPlayer}
                                onClose={closePlayerModal}
                                {...matchSettings}
                                {...props} isTeamMatch={isTeamMatchRef.current}
                                tableNumber={teamMatchTableNumber.current}
                                teamMatchID={teamMatchIDRef.current}></EditPlayerModal>
                            : null
                    }


                    {
                        showAdvanceSettingsModal ?
                            <AdvanceSettingsModal {...matchSettings}
                                {...props}
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