import React, { Component, useEffect, useRef, useState } from 'react';
import { View, Input, Text, Button, Modal, FormControl, Divider, Select, Spinner, } from 'native-base';
import { ScrollView, Platform, Dimensions } from 'react-native';

//import DatePicker from 'react-native-datepicker';
import db, { getUserPath } from '../../database';
import { openScoreboardTheme } from "../../openscoreboardtheme";
import Table from '../classes/Table';
import { getMyPlayerLists } from '../functions/players';
import { supportedSports } from '../functions/sports';
import { createNewTable } from '../functions/tables';
import i18n from '../translations/translate';




export default function CreateNewTableModal(props) {

    let [tableName, setTableName] = useState("")
    let [tableNameError, setTableNameError] = useState("")
    let [isLoadingTable, setIsLoadingTable] = useState(false)
    let [myPlayerLists, setMyPlayerLists] = useState([])
    let [selectedPlayerListID, setSelectedPlayerListID] = useState("")
    let [selectedSport, setSelectedSport] = useState("tableTennis")
    let [selectedScoringType, setSelectedScoringType] = useState("")
    let [tableMode, setTableMode] = useState("standard")

    let tableNameInput = useRef<HTMLInputElement>()


    async function loadPlayerLists() {

        let playerLists = await getMyPlayerLists()
        setMyPlayerLists(playerLists)

    }

    useEffect(() => {
        loadPlayerLists()
        setTimeout(() => {
            document.getElementById(tableNameInput.current.id).focus()
        }, 200);

    }, [])

    return (

        <Modal marginBottom={"auto"} marginTop={0} isOpen={props.isOpen} onClose={() => { props.onClose() }}>
            <Modal.Content >
                <Modal.CloseButton></Modal.CloseButton>
                <Modal.Header>{i18n.t("newTable")}</Modal.Header>
                <Modal.Body>
                    <FormControl >
                        <FormControl.Label>{i18n.t("tableName")}</FormControl.Label>
                        <Input
                            ref={tableNameInput}
                            value={tableName}
                            onChangeText={(text) => {
                                setTableName(text)
                                if (text.trim()) {
                                    setTableNameError("")
                                }
                            }}
                        />
                        {tableNameError ? (
                            <Text color={"red.600"} fontSize={"sm"} marginTop={1}>{tableNameError}</Text>
                        ) : null}

                        {

                            myPlayerLists.length > 0 ?
                                <>
                                    <FormControl.Label>{i18n.t("selectPlayerList")}</FormControl.Label>

                                    <Select onValueChange={(text) => {
                                        setSelectedPlayerListID(text)
                                    }} selectedValue={selectedPlayerListID}>
                                        {
                                            myPlayerLists.map((playerList) => {
                                                return (
                                                    <Select.Item key={playerList[1].id} label={playerList[1].playerListName} value={playerList[1].id} />
                                                )
                                            })
                                        }
                                    </Select>
                                </>




                                :
                                null
                        }

                        <FormControl.Label>
                            {i18n.t("sport")}
                        </FormControl.Label>
                        <Select selectedValue={selectedSport}
                            onValueChange={(sport) => {
                                setSelectedSport(sport)
                                if (supportedSports[sport]?.hasScoringTypes) {
                                    setSelectedScoringType(Object.keys(supportedSports[sport]?.scoringTypes)[0])
                                }
                            }}
                        >
                            {
                                Object.entries(supportedSports).map(([id, { displayName }]) => {
                                    return <Select.Item label={displayName} value={id}></Select.Item>
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
                                        onValueChange={(type) => {
                                            setSelectedScoringType(type)
                                        }}
                                    >
                                        {
                                            Object.entries(supportedSports[selectedSport]?.scoringTypes || {}).map(([id, { displayName }]) => {
                                                return <Select.Item label={displayName} value={id}></Select.Item>
                                            })
                                        }
                                    </Select>
                                </>

                                : null
                        }

                        <FormControl.Label>Table mode</FormControl.Label>
                        <Select selectedValue={tableMode} onValueChange={setTableMode}>
                            <Select.Item
                                label={"Standard - manual and scheduled matches"}
                                value={"standard"}
                            />
                            <Select.Item
                                label={"Kiosk - scheduled matches only"}
                                value={"kiosk"}
                            />
                        </Select>
                        <Text color={"gray.500"} fontSize={"xs"} marginTop={1}>
                            Kiosk tables wait for administrators to queue matches and enforce that queue order.
                        </Text>
                    </FormControl>




                </Modal.Body>
                <Modal.Footer>
                    <View padding={2} >
                        <Button onPress={async () => {
                            const cleanTableName = tableName.trim()
                            if (!cleanTableName) {
                                setTableNameError("Table name is required.")
                                return
                            }

                            try {
                                setIsLoadingTable(true)
                                await createNewTable(cleanTableName, selectedPlayerListID, selectedSport, selectedScoringType, tableMode)
                                setTableName("")
                                setIsLoadingTable(false)
                                props.onClose(true)
                            } catch (error) {
                                setTableNameError(error instanceof Error ? error.message : "Unable to create table.")
                                setIsLoadingTable(false)
                            }

                        }} isDisabled={!tableName.trim() || isLoadingTable}>
                            {
                                isLoadingTable ?
                                    <Spinner></Spinner> :
                                    <Text color={"white"}>{i18n.t("createTable")}</Text>
                            }

                        </Button>
                    </View>
                </Modal.Footer>
            </Modal.Content>
        </Modal>



    )
}
