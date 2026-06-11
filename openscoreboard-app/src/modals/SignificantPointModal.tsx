import React from 'react';
import { Text, View, Modal } from 'native-base';
import { openScoreboardButtonTextColor } from "../../openscoreboardtheme";
import { addSignificantPoint, getCurrentGameNumber, getCurrentGameScore } from '../functions/scoring';
import i18n from '../translations/translate';
import { ScoringModalHeader, ScoringModalSection, ScoringPrimaryButton } from '../components/ScoringModalComponents';
export function SignificantPointModal(props) {
    const currentScore = getCurrentGameScore(props);

    return (
        <Modal isOpen={props.isOpen} onClose={() => { props.onClose(); }}>
            <Modal.Content maxW={460} width={"92%"}>
                <Modal.CloseButton />
                <Modal.Header>
                    <ScoringModalHeader
                        title={i18n.t("goodPoint")}
                        description={i18n.t("goodPointDescription")}
                    />
                </Modal.Header>
                <Modal.Body backgroundColor={"gray.50"}>
                    <ScoringModalSection title={"Current score"} description={"This saves the current game and score as a point to review later."}>
                        <View alignItems={"center"} flexDirection={"row"} justifyContent={"space-between"}>
                            <View>
                                <Text color={"gray.500"} fontSize={"xs"} fontWeight={"bold"} textTransform={"uppercase"}>Game</Text>
                                <Text color={"gray.900"} fontSize={"3xl"} fontWeight={"bold"}>{getCurrentGameNumber(props)}</Text>
                            </View>
                            <View alignItems={"center"} backgroundColor={"gray.900"} borderRadius={12} flexDirection={"row"} paddingX={5} paddingY={3}>
                                <Text color={"white"} fontSize={"4xl"} fontWeight={"bold"}>{currentScore.a}</Text>
                                <Text color={"gray.400"} fontSize={"3xl"} fontWeight={"bold"} marginX={4}>-</Text>
                                <Text color={"white"} fontSize={"4xl"} fontWeight={"bold"}>{currentScore.b}</Text>
                            </View>
                        </View>
                    </ScoringModalSection>
                </Modal.Body>
                <Modal.Footer>
                    <View flex={1}>
                        <ScoringPrimaryButton
                            onPress={() => {
                                addSignificantPoint(props.matchID, getCurrentGameNumber(props), currentScore.a, currentScore.b);
                                props.onClose();
                            }}
                        >
                            <Text color={openScoreboardButtonTextColor}>{i18n.t("addThisPoint")}</Text>
                        </ScoringPrimaryButton>
                    </View>
                </Modal.Footer>
            </Modal.Content>
        </Modal>
    );
}
