import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Dialog } from 'heroui-native/dialog';
import { Input } from 'heroui-native/input';
import { Spinner } from 'heroui-native/spinner';
import { addPlayerList } from '../functions/players';
import i18n from '../translations/translate';

export function AddPlayerListModal(props) {

    let [listName, setListName] = useState("");
    let [loadingNewPlayerList, setLoadingNewPlayerList] = useState(false);

    let playerListName = useRef()

    useEffect(() => {
        const timeout = setTimeout(() => {
            playerListName.current?.focus?.()
        }, 200);

        return () => clearTimeout(timeout);
    }, [])

    const onAddPlayerList = async () => {
        if (!listName || listName.trim().length === 0) {
            return;
        }
        setLoadingNewPlayerList(true);
        try {
            await addPlayerList(listName.trim());
            props.onClose(true);
        }
        finally {
            setLoadingNewPlayerList(false);
        }
    }

    return (
        <Dialog isOpen={props.isOpen} onOpenChange={(open) => {
            if (!open) {
                props.onClose(false);
            }
        }}>
            <Dialog.Portal>
                <Dialog.Overlay />
                <Dialog.Content>
                    <Dialog.Close />
                    <Dialog.Title>{i18n.t("addNewPlayerList")}</Dialog.Title>
                    <Text style={styles.description}>Create a named source list you can reuse across scoring and registration screens.</Text>
                    <View style={styles.fieldWrap}>
                        <Text style={styles.label}>{i18n.t("name")}</Text>
                        <Input
                            onSubmitEditing={(event) => {
                                if (listName.length > 0) {
                                    onAddPlayerList()
                                }
                            }}
                            ref={playerListName} value={listName} onChangeText={(text) => {
                                setListName(text);
                            }}></Input>
                    </View>
                    <View style={styles.footer}>
                        <Pressable
                            onPress={onAddPlayerList}
                            style={({ pressed }) => [
                                styles.primaryButton,
                                pressed ? styles.buttonPressed : null,
                                loadingNewPlayerList || listName.trim().length === 0 ? styles.buttonDisabled : null,
                            ]}
                            disabled={loadingNewPlayerList || listName.trim().length === 0}
                        >
                            {loadingNewPlayerList ?
                                <Spinner></Spinner> :
                                <Text style={styles.primaryButtonLabel}>{i18n.t("add")}</Text>}

                        </Pressable>
                        <Pressable
                            onPress={() => {
                                props.onClose(false);
                            }}
                            style={({ pressed }) => [styles.secondaryButton, pressed ? styles.buttonPressed : null]}
                        >
                            <Text style={styles.secondaryButtonLabel}>{i18n.t("close")}</Text>
                        </Pressable>
                    </View>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog>
    );
}

const styles = StyleSheet.create({
    fieldWrap: {
        gap: 6,
        marginTop: 8,
    },
    label: {
        color: "#374151",
        fontSize: 13,
        fontWeight: "600",
    },
    description: {
        color: "#6b7280",
        lineHeight: 20,
    },
    footer: {
        flexDirection: "row",
        gap: 10,
        justifyContent: "flex-end",
        marginTop: 18,
    },
    primaryButton: {
        alignItems: "center",
        backgroundColor: "#2563eb",
        borderRadius: 10,
        justifyContent: "center",
        minHeight: 42,
        minWidth: 96,
        paddingHorizontal: 18,
    },
    primaryButtonLabel: {
        color: "#ffffff",
        fontSize: 14,
        fontWeight: "700",
    },
    secondaryButton: {
        alignItems: "center",
        backgroundColor: "#e5e7eb",
        borderRadius: 10,
        justifyContent: "center",
        minHeight: 42,
        minWidth: 96,
        paddingHorizontal: 18,
    },
    secondaryButtonLabel: {
        color: "#111827",
        fontSize: 14,
        fontWeight: "700",
    },
    buttonPressed: {
        opacity: 0.8,
    },
    buttonDisabled: {
        opacity: 0.55,
    },
});
