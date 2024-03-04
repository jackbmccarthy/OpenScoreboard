import React from 'react';
import { Button, Text, View, Modal } from 'native-base';
import { openScoreboardButtonTextColor } from "../../openscoreboardtheme";
import { addSignificantPoint, getCurrentGameNumber, getCurrentGameScore } from '../functions/scoring';
import i18n from '../translations/translate';
export function SignificantPointModal(props) {

    return (
        <Modal isOpen={props.isOpen} onClose={() => { props.onClose(); }}>
            <Modal.Content>
                <Modal.CloseButton></Modal.CloseButton>
                <Modal.Header>{i18n.t("goodPoint")}</Modal.Header>
                <Modal.Body>
                    <Text fontSize={"xs"}>{i18n.t("goodPointDescription")}</Text>
                </Modal.Body>
                <Modal.Footer>
                    <View flex={1}>
                        <Button
                            onPress={() => {
                                addSignificantPoint(props.matchID, getCurrentGameNumber(props), getCurrentGameScore(props).a, getCurrentGameScore(props).b);
                                props.onClose();
                            }}
                        >
                            <Text color={openScoreboardButtonTextColor}>{i18n.t("addThisPoint")}</Text>
                        </Button>
                    </View>
                </Modal.Footer>
            </Modal.Content>
        </Modal>
    );
}
