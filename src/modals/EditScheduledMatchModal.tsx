import React, { useEffect, useState } from 'react';
import { View, Modal } from 'native-base';
import LoadingPage from '../LoadingPage';
import { getMatchData } from '../functions/scoring';
import { MatchSetup } from './MatchSetupWizard';

export function EditScheduledMatchModal(props) {
    let [editPlayer, setEditPlayer] = useState("");
    let [reload, setReload] = useState(false);
    let [estimatedMatchTime, setEstimatedMatchTime] = useState(new Date().toLocaleString(Intl.Locale, { timeStyle: "short", "hour12": false }));
    let [estimatedMatchDate, setEstimatedMatchDate] = useState(new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60 * 1000)).toISOString().split('T')[0]);
    let [createdMatchKey, setCreatedMatchKey] = useState("");
    let [isMatchCreated, setIsMatchCreated] = useState(false);
    let [newMatchData, setNewMatchData] = useState({});
    let [newSchedMatchID, setNewSchedMatchID] = useState("");
    let [schedMatchStartTime, setSchedMatchStartTime] = useState("");
    let [showLoadingNewMatch, setShowLoadingNewMatch] = useState(false);
    let [doneLoading, setDoneLoading] = useState(false);

    const updateMatchPlayer = (player, playerInfo) => {
        let newPlayer = { ...newMatchData };
        newPlayer[player] = playerInfo;
        setNewMatchData(newPlayer);
    };

    async function loadMatch() {
        setDoneLoading(false);
        let matchData = await getMatchData(props.matchID);
        setNewMatchData(matchData);
        setDoneLoading(true);
    }

    useEffect(() => {
        loadMatch();
    }, []);


    return (
        <Modal isOpen={props.isOpen} onClose={() => {
            props.onClose(reload);
        }}>
            <Modal.Content>
                <Modal.Body>
                    {doneLoading ?
                        <View padding={2}>
                            <MatchSetup matchID={props.matchID} isScheduling={true} scheduledMatchID={props.scheduledMatchID}
                                schedMatchStartTime={props.scheduledMatchStartTime}

                                updateMatchPlayer={updateMatchPlayer}
                                {...newMatchData}
                                player={editPlayer}
                                setEditPlayer={setEditPlayer} {...props}></MatchSetup>
                        </View>
                        : <LoadingPage></LoadingPage>}



                </Modal.Body>
            </Modal.Content>
        </Modal>
    );
}
