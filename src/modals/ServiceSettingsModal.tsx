import React, { useEffect, useState } from 'react';
import { Button, Text, View, Modal, FormControl, Divider } from 'native-base';
import { openScoreboardButtonTextColor, openScoreboardColor } from "../../openscoreboardtheme";
import { getCurrentGameNumber, getCurrentGameScore, setInitialMatchServer, setisManualMode, updateService } from '../functions/scoring';
import { getCombinedPlayerNames } from '../functions/players';
import i18n from '../translations/translate';

export function ServiceSettingsModal(props) {
    const { playerA, playerB, playerA2, playerB2, isAInitialServer } = props;

    let [isManual, setIsManual] = useState(props.isManualServiceMode);
    useEffect(() => {
        setIsManual(props.isManualServiceMode);
    }, [props.isManualServiceMode]);

    let [loadingMatchServer, setLoadingMatchServer] = useState(false);
    return (
        <Modal isOpen={props.isOpen} onClose={() => props.onClose()}>
            <Modal.Content>
                <Modal.CloseButton></Modal.CloseButton>
                <Modal.Header>{i18n.t("serviceSettings")}</Modal.Header>
                <Modal.Body>
                    <FormControl>
                        <FormControl.Label>
                            {i18n.t("initialMatchServer")}:
                        </FormControl.Label>
                        <View flex={1} flexDirection="row">
                            <View flex={1} padding={1}>
                                <Button backgroundColor={isAInitialServer ? openScoreboardColor : "gray.300"} disabled={loadingMatchServer}
                                    onPress={async () => {
                                        setLoadingMatchServer(true);
                                        await setInitialMatchServer(props.matchID, true);
                                        setLoadingMatchServer(false);
                                        let currentScore = getCurrentGameScore(props);
                                        updateService(props.matchID, true, getCurrentGameNumber(props), currentScore.a + currentScore.b, props.changeServeEveryXPoints, props.pointsToWinGame, props.sportName, props.scoringType);
                                    }}
                                >
                                    <Text color={isAInitialServer ? openScoreboardButtonTextColor : openScoreboardColor}>{getCombinedPlayerNames(playerA, playerB, playerA2, playerB2).a}</Text>
                                </Button>
                            </View>
                            <View flex={1} padding={1}>
                                <Button
                                    backgroundColor={isAInitialServer ? "gray.300" : openScoreboardColor}
                                    disabled={loadingMatchServer}
                                    onPress={async () => {
                                        setLoadingMatchServer(true);
                                        await setInitialMatchServer(props.matchID, false);
                                        setLoadingMatchServer(false);
                                        let currentScore = getCurrentGameScore(props);
                                        updateService(props.matchID, false, getCurrentGameNumber(props), currentScore.a + currentScore.b, props.changeServeEveryXPoints, props.pointsToWinGame, props.sportName, props.scoringType);
                                    }}
                                >
                                    <Text color={isAInitialServer ? openScoreboardColor : openScoreboardButtonTextColor}>{getCombinedPlayerNames(playerA, playerB, playerA2, playerB2).b}</Text>
                                </Button>
                            </View>

                        </View>
                        <Divider></Divider>
                        <FormControl.Label>{i18n.t("serviceMode")}:</FormControl.Label>
                        <View flexDirection={"row"} padding={1}>
                            <View flex={1} padding={1}>
                                <Button
                                    onPress={() => {
                                        setIsManual(false);
                                        setisManualMode(props.matchID, false);
                                        const { a, b } = getCurrentGameScore(props)
                                        updateService(props.matchID, props.isAInitialServer, getCurrentGameNumber(props), a + b, props.changeServeEveryXPoints, props.pointsToWinGame, props.sportName, props.scoringType)
                                    }}
                                    backgroundColor={isManual ? "gray.300" : openScoreboardColor}>
                                    <Text color={isManual ? openScoreboardColor : openScoreboardButtonTextColor}>{i18n.t("auto")}</Text>
                                </Button>
                            </View>
                            <View flex={1} padding={1}>
                                <Button
                                    onPress={() => {
                                        setIsManual(true);
                                        setisManualMode(props.matchID, true);
                                    }}
                                    backgroundColor={isManual ? openScoreboardColor : "gray.300"}>
                                    <Text color={isManual ? openScoreboardButtonTextColor : openScoreboardColor}>{i18n.t("manual")}</Text>
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
