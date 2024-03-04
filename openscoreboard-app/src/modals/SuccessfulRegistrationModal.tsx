import React, { useEffect, useRef, useState } from 'react';
import { Text, Button, View, Modal } from 'native-base';
import { openScoreboardButtonTextColor } from "../../openscoreboardtheme";

export function SuccessfulRegistrationModal({ onClose, isOpen }) {

    let [count, setCount] = useState(5);
    let countRef = useRef(5);

    useEffect(() => {
        let myInterval = setInterval(() => {

            if (countRef.current > 1) {
                let currentCount = countRef.current - 1;
                setCount(currentCount);
                countRef.current = currentCount;
            }
            else {
                onClose();
                clearInterval(myInterval);
            }
        }, 1000);

    }, []);

    return (

        <Modal isOpen={isOpen} onClose={() => { onClose(); }}>
            <Modal.Content>
                <Modal.CloseButton></Modal.CloseButton>
                <Modal.Header>Player registered!</Modal.Header>
                <Modal.Body>
                    <Text>You have successfully registered.</Text>
                    <Text>Screen will reset in {count} seconds.</Text>




                </Modal.Body>
                <Modal.Footer>
                    <View>
                        <Button
                            onPress={() => { onClose(); }}
                        >
                            <Text color={openScoreboardButtonTextColor}>Close</Text>
                        </Button>
                    </View>
                </Modal.Footer>
            </Modal.Content>
        </Modal>
    );
}
