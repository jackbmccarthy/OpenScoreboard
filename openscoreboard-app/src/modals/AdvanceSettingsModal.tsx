import React, { useEffect, useState } from 'react';
import { Button, Text, View, Modal, Spinner, FormControl } from 'native-base';
import { openScoreboardButtonTextColor, openScoreboardColor } from "../../openscoreboardtheme";
import { endGame, flipScoreboard, getCurrentGameNumber, getMatchScore, isGameFinished, resetMatchScores, setBestOf, setChangeServiceEveryXPoints, setGamePointsToWinGame, setScoringType } from '../functions/scoring';
import { getCombinedPlayerNames } from '../functions/players';
import { EditGameScoreItem } from '../listitems/EditGameScoreItem';
import i18n from '../translations/translate';
import { supportedSports } from '../functions/sports';

export function AdvanceSettingsModal(props) {
    const [showLoadingResetMatches, setShowLoadingResetMatches] = useState(false);
    const [confirmManualEndGame, setConfirmManualEndGame] = useState(false)
    const [loadingManualEndGame, setLoadingManualEndGame] = useState(false)
    const [bestOfGames, setBestOfGames] = useState(props.bestOf)
    const [pointsToWinGame, setPointsToWinGame] = useState(props.pointsToWinGame)
    const [changeServeEveryXPoints, setChangeServeEveryXPoints] = useState(props.changeServeEveryXPoints)

    const [selectedScoringType, setSelectedScoringType] = useState(props.scoringType)
    const matchScores = getMatchScore(props)
    const gamesPlayed = matchScores.a + matchScores.b



    useEffect(() => {
        setBestOfGames(props.bestOf)
        setPointsToWinGame(props.pointsToWinGame)
        setChangeServeEveryXPoints(props.changeServeEveryXPoints)
    }, [props.bestOf, props.pointsToWinGame, props.changeServeEveryXPoints])

    return (<Modal avoidKeyboard isOpen={props.isOpen} onClose={() => { props.onClose(); }}>
        <Modal.Content>
            <Modal.CloseButton></Modal.CloseButton>
            <Modal.Header>{i18n.t("settings")}</Modal.Header>
            <Modal.Body>
                <FormControl>
                    {/* 
                    //Reintroduce after it is fixed in the scoring
                    <FormControl.Label>{i18n.t("resetScores")}</FormControl.Label>
                    <View>
                        <Button

                            onPress={async () => {
                                setShowLoadingResetMatches(true);
                                await resetMatchScores(props.matchID);
                                setShowLoadingResetMatches(false);
                            }}
                        >
                            {showLoadingResetMatches ?
                                <Spinner color={openScoreboardButtonTextColor} />
                                : <Text color={openScoreboardButtonTextColor}>{i18n.t("resetScores")}</Text>}

                        </Button>
                    </View> */}
                    <FormControl.Label>{i18n.t("winBestOf")}</FormControl.Label>
                    <View flexDir={"row"}>
                        <View flex={1} padding={1}>
                            <Button disabled={gamesPlayed >= 1}
                                onPress={() => {
                                    setBestOfGames(1)
                                    setBestOf(props.matchID, 1)
                                }}
                                backgroundColor={bestOfGames === 1 ? openScoreboardColor : "gray.300"}>
                                <Text color={openScoreboardButtonTextColor}>1</Text>
                            </Button>
                        </View>
                        <View flex={1} padding={1}>
                            <Button disabled={gamesPlayed >= 3}
                                onPress={() => {
                                    setBestOfGames(3)
                                    setBestOf(props.matchID, 3)
                                }}
                                backgroundColor={bestOfGames === 3 ? openScoreboardColor : "gray.300"}>
                                <Text color={openScoreboardButtonTextColor}>3</Text>
                            </Button>
                        </View>
                        <View flex={1} padding={1}>
                            <Button disabled={gamesPlayed >= 5}
                                onPress={() => {
                                    setBestOfGames(5)
                                    setBestOf(props.matchID, 5)
                                }}
                                backgroundColor={bestOfGames === 5 ? openScoreboardColor : "gray.300"}>
                                <Text color={openScoreboardButtonTextColor}>5</Text>
                            </Button>
                        </View>
                        <View flex={1} padding={1}>
                            <Button disabled={gamesPlayed >= 7}
                                onPress={() => {
                                    setBestOfGames(7)
                                    setBestOf(props.matchID, 7)
                                }}
                                backgroundColor={bestOfGames === 7 ? openScoreboardColor : "gray.300"}>
                                <Text color={openScoreboardButtonTextColor}>7</Text>
                            </Button>
                        </View>
                        <View flex={1} padding={1}>
                            <Button
                                onPress={() => {
                                    setBestOfGames(9)
                                    setBestOf(props.matchID, 9)
                                }}
                                backgroundColor={bestOfGames === 9 ? openScoreboardColor : "gray.300"}>
                                <Text color={openScoreboardButtonTextColor}>9</Text>
                            </Button>
                        </View>

                    </View>
                    <View padding={1}>
                        <FormControl.Label>{i18n.t("flipCourtSideScoreboard")}</FormControl.Label>
                        <View padding={1}>
                            <Button
                                onPress={() => {
                                    flipScoreboard(props.matchID)
                                }}
                            >
                                <Text color={openScoreboardButtonTextColor}>{i18n.t("flip")}</Text>
                            </Button>
                        </View>
                    </View>

                    <View padding={1}>
                        <FormControl.Label>{i18n.t("manuallyFinishGame")}</FormControl.Label>

                        <View padding={1}>
                            {
                                confirmManualEndGame ?
                                    <View flexDirection={"row"}>
                                        <View padding={1}>
                                            <Button
                                                onPress={async () => {
                                                    setLoadingManualEndGame(true)
                                                    let newMatchValues = await endGame(props.matchID, getCurrentGameNumber(props))
                                                    props.openAfterGamePrompt({ ...props, ...newMatchValues })
                                                    props.onClose()
                                                    setLoadingManualEndGame(false)
                                                    setConfirmManualEndGame(false)

                                                }}
                                                variant={"ghost"}>
                                                {
                                                    loadingManualEndGame ?
                                                        <Spinner color={openScoreboardColor}></Spinner> :
                                                        <Text>{i18n.t("yes")}</Text>
                                                }

                                            </Button>
                                        </View>
                                        <View padding={1}>
                                            <Button onPress={async () => {
                                                setConfirmManualEndGame(false)


                                            }} >
                                                <Text color={openScoreboardButtonTextColor}>{i18n.t("no")}</Text>
                                            </Button>
                                        </View>
                                    </View>
                                    :
                                    <Button
                                        onPress={async () => {
                                            setConfirmManualEndGame(true)


                                        }}
                                    >
                                        <Text color={openScoreboardButtonTextColor}>{i18n.t("manuallyFinishGame")}</Text>
                                    </Button>
                            }

                        </View>
                    </View>

                    <View padding={1}>
                        <FormControl.Label>{i18n.t("pointsToWinGame")}</FormControl.Label>

                        <View padding={1}>
                            <View flexDir={"row"}>
                                <View flex={1} padding={1}>
                                    <Button
                                        onPress={() => {
                                            setPointsToWinGame(11)
                                            setGamePointsToWinGame(props.matchID, 11)
                                        }}
                                        backgroundColor={pointsToWinGame === 11 ? openScoreboardColor : "gray.300"}>
                                        <Text color={openScoreboardButtonTextColor}>11</Text>
                                    </Button>
                                </View>
                                <View flex={1} padding={1}>
                                    <Button
                                        onPress={() => {
                                            setPointsToWinGame(15)
                                            setGamePointsToWinGame(props.matchID, 15)
                                        }}
                                        backgroundColor={pointsToWinGame === 15 ? openScoreboardColor : "gray.300"}>
                                        <Text color={openScoreboardButtonTextColor}>15</Text>
                                    </Button>
                                </View>
                                <View flex={1} padding={1}>
                                    <Button
                                        onPress={() => {
                                            setPointsToWinGame(21)
                                            setGamePointsToWinGame(props.matchID, 21)
                                        }}
                                        backgroundColor={pointsToWinGame === 21 ? openScoreboardColor : "gray.300"}>
                                        <Text color={openScoreboardButtonTextColor}>21</Text>
                                    </Button>
                                </View>
                                <View flex={1} padding={1}>
                                    <Button
                                        onPress={() => {
                                            setPointsToWinGame(9999)
                                            setGamePointsToWinGame(props.matchID, 9999)
                                        }}
                                        backgroundColor={pointsToWinGame === 9999 ? openScoreboardColor : "gray.300"}>
                                        <Text color={openScoreboardButtonTextColor}>No Limit</Text>
                                    </Button>
                                </View>


                            </View>


                        </View>
                    </View>
                    {supportedSports[props.sportName].hasScoringTypes ?

                        <View padding={1}>
                            <FormControl.Label>{i18n.t("changeScoringType")}</FormControl.Label>

                            <View padding={1}>
                                <View flexDir={"row"}>
                                    {
                                        // supportedSports[props.sportName].hasScoringTypes ?
                                        Object.entries(supportedSports[props.sportName].scoringTypes).map(([id, scoringType]) => {
                                            return (
                                                <View flex={1} padding={1}>
                                                    <Button
                                                        onPress={() => {
                                                            setSelectedScoringType(id)
                                                            setScoringType(props.matchID, id)
                                                        }}
                                                        backgroundColor={id === selectedScoringType ? openScoreboardColor : "gray.300"}>
                                                        <Text color={openScoreboardButtonTextColor}>{scoringType["displayName"]}</Text>
                                                    </Button>
                                                </View>
                                            )
                                        })
                                        // :null
                                    }




                                </View>


                            </View>
                        </View>

                        : null
                    }


                    <View padding={1}>
                        <FormControl.Label>{i18n.t("changeServerEveryXPoints")}</FormControl.Label>

                        <View padding={1}>
                            <View flexDir={"row"}>
                                <View flex={1} padding={1}>
                                    <Button
                                        onPress={() => {
                                            setChangeServeEveryXPoints(1)
                                            setChangeServiceEveryXPoints(props.matchID, 1)
                                        }}
                                        backgroundColor={changeServeEveryXPoints === 1 ? openScoreboardColor : "gray.300"}>
                                        <Text color={openScoreboardButtonTextColor}>1</Text>
                                    </Button>
                                </View>
                                <View flex={1} padding={1}>
                                    <Button
                                        onPress={() => {
                                            setChangeServeEveryXPoints(2)
                                            setChangeServiceEveryXPoints(props.matchID, 2)
                                        }}
                                        backgroundColor={changeServeEveryXPoints === 2 ? openScoreboardColor : "gray.300"}>
                                        <Text color={openScoreboardButtonTextColor}>2</Text>
                                    </Button>
                                </View>
                                <View flex={1} padding={1}>
                                    <Button
                                        onPress={() => {
                                            setChangeServeEveryXPoints(5)
                                            setChangeServiceEveryXPoints(props.matchID, 5)
                                        }}
                                        backgroundColor={changeServeEveryXPoints === 5 ? openScoreboardColor : "gray.300"}>
                                        <Text color={openScoreboardButtonTextColor}>5</Text>
                                    </Button>
                                </View>


                            </View>


                        </View>
                    </View>

                    {
                        [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((gameN) => {
                            return props[`isGame${gameN}Finished`]
                        }).length > 0 ?
                            <>
                                <FormControl.Label>{i18n.t("manuallyEditFinishedGameScores")}</FormControl.Label>
                                <View flexDir="row">
                                    <View padding={1} alignItems={"center"} flex={1}>
                                        <Text fontSize={"lg"} textAlign={"center"}>{getCombinedPlayerNames(props.playerA, props.playerB, props.playerA2, props.playerB2).a}</Text>
                                    </View>
                                    <View padding={1} alignItems={"center"} flex={1}>
                                        <Text fontSize={"lg"} textAlign={"center"}>{getCombinedPlayerNames(props.playerA, props.playerB, props.playerA2, props.playerB2).b}</Text>
                                    </View>
                                </View>
                                <View>
                                    {
                                        [1, 2, 3, 4, 5, 6, 7, 8, 9].map((gameNumber) => {
                                            if (props[`isGame${gameNumber}Finished`]) {
                                                return (
                                                    <EditGameScoreItem key={"game" + gameNumber} gameNumber={gameNumber} {...props} ></EditGameScoreItem>
                                                )
                                            }
                                        })
                                    }
                                </View>
                            </>
                            : null
                    }

                </FormControl>
            </Modal.Body>


        </Modal.Content>
    </Modal>);
}
