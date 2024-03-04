import React from 'react';
import { Button, Text, View, Modal } from 'native-base';
import { openScoreboardButtonTextColor } from "../../openscoreboardtheme";

export function DeletePlayerModal(props) {

    return (
        <Modal isOpen={props.isOpen} onClose={() => {
            props.onClose();
        }}>
            <Modal.Content>
                <Modal.CloseButton></Modal.CloseButton>
                <Modal.Header>Delete Player</Modal.Header>
                <Modal.Body>
                    <Text>Are you sure you want to delete {props.firstName} {props.lastName}?</Text>
                </Modal.Body>
                <Modal.Footer>
                    <View>
                        <Button variant={"ghost"}
                            onPress={() => {
                                props.onConfirmDelete({ id: props.id });
                                props.onClose();
                            }}
                        >
                            <Text>Yes</Text>
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
