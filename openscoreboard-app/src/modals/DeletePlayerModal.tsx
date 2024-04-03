import React from 'react';
import { Button, Text, View, Modal } from 'native-base';
import { openScoreboardButtonTextColor } from "../../openscoreboardtheme";
import i18n from '../translations/translate';

export function DeletePlayerModal(props) {

    return (
        <Modal isOpen={props.isOpen} onClose={() => {
            props.onClose();
        }}>
            <Modal.Content>
                <Modal.CloseButton></Modal.CloseButton>
                <Modal.Header>{i18n.t("deletePlayer")}</Modal.Header>
                <Modal.Body>
                    <Text>{i18n.t("areYouSureDelete")} {props.firstName} {props.lastName}?</Text>
                </Modal.Body>
                <Modal.Footer>
                    <View>
                        <Button variant={"ghost"}
                            onPress={() => {
                                props.onConfirmDelete({ id: props.id });
                                props.onClose();
                            }}
                        >
                            <Text>{i18n.t("yes")}</Text>
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
