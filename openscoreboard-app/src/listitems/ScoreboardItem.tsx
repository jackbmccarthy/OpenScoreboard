import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from 'heroui-native/button';
import { Card } from 'heroui-native/card';
import { Separator } from 'heroui-native/separator';
import { openScoreboardColor } from "../../openscoreboardtheme";
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import i18n from '../translations/translate';


export function ScoreboardItem(props) {

    let [showDelete, setShowDelete] = useState(false);
    return (
        <Card style={styles.card}>
            <Card.Body style={styles.body}>
                    <View style={styles.headerRow}>
                        <Text style={styles.title}>{props.item[1].name}</Text>
                        <Text style={styles.metaText}>Overlay and editor configuration</Text>
                    </View>
                    <Separator></Separator>
                    {showDelete ?
                        <View style={styles.confirmRow}>
                            <Text style={styles.confirmText}>{i18n.t("deleteThisScoreboard")}?</Text>
                                <Button
                                    style={styles.confirmButton}
                                    onPress={() => {
                                        props.onDelete(props.item[0]);
                                    }}
                                >
                                    <Button.Label>{i18n.t("yes")}</Button.Label>
                                </Button>
                                <Button
                                    style={styles.confirmButton}
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
                                        props.onSelect(`/editor/?t=editor&sid=${props.item[1].id}`)

                                    }}
                                >
                                    <FontAwesome name='edit' size={24} color={openScoreboardColor} />
                                </Button>
                                <Button variant={"ghost"} isIconOnly
                                    onPress={() => {
                                        props.openScoreboardSettings(props.item[1].id, props.index)

                                    }}
                                >
                                    <Ionicons name='settings' size={24} color={openScoreboardColor} />
                                </Button>
                                <Button variant={"ghost"} isIconOnly
                                    onPress={() => {

                                        setShowDelete(true);
                                    }}
                                >
                                    <FontAwesome name='trash' size={24} color={openScoreboardColor} />
                                </Button>
                        </View>}
            </Card.Body>
        </Card>



    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 8,
        width: "100%",
    },
    body: {
        gap: 12,
    },
    headerRow: {
        gap: 4,
    },
    title: {
        color: "#111827",
        fontSize: 22,
        fontWeight: "800",
        lineHeight: 28,
    },
    metaText: {
        color: "#6b7280",
        fontSize: 12,
        lineHeight: 17,
    },
    actionRow: {
        flexDirection: "row",
        gap: 8,
        justifyContent: "center",
    },
    confirmRow: {
        alignItems: "center",
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
        justifyContent: "space-between",
    },
    confirmText: {
        color: "#111827",
        fontSize: 16,
        fontWeight: "700",
    },
    confirmButton: {
        minWidth: 74,
    },
});
