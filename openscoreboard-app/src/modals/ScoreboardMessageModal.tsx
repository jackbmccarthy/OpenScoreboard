import React, { useEffect, useRef, useState } from 'react';
import { Button, Text, View, Modal, FormControl } from 'native-base';
import { openScoreboardButtonTextColor, openScoreboardColor } from "../../openscoreboardtheme";
import { setUsedTimeOut, startTimeOut } from '../functions/scoring';
import { getCombinedPlayerNames } from '../functions/players';
import { openBrowserAsync } from 'expo-web-browser';
import { setStringAsync } from 'expo-clipboard';
export function ScoreboardMessageModal(props) {


    return (
        <Modal onClose={() => { props.onClose(); }} isOpen={props.isOpen}>
            <Modal.Content>
                <Modal.CloseButton></Modal.CloseButton>
                <Modal.Header>Edit Scoreboard</Modal.Header>
                <Modal.Body>
                    <Text>This editor is only supported on a computer, mobile devices might not work as intended.</Text>
                    <View padding={1}
                    >
                        <Button onPress={() => {
                            let editorLink = ""
                            if (process.env.NODE_ENV ==="production"){
                                editorLink = props.editorURL
                            }
                            else{
                                const editorDevPort = "3002"
                                editorLink = window.location.origin.replace(window.location.port,editorDevPort)+props.editorURL
                            }
                            
                 
                            openBrowserAsync(editorLink);
                        }}>
                            <Text color={openScoreboardButtonTextColor}>Launch Scoreboard</Text>

                        </Button>
                        

                    </View>


                </Modal.Body>
            </Modal.Content>
        </Modal>
    );
}
