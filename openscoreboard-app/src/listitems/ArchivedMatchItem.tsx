import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from 'heroui-native/button';
import { Card } from 'heroui-native/card';
import { Separator } from 'heroui-native/separator';
import { Spinner } from 'heroui-native/spinner';
import { getMatchData, getSignificantPoints } from '../functions/scoring';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { openScoreboardColor } from "../../openscoreboardtheme";
import i18n from '../translations/translate';

export function ArchivedMatchItem(props) {
    const index = props.index;
    const id = props.item[0];
    const matchDetails = props.item[1];

    let [significantPoints, setSignificantPoints] = useState()
    let [loadingSigPoints, setLoadingSigPoints] = useState()

    async function loadSigPoints(matchID) {
        setLoadingSigPoints(true)
        let matchSigPoints = await getSignificantPoints(matchID)
        setSignificantPoints(matchSigPoints)
        setLoadingSigPoints(false)
        setSigPointsExpanded(true)
    }

    let [loadingAdditionalGameScores, setLoadingAdditionalGameScores] = useState(false);
    let [loadedGamesScores, setLoadedGameScores] = useState(false);
    let [expanded, setExpanded] = useState(false);
    let [sigPointsExpanded, setSigPointsExpanded] = useState(false)
    let [additionalFields, setAdditionalFields] = useState({});

    return (
        <Card style={styles.card}>
            <Card.Body style={styles.cardBody}>
                <View style={styles.summaryRow}>
                    <View style={styles.playerColumn}>
                        <Text style={styles.playerName}>{matchDetails["playerA"]}</Text>
                    </View>
                    <View style={styles.scoreColumn}>
                        <Text style={styles.scoreText}>
                            <Text style={styles.scoreNumber}>{matchDetails["AScore"]}</Text>
                            {" - "}
                            <Text style={styles.scoreNumber}>{matchDetails["BScore"]}</Text>
                        </Text>
                    </View>
                    <View style={styles.playerColumn}>
                        <Text style={styles.playerName}>{matchDetails["playerB"]}</Text>
                    </View>
                </View>

                <View style={styles.actionsRow}>
                    <Button
                        isIconOnly
                        variant={"ghost"}
                        onPress={async () => {
                            if (loadedGamesScores === false) {
                                setLoadingAdditionalGameScores(true);
                                let matchInfo = await getMatchData(matchDetails.matchID);
                                setAdditionalFields(matchInfo);
                                setLoadingAdditionalGameScores(false);
                                setLoadedGameScores(true);
                                setExpanded(expanded ? false : true);

                            }
                            else {
                                setExpanded(expanded ? false : true);
                            }


                        }}>
                        {
                            expanded ?
                                <MaterialCommunityIcons name="arrow-collapse-vertical" size={24} color={openScoreboardColor} />

                                :
                                <MaterialCommunityIcons name="arrow-expand-vertical" size={24} color={openScoreboardColor} />

                        }

                    </Button>

                    <Button
                        isIconOnly
                        variant={"ghost"}
                        onPress={() => {
                            if (sigPointsExpanded) {
                                setSigPointsExpanded(false)
                            }
                            else {
                                loadSigPoints(matchDetails.matchID)
                                setSigPointsExpanded(true)
                            }

                        }}>
                        <MaterialCommunityIcons name="hand-clap" size={24} color={openScoreboardColor} />
                    </Button>
                </View>

                <View style={styles.details}>
                    {expanded ?


                        loadingAdditionalGameScores ?
                            <Spinner></Spinner> :

                            [1, 2, 3, 4, 5, 6, 7, 8, 9].map((numb) => {
                                if (additionalFields[`isGame${numb}Started`]) {
                                    return (
                                        <View style={styles.detailBlock} key={`game${numb}`}>
                                            <View style={styles.scoreBreakdownRow}>
                                                <View style={styles.breakdownCell}>
                                                    <Text style={styles.breakdownScore}>{additionalFields[`game${numb}AScore`]}</Text>
                                                </View>
                                                <View style={styles.breakdownCell}>
                                                    <Text style={styles.breakdownLabel}>{i18n.t("game")} {numb}</Text>
                                                </View>
                                                <View style={styles.breakdownCell}>
                                                    <Text style={styles.breakdownScore}>{additionalFields[`game${numb}BScore`]}</Text>
                                                </View>
                                            </View>
                                            <Separator></Separator>
                                        </View>
                                    );
                                }
                            })



                        : null}
                    {sigPointsExpanded ?


                        loadingSigPoints ?
                            <Spinner></Spinner> :

                            Array.isArray(significantPoints) && significantPoints.length > 0 ?
                                <>
                                    <Text style={styles.sectionTitle}>{i18n.t("significantPoints")}</Text>
                                    {
                                        significantPoints.map((sigPoint) => {
                                            return (
                                                <View style={styles.detailBlock} key={sigPoint[0]}>
                                                    <View style={styles.scoreBreakdownRow}>
                                                        <View style={styles.breakdownCell}>
                                                            <Text style={styles.breakdownScore}>{sigPoint[1].playerAScore}</Text>
                                                        </View>
                                                        <View style={styles.breakdownCell}>
                                                            <Text style={styles.breakdownLabel}>{i18n.t("game")} {sigPoint[1].gameNumber} </Text>
                                                        </View>
                                                        <View style={styles.breakdownCell}>
                                                            <Text style={styles.breakdownScore}>{sigPoint[1].playerBScore}</Text>
                                                        </View>
                                                    </View>
                                                    <Separator></Separator>
                                                </View>
                                            );

                                        })
                                    }
                                </>

                                :
                                <Text style={styles.emptyText}>{i18n.t("noSignificantPoints")}</Text>



                        : null}


                </View>
            </Card.Body>
        </Card>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 8,
    },
    cardBody: {
        gap: 12,
    },
    summaryRow: {
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "space-between",
    },
    playerColumn: {
        flex: 1,
        minWidth: 0,
    },
    playerName: {
        color: "#18181b",
        fontSize: 16,
        textAlign: "center",
    },
    scoreColumn: {
        paddingHorizontal: 12,
    },
    scoreText: {
        color: "#18181b",
        fontSize: 16,
        textAlign: "center",
    },
    scoreNumber: {
        fontWeight: "700",
    },
    actionsRow: {
        flexDirection: "row",
        gap: 8,
        justifyContent: "center",
    },
    details: {
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
    },
    detailBlock: {
        width: "100%",
    },
    scoreBreakdownRow: {
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "space-evenly",
        paddingVertical: 8,
    },
    breakdownCell: {
        flex: 1,
        paddingHorizontal: 8,
    },
    breakdownScore: {
        color: "#18181b",
        fontSize: 18,
        fontWeight: "700",
        textAlign: "center",
    },
    breakdownLabel: {
        color: "#3f3f46",
        textAlign: "center",
    },
    sectionTitle: {
        color: "#18181b",
        fontWeight: "700",
        textAlign: "center",
    },
    emptyText: {
        color: "#52525b",
        textAlign: "center",
    },
});
