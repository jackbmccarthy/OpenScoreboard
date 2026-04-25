import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from 'heroui-native/button';
import { Card } from 'heroui-native/card';
import { Separator } from 'heroui-native/separator';
import { Spinner } from 'heroui-native/spinner';
import { FontAwesome } from '@expo/vector-icons';
import { openScoreboardColor } from "../../openscoreboardtheme";
import { deletePlayerList } from '../functions/players';
import i18n from '../translations/translate';

export function PlayerListItem(props) {
    let [showDelete, setShowDelete] = useState(false);
    let [loadingDelete, setLoadingDelete] = useState(false)
    return (
        <Card style={styles.card}>
            <Card.Body style={styles.body}>
                <View style={styles.headerRow}>
                    <View style={styles.copy}>
                        <Text style={styles.title}>{props.item[1].playerListName}</Text>
                        <Text style={styles.description}>A reusable list for importing players into matches and registration flows.</Text>
                    </View>
                    {showDelete ?
                        <View style={styles.confirmWrap}>
                            <Text style={styles.confirmText}>{i18n.t("deletePlayerList")}?</Text>
                            <Button variant={"ghost"}
                                style={styles.confirmButton}
                                    onPress={async () => {

                                        setLoadingDelete(true);

                                        await deletePlayerList(props.item[0]);
                                        setLoadingDelete(false);

                                        if (typeof props.onDelete === "function") {
                                            props.onDelete(props.item[0]);
                                        }
                                    }}
                                >
                                    {
                                        loadingDelete ?
                                            <Spinner color={openScoreboardColor}></Spinner> :
                                            <Button.Label>{i18n.t("yes")}</Button.Label>
                                    }

                                </Button>
                            <Button
                                    style={styles.dangerButton}
                                    onPress={() => {
                                        setShowDelete(false);
                                    }}
                                >
                                    <Button.Label>{i18n.t("no")}</Button.Label>
                                </Button>
                        </View>
                        :
                        <View style={styles.actionRow}>
                                <Button variant={"ghost"} isIconOnly
                                    onPress={() => {
                                        props.navigation.navigate("AddPlayers", { playerListID: props.item[1].id });
                                    }}
                                >
                                    <FontAwesome name='edit' size={24} color={openScoreboardColor} />

                                </Button>

                                <Button variant={"ghost"} isIconOnly
                                    onPress={() => {
                                        setShowDelete(true);
                                    }}
                                >
                                    <FontAwesome name="trash" size={24} color={openScoreboardColor} />
                                </Button>
                        </View>}
                </View>
                <Separator></Separator>
                <View style={styles.metaRow}>
                    <Text style={styles.metaText}>Open the list to manage players, bulk imports, and individual edits.</Text>
                </View>
            </Card.Body>
        </Card>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 8,
    },
    body: {
        gap: 12,
    },
    headerRow: {
        alignItems: "flex-start",
        flexDirection: "row",
        gap: 10,
        justifyContent: "space-between",
    },
    copy: {
        flex: 1,
        minWidth: 0,
    },
    title: {
        color: "#111827",
        fontSize: 26,
        fontWeight: "800",
        lineHeight: 31,
    },
    description: {
        color: "#6b7280",
        lineHeight: 20,
        marginTop: 4,
    },
    actionRow: {
        alignItems: "center",
        flexDirection: "row",
        gap: 6,
    },
    confirmWrap: {
        alignItems: "center",
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        justifyContent: "flex-end",
        maxWidth: 260,
    },
    confirmText: {
        color: "#111827",
        fontSize: 16,
        fontWeight: "700",
    },
    confirmButton: {
        minWidth: 70,
    },
    dangerButton: {
        minWidth: 70,
    },
    metaRow: {
        paddingTop: 2,
    },
    metaText: {
        color: "#6b7280",
        fontSize: 12,
        lineHeight: 17,
    },
});
