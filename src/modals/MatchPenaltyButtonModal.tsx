import React, { useEffect, useState } from 'react';
import { Button, Text, View, Modal, FormControl, Divider } from 'native-base';
import { setRedFlag, setYellowFlag } from '../functions/scoring';
import { getCombinedPlayerNames } from '../functions/players';
import i18n from '../translations/translate';

export function MatchPenaltyButtonModal(props) {
    const { isAYellowCarded, isBYellowCarded, isARedCarded, isBRedCarded, playerA, playerB, playerA2, playerB2 } = props;

    let [isAYellow, setIsAYellow] = useState(isAYellowCarded);
    let [isBYellow, setIsBYellow] = useState(isBYellowCarded);
    let [isARed, setIsARed] = useState(isARedCarded);
    let [isBRed, setIsBRed] = useState(isBRedCarded);

    useEffect(() => {
        setIsARed(isARedCarded);
        setIsBRed(isBRedCarded);
        setIsAYellow(isAYellowCarded);
        setIsBYellow(isBYellowCarded);


    }, [isAYellowCarded, isBYellowCarded, isARedCarded, isBRedCarded]);

    return (
        <Modal onClose={() => { props.onClose(); }} isOpen={props.isOpen}>
            <Modal.Content>
                <Modal.CloseButton></Modal.CloseButton>
                <Modal.Header>{i18n.t("managePenalties")}</Modal.Header>
                <Modal.Body>
                    <FormControl>
                        <FormControl.Label>{getCombinedPlayerNames(playerA, playerB, playerA2, playerB2).a} {i18n.t("penalty")}</FormControl.Label>
                        <View padding={2} flex={1} flexDirection={"row"}>
                            <View padding={1} flex={1}>
                                <Button
                                    onPress={() => {
                                        setIsAYellow(isAYellow ? false : true);
                                        setYellowFlag(props.matchID, "A", isAYellow ? false : true);
                                    }}
                                    backgroundColor={isAYellow ? "yellow.300" : "gray.300"}>
                                    <Text>{i18n.t("yellowCard")}</Text>
                                </Button>
                            </View>
                            <View padding={1} flex={1}>
                                <Button
                                    onPress={() => {
                                        setIsARed(isARed ? false : true);
                                        setRedFlag(props.matchID, "A", isARed ? false : true);
                                    }}
                                    backgroundColor={isARed ? "red.300" : "gray.300"}>
                                    <Text>{i18n.t("redCard")}</Text>
                                </Button>
                            </View>
                        </View>
                        <Divider></Divider>
                        <FormControl.Label>{getCombinedPlayerNames(playerA, playerB, playerA2, playerB2).b} {i18n.t("penalty")}</FormControl.Label>
                        <View padding={2} flex={1} flexDirection={"row"}>
                            <View padding={1} flex={1}>
                                <Button
                                    onPress={() => {
                                        setIsBYellow(isBYellow ? false : true);
                                        setYellowFlag(props.matchID, "B", isBYellow ? false : true);
                                    }}
                                    backgroundColor={isBYellow ? "yellow.300" : "gray.300"}>
                                    <Text>{i18n.t("yellowCard")}</Text>
                                </Button>
                            </View>
                            <View padding={1} flex={1}>
                                <Button
                                    onPress={() => {
                                        setIsBRed(isBRed ? false : true);
                                        setRedFlag(props.matchID, "B", isBRed ? false : true);
                                    }}
                                    backgroundColor={isBRed ? "red.300" : "gray.300"}>
                                    <Text>{i18n.t("redCard")}</Text>
                                </Button>
                            </View>
                        </View>

                    </FormControl>
                </Modal.Body>
                <Modal.Footer>

                </Modal.Footer>
            </Modal.Content>
        </Modal>
    );
}
