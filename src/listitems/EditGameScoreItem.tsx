import React, { useEffect, useState } from 'react';
import { Button, Text, View, Input } from 'native-base';
import { openScoreboardColor } from "../../openscoreboardtheme";
import { isValidGameScore, manuallySetGameScore } from '../functions/scoring';
import i18n from '../translations/translate';

export function EditGameScoreItem(props) {
    let [AScore, setAScore] = useState(props[`game${props.gameNumber}AScore`] || 0);
    let [BScore, setBScore] = useState(props[`game${props.gameNumber}BScore`] || 0);
    let [scoreChanged, setScoreChanged] = useState(false);

    useEffect(() => {
        setAScore(props[`game${props.gameNumber}AScore`] || 0);
    }, [props[`game${props.gameNumber}AScore`]]);

    useEffect(() => {
        setBScore(props[`game${props.gameNumber}BScore`] || 0);
    }, [props[`game${props.gameNumber}BScore`]]);

    return (
        <>
            <Text fontSize={"2xl"} fontWeight={"bold"} textAlign={"center"}>{i18n.t("game")} {props.gameNumber}</Text>
            <View flexDir={"row"} alignItems="center">
                <View flex={1}>
                    <Input InputRightElement={<View justifyContent={"center"} flex={2} alignItems={"center"} backgroundColor={"gray.300"} padding={1}>
                        <Text fontSize={"2xl"}>{AScore > BScore ? "W" : "L"}</Text>
                    </View>}
                        fontSize="2xl"
                        keyboardType='numeric'
                        value={AScore}
                        onChangeText={(text) => {
                            if (text.match(/\d*$/)) {
                                if (isNaN(parseInt(text))) {
                                    setAScore("");
                                }
                                else {
                                    setAScore(parseInt(text));
                                }
                                setScoreChanged(true);
                            }

                        }}
                    ></Input>
                </View>
                <View flex={1} padding={1}>
                    <Button
                        onPress={() => {
                            if (isValidGameScore(props.enforceGameScore, AScore, BScore, props.pointsToWinGame)) {
                                manuallySetGameScore(props.matchID, props.gameNumber, AScore, BScore);
                                setScoreChanged(false);
                            }
                        }}
                        backgroundColor={scoreChanged && !isNaN(parseInt(BScore)) && !isNaN(parseInt(AScore)) && isValidGameScore(props.enforceGameScore, AScore, BScore, props.pointsToWinGame) ? openScoreboardColor : "gray.300"}
                        disabled={!scoreChanged || isNaN(parseInt(BScore)) || isNaN(parseInt(AScore)) || !isValidGameScore(props.enforceGameScore, AScore, BScore, props.pointsToWinGame)}>
                        <Text>{i18n.t("save")}</Text>
                    </Button>
                </View>
                <View flex={1}>
                    <Input fontSize={"2xl"} keyboardType='numeric'
                        leftElement={<View justifyContent={"center"} flex={2} alignItems={"center"} backgroundColor={"gray.300"} padding={1}>
                            <Text fontSize={"2xl"}>{AScore < BScore ? "W" : "L"}</Text>
                        </View>}
                        value={BScore}
                        onChangeText={(text) => {
                            if (text.match(/\d*$/)) {
                                if (isNaN(parseInt(text))) {
                                    setBScore("");
                                }
                                else {
                                    setBScore(parseInt(text));
                                }

                                setScoreChanged(true);
                            }

                        }}
                    ></Input>
                </View>
            </View>
        </>

    );
}
