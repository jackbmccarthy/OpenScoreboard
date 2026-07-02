

import React, { useEffect, useMemo, useState } from 'react';
import { View, NativeBaseProvider, ScrollView } from 'native-base';

import { openScoreboardTheme } from "../openscoreboardtheme";

import LoadingPage from './LoadingPage';
import { getMyDynamicURLs } from './functions/dynamicurls';
import { DynamicURLItem } from './listitems/DynamicURLItem';
import { CreateDynamicURLModal } from './modals/CreateDynamicURLModal';
import i18n from './translations/translate';
import { HeaderActions, HeaderIconButton } from './components/HeaderActions';
import { EmptyState, ListPageHeader, ListToolbar, PageScaffold } from './components/ListPage';
import { compareByCreatedDesc } from './functions/listSorting';

const dynamicURLSortOptions = [
    { label: "Recently created", value: "createdDesc" },
    { label: "Name A-Z", value: "nameAsc" },
    { label: "Name Z-A", value: "nameDesc" },
    { label: "Tables first", value: "tablesFirst" },
    { label: "Team matches first", value: "teamMatchesFirst" },
];

function getDynamicURLSearchText(dynamicURLEntry) {
    const [myDynamicURLID, dynamicURL = {}] = dynamicURLEntry || [];
    const targetType = dynamicURL.tableID ? "table" : dynamicURL.teammatchID ? "team match" : "unassigned";

    return [
        myDynamicURLID,
        dynamicURL.id,
        dynamicURL.dynamicURLName,
        dynamicURL.tableName,
        dynamicURL.teamAName,
        dynamicURL.teamBName,
        dynamicURL.scoreboardName,
        targetType,
    ].filter(Boolean).join(" ").toLowerCase();
}

function sortDynamicURLs(dynamicURLs, sortBy) {
    return [...dynamicURLs].sort((firstEntry, secondEntry) => {
        const firstURL = firstEntry?.[1] || {};
        const secondURL = secondEntry?.[1] || {};
        const firstName = `${firstURL.dynamicURLName || ""}`.toLowerCase();
        const secondName = `${secondURL.dynamicURLName || ""}`.toLowerCase();

        if (sortBy === "nameDesc") {
            return secondName.localeCompare(firstName);
        }

        if (sortBy === "nameAsc") {
            return firstName.localeCompare(secondName);
        }

        if (sortBy === "tablesFirst") {
            return Number(Boolean(secondURL.tableID)) - Number(Boolean(firstURL.tableID)) || firstName.localeCompare(secondName);
        }

        if (sortBy === "teamMatchesFirst") {
            return Number(Boolean(secondURL.teammatchID)) - Number(Boolean(firstURL.teammatchID)) || firstName.localeCompare(secondName);
        }

        return compareByCreatedDesc(firstEntry, secondEntry) || firstName.localeCompare(secondName);
    });
}

export default function MyDynamicURLs(props) {

    let [showNewDynamicURLModal, setShowNewDynamicURLModal] = useState(false)
    let [doneLoading, setDoneLoading] = useState(false)
    let [dynamicURLList, setDynamicURLList] = useState([])
    let [dynamicURLSearch, setDynamicURLSearch] = useState("")
    let [dynamicURLSort, setDynamicURLSort] = useState("createdDesc")
    const visibleDynamicURLs = useMemo(() => {
        const normalizedSearch = dynamicURLSearch.trim().toLowerCase();
        const filteredURLs = normalizedSearch ?
            dynamicURLList.filter((dynamicURL) => getDynamicURLSearchText(dynamicURL).includes(normalizedSearch)) :
            dynamicURLList;

        return sortDynamicURLs(filteredURLs, dynamicURLSort);
    }, [dynamicURLList, dynamicURLSearch, dynamicURLSort]);


    async function loadMyDynamicURLs() {
        setDoneLoading(false)
        let myURLs = await getMyDynamicURLs(true)
        setDynamicURLList(myURLs)
        setDoneLoading(true)
    }

    useEffect(() => {



        props.navigation.setOptions({
            headerRight: () => (
                <HeaderActions
                    navigation={props.navigation}
                    action={<HeaderIconButton label={i18n.t("createOne")} onPress={() => {
                        setShowNewDynamicURLModal(true)
                    }} />}
                />
            ),
        });

        loadMyDynamicURLs()
    }, [])

    if (doneLoading) {
        return (
            <NativeBaseProvider theme={openScoreboardTheme}>
                <View height={"100%"} width={"100%"}>
                    <View backgroundColor={"gray.50"} flex={1}>
                        <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
                            <PageScaffold>
                                <ListPageHeader
                                    actionIcon={"plus"}
                                    actionLabel={i18n.t("createOne")}
                                    description={"Create stable scoreboard URLs that can be reassigned to tables or team matches without changing the public link."}
                                    onAction={() => setShowNewDynamicURLModal(true)}
                                    title={i18n.t("dynamicURLs")}
                                />
                                {dynamicURLList.length > 0 ? (
                                    <ListToolbar
                                        countLabel={`Showing ${visibleDynamicURLs.length} of ${dynamicURLList.length} dynamic URL${dynamicURLList.length === 1 ? "" : "s"}.`}
                                        onSearchChange={setDynamicURLSearch}
                                        onSortChange={setDynamicURLSort}
                                        searchPlaceholder={"Search URLs, tables, teams, or scoreboards"}
                                        searchValue={dynamicURLSearch}
                                        sortOptions={dynamicURLSortOptions}
                                        sortValue={dynamicURLSort}
                                    />
                                ) : null}
                                {dynamicURLList.length > 0 && visibleDynamicURLs.length > 0 ? (
                                    <View width={"100%"}>
                                        {visibleDynamicURLs.map((dynamicURL, index) => (
                                            <DynamicURLItem
                                                key={dynamicURL?.[0] || dynamicURL?.[1]?.id || index}
                                                index={index}
                                                item={dynamicURL}
                                                reload={() => { loadMyDynamicURLs() }}
                                                onManage={() => props.navigation.navigate("DynamicURLEditor", {
                                                    dynamicURLID: dynamicURL?.[1]?.id,
                                                    myDynamicURLID: dynamicURL?.[0],
                                                })}
                                            />
                                        ))}
                                    </View>
                                ) : dynamicURLList.length > 0 ? (
                                    <EmptyState
                                        actionLabel={"Clear search"}
                                        description={"Try a different URL name, table, team, or scoreboard."}
                                        icon={"link-variant-off"}
                                        onAction={() => setDynamicURLSearch("")}
                                        title={"No dynamic URLs match your search"}
                                    />
                                ) : (
                                    <EmptyState
                                        actionLabel={i18n.t("createOne")}
                                        description={"Create a reusable display link for scoreboards that need to follow changing tables or team matches."}
                                        icon={"link-plus"}
                                        onAction={() => setShowNewDynamicURLModal(true)}
                                        title={i18n.t("noDynamicURLs")}
                                    />
                                )}
                            </PageScaffold>
                        </ScrollView>
                    </View>



                    {showNewDynamicURLModal ?
                        <CreateDynamicURLModal isOpen={showNewDynamicURLModal}
                            onClose={(reload) => {
                                setShowNewDynamicURLModal(false)
                                if (reload) {
                                    loadMyDynamicURLs()
                                }
                            }}
                        ></CreateDynamicURLModal>
                        : null
                    }
                </View>
            </NativeBaseProvider>
        )
    }
    else {
        return (
            <LoadingPage></LoadingPage>
        )
    }



}
