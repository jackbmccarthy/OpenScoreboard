import React, { useEffect, useState } from 'react';
import { Button, Spinner, Text, View } from 'native-base';
import { openScoreboardButtonTextColor, openScoreboardColor } from "../../openscoreboardtheme";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getPlayerFormatted } from '../functions/players';
import { AddPoint, AWonRally_PB, BWonRally_PB, getCurrentGameNumber, getMatchScore, isFinalGame, isGameFinished, isGamePoint, MinusPoint, setIsGamePoint, setIsMatchPoint, setServerManually } from '../functions/scoring';

export function ScoringSidePickleball(props) {


    let [loadingAddPoint, setLoadingAddPoint] = useState(false)
    let [loadingMinusPoint, setLoadingMinusPoint] = useState(false)
    let [manualServiceMode, setManualServiceMode] = useState(false)

    const [playerA, setPlayerA] = useState(props.playerA)
    const [playerA2, setPlayerA2] = useState(props.playerA2)
    const [playerB, setPlayerB] = useState(props.playerB)
    const [playerB2, setPlayerB2] = useState(props.playerB2)
    const [isA, setIsA] = useState(props.isA)
    const [isSwitched, setIsSwitched] = useState(props.isSwitched)


    useEffect(() => {
        setIsA(props.isA)
        setPlayerA(props.playerA)
        setPlayerA2(props.playerA2)
        setPlayerB(props.playerB)
        setPlayerB2(props.playerB2)
    }, [props.playerA, props.playerB, props.playerA2, props.playerB2, props.isA])

    useEffect(() => {
        setIsSwitched(props.isSwitched)
    }, [props.isSwitched])
    function getBackgroundColor(player) {
        if (player && player.jerseyColor) {
            if (player.jerseyColor.length > 0) {
                return player.jerseyColor
            }
        }
        return openScoreboardColor
    }

    function showPlayerName(player) {
        let formattedPlayer = getPlayerFormatted(player);
        if (formattedPlayer.length > 0) {
            return formattedPlayer;
        }
        else {
            return "Select Player";
        }
    }

    // let [isOnLeft, setIsOnLeft] = useState(isA && !isSwitched);

    // useEffect(() => {
    //     if (isA) {
    //         setIsOnLeft(isSwitched ? false : true);
    //     }
    //     else {
    //         setIsOnLeft(isSwitched ? true : false);
    //     }
    // }, [isSwitched, isA]);

    useEffect(() => {
        setManualServiceMode(props.isManualServiceMode)
    }, [props.isManualServiceMode])



    return (
        <View height={"100%"} flex={1} flexDirection={"row"}>
            <View height={"100%"} flex={1} backgroundColor={isA ? getBackgroundColor(playerA) : getBackgroundColor(playerB)}>
                <View display={"flex"} justifyContent={"center"} flexDir={"row"} flexWrap={"wrap"}>
                    <View minWidth={150} maxWidth={300} flex={1} padding={1}>
                        <Button overflowX={"hidden"}
                            onPress={() => {
                                if (props.isA) {
                                    props.openPlayerModal("playerA");
                                }
                                else {
                                    props.openPlayerModal("playerB");
                                }

                            }}

                            borderStyle={"groove"} borderWidth="4" borderColor={"white"}>
                            <Text color={openScoreboardButtonTextColor}>{isA ? showPlayerName(playerA) : showPlayerName(playerB)}</Text>
                        </Button>
                    </View>
                    <View minWidth={150} maxWidth={300} flex={1} padding={1}>
                        {props.isDoubles === true ?
                            <Button
                                onPress={() => {
                                    if (props.isA) {
                                        props.openPlayerModal("playerA2");
                                    }
                                    else {
                                        props.openPlayerModal("playerB2");
                                    }

                                }}
                                borderStyle={"groove"} borderWidth="4" borderColor={"white"}>
                                <Text color={openScoreboardButtonTextColor}>{isA ? showPlayerName(playerA2) : showPlayerName(playerB2)}</Text>
                            </Button>
                            : null}

                    </View>

                </View>
                <View w={"100%"} justifyContent={"center"} alignItems="center" padding={1}
             
                >
                    <View paddingLeft={4} paddingRight={4} borderRadius={2} backgroundColor="white">
                        <Text fontWeight={"bold"} fontSize={"3xl"}>{isA ? getMatchScore(props).a : getMatchScore(props).b}</Text>
                    </View>

                </View>
                <View paddingLeft={2} paddingRight={2} paddingTop={4} paddingBottom={4}
                    flex={5}>







                    <Button
                        onPress={async () => {
                            let gameNumber = getCurrentGameNumber(props)
                            setLoadingAddPoint(true)
                            if (props.isA) {
                                let newAScore = await AWonRally_PB(props.matchID, gameNumber, props.isACurrentlyServing, props.isSecondServer, props.isDoubles, props.scoringType === "rally", props.pointsToWinGame, props[`game${gameNumber}AScore`])
                                if (newAScore) {
                                    let isGameDone = isGameFinished(props.enforceGameScore, newAScore, props[`game${gameNumber}BScore`], props.pointsToWinGame)
                                    if (isGameDone) {
                                        props.openGameWonConfirmationModal()
                                    }
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
                                }

                            }
                            else {
                                let newBScore = await BWonRally_PB(props.matchID, gameNumber, props.isACurrentlyServing, props.isSecondServer, props.isDoubles, props.scoringType === "rally", props.pointsToWinGame, props[`game${gameNumber}BScore`])

                                if (newBScore) {
                                    let isGameDone = isGameFinished(props.enforceGameScore, props[`game${gameNumber}AScore`], newBScore, props.pointsToWinGame)
                                    if (isGameDone) {
                                        props.openGameWonConfirmationModal()
                                    }
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
                                }

                            }
                            setLoadingAddPoint(false)
                        }}

                        borderStyle={"groove"} borderWidth="4" borderColor={"white"} flex={1}>
                        <Text color={openScoreboardButtonTextColor} fontSize={"3xl"} flexWrap={"wrap"} fontWeight={"bold"} textAlign={"center"}>Rally</Text>
                        <Text color={openScoreboardButtonTextColor} fontSize={"3xl"} flexWrap={"wrap"} fontWeight={"bold"} textAlign={"center"}>Won</Text>
                        <View
                            justifyContent={"center"}
                            opacity={props.isManualServiceMode || (isA && props.isACurrentlyServing) || (!isA && !props.isACurrentlyServing) ? 1 : 0}
                            alignItems="center"
                            padding={1}
                      
                        >

                            <Button borderColor={"white"} borderWidth={manualServiceMode && ((isA && props.isACurrentlyServing) || (!isA && !props.isACurrentlyServing)) ? 2 : null} disabled={!manualServiceMode}
                                onPress={() => {
                                    if (isA) {
                                        setServerManually(props.matchID, true)
                                    }
                                    else {
                                        setServerManually(props.matchID, false)
                                    }
                                }}
                                backgroundColor={manualServiceMode ? null : "transparent"}>

                                <View flexDirection={"row"}>
                                    <MaterialCommunityIcons name={"numeric-1-circle"} size={24} color={openScoreboardButtonTextColor} />
                                    {props.isSecondServer ? <MaterialCommunityIcons name={"numeric-2-circle"} size={24} color={openScoreboardButtonTextColor} /> : null}

                                </View>

                            </Button>

                        </View>
                    </Button>

                    <View padding={ 1} flexDirection={"row"} alignItems={"center"}>
                        <Button disabled={loadingAddPoint || loadingMinusPoint}
                            onPress={async () => {
                                let gameNumber = getCurrentGameNumber(props)

                                setLoadingAddPoint(true)
                                if (props.isA) {
                                    let newAScore = await AddPoint(props.matchID, gameNumber, "A")
                                   
                                    let isGameDone = isGameFinished(props.enforceGameScore, newAScore, props[`game${gameNumber}BScore`], props.pointsToWinGame)
                                    if (isGameDone) {
                                        props.openGameWonConfirmationModal()
                                    }
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
                                }
                                else {
                                    let newBScore = await AddPoint(props.matchID, getCurrentGameNumber(props), "B")
                                
                                    let isGameDone = isGameFinished(props.enforceGameScore, props[`game${gameNumber}AScore`], newBScore, props.pointsToWinGame)
                                    if (isGameDone) {
                                        props.openGameWonConfirmationModal()
                                    }
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
                                }
                                setLoadingAddPoint(false)
                            }}
                            borderStyle={"groove"} borderWidth="4" borderColor={"white"} flex={1} >

                            <Text fontWeight={"bold"} color="white" fontSize="6xl">+</Text>
                        </Button>

                        <View>
                            <View width={"100%"} justifyContent="center" alignItems={"center"}>
                                <View padding={2}>
                                    <View padding={1} borderRadius={4} backgroundColor={openScoreboardColor}>
                                        <Text color={openScoreboardButtonTextColor} fontSize={"5xl"} fontWeight={"bold"} textAlign={"center"}>{props[`game${getCurrentGameNumber(props)}${isA ? "A" : "B"}Score`]}</Text>

                                    </View>
                                </View>


                            </View>



                        </View>


                        <Button disabled={loadingMinusPoint || loadingAddPoint}
                            onPress={async () => {

                                setLoadingMinusPoint(true)
                                let gameNumber = getCurrentGameNumber(props)
                                if (props.isA) {
                                    let newAScore = await MinusPoint(props.matchID, getCurrentGameNumber(props), "A")
                                    //await updateService(props.matchID, props.isAInitialServer, gameNumber, newAScore + props[`game${gameNumber}BScore`], props.changeServeEveryXPoints, props.pointsToWinGame, props.sportName, props.scoringType)
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
                                }
                                else {
                                    let newBScore = await MinusPoint(props.matchID, getCurrentGameNumber(props), "B")
                                    // await updateService(props.matchID, props.isAInitialServer, gameNumber, newBScore + props[`game${gameNumber}AScore`], props.changeServeEveryXPoints, props.pointsToWinGame, props.sportName, props.scoringType)
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
                                }

                                setLoadingMinusPoint(false)
                            }}
                            borderStyle={"groove"} borderWidth="4" borderColor={"white"} flex={1}  >

                            <Text color={openScoreboardButtonTextColor} fontWeight={"bold"} fontSize="6xl">-</Text>
                        </Button>

                    </View>
                </View>
            </View>
        </View>);
}