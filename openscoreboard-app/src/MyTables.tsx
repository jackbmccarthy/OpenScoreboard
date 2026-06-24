

import React, { useEffect, useState } from 'react';
import { Button, View, NativeBaseProvider, ScrollView, Text } from 'native-base';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import db, { getUserPath } from '../database';
import { openScoreboardButtonTextColor, openScoreboardColor } from "../openscoreboardtheme";
import { openScoreboardTheme } from "../openscoreboardtheme";
import CreateNewTableModal from './modals/CreateNewTableModal';
import { TableItem } from './listitems/TableItem';
import LoadingPage from './LoadingPage';
import { TableLinkModal } from './modals/TableLinkModal';
import i18n from './translations/translate';
import { HeaderActions, HeaderIconButton } from './components/HeaderActions';
import { getCombinedPlayerNames } from './functions/players';
import { createNewMatch } from './functions/scoring';





export default function MyTables(props) {

    let [tableList, setTableList] = useState([])
    let [doneLoading, setDoneLoading] = useState(false)
    let [showCreateTable, setShowCreateTable] = useState(false)
    let [showLinkModal, setShowLinkModal] = useState(false)
    let [creatingMatchTableID, setCreatingMatchTableID] = useState("")

    let [selectedTableID, setSelectedTableID] = useState("")
    let [selectedTableIndex, setSelectedTableIndex] = useState(0)
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
                    db.ref("tables/" + tableID[1] + "/tableMode").get()
                ])
                let tableNameSnapShot = tableDataPromise[0]
                let tablePasswordSnap = tableDataPromise[1]
                let tablePlayerListIDSnap = tableDataPromise[2]
                let tableSportName = tableDataPromise[3]
                let tableScoringType = tableDataPromise[4]
                let currentMatchSnap = tableDataPromise[5]
                let tableModeSnap = tableDataPromise[6]
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
                        contentContainerStyle={{ flexGrow: 1, paddingBottom: 32, paddingTop: 8 }}
                    >
                        <View width={"100%"} maxW={1040} alignSelf={"center"}>
                            <View
                                alignItems={"center"}
                                backgroundColor={"white"}
                                borderColor={"gray.200"}
                                borderRadius={8}
                                borderWidth={1}
                                flexDirection={"row"}
                                marginX={3}
                                marginY={2}
                                padding={3}
                            >
                                <View
                                    alignItems={"center"}
                                    backgroundColor={"blue.50"}
                                    borderRadius={999}
                                    height={38}
                                    justifyContent={"center"}
                                    marginRight={3}
                                    width={38}
                                >
                                    <MaterialCommunityIcons name="monitor-eye" size={20} color={openScoreboardColor} />
                                </View>
                                <View flex={1} paddingRight={3}>
                                    <Text color={"gray.900"} fontSize={"md"} fontWeight={"bold"}>Production scorekeeper monitor</Text>
                                    <Text color={"gray.600"} fontSize={"xs"} marginTop={0.5}>
                                        View live scoring kiosks and block duplicate scorekeepers.
                                    </Text>
                                </View>
                                <Button
                                    backgroundColor={openScoreboardColor}
                                    borderRadius={8}
                                    onPress={() => props.navigation.navigate("ScorekeeperSessions")}
                                >
                                    <Text color={openScoreboardButtonTextColor} fontSize={"sm"} fontWeight={"bold"}>Open</Text>
                                </Button>
                            </View>
                        </View>

                        {tableList.length > 0 ? (
                            <View width={"100%"} maxW={1040} alignSelf={"center"}>
                                {tableList.map((table, index) => (
                                    <TableItem
                                        key={table.id || table.myTableID}
                                        index={index}
                                        {...props}
                                        openLinkModal={openLinkModal}
                                        createMatchForTable={createMatchForTable}
                                        isCreatingMatch={creatingMatchTableID === table.id}
                                        {...table}
                                    />
                                ))}
                            </View>
                        ) : (
                            <View flex={1} justifyContent={"center"} alignItems="center" padding={4}>
                                <View
                                    backgroundColor={"white"}
                                    borderColor={"gray.200"}
                                    borderRadius={8}
                                    borderWidth={1}
                                    padding={4}
                                    width={"100%"}
                                    maxW={420}
                                >
                                    <Text color={"gray.900"} fontSize={"xl"} fontWeight="bold">{i18n.t("noTables")}</Text>
                                    <View marginTop={3}>
                                        <Button
                                            onPress={() => {
                                                setShowCreateTable(true)
                                            }}
                                        >
                                            <Text color={openScoreboardButtonTextColor}>{i18n.t("createOne")}</Text>
                                        </Button>
                                    </View>
                                </View>
                            </View>
                        )}
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
