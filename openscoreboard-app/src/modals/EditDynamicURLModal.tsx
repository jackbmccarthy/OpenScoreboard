import React, { useEffect, useState } from 'react';
import { Button, View, Modal, Text, Input, FormControl, Select, Spinner, Divider } from 'native-base';
import { getUserPath } from '../../database';
import { openScoreboardButtonTextColor, openScoreboardColor } from "../../openscoreboardtheme";
import { updateDynamicURL } from '../functions/dynamicurls';
import { getMyTables } from '../functions/tables';
import getMyTeamMatches, { getTeamMatchCurrentMatches } from '../functions/teammatches';
import { getMyScoreboards } from '../functions/scoreboards';


export function EditDynamicURLModal(props) {
    let [doneLoading, setDoneLoading] = useState(false);
    let [tableList, setTableList] = useState([]);
    let [teamMatchList, setTeamMatchList] = useState([]);
    let [tableNumberList, setTableNumberList] = useState([]);

    let [selectedTableNumber, setSelectedTableNumber] = useState("");
    let [selectedTeamMatchID, setSelectedTeamMatchID] = useState("");
    let [selectedTableID, setSelectedTableID] = useState("");
    let [selectedScoreboardID, setSelectedScoreboardID] = useState("")
    let [urlName, setURLName] = useState("");
    let [loadingNewURL, setLoadingNewURL] = useState(false);

    let [loadingScoreboards, setLoadingScoreboards] = useState(true)
    let [scoreboardList, setScoreboardList] = useState([])
    useEffect(() => {
        setSelectedTableID(props.tableID);
        setSelectedTeamMatchID(props.teammatchID);
        setSelectedTableNumber(props.tableNumber);
        setSelectedScoreboardID(props.scoreboardID)
        setURLName(props.dynamicURLName);

        if (props.teammatchID && props.teammatchID.length > 0) {
            loadTableNumbersOnTeamMatch(props.teammatchID);
        }
    }, [props.id]);

    async function loadAllOptions() {
        let tableList = await getMyTables();
        setTableList(tableList);
        let myTeamMatches = await getMyTeamMatches(getUserPath());
        setTeamMatchList(myTeamMatches);
        await loadScoreboards()


    }

    async function loadScoreboards(){
        setLoadingScoreboards(true)
       let myScoreboards = await getMyScoreboards(getUserPath())
       setScoreboardList(myScoreboards)
       setLoadingScoreboards(false)
    }

    async function loadTableNumbersOnTeamMatch(teamMatchID) {
        let tableNumbers = await getTeamMatchCurrentMatches(teamMatchID);
        setTableNumberList(tableNumbers);
    }

    useEffect(() => {
        loadAllOptions();
    }, []);


    return (
        <Modal isOpen={props.isOpen} onClose={() => { props.onClose(); }}>
            <Modal.Content>
                <Modal.CloseButton></Modal.CloseButton>
                <Modal.Header>Edit Dynamic URL</Modal.Header>
                <Modal.Body>
                    <FormControl>
                        <View padding={1}>
<FormControl.Label>Dynamic URL Name</FormControl.Label>
                        <Input value={urlName}
                            onChangeText={setURLName}
                        ></Input>
                        </View>
                        <Divider></Divider>

                        <View padding={1}>
<FormControl.Label>Select Table</FormControl.Label>
                        {tableList.length > 0 ?
                            <Select
                                selectedValue={selectedTableID}
                                onValueChange={(value) => {
                                    setSelectedTableID(value);
                                    setSelectedTableNumber(0);
                                    setSelectedTeamMatchID("");
                                }}
                            >
                                {tableList.map((table) => {
                                    return (
                                        <Select.Item key={table[0]} label={table[1].tableName} value={table[0]}></Select.Item>
                                    );
                                })}
                            </Select>
                            :
                            <Text>No tables have been created, so none can be assigned.</Text>}

                        <View>
                            <Text fontWeight={"bold"} textAlign="center" fontSize={"xl"}>OR</Text>
                        </View>
                        <FormControl.Label>Select Team Match</FormControl.Label>
                        {teamMatchList.length > 0 ?
                            <Select selectedValue={selectedTeamMatchID}
                                onValueChange={(value) => {
                                    setSelectedTeamMatchID(value);
                                    loadTableNumbersOnTeamMatch(value);
                                    setSelectedTableID("");
                                }}
                            >
                                {teamMatchList.map((teammatch) => {
                                    return (
                                        <Select.Item key={teammatch[0]} label={`(${teammatch[1].startTime})${teammatch[1].teamAName} vs ${teammatch[1].teamBName}`} value={teammatch[1].id}></Select.Item>
                                    );
                                })}
                            </Select>
                            :
                            <Text>No team matches have been created, so none can be assigned.</Text>}

                        <FormControl.Label>Select Table Number</FormControl.Label>
                        {tableNumberList.length > 0 ?
                            <Select selectedValue={selectedTableNumber}
                                onValueChange={(value) => {
                                    setSelectedTableNumber(value);
                                }}
                            >
                                {tableNumberList.map((tableNumber, index) => {
                                    return (
                                        <Select.Item key={index} label={`Table ${index}`} value={index.toString()}></Select.Item>
                                    );
                                })}
                            </Select>
                            :
                            <Text>No tables have been created, so none can be assigned.</Text>}

                        </View>
                        
<Divider></Divider>
<FormControl.Label>Select Scoreboard</FormControl.Label>
{scoreboardList.length > 0 ?
                            <Select selectedValue={selectedScoreboardID}
                                onValueChange={(value) => {
                                    setSelectedScoreboardID(value);
                                }}
                            >
                                {scoreboardList.map((scoreboard, index) => {
                                    return (
                                        <Select.Item key={index} label={scoreboard[1].name} value={scoreboard[1].id}></Select.Item>
                                    );
                                })}
                            </Select>
                            :
                            <>
                            {
                                loadingScoreboards ?
                                <Spinner color={openScoreboardColor}></Spinner>
                                :
                                                            <Text>No scoreboards have been created, so none can be assigned.</Text>

                            }
                            </>
                            }
                    </FormControl>


                </Modal.Body>
                <Modal.Footer>
                    <View>
                        <Button
                            onPress={async () => {
                                setLoadingNewURL(true);
                                await updateDynamicURL(props.myID, urlName, selectedTableID, selectedTeamMatchID, selectedTableNumber, selectedScoreboardID);
                                props.onClose(true);
                                setLoadingNewURL(false);
                            }}
                        >
                            {loadingNewURL ?
                                <Spinner color={openScoreboardButtonTextColor}></Spinner>
                                :
                                <Text color={openScoreboardButtonTextColor}>Save</Text>}

                        </Button>
                    </View>
                    <View>
                        <Button variant={"ghost"}
                            onPress={() => {
                                props.onClose();
                            }}
                        >
                            <Text>Close</Text>
                        </Button>
                    </View>

                </Modal.Footer>
            </Modal.Content>
        </Modal>
    );
}
