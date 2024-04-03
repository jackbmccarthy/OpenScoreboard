import React, { useEffect, useState } from 'react';
import { Button, Spinner, Text, View } from 'native-base';
import { openScoreboardButtonTextColor, openScoreboardColor } from "../../openscoreboardtheme";
import { Ionicons, AntDesign } from '@expo/vector-icons';
import { getPlayerFormatted } from '../functions/players';
import { AddPoint, getCurrentGameNumber, getMatchScore, isFinalGame, isGameFinished, isGamePoint, MinusPoint, setIsGamePoint, setisManualMode, setIsMatchPoint, setServerManually, updateService } from '../functions/scoring';

export function ScoringSide(props) {

    let [loadingAddPoint, setLoadingAddPoint] = useState(false)
    let [loadingMinusPoint, setLoadingMinusPoint] = useState(false)
    let [manualServiceMode, setManualServiceMode] = useState(false)


    const { playerA, playerB, playerA2, playerB2, isA } = props;

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

    let [isOnLeft, setIsOnLeft] = useState(null);
    useEffect(() => {
        if (props.isA) {
            setIsOnLeft(props.isSwitched ? false : true);
        }
        else {
            setIsOnLeft(props.isSwitched ? true : false);
        }
    }, [props.isSwitched]);

    useEffect(() => {
        setManualServiceMode(props.isManualServiceMode)
    }, [props.isManualServiceMode])



    return (
        <View height={"100%"} flex={1} flexDirection={"row"}>
            <View height={"100%"} flex={1} backgroundColor={isA ? getBackgroundColor(playerA) : getBackgroundColor(playerB)}>
                <View>
                    <View flex={1} padding={1}>
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
                    <View flex={1} padding={1}>
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

                <View paddingLeft={isOnLeft ? 1 : 8} paddingRight={isOnLeft ? 8 : 1} flex={5}>
                    <Button disabled={loadingAddPoint || loadingMinusPoint}
                        onPress={async () => {
                            let gameNumber = getCurrentGameNumber(props)
                            let results
                            setLoadingAddPoint(true)
                            if (props.isA) {
                                let newAScore = await AddPoint(props.matchID, gameNumber, "A")
                                if (!manualServiceMode) {
                                    await updateService(props.matchID, props.isAInitialServer, gameNumber, newAScore + props[`game${gameNumber}BScore`], props.changeServeEveryXPoints, props.pointsToWinGame, props.sportName, props.scoringType)
                                }
                                let isGameDone = isGameFinished(props.enforceGameScore, newAScore, props[`game${gameNumber}BScore`], props.pointsToWinGame)
                                if (isGameDone) {
                                    props.openGameWonConfirmationModal()
                                }
                                if(isGamePoint({ ...props, [`game${gameNumber}AScore`]: newAScore }) && isFinalGame({ ...props, [`game${gameNumber}AScore`]: newAScore })){
                                    //Match Point
                                    setIsMatchPoint(props.matchID, true)
                                }
                                else if(isGamePoint({ ...props, [`game${gameNumber}AScore`]: newAScore }) ){
                                    setIsGamePoint(props.matchID, true)
                                }
                                else {
                                   if(props.isGamePoint){
                                    setIsGamePoint(props.matchID, false)
                                   }
                                   if(props.isMatchPoint){
                                    setIsMatchPoint(props.matchID, false)
                                   }
                                }
                            }
                            else {
                                let newBScore = await AddPoint(props.matchID, getCurrentGameNumber(props), "B")
                                if (!manualServiceMode) {
                                    await updateService(props.matchID, props.isAInitialServer, gameNumber, newBScore + props[`game${gameNumber}AScore`], props.changeServeEveryXPoints, props.pointsToWinGame, props.sportName, props.scoringType)
                                }
                                let isGameDone = isGameFinished(props.enforceGameScore, props[`game${gameNumber}AScore`], newBScore, props.pointsToWinGame)
                                if (isGameDone) {
                                    props.openGameWonConfirmationModal()
                                }
                                if(isGamePoint({ ...props, [`game${gameNumber}BScore`]: newBScore }) && isFinalGame({ ...props, [`game${gameNumber}BScore`]: newBScore })){
                                    //Match Point
                                    setIsMatchPoint(props.matchID, true)
                                }
                                else if(isGamePoint({ ...props, [`game${gameNumber}BScore`]: newBScore }) ){
                                    setIsGamePoint(props.matchID, true)
                                }
                                else {
                                   if(props.isGamePoint){
                                    setIsGamePoint(props.matchID, false)
                                   }
                                   if(props.isMatchPoint){
                                    setIsMatchPoint(props.matchID, false)
                                   }
                                }
                            }
                            setLoadingAddPoint(false)
                        }}
                        borderStyle={"groove"} borderWidth="4" borderColor={"white"} flex={1}>
                        {
                            loadingAddPoint ?
                                <Spinner color={openScoreboardButtonTextColor} />
                                :
                                <Text fontWeight={"bold"} color="white" fontSize="6xl">+</Text>
                        }

                    </Button>
                </View>
                <View>
                    <View width={"100%"} justifyContent="center" alignItems={"center"}>
                        <View padding={2}>
                            <View padding={1} borderRadius={4} backgroundColor={openScoreboardColor}>
                                <Text color={openScoreboardButtonTextColor} fontSize={"5xl"} fontWeight={"bold"} textAlign={"center"}>{props[`game${getCurrentGameNumber(props)}${isA ? "A" : "B"}Score`]}</Text>

                            </View>
                        </View>


                    </View>
                    {
                        props.isManualServiceMode || (isA && props.isACurrentlyServing) || (!isA && !props.isACurrentlyServing) ?

                            <View justifyContent={"center"}  alignItems="center" padding={1} position={"absolute"} right={isOnLeft ? 0 : null} left={isOnLeft ? null : 0} bottom={0} top={0}>
                                <View >
                                    <Button borderColor={"white"} borderWidth={ manualServiceMode && ((isA && props.isACurrentlyServing) || (!isA && !props.isACurrentlyServing)) ? 2 : null} disabled={!manualServiceMode}
                                        onPress={() => {
                                            if (isA) {
                                                setServerManually(props.matchID, true)
                                            }
                                            else {
                                                setServerManually(props.matchID, false)
                                            }
                                        }}
                                        backgroundColor={manualServiceMode ? null : "transparent"}>
                                        <AntDesign name={isOnLeft ? "caretleft" : "caretright"} size={24} color={openScoreboardButtonTextColor} />

                                    </Button>
                                </View>
                            </View>
                            : null
                    }

                    <View justifyContent={"center"} alignItems="center" padding={1} position={"absolute"} right={isOnLeft ? null : 0} left={isOnLeft ? 0 : null} bottom={0} top={0}>
                        <View borderRadius={2} backgroundColor="white">
                            <Text fontWeight={"bold"} fontSize={"3xl"}>{isA ? getMatchScore(props).a : getMatchScore(props).b}</Text>
                        </View>

                    </View>
                </View>

                <View paddingLeft={isOnLeft ? 1 : 8} paddingRight={isOnLeft ? 8 : 1} flex={5}>
                    <Button disabled={loadingMinusPoint || loadingAddPoint}
                        onPress={async () => {

                            setLoadingMinusPoint(true)
                            let gameNumber = getCurrentGameNumber(props)
                            if (props.isA) {
                                let newAScore = await MinusPoint(props.matchID, getCurrentGameNumber(props), "A")
                                await updateService(props.matchID, props.isAInitialServer, gameNumber, newAScore + props[`game${gameNumber}BScore`], props.changeServeEveryXPoints, props.pointsToWinGame, props.sportName, props.scoringType)
                                if(isGamePoint({ ...props, [`game${gameNumber}AScore`]: newAScore }) && isFinalGame({ ...props, [`game${gameNumber}AScore`]: newAScore })){
                                    //Match Point
                                    setIsMatchPoint(props.matchID, true)
                                }
                                else if(isGamePoint({ ...props, [`game${gameNumber}AScore`]: newAScore }) ){
                                    setIsGamePoint(props.matchID, true)
                                }
                                else {
                                   if(props.isGamePoint){
                                    setIsGamePoint(props.matchID, false)
                                   }
                                   if(props.isMatchPoint){
                                    setIsMatchPoint(props.matchID, false)
                                   }
                                }
                            }
                            else {
                                let newBScore = await MinusPoint(props.matchID, getCurrentGameNumber(props), "B")
                                await updateService(props.matchID, props.isAInitialServer, gameNumber, newBScore + props[`game${gameNumber}AScore`], props.changeServeEveryXPoints, props.pointsToWinGame, props.sportName, props.scoringType)
                                if(isGamePoint({ ...props, [`game${gameNumber}BScore`]: newBScore }) && isFinalGame({ ...props, [`game${gameNumber}BScore`]: newBScore })){
                                    //Match Point
                                    setIsMatchPoint(props.matchID, true)
                                }
                                else if(isGamePoint({ ...props, [`game${gameNumber}BScore`]: newBScore }) ){
                                    setIsGamePoint(props.matchID, true)
                                }
                                else {
                                   if(props.isGamePoint){
                                    setIsGamePoint(props.matchID, false)
                                   }
                                   if(props.isMatchPoint){
                                    setIsMatchPoint(props.matchID, false)
                                   }
                                }
                            }

                            setLoadingMinusPoint(false)
                        }}
                        borderStyle={"groove"} borderWidth="4" borderColor={"white"} flex={1}>
                        {
                            loadingMinusPoint ?
                                <Spinner color={openScoreboardButtonTextColor}></Spinner>
                                :
                                <Text color={openScoreboardButtonTextColor} fontWeight={"bold"} fontSize="6xl">-</Text>
                        }

                    </Button>
                </View>
            </View>
        </View>);
}
