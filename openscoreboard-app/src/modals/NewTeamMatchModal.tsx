import React, { useEffect, useState } from 'react';
import { Button, View, Modal, FormControl, Select, Text, Spinner } from 'native-base';
import { getUserPath } from '../../database';
import { openScoreboardButtonTextColor } from "../../openscoreboardtheme";
import { addNewTeamMatch } from '../functions/teammatches';
import { getMyTeams } from '../functions/teams';
import { newTeamMatch } from '../classes/TeamMatch';
import { DateTimePicker } from '../components/DateTimePicker';
import { supportedSports } from '../functions/sports';
import i18n from '../translations/translate';

export function NewTeamMatchModal(props) {
    let [loadingNewMatch, setLoadingNewMatch] = useState(false);
    let [teamSelectionList, setTeamSelectionList] = useState([]);
    let [selectedSport, setSelectedSport] = useState("tableTennis")
    let [selectedScoringType, setSelectedScoringType] = useState("")


    let [teamAID, setTeamAID] = useState("");
    let [teamBID, setTeamBID] = useState("");

    async function loadTeamSelection() {
        let teams = await getMyTeams(getUserPath());

        setTeamSelectionList(teams);
    }

    useEffect(() => {
        loadTeamSelection();
    }, []);

    let [matchTime, setMatchTime] = useState(new Date().toISOString().slice(0, 10));

    return (
        <Modal onClose={() => {
            props.onClose(false);
        }} isOpen={props.isOpen}>
            <Modal.Content>
                <Modal.CloseButton></Modal.CloseButton>
                <Modal.Header>{i18n.t("newTeamMatch")}</Modal.Header>
                <Modal.Body>
                    <FormControl>
                        <FormControl>{i18n.t("teamA")}</FormControl>
                        <Select selectedValue={teamAID} onValueChange={(val) => {
                            setTeamAID(val);
                        }}>
                            {teamSelectionList.map((team) => {
                                return (
                                    <Select.Item key={team[0] + "A"} label={team[1].name} value={team[1].id}></Select.Item>
                                );
                            })}
                        </Select>
                        <FormControl>{i18n.t("teamB")}</FormControl>
                        <Select selectedValue={teamBID} onValueChange={(val) => {
                            setTeamBID(val);
                        }}>
                            {teamSelectionList.map((team) => {
                                return (
                                    <Select.Item key={team[0] + "B"} label={team[1].name} value={team[1].id}></Select.Item>
                                );
                            })}
                        </Select>
                        <FormControl.Label>{i18n.t("matchTime")}</FormControl.Label>
                        <DateTimePicker type="date" value={matchTime} onChange={(event) => {
                            setMatchTime(event.target.value);
                        }}></DateTimePicker>
                    </FormControl>

                    <FormControl>
                        <FormControl.Label>
                            {i18n.t("sport")}
                        </FormControl.Label>
                        <Select selectedValue={selectedSport}
                        onValueChange={(sport)=>{
                            setSelectedSport(sport)
                            if( supportedSports[sport]?.hasScoringTypes){
                                setSelectedScoringType(Object.keys(supportedSports[sport]?.scoringTypes)[0])
                            }
                        }}
                        >
                                {
                                    Object.entries(supportedSports).map(([id, {displayName}])=>{
                                        return <Select.Item key={id} label={displayName} value={id}></Select.Item>
                                    })
                                }
                            </Select>

                            {
                                supportedSports[selectedSport]?.hasScoringTypes ?
<>
<FormControl.Label>
                            {i18n.t("scoringType")}
                        </FormControl.Label>
                        <Select selectedValue={selectedScoringType}
                        onValueChange={(type)=>{
                            setSelectedScoringType(type)
                        }}
                        >
                                {
                                    Object.entries(supportedSports[selectedSport]?.scoringTypes || {}).map(([id, {displayName}])=>{
                                        return <Select.Item key={id} label={displayName} value={id}></Select.Item>
                                    })
                                }
                            </Select>
</>

                                :null
                            }
                           </FormControl>
                </Modal.Body>
                <Modal.Footer>
                    <View padding={1}>
                        <Button
                            onPress={async () => {
                                setLoadingNewMatch(true);
                                await addNewTeamMatch(newTeamMatch(teamAID, teamBID, matchTime, selectedSport,selectedScoringType));

                                setLoadingNewMatch(false);
                                props.onClose();
                            }}
                        >
                            {loadingNewMatch ?
                                <Spinner></Spinner>
                                :
                                <Text color={openScoreboardButtonTextColor}>{i18n.t("create")}</Text>}

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
