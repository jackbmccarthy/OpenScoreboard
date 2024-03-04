import React, { useEffect, useRef, useState } from 'react';
import { Button, Text, View, Modal, FormControl } from 'native-base';
import { openScoreboardButtonTextColor, openScoreboardColor } from "../../openscoreboardtheme";
import { resetUsedTimeOut, setUsedTimeOut, startTimeOut } from '../functions/scoring';
import { getCombinedPlayerNames } from '../functions/players';
import { FontAwesome } from '@expo/vector-icons';
import i18n from '../translations/translate';

export function TimeOutModal(props) {
    const { playerA, playerB, playerA2, playerB2 } = props;
    let [showTimer, setShowTimer] = useState(false);
    let [secondsLeft, setSecondsLeft] = useState(60);
    let [timerStartTime, setTimerStartTime] = useState("");
    let [showTimeOutConfirmation, setShowTimeOutConfirmation] = useState(false);
    let [isATimeOutSelected, setIsATimeOutSelected] = useState(false);

    let [ATimeOutUsed, setATimeOutUsed] = useState(props.isATimeOutUsed);
    let [BTimeOutUsed, setBTimeOutUsed] = useState(props.isBTimeOutUsed);
    let intervalID = useRef("");

    useEffect(() => {
        setATimeOutUsed(props.isATimeOutUsed);
        setBTimeOutUsed(props.isBTimeOutUsed);
    }, [props.isATimeOutUsed, props.isBTimeOutUsed]);


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
        clearInterval(intervalID.current);
    };

    return (
        <Modal onClose={() => { props.onClose(); }} isOpen={props.isOpen}>
            <Modal.Content>
                <Modal.CloseButton></Modal.CloseButton>
                <Modal.Header>{showTimeOutConfirmation ? i18n.t("confirmTimeOut"): i18n.t("timeOut")}</Modal.Header>
                <Modal.Body>
                    {showTimer ?
                        <View>
                            <Text textAlign={"center"} fontSize={"9xl"}>{secondsLeft}</Text>
                            <View>
                                <Button onPress={() => {
                                    props.onClose();
                                    setUsedTimeOut(props.matchID, isATimeOutSelected ? "A" : "B");
                                    setShowTimeOutConfirmation(false);
                                    setShowTimer(false);
                                }}>
                                    <Text color={openScoreboardButtonTextColor}>{i18n.t("endTimeOut")}</Text>
                                </Button>
                            </View>
                        </View>
                        :
                        showTimeOutConfirmation ?
                            <View padding={2}>

                                <Text textAlign={"center"} fontSize={"xl"} fontWeight={"bold"}>{isATimeOutSelected ? getCombinedPlayerNames(playerA, playerB, playerA2, playerB2).a : getCombinedPlayerNames(playerA, playerB, playerA2, playerB2).b}</Text>
                                <View flexDir={"row"}>
                                    <View flex={1} padding={1}>
                                        <Button
                                            onPress={() => {
                                                setShowTimer(true);
                                                setTimerStartTime(new Date().toISOString());
                                                startCountDownTimer(new Date().toISOString());
                                                startTimeOut(props.matchID, isATimeOutSelected ? "A" : "B");
                                            }}
                                        >
                                            <Text color={openScoreboardButtonTextColor}>{i18n.t("confirm")}</Text>
                                        </Button>
                                    </View>
                                    <View flex={1} padding={1}>
                                        <Button variant={"ghost"}
                                            onPress={() => {
                                                setShowTimeOutConfirmation(false);
                                            }}
                                        >
                                            <Text>{i18n.t("back")}</Text>
                                        </Button>
                                    </View>
                                </View>
                            </View>
                            :
                            <FormControl>
                                <FormControl.Label>
                                    {getCombinedPlayerNames(playerA, playerB, playerA2, playerB2).a}
                                </FormControl.Label>
                                <View flexDirection={"row"} alignItems="center" >
                                    <View flex={1} padding={1}>
                                        <Button backgroundColor={ATimeOutUsed ? "gray.300" : null} disabled={ATimeOutUsed} onPress={() => {
                                            setIsATimeOutSelected(true);
                                            setShowTimeOutConfirmation(true);
                                        }}>
                                            <Text color={ATimeOutUsed ? openScoreboardColor : openScoreboardButtonTextColor}>{ATimeOutUsed ? i18n.t("timeOutUsed") : i18n.t("startTimeOut")}</Text>
                                        </Button>
                                    </View>
                                    {
                                            ATimeOutUsed ? 
                                            <Button  
                                            onPress={async ()=>{
                                               await resetUsedTimeOut(props.matchID, "A")
                                               setATimeOutUsed(false)
                                            }}
                                            >
                                            <FontAwesome color={openScoreboardButtonTextColor} size={24} name="refresh"></FontAwesome>
                                            </Button>
                                            :
                                            null
                                        }
                                </View>
                                <FormControl.Label>
                                    {getCombinedPlayerNames(playerA, playerB, playerA2, playerB2).b}
                                </FormControl.Label>
                                <View flexDirection={"row"} alignItems="center">
                                    <View flex={1} padding={1}>
                                        <Button backgroundColor={BTimeOutUsed ? "gray.300" : null} disabled={BTimeOutUsed} onPress={() => {
                                            setIsATimeOutSelected(false);
                                            setShowTimeOutConfirmation(true);
                                        }}>
                                            <Text color={BTimeOutUsed ? openScoreboardColor : openScoreboardButtonTextColor}>{BTimeOutUsed ? i18n.t("timeOutUsed") : i18n.t("startTimeOut")}</Text>
                                        </Button>
                                        
                                    </View>
                                    {
                                            BTimeOutUsed ? 
                                            <Button  
                                            onPress={async ()=>{
                                               await resetUsedTimeOut(props.matchID, "B")
                                               setBTimeOutUsed(false)
                                            }}
                                            >
                                            <FontAwesome  color={openScoreboardButtonTextColor} size={24} name="refresh"></FontAwesome>
                                            </Button>
                                            :
                                            null
                                        }
                                </View>
                            </FormControl>}

                </Modal.Body>
            </Modal.Content>
        </Modal>
    );
}
