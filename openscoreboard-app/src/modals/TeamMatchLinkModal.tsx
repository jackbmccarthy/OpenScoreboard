import React, { useState } from 'react';
import { Button, View, Modal, FormControl, Input, Text } from 'native-base';
import { openScoreboardButtonTextColor } from "../../openscoreboardtheme";
import CopyButton from '../components/CopyButton';
import ScoreboardLinkList from '../components/ScoreboardLinkList';
import { subFolderPath } from '../../openscoreboard.config';

export function TeamMatchLinkModal(props) {

    let [showScoringURL, setShowScoringURL] = useState(false);
    let [showScoreboardURL, setScoreboardURL] = useState(false);




      const  scoreKeepingURL = `${window.location.origin}${subFolderPath}/teamscoring/teammatch/true/${props.id}/${props.tableID}/?name=${encodeURI(`Table ${props.tableID}`)}&sportName=${props.sportName}&scoringType=${props.scoringType}`;
    
    

    return (
        <Modal isOpen={props.isOpen} onClose={() => { props.onClose(); }}>
            <Modal.Content>
                <Modal.CloseButton></Modal.CloseButton>
                <Modal.Header>Get Table Links</Modal.Header>
                <Modal.Body>
                    <View padding={1}>
                                    
                                    <FormControl>
                                    <Text textAlign={"center"} fontSize={"xl"} fontWeight="bold">Score Keeping URL</Text>
                                    <Text textAlign={"center"}>Share this link so someone else can keep score.</Text>
                                        <View flexDirection={"row"}>
                                            <Input flex={1} isReadOnly value={scoreKeepingURL}></Input>
                                            <CopyButton text={scoreKeepingURL} />
                                        </View>

                                    </FormControl>
                                </View>
                                <Text textAlign={"center"} fontSize={"xl"} fontWeight="bold">Scoreboard URL(s)</Text>
                               

                                <ScoreboardLinkList isTeamMatch={true} teamMatchID={props.id}  tableID={props.tableID} {...props}></ScoreboardLinkList>
                    {/* {showScoreboardURL || showScoringURL ?
                        <>
                            {showScoringURL ?
                                
                                :
                                null}
                            {showScoreboardURL ?
                                
                                : null}
                        </>

                        : <View>
                            <View padding={1}>
                                <Button
                                    onPress={() => {
                                        setShowScoringURL(true);
                                    }}
                                >
                                    <Text color={openScoreboardButtonTextColor}>Score Keeping</Text>
                                </Button>
                            </View>
                            <View padding={1}>
                                <Button
                                    onPress={() => {
                                        setScoreboardURL(true);
                                    }}
                                >
                                    <Text color={openScoreboardButtonTextColor}>Scoreboards</Text>
                                </Button>
                            </View>
                        </View>} */}


                </Modal.Body>
            </Modal.Content>
        </Modal>
    );
}
