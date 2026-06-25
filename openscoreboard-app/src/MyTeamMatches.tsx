


import React, { useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Button, View, NativeBaseProvider, FlatList, Input, Text, Select } from 'native-base';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getUserPath } from '../database';
import LoadingPage from './LoadingPage';
import { openScoreboardButtonTextColor } from "../openscoreboardtheme";
import { openScoreboardTheme } from "../openscoreboardtheme";

import getMyTeamMatches from './functions/teammatches';
import { LinearGradient } from 'expo-linear-gradient';
import { SelectTeamMatchTableModal } from './modals/SelectTeamMatchTableModal';
import { TeamMatchItem } from './listitems/TeamMatchItem';
import { NewTeamMatchModal } from './modals/NewTeamMatchModal';
import { TableLinkModal } from './modals/TableLinkModal';
import { TeamMatchLinkModal } from './modals/TeamMatchLinkModal';
import i18n from './translations/translate';
import { HeaderActions, HeaderIconButton } from './components/HeaderActions';

const teamMatchSortOptions = [
    { label: "Newest date first", value: "dateDesc" },
    { label: "Oldest date first", value: "dateAsc" },
];

function getTeamMatchDateValue(teamMatch = {}) {
    const parsedDate = Date.parse(teamMatch?.startTime || "");
    return Number.isNaN(parsedDate) ? 0 : parsedDate;
}

function getTeamMatchSearchText(teamMatchEntry) {
    const [, teamMatch = {}] = teamMatchEntry || [];
    return [
        teamMatch.teamAName,
        teamMatch.teamBName,
        teamMatch.sportDisplayName,
        teamMatch.sportName,
        teamMatch.scoringType,
        teamMatch.teamMatchMode === "teamScoreOnly" ? "team score only" : "structured",
    ].filter(Boolean).join(" ").toLowerCase();
}

function sortTeamMatches(teamMatches = [], sortBy = "dateDesc") {
    return [...teamMatches].sort((firstEntry, secondEntry) => {
        const firstMatch = firstEntry?.[1] || {};
        const secondMatch = secondEntry?.[1] || {};
        const dateComparison = getTeamMatchDateValue(firstMatch) - getTeamMatchDateValue(secondMatch);

        if (dateComparison !== 0) {
            return sortBy === "dateAsc" ? dateComparison : -dateComparison;
        }

        const firstName = `${firstMatch.teamAName || ""} ${firstMatch.teamBName || ""}`;
        const secondName = `${secondMatch.teamAName || ""} ${secondMatch.teamBName || ""}`;
        return firstName.localeCompare(secondName);
    });
}

export default function MyTeamMatches(props) {

    let [teamMatchList, setTeamMatchList] = useState([])
    let [doneLoading, setDoneLoading] = useState(false)
    let [showNewTeamMatchModal, setShowNewTeamMatchModal] = useState(false)
    let [showTeamMatchTableModal, setShowTeamMatchTableModal] = useState(false)
    let [showLinkModal, setShowLinkModal] = useState(false)
    let [selectedTeamMatchID, setSelectedTeamMatchID] = useState("")
    let [selectedTeamMatchIndex, setSelectedTeamMatchIndex] = useState(0)
    let [selectedTableID, setSelectedTableID] = useState("")

    let [teamScoringType, setTeamScoringType] = useState("")
    let [teamSportName, setTeamSportName] = useState("")
    let [teamMatchSearch, setTeamMatchSearch] = useState("")
    let [teamMatchSort, setTeamMatchSort] = useState("dateDesc")
    const filteredTeamMatches = useMemo(() => {
        const normalizedSearch = teamMatchSearch.trim().toLowerCase();
        const filteredMatches = normalizedSearch ?
            teamMatchList.filter((teamMatch) => getTeamMatchSearchText(teamMatch).includes(normalizedSearch)) :
            teamMatchList;

        return sortTeamMatches(filteredMatches, teamMatchSort);
    }, [teamMatchList, teamMatchSearch, teamMatchSort]);

    const openTeamMatchTableSelection = (teamMatchID, teamMatchIndex) => {

        setSelectedTeamMatchID(teamMatchID)
        setSelectedTeamMatchIndex(teamMatchIndex)
        setShowTeamMatchTableModal(true)
    }
    const openTeamMatchEdit = (teamMatchID, myTeamMatchID) => {
        props.navigation.navigate("TeamMatchEditor", {
            teamMatchID,
            myTeamMatchID,
        })
    }
    const closeTeamMatchTableSelection = () => {
        setShowTeamMatchTableModal(true)
    }

    const openTeamMatchLink = (teamMatchID, tableID, sportName, scoringType) => {
        const teamMatchIndex = teamMatchList.findIndex((teamMatch) => teamMatch[1]?.id === teamMatchID);
        setSelectedTeamMatchID(teamMatchID)
        if (teamMatchIndex >= 0) {
            setSelectedTeamMatchIndex(teamMatchIndex)
        }
        setSelectedTableID(tableID)
        setTeamSportName(sportName)
        setTeamScoringType(scoringType)
        setShowLinkModal(true)
    }

    const goToKeepScore = (teamMatchID, tableNumber, sportName, scoringType) => {
        props.navigation.navigate("TeamMatchScoring", {
            isTeamMatch: true,
            teamMatchID: teamMatchID,
            tableNumber: tableNumber,
            name: "Table " + tableNumber,
            sportName: sportName,
            scoringType: scoringType,
            ownerID: getUserPath() || "",
        })
    }

    async function loadTeamMatches() {
        setDoneLoading(false)
        setTeamMatchList(await getMyTeamMatches(getUserPath()))
        setDoneLoading(true)
    }

    useEffect(() => {
        props.navigation.setOptions({
            headerRight: () => (
                <HeaderActions
                    navigation={props.navigation}
                    action={<HeaderIconButton label={i18n.t("createOne")} onPress={() => {
                        setShowNewTeamMatchModal(true)
                    }} />}
                />
            ),
        });
        loadTeamMatches()


    }, [])

    useFocusEffect(
        React.useCallback(() => {
            loadTeamMatches()
        }, [])
    )

    if (doneLoading) {
        return (
            <NativeBaseProvider theme={openScoreboardTheme}>

                <View height={"100%"} width={"100%"}  >
                    <View flex={1}>
                        {
                            teamMatchList.length > 0 ?
                                <View flex={1}>
                                    <View
                                        backgroundColor={"white"}
                                        borderBottomColor={"gray.200"}
                                        borderBottomWidth={1}
                                        padding={4}
                                    >
                                        <Text color={"gray.900"} fontSize={"xl"} fontWeight={"bold"}>
                                            {i18n.t("myTeamMatches")}
                                        </Text>
                                        <Text color={"gray.600"} fontSize={"sm"} marginTop={1}>
                                            Search by team name and sort team events by date.
                                        </Text>
                                        <View flexDirection={{ base: "column", md: "row" }} marginTop={3}>
                                            <View flex={1} marginRight={{ base: 0, md: 2 }}>
                                                <Input
                                                    InputLeftElement={(
                                                        <View marginLeft={3}>
                                                            <MaterialCommunityIcons name="magnify" size={20} color={"#6B7280"} />
                                                        </View>
                                                    )}
                                                    onChangeText={setTeamMatchSearch}
                                                    placeholder={"Search by team name"}
                                                    value={teamMatchSearch}
                                                />
                                            </View>
                                            <View marginLeft={{ base: 0, md: 2 }} marginTop={{ base: 3, md: 0 }} minWidth={{ base: "100%", md: 220 }}>
                                                <Select selectedValue={teamMatchSort} onValueChange={setTeamMatchSort}>
                                                    {teamMatchSortOptions.map((option) => (
                                                        <Select.Item key={option.value} label={option.label} value={option.value} />
                                                    ))}
                                                </Select>
                                            </View>
                                        </View>
                                        <Text color={"gray.500"} fontSize={"xs"} marginTop={2}>
                                            Showing {filteredTeamMatches.length} of {teamMatchList.length} team match{teamMatchList.length === 1 ? "" : "es"}.
                                        </Text>
                                    </View>
                                    {filteredTeamMatches.length > 0 ? (
                                        <FlatList
                                            data={filteredTeamMatches}
                                            keyExtractor={(item) => { return item[0] }}
                                            renderItem={(item) => {
                                                return (

                                                    <TeamMatchItem {...props}
                                                        goToKeepScore={goToKeepScore}
                                                        openTeamMatchLink={openTeamMatchLink}
                                                        openTeamMatchEdit={openTeamMatchEdit}
                                                        openTeamMatchTableSelection={openTeamMatchTableSelection}
                                                        reloadTeamMatches={loadTeamMatches}
                                                        {...item}></TeamMatchItem>

                                                )

                                            }}
                                        ></FlatList>
                                    ) : (
                                        <View alignItems={"center"} justifyContent={"center"} padding={6}>
                                            <Text color={"gray.900"} fontSize={"xl"} fontWeight={"bold"}>No team matches match your search.</Text>
                                            <Button marginTop={3} onPress={() => setTeamMatchSearch("")} variant={"outline"}>
                                                <Text color={"blue.700"} fontWeight={"bold"}>Clear search</Text>
                                            </Button>
                                        </View>
                                    )}
                                </View>
                                :

                                <View justifyContent={"center"} alignItems="center">
                                    <View>
                                        <Text fontSize={"xl"} fontWeight="bold">{i18n.t("noTeamMatches")}</Text>
                                        <View padding={2}>
                                            <Button
                                                onPress={() => {
                                                    setShowNewTeamMatchModal(true)
                                                }}
                                            >
                                                <Text color={openScoreboardButtonTextColor}>{i18n.t("createOne")}</Text>
                                            </Button>
                                        </View>
                                    </View>
                                </View>
                        }
                    </View>





                    <NewTeamMatchModal isOpen={showNewTeamMatchModal} onClose={(reload = true) => {
                        setShowNewTeamMatchModal(false)
                        if (reload === true) {
                            loadTeamMatches()
                        }
                    }} ></NewTeamMatchModal>
                    {
                        showTeamMatchTableModal ?
                            <SelectTeamMatchTableModal
                                openTeamMatchLink={openTeamMatchLink}
                                {...teamMatchList[selectedTeamMatchIndex][1]}
                                teamMatchID={selectedTeamMatchID}
                                isOpen={showTeamMatchTableModal}
                                goToKeepScore={goToKeepScore}
                                onClose={(reload = true) => {
                                    setShowTeamMatchTableModal(false)
                                    if (reload === true) {
                                        loadTeamMatches()
                                    }
                                }}
                            ></SelectTeamMatchTableModal>
                            : null
                    }

                    {
                        showLinkModal ?
                            <TeamMatchLinkModal isOpen={showLinkModal}
                                tableID={selectedTableID}
                                {...teamMatchList[selectedTeamMatchIndex][1]}
                                onClose={() => {
                                    setShowLinkModal(false)
                                }} isTeamMatch={true}  ></TeamMatchLinkModal>

                            : null
                    }
                </View>

            </NativeBaseProvider>


        )
    }
    else {
        return <LoadingPage></LoadingPage>
    }

}
