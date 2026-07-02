


import React, { useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Checkbox, View, NativeBaseProvider, FlatList, Text } from 'native-base';
import { getUserPath } from '../database';
import LoadingPage from './LoadingPage';
import { openScoreboardTheme } from "../openscoreboardtheme";

import getMyTeamMatches, { archiveTeamMatch } from './functions/teammatches';
import { SelectTeamMatchTableModal } from './modals/SelectTeamMatchTableModal';
import { TeamMatchItem } from './listitems/TeamMatchItem';
import { NewTeamMatchModal } from './modals/NewTeamMatchModal';
import { TeamMatchLinkModal } from './modals/TeamMatchLinkModal';
import i18n from './translations/translate';
import { HeaderActions, HeaderIconButton } from './components/HeaderActions';
import { BulkActionToolbar, EmptyState, ListPageHeader, ListToolbar, PageScaffold } from './components/ListPage';
import { compareByCreatedDesc } from './functions/listSorting';

const teamMatchSortOptions = [
    { label: "Recently created", value: "createdDesc" },
    { label: "Match date newest", value: "dateDesc" },
    { label: "Match date oldest", value: "dateAsc" },
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

function sortTeamMatches(teamMatches = [], sortBy = "createdDesc") {
    return [...teamMatches].sort((firstEntry, secondEntry) => {
        const firstMatch = firstEntry?.[1] || {};
        const secondMatch = secondEntry?.[1] || {};
        const dateComparison = getTeamMatchDateValue(firstMatch) - getTeamMatchDateValue(secondMatch);
        const firstName = `${firstMatch.teamAName || ""} ${firstMatch.teamBName || ""}`;
        const secondName = `${secondMatch.teamAName || ""} ${secondMatch.teamBName || ""}`;

        if (sortBy === "dateAsc" || sortBy === "dateDesc") {
            if (dateComparison === 0) {
                return firstName.localeCompare(secondName);
            }
            return sortBy === "dateAsc" ? dateComparison : -dateComparison;
        }

        return compareByCreatedDesc(firstEntry, secondEntry) || firstName.localeCompare(secondName);
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
    let [teamMatchSort, setTeamMatchSort] = useState("createdDesc")
    let [selectedTeamMatchIDs, setSelectedTeamMatchIDs] = useState([])
    let [confirmBulkArchive, setConfirmBulkArchive] = useState(false)
    let [bulkArchiveLoading, setBulkArchiveLoading] = useState(false)
    const filteredTeamMatches = useMemo(() => {
        const normalizedSearch = teamMatchSearch.trim().toLowerCase();
        const filteredMatches = normalizedSearch ?
            teamMatchList.filter((teamMatch) => getTeamMatchSearchText(teamMatch).includes(normalizedSearch)) :
            teamMatchList;

        return sortTeamMatches(filteredMatches, teamMatchSort);
    }, [teamMatchList, teamMatchSearch, teamMatchSort]);
    const selectedTeamMatchSet = useMemo(() => new Set(selectedTeamMatchIDs), [selectedTeamMatchIDs]);

    const toggleTeamMatchSelection = (myTeamMatchID) => {
        setConfirmBulkArchive(false)
        setSelectedTeamMatchIDs((currentIDs) => {
            if (currentIDs.includes(myTeamMatchID)) {
                return currentIDs.filter((id) => id !== myTeamMatchID)
            }

            return [...currentIDs, myTeamMatchID]
        })
    }

    const selectVisibleTeamMatches = () => {
        setConfirmBulkArchive(false)
        setSelectedTeamMatchIDs((currentIDs) => {
            const nextIDs = new Set(currentIDs)
            filteredTeamMatches.forEach((teamMatch) => {
                if (teamMatch?.[0]) {
                    nextIDs.add(teamMatch[0])
                }
            })
            return Array.from(nextIDs)
        })
    }

    const clearSelectedTeamMatches = () => {
        setConfirmBulkArchive(false)
        setSelectedTeamMatchIDs([])
    }

    const archiveSelectedTeamMatches = async () => {
        if (selectedTeamMatchIDs.length === 0) {
            return
        }

        setBulkArchiveLoading(true)
        try {
            await Promise.all(selectedTeamMatchIDs.map((myTeamMatchID) => archiveTeamMatch(myTeamMatchID)))
            clearSelectedTeamMatches()
            await loadTeamMatches()
        }
        finally {
            setBulkArchiveLoading(false)
        }
    }

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
        const nextTeamMatches = await getMyTeamMatches(getUserPath())
        setTeamMatchList(nextTeamMatches)
        setSelectedTeamMatchIDs((currentIDs) => {
            const activeIDs = new Set(nextTeamMatches.map((teamMatch) => teamMatch?.[0]).filter(Boolean))
            return currentIDs.filter((id) => activeIDs.has(id))
        })
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
                                <PageScaffold>
                                    <ListPageHeader
                                        actionIcon={"plus"}
                                        actionLabel={i18n.t("createOne")}
                                        description={"Manage team contests, table assignments, score-only events, public views, and scoring links."}
                                        onAction={() => setShowNewTeamMatchModal(true)}
                                        title={i18n.t("myTeamMatches")}
                                    />
                                    <ListToolbar
                                        countLabel={`Showing ${filteredTeamMatches.length} of ${teamMatchList.length} team match${teamMatchList.length === 1 ? "" : "es"}.`}
                                        onSearchChange={setTeamMatchSearch}
                                        onSortChange={setTeamMatchSort}
                                        searchPlaceholder={"Search by team name"}
                                        searchValue={teamMatchSearch}
                                        sortOptions={teamMatchSortOptions}
                                        sortValue={teamMatchSort}
                                    />
                                    <BulkActionToolbar
                                        actionIcon={"archive-outline"}
                                        actionLabel={"Archive selected"}
                                        confirmActionLabel={"Archive team matches"}
                                        confirmMessage={`Archive ${selectedTeamMatchIDs.length} selected team match${selectedTeamMatchIDs.length === 1 ? "" : "es"}? They will be removed from this active list and kept in archived team matches.`}
                                        isConfirming={confirmBulkArchive}
                                        isLoading={bulkArchiveLoading}
                                        onAction={() => setConfirmBulkArchive(true)}
                                        onCancelConfirm={() => setConfirmBulkArchive(false)}
                                        onClearSelection={clearSelectedTeamMatches}
                                        onConfirmAction={archiveSelectedTeamMatches}
                                        onSelectVisible={selectVisibleTeamMatches}
                                        selectedCount={selectedTeamMatchIDs.length}
                                        visibleCount={filteredTeamMatches.length}
                                    />
                                    {filteredTeamMatches.length > 0 ? (
                                        <FlatList
                                            data={filteredTeamMatches}
                                            keyExtractor={(item) => { return item[0] }}
                                            renderItem={(item) => {
                                                const myTeamMatchID = item.item?.[0]
                                                const isSelected = selectedTeamMatchSet.has(myTeamMatchID)
                                                return (
                                                    <View>
                                                        <View
                                                            alignItems={"center"}
                                                            backgroundColor={isSelected ? "blue.50" : "white"}
                                                            borderColor={isSelected ? "blue.200" : "gray.200"}
                                                            borderRadius={8}
                                                            borderWidth={1}
                                                            flexDirection={"row"}
                                                            marginX={3}
                                                            marginTop={2}
                                                            padding={3}
                                                        >
                                                            <Checkbox
                                                                accessibilityLabel={`Select ${item.item?.[1]?.teamAName || "Team A"} vs ${item.item?.[1]?.teamBName || "Team B"}`}
                                                                isChecked={isSelected}
                                                                onChange={() => toggleTeamMatchSelection(myTeamMatchID)}
                                                                value={myTeamMatchID}
                                                            >
                                                                <Text color={"gray.700"} fontSize={"sm"} fontWeight={"bold"}>
                                                                    Select for bulk actions
                                                                </Text>
                                                            </Checkbox>
                                                        </View>
                                                        <TeamMatchItem {...props}
                                                            goToKeepScore={goToKeepScore}
                                                            openTeamMatchLink={openTeamMatchLink}
                                                            openTeamMatchEdit={openTeamMatchEdit}
                                                            openTeamMatchTableSelection={openTeamMatchTableSelection}
                                                            reloadTeamMatches={loadTeamMatches}
                                                            {...item}></TeamMatchItem>
                                                    </View>

                                                )

                                            }}
                                        ></FlatList>
                                    ) : (
                                        <EmptyState
                                            actionLabel={"Clear search"}
                                            description={"Try searching by another team name."}
                                            icon={"account-search-outline"}
                                            onAction={() => setTeamMatchSearch("")}
                                            title={"No team matches match your search"}
                                        />
                                    )}
                                </PageScaffold>
                                :

                                <PageScaffold>
                                    <ListPageHeader
                                        actionIcon={"plus"}
                                        actionLabel={i18n.t("createOne")}
                                        description={"Create structured team matches or score-only team events."}
                                        onAction={() => setShowNewTeamMatchModal(true)}
                                        title={i18n.t("myTeamMatches")}
                                    />
                                    <EmptyState
                                        actionLabel={i18n.t("createOne")}
                                        description={"Create a team match to manage team score, player matches, tables, and public links."}
                                        icon={"account-group-outline"}
                                        onAction={() => setShowNewTeamMatchModal(true)}
                                        title={i18n.t("noTeamMatches")}
                                    />
                                </PageScaffold>
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
