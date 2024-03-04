import React, { useEffect, useState } from 'react';
import { Button, Text, View, Modal, Spinner } from 'native-base';
import { openScoreboardButtonTextColor, openScoreboardColor } from "../../openscoreboardtheme";
import { archiveTeamMatch } from '../functions/teammatches';

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
                <Modal.Header>Delete Team Match</Modal.Header>
                <Modal.Body>
                    <Text>Are you sure you want to delete {teamMatchInfo.teamAName} vs {teamMatchInfo.teamBName}({teamMatchInfo.startTime})?</Text>
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
                                 <Text>Yes</Text>
                            }
                            
                           
                        </Button>
                    </View>
                    <View>
                        <Button

                            onPress={() => {
                                props.onClose();
                            }}>
                            <Text color={openScoreboardButtonTextColor}>No</Text>
                        </Button>
                    </View>
                </Modal.Footer>
            </Modal.Content>
        </Modal>
    );
}
