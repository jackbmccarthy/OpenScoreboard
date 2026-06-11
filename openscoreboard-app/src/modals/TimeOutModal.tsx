import React, { useEffect, useRef, useState } from 'react';
import { Text, View, Modal } from 'native-base';
import { openScoreboardButtonTextColor, openScoreboardColor } from "../../openscoreboardtheme";
import { resetUsedTimeOut, setUsedTimeOut, startTimeOut } from '../functions/scoring';
import { getCombinedPlayerNames } from '../functions/players';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import i18n from '../translations/translate';
import { ScoringModalHeader, ScoringModalSection, ScoringPrimaryButton, ScoringSecondaryButton } from '../components/ScoringModalComponents';

function TimeoutSideCard({ isUsed, name, onReset, onStart }) {
    return (
        <View
            backgroundColor={"white"}
            borderColor={"#E5E7EB"}
            borderRadius={12}
            borderWidth={1}
            marginBottom={3}
            padding={3}
        >
            <View alignItems={"center"} flexDirection={"row"} justifyContent={"space-between"} marginBottom={3}>
                <View flex={1} paddingRight={3}>
                    <Text color={"gray.900"} fontSize={"md"} fontWeight={"bold"} numberOfLines={1}>{name}</Text>
                    <Text color={"gray.500"} fontSize={"xs"} marginTop={0.5}>{isUsed ? "Timeout has already been used." : "One 60 second timeout is available."}</Text>
                </View>
                <View backgroundColor={isUsed ? "gray.100" : "blue.50"} borderRadius={999} paddingX={3} paddingY={1}>
                    <Text color={isUsed ? "gray.600" : "blue.700"} fontSize={"2xs"} fontWeight={"bold"}>{isUsed ? "USED" : "AVAILABLE"}</Text>
                </View>
            </View>
            <View flexDirection={"row"}>
                <View flex={1} paddingRight={isUsed ? 1 : 0}>
                    <ScoringPrimaryButton disabled={isUsed} onPress={onStart}>
                        <Text color={openScoreboardButtonTextColor} fontWeight={"bold"}>{isUsed ? i18n.t("timeOutUsed") : i18n.t("startTimeOut")}</Text>
                    </ScoringPrimaryButton>
                </View>
                {isUsed ? (
                    <View paddingLeft={1}>
                        <ScoringSecondaryButton onPress={onReset}>
                            <FontAwesome color={openScoreboardColor} size={18} name="refresh" />
                        </ScoringSecondaryButton>
                    </View>
                ) : null}
            </View>
        </View>
    );
}

export function TimeOutModal(props) {
    const { playerA, playerB, playerA2, playerB2 } = props;
    let [showTimer, setShowTimer] = useState(false);
    let [secondsLeft, setSecondsLeft] = useState(60);
    let [showTimeOutConfirmation, setShowTimeOutConfirmation] = useState(false);
    let [isATimeOutSelected, setIsATimeOutSelected] = useState(false);

    let [ATimeOutUsed, setATimeOutUsed] = useState(props.isATimeOutUsed);
    let [BTimeOutUsed, setBTimeOutUsed] = useState(props.isBTimeOutUsed);
    let intervalID = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        setATimeOutUsed(props.isATimeOutUsed);
        setBTimeOutUsed(props.isBTimeOutUsed);
    }, [props.isATimeOutUsed, props.isBTimeOutUsed]);

    useEffect(() => {
        return () => {
            stopCountDownTimer();
        };
    }, []);


    const startCountDownTimer = (startTime) => {
        intervalID.current = setInterval(() => {
            let timeDifference = new Date().getTime() - new Date(startTime).getTime();
            let timeElapsed = Math.floor(timeDifference / 1000);
            let timeLeft = 60 - timeElapsed;
            if (timeLeft < 0) {
                stopCountDownTimer();
                if (isATimeOutSelected) {
                    setUsedTimeOut(props.matchID, "A");
                }
                else {
                    setUsedTimeOut(props.matchID, "B");
                }
            }
            else {
                setSecondsLeft(timeLeft);
            }

        }, 1000);

    };
    const stopCountDownTimer = () => {
        if (intervalID.current) {
            clearInterval(intervalID.current);
        }
    };

    return (
        <Modal onClose={() => { props.onClose(); }} isOpen={props.isOpen}>
            <Modal.Content maxW={520} width={"92%"}>
                <Modal.CloseButton />
                <Modal.Header>
                    <ScoringModalHeader
                        title={showTimeOutConfirmation ? i18n.t("confirmTimeOut") : "Timeouts"}
                        description={"Start a 60 second timeout, track the countdown, or reset a used timeout if needed."}
                    />
                </Modal.Header>
                <Modal.Body backgroundColor={"gray.50"}>
                    {showTimer ?
                        <ScoringModalSection title={"Timeout in progress"} description={isATimeOutSelected ? getCombinedPlayerNames(playerA, playerB, playerA2, playerB2).a : getCombinedPlayerNames(playerA, playerB, playerA2, playerB2).b}>
                            <View alignItems={"center"} paddingY={2}>
                                <View alignItems={"center"} backgroundColor={"gray.900"} borderRadius={20} justifyContent={"center"} minHeight={150} width={"100%"}>
                                    <Text color={"white"} fontSize={"8xl"} fontWeight={"bold"} textAlign={"center"}>{secondsLeft}</Text>
                                    <Text color={"gray.300"} fontSize={"sm"} fontWeight={"bold"} marginTop={1} textTransform={"uppercase"}>seconds left</Text>
                                </View>
                            </View>
                            <ScoringPrimaryButton onPress={() => {
                                    props.onClose();
                                    setUsedTimeOut(props.matchID, isATimeOutSelected ? "A" : "B");
                                    setShowTimeOutConfirmation(false);
                                    setShowTimer(false);
                                }}>
                                <Text color={openScoreboardButtonTextColor} fontWeight={"bold"}>{i18n.t("endTimeOut")}</Text>
                            </ScoringPrimaryButton>
                        </ScoringModalSection>
                        :
                        showTimeOutConfirmation ?
                            <ScoringModalSection
                                title={isATimeOutSelected ? getCombinedPlayerNames(playerA, playerB, playerA2, playerB2).a : getCombinedPlayerNames(playerA, playerB, playerA2, playerB2).b}
                                description={"Confirming will start the live timeout timer immediately."}
                            >
                                <View alignItems={"center"} backgroundColor={"blue.50"} borderRadius={12} flexDirection={"row"} marginBottom={3} padding={3}>
                                    <MaterialIcons name="timer" size={24} color={openScoreboardColor} />
                                    <Text color={"blue.900"} flex={1} fontSize={"sm"} marginLeft={3}>This timeout lasts 60 seconds and will be marked used when it ends.</Text>
                                </View>
                                <View flexDir={"row"}>
                                    <View flex={1} paddingRight={1}>
                                        <ScoringPrimaryButton
                                            onPress={() => {
                                                setShowTimer(true);
                                                startCountDownTimer(new Date().toISOString());
                                                startTimeOut(props.matchID, isATimeOutSelected ? "A" : "B");
                                            }}
                                        >
                                            <Text color={openScoreboardButtonTextColor} fontWeight={"bold"}>{i18n.t("confirm")}</Text>
                                        </ScoringPrimaryButton>
                                    </View>
                                    <View flex={1} paddingLeft={1}>
                                        <ScoringSecondaryButton
                                            onPress={() => {
                                                setShowTimeOutConfirmation(false);
                                            }}
                                        >
                                            <Text color={openScoreboardColor} fontWeight={"bold"}>{i18n.t("back")}</Text>
                                        </ScoringSecondaryButton>
                                    </View>
                                </View>
                            </ScoringModalSection>
                            :
                            <View>
                                <TimeoutSideCard
                                    isUsed={ATimeOutUsed}
                                    name={getCombinedPlayerNames(playerA, playerB, playerA2, playerB2).a}
                                    onReset={async () => {
                                        await resetUsedTimeOut(props.matchID, "A")
                                        setATimeOutUsed(false)
                                    }}
                                    onStart={() => {
                                        setIsATimeOutSelected(true);
                                        setShowTimeOutConfirmation(true);
                                    }}
                                />
                                <TimeoutSideCard
                                    isUsed={BTimeOutUsed}
                                    name={getCombinedPlayerNames(playerA, playerB, playerA2, playerB2).b}
                                    onReset={async () => {
                                        await resetUsedTimeOut(props.matchID, "B")
                                        setBTimeOutUsed(false)
                                    }}
                                    onStart={() => {
                                        setIsATimeOutSelected(false);
                                        setShowTimeOutConfirmation(true);
                                    }}
                                />
                            </View>}

                </Modal.Body>
            </Modal.Content>
        </Modal>
    );
}
