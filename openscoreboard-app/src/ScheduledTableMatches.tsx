import React, { useEffect, useMemo, useState } from 'react';
import { View, FlatList, NativeBaseProvider } from 'native-base';

import LoadingPage from './LoadingPage';

import { getScheduledTableMatches } from './functions/tables';
import { openScoreboardTheme } from "../openscoreboardtheme";
import { EditScheduledMatchModal } from './modals/EditScheduledMatchModal';
import { NewScheduledMatchModal } from './modals/NewScheduledMatchModal';
import { ScheduledMatchItem } from './listitems/ScheduledMatchItem';
import i18n from './translations/translate';
import { HeaderActions, HeaderIconButton } from './components/HeaderActions';
import { EmptyState, ListPageHeader, ListToolbar, PageScaffold } from './components/ListPage';

const scheduledMatchSortOptions = [
    { label: "Upcoming first", value: "dateAsc" },
    { label: "Latest first", value: "dateDesc" },
    { label: "Player A-Z", value: "playerAsc" },
];

function getScheduledMatchDateValue(match = {}) {
    const parsedDate = Date.parse(match.startTime || "");
    return Number.isNaN(parsedDate) ? 0 : parsedDate;
}

function getScheduledMatchSearchText(scheduledMatchEntry) {
    const [, scheduledMatch = {}] = scheduledMatchEntry || [];

    return [
        scheduledMatch.playerA,
        scheduledMatch.playerB,
        scheduledMatch.eventName,
        scheduledMatch.roundName,
        scheduledMatch.roundLabel,
        scheduledMatch.matchDetails,
        scheduledMatch.startTime ? new Date(scheduledMatch.startTime).toLocaleString() : "",
    ].filter(Boolean).join(" ").toLowerCase();
}

function sortScheduledMatches(scheduledMatches, sortBy) {
    return [...scheduledMatches].sort((firstEntry, secondEntry) => {
        const firstMatch = firstEntry?.[1] || {};
        const secondMatch = secondEntry?.[1] || {};
        const dateComparison = getScheduledMatchDateValue(firstMatch) - getScheduledMatchDateValue(secondMatch);

        if (sortBy === "dateDesc") {
            return -dateComparison;
        }

        if (sortBy === "playerAsc") {
            const firstName = `${firstMatch.playerA || ""} ${firstMatch.playerB || ""}`.toLowerCase();
            const secondName = `${secondMatch.playerA || ""} ${secondMatch.playerB || ""}`.toLowerCase();
            return firstName.localeCompare(secondName) || dateComparison;
        }

        return dateComparison;
    });
}

export default function ScheduledTableMatches(props) {
    let [selectedIndex, setSelectedIndex] = useState("")
    let [loadingDone, setLoadingDone] = useState(false)
    let [scheduledMatches, setScheduledMatches] = useState([])
    let [showCreateNewScheduledMatch, setShowCreateNewScheduledMatch] = useState(false)
    let [showEditScheduledMatch, setShowEditScheduledMatch] = useState(false)
    let [editMatch, setEditMatch] = useState({})
    let [scheduledMatchSearch, setScheduledMatchSearch] = useState("")
    let [scheduledMatchSort, setScheduledMatchSort] = useState("dateAsc")
    const visibleScheduledMatches = useMemo(() => {
        const normalizedSearch = scheduledMatchSearch.trim().toLowerCase();
        const filteredMatches = normalizedSearch ?
            scheduledMatches.filter((scheduledMatch) => getScheduledMatchSearchText(scheduledMatch).includes(normalizedSearch)) :
            scheduledMatches;

        return sortScheduledMatches(filteredMatches, scheduledMatchSort);
    }, [scheduledMatches, scheduledMatchSearch, scheduledMatchSort]);


    async function loadScheduledMatches() {
        setLoadingDone(false)
        let matches = await getScheduledTableMatches(props.route.params.tableID)
        setScheduledMatches(matches)
        setLoadingDone(true)
    }

    useEffect(() => {
        loadScheduledMatches()

        props.navigation.setOptions({
            headerRight: () => (
                <HeaderActions
                    navigation={props.navigation}
                    action={<HeaderIconButton label={i18n.t("createOne")} onPress={() => {
                        setShowCreateNewScheduledMatch(true)
                    }} />}
                />
            ),
        });
    }, [])
    if (loadingDone) {
        return (
            <NativeBaseProvider theme={openScoreboardTheme}>
                <View backgroundColor={"gray.50"} height={"100%"} width={"100%"}>
                    <PageScaffold>
                        <ListPageHeader
                            actionIcon={"calendar-plus"}
                            actionLabel={i18n.t("createOne")}
                            description={"Create and manage the scheduled match queue for this table."}
                            onAction={() => setShowCreateNewScheduledMatch(true)}
                            title={i18n.t("scheduledMatches")}
                        />
                        {scheduledMatches.length > 0 ? (
                            <ListToolbar
                                countLabel={`Showing ${visibleScheduledMatches.length} of ${scheduledMatches.length} scheduled match${scheduledMatches.length === 1 ? "" : "es"}.`}
                                onSearchChange={setScheduledMatchSearch}
                                onSortChange={setScheduledMatchSort}
                                searchPlaceholder={"Search scheduled matches by player, event, or round"}
                                searchValue={scheduledMatchSearch}
                                sortOptions={scheduledMatchSortOptions}
                                sortValue={scheduledMatchSort}
                            />
                        ) : null}
                        {scheduledMatches.length > 0 && visibleScheduledMatches.length > 0 ? (
                            <FlatList
                                contentContainerStyle={{ paddingBottom: 32 }}
                                data={visibleScheduledMatches}
                                keyExtractor={(item) => item?.[0]}
                                renderItem={(match) => {
                                    return (
                                        <ScheduledMatchItem reload={loadScheduledMatches} {...props} setShowEditScheduledMatch={setShowEditScheduledMatch} setEditMatch={setEditMatch} {...match} ></ScheduledMatchItem>
                                    )
                                }}
                            />
                        ) : scheduledMatches.length > 0 ? (
                            <EmptyState
                                actionLabel={"Clear search"}
                                description={"Try another player name, event, round, or match detail."}
                                icon={"calendar-search"}
                                onAction={() => setScheduledMatchSearch("")}
                                title={"No scheduled matches match your search"}
                            />
                        ) : (
                            <EmptyState
                                actionLabel={i18n.t("createOne")}
                                description={"Schedule a match so a scorekeeper can choose it from this table."}
                                icon={"calendar-plus"}
                                onAction={() => setShowCreateNewScheduledMatch(true)}
                                title={i18n.t("noScheduledTables")}
                            />
                        )}
                    </PageScaffold>

                    {
                        showCreateNewScheduledMatch ?
                            <NewScheduledMatchModal isOpen={showCreateNewScheduledMatch}
                                {...props}
                                onClose={(reload) => {
                                    setShowCreateNewScheduledMatch(false)
                                    if (reload) {
                                        loadScheduledMatches()
                                    }
                                }}></NewScheduledMatchModal>
                            : null
                    }


                    {
                        showEditScheduledMatch ?
                            <EditScheduledMatchModal

                                isOpen={showEditScheduledMatch}
                                {...props} {...editMatch}
                                onClose={(reload) => {
                                    setShowEditScheduledMatch(false)
                                    if (reload) {
                                        loadScheduledMatches()
                                    }
                                }} />
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
