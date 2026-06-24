


import React, { useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useWindowDimensions } from 'react-native';
import { Button, Input, View, NativeBaseProvider, ScrollView, Text } from 'native-base';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getUserPath } from '../database';
import LoadingPage from './LoadingPage';
import { openScoreboardButtonTextColor } from "../openscoreboardtheme";
import { openScoreboardTheme } from "../openscoreboardtheme";
import { getMyTeams } from './functions/teams';
import { subscribeToTeamCompetitionIndex } from './functions/teamCompetitions';
import { NewTeamModal } from './modals/NewTeamModal';
import { TeamItem } from './listitems/TeamItem';
import i18n from './translations/translate';
import { HeaderActions, HeaderIconButton } from './components/HeaderActions';

function getTeamName(team = {}) {
    return team.teamName || team.name || "Unnamed team";
}

function getPlayerSearchText(players = {}) {
    return Object.values(players || {}).map((player: any) => {
        return [
            player?.firstName || "",
            player?.lastName || "",
            player?.name || "",
        ].filter(Boolean).join(" ");
    }).join(" ");
}

function getCompetitionTitle(competition = {}) {
    return competition?.data?.title || competition?.title || "";
}

export default function MyTeams(props) {

    let [teamList, setTeamList] = useState([])
    let [doneLoading, setDoneLoading] = useState(false)
    let [showNewTeamModal, setShowNewTeamModal] = useState(false)
    let [isEditingTeam, setIsEditingTeam] = useState(false)
    let [editingTeamID, setEditingTeamID] = useState("")
    let [editingMyTeamID, setEditingMyTeamID] = useState("")
    let [teamSearch, setTeamSearch] = useState("")
    let [teamCompetitionMap, setTeamCompetitionMap] = useState<any>({})
    const { width } = useWindowDimensions()
    const useTwoColumns = width >= 760
    const teamIDs = useMemo(() => {
        return teamList.map(([, team]: any) => team?.id).filter(Boolean);
    }, [teamList]);
    const teamIDKey = teamIDs.join("|");
    const filteredTeamList = useMemo(() => {
        const searchText = teamSearch.trim().toLowerCase();
        if (!searchText) {
            return teamList;
        }

        return teamList.filter(([, team]: any) => {
            const linkedCompetitions = teamCompetitionMap[team?.id] || [];
            const searchableText = [
                getTeamName(team),
                getPlayerSearchText(team?.players),
                linkedCompetitions.map(getCompetitionTitle).join(" "),
            ].join(" ").toLowerCase();

            return searchableText.includes(searchText);
        });
    }, [teamCompetitionMap, teamList, teamSearch]);

    async function loadTeams() {
        setDoneLoading(false)
        let myTeams = await getMyTeams(getUserPath())
        setTeamList(myTeams)
        setDoneLoading(true)
    }

    const openEditTeam = (teamID, myTeamID) => {
        props.navigation.navigate("TeamEditor", {
            teamID,
            myTeamID,
        })
    }
    const openCompetition = (competitionID) => {
        props.navigation.navigate("CompetitionEditor", {
            competitionID,
        })
    }
    const closeEditTeam = () => {
        setIsEditingTeam(false)
        setEditingTeamID("")
        setShowNewTeamModal(false)
    }



    useEffect(() => {
        props.navigation.setOptions({
            headerRight: () => (
                <HeaderActions
                    navigation={props.navigation}
                    action={<HeaderIconButton label={i18n.t("createOne")} onPress={() => {
                        setEditingMyTeamID("")
                        setEditingTeamID("")
                        setIsEditingTeam(false)

                        setShowNewTeamModal(true)
                    }} />}
                />
            ),
        });
    }, [])

    useFocusEffect(
        React.useCallback(() => {
            loadTeams()
        }, [])
    )

    useEffect(() => {
        if (!doneLoading || teamIDs.length === 0) {
            setTeamCompetitionMap({});
            return;
        }

        return subscribeToTeamCompetitionIndex(teamIDs, setTeamCompetitionMap);
    }, [doneLoading, teamIDKey])

    if (doneLoading) {
        return (
            <NativeBaseProvider theme={openScoreboardTheme}>
                <View width={"100%"} height={"100%"} >
                    <View flex={1}>
                        {
                            teamList.length > 0 ?
                                <ScrollView>
                                    <View
                                        alignSelf={"center"}
                                        maxWidth={1180}
                                        paddingX={3}
                                        paddingTop={4}
                                        width={"100%"}
                                    >
                                        <View marginBottom={4}>
                                            <Text color={"gray.900"} fontSize={"xl"} fontWeight={"bold"}>
                                                Manage your teams
                                            </Text>
                                            <Text color={"gray.600"} fontSize={"sm"} marginTop={1}>
                                                These are the teams saved to your account. Open a team to edit its roster, manager link, jersey color, and competition access.
                                            </Text>
                                        </View>
                                        <Input
                                            backgroundColor={"white"}
                                            borderColor={"gray.300"}
                                            borderRadius={8}
                                            InputLeftElement={(
                                                <View marginLeft={3}>
                                                    <MaterialCommunityIcons name="magnify" size={20} color={"#6B7280"} />
                                                </View>
                                            )}
                                            onChangeText={setTeamSearch}
                                            placeholder={"Search teams, roster players, or competitions"}
                                            value={teamSearch}
                                        />
                                        <Text color={"gray.500"} fontSize={"xs"} marginTop={2}>
                                            Search by team name, roster player, or linked competition. Showing {filteredTeamList.length} of {teamList.length} team{teamList.length === 1 ? "" : "s"}.
                                        </Text>
                                    </View>
                                    <View
                                        alignSelf={"center"}
                                        flexDirection={"row"}
                                        flexWrap={"wrap"}
                                        maxWidth={1180}
                                        paddingY={2}
                                        width={"100%"}
                                    >
                                        {filteredTeamList.length === 0 ? (
                                            <View alignItems={"center"} padding={6} width={"100%"}>
                                                <Text color={"gray.700"} fontSize={"md"} fontWeight={"bold"}>No teams match your search.</Text>
                                                <Button marginTop={3} onPress={() => setTeamSearch("")} variant={"outline"}>
                                                    <Text color={"blue.700"} fontWeight={"bold"}>Clear search</Text>
                                                </Button>
                                            </View>
                                        ) : filteredTeamList.map((team, index) => {
                                            return (
                                                <View key={team[0]} width={useTwoColumns ? "50%" : "100%"}>
                                                    <TeamItem
                                                        competitions={teamCompetitionMap[team?.[1]?.id] || []}
                                                        item={team}
                                                        index={index}
                                                        onDelete={(deletedMyTeamID) => {
                                                            setTeamList([...teamList.filter((myTeam) => {
                                                                return myTeam[0] !== deletedMyTeamID
                                                            })])
                                                        }}
                                                        onOpenCompetition={openCompetition}
                                                        openEditTeam={openEditTeam}
                                                        closeEditTeam={closeEditTeam}
                                                    />
                                                </View>
                                            )
                                        })}
                                    </View>
                                </ScrollView>
                                :
                                <View justifyContent={"center"} alignItems="center">
                                    <View>
                                        <Text fontSize={"xl"} fontWeight="bold">{i18n.t("noTeams")}</Text>
                                        <View padding={2}>
                                            <Button
                                                onPress={() => {
                                                    setShowNewTeamModal(true)
                                                }}
                                            >
                                                <Text color={openScoreboardButtonTextColor}>{i18n.t("createOne")}</Text>
                                            </Button>
                                        </View>
                                    </View>
                                </View>
                        }

                    </View>
                    {
                        showNewTeamModal ?
                            <NewTeamModal

                                isEditingTeam={isEditingTeam}
                                editingTeamID={editingTeamID}
                                editingMyTeamID={editingMyTeamID}
                                onClose={(reload = true) => {
                                    setShowNewTeamModal(false)
                                    if (reload === true) {
                                        loadTeams()
                                    }
                                }} isOpen={showNewTeamModal}></NewTeamModal>
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
