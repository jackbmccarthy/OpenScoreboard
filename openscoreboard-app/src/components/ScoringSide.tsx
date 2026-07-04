import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, useWindowDimensions } from 'react-native';
import { Button, Text, View } from 'native-base';
import { openScoreboardButtonTextColor, openScoreboardColor } from "../../openscoreboardtheme";
import { Ionicons, AntDesign } from '@expo/vector-icons';
import { getPlayerFormatted } from '../functions/players';
import { AddPoint, getCurrentGameNumber, getMatchScore, isFinalGame, isGameFinished, isGamePoint, MinusPoint, setIsGamePoint, setisManualMode, setIsMatchPoint, setServerManually, updateService } from '../functions/scoring';
import { ScoringGradientButton } from './ScoringGradientButton';

function ServicePulseBorder({ active, height, width }) {
    const outwardOne = useRef(new Animated.Value(0)).current;
    const outwardTwo = useRef(new Animated.Value(0)).current;
    const outwardThree = useRef(new Animated.Value(0)).current;
    const inward = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (!active) {
            return;
        }

        const createRipple = (value, delay = 0) => {
            value.setValue(0);
            return Animated.loop(
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.timing(value, {
                        duration: 1100,
                        easing: Easing.out(Easing.cubic),
                        toValue: 1,
                        useNativeDriver: true,
                    }),
                    Animated.timing(value, {
                        duration: 1,
                        toValue: 0,
                        useNativeDriver: true,
                    }),
                ])
            );
        };

        inward.setValue(0);
        const animations = [
            createRipple(outwardOne, 0),
            createRipple(outwardTwo, 260),
            createRipple(outwardThree, 520),
            Animated.loop(
                Animated.sequence([
                    Animated.timing(inward, {
                        duration: 850,
                        easing: Easing.inOut(Easing.quad),
                        toValue: 1,
                        useNativeDriver: true,
                    }),
                    Animated.timing(inward, {
                        duration: 1,
                        toValue: 0,
                        useNativeDriver: true,
                    }),
                ])
            ),
        ];

        animations.forEach(animation => animation.start());

        return () => {
            animations.forEach(animation => animation.stop());
        };
    }, [active, outwardOne, outwardTwo, outwardThree, inward]);

    if (!active) {
        return null;
    }

    const lightColor = "#ffffff";
    const outerRippleStyle = (value, maxScale) => ({
        opacity: value.interpolate({
            inputRange: [0, 0.22, 1],
            outputRange: [0.95, 0.75, 0],
        }),
        transform: [{
            scale: value.interpolate({
                inputRange: [0, 1],
                outputRange: [1, maxScale],
            }),
        }],
    });
    const inwardOpacity = inward.interpolate({
        inputRange: [0, 0.25, 1],
        outputRange: [0.15, 0.9, 0.15],
    });
    const inwardScale = inward.interpolate({
        inputRange: [0, 1],
        outputRange: [1.34, 0.72],
    });
    const ringBase = {
        borderColor: lightColor,
        borderRadius: 10,
        borderWidth: 3,
        height,
        position: "absolute" as const,
        shadowColor: lightColor,
        shadowOffset: { height: 0, width: 0 },
        shadowOpacity: 0.95,
        shadowRadius: 10,
        width,
    };

    return (
        <View pointerEvents={"none"} style={{ alignItems: "center", height, justifyContent: "center", left: 0, position: "absolute", top: 0, width }}>
            <View
                style={{
                    backgroundColor: "rgba(0, 0, 0, 0.55)",
                    borderRadius: 12,
                    height: height + 12,
                    position: "absolute",
                    width: width + 12,
                }}
            />
            <Animated.View style={[ringBase, outerRippleStyle(outwardOne, 1.7)]} />
            <Animated.View style={[ringBase, outerRippleStyle(outwardTwo, 1.48)]} />
            <Animated.View style={[ringBase, outerRippleStyle(outwardThree, 1.28)]} />
            <Animated.View
                style={[
                    ringBase,
                    {
                        borderWidth: 2,
                        opacity: inwardOpacity,
                        transform: [{ scale: inwardScale }],
                    },
                ]}
            />
        </View>
    );
}

export function ScoringSide(props) {

    const loadingAddPoint = useRef(false)
    const loadingMinusPoint = useRef(false)
    let [manualServiceMode, setManualServiceMode] = useState(false)
    const { height, width } = useWindowDimensions();
    const isCompact = width < 480 || height < 720;
    const isTiny = width < 380 || height < 640;
    const isPortraitPhone = width < 480 && height > width;
    const sidePadding = isTiny ? 1 : isCompact ? 1 : 2;
    const playerButtonHeight = isTiny ? 30 : isCompact ? 34 : 46;
    const playerFontSize = isCompact ? "xs" : "md";
    const scoreFontSize = isTiny ? 58 : isPortraitPhone ? 64 : isCompact ? 48 : 58;
    const matchScoreFontSize = isTiny ? 30 : isPortraitPhone ? 34 : isCompact ? 28 : 38;
    const matchLabelFontSize = isCompact ? 9 : 12;
    const pointIconSize = isTiny ? 24 : isPortraitPhone ? 28 : isCompact ? 32 : 48;
    const minusPointIconSize = isTiny ? 23 : isCompact ? 28 : 42;
    const pointLabelFontSize = isCompact ? "2xs" : "xs";
    const sideOffset = isTiny ? 1 : isCompact ? 2 : 7;
    const pointButtonRadius = isCompact ? 8 : 10;
    const currentScoreWidth = isTiny ? 84 : isPortraitPhone ? 92 : isCompact ? 78 : 112;
    const currentScoreHeight = isTiny ? 68 : isPortraitPhone ? 74 : isCompact ? 56 : 74;
    const matchBadgeWidth = isTiny ? 48 : isPortraitPhone ? 54 : isCompact ? 50 : 96;
    const matchBadgeHeight = isTiny ? 54 : isPortraitPhone ? 60 : isCompact ? 46 : 68;
    const serviceSlotWidth = isTiny ? 30 : isPortraitPhone ? 34 : isCompact ? 40 : 80;
    const serviceButtonWidth = isTiny ? 28 : isPortraitPhone ? 32 : isCompact ? 34 : 64;
    const serviceButtonHeight = isTiny ? 32 : isPortraitPhone ? 34 : isCompact ? 36 : 54;
    const serviceIconSize = isTiny ? 14 : isCompact ? 16 : 20;
    const centerRowMinHeight = isTiny ? 76 : isPortraitPhone ? 82 : isCompact ? 62 : 82;
    const addPointFlex = isTiny ? 0.82 : isPortraitPhone ? 0.9 : isCompact ? 1 : 0.95;
    const minusPointFlex = isTiny ? 0.68 : isCompact ? 0.72 : 0.86;


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

    function RoleBadge({ label, variant }) {
        const isServer = variant === "server";
        const badgeSize = isCompact ? 14 : 16;

        return (
            <View
                alignItems={"center"}
                backgroundColor={isServer ? "white" : "blue.100"}
                borderColor={isServer ? "white" : "blue.200"}
                borderWidth={1}
                justifyContent={"center"}
                marginRight={1}
                style={{
                    borderRadius: badgeSize / 2,
                    height: badgeSize,
                    minWidth: badgeSize,
                    paddingHorizontal: 3,
                }}
            >
                <Text
                    color={isServer ? openScoreboardColor : "blue.800"}
                    fontWeight={"bold"}
                    style={{ fontSize: 8, lineHeight: 10 }}
                >
                    {label}
                </Text>
            </View>
        );
    }

    function renderPlayerNameContent(player, playerField) {
        const hasServicePlayerFields = props.isDoubles === true &&
            `${props.currentServerPlayerField || ""}`.trim().length > 0 &&
            `${props.currentReceiverPlayerField || ""}`.trim().length > 0;
        const isServer = hasServicePlayerFields && props.currentServerPlayerField === playerField;
        const isReceiver = hasServicePlayerFields && props.currentReceiverPlayerField === playerField;

        return (
            <View alignItems={"center"} flexDirection={"row"} justifyContent={"center"} width={"100%"}>
                {isServer ? <RoleBadge label={"S"} variant={"server"} /> : null}
                {isReceiver ? <RoleBadge label={"R"} variant={"receiver"} /> : null}
                <Text color={openScoreboardButtonTextColor} flexShrink={1} fontSize={playerFontSize} fontWeight={"bold"} numberOfLines={1}>
                    {showPlayerName(player)}
                </Text>
            </View>
        );
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

    const isServingSide = props.isManualServiceMode || (isA && props.isACurrentlyServing) || (!isA && !props.isACurrentlyServing);
    const isActiveManualServer = manualServiceMode && ((isA && props.isACurrentlyServing) || (!isA && !props.isACurrentlyServing));

    function renderServiceSlot() {
        const isInactiveManualServer = manualServiceMode && !isActiveManualServer;
        const serviceBackgroundColor = isInactiveManualServer ? "white" : "black";
        const serviceBorderColor = isActiveManualServer ? "white" : isInactiveManualServer ? "black" : "white";
        const serviceIconColor = isInactiveManualServer ? "black" : openScoreboardButtonTextColor;

        return (
            <View alignItems={"center"} justifyContent={"center"} style={{ minWidth: serviceSlotWidth, width: serviceSlotWidth }}>
                {isServingSide ? (
                    <View style={{ height: serviceButtonHeight, position: "relative", width: serviceButtonWidth }}>
                        <ServicePulseBorder active={isActiveManualServer} height={serviceButtonHeight} width={serviceButtonWidth} />
                        {isInactiveManualServer ? (
                            <Button
                                backgroundColor={serviceBackgroundColor}
                                borderColor={serviceBorderColor}
                                borderRadius={8}
                                borderWidth={1}
                                disabled={!manualServiceMode}
                                onPress={() => {
                                    if (isA) {
                                        setServerManually(props.matchID, true)
                                    }
                                    else {
                                        setServerManually(props.matchID, false)
                                    }
                                }}
                                padding={0}
                                style={{
                                    height: serviceButtonHeight,
                                    maxHeight: serviceButtonHeight,
                                    maxWidth: serviceButtonWidth,
                                    minHeight: serviceButtonHeight,
                                    minWidth: serviceButtonWidth,
                                    width: serviceButtonWidth,
                                }}
                                _pressed={{ backgroundColor: "gray.100" }}
                            >
                                <View alignItems={"center"} justifyContent={"center"}>
                                    <AntDesign name={isOnLeft ? "caret-left" : "caret-right"} size={serviceIconSize} color={serviceIconColor} />
                                    {!isCompact ? (
                                        <Text color={serviceIconColor} fontSize={"2xs"} fontWeight={"bold"} marginTop={0.5} lineHeight={"xs"}>Serve</Text>
                                    ) : null}
                                </View>
                            </Button>
                        ) : (
                            <ScoringGradientButton
                                borderColor={serviceBorderColor}
                                borderRadius={8}
                                borderWidth={isActiveManualServer ? 2 : 1}
                                disabled={!manualServiceMode}
                                disabledOpacity={1}
                                onPress={() => {
                                    if (isA) {
                                        setServerManually(props.matchID, true)
                                    }
                                    else {
                                        setServerManually(props.matchID, false)
                                    }
                                }}
                                style={{
                                    height: serviceButtonHeight,
                                    maxHeight: serviceButtonHeight,
                                    maxWidth: serviceButtonWidth,
                                    minHeight: serviceButtonHeight,
                                    minWidth: serviceButtonWidth,
                                    width: serviceButtonWidth,
                                }}
                            >
                                <View alignItems={"center"} justifyContent={"center"}>
                                    <AntDesign name={isOnLeft ? "caret-left" : "caret-right"} size={serviceIconSize} color={serviceIconColor} />
                                    {!isCompact ? (
                                        <Text color={serviceIconColor} fontSize={"2xs"} fontWeight={"bold"} marginTop={0.5} lineHeight={"xs"}>Serve</Text>
                                    ) : null}
                                </View>
                            </ScoringGradientButton>
                        )}
                    </View>
                ) : null}
            </View>
        );
    }

    function renderMatchBadge() {
        return (
            <View alignItems={"center"} justifyContent={"center"} style={{ minWidth: matchBadgeWidth, width: matchBadgeWidth }}>
                <View
                    alignItems={"center"}
                    backgroundColor={"white"}
                    borderRadius={8}
                    justifyContent={"center"}
                    paddingX={0}
                    style={{ height: matchBadgeHeight, width: matchBadgeWidth }}
                >
                    <Text color={"gray.500"} fontWeight={"bold"} style={{ fontSize: matchLabelFontSize, lineHeight: matchLabelFontSize + 3 }}>
                        {isCompact ? "G" : "Games"}
                    </Text>
                    <Text color={"gray.900"} fontWeight={"bold"} style={{ fontSize: matchScoreFontSize, lineHeight: matchScoreFontSize + 4 }}>
                        {isA ? getMatchScore(props).a : getMatchScore(props).b}
                    </Text>
                </View>
            </View>
        );
    }

    function renderCurrentScore() {
        return (
            <View
                alignItems={"center"}
                backgroundColor={"white"}
                borderColor={"gray.200"}
                borderRadius={isCompact ? 8 : 10}
                borderWidth={1}
                justifyContent={"center"}
                style={{ height: currentScoreHeight, width: currentScoreWidth }}
            >
                <Text color={"gray.900"} fontWeight={"bold"} style={{ fontSize: scoreFontSize, lineHeight: scoreFontSize + 4, textAlign: "center" }}>
                    {props[`game${getCurrentGameNumber(props)}${isA ? "A" : "B"}Score`]}
                </Text>
            </View>
        );
    }



    return (
        <View height={"100%"} minHeight={0} flex={1} flexDirection={"row"} backgroundColor={"gray.900"} overflow={"hidden"}>
            <View height={"100%"} minHeight={0} flex={1} padding={sidePadding} backgroundColor={isA ? getBackgroundColor(playerA) : getBackgroundColor(playerB)}>
                <View flexShrink={0}>
                    <View padding={isCompact ? 0.5 : 1}>
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
                            style={{
                                minHeight: playerButtonHeight,
                            }}
                            contentStyle={{
                                paddingHorizontal: 8,
                                paddingVertical: isCompact ? 0 : 4,
                            }}
                        >
                            {renderPlayerNameContent(isA ? playerA : playerB, isA ? "playerA" : "playerB")}
                        </ScoringGradientButton>
                    </View>
                    {props.isDoubles === true ?
                        <View padding={isCompact ? 0.5 : 1}>
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
                                style={{
                                    minHeight: playerButtonHeight,
                                }}
                                contentStyle={{
                                    paddingHorizontal: 8,
                                    paddingVertical: isCompact ? 0 : 4,
                                }}
                            >
                                {renderPlayerNameContent(isA ? playerA2 : playerB2, isA ? "playerA2" : "playerB2")}
                            </ScoringGradientButton>
                        </View>
                        : null}

                </View>

                <View paddingLeft={isOnLeft ? 1 : sideOffset} paddingRight={isOnLeft ? sideOffset : 1} flex={addPointFlex} minHeight={0} paddingY={isCompact ? 1 : 2}>
                    <ScoringGradientButton
                        onPress={async () => {
                            if (loadingAddPoint.current || loadingMinusPoint.current) {
                                return
                            }
                            let gameNumber = getCurrentGameNumber(props)
                            loadingAddPoint.current = true
                            try {
                                if (props.isA) {
                                    let newAScore = await AddPoint(props.matchID, gameNumber, "A")
                                    if (!manualServiceMode) {
                                        await updateService(props.matchID, props.isAInitialServer, gameNumber, newAScore + props[`game${gameNumber}BScore`], props.changeServeEveryXPoints, props.pointsToWinGame, props.sportName, props.scoringType)
                                    }
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
                                    if (!manualServiceMode) {
                                        await updateService(props.matchID, props.isAInitialServer, gameNumber, newBScore + props[`game${gameNumber}AScore`], props.changeServeEveryXPoints, props.pointsToWinGame, props.sportName, props.scoringType)
                                    }
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
                            finally {
                                loadingAddPoint.current = false
                            }
                        }}
                        borderRadius={pointButtonRadius}
                        borderWidth={1}
                        borderColor={"white"}
                        style={{
                            flex: 1,
                            minHeight: 0,
                        }}
                    >
                        <View alignItems={"center"} justifyContent={"center"}>
                            <Ionicons name="add-circle-outline" size={pointIconSize} color={openScoreboardButtonTextColor} />
                            <Text color={openScoreboardButtonTextColor} fontSize={pointLabelFontSize} fontWeight={"bold"} marginTop={isCompact ? 0 : 1} textTransform={"uppercase"}>
                                Point
                            </Text>
                        </View>

                    </ScoringGradientButton>
                </View>
                <View flexShrink={0}>
                    <View
                        alignItems={"center"}
                        flexDirection={"row"}
                        justifyContent={"space-between"}
                        paddingX={isTiny ? 0 : isCompact ? 0.5 : 1}
                        paddingY={isCompact ? 0.5 : 1}
                        style={{ minHeight: centerRowMinHeight }}
                        width={"100%"}
                    >
                        {isOnLeft ? renderMatchBadge() : renderServiceSlot()}
                        {renderCurrentScore()}
                        {isOnLeft ? renderServiceSlot() : renderMatchBadge()}
                    </View>
                </View>

                <View paddingLeft={isOnLeft ? 1 : sideOffset} paddingRight={isOnLeft ? sideOffset : 1} flex={minusPointFlex} minHeight={0} paddingY={isCompact ? 1 : 2}>
                    <ScoringGradientButton
                        onPress={async () => {

                            if (loadingAddPoint.current || loadingMinusPoint.current) {
                                return
                            }

                            loadingMinusPoint.current = true
                            let gameNumber = getCurrentGameNumber(props)
                            try {
                                if (props.isA) {
                                    let newAScore = await MinusPoint(props.matchID, getCurrentGameNumber(props), "A")
                                    await updateService(props.matchID, props.isAInitialServer, gameNumber, newAScore + props[`game${gameNumber}BScore`], props.changeServeEveryXPoints, props.pointsToWinGame, props.sportName, props.scoringType)
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
                                    await updateService(props.matchID, props.isAInitialServer, gameNumber, newBScore + props[`game${gameNumber}AScore`], props.changeServeEveryXPoints, props.pointsToWinGame, props.sportName, props.scoringType)
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
                            finally {
                                loadingMinusPoint.current = false
                            }
                        }}
                        borderRadius={pointButtonRadius}
                        borderWidth={1}
                        borderColor={"white"}
                        style={{
                            flex: 1,
                            minHeight: 0,
                        }}
                    >
                        <View alignItems={"center"} justifyContent={"center"}>
                            <Ionicons name="remove-circle-outline" size={minusPointIconSize} color={openScoreboardButtonTextColor} />
                            <Text color={openScoreboardButtonTextColor} fontSize={pointLabelFontSize} fontWeight={"bold"} marginTop={isCompact ? 0 : 1} textTransform={"uppercase"}>
                                Point
                            </Text>
                        </View>

                    </ScoringGradientButton>
                </View>
            </View>
        </View>);
}
