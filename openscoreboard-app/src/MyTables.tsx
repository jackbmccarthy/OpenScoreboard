

import React, { useEffect, useMemo, useState } from 'react';
import { View, NativeBaseProvider, ScrollView } from 'native-base';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import db, { getUserPath } from '../database';
import { openScoreboardTheme } from "../openscoreboardtheme";
import CreateNewTableModal from './modals/CreateNewTableModal';
import { TableItem } from './listitems/TableItem';
import LoadingPage from './LoadingPage';
import { TableLinkModal } from './modals/TableLinkModal';
import i18n from './translations/translate';
import { HeaderActions, HeaderIconButton } from './components/HeaderActions';
import { getCombinedPlayerNames } from './functions/players';
import { createNewMatch } from './functions/scoring';
import { EmptyState, ListPageHeader, ListToolbar, PageScaffold, ResourceAction, ResourceCard } from './components/ListPage';
import { compareByCreatedDesc } from './functions/listSorting';

const tableSortOptions = [
    { label: "Recently created", value: "createdDesc" },
    { label: "Name A-Z", value: "nameAsc" },
    { label: "Name Z-A", value: "nameDesc" },
    { label: "Active matches first", value: "activeFirst" },
    { label: "Waiting first", value: "waitingFirst" },
    { label: "Kiosk first", value: "kioskFirst" },
];

function getTableSearchText(table) {
    return [
        table.tableName,
        table.sportName,
        table.scoringType,
        table.tableMode,
        table.currentMatchPreview?.playerA,
        table.currentMatchPreview?.playerB,
        table.hasCurrentMatch ? "active current match live scoring" : "waiting no match",
    ].filter(Boolean).join(" ").toLowerCase();
}

function sortTables(tables, sortBy) {
    return [...tables].sort((firstTable, secondTable) => {
        const firstName = `${firstTable.tableName || ""}`.toLowerCase();
        const secondName = `${secondTable.tableName || ""}`.toLowerCase();

        if (sortBy === "nameDesc") {
            return secondName.localeCompare(firstName);
        }

        if (sortBy === "nameAsc") {
            return firstName.localeCompare(secondName);
        }

        if (sortBy === "activeFirst") {
            return Number(secondTable.hasCurrentMatch === true) - Number(firstTable.hasCurrentMatch === true) || firstName.localeCompare(secondName);
        }

        if (sortBy === "waitingFirst") {
            return Number(firstTable.hasCurrentMatch === true) - Number(secondTable.hasCurrentMatch === true) || firstName.localeCompare(secondName);
        }

        if (sortBy === "kioskFirst") {
            return Number(secondTable.tableMode === "kiosk") - Number(firstTable.tableMode === "kiosk") || firstName.localeCompare(secondName);
        }

        return compareByCreatedDesc(firstTable, secondTable);
    });
}





export default function MyTables(props) {

    let [tableList, setTableList] = useState([])
    let [doneLoading, setDoneLoading] = useState(false)
    let [showCreateTable, setShowCreateTable] = useState(false)
    let [showLinkModal, setShowLinkModal] = useState(false)
    let [creatingMatchTableID, setCreatingMatchTableID] = useState("")
    let [tableSearch, setTableSearch] = useState("")
    let [tableSort, setTableSort] = useState("createdDesc")

    let [selectedTableID, setSelectedTableID] = useState("")
    let [selectedTableIndex, setSelectedTableIndex] = useState(0)
    const visibleTables = useMemo(() => {
        const normalizedSearch = tableSearch.trim().toLowerCase();
        const filteredTables = normalizedSearch ?
            tableList.filter((table) => getTableSearchText(table).includes(normalizedSearch)) :
            tableList;

        return sortTables(filteredTables, tableSort);
    }, [tableList, tableSearch, tableSort]);

    const openLinkModal = (tableID, tableIndex) => {
        setSelectedTableID(tableID)
        setSelectedTableIndex(tableIndex)
        setShowLinkModal(true)
    }
    const closeLinkModal = () => {
        setShowLinkModal(false)
    }


    async function loadTables(showPageLoading = true) {
        if (showPageLoading) {
            setDoneLoading(false)
        }
        let val = await db.ref("users" + "/" + getUserPath() + "/" + "myTables").get()
        var tableIDList = []
        var tableList = []
        try {
            tableIDList = Object.entries(val.val())
        }
        catch (err) {
            console.error(err)
            tableIDList = []
        }
        if (tableIDList.length > 0) {
            let allTableSummaries = await Promise.all(tableIDList.map(async (tableID) => {
                let tableDataPromise = await Promise.all([
                    db.ref("tables/" + tableID[1] + "/tableName").get(),
                    db.ref("tables/" + tableID[1] + "/password").get(),
                    db.ref("tables/" + tableID[1] + "/playerListID").get(),
                    db.ref("tables/" + tableID[1] + "/sportName").get(),
                    db.ref("tables/" + tableID[1] + "/scoringType").get(),
                    db.ref("tables/" + tableID[1] + "/currentMatch").get(),
                    db.ref("tables/" + tableID[1] + "/tableMode").get(),
                    db.ref("tables/" + tableID[1] + "/createdOn").get(),
                    db.ref("tables/" + tableID[1] + "/createdAt").get()
                ])
                let tableNameSnapShot = tableDataPromise[0]
                let tablePasswordSnap = tableDataPromise[1]
                let tablePlayerListIDSnap = tableDataPromise[2]
                let tableSportName = tableDataPromise[3]
                let tableScoringType = tableDataPromise[4]
                let currentMatchSnap = tableDataPromise[5]
                let tableModeSnap = tableDataPromise[6]
                let createdOnSnap = tableDataPromise[7]
                let createdAtSnap = tableDataPromise[8]
                let tableName = tableNameSnapShot.val()
                let password = tablePasswordSnap.val()
                let playerListID = tablePlayerListIDSnap.val()
                let sportName = tableSportName.val()
                let scoringType = tableScoringType.val()
                let currentMatchID = currentMatchSnap.val()
                let tableMode = tableModeSnap.val() === "kiosk" ? "kiosk" : "standard"
                let currentMatchPreview = { playerA: "TBD", playerB: "TBD" }
                let hasCurrentMatch = false

                if (typeof currentMatchID === "string" && currentMatchID.length > 0) {
                    const matchSnap = await db.ref(`matches/${currentMatchID}`).get()
                    const match = matchSnap.val()

                    if (match) {
                        hasCurrentMatch = true
                        const playerNames = getCombinedPlayerNames(match.playerA, match.playerB, match.playerA2, match.playerB2)
                        currentMatchPreview = {
                            playerA: playerNames.a?.length > 0 ? playerNames.a : "TBD",
                            playerB: playerNames.b?.length > 0 ? playerNames.b : "TBD",
                        }
                    }
                }
                //let tableIDSnapShot = await db.ref(tournamentDB+"/"+tableID+"/id").get()
                return {
                    myTableID: tableID[0],
                    id: tableID[1],
                    tableName: tableName,
                    password: password,
                    playerListID: playerListID,
                    sportName: sportName,
                    scoringType: scoringType,
                    tableMode: tableMode,
                    createdOn: createdOnSnap.val(),
                    createdAt: createdAtSnap.val(),
                    currentMatchID: currentMatchID,
                    currentMatchPreview: currentMatchPreview,
                    hasCurrentMatch: hasCurrentMatch
                }

            }))
            setTableList(allTableSummaries)

        }
        else {
            setTableList([])
        }
        setDoneLoading(true)
    }

    async function createMatchForTable(tableInfo) {
        if (tableInfo.tableMode === "kiosk") {
            props.navigation.navigate("TableScoring", {
                tableID: tableInfo.id,
                name: tableInfo.tableName,
                password: tableInfo.password,
                sportName: tableInfo.sportName ? tableInfo.sportName : "tableTennis",
                scoringType: tableInfo.scoringType ? tableInfo.scoringType : null,
                ownerID: getUserPath() || "",
            })
            return
        }

        try {
            setCreatingMatchTableID(tableInfo.id)
            await createNewMatch(
                tableInfo.id,
                tableInfo.sportName ? tableInfo.sportName : "tableTennis",
                null,
                false,
                tableInfo.scoringType ? tableInfo.scoringType : null
            )
            await loadTables(false)
        }
        catch (err) {
            console.error(err)
        }
        finally {
            setCreatingMatchTableID("")
        }
    }

    useEffect(() => {



        props.navigation.setOptions({
            headerRight: () => (
                <HeaderActions
                    navigation={props.navigation}
                    action={<HeaderIconButton label={i18n.t("createOne")} onPress={() => {
                        setShowCreateTable(true)
                    }} />}
                />
            ),
        });

        loadTables()
        const unsubscribe = props.navigation.addListener("focus", () => {
            loadTables(false)
        })

        return unsubscribe
    }, [])

    if (doneLoading) {
        return (
            <NativeBaseProvider theme={openScoreboardTheme}>
                <View width={"100%"} height={"100%"}>
                    <ScrollView
                        backgroundColor={"gray.50"}
                        flex={1}
                        contentContainerStyle={{ flexGrow: 1, paddingBottom: 32 }}
                    >
                        <PageScaffold>
                            <ListPageHeader
                                actionIcon={"plus"}
                                actionLabel={i18n.t("createOne")}
                                description={"Manage table scoring links, kiosk mode, live matches, and table-specific settings."}
                                onAction={() => setShowCreateTable(true)}
                                title={i18n.t("myTables")}
                            />
                            <ResourceCard
                                icon={(color) => <MaterialCommunityIcons name="monitor-eye" size={22} color={color} />}
                                title={"Production scorekeeper monitor"}
                                subtitle={"View live scoring kiosks and block duplicate scorekeepers."}
                                actions={(
                                    <ResourceAction
                                        isPrimary
                                        icon={(color) => <MaterialCommunityIcons name="open-in-new" size={18} color={color} />}
                                        label={"Open monitor"}
                                        onPress={() => props.navigation.navigate("ScorekeeperSessions")}
                                    />
                                )}
                            />
                            {tableList.length > 0 ? (
                                <ListToolbar
                                    countLabel={`Showing ${visibleTables.length} of ${tableList.length} table${tableList.length === 1 ? "" : "s"}.`}
                                    onSearchChange={setTableSearch}
                                    onSortChange={setTableSort}
                                    searchPlaceholder={"Search tables, players, sport, or mode"}
                                    searchValue={tableSearch}
                                    sortOptions={tableSortOptions}
                                    sortValue={tableSort}
                                />
                            ) : null}
                            {tableList.length > 0 && visibleTables.length > 0 ? (
                                <View>
                                    {visibleTables.map((table) => {
                                        const originalIndex = tableList.findIndex((currentTable) => currentTable.id === table.id);
                                        return (
                                            <TableItem
                                                key={table.id || table.myTableID}
                                                index={originalIndex >= 0 ? originalIndex : 0}
                                                {...props}
                                                openLinkModal={openLinkModal}
                                                createMatchForTable={createMatchForTable}
                                                isCreatingMatch={creatingMatchTableID === table.id}
                                                {...table}
                                            />
                                        );
                                    })}
                                </View>
                            ) : tableList.length > 0 ? (
                                <EmptyState
                                    actionLabel={"Clear search"}
                                    description={"Try a different table name, player name, sport, or mode."}
                                    icon={"table-search"}
                                    onAction={() => setTableSearch("")}
                                    title={"No tables match your search"}
                                />
                            ) : (
                                <EmptyState
                                    actionLabel={i18n.t("createOne")}
                                    description={"Create a table or court to start scoring matches."}
                                    icon={"table-plus"}
                                    onAction={() => setShowCreateTable(true)}
                                    title={i18n.t("noTables")}
                                />
                            )}
                        </PageScaffold>
                    </ScrollView>



                    {
                        showCreateTable ?
                            <CreateNewTableModal

                                isOpen={showCreateTable}
                                onClose={(reload = false) => {
                                    setShowCreateTable(false)
                                    if (reload) {
                                        loadTables()
                                    }

                                }} />
                            :
                            null
                    }

                    {
                        showLinkModal ?
                            <TableLinkModal
                                {...props}
                                isOpen={showLinkModal}
                                id={selectedTableID}
                                {...tableList[selectedTableIndex]}
                                onClose={() => closeLinkModal()} />
                            :
                            null
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
