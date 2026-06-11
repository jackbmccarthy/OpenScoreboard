import React, { useEffect, useState } from 'react';
import { Button, Text, View, Input } from 'native-base';
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

    const parsedAScore = parseInt(`${AScore}`);
    const parsedBScore = parseInt(`${BScore}`);
    const canSave = scoreChanged
        && !isNaN(parsedAScore)
        && !isNaN(parsedBScore)
        && isValidGameScore(props.enforceGameScore, parsedAScore, parsedBScore, props.pointsToWinGame);

    async function saveGameScore() {
        if (!canSave) {
            return;
        }

        await manuallySetGameScore(props.matchID, props.gameNumber, parsedAScore, parsedBScore);
        setScoreChanged(false);
    }

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
            {scoreChanged ? (
                <View alignItems={"center"} marginTop={2} marginBottom={3}>
                    <Button
                        backgroundColor={canSave ? "#16A34A" : "gray.300"}
                        borderRadius={10}
                        disabled={!canSave}
                        minWidth={150}
                        onPress={saveGameScore}
                        paddingX={5}
                        _disabled={{ opacity: 0.7 }}
                        _pressed={{ backgroundColor: canSave ? "#15803D" : "gray.300" }}
                    >
                        <Text color={canSave ? "white" : "gray.700"} fontWeight={"bold"}>
                            {canSave ? i18n.t("save") : "Invalid Score"}
                        </Text>
                    </Button>
                </View>
            ) : null}
        </>

    );
}
