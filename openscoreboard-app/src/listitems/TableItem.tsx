import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from 'heroui-native/button';
import { Card } from 'heroui-native/card';
import { Separator } from 'heroui-native/separator';
import { openScoreboardColor } from "../../openscoreboardtheme";
import { Ionicons, FontAwesome, MaterialCommunityIcons, AntDesign } from '@expo/vector-icons';
import { supportedSports } from '../functions/sports';

export function TableItem(props) {

    const iconSize = 24

    return (
        <Card style={styles.card}>
                <Card.Body style={styles.body}>
                <View style={styles.headerRow}>
                    <View style={styles.headerCopy}>
                    <Text style={styles.title}>{props.tableName}</Text>
                    <View>
                        <Text style={styles.sportLabel}>{supportedSports[props.sportName]?.displayName ? supportedSports[props.sportName]?.displayName : "Table Tennis"}</Text>
                    </View>
                </View>
                </View>
                <Separator></Separator>
                <View style={styles.actionRow}>
                            <Button isIconOnly padding={1} variant="ghost"
                                onPress={() => {
                                    props.navigation.navigate("TableScoring", { tableID: props.id, name: props.tableName, password: props.password, sportName: props.sportName ? props.sportName : "tableTennis", scoringType: props.scoringType ? props.scoringType : null });

                                }}
                            >
                                <MaterialCommunityIcons name="scoreboard" size={iconSize} color={openScoreboardColor} />
                            </Button>
                            <Button isIconOnly padding={1} variant="ghost"
                                onPress={() => {
                                    props.openEditPlayerList(props)
                                    //props.navigation.navigate("AddPlayers", { tableID: props.id, name: props.tableName });

                                }}
                            >
                                <FontAwesome name="users" size={iconSize} color={openScoreboardColor} />
                            </Button>
                            <Button isIconOnly
                                onPress={() => {
                                    props.navigation.navigate("ArchivedMatchList", { tableID: props.id, });
                                }}
                                padding={1} variant="ghost"

                            >
                                <FontAwesome name="history" size={iconSize} color={openScoreboardColor} />
                            </Button>
                            <Button variant={"ghost"} isIconOnly padding={1}
                                onPress={() => {
                                    props.navigation.navigate("ScheduledTableMatches", { tableID: props.id, name: props.tableName, sportName: props.sportName, scoringType: props.scoringType });
                                }}
                            >
                                <AntDesign name="calendar" size={iconSize} color={openScoreboardColor} />
                            </Button>
                            <Button variant={"ghost"} isIconOnly padding={1}
                                onPress={() => {
                                    props.openEditTable(props)
                                }}
                            >
                                <Ionicons name="settings" size={iconSize} color={openScoreboardColor} />
                            </Button>
                            <Button variant={"ghost"} isIconOnly padding={1}
                                onPress={() => {
                                    props.openLinkModal(props.id, props.index)
                                }}
                            >
                                <FontAwesome name="share" size={iconSize} color={openScoreboardColor} />
                            </Button>
                    </View>
                <Text style={styles.metaText}>Scoring, roster assignment, archived matches, scheduling, settings, and share links are all attached to this station.</Text>
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
        alignItems: "flex-start",
        flexDirection: "row",
        justifyContent: "space-between",
    },
    headerCopy: {
        flex: 1,
        minWidth: 0,
    },
    title: {
        color: "#111827",
        fontSize: 22,
        fontWeight: "800",
        lineHeight: 28,
    },
    sportLabel: {
        color: "#6b7280",
        fontSize: 13,
        fontWeight: "600",
        lineHeight: 18,
        marginTop: 4,
    },
    actionRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 6,
        justifyContent: "flex-start",
    },
    metaText: {
        color: "#6b7280",
        fontSize: 12,
        lineHeight: 17,
    },
});
