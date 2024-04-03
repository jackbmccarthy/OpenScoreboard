import React, { useEffect, useState } from 'react';
import { Button, Text, View, Modal, Divider, Spinner, FlatList, Select } from 'native-base';
import { openScoreboardButtonTextColor, openScoreboardColor } from "../../openscoreboardtheme";
import { clearPlayer, getCurrentGameNumber, getCurrentGameScore, setBestOf, setInitialMatchServer, setIsDoubles, setRoundName, start2MinuteWarmUp, startGame, stop2MinuteWarmUp, updateScheduledMatch, updateService } from '../functions/scoring';
import { getCombinedPlayerNames, getPlayerFormatted } from '../functions/players';
import { EditPlayer } from '../EditPlayer';
import CountDownTimerText from '../components/CountDownTimerText';
import { getScheduledTableMatches } from '../functions/tables';
import { ScoringScheduledMatchItem } from '../listitems/ScoringScheduledMatchItem';

import i18n from '../translations/translate';

export function MatchSetup(props) {

    let [isSingles, setIsSingles] = useState(props.isDoubles ? false : true);
    let [pageNumber, setPageNumber] = useState(1);
    let [showPlayerSelection, setShowPlayerSelection] = useState(false);
    let [showServiceChoice, setShowServiceChoice] = useState(false);
    let [loadingMatchServer, setLoadingMatchServer] = useState(false);
    let [showWarmUpTimer, setShowWarmUpTimer] = useState(false);
    let [warmUpStartTimeCounter, setWarmUpStartTimeCounter] = useState(new Date());
    let [showLoadingScheduledMatch, setLoadingScheduledMatch] = useState(false)
    let [showScheduledMatches, setShowScheduledMatches] = useState(false)

   

    let [bestOfGames, setBestOfGames] = useState(props.bestOf || 5)
 let [matchRound, setMatchRound] = useState(props.matchRound || "")
    let [listOfRounds, setListOfRounds] = useState([])

  

    const defaultRounds = [
        "Round Of 256",
        "Round Of 128",
        "Round Of 64",
        "Round Of 32",
        "Round Of 16",
        "Quarter Final",
        "Semi Final",
        "Final"
    ]

    let [scheduledMatches, setScheduledMatches] = useState([])
    async function loadScheduleMatches() {
        let matches = await getScheduledTableMatches(props.route.params.tableID)
        setScheduledMatches(matches)
    }

    useEffect(() => {
        setBestOfGames(props.bestOf || 5)
    }, [props.bestOf])
    useEffect(() => {
        setBestOfGames(props.bestOf || 5)
    }, [props.bestOf])
    //let [isWarmUpUsed, setIsWarmUpUsed] = useState(props.isWarmUpFinished)
    const disableNextButton = () => {
        switch (pageNumber) {
            case 1:
                if (showScheduledMatches) {
                    return true
                }
                break;
            case 2:

                break;

            case 3:
                if (showPlayerSelection) {
                    return true;
                }
                if (isSingles) {
                    if (getPlayerFormatted(props.playerA).length === 0 || getPlayerFormatted(props.playerB).length === 0) {
                        return true;
                    }
                }
                if (!isSingles) {
                    if (getPlayerFormatted(props.playerA).length === 0 ||
                        getPlayerFormatted(props.playerB).length === 0 ||
                        getPlayerFormatted(props.playerA2).length === 0 ||
                        getPlayerFormatted(props.playerB2).length === 0) {
                        return true;
                    }

                }

                break;
            case 4:
                if (props.isScheduling) {
                    return true
                }
                break;
            case 5:
                return true;

            default:
                break;
        }

        return false;
    };

    const { isAInitialServer, isActive, isWarmUpStarted, matchTimeStart, warmUpStartTime, isInitialServerSelected, playerA, playerB, playerA2, playerB2 } = props;
  

    return (
        <>
            {pageNumber === 1 ?
                <View>
                    {
                        showScheduledMatches ?
                            <View>
                                {
                                    scheduledMatches.length > 0 ?
                                        <Text fontSize={"xl"} fontWeight={"bold"} textAlign={"center"}>{i18n.t("selectMatch")}</Text>
                                        : null
                                }
                                {
                                    scheduledMatches.length > 0 ?
                                        <FlatList
                                            data={scheduledMatches}
                                            renderItem={(item) => {
                                                return <ScoringScheduledMatchItem beforeConfirm={async () => {

                                                }} onConfirm={() => {

                                                    props.loadTableScoring(props.route.params.tableID)
                                                    props.onClose()
                                                }} tableID={props.route.params.tableID} {...item} />
                                            }}
                                        ></FlatList>
                                        :
                                        <View>
                                            <View padding={1}>
                                                <Text textAlign={"center"}>{i18n.t("noScheduledMatches")}</Text>
                                            </View>
                                        </View>


                                }
                            </View>
                            :
                            <>
       <Text  textAlign={"center"}>{i18n.t("welcomeNewMatch")}</Text>
       <Text fontWeight={"bold"} textAlign={"center"}>{i18n.t("pressNextToBegin")}</Text>
       
        {props.isTeamMatch || props.isScheduling ? null : <>
        <Text  textAlign={"center"}>{i18n.t("or")}</Text>
        <Text fontWeight={"bold"} textAlign={"center"}>{i18n.t("pressScheduledMatch")}</Text>
        </>}

                            </>

                    }

                </View>
                : null}
            {pageNumber === 2 ?
                <View>
                    <Text fontSize={"xl"}>{i18n.t("playingSinglesOrDoubles")}</Text>
                    <View flexDir={"row"}>
                        <View flex={1} padding={1}>
                            <Button
                                onPress={() => {
                                    setIsSingles(true);
                                    clearPlayer(props.matchID, "playerA2");
                                    clearPlayer(props.matchID, "playerB2");
                                    setIsDoubles(props.matchID, false)
                                }}
                                backgroundColor={isSingles ? openScoreboardColor : "gray.300"}>
                                <Text color={openScoreboardButtonTextColor}>{i18n.t("singles")}</Text>
                            </Button>
                        </View>
                        <View flex={1} padding={1}>
                            <Button
                                onPress={() => {
                                    setIsSingles(false);
                                    setIsDoubles(props.matchID, true)
                                }}
                                backgroundColor={!isSingles ? openScoreboardColor : "gray.300"}>
                                <Text color={openScoreboardButtonTextColor}>{i18n.t("doubles")}</Text>
                            </Button>
                        </View>
                    </View>

                    <Text fontSize={"xl"}>{i18n.t("winBestOf")}</Text>
                    <View flexDir={"row"} padding={1}>
                    <View flex={1} padding={1}>
                            <Button
                                onPress={() => {
                                    setBestOfGames(1)
                                    setBestOf(props.matchID, 1)
                                }}
                                backgroundColor={bestOfGames === 1 ? openScoreboardColor : "gray.300"}>
                                <Text color={openScoreboardButtonTextColor}>1</Text>
                            </Button>
                        </View>
                        <View flex={1} padding={1}>
                            <Button
                                onPress={() => {
                                    setBestOfGames(3)
                                    setBestOf(props.matchID, 3)
                                }}
                                backgroundColor={bestOfGames === 3 ? openScoreboardColor : "gray.300"}>
                                <Text color={openScoreboardButtonTextColor}>3</Text>
                            </Button>
                        </View>
                        <View flex={1} padding={1}>
                            <Button
                                onPress={() => {
                                    setBestOfGames(5)
                                    setBestOf(props.matchID, 5)
                                }}
                                backgroundColor={bestOfGames === 5 ? openScoreboardColor : "gray.300"}>
                                <Text color={openScoreboardButtonTextColor}>5</Text>
                            </Button>
                        </View>
                        <View flex={1} padding={1}>
                            <Button
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
                        <Text fontSize={"xl"}>{i18n.t("matchRound")}</Text>
                        <Select selectedValue={matchRound}
                            onValueChange={(round) => {
                                setMatchRound(round)
                                setRoundName(props.matchID, round)
                            }}
                        >
                            <Select.Item label='None' value=''></Select.Item>
                            {
                                listOfRounds.length > 0 ?
                                    listOfRounds.map((round, index) => {
                                        return (
                                            <Select.Item key={round + index} label={round} value={round}></Select.Item>
                                        )
                                    })
                                    :
                                    defaultRounds.map((round, index) => {
                                        return (
                                            <Select.Item key={round + index} label={round} value={round}></Select.Item>
                                        )
                                    })

                            }

                        </Select>
                    </View>




                </View>

                : null}
            {pageNumber === 3 ?
                <View>
                    {showPlayerSelection ?
                        <View>
                            <EditPlayer {...props} setShowPlayerSelection={setShowPlayerSelection} isWizard={true}></EditPlayer>
                            <View>
                                <Button variant={"outline"}
                                    onPress={() => {
                                        setShowPlayerSelection(false);
                                        props.setEditPlayer("")
                                    }}
                                >
                                    <Text>{i18n.t("backToPlayerSelection")}</Text>
                                </Button>
                            </View>
                        </View>
                        :


                        <>
                            <Text>{i18n.t("enterOrSelectPlayerNames")}</Text>
                            <View flexDirection={"row"}>
                                <View flex={1} padding={1}>
                                    <View padding={1}>
                                        <Button onPress={() => {
                                            props.setEditPlayer("playerA");
                                            setShowPlayerSelection(true);
                                        }}>
                                            <Text color={openScoreboardButtonTextColor}>{getPlayerFormatted(props.playerA).length > 0 ? getPlayerFormatted(props.playerA) : "Player A"}</Text>
                                        </Button>
                                    </View>
                                    {!isSingles ?
                                        <View padding={1}>
                                            <Button onPress={() => {
                                                props.setEditPlayer("playerA2");
                                                setShowPlayerSelection(true);
                                            }}>
                                                <Text color={openScoreboardButtonTextColor}>{getPlayerFormatted(props.playerA2).length > 0 ? getPlayerFormatted(props.playerA2) : "Player A2"}</Text>
                                            </Button>
                                        </View>
                                        : null}

                                </View>
                                <View flex={1} padding={1}>
                                    <View padding={1}>
                                        <Button onPress={() => {
                                            props.setEditPlayer("playerB");
                                            setShowPlayerSelection(true);
                                        }}>
                                            <Text color={openScoreboardButtonTextColor}>{getPlayerFormatted(props.playerB).length > 0 ? getPlayerFormatted(props.playerB) : "Player B"}</Text>
                                        </Button>
                                    </View>

                                    {!isSingles ?
                                        <View padding={1}>
                                            <Button onPress={() => {
                                                props.setEditPlayer("playerB2");
                                                setShowPlayerSelection(true);
                                            }}>
                                                <Text color={openScoreboardButtonTextColor}>{getPlayerFormatted(props.playerB2).length > 0 ? getPlayerFormatted(props.playerB2) : "Player B2"}</Text>
                                            </Button>
                                        </View>

                                        : null}

                                </View>

                            </View>
                        </>}

                </View>
                : null}
            {!props.isScheduling && pageNumber === 4 ?
                <View>
                    <View>
                        <Text>{i18n.t("whoServeFirst")}</Text>
                    </View>

                    <View flex={1} flexDirection="row">
                        <View flex={1} padding={1}>
                            <Button backgroundColor={isAInitialServer ? openScoreboardColor : "gray.300"} disabled={loadingMatchServer}
                                onPress={async () => {
                                    setLoadingMatchServer(true);
                                    await setInitialMatchServer(props.matchID, true);
                                    setLoadingMatchServer(false);
                                    let currentScore = getCurrentGameScore(props);
                                    updateService(props.matchID, true, getCurrentGameNumber(props), currentScore.a + currentScore.b, props.changeServeEveryXPoints, props.pointsToWinGame);
                                }}
                            >
                                <Text color={isAInitialServer ? openScoreboardButtonTextColor : null}>{getCombinedPlayerNames(playerA, playerB, playerA2, playerB2).a}</Text>
                            </Button>
                        </View>
                        <View flex={1} padding={1}>
                            <Button
                                backgroundColor={isAInitialServer ? "gray.300" : openScoreboardColor}
                                disabled={loadingMatchServer}
                                onPress={async () => {
                                    setLoadingMatchServer(true);
                                    await setInitialMatchServer(props.matchID, false);
                                    setLoadingMatchServer(false);
                                    let currentScore = getCurrentGameScore(props);
                                    updateService(props.matchID, false, getCurrentGameNumber(props), currentScore.a + currentScore.b, props.changeServeEveryXPoints, props.pointsToWinGame);
                                }}
                            >
                                <Text color={isAInitialServer ? null : openScoreboardButtonTextColor}>{getCombinedPlayerNames(playerA, playerB, playerA2, playerB2).b}</Text>
                            </Button>
                        </View>

                    </View>

                    <View padding={1}>
                        {showWarmUpTimer ?
                            <View flex={1} justifyContent="center" alignItems={"center"}>
                                <CountDownTimerText fontSize={"6xl"} startTime={warmUpStartTimeCounter} isOpen={showWarmUpTimer} counterStart={120} onFinish={() => {
                                    stop2MinuteWarmUp(props.matchID);
                                    setShowWarmUpTimer(false);
                                }}></CountDownTimerText>
                            </View>
                            :
                            <View flex={1} padding={1}>
                                <Button disabled={props.isWarmUpFinished}
                                    backgroundColor={props.isWarmUpFinished ? "gray.300" : openScoreboardColor}
                                    onPress={() => {
                                        setShowWarmUpTimer(true);
                                        setWarmUpStartTimeCounter(new Date());
                                        start2MinuteWarmUp(props.matchID);

                                    }}
                                >
                                    <Text color={openScoreboardButtonTextColor}>{props.isWarmUpFinished ? i18n.t("warmUpComplete") : i18n.t("startTwoMinuteWarmUp")}</Text>
                                </Button>
                            </View>}


                    </View>
                </View>
                :
                props.isScheduling && pageNumber === 4 ?
                    <View padding={1} flex={1}>
                        <Text>{i18n.t("allDoneScheduling")}</Text>
                        <Button onPress={async () => {
                            setLoadingScheduledMatch(true)
                            await updateScheduledMatch(props.route.params.tableID, props.scheduledMatchID, props.matchID, props.schedMatchStartTime)
                            props.onClose(true);
                            setPageNumber(1)
                            setLoadingScheduledMatch(false)
                        }}>
                            {
                                showLoadingScheduledMatch ?
                                    <Spinner color={openScoreboardColor}></Spinner>
                                    :
                                    <Text  color={openScoreboardButtonTextColor}>{i18n.t("done")}</Text>
                            }

                        </Button>
                    </View>
                    : null
            }
            {pageNumber === 5 ?
                <View padding={1} flex={1}>
                    <Button onPress={() => {
                        startGame(props.matchID, getCurrentGameNumber(props));
                        updateService(props.matchID, props.isAInitialServer, 1, 0, props.changeServeEveryXPoints, props.pointsToWinGame);
                        props.onClose();
                        setPageNumber(1)
                    }}>
                        <Text color={openScoreboardButtonTextColor}>{i18n.t("startGame")}</Text>
                    </Button>
                </View>
                :
                null}





            <Divider></Divider>
            <View flexDirection={"row"}>
                <View padding={1} flex={1}>
                    <Button variant={"outline"} onPress={() => {
                        if (showScheduledMatches) {
                            setShowScheduledMatches(false)
                        }
                        else if (pageNumber === 1 && !props.isTeamMatch && !props.isScheduling) {
                            setShowScheduledMatches(true)
                            loadScheduleMatches()
                        }

                        setPageNumber(pageNumber > 1 ? pageNumber - 1 : pageNumber);


                    }}>
                        <Text >{pageNumber === 1 && !props.isTeamMatch && !showScheduledMatches && !props.isScheduling ? i18n.t("scheduled") :  i18n.t("back")}</Text>
                    </Button>
                </View>
                <View padding={1} flex={1}>
                    <Button backgroundColor={disableNextButton() ? "gray.300" : openScoreboardColor}
                        disabled={disableNextButton()}
                        onPress={() => {
                            setPageNumber(pageNumber + 1);
                        }}
                    >
                        <Text color={openScoreboardButtonTextColor}>{i18n.t("next")}</Text>
                    </Button>
                </View>
            </View>


        </>
    )

}

export function MatchSetupWizard(props) {


    return (
        <Modal isOpen={props.isOpen}>
            <Modal.Content>
                <Modal.Header>{i18n.t("matchSetup")}</Modal.Header>
                <Modal.Body>
                    <View padding={1}>
                        <MatchSetup {...props} />
                    </View>

                </Modal.Body>

            </Modal.Content>
        </Modal>
    );
}
