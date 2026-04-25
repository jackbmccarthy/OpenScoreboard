import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from 'heroui-native/card';
import { Separator } from 'heroui-native/separator';
import { Input } from '../ui';
import { scoreboardBaseURL } from '../../openscoreboard.config';
import { openScoreboardButtonTextColor, openScoreboardColor } from "../../openscoreboardtheme";
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { deleteDynamicURL, openEmail } from '../functions/dynamicurls';
import CopyButton from '../components/CopyButton';
import i18n from '../translations/translate';

export function DynamicURLItem(props) {


    const matchInfo = props.item[1]
    let subTitle = ""
    let scoreKeepingURL
    if (props.isTeamMatch) {
        scoreKeepingURL = `${window.location.origin}/teamscoring/teammatch/true/${matchInfo.teammatchID}/?name=${encodeURI(`${matchInfo.teamAName} VS ${matchInfo.teamBName}`)}`;

    }
    else {

    }

    if (matchInfo["tableID"] && matchInfo["tableID"].length > 0) {
        subTitle = i18n.t("table") + ": " + matchInfo["tableName"]
        scoreKeepingURL = `${window.location.origin}/scoring/table/${matchInfo.tableID}/${matchInfo.tableName}/${matchInfo.password}`
    }
    else if (matchInfo["teammatchID"] && matchInfo["teammatchID"].length > 0) {
        subTitle = `${i18n.t("teamMatch")}: ${matchInfo["teamAName"]} vs ${matchInfo["teamBName"]} T${matchInfo["tableNumber"]}(${matchInfo["teamMatchStartTime"]})`
        scoreKeepingURL = `${window.location.origin}/teamscoring/teammatch/true/${matchInfo.teammatchID}/${matchInfo["tableNumber"]}/?name=${encodeURI(`${matchInfo.teamAName} VS ${matchInfo.teamBName}`)}`;

    }
    let [showDelete, setShowDelete] = useState(false)
    return (
        <Card style={styles.card}>
            <Card.Body style={styles.body}>
                <View style={styles.headerRow}>
                    <View style={styles.titleWrap}>
                        <Text style={styles.title}>{props.item[1].dynamicURLName}</Text>
                        <Text style={styles.subtitle}>{subTitle || "Linked URL routing"}</Text>
                    </View>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>Live link</Text>
                    </View>
                </View>

                <Separator></Separator>

                <View style={styles.section}>
                    <Text style={styles.label}>{i18n.t("scoreboardURL")}</Text>
                    <View style={styles.urlRow}>
                        <Input
                            flex={1}
                            isReadOnly
                            style={styles.input}
                            value={`${scoreboardBaseURL}/scoreboard/?dynid=${props.item[1].id}`}
                        ></Input>
                        <CopyButton text={`${scoreboardBaseURL}/scoreboard/?dynid=${props.item[1].id}`}></CopyButton>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>{i18n.t("scoreKeepingURL")}</Text>
                    <View style={styles.urlRow}>
                        <Input flex={1} isReadOnly style={styles.input} value={scoreKeepingURL}></Input>
                        <CopyButton text={scoreKeepingURL}></CopyButton>
                    </View>
                </View>

                {
                    showDelete ?
                        <View style={styles.confirmRow}>
                            <Text style={styles.confirmText}>{i18n.t("deleteDynamicURL")}?</Text>
                            <View style={styles.confirmActions}>
                                <Pressable
                                    onPress={async () => {
                                        await deleteDynamicURL(props.item[0])
                                        props.reload()
                                    }}
                                    style={({ pressed }) => [styles.confirmButton, styles.confirmDeleteButton, pressed ? styles.actionPressed : null]}
                                >
                                    <Text style={styles.confirmDeleteLabel}>{i18n.t("yes")}</Text>
                                </Pressable>
                                <Pressable
                                    onPress={() => {
                                        setShowDelete(false)
                                    }}
                                    style={({ pressed }) => [styles.confirmButton, styles.confirmCancelButton, pressed ? styles.actionPressed : null]}
                                >
                                    <Text style={styles.confirmCancelLabel}>{i18n.t("no")}</Text>
                                </Pressable>
                            </View>
                        </View>
                        :
                        <View style={styles.actionRow}>
                            <Pressable
                                onPress={() => {
                                    props.openEditDynamicURLModal(props.item[0], { ...props.item[1] });
                                }}
                                style={({ pressed }) => [styles.iconButton, pressed ? styles.actionPressed : null]}>
                                <FontAwesome size={20} color={openScoreboardColor} name="edit"></FontAwesome>
                            </Pressable>
                            <Pressable
                                onPress={() => {
                                    openEmail(subTitle, `${i18n.t("emailMessage")}:\n${i18n.t("scoreboardURL")}: ${`${scoreboardBaseURL}/scoreboard/?dynid=${props.item[1].id}`}\n${i18n.t("scoreKeepingURL")}: ${scoreKeepingURL} `)
                                }}
                                style={({ pressed }) => [styles.iconButton, pressed ? styles.actionPressed : null]}>
                                <MaterialCommunityIcons size={20} color={openScoreboardColor} name="email-fast-outline"></MaterialCommunityIcons>
                            </Pressable>
                            <Pressable
                                onPress={() => {
                                    setShowDelete(true)

                                }}
                                style={({ pressed }) => [styles.iconButton, pressed ? styles.actionPressed : null]}>
                                <FontAwesome size={20} color={openScoreboardColor} name="trash"></FontAwesome>
                            </Pressable>
                        </View>
                }
            </Card.Body>
        </Card>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: "#ffffff",
        borderRadius: 8,
        width: "100%",
    },
    body: {
        backgroundColor: "#ffffff",
        gap: 14,
        paddingVertical: 14,
    },
    headerRow: {
        alignItems: "flex-start",
        flexDirection: "row",
        gap: 12,
        justifyContent: "space-between",
    },
    titleWrap: {
        flex: 1,
        gap: 4,
    },
    title: {
        color: "#111827",
        fontSize: 21,
        fontWeight: "800",
        lineHeight: 26,
    },
    subtitle: {
        color: "#6b7280",
        fontSize: 13,
        lineHeight: 18,
    },
    badge: {
        backgroundColor: "#ecfeff",
        borderColor: "#a5f3fc",
        borderRadius: 999,
        borderWidth: 1,
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    badgeText: {
        color: "#0f766e",
        fontSize: 12,
        fontWeight: "700",
    },
    section: {
        gap: 6,
    },
    label: {
        color: "#374151",
        fontSize: 13,
        fontWeight: "700",
    },
    urlRow: {
        alignItems: "center",
        flexDirection: "row",
        gap: 8,
    },
    input: {
        backgroundColor: "#f9fafb",
        borderColor: "#d1d5db",
    },
    actionRow: {
        flexDirection: "row",
        gap: 8,
        justifyContent: "center",
    },
    iconButton: {
        alignItems: "center",
        backgroundColor: "#f3f4f6",
        borderRadius: 10,
        height: 42,
        justifyContent: "center",
        width: 42,
    },
    actionPressed: {
        opacity: 0.72,
    },
    confirmRow: {
        alignItems: "center",
        gap: 10,
    },
    confirmText: {
        color: "#111827",
        fontSize: 16,
        fontWeight: "700",
        textAlign: "center",
    },
    confirmActions: {
        flexDirection: "row",
        gap: 10,
    },
    confirmButton: {
        alignItems: "center",
        borderRadius: 10,
        minWidth: 84,
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    confirmDeleteButton: {
        backgroundColor: "#dc2626",
    },
    confirmCancelButton: {
        backgroundColor: "#e5e7eb",
    },
    confirmDeleteLabel: {
        color: "#ffffff",
        fontSize: 14,
        fontWeight: "700",
    },
    confirmCancelLabel: {
        color: "#111827",
        fontSize: 14,
        fontWeight: "700",
    },
});
