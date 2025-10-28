import React, { useState } from 'react';
import { Button, Text, View, Modal, Spinner } from 'native-base';
import { openScoreboardButtonTextColor, openScoreboardColor } from "../../openscoreboardtheme";
import { endGame, getCurrentGameNumber, getCurrentGameScore, getMatchScore, isFinalGame, isGamePoint, isMatchFinished, MinusPoint, setIsGamePoint, setIsMatchPoint, updateService } from '../functions/scoring';
import { getCombinedPlayerNames } from '../functions/players';
import { addWinToTeamMatchTeamScore } from '../functions/teammatches';
import i18n from '../translations/translate';

export function GameWonConfirmationModal(props) {
    let { playerA, playerB, playerA2, playerB2 } = props;
    const gameNumber = getCurrentGameNumber(props);
    let [loadingConfirmGame, setLoadingConfirmGame] = useState(false);


    function isGameWinnerA(match) {
        let scores = getCurrentGameScore(match);
        return scores.a > scores.b;

    }

    function winnerScore(match) {
        if (isGameWinnerA(match)) {
            return getCurrentGameScore(match).a;
        }
        else {
            return getCurrentGameScore(match).b;
        }
    }
    function loserScore(match) {
        if (isGameWinnerA(match)) {
            return getCurrentGameScore(match).b;
        }
        else {
            return getCurrentGameScore(match).a;
        }
    }

    return (
        <Modal isOpen={props.isOpen}>
            <Modal.Content>

                <Modal.Body>
                    {loadingConfirmGame ?
                        <View alignItems={"center"} justifyContent={"center"} >
                            <Text fontSize={"3xl"}>{i18n.t("finishingGame")}...</Text>

                        </View>


                        :
                        <>
                            <Text textAlign={"center"} fontSize={"4xl"} fontWeight={"bold"}> {i18n.t("game")} {gameNumber} {i18n.t("winner")}</Text>
                            <Text textAlign={"center"} fontSize={"3xl"}>{isGameWinnerA(props) ? getCombinedPlayerNames(playerA, playerB, playerA2, playerB2).a : getCombinedPlayerNames(playerA, playerB, playerA2, playerB2).b}</Text>
                            <Text textAlign={"center"} fontSize={"4xl"}>{winnerScore(props)} - {loserScore(props)}</Text>
                        </>

                    }


                </Modal.Body>
                <Modal.Footer>
                    <View flex={1} padding={1}>
                        <Button isDisabled={loadingConfirmGame}
                            onPress={async () => {
                                setLoadingConfirmGame(true);
                                let updatedGameValues = await endGame(props.matchID, gameNumber);
                                if (props.isTeamMatch) {
                                    if (isMatchFinished({ ...props, ...updatedGameValues })) {
                                        let finalScore = getMatchScore({ ...props, ...updatedGameValues })
                                        if (finalScore.a > finalScore.b) {
                                            await addWinToTeamMatchTeamScore(props.teamMatchID, "A")
                                        }
                                        else {
                                            await addWinToTeamMatchTeamScore(props.teamMatchID, "B")
                                        }
                                    }


                                }
                                props.onClose();
                                setLoadingConfirmGame(false);
                                props.openAfterGamePrompt({ ...props, ...updatedGameValues });
                            }}
                        >
                            {loadingConfirmGame ?
                                <Spinner color={openScoreboardButtonTextColor}></Spinner> :
                                <Text color={openScoreboardButtonTextColor}>{i18n.t("confirm")}</Text>}

                        </Button>
                    </View>
                    <View flex={1} padding={1}>
                        <Button
                            onPress={async () => {
                                let scores = getCurrentGameScore(props);
                                if (scores.a >= scores.b) {
                                    const newAScore = await MinusPoint(props.matchID, getCurrentGameNumber(props), "A");
                                    updateService(props.matchID, props.isAInitialServer, gameNumber, newAScore + props[`game${gameNumber}BScore`], props.changeServeEveryXPoints, props.pointsToWinGame, props.sportName, props.scoringType)
                                    if (isGamePoint({ ...props, [`game${gameNumber}AScore`]: newAScore }) && isFinalGame({ ...props, [`game${gameNumber}AScore`]: newAScore })) {
                                        //Match Point
                                        setIsMatchPoint(props.matchID, true)
                                    }
                                    else if (isGamePoint({ ...props, [`game${gameNumber}AScore`]: newAScore })) {
                                        setIsGamePoint(props.matchID, true)
                                    }
                                    else {
                                        if (props.isGamePoint) {
                                            setIsGamePoint(props.matchID, false)
                                        }
                                        if (props.isMatchPoint) {
                                            setIsMatchPoint(props.matchID, false)
                                        }
                                    }
                                    props.onClose();
                                }
                                else {
                                    const newBScore = await MinusPoint(props.matchID, getCurrentGameNumber(props), "B");
                                    updateService(props.matchID, props.isAInitialServer, gameNumber, newBScore + props[`game${gameNumber}AScore`], props.changeServeEveryXPoints, props.pointsToWinGame, props.sportName, props.scoringType)
                                    if (isGamePoint({ ...props, [`game${gameNumber}BScore`]: newBScore }) && isFinalGame({ ...props, [`game${gameNumber}BScore`]: newBScore })) {
                                        //Match Point
                                        setIsMatchPoint(props.matchID, true)
                                    }
                                    else if (isGamePoint({ ...props, [`game${gameNumber}BScore`]: newBScore })) {
                                        setIsGamePoint(props.matchID, true)
                                    }
                                    else {
                                        if (props.isGamePoint) {
                                            setIsGamePoint(props.matchID, false)
                                        }
                                        if (props.isMatchPoint) {
                                            setIsMatchPoint(props.matchID, false)
                                        }
                                    }
                                    props.onClose();
                                }
                            }}
                            variant={"ghost"}>
                            <Text>{i18n.t("no")} </Text>
                        </Button>
                    </View>
                </Modal.Footer>
            </Modal.Content>
        </Modal>
    );


}
