import React, { useEffect, useState } from 'react';
import { Button, Checkbox, View, Modal, FormControl, Select, Text, Spinner, ScrollView } from 'native-base';
import { getUserPath } from '../../database';
import { openScoreboardButtonTextColor, openScoreboardColor } from "../../openscoreboardtheme";
import { addNewTeamMatch } from '../functions/teammatches';
import { getMyTeams } from '../functions/teams';
import { TEAM_MATCH_MODES, newTeamMatch } from '../classes/TeamMatch';
import { DateTimePicker } from '../components/DateTimePicker';
import { supportedSports } from '../functions/sports';
import i18n from '../translations/translate';

const CREATE_TABS = {
    SINGLE: "single",
    BULK: "bulk",
};

export function NewTeamMatchModal(props) {
    let [loadingNewMatch, setLoadingNewMatch] = useState(false);
    let [teamSelectionList, setTeamSelectionList] = useState([]);
    let [selectedSport, setSelectedSport] = useState("tableTennis")
    let [selectedScoringType, setSelectedScoringType] = useState("")
    let [creationTab, setCreationTab] = useState(CREATE_TABS.SINGLE)
    let [teamMatchMode, setTeamMatchMode] = useState(TEAM_MATCH_MODES.STRUCTURED)
    let [bulkTeamIDs, setBulkTeamIDs] = useState<string[]>([])


    let [teamAID, setTeamAID] = useState("");
    let [teamBID, setTeamBID] = useState("");

    async function loadTeamSelection() {
        let teams = await getMyTeams(getUserPath());

        setTeamSelectionList(teams);
    }

    useEffect(() => {
        loadTeamSelection();
    }, []);

    let [matchTime, setMatchTime] = useState(new Date().toISOString().slice(0, 10));
    const isTeamScoreOnly = teamMatchMode === TEAM_MATCH_MODES.TEAM_SCORE_ONLY;
    const bulkPairingCount = bulkTeamIDs.length > 1 ? (bulkTeamIDs.length * (bulkTeamIDs.length - 1)) / 2 : 0;
    const canCreateSingle = teamAID && teamBID && teamAID !== teamBID;
    const canCreateBulk = bulkTeamIDs.length >= 2;

    function toggleBulkTeam(teamID, isSelected) {
        setBulkTeamIDs((currentIDs) => {
            if (isSelected) {
                return currentIDs.includes(teamID) ? currentIDs : [...currentIDs, teamID];
            }

            return currentIDs.filter((currentID) => currentID !== teamID);
        });
    }

    function getSelectedBulkTeams() {
        return bulkTeamIDs
            .map((teamID) => teamSelectionList.find((team: any) => team?.[1]?.id === teamID))
            .filter(Boolean);
    }

    async function createTeamMatches() {
        setLoadingNewMatch(true);
        try {
            const options = { teamMatchMode };
            if (creationTab === CREATE_TABS.SINGLE) {
                if (!canCreateSingle) {
                    return;
                }
                await addNewTeamMatch(newTeamMatch(teamAID, teamBID, matchTime, selectedSport, selectedScoringType, options));
            }
            else {
                if (!canCreateBulk) {
                    return;
                }
                const selectedTeams = getSelectedBulkTeams();
                const matchCreates: any[] = [];
                selectedTeams.forEach((teamA: any, teamAIndex) => {
                    selectedTeams.slice(teamAIndex + 1).forEach((teamB: any) => {
                        matchCreates.push(
                            addNewTeamMatch(newTeamMatch(
                                teamA[1].id,
                                teamB[1].id,
                                matchTime,
                                selectedSport,
                                selectedScoringType,
                                options
                            ))
                        );
                    });
                });

                await Promise.all(matchCreates);
            }

            props.onClose();
        }
        finally {
            setLoadingNewMatch(false);
        }
    }

    return (
        <Modal onClose={() => {
            props.onClose(false);
        }} isOpen={props.isOpen}>
            <Modal.Content maxWidth={"720px"} width={"95%"}>
                <Modal.CloseButton></Modal.CloseButton>
                <Modal.Header>{i18n.t("newTeamMatch")}</Modal.Header>
                <Modal.Body>
                    <ScrollView maxHeight={"70vh"}>
                        <View flexDirection={"row"} marginBottom={4}>
                            <Button
                                backgroundColor={creationTab === CREATE_TABS.SINGLE ? openScoreboardColor : "white"}
                                borderColor={creationTab === CREATE_TABS.SINGLE ? openScoreboardColor : "blue.100"}
                                borderRadius={8}
                                borderWidth={1}
                                flex={1}
                                marginRight={2}
                                onPress={() => setCreationTab(CREATE_TABS.SINGLE)}
                                variant={creationTab === CREATE_TABS.SINGLE ? "solid" : "outline"}
                            >
                                <Text color={creationTab === CREATE_TABS.SINGLE ? openScoreboardButtonTextColor : "blue.700"} fontWeight={"bold"}>
                                    Single match
                                </Text>
                            </Button>
                            <Button
                                backgroundColor={creationTab === CREATE_TABS.BULK ? openScoreboardColor : "white"}
                                borderColor={creationTab === CREATE_TABS.BULK ? openScoreboardColor : "blue.100"}
                                borderRadius={8}
                                borderWidth={1}
                                flex={1}
                                marginLeft={2}
                                onPress={() => setCreationTab(CREATE_TABS.BULK)}
                                variant={creationTab === CREATE_TABS.BULK ? "solid" : "outline"}
                            >
                                <Text color={creationTab === CREATE_TABS.BULK ? openScoreboardButtonTextColor : "blue.700"} fontWeight={"bold"}>
                                    Bulk round robin
                                </Text>
                            </Button>
                        </View>

                        <FormControl marginBottom={3}>
                            <FormControl.Label>Team match type</FormControl.Label>
                            <Select selectedValue={teamMatchMode} onValueChange={setTeamMatchMode}>
                                <Select.Item label={"Structured team match"} value={TEAM_MATCH_MODES.STRUCTURED} />
                                <Select.Item label={"Team score only"} value={TEAM_MATCH_MODES.TEAM_SCORE_ONLY} />
                            </Select>
                            <Text color={"gray.600"} fontSize={"xs"} marginTop={1}>
                                {isTeamScoreOnly ?
                                    "Use team names, logos, and a manually controlled team score without creating player matches." :
                                    "Use scheduled player matches and table links for a normal team match."}
                            </Text>
                        </FormControl>

                        {creationTab === CREATE_TABS.SINGLE ? (
                            <FormControl>
                                <FormControl.Label>{i18n.t("teamA")}</FormControl.Label>
                                <Select selectedValue={teamAID} onValueChange={(val) => {
                                    setTeamAID(val);
                                }}>
                                    {teamSelectionList.map((team) => {
                                        return (
                                            <Select.Item key={team[0] + "A"} label={team[1].name} value={team[1].id}></Select.Item>
                                        );
                                    })}
                                </Select>
                                <FormControl.Label marginTop={3}>{i18n.t("teamB")}</FormControl.Label>
                                <Select selectedValue={teamBID} onValueChange={(val) => {
                                    setTeamBID(val);
                                }}>
                                    {teamSelectionList.map((team) => {
                                        return (
                                            <Select.Item key={team[0] + "B"} label={team[1].name} value={team[1].id}></Select.Item>
                                        );
                                    })}
                                </Select>
                                {teamAID && teamAID === teamBID ? (
                                    <Text color={"red.700"} fontSize={"xs"} marginTop={2}>Choose two different teams.</Text>
                                ) : null}
                            </FormControl>
                        ) : (
                            <View>
                                <Text color={"gray.900"} fontSize={"md"} fontWeight={"bold"}>Select teams</Text>
                                <Text color={"gray.600"} fontSize={"xs"} marginTop={1}>
                                    Each selected team will play every other selected team once. Use Competitions for bracket or advancement formats.
                                </Text>
                                <View marginTop={2}>
                                    {teamSelectionList.map((team: any) => (
                                        <View
                                            alignItems={"center"}
                                            borderColor={"gray.200"}
                                            borderRadius={8}
                                            borderWidth={1}
                                            flexDirection={"row"}
                                            key={`bulk-team-${team[0]}`}
                                            marginTop={2}
                                            padding={3}
                                        >
                                            <Checkbox
                                                isChecked={bulkTeamIDs.includes(team[1].id)}
                                                onChange={(isSelected) => toggleBulkTeam(team[1].id, isSelected)}
                                                value={team[1].id}
                                            />
                                            <Text color={"gray.900"} fontSize={"sm"} fontWeight={"bold"} marginLeft={3}>
                                                {team[1].name || "Untitled team"}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                                <Text color={"blue.700"} fontSize={"xs"} fontWeight={"bold"} marginTop={3}>
                                    {bulkPairingCount} team match{bulkPairingCount === 1 ? "" : "es"} will be created.
                                </Text>
                            </View>
                        )}

                        <FormControl marginTop={4}>
                            <FormControl.Label>{i18n.t("matchTime")}</FormControl.Label>
                            <DateTimePicker type="date" value={matchTime} onChange={(event) => {
                                setMatchTime(event.target.value);
                            }}></DateTimePicker>
                        </FormControl>

                        <FormControl marginTop={3}>
                            <FormControl.Label>
                                {i18n.t("sport")}
                            </FormControl.Label>
                            <Select selectedValue={selectedSport}
                                onValueChange={(sport) => {
                                    setSelectedSport(sport)
                                    if (supportedSports[sport]?.hasScoringTypes) {
                                        setSelectedScoringType(Object.keys(supportedSports[sport]?.scoringTypes)[0])
                                    }
                                    else {
                                        setSelectedScoringType("")
                                    }
                                }}
                            >
                                {
                                    Object.entries(supportedSports).map(([id, { displayName }]) => {
                                        return <Select.Item key={id} label={displayName} value={id}></Select.Item>
                                    })
                                }
                            </Select>

                            {
                                supportedSports[selectedSport]?.hasScoringTypes ?
                                    <>
                                        <FormControl.Label>
                                            {i18n.t("scoringType")}
                                        </FormControl.Label>
                                        <Select selectedValue={selectedScoringType}
                                            onValueChange={(type) => {
                                                setSelectedScoringType(type)
                                            }}
                                        >
                                            {
                                                Object.entries(supportedSports[selectedSport]?.scoringTypes || {}).map(([id, { displayName }]) => {
                                                    return <Select.Item key={id} label={displayName} value={id}></Select.Item>
                                                })
                                            }
                                        </Select>
                                    </>

                                    : null
                            }
                        </FormControl>
                    </ScrollView>
                </Modal.Body>
                <Modal.Footer>
                    <View padding={1}>
                        <Button
                            isDisabled={loadingNewMatch || (creationTab === CREATE_TABS.SINGLE ? !canCreateSingle : !canCreateBulk)}
                            onPress={createTeamMatches}
                        >
                            {loadingNewMatch ?
                                <Spinner></Spinner>
                                :
                                <Text color={openScoreboardButtonTextColor}>
                                    {creationTab === CREATE_TABS.BULK ? `Create ${bulkPairingCount} matches` : i18n.t("create")}
                                </Text>}

                        </Button>
                    </View>
                    <View padding={1}>
                        <Button

                            variant={"ghost"}
                            onPress={() => {

                                props.onClose(false);
                            }}
                        ><Text>{i18n.t("close")}</Text>
                        </Button>
                    </View>
                </Modal.Footer>
            </Modal.Content>
        </Modal>
    );
}
