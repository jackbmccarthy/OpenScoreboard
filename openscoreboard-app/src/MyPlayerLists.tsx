

import React, { useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useWindowDimensions } from 'react-native';
import { View, NativeBaseProvider, ScrollView, } from 'native-base';
import { openScoreboardTheme } from "../openscoreboardtheme";
import { getMyPlayerLists } from './functions/players';
import LoadingPage from './LoadingPage';
import { AddPlayerListModal } from './modals/AddPlayerListModal';
import { PlayerListItem } from './listitems/PlayerListItem';
import i18n from './translations/translate';
import { HeaderActions, HeaderIconButton } from './components/HeaderActions';
import { EmptyState, ListPageHeader, ListToolbar, PageScaffold } from './components/ListPage';
import { compareByCreatedDesc } from './functions/listSorting';

const playerListSortOptions = [
    { label: "Recently created", value: "createdDesc" },
    { label: "Name A-Z", value: "nameAsc" },
    { label: "Name Z-A", value: "nameDesc" },
    { label: "Most players first", value: "playersDesc" },
    { label: "Recently modified", value: "modifiedDesc" },
];

function getPlayerListSearchText(playerListEntry) {
    const [myPlayerListID, playerList = {}] = playerListEntry || [];

    return [
        myPlayerListID,
        playerList.id,
        playerList.playerListName,
        playerList.playerCount ? `${playerList.playerCount} players` : "",
    ].filter(Boolean).join(" ").toLowerCase();
}

function getPlayerListModifiedValue(playerList = {}) {
    const parsedDate = Date.parse(playerList.modifiedOn || playerList.createdOn || "");
    return Number.isNaN(parsedDate) ? 0 : parsedDate;
}

function sortPlayerLists(playerLists, sortBy) {
    return [...playerLists].sort((firstEntry, secondEntry) => {
        const firstList = firstEntry?.[1] || {};
        const secondList = secondEntry?.[1] || {};
        const firstName = `${firstList.playerListName || ""}`.toLowerCase();
        const secondName = `${secondList.playerListName || ""}`.toLowerCase();

        if (sortBy === "nameDesc") {
            return secondName.localeCompare(firstName);
        }

        if (sortBy === "nameAsc") {
            return firstName.localeCompare(secondName);
        }

        if (sortBy === "playersDesc") {
            return Number(secondList.playerCount || 0) - Number(firstList.playerCount || 0) || firstName.localeCompare(secondName);
        }

        if (sortBy === "modifiedDesc") {
            return getPlayerListModifiedValue(secondList) - getPlayerListModifiedValue(firstList) || firstName.localeCompare(secondName);
        }

        return compareByCreatedDesc(firstEntry, secondEntry) || firstName.localeCompare(secondName);
    });
}

export default function MyPlayerLists(props) {
    let [doneLoading, setDoneLoading] = useState(false)
    let [myPlayerLists, setMyPlayerLists] = useState([])
    let [showNewPlayerList, setShowNewPlayerList] = useState(false)
    let [playerListSearch, setPlayerListSearch] = useState("")
    let [playerListSort, setPlayerListSort] = useState("createdDesc")
    const { width } = useWindowDimensions()
    const useTwoColumns = width >= 760
    const visiblePlayerLists = useMemo(() => {
        const normalizedSearch = playerListSearch.trim().toLowerCase();
        const filteredLists = normalizedSearch ?
            myPlayerLists.filter((playerList) => getPlayerListSearchText(playerList).includes(normalizedSearch)) :
            myPlayerLists;

        return sortPlayerLists(filteredLists, playerListSort);
    }, [myPlayerLists, playerListSearch, playerListSort]);

    async function loadMyPlayerList() {
        setDoneLoading(false)
        let playerLists = await getMyPlayerLists()
        setMyPlayerLists(playerLists)
        setDoneLoading(true)
    }

    useEffect(() => {



        props.navigation.setOptions({
            headerRight: () => (
                <HeaderActions
                    navigation={props.navigation}
                    action={<HeaderIconButton label={i18n.t("createOne")} onPress={() => {
                        setShowNewPlayerList(true)
                    }} />}
                />
            ),
        });
    }, [])

    useFocusEffect(
        React.useCallback(() => {
            loadMyPlayerList()
        }, [])
    )

    if (doneLoading) {
        return (
            <NativeBaseProvider theme={openScoreboardTheme}>

                <View width={"100%"} height={"100%"}>
                    <View flex={1}>
                        <ScrollView backgroundColor={"gray.50"} contentContainerStyle={{ paddingBottom: 32 }}>
                            <PageScaffold>
                                <ListPageHeader
                                    actionIcon={"plus"}
                                    actionLabel={i18n.t("createOne")}
                                    description={"Manage reusable player lists for imports, table setup, competitions, self registration, flags, images, and ratings."}
                                    onAction={() => setShowNewPlayerList(true)}
                                    title={i18n.t("playerLists")}
                                />
                                {myPlayerLists.length > 0 ? (
                                    <ListToolbar
                                        countLabel={`Showing ${visiblePlayerLists.length} of ${myPlayerLists.length} player list${myPlayerLists.length === 1 ? "" : "s"}.`}
                                        onSearchChange={setPlayerListSearch}
                                        onSortChange={setPlayerListSort}
                                        searchPlaceholder={"Search player lists"}
                                        searchValue={playerListSearch}
                                        sortOptions={playerListSortOptions}
                                        sortValue={playerListSort}
                                    />
                                ) : null}
                                {myPlayerLists.length > 0 && visiblePlayerLists.length > 0 ? (
                                    <View
                                        flexDirection={"row"}
                                        flexWrap={"wrap"}
                                        paddingY={2}
                                        width={"100%"}
                                    >
                                        {visiblePlayerLists.map((playerList, index) => {
                                            return (
                                                <View key={playerList[0]} width={useTwoColumns ? "50%" : "100%"}>
                                                    <PlayerListItem
                                                        item={playerList}
                                                        index={index}
                                                        onDelete={(myPlayerListID) => {
                                                            let newList = myPlayerLists.filter((playerList) => {
                                                                return playerList[0] !== myPlayerListID
                                                            })
                                                            setMyPlayerLists(newList)
                                                        }}
                                                        {...props}
                                                    />
                                                </View>
                                            )
                                        })}
                                    </View>
                                ) : myPlayerLists.length > 0 ? (
                                    <EmptyState
                                        actionLabel={"Clear search"}
                                        description={"Try a different player list name or player count."}
                                        icon={"account-search-outline"}
                                        onAction={() => setPlayerListSearch("")}
                                        title={"No player lists match your search"}
                                    />
                                ) : (
                                    <EmptyState
                                        actionLabel={i18n.t("createOne")}
                                        description={"Create a player list to import players, connect tables, run competitions, or share self registration."}
                                        icon={"account-multiple-plus-outline"}
                                        onAction={() => setShowNewPlayerList(true)}
                                        title={i18n.t("noPlayerLists")}
                                    />
                                )}
                            </PageScaffold>
                        </ScrollView>

                    </View>


                    {
                        showNewPlayerList ?
                            <AddPlayerListModal {...props} isOpen={showNewPlayerList} onClose={(reload = true) => {
                                setShowNewPlayerList(false)
                                if (reload) {
                                    loadMyPlayerList()
                                }
                            }} ></AddPlayerListModal>
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
