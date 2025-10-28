import React, { useEffect, useState } from 'react';
import { Button, View, Modal, FormControl, Select, Text, Spinner, MinusIcon, AddIcon } from 'native-base';
import { getUserPath } from '../../database';
import { openScoreboardButtonTextColor } from "../../openscoreboardtheme";
import { addNewTeamMatch, setTeamMatchTeamScore } from '../functions/teammatches';
import { getMyTeams } from '../functions/teams';
import { newTeamMatch } from '../classes/TeamMatch';
import { DateTimePicker } from '../components/DateTimePicker';
import i18n from '../translations/translate';

export function EditTeamMatchModal(props) {
    let [loadingEditMatch, setLoadingEditMatch] = useState(false);
    let [teamSelectionList, setTeamSelectionList] = useState([]);

    let [teamAScore, setTeamAScore] = useState(0)
    let [teamBScore, setTeamBScore] = useState(0)

    useEffect(() => {
        setTeamAScore(props.teamAScore)
        setTeamBScore(props.teamBScore)
    }, [props.isOpen])

    let [teamAID, setTeamAID] = useState("");
    let [teamBID, setTeamBID] = useState("");

    async function loadTeamSelection() {
        let teams = await getMyTeams(getUserPath());
        setTeamSelectionList(teams);
    }
    useEffect(() => {
        loadTeamSelection();
    }, []);

    return (
        <Modal onClose={() => {
            props.onClose(false);
        }} isOpen={props.isOpen}>
            <Modal.Content>
                <Modal.CloseButton></Modal.CloseButton>
                <Modal.Header>{i18n.t("Edit Team Match")}</Modal.Header>
                <Modal.Body>
                    <FormControl>
                        <FormControl.Label>{props.teamAName} {i18n.t("score")}</FormControl.Label>
                        <View flexDirection={"row"} alignItems="center">
                            <View padding={1}>
                                <Button onPress={() => {
                                    if (teamAScore > 0) {
                                        let newAScore = parseInt(teamAScore) - 1
                                        setTeamAScore(newAScore)
                                    }

                                }}>
                                    <MinusIcon color={openScoreboardButtonTextColor}></MinusIcon>
                                </Button>
                            </View>
                            <View padding={1}>
                                <Text fontSize={"xl"} fontWeight="bold">{teamAScore}</Text>
                            </View>

                            <View padding={1}>
                                <Button onPress={() => {
                                    let newAScore = parseInt(teamAScore) + 1
                                    setTeamAScore(newAScore)

                                }}>
                                    <AddIcon color={openScoreboardButtonTextColor}></AddIcon>
                                </Button>
                            </View>
                        </View>

                        <FormControl.Label>{props.teamBName} {i18n.t("score")}</FormControl.Label>
                        <View flexDirection={"row"} alignItems="center">
                            <View padding={1}>
                                <Button onPress={() => {
                                    if (teamBScore > 0) {
                                        let newBScore = parseInt(teamBScore) - 1
                                        setTeamBScore(newBScore)
                                    }

                                }}>
                                    <MinusIcon color={openScoreboardButtonTextColor}></MinusIcon>
                                </Button>
                            </View>
                            <View padding={1}>
                                <Text fontSize={"xl"} fontWeight={"bold"}>{teamBScore}</Text>
                            </View>

                            <View padding={1}>
                                <Button onPress={() => {
                                    let newBScore = parseInt(teamBScore) + 1
                                    setTeamBScore(newBScore)

                                }}>
                                    <AddIcon color={openScoreboardButtonTextColor}></AddIcon>
                                </Button>
                            </View>
                        </View>
                    </FormControl>




                </Modal.Body>
                <Modal.Footer>
                    <View padding={1}>
                        <Button
                            onPress={async () => {
                                setLoadingEditMatch(true);
                                // await addNewTeamMatch(newTeamMatch(teamAID, teamBID, matchTime));
                                await setTeamMatchTeamScore(props.id, teamAScore, teamBScore)
                                setLoadingEditMatch(false);
                                props.onClose(true);
                            }}
                        >
                            {loadingEditMatch ?
                                <Spinner></Spinner>
                                :
                                <Text color={openScoreboardButtonTextColor}>{i18n.t("save")}</Text>}

                        </Button>
                    </View>
                    <View padding={1}>
                        <Button

                            variant={"ghost"}
                            onPress={() => {

                                props.onClose(false);
                            }}
                        ><Text>{i18n.t("close")}</Text>
                        </Button>
                    </View>
                </Modal.Footer>
            </Modal.Content>
        </Modal>
    );
}
