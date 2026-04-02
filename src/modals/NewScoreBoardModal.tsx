import React, { useState } from 'react';
import { Button, View, Modal, FormControl, Input, Select, Text } from 'native-base';
import { addNewScoreboard, getScoreboardTypesList } from '../functions/scoreboards';
import { openScoreboardButtonTextColor } from "../../openscoreboardtheme";
import i18n from '../translations/translate';

export function NewScoreBoardModal(props) {

    let [loadingNewScoreboard, setLoadingNewScoreboard] = useState(false);

    let [scoreboardName, setScoreboardName] = useState("");
    let [scoreboardType, setScoreboardType] = useState("liveStream");

    return (
        <Modal onClose={() => { props.onClose(); }} isOpen={props.isOpen}>
            <Modal.Content>
                <Modal.CloseButton></Modal.CloseButton>
                <Modal.Header>{i18n.t("newScoreboard")}</Modal.Header>
                <Modal.Body>
                    <FormControl>
                        <FormControl.Label>{i18n.t("scoreboardName")}</FormControl.Label>
                        <Input
                            value={scoreboardName}
                            onChangeText={setScoreboardName}
                        ></Input>

                    </FormControl>
                </Modal.Body>
                <Modal.Footer><View padding={1}><Button
                    onPress={async () => {
                        setLoadingNewScoreboard(true);
                        await addNewScoreboard(scoreboardName, "liveStream");
                        setLoadingNewScoreboard(false);
                        props.onClose(true)
                    }}
                >
                    <Text color={openScoreboardButtonTextColor}>{i18n.t("create")}</Text>
                </Button>
                </View>
                    <View padding={1}><Button
                        onPress={() => {
                            props.onClose(false);
                        }} variant="ghost"
                    >
                        <Text>{i18n.t("close")}</Text>
                    </Button></View></Modal.Footer>
            </Modal.Content>
        </Modal>
    );
}
