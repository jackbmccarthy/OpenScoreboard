import React, { useEffect, useState } from 'react';
import { Text, Button, View, Input, Spinner, Modal, FormControl, Select } from 'native-base';
import { openScoreboardButtonTextColor } from "../../openscoreboardtheme";
import { addPlayerList, getMyPlayerLists } from '../functions/players';
import LoadingPage from '../LoadingPage';
import { setPlayerListToTable } from '../functions/tables';
import i18n from '../translations/translate';

export function EditTablePlayerListModal(props) {

    let [doneLoading, setDoneLoading] = useState(false)
    let [myPlayerLists, setMyPlayerLists] = useState([])
    let [selectedPlayerListID, setSelectedPlayerListID] = useState("")
    let [loadingNewPlayerList, setLoadingNewPlayerList] = useState(false)

    async function loadPlayerLists(){
        setDoneLoading(false)
        let playerLists = await getMyPlayerLists()
        setMyPlayerLists(playerLists)
        setDoneLoading(true)
    }

    useEffect(()=>{
        setSelectedPlayerListID(props.playerListID)
    }, [props.playerListID])

    useEffect(()=>{
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

                        <Select onValueChange={(text)=>{
                            setSelectedPlayerListID(text)
                        }} selectedValue={selectedPlayerListID}>
                            {
                                myPlayerLists.map((playerList)=>{
                                    return (
                                        <Select.Item key={playerList[1].id} label={playerList[1].playerListName} value={playerList[1].id} />
                                    )
                                })
                            }
                        </Select>
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
                           
                           { loadingNewPlayerList  ?
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
