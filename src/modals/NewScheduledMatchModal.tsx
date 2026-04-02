import React, { useState } from 'react';
import { View, Text, Button, FormControl, Modal } from 'native-base';
import { openScoreboardButtonTextColor } from "../../openscoreboardtheme";
import { DateTimePicker } from '../components/DateTimePicker';
import { addScheduledMatch, createNewMatch, createNewScheduledMatch, getMatchData } from '../functions/scoring';
import { MatchSetup } from './MatchSetupWizard';
import i18n from '../translations/translate';

export function NewScheduledMatchModal(props) {
    let [editPlayer, setEditPlayer] = useState("");
    let [reload, setReload] = useState(false);
    let [estimatedMatchTime, setEstimatedMatchTime] = useState(new Date().toLocaleString(Intl.Locale, { timeStyle: "short", "hour12": false }).replace("24:", "00:"));
    let [estimatedMatchDate, setEstimatedMatchDate] = useState(new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60 * 1000)).toISOString().split('T')[0]);
    let [createdMatchKey, setCreatedMatchKey] = useState("");
    let [isMatchCreated, setIsMatchCreated] = useState(false);
    let [newMatchData, setNewMatchData] = useState({});
    let [newSchedMatchID, setNewSchedMatchID] = useState("");
    let [schedMatchStartTime, setSchedMatchStartTime] = useState("");
    let [showLoadingNewMatch, setShowLoadingNewMatch] = useState(false);

    const updateMatchPlayer = (player, playerInfo) => {
        let newPlayer = { ...newMatchData };
        newPlayer[player] = playerInfo;
        setNewMatchData(newPlayer);
    };

    console.log(props)


    return (
        <Modal isOpen={props.isOpen} onClose={() => {
            props.onClose(reload);
        }}>
            <Modal.Content>
                <Modal.CloseButton></Modal.CloseButton>

                <Modal.Body>
                    {isMatchCreated ?
                        <View padding={2}>
                            <MatchSetup matchID={createdMatchKey} isScheduling={true} scheduledMatchID={newSchedMatchID} schedMatchStartTime={schedMatchStartTime}
                                updateMatchPlayer={updateMatchPlayer}
                                {...newMatchData} player={editPlayer} setEditPlayer={setEditPlayer} {...props}></MatchSetup>
                        </View>

                        :
                        <FormControl>

                            <View padding={1}>
                                <FormControl.Label>{i18n.t("estimatedStartDate")}</FormControl.Label>
                                <DateTimePicker type="date" value={estimatedMatchDate} onChange={(event) => {
                                    setReload(true);
                                    setEstimatedMatchDate(event.target.value);
                                }}></DateTimePicker>
                            </View>
                            <FormControl.Label>{i18n.t("estimatedStartTime")}</FormControl.Label>
                            <View padding={1}>
                                <DateTimePicker type="time" value={estimatedMatchTime} onChange={(event) => {
                                    setReload(true);
                                    setEstimatedMatchTime(event.target.value);
                                }}></DateTimePicker>
                            </View>
                            <Button
                                onPress={async () => {
                                    if (props.isTeamMatch) {
                                    }
                                    else {
                                        setShowLoadingNewMatch(true);
                                        let startingDateAndTime = new Date(estimatedMatchDate + " " + estimatedMatchTime);
                                        let newMatchKey = await createNewScheduledMatch(props.route.params.sportName);
                                        setCreatedMatchKey(newMatchKey);
                                        setSchedMatchStartTime(startingDateAndTime.toISOString());
                                        setIsMatchCreated(true);
                                        setNewMatchData(await getMatchData(newMatchKey));
                                        setNewSchedMatchID(await addScheduledMatch(props.route.params.tableID, newMatchKey, startingDateAndTime.toISOString()));
                                        setShowLoadingNewMatch(false);
                                    }


                                }}
                            >
                                <Text color={openScoreboardButtonTextColor}>{i18n.t("createMatch")}</Text>
                            </Button>
                        </FormControl>}

                </Modal.Body>
            </Modal.Content>
        </Modal>
    );
}
