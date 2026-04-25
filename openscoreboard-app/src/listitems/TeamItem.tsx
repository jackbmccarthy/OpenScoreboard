import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from 'heroui-native/button';
import { Card } from 'heroui-native/card';
import { Separator } from 'heroui-native/separator';
import { openScoreboardColor } from "../../openscoreboardtheme";
import { FontAwesome } from '@expo/vector-icons';
import { deleteMyTeam } from '../functions/teams';
import i18n from '../translations/translate';

export function TeamItem(props) {

    let [showDelete, setShowDelete] = useState(false);
    let [loadingDelete, setLoadingDelete] = useState();
    return (
        <Card style={styles.card}>
            <Card.Body style={styles.body}>
                <View style={styles.headerRow}>
                    <View style={styles.copy}>
                        <Text style={styles.title}>{props.item[1].name}</Text>
                        <Text style={styles.description}>Edit roster details, add players, and keep team data ready for competition use.</Text>
                    </View>
                {showDelete ?
                    <View style={styles.confirmWrap}>
                        <Text style={styles.confirmText}>{i18n.t("deleteTeam")}?</Text>
                            <Button variant={"ghost"}
                                style={styles.confirmButton}
                                onPress={async () => {
                                    setLoadingDelete(true);
                                    await deleteMyTeam(props.item[0]);
                                    setLoadingDelete(false);
                                    if (typeof props.onDelete === "function") {
                                        props.onDelete(props.item[0]);
                                    }
                                }}
                            >
                                <Button.Label>{i18n.t("yes")}</Button.Label>
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
                                    props.openEditTeam(props.item[1].id, props.item[0]);
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
                    <Text style={styles.metaText}>Use edit to update the logo URL and maintain the player list attached to this team.</Text>
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
