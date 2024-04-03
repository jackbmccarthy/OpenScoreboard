import React, { useEffect, useState } from 'react';
import { Button, Text, View, Modal, Spinner } from 'native-base';
import { openScoreboardButtonTextColor, openScoreboardColor } from "../../openscoreboardtheme";
import { archiveTeamMatch } from '../functions/teammatches';
import i18n from '../translations/translate';

export function DeleteTeamMatchModal(props) {

    let [teamMatchInfo, setTeamMatchInfo] = useState({})
    let [loadingDelete, setLoadingDelete] = useState(false)


    useEffect(()=>{
        let myTeamMatchArray = props.allTeamMatches.filter((teamMatch)=>{
            return teamMatch[0] === props.deleteTeamMatchMyID
        })
        setTeamMatchInfo(myTeamMatchArray[0][1])

    }, [props.deleteTeamMatchMyID])

    return (
        <Modal isOpen={props.isOpen} onClose={() => {
            props.onClose();
        }}>
            <Modal.Content>
                <Modal.CloseButton></Modal.CloseButton>
                <Modal.Header>{i18n.t("deleteTeamMatch")}</Modal.Header>
                <Modal.Body>
                    <Text>{i18n.t("areYouSureDelete")} {teamMatchInfo.teamAName} vs {teamMatchInfo.teamBName}({teamMatchInfo.startTime})?</Text>
                </Modal.Body>
                <Modal.Footer>
                    <View>
                        <Button variant={"ghost"}
                            onPress={async () => {
                                setLoadingDelete(true)
                                await archiveTeamMatch(props.deleteTeamMatchMyID)
                                setLoadingDelete(false)
                                props.onClose(true);
                            }}
                        >
                            {
                                loadingDelete ? 
                                <Spinner color={openScoreboardColor}></Spinner>
                                :
                                 <Text>{i18n.t("yes")}</Text>
                            }
                            
                           
                        </Button>
                    </View>
                    <View>
                        <Button

                            onPress={() => {
                                props.onClose();
                            }}>
                            <Text color={openScoreboardButtonTextColor}>{i18n.t("no")}</Text>
                        </Button>
                    </View>
                </Modal.Footer>
            </Modal.Content>
        </Modal>
    );
}
