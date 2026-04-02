import React, { useEffect, useRef, useState } from 'react';
import { Button, Text, View, Modal, } from 'native-base';
import { openScoreboardButtonTextColor, } from "../../openscoreboardtheme";

import { openBrowserAsync } from 'expo-web-browser';

import i18n from '../translations/translate';
export function ScoreboardMessageModal(props) {


    return (
        <Modal onClose={() => { props.onClose(); }} isOpen={props.isOpen}>
            <Modal.Content>
                <Modal.CloseButton></Modal.CloseButton>
                <Modal.Header>{i18n.t("editScoreboard")}</Modal.Header>
                <Modal.Body>
                    <Text>{i18n.t("editorMessage")}</Text>
                    <View padding={1}
                    >
                        <Button onPress={() => {
                            let editorLink = ""
                            if (process.env.NODE_ENV === "production") {
                                editorLink = props.editorURL
                            }
                            else {
                                const editorDevPort = "3002"
                                editorLink = window.location.origin.replace(window.location.port, editorDevPort) + props.editorURL
                            }


                            openBrowserAsync(editorLink);
                        }}>
                            <Text color={openScoreboardButtonTextColor}>{i18n.t("launchScoreboard")}</Text>

                        </Button>


                    </View>


                </Modal.Body>
            </Modal.Content>
        </Modal>
    );
}
