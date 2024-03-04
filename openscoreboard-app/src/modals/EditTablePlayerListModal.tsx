import React, { useEffect, useState } from 'react';
import { Text, Button, View, Input, Spinner, Modal, FormControl, Select } from 'native-base';
import { openScoreboardButtonTextColor } from "../../openscoreboardtheme";
import { addPlayerList, getMyPlayerLists } from '../functions/players';
import LoadingPage from '../LoadingPage';
import { setPlayerListToTable } from '../functions/tables';

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
                <Modal.Header>Edit Player List</Modal.Header>
                <Modal.Body>
                    {
                        doneLoading ?
                        myPlayerLists.length > 0 ?
<FormControl>
                        <FormControl.Label>Select Player List</FormControl.Label>

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
                    <Text>You currently have no player lists to use. Please go back, and add the players, then come back to utilize this feature.</Text>
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
                                <Text color={openScoreboardButtonTextColor}>Save</Text>}
                                
                        </Button>
                        : null}
                    </View>
                    <View padding={1}>
                        <Button variant={"ghost"}
                            onPress={() => {
                                props.onClose(false);
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
