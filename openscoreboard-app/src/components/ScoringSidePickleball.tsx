import React, { useEffect, useRef, useState } from 'react';
import { Pressable } from 'react-native';
import { Spinner, Text, View } from 'native-base';
import { openScoreboardButtonTextColor, openScoreboardColor } from "../../openscoreboardtheme";
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { getPlayerFormatted } from '../functions/players';
import { AddPoint, AWonRally_PB, BWonRally_PB, getCurrentGameNumber, getMatchScore, isFinalGame, isGameFinished, isGamePoint, MinusPoint, setIsGamePoint, setIsMatchPoint, setServerManually } from '../functions/scoring';
import i18n from '../translations/translate';
import { ScoringGradientButton } from './ScoringGradientButton';

export function ScoringSidePickleball(props) {


    let [loadingAddPoint, setLoadingAddPoint] = useState(false)
    let [loadingMinusPoint, setLoadingMinusPoint] = useState(false)
    let [manualServiceMode, setManualServiceMode] = useState(false)
    const rallyActionInFlight = useRef(false)

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

    async function handleRallyWon() {
        if (rallyActionInFlight.current) {
            return
        }

        rallyActionInFlight.current = true
        let gameNumber = getCurrentGameNumber(props)
        const shouldAutoUpdateService = !props.isManualServiceMode
        const servicePlayers = {
            currentReceiverPlayerField: props.currentReceiverPlayerField,
            currentServerPlayerField: props.currentServerPlayerField,
        }
        try {
            if (props.isA) {
                let newAScore = await AWonRally_PB(props.matchID, gameNumber, props.isACurrentlyServing, props.isSecondServer, props.isDoubles, props.scoringType === "rally", props.pointsToWinGame, props[`game${gameNumber}AScore`], shouldAutoUpdateService, servicePlayers)
                if (newAScore) {
                    let isGameDone = isGameFinished(props.enforceGameScore, newAScore, props[`game${gameNumber}BScore`], props.pointsToWinGame)
                    if (isGameDone) {
                        props.openGameWonConfirmationModal()
                    }
                    if (isGamePoint({ ...props, [`game${gameNumber}AScore`]: newAScore }) && isFinalGame({ ...props, [`game${gameNumber}AScore`]: newAScore })) {
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
                let newBScore = await BWonRally_PB(props.matchID, gameNumber, props.isACurrentlyServing, props.isSecondServer, props.isDoubles, props.scoringType === "rally", props.pointsToWinGame, props[`game${gameNumber}BScore`], shouldAutoUpdateService, servicePlayers)

                if (newBScore) {
                    let isGameDone = isGameFinished(props.enforceGameScore, props[`game${gameNumber}AScore`], newBScore, props.pointsToWinGame)
                    if (isGameDone) {
                        props.openGameWonConfirmationModal()
                    }
                    if (isGamePoint({ ...props, [`game${gameNumber}BScore`]: newBScore }) && isFinalGame({ ...props, [`game${gameNumber}BScore`]: newBScore })) {
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
        }
        finally {
            rallyActionInFlight.current = false
        }
    }

    async function handleManualAddPoint() {
        let gameNumber = getCurrentGameNumber(props)

        setLoadingAddPoint(true)
        if (props.isA) {
            let newAScore = await AddPoint(props.matchID, gameNumber, "A")

            let isGameDone = isGameFinished(props.enforceGameScore, newAScore, props[`game${gameNumber}BScore`], props.pointsToWinGame)
            if (isGameDone) {
                props.openGameWonConfirmationModal()
            }
            if (isGamePoint({ ...props, [`game${gameNumber}AScore`]: newAScore }) && isFinalGame({ ...props, [`game${gameNumber}AScore`]: newAScore })) {
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
    }

    async function handleManualMinusPoint() {
        setLoadingMinusPoint(true)
        let gameNumber = getCurrentGameNumber(props)
        if (props.isA) {
            let newAScore = await MinusPoint(props.matchID, getCurrentGameNumber(props), "A")
            if (isGamePoint({ ...props, [`game${gameNumber}AScore`]: newAScore }) && isFinalGame({ ...props, [`game${gameNumber}AScore`]: newAScore })) {
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
            if (isGamePoint({ ...props, [`game${gameNumber}BScore`]: newBScore }) && isFinalGame({ ...props, [`game${gameNumber}BScore`]: newBScore })) {
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
    }

    const gameNumber = getCurrentGameNumber(props);
    const currentScore = props[`game${gameNumber}${isA ? "A" : "B"}Score`];
    const isDoubles = props.isDoubles === true;
    const isSideCurrentlyServing = (isA && props.isACurrentlyServing) || (!isA && !props.isACurrentlyServing);
    const isServingSide = manualServiceMode || isSideCurrentlyServing;
    const activeServerNumber = isDoubles && props.isSecondServer ? 2 : 1;

    function RoleBadge({ label, variant }) {
        const isServer = variant === "server";

        return (
            <View
                alignItems={"center"}
                backgroundColor={isServer ? "white" : "blue.100"}
                borderColor={isServer ? "white" : "blue.200"}
                borderRadius={999}
                borderWidth={1}
                height={18}
                justifyContent={"center"}
                marginRight={1}
                minWidth={18}
                paddingX={1}
            >
                <Text color={isServer ? openScoreboardColor : "blue.800"} fontSize={"2xs"} fontWeight={"bold"} lineHeight={"xs"}>
                    {label}
                </Text>
            </View>
        );
    }

    function renderPlayerNameContent(player, playerField) {
        const isServer = props.isDoubles === true && props.currentServerPlayerField === playerField;
        const isReceiver = props.isDoubles === true && props.currentReceiverPlayerField === playerField;

        return (
            <View alignItems={"center"} flexDirection={"row"} justifyContent={"center"} width={"100%"}>
                {isServer ? <RoleBadge label={"S"} variant={"server"} /> : null}
                {isReceiver ? <RoleBadge label={"R"} variant={"receiver"} /> : null}
                <Text color={openScoreboardButtonTextColor} flexShrink={1} fontWeight={"bold"} numberOfLines={1}>
                    {showPlayerName(player)}
                </Text>
            </View>
        );
    }

    function renderServerButtons() {
        const serverNumbers = isDoubles ? [1, 2] : [1];

        return (
            <View
                alignItems={"center"}
                flexDirection={"row"}
                justifyContent={"center"}
                opacity={isServingSide ? 1 : 0}
            >
                {serverNumbers.map((serverNumber, index) => {
                    const isActiveServerButton = isSideCurrentlyServing && activeServerNumber === serverNumber;
                    const serverButtonStyle = {
                        height: 42,
                        minHeight: 42,
                        minWidth: isDoubles ? 56 : 92,
                    };

                    return (
                        <View
                            key={`server-${serverNumber}`}
                            marginLeft={index === 0 ? 0 : 1}
	                            marginRight={index === serverNumbers.length - 1 ? 0 : 1}
                        >
                            {isActiveServerButton ? (
                                <ScoringGradientButton
                                    borderColor={"white"}
                                    borderRadius={8}
                                    borderWidth={2}
                                    disabled={!manualServiceMode}
                                    disabledOpacity={1}
                                    onPress={() => {
                                        setServerManually(props.matchID, isA, isDoubles && serverNumber === 2)
                                    }}
                                    style={serverButtonStyle}
                                    contentStyle={{ paddingHorizontal: 8, paddingVertical: 2 }}
                                >
                                    <MaterialCommunityIcons name={`numeric-${serverNumber}-circle`} size={28} color={openScoreboardButtonTextColor} />
                                </ScoringGradientButton>
                            ) : (
                                <Pressable
                                    accessibilityRole={"button"}
                                    disabled={!manualServiceMode}
                                    onPress={() => {
                                        setServerManually(props.matchID, isA, isDoubles && serverNumber === 2)
                                    }}
                                    style={({ pressed }) => ({
                                        alignItems: "center",
                                        backgroundColor: pressed && manualServiceMode ? "#DBEAFE" : "#F8FAFC",
                                        borderColor: "#0B1F4D",
                                        borderRadius: 8,
                                        borderWidth: 2,
                                        justifyContent: "center",
                                        opacity: manualServiceMode ? 1 : 0.72,
                                        shadowColor: "#020617",
                                        shadowOffset: { height: 1, width: 0 },
                                        shadowOpacity: 0.12,
                                        shadowRadius: 3,
                                        ...serverButtonStyle,
                                    })}
                                >
                                    <MaterialCommunityIcons name={`numeric-${serverNumber}-circle-outline`} size={28} color={"#0B1F4D"} />
                                </Pressable>
                            )}
                        </View>
                    );
                })}
            </View>
        );
    }



    return (
        <View height={"100%"} minHeight={0} flex={1} flexDirection={"row"} backgroundColor={"gray.900"}>
            <View height={"100%"} minHeight={0} flex={1} padding={2} backgroundColor={isA ? getBackgroundColor(playerA) : getBackgroundColor(playerB)}>
                <View flexShrink={0} display={"flex"} justifyContent={"center"} flexDir={"row"} flexWrap={"wrap"}>
                    <View minWidth={150} maxWidth={300} flex={1} padding={1}>
                        <ScoringGradientButton
                            disabled={props.lockPlayerEditing === true}
                            onPress={() => {
                                if (props.isA) {
                                    props.openPlayerModal("playerA");
                                }
                                else {
                                    props.openPlayerModal("playerB");
                                }
                            }}
                            borderColor={"white"}
                            borderRadius={8}
                            borderWidth={1}
                            style={{ minHeight: 46 }}
                            contentStyle={{ paddingHorizontal: 8, paddingVertical: 4 }}
                        >
                            {renderPlayerNameContent(isA ? playerA : playerB, isA ? "playerA" : "playerB")}
                        </ScoringGradientButton>
                    </View>
                    <View minWidth={150} maxWidth={300} flex={1} padding={1}>
                        {props.isDoubles === true ?
                            <ScoringGradientButton
                                disabled={props.lockPlayerEditing === true}
                                onPress={() => {
                                    if (props.isA) {
                                        props.openPlayerModal("playerA2");
                                    }
                                    else {
                                        props.openPlayerModal("playerB2");
                                    }
                                }}
                                borderColor={"white"}
                                borderRadius={8}
                                borderWidth={1}
                                style={{ minHeight: 46 }}
                                contentStyle={{ paddingHorizontal: 8, paddingVertical: 4 }}
                            >
                                {renderPlayerNameContent(isA ? playerA2 : playerB2, isA ? "playerA2" : "playerB2")}
                            </ScoringGradientButton>
                            : null}
                    </View>
                </View>

                <View flexShrink={0} w={"100%"} justifyContent={"center"} alignItems="center" padding={1}>
                    <View alignItems={"center"} paddingLeft={4} paddingRight={4} paddingY={1} borderRadius={8} backgroundColor="white">
                        <Text color={"gray.500"} fontSize={"2xs"} fontWeight={"bold"}>Match</Text>
                        <Text color={"gray.900"} fontWeight={"bold"} fontSize={"2xl"}>{isA ? getMatchScore(props).a : getMatchScore(props).b}</Text>
                    </View>
                </View>

                <View flexShrink={0} padding={1} flexDirection={"row"} alignItems={"center"}>
                    <View flex={1} marginRight={1}>
                        <ScoringGradientButton
                            disabled={loadingAddPoint || loadingMinusPoint}
                            onPress={handleManualAddPoint}
                            borderColor={"white"}
                            borderRadius={10}
                            borderWidth={1}
                            style={{ minHeight: 68 }}
                            contentStyle={{ minHeight: 68, paddingHorizontal: 0, paddingVertical: 0 }}
                        >
                            {
                                loadingAddPoint ?
                                    <Spinner color={openScoreboardButtonTextColor} />
                                    :
                                    <Ionicons name="add-circle-outline" size={42} color={openScoreboardButtonTextColor} />
                            }
                        </ScoringGradientButton>
                    </View>

                    <View alignItems={"center"} justifyContent={"center"} marginX={1}>
                        <View
                            alignItems={"center"}
                            backgroundColor={"white"}
                            borderColor={"gray.200"}
                            borderRadius={10}
                            borderWidth={1}
                            justifyContent={"center"}
                            minWidth={84}
                            paddingX={3}
                            style={{ height: 74 }}
                        >
                            <Text color={"gray.900"} fontWeight={"bold"} style={{ fontSize: 48, lineHeight: 52, textAlign: "center" }}>{currentScore}</Text>
                        </View>
                    </View>

                    <View flex={1} marginLeft={1}>
                        <ScoringGradientButton
                            disabled={loadingMinusPoint || loadingAddPoint}
                            onPress={handleManualMinusPoint}
                            borderColor={"white"}
                            borderRadius={10}
                            borderWidth={1}
                            style={{ minHeight: 68 }}
                            contentStyle={{ minHeight: 68, paddingHorizontal: 0, paddingVertical: 0 }}
                        >
                            {
                                loadingMinusPoint ?
                                    <Spinner color={openScoreboardButtonTextColor} />
                                    :
                                    <Ionicons name="remove-circle-outline" size={42} color={openScoreboardButtonTextColor} />
                            }
                        </ScoringGradientButton>
                    </View>
                </View>

                <View flexShrink={0} alignItems={"center"} justifyContent={"center"} paddingY={1} style={{ minHeight: 52 }}>
                    {renderServerButtons()}
                </View>

                <View flex={1} minHeight={0} paddingLeft={2} paddingRight={2} paddingTop={1} paddingBottom={2}>
                    <ScoringGradientButton
                        onPress={handleRallyWon}
                        borderColor={"white"}
                        borderRadius={10}
                        borderWidth={1}
                        style={{ flex: 1, minHeight: 120 }}
                    >
                        {loadingAddPoint ? (
                            <Spinner color={openScoreboardButtonTextColor} />
                        ) : (
                            <>
                                <Text color={openScoreboardButtonTextColor} fontSize={"2xl"} flexWrap={"wrap"} fontWeight={"bold"} textAlign={"center"}>{i18n.t("rally")}</Text>
                                <Text color={openScoreboardButtonTextColor} fontSize={"2xl"} flexWrap={"wrap"} fontWeight={"bold"} textAlign={"center"}>{i18n.t("won")}</Text>
                            </>
                        )}
                    </ScoringGradientButton>
                </View>
            </View>
        </View>);
}
