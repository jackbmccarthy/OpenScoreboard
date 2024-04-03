import React, { useEffect, useState } from 'react';
import { Button, View, Modal, AddIcon, Text } from 'native-base';
import { openScoreboardButtonTextColor, openScoreboardColor } from "../../openscoreboardtheme";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { addTeamMatchCurrentMatch, getTeamMatchCurrentMatches } from '../functions/teammatches';
import i18n from '../translations/translate';

export function SelectTeamMatchTableModal(props) {

    let [doneLoading, setDoneLoading] = useState(false);
    let [loadingNewTable, setLoadingNewTable] = useState(false);
    let [tableList, setTableList] = useState({});
    async function loadCurrentTeamMatches(teamMatchID) {
        setDoneLoading(false);
        let tables = await getTeamMatchCurrentMatches(teamMatchID);
        setTableList(tables);
        setDoneLoading(true);
    }

    useEffect(() => {

        if (props.teamMatchID && props.teamMatchID.length) {
     
            loadCurrentTeamMatches(props.teamMatchID);
        }
    }, [props.teamMatchID]);


    return (
        <Modal onClose={() => {
            props.onClose(false);
        }} isOpen={props.isOpen}>
            <Modal.Content>
                <Modal.CloseButton></Modal.CloseButton>
                <Modal.Header>{i18n.t("selectTable")}</Modal.Header>
                <Modal.Body>
                    <View>
                        {Object.entries(tableList).sort((a, b) => {
                            return parseInt(a[0]) > parseInt(b[0]) ? 1 : -1;
                        }).map((table, index) => {
                            return (
                                <View key={index} padding={1}>
                                    <View alignItems={"center"} justifyContent="space-between" flexDirection={"row"}>
                                        <Text>Table {table[0]}</Text>
                                        <View flexDirection={"row"} alignItems="center">
                                          <Button variant={"ghost"}
                                            onPress={() => {
                                                props.goToKeepScore(props.teamMatchID, table[0], props.sportName,props.scoringType);
                                            }}
                                        >
                                            <MaterialCommunityIcons name="scoreboard" size={24} color={openScoreboardColor} />

                                        </Button>
                                        <Button variant={"ghost"}
                                            onPress={() => {
                                                props.onClose(false)
                                                props.openTeamMatchLink(props.teamMatchID, table[0],props.sportName,props.scoringType);
                                            }}
                                        >
                                            <MaterialCommunityIcons name="share" size={24} color={openScoreboardColor} />

                                        </Button>  
                                        </View>
                                        
                                    </View>


                                </View>
                            );
                        })}
                    </View>
                    <View>
                        <Button
                            onPress={async () => {

                                let keyArray = Object.keys(tableList).filter((filter) => { return !isNaN(filter); }).map((key) => {

                                    return parseInt(key);
                                });
                                let largestTable = Math.max(...keyArray);
                                setLoadingNewTable(true);
                                await addTeamMatchCurrentMatch(props.teamMatchID, (largestTable + 1).toString());
                                setTableList({ ...tableList, [(largestTable + 1).toString()]: "" });
                                setLoadingNewTable(false);
                            }}
                        >
                            <AddIcon color={openScoreboardButtonTextColor} />
                        </Button>
                    </View>
                </Modal.Body>
                <Modal.Footer>
                    {/* <View padding={1}>
                <Button
                    onPress={async () => {
                      setLoadingNewMatch(true)
                       await addNewTeamMatch(newTeamMatch(teamAID,teamBID,matchTime))

                      setLoadingNewMatch(false)
                    props.onClose()
                    }}
                >
               <Text>Go</Text>
                </Button>
            </View>
            <View padding={1}>
                <Button
                
                variant={"ghost"}
                    onPress={() => {
                        
                        props.onClose(false)
                    }}
                ><Text>Close</Text>
                </Button>
            </View> */}
                </Modal.Footer>
            </Modal.Content>
        </Modal>
    );
}
