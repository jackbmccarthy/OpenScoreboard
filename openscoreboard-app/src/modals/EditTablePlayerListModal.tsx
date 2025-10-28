import React, { useEffect, useState } from 'react';
import { Text, Button, View, Input, Spinner, Modal, FormControl, Select, Divider } from 'native-base';
import { openScoreboardButtonTextColor } from "../../openscoreboardtheme";
import { addPlayerList, getMyPlayerLists } from '../functions/players';
import LoadingPage from '../LoadingPage';
import { setPlayerListToTable } from '../functions/tables';
import i18n from '../translations/translate';
import CopyButton from '../components/CopyButton';
import { subFolderPath } from '../../openscoreboard.config';

export function EditTablePlayerListModal(props) {
    console.log(props)

    let [doneLoading, setDoneLoading] = useState(false)
    let [myPlayerLists, setMyPlayerLists] = useState([])
    let [selectedPlayerListPassword, setSelectedPlayerListPassword] = useState("")
    let [selectedPlayerListID, setSelectedPlayerListID] = useState("")
    let [loadingNewPlayerList, setLoadingNewPlayerList] = useState(false)

    async function loadPlayerLists() {
        setDoneLoading(false)
        let playerLists = await getMyPlayerLists()
        setMyPlayerLists(playerLists)
        for (const playerList of playerLists) {
            console.log(playerList)
            if (props.playerListID === playerList[1]["id"]) {
                console.log(playerList[1]["password"], playerList[1])
                setSelectedPlayerListPassword(playerList[1]["password"])
            }
        }
        setDoneLoading(true)
    }

    useEffect(() => {
        setSelectedPlayerListID(props.playerListID)

    }, [props.playerListID])

    useEffect(() => {
        loadPlayerLists()
    }, [])
    return (
        <Modal isOpen={props.isOpen} onClose={() => {
            props.onClose(false);
        }}>
            <Modal.Content>
                <Modal.CloseButton></Modal.CloseButton>
                <Modal.Header>{i18n.t("editPlayerList")}</Modal.Header>
                <Modal.Body>
                    {
                        doneLoading ?
                            myPlayerLists.length > 0 ?
                                <FormControl>
                                    <FormControl.Label>{i18n.t("selectPlayerList")}</FormControl.Label>

                                    <Select onValueChange={(text) => {
                                        setSelectedPlayerListID(text)
                                        for (const playerList of myPlayerLists) {
                                            if (text === playerList[1]["id"]) {
                                                setSelectedPlayerListPassword(playerList[1]["password"])
                                            }
                                        }

                                    }} selectedValue={selectedPlayerListID}>
                                        {
                                            myPlayerLists.map((playerList) => {
                                                return (
                                                    <Select.Item key={playerList[1].id} label={playerList[1].playerListName} value={playerList[1].id} />
                                                )
                                            })
                                        }
                                    </Select>

                                    {
                                        selectedPlayerListID.length > 0 ?
                                            <>
                                                <Divider></Divider>
                                                <FormControl.Label>{i18n.t("selfPlayerRegistration")}</FormControl.Label>
                                                <View padding={1} flexDir={"row"}>
                                                    <Input flex={1} isReadOnly value={`${window.location.origin}${subFolderPath}/playerregistration/${selectedPlayerListID}/${selectedPlayerListPassword}`}></Input>
                                                    <CopyButton text={`${window.location.origin}${subFolderPath}/playerregistration/${selectedPlayerListID}/${selectedPlayerListPassword}`} />
                                                </View>

                                            </>

                                            : null
                                    }
                                </FormControl>
                                :
                                <Text>{i18n.t("noPlayerListsGoAdd")}</Text>
                            :
                            <LoadingPage></LoadingPage>
                    }


                </Modal.Body>
                <Modal.Footer>
                    <View padding={1}>
                        {
                            myPlayerLists.length > 0 ?
                                <Button
                                    onPress={async () => {
                                        setLoadingNewPlayerList(true);
                                        await setPlayerListToTable(props.id, selectedPlayerListID, props.myTableID)
                                        setLoadingNewPlayerList(false);
                                        props.onClose(true);
                                    }}
                                >

                                    {loadingNewPlayerList ?
                                        <Spinner color={openScoreboardButtonTextColor}></Spinner> :
                                        <Text color={openScoreboardButtonTextColor}>{i18n.t("save")}</Text>}

                                </Button>
                                : null}
                    </View>
                    <View padding={1}>
                        <Button variant={"ghost"}
                            onPress={() => {
                                props.onClose(false);
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
