import React, { useEffect, useRef, useState } from 'react';
import { Button, Text, View, Modal, Spinner } from 'native-base';
import { openScoreboardButtonTextColor } from "../../openscoreboardtheme";
import { getCurrentGameNumber, startGame, switchSides, updateService } from '../functions/scoring';

export function InBetweenGamesModal(props) {

    let [startTime, setStartTime] = useState(new Date());
    let [isTimeUp, setIsTimeUp] = useState(false);
    let gameBreakCounterInterval = useRef();
    let [counter, setCounter] = useState(60);
    let [loadingNewGame, setLoadingNewGame] = useState(false);

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

        }
    }, [props.isOpen]);


    return (
        <Modal isOpen={props.isOpen}>
            <Modal.Content>
                <Modal.CloseButton></Modal.CloseButton>
                <Modal.Header>Break Timer</Modal.Header>
                <Modal.Body>
                    <View justifyContent={"center"} alignItems="center">
                        {isTimeUp ?
                            <Text fontSize={"9xl"}>Time!</Text>
                            :
                            <Text fontSize={"9xl"}>{counter}</Text>}

                    </View>
                    <View>
                        <Button disabled={loadingNewGame}
                            onPress={async () => {
                                clearInterval(gameBreakCounterInterval.current);
                                setLoadingNewGame(true);
                                let gameNumber = getCurrentGameNumber(props);
                                
                                await Promise.all([
                                    await startGame(props.matchID, getCurrentGameNumber(props)),
                                    await switchSides(props.matchID),
                                    await updateService(props.matchID, props.isAInitialServer, gameNumber, 0, props.changeServeEveryXPoints, props.pointsToWinGame)
                                ]);
                                setLoadingNewGame(false);
                                props.onClose();
                            }}
                        >
                            {loadingNewGame ?
                                <Spinner color={openScoreboardButtonTextColor}></Spinner>
                                : <Text color={openScoreboardButtonTextColor}>Start Game {getCurrentGameNumber(props)}</Text>}
                        </Button>
                    </View>
                </Modal.Body>

            </Modal.Content>
        </Modal>
    );
}
