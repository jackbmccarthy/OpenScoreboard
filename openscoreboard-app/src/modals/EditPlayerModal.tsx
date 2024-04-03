import React from 'react';
import { Modal } from 'native-base';
import { EditPlayer } from '../EditPlayer';
import i18n from '../translations/translate';

export function EditPlayerModal(props) {

    return (
        <Modal avoidKeyboard onClose={() => props.onClose()} isOpen={props.isOpen}>
            <Modal.Content>
                <Modal.CloseButton></Modal.CloseButton>
                <Modal.Header>{i18n.t("editPlayer")}</Modal.Header>
                <Modal.Body>
                    <EditPlayer {...props}></EditPlayer>

                </Modal.Body>
            </Modal.Content>
        </Modal>
    );
}
