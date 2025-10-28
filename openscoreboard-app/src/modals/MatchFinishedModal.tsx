import React, { useState } from 'react';
import { Button, Text, View, Modal, Spinner, FlatList } from 'native-base';
import { openScoreboardButtonTextColor } from "../../openscoreboardtheme";
import { archiveMatchForTable, createNewMatch, getMatchScore } from '../functions/scoring';
import { getCombinedPlayerNames } from '../functions/players';
import { archiveMatchForTeamMatch, createTeamMatchNewMatch } from '../functions/teammatches';
import { getScheduledTableMatches } from '../functions/tables';
import { ScoringScheduledMatchItem } from '../listitems/ScoringScheduledMatchItem';
import i18n from '../translations/translate';

export function MatchFinishedModal(props) {

    let [loadingNewMatch, setLoadingNewMatch] = useState(false);
    let [loadingScheduledMatches, setLoadingScheduledMatches] = useState(false);

    let [showScheduledMatches, setShowScheduledMatches] = useState(false)
    let [scheduledMatches, setScheduledMatches] = useState([])
    const { playerA, playerA2, playerB, playerB2 } = props;

    let playerScore = getMatchScore(props);

    let playerAWon = playerScore.a > playerScore.b;

    function winnerScore(a, b) {
        if (a > b) { return a; }
        else { return b; }
    }
    function loserScore(a, b) {
        if (a < b) { return a; }
        else { return b; }
    }

    async function loadScheduleMatches() {
        let matches = await getScheduledTableMatches(props.tableID)
        setScheduledMatches(matches)
    }


    return (
        <Modal isOpen={props.isOpen}>
            <Modal.Content>

                <Modal.Body>
                    {
                        showScheduledMatches ?
                            <View>
                                <Text fontSize={"xl"} fontWeight={"bold"} textAlign={"center"}>{i18n.t("selectMatch")}</Text>
                                {
                                    scheduledMatches.length > 0 ?
                                        <FlatList
                                            data={scheduledMatches}
                                            renderItem={(item) => {
                                                return <ScoringScheduledMatchItem beforeConfirm={async () => {
                                                    if (props.isTeamMatch) {
                                                        await archiveMatchForTeamMatch(props.teamMatchID, props.tableNumber, props.matchID, props)
                                                        await props.onNewMatchCreation();
                                                    }
                                                    else {
                                                        await archiveMatchForTable(props.tableID, props.matchID, props)
                                                        await props.onNewMatchCreation();
                                                    }

                                                }} onConfirm={() => {
                                                    props.onClose()
                                                }} tableID={props.tableID} {...item} />
                                            }}
                                        ></FlatList>
                                        :
                                        <View>
                                            <View padding={1}>
                                                <Text textAlign={"center"}>{i18n.t("noScheduledMatches")}</Text>
                                            </View>

                                            <View>
                                                <Button onPress={() => {
                                                    setShowScheduledMatches(false)
                                                }} >
                                                    <Text color={openScoreboardButtonTextColor}>{i18n.t("back")}</Text>
                                                </Button>
                                            </View>
                                        </View>


                                }
                                <View padding={1}>
                                    <Button onPress={() => {
                                        setShowScheduledMatches(false)
                                    }}>
                                        <Text color={openScoreboardButtonTextColor}>{i18n.t("back")}</Text>
                                    </Button>
                                </View>
                            </View>
                            :

                            <>
                                <Text textAlign={"center"} fontSize={"5xl"}>{i18n.t("matchFinished")}</Text>

                                <Text textAlign={"center"} fontSize={"3xl"}>{playerAWon ? getCombinedPlayerNames(playerA, playerB, playerA2, playerB2).a : getCombinedPlayerNames(playerA, playerB, playerA2, playerB2).b}</Text>
                                <Text textAlign={"center"} fontSize={"4xl"}>{winnerScore(playerScore.a, playerScore.b)} - {loserScore(playerScore.a, playerScore.b)}</Text>
                                <View flex={1} padding={1}>
                                    <Button disabled={loadingNewMatch}
                                        onPress={async () => {
                                            setLoadingNewMatch(true);
                                            if (props.isTeamMatch === true) {
                                                await archiveMatchForTeamMatch(props.teamMatchID, props.tableNumber, props.matchID, props)
                                                let newTeamMatchMatchKey = await createTeamMatchNewMatch(props.teamMatchID, props.tableNumber, props.sportName, JSON.parse(JSON.stringify(props)), props.scoringType)
                                                await props.onNewMatchCreation(newTeamMatchMatchKey);

                                            }
                                            else {
                                                await archiveMatchForTable(props.tableID, props.matchID, props);
                                                let newMatchKey = await createNewMatch(props.tableID, props.sportName, JSON.parse(JSON.stringify(props)), false, props.scoringType);
                                                await props.onNewMatchCreation(newMatchKey);
                                            }


                                            setLoadingNewMatch(false);
                                            props.onClose();
                                            props.openSetupWizard();

                                        }}
                                    >
                                        {loadingNewMatch ?
                                            <Spinner color={openScoreboardButtonTextColor}></Spinner> :
                                            <Text color={openScoreboardButtonTextColor}>{i18n.t("startAnotherMatch")}</Text>}

                                    </Button>
                                </View>
                                {props.isTeamMatch ?
                                    null
                                    :
                                    <View flex={1} padding={1}>
                                        <Button
                                            onPress={async () => {
                                                setLoadingScheduledMatches(true)


                                                await loadScheduleMatches()
                                                setLoadingScheduledMatches(false)
                                                setShowScheduledMatches(true)

                                            }}
                                        >
                                            {loadingScheduledMatches ?
                                                <Spinner color={openScoreboardButtonTextColor}></Spinner> :
                                                <Text color={openScoreboardButtonTextColor}>{i18n.t("selectFromScheduledMatches")}</Text>}

                                        </Button>
                                    </View>
                                }


                            </>
                    }

                </Modal.Body>

            </Modal.Content>
        </Modal>
    );
}
