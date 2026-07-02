


import React, { useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useWindowDimensions } from 'react-native';
import { View, NativeBaseProvider, ScrollView } from 'native-base';
import { getUserPath } from '../database';
import LoadingPage from './LoadingPage';
import { openScoreboardTheme } from "../openscoreboardtheme";
import { getMyTeams } from './functions/teams';
import { subscribeToTeamCompetitionIndex } from './functions/teamCompetitions';
import { NewTeamModal } from './modals/NewTeamModal';
import { TeamItem } from './listitems/TeamItem';
import i18n from './translations/translate';
import { HeaderActions, HeaderIconButton } from './components/HeaderActions';
import { EmptyState, ListPageHeader, ListToolbar, PageScaffold } from './components/ListPage';
import { compareByCreatedDesc } from './functions/listSorting';

const teamSortOptions = [
    { label: "Recently created", value: "createdDesc" },
    { label: "Name A-Z", value: "nameAsc" },
    { label: "Name Z-A", value: "nameDesc" },
    { label: "Most roster players", value: "playersDesc" },
];

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

function sortTeams(teams, sortBy) {
    return [...teams].sort((firstEntry: any, secondEntry: any) => {
        const firstTeam = firstEntry?.[1] || {};
        const secondTeam = secondEntry?.[1] || {};
        const firstName = getTeamName(firstTeam).toLowerCase();
        const secondName = getTeamName(secondTeam).toLowerCase();

        if (sortBy === "nameAsc") {
            return firstName.localeCompare(secondName);
        }

        if (sortBy === "nameDesc") {
            return secondName.localeCompare(firstName);
        }

        if (sortBy === "playersDesc") {
            return Object.keys(secondTeam.players || {}).length - Object.keys(firstTeam.players || {}).length || firstName.localeCompare(secondName);
        }

        return compareByCreatedDesc(firstEntry, secondEntry) || firstName.localeCompare(secondName);
    });
}

export default function MyTeams(props) {

    let [teamList, setTeamList] = useState([])
    let [doneLoading, setDoneLoading] = useState(false)
    let [showNewTeamModal, setShowNewTeamModal] = useState(false)
    let [isEditingTeam, setIsEditingTeam] = useState(false)
    let [editingTeamID, setEditingTeamID] = useState("")
    let [editingMyTeamID, setEditingMyTeamID] = useState("")
    let [teamSearch, setTeamSearch] = useState("")
    let [teamSort, setTeamSort] = useState("createdDesc")
    let [teamCompetitionMap, setTeamCompetitionMap] = useState<any>({})
    const { width } = useWindowDimensions()
    const useTwoColumns = width >= 760
    const teamIDs = useMemo(() => {
        return teamList.map(([, team]: any) => team?.id).filter(Boolean);
    }, [teamList]);
    const teamIDKey = teamIDs.join("|");
    const visibleTeamList = useMemo(() => {
        const searchText = teamSearch.trim().toLowerCase();
        const filteredTeams = searchText ? teamList.filter(([, team]: any) => {
            const linkedCompetitions = teamCompetitionMap[team?.id] || [];
            const searchableText = [
                getTeamName(team),
                getPlayerSearchText(team?.players),
                linkedCompetitions.map(getCompetitionTitle).join(" "),
            ].join(" ").toLowerCase();

            return searchableText.includes(searchText);
        }) : teamList;

        return sortTeams(filteredTeams, teamSort);
    }, [teamCompetitionMap, teamList, teamSearch, teamSort]);

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
                                    <PageScaffold>
                                        <ListPageHeader
                                            actionIcon={"plus"}
                                            actionLabel={i18n.t("createOne")}
                                            description={"These are the teams saved to your account. Open a team to edit its roster, manager link, jersey color, and competition access."}
                                            onAction={() => {
                                                setEditingMyTeamID("")
                                                setEditingTeamID("")
                                                setIsEditingTeam(false)
                                                setShowNewTeamModal(true)
                                            }}
                                            title={"Manage your teams"}
                                        />
                                        <ListToolbar
                                            countLabel={`Search by team name, roster player, or linked competition. Showing ${visibleTeamList.length} of ${teamList.length} team${teamList.length === 1 ? "" : "s"}.`}
                                            onSearchChange={setTeamSearch}
                                            onSortChange={setTeamSort}
                                            searchPlaceholder={"Search teams, roster players, or competitions"}
                                            searchValue={teamSearch}
                                            sortOptions={teamSortOptions}
                                            sortValue={teamSort}
                                        />
                                    <View
                                        flexDirection={"row"}
                                        flexWrap={"wrap"}
                                        paddingY={2}
                                        width={"100%"}
                                    >
                                        {visibleTeamList.length === 0 ? (
                                            <EmptyState
                                                actionLabel={"Clear search"}
                                                description={"Try another team name, roster player, or competition title."}
                                                icon={"account-search-outline"}
                                                onAction={() => setTeamSearch("")}
                                                title={"No teams match your search"}
                                            />
                                        ) : visibleTeamList.map((team, index) => {
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
                                    </PageScaffold>
                                </ScrollView>
                                :
                                <PageScaffold>
                                    <ListPageHeader
                                        actionIcon={"plus"}
                                        actionLabel={i18n.t("createOne")}
                                        description={"Create teams for team matches, team competitions, and reusable roster management."}
                                        onAction={() => setShowNewTeamModal(true)}
                                        title={i18n.t("myTeams")}
                                    />
                                    <EmptyState
                                        actionLabel={i18n.t("createOne")}
                                        description={"Create a team to manage rosters, logos, jersey colors, and manager links."}
                                        icon={"account-group-outline"}
                                        onAction={() => setShowNewTeamModal(true)}
                                        title={i18n.t("noTeams")}
                                    />
                                </PageScaffold>
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
