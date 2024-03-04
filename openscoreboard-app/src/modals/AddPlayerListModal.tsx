import React, { useEffect, useRef, useState } from 'react';
import { Text, Button, View, Input, Spinner, Modal, FormControl } from 'native-base';
import { openScoreboardButtonTextColor } from "../../openscoreboardtheme";
import { addPlayerList } from '../functions/players';

export function AddPlayerListModal(props) {

    let [listName, setListName] = useState("");
    let [loadingNewPlayerList, setLoadingNewPlayerList] = useState(false);

    let playerListName = useRef()

    useEffect(()=>{
        setTimeout(() => {
            document.getElementById(playerListName.current.id).focus()
        }, 200);
    }, [])

    const onAddPlayerList = async () => {
        setLoadingNewPlayerList(true);
        await addPlayerList(listName);
        setLoadingNewPlayerList(false);
        props.onClose(true);
    }

    return (
        <Modal isOpen={props.isOpen} onClose={() => {
            props.onClose(false);
        }}>
            <Modal.Content>
                <Modal.CloseButton></Modal.CloseButton>
                <Modal.Header>Add New Player List</Modal.Header>
                <Modal.Body>
                    <FormControl>
                        <FormControl.Label>Name</FormControl.Label>
                        <Input
                        onSubmitEditing={(event)=>{
                            if(listName.length > 0){
                                onAddPlayerList()
                            }
                        }}
                        ref={playerListName} value={listName} onChangeText={(text) => {
                            setListName(text);
                        }}></Input>
                    </FormControl>

                </Modal.Body>
                <Modal.Footer>
                    <View padding={1}>
                        <Button
                            onPress={onAddPlayerList}
                        >
                            {loadingNewPlayerList ?
                                <Spinner color={openScoreboardButtonTextColor}></Spinner> :
                                <Text color={openScoreboardButtonTextColor}>Add</Text>}

                        </Button>
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
