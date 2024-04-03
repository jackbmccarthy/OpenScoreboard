import React, { useState } from 'react';
import { Button, View, Modal, FormControl, Input, Text, Divider } from 'native-base';
import { openScoreboardButtonTextColor } from "../../openscoreboardtheme";
import CopyButton from '../components/CopyButton';
import ScoreboardLinkList from '../components/ScoreboardLinkList';
import { subFolderPath } from '../../openscoreboard.config';
import i18n from '../translations/translate';
//import QRCodeButton from '../components/QRCodeButton';

export function TableLinkModal(props) {

    let [showScoringURL, setShowScoringURL] = useState(false);
    let [showScoreboardURL, setScoreboardURL] = useState(false);


    let scoreKeepingURL
    if(props.isTeamMatch){
        scoreKeepingURL = `${window.location.origin}${subFolderPath}/teamscoring/teammatch/true/${props.id}/?name=${encodeURI(`${props.teamAName} VS ${props.teamBName}`)}`;
        
    }
    else{
        scoreKeepingURL = `${window.location.origin}${subFolderPath}/scoring/table/${props.id}/${props.tableName}/${props.password}?sportName=${props.sportName}&scoringType=${props.scoringType}`
    }
    

    return (
        <Modal isOpen={props.isOpen} onClose={() => { props.onClose(); }}>
            <Modal.Content>
                <Modal.CloseButton></Modal.CloseButton>
                <Modal.Header>{i18n.t("getTableLinks")}</Modal.Header>
                <Modal.Body>
                    {showScoreboardURL || showScoringURL ?
                        <>
                           
                            {showScoreboardURL ?
                                <ScoreboardLinkList tableID={props.id} {...props}></ScoreboardLinkList>
                                : null}
                        </>

                        : <View>
                            <View padding={1}>
                                    <Text textAlign={"center"}>{i18n.t("shareThisLink")}</Text>
                                    <FormControl>
                                        <Text textAlign={"center"} fontSize={"xl"} fontWeight="bold">{i18n.t("scoreKeepingURL")}</Text>
                                        <View flexDirection={"row"}>
                                            <Input flex={1} isReadOnly value={scoreKeepingURL}></Input>
                                            <CopyButton text={scoreKeepingURL} />
                                            {/* <QRCodeButton url={scoreKeepingURL} tableName={props.tableName} {...props} ></QRCodeButton> */}
                                        </View>

                                    </FormControl>
                                </View>
                                <Divider></Divider>
                                <Text textAlign={"center"} fontSize={"xl"} fontWeight="bold">{i18n.t("scoreboardURLs")}</Text>
                                <ScoreboardLinkList tableID={props.id} {...props}></ScoreboardLinkList>

                    
                            {/* <View padding={1}>
                                <Button
                                    onPress={() => {
                                        setScoreboardURL(true);
                                    }}
                                >
                                    <Text color={openScoreboardButtonTextColor}>Scoreboards</Text>
                                </Button>
                            </View> */}
                        </View>}


                </Modal.Body>
            </Modal.Content>
        </Modal>
    );
}
