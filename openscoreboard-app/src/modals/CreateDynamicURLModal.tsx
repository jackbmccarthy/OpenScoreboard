import React, { useEffect, useRef, useState } from 'react';
import { Button, View, Modal, Text, Input, FormControl, Select, Spinner, Divider } from 'native-base';
import { getUserPath } from '../../database';
import { openScoreboardButtonTextColor, openScoreboardColor } from "../../openscoreboardtheme";
import { createDynamicURL } from '../functions/dynamicurls';
import { getMyTables } from '../functions/tables';
import getMyTeamMatches, { getTeamMatchCurrentMatches } from '../functions/teammatches';
import { getMyScoreboards } from '../functions/scoreboards';
import i18n from '../translations/translate';


export function CreateDynamicURLModal(props) {
    let [doneLoading, setDoneLoading] = useState(false);
    let [tableList, setTableList] = useState([]);
    let [teamMatchList, setTeamMatchList] = useState([]);
    let [tableNumberList, setTableNumberList] = useState([]);

    let [selectedTableNumber, setSelectedTableNumber] = useState("");
    let [selectedTeamMatchID, setSelectedTeamMatchID] = useState("");
    let [selectedTableID, setSelectedTableID] = useState("");
    let [selectedScoreboardID, setSelectedScoreboardID] = useState("")
    //let [urlName, setURLName] = useState("");
    let [loadingNewURL, setLoadingNewURL] = useState(false);
    let [loadingScoreboards, setLoadingScoreboards] = useState(true)
    let [scoreboardList, setScoreboardList] = useState([])

    let dynamicURLNameRef = useRef<HTMLInputElement>()

    async function loadAllOptions() {
        let tableList = await getMyTables();
        setTableList(tableList);
        let myTeamMatches = await getMyTeamMatches(getUserPath());
        setTeamMatchList(myTeamMatches);
        await loadScoreboards()


    }

    const onAddDynamicList = async () => {
        let urlName = dynamicURLNameRef.current.value
        if (urlName.length > 0 && (selectedTableID.length > 0 || selectedTeamMatchID.length > 0)) {
            setLoadingNewURL(true);
            await createDynamicURL(urlName, selectedTableID, selectedTeamMatchID, selectedTableNumber, selectedScoreboardID);
            props.onClose(true);
            setLoadingNewURL(false);
        }

    }

    async function loadScoreboards() {
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
                <Modal.Header>{i18n.t("newDynamicURL")}</Modal.Header>
                <Modal.Body>
                    <FormControl>
                        <FormControl.Label>{i18n.t("dynamicURLName")}</FormControl.Label>
                        <Input
                        ref={dynamicURLNameRef}
                       // value={urlName}
                           // onChangeText={setURLName}
                        ></Input>
                        <FormControl.Label>{i18n.t("selectTable")}</FormControl.Label>
                        {tableList.length > 0 ?
                            <Select
                                selectedValue={selectedTableID}
                                onValueChange={(value) => {
                                    setSelectedTableID(value);
                                    setSelectedTableNumber("0");
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
                            <Text>{i18n.t("noTablesCannotAssign")}</Text>}

                        <View>
                            <Text fontWeight={"bold"} textAlign="center" fontSize={"xl"}>OR</Text>
                        </View>
                        <FormControl.Label>{i18n.t("selectTeamMatch")}</FormControl.Label>
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
                            <Text>{i18n.t("noTeamMatchsCannotAssign")}</Text>}

                        <FormControl.Label>{i18n.t("selectTableNumber")}</FormControl.Label>
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
                            <Text>{i18n.t("noTablesCannotAssign")}</Text>}
                        <Divider></Divider>
                        <FormControl.Label>{i18n.t("selectScoreboard")}</FormControl.Label>
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
                                        <Text>{i18n.t("noScoreboardsCannotAssign")}</Text>

                                }
                            </>
                        }

                    </FormControl>


                </Modal.Body>
                <Modal.Footer>
                    <View>
                        <Button
                            onPress={onAddDynamicList}
                        >
                            {loadingNewURL ?
                                <Spinner color={openScoreboardButtonTextColor}></Spinner>
                                :
                                <Text color={openScoreboardButtonTextColor}>{i18n.t("create")}</Text>}
                        </Button>
                    </View>
                    <View>
                        <Button variant={"ghost"}
                            onPress={() => {
                                props.onClose();
                            }}
                        >
                            <Text>{i18n.t("close")}</Text>
                        </Button>
                    </View>

                </Modal.Footer>
            </Modal.Content>
        </Modal>
    );
}
