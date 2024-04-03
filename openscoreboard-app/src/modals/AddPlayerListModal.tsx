import React, { useEffect, useRef, useState } from 'react';
import { Text, Button, View, Input, Spinner, Modal, FormControl } from 'native-base';
import { openScoreboardButtonTextColor } from "../../openscoreboardtheme";
import { addPlayerList } from '../functions/players';
import i18n from '../translations/translate';

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
                <Modal.Header>{i18n.t("addNewPlayerList")}</Modal.Header>
                <Modal.Body>
                    <FormControl>
                        <FormControl.Label>{i18n.t("name")}</FormControl.Label>
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
                                <Text color={openScoreboardButtonTextColor}>{i18n.t("add")}</Text>}

                        </Button>
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
