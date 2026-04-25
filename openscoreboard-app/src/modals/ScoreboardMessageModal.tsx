import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from 'heroui-native/button';
import { Dialog } from 'heroui-native/dialog';

import { openBrowserAsync } from 'expo-web-browser';

import i18n from '../translations/translate';
export function ScoreboardMessageModal(props) {


    return (
        <Dialog isOpen={props.isOpen} onOpenChange={(open) => {
            if (!open) {
                props.onClose();
            }
        }}>
            <Dialog.Portal>
                <Dialog.Overlay />
                <Dialog.Content>
                    <Dialog.Close />
                    <Dialog.Title>{i18n.t("editScoreboard")}</Dialog.Title>
                    <Text style={styles.description}>{i18n.t("editorMessage")}</Text>
                    <View style={styles.actionWrap}>
                        <Button onPress={() => {
                            let editorLink = ""
                            if (process.env.NODE_ENV === "production") {
                                editorLink = props.editorURL
                            }
                            else {
                                const editorDevPort = "3002"
                                editorLink = window.location.origin.replace(window.location.port, editorDevPort) + props.editorURL
                            }


                            openBrowserAsync(editorLink);
                        }}>
                            <Button.Label>{i18n.t("launchScoreboard")}</Button.Label>

                        </Button>
                    </View>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog>
    );
}

const styles = StyleSheet.create({
    description: {
        color: "#6b7280",
        lineHeight: 20,
    },
    actionWrap: {
        marginTop: 18,
    },
});
