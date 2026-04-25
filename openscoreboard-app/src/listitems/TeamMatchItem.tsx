import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from 'heroui-native/button';
import { Card } from 'heroui-native/card';
import { Separator } from 'heroui-native/separator';
import { openScoreboardColor } from "../../openscoreboardtheme";
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { getTeamMatchTeamScore } from '../functions/teammatches';

export function TeamMatchItem(props) {

    return (
        <Card style={styles.card}>
            <Card.Body style={styles.body}>
            <Text style={styles.scoreline}>{props.item[1].teamAScore} - {props.item[1].teamAName} <Text style={styles.scorelineEmphasis}>VS </Text> {props.item[1].teamBName} -  {props.item[1].teamBScore}</Text>
            <Text style={styles.subline}>{props.item[1]["sportName"] ? props.item[1]["sportDisplayName"] + " - " : ""}{new Date(props.item[1].startTime).toLocaleDateString()}</Text>

            <Separator></Separator>
            <View style={styles.actionRow}>

                <Button variant={"ghost"} isIconOnly
                    onPress={() => {
                        props.openTeamMatchTableSelection(props.item[1].id, props.index);
                    }}
                >
                    <MaterialCommunityIcons name="scoreboard" size={24} color={openScoreboardColor} />

                    </Button>
                    <Button isIconOnly
                        onPress={() => {
                            props.openTeamMatchEdit(props.item[1].id, props.index);
                        }}
                        variant="ghost"

                    >
                        <FontAwesome name="edit" size={24} color={openScoreboardColor} />
                    </Button>
                    <Button isIconOnly
                        onPress={() => {
                            props.navigation.navigate("ArchivedMatchList", { teamMatchID: props.item[1].id, });
                        }}
                        variant="ghost"

                    >
                        <FontAwesome name="history" size={24} color={openScoreboardColor} />
                    </Button>
                    <Button isIconOnly
                        onPress={() => {
                            props.openDeleteTeamMatch(props.item[0])
                        }}
                        variant="ghost"

                    >
                        <FontAwesome name="trash" size={24} color={openScoreboardColor} />
                    </Button>
            </View>
            <Text style={styles.metaText}>Open scoring, edit the match setup, review archived results, or remove the fixture from your schedule.</Text>
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
    scoreline: {
        color: "#111827",
        fontSize: 20,
        lineHeight: 28,
        textAlign: "center",
    },
    scorelineEmphasis: {
        fontWeight: "800",
    },
    subline: {
        color: "#6b7280",
        fontSize: 14,
        lineHeight: 20,
        textAlign: "center",
    },
    actionRow: {
        flexDirection: "row",
        gap: 8,
        justifyContent: "center",
    },
    metaText: {
        color: "#6b7280",
        fontSize: 12,
        lineHeight: 17,
        textAlign: "center",
    },
});
