import React, { useEffect, useRef, useState } from 'react';
import { Button, Text, View, Modal, Spinner } from 'native-base';
import { openScoreboardButtonTextColor } from "../../openscoreboardtheme";
import { getCurrentGameNumber, setGame2InitialReceiverPlayerField, setGame2InitialServerPlayerField, shouldSelectSecondGameDoublesServicePlayers, startGame, switchSides, updateService } from '../functions/scoring';
import { getPlayerFormatted } from '../functions/players';
import i18n from '../translations/translate';

export function InBetweenGamesModal(props) {

    let [startTime, setStartTime] = useState(new Date());
    let [isTimeUp, setIsTimeUp] = useState(false);
    let gameBreakCounterInterval = useRef();
    let [counter, setCounter] = useState(60);
    let [loadingNewGame, setLoadingNewGame] = useState(false);
    let [selectedGame2ServerPlayerField, setSelectedGame2ServerPlayerField] = useState(props.game2InitialServerPlayerField || "");
    let [selectedGame2ReceiverPlayerField, setSelectedGame2ReceiverPlayerField] = useState(props.game2InitialReceiverPlayerField || "");

    const startCountDownTimer = (startTime) => {
        if (startTime.length === 0) {
            startTime = new Date().toISOString();
        }
        gameBreakCounterInterval.current = setInterval(() => {
            let timeDifference = new Date().getTime() - new Date(startTime).getTime();
            let timeElapsed = Math.floor(timeDifference / 1000);
            let timeLeft = 60 - timeElapsed;
            if (timeLeft < 0) {
                stopCountDownTimer();
                setIsTimeUp(true);
                setCounter(60);
            }
            else {
                setCounter(timeLeft);
            }

        }, 1000);

    };
    const stopCountDownTimer = () => {
        clearInterval(gameBreakCounterInterval.current);
    };


    useEffect(() => {
        let gameNumber = getCurrentGameNumber(props);
        if (props.isOpen === true) {
            startCountDownTimer(props[`game${gameNumber}EndTime`]);
            setSelectedGame2ServerPlayerField(props.game2InitialServerPlayerField || "");
            setSelectedGame2ReceiverPlayerField(props.game2InitialReceiverPlayerField || "");

        }
    }, [props.isOpen]);

    function getDoublesPlayerFieldsForSide(isASide) {
        return isASide ? ["playerA", "playerA2"] : ["playerB", "playerB2"];
    }

    function getPlayerFieldLabel(playerField) {
        switch (playerField) {
            case "playerA":
                return "Player 1A";
            case "playerA2":
                return "Player 2A";
            case "playerB":
                return "Player 1B";
            case "playerB2":
                return "Player 2B";
            default:
                return "Player";
        }
    }

    function getPlayerNameForField(playerField) {
        return getPlayerFormatted(props[playerField]) || getPlayerFieldLabel(playerField);
    }

    function ServicePlayerChoiceButton({ isSelected, label, onPress, sideLabel }) {
        return (
            <Button
                backgroundColor={isSelected ? "blue.700" : "white"}
                borderColor={isSelected ? "blue.700" : "blue.200"}
                borderRadius={8}
                borderWidth={1}
                marginBottom={2}
                minHeight={58}
                onPress={onPress}
                paddingX={2}
                paddingY={2}
                variant={isSelected ? "solid" : "outline"}
                _pressed={{ backgroundColor: isSelected ? "blue.800" : "blue.50" }}
            >
                <View alignItems={"center"} justifyContent={"center"} width={"100%"}>
                    <Text
                        color={isSelected ? "blue.100" : "gray.500"}
                        fontSize={"2xs"}
                        fontWeight={"bold"}
                        marginBottom={1}
                        textAlign={"center"}
                        textTransform={"uppercase"}
                    >
                        {sideLabel}
                    </Text>
                    <Text
                        color={isSelected ? openScoreboardButtonTextColor : "gray.900"}
                        fontSize={"sm"}
                        fontWeight={"bold"}
                        numberOfLines={2}
                        textAlign={"center"}
                    >
                        {label}
                    </Text>
                </View>
            </Button>
        );
    }

    async function startNextGame() {
        clearInterval(gameBreakCounterInterval.current);
        setLoadingNewGame(true);
        let gameNumber = getCurrentGameNumber(props);
        const requiresSecondGameServiceSelection = shouldSelectSecondGameDoublesServicePlayers(props);

        try {
            if (requiresSecondGameServiceSelection) {
                await Promise.all([
                    setGame2InitialServerPlayerField(props.matchID, selectedGame2ServerPlayerField),
                    setGame2InitialReceiverPlayerField(props.matchID, selectedGame2ReceiverPlayerField),
                ]);
            }

            await Promise.all([
                startGame(props.matchID, gameNumber),
                switchSides(props.matchID),
                updateService(props.matchID, props.isAInitialServer, gameNumber, 0, props.changeServeEveryXPoints, props.pointsToWinGame, props.sportName, props.scoringType)
            ]);
            props.onClose();
        }
        finally {
            setLoadingNewGame(false);
        }
    }

    const gameNumber = getCurrentGameNumber(props);
    const requiresSecondGameServiceSelection = shouldSelectSecondGameDoublesServicePlayers(props);
    const game2ServerPlayerFields = getDoublesPlayerFieldsForSide(props.isAInitialServer !== true);
    const game2ReceiverPlayerFields = getDoublesPlayerFieldsForSide(props.isAInitialServer === true);
    const canStartNextGame = !requiresSecondGameServiceSelection ||
        (selectedGame2ServerPlayerField.length > 0 && selectedGame2ReceiverPlayerField.length > 0);

    return (
        <Modal isOpen={props.isOpen}>
            <Modal.Content>
                <Modal.CloseButton></Modal.CloseButton>
                <Modal.Header>{i18n.t("breakTimer")}</Modal.Header>
                <Modal.Body>
                    <View justifyContent={"center"} alignItems="center">
                        {isTimeUp ?
                            <Text fontSize={"9xl"}>{i18n.t("time")}!</Text>
                            :
                            <Text fontSize={"9xl"}>{counter}</Text>}

                    </View>
                    {requiresSecondGameServiceSelection ? (
                        <View
                            backgroundColor={"blue.50"}
                            borderColor={"blue.100"}
                            borderRadius={8}
                            borderWidth={1}
                            marginBottom={3}
                            padding={3}
                        >
                            <Text color={"gray.900"} fontSize={"md"} fontWeight={"bold"} marginBottom={1}>
                                Set game 2 doubles order
                            </Text>
                            <Text color={"gray.600"} fontSize={"xs"} marginBottom={3}>
                                The team that received first now serves. Choose their opening server and the opponent who will receive before starting game 2.
                            </Text>
                            <Text color={"gray.500"} fontSize={"2xs"} fontWeight={"bold"} marginBottom={2} textTransform={"uppercase"}>
                                Opening server
                            </Text>
                            <View flexDirection={"row"} justifyContent={"space-between"} marginBottom={2}>
                                {game2ServerPlayerFields.map((playerField) => (
                                    <View key={`game-2-server-${playerField}`} width={"49%"}>
                                        <ServicePlayerChoiceButton
                                            isSelected={selectedGame2ServerPlayerField === playerField}
                                            label={getPlayerNameForField(playerField)}
                                            onPress={() => setSelectedGame2ServerPlayerField(playerField)}
                                            sideLabel={getPlayerFieldLabel(playerField)}
                                        />
                                    </View>
                                ))}
                            </View>
                            <Text color={"gray.500"} fontSize={"2xs"} fontWeight={"bold"} marginBottom={2} textTransform={"uppercase"}>
                                Opening receiver
                            </Text>
                            <View flexDirection={"row"} justifyContent={"space-between"}>
                                {game2ReceiverPlayerFields.map((playerField) => (
                                    <View key={`game-2-receiver-${playerField}`} width={"49%"}>
                                        <ServicePlayerChoiceButton
                                            isSelected={selectedGame2ReceiverPlayerField === playerField}
                                            label={getPlayerNameForField(playerField)}
                                            onPress={() => setSelectedGame2ReceiverPlayerField(playerField)}
                                            sideLabel={getPlayerFieldLabel(playerField)}
                                        />
                                    </View>
                                ))}
                            </View>
                        </View>
                    ) : null}
                    <View>
                        <Button
                            disabled={loadingNewGame || !canStartNextGame}
                            opacity={canStartNextGame ? 1 : 0.6}
                            onPress={startNextGame}
                        >
                            {loadingNewGame ?
                                <Spinner color={openScoreboardButtonTextColor}></Spinner>
                                : <Text color={openScoreboardButtonTextColor}>{i18n.t("startGame")} {gameNumber}</Text>}
                        </Button>
                    </View>
                </Modal.Body>

            </Modal.Content>
        </Modal>
    );
}
