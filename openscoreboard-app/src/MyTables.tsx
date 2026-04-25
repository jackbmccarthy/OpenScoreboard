

import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from 'heroui-native/button';
import { Card } from 'heroui-native/card';
import { AntDesign } from '@expo/vector-icons';
import db, { getUserPath } from '../database';
import { openScoreboardButtonTextColor } from "../openscoreboardtheme";
import CreateNewTableModal from './modals/CreateNewTableModal';
import { TableItem } from './listitems/TableItem';
import LoadingPage from './LoadingPage';
import { TableEditModal } from './modals/TableEditModal';
import { TableLinkModal } from './modals/TableLinkModal';
import { EditTablePlayerListModal } from './modals/EditTablePlayerListModal';
import i18n from './translations/translate';





export default function MyTables(props) {

    let [tableList, setTableList] = useState([])
    let [doneLoading, setDoneLoading] = useState(false)
    let [showCreateTable, setShowCreateTable] = useState(false)
    let [selectedNewEventType, setSelectedNewEventType] = useState(false)
    let [showLinkModal, setShowLinkModal] = useState(false)
    let [showEditModal, setShowEditModal] = useState(false)
    let [showEditPlayerListModal, setShowEditPlayerListModal] = useState(false)
    let [showRegistrationModal, setShowRegistrationModal] = useState(false)

    let [selectedEditTable, setSelectedEditTable] = useState({})
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

    const openEditTable = (tableInfo) => {
        setSelectedEditTable({ ...tableInfo })
        setShowEditModal(true)
    }
    const openEditPlayerList = (tableInfo) => {
        setSelectedEditTable({ ...tableInfo })
        setShowEditPlayerListModal(true)
    }

    const openRegistrationModal = (tableID: string, tableIndex: number) => {
        setSelectedTableID(tableID)
        setSelectedTableIndex(tableIndex)
        setShowRegistrationModal(true)
    }
    const closeRegistrationModal = () => {
        setShowRegistrationModal(false)
    }


    async function loadTables() {
        setDoneLoading(false)
        let val = await db.ref("users" + "/" + getUserPath() + "/" + "myTables").get()
        var tableIDList = []
        var tableList = []
        try {
            const myTables = val.val()
            tableIDList = myTables ? Object.entries(myTables) : []
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
                    db.ref("tables/" + tableID[1] + "/scoringType").get()
                ])
                let tableNameSnapShot = tableDataPromise[0]
                let tablePasswordSnap = tableDataPromise[1]
                let tablePlayerListIDSnap = tableDataPromise[2]
                let tableSportName = tableDataPromise[3]
                let tableScoringType = tableDataPromise[4]
                let tableName = tableNameSnapShot.val()
                let password = tablePasswordSnap.val()
                let playerListID = tablePlayerListIDSnap.val()
                let sportName = tableSportName.val()
                let scoringType = tableScoringType.val()
                //let tableIDSnapShot = await db.ref(tournamentDB+"/"+tableID+"/id").get()
                return {
                    myTableID: tableID[0],
                    id: tableID[1],
                    tableName: tableName,
                    password: password,
                    playerListID: playerListID,
                    sportName: sportName,
                    scoringType: scoringType
                }

            }))
            setTableList(allTableSummaries)

        }
        else {
            setTableList([])
        }
        setDoneLoading(true)
    }

    useEffect(() => {



        props.navigation.setOptions({
            headerRight: () => (
                    <Pressable onPress={() => {
                        setShowCreateTable(true)
                    }} style={styles.headerAction}>
                        <AntDesign name="plus" size={22} color={openScoreboardButtonTextColor}></AntDesign>
                    </Pressable>

            ),
        });

        loadTables()
    }, [])

    if (doneLoading) {
        return (
            <View style={styles.screen}>
                <View style={styles.header}>
                    <Text style={styles.eyebrow}>{i18n.t("myTables")}</Text>
                    <Text style={styles.headline}>Court and table control</Text>
                    <Text style={styles.headerText}>Manage active scoring stations, assign player lists, and open scoring or schedule workflows from one place.</Text>
                </View>
                    {
                        tableList.length > 0 ?
                            <FlatList
                                contentContainerStyle={styles.listContent}
                                data={tableList}
                                renderItem={(item) => {
                                    return (
                                        <TableItem index={item.index} {...props} openEditPlayerList={openEditPlayerList} openLinkModal={openLinkModal} openEditTable={openEditTable} openRegistrationModal={openRegistrationModal} {...item.item} />
                                    )
                                }}
                            >

                            </FlatList>
                            :
                            <View style={styles.emptyWrap}>
                                <Card style={styles.emptyCard}>
                                    <Card.Body style={styles.emptyBody}>
                                        <Text style={styles.emptyTitle}>{i18n.t("noTables")}</Text>
                                        <Text style={styles.emptyText}>Create a table or court to start scoring, scheduling matches, and sharing access.</Text>
                                        <Button
                                            onPress={() => {
                                                setShowCreateTable(true)
                                            }}
                                            style={styles.primaryButton}
                                        >
                                            <Button.Label>{i18n.t("createOne")}</Button.Label>
                                        </Button>
                                    </Card.Body>
                                </Card>
                            </View>
                    }



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

                    {
                        showEditModal ?
                            <TableEditModal isOpen={showEditModal}
                                {...selectedEditTable} onClose={(reload) => {
                                    setShowEditModal(false)
                                    if (reload) {
                                        loadTables()
                                    }
                                }} ></TableEditModal> : null
                    }
                    {
                        showEditPlayerListModal ?
                            <EditTablePlayerListModal isOpen={showEditPlayerListModal}
                                {...selectedEditTable}
                                onClose={(reload) => {
                                    setShowEditPlayerListModal(false)
                                }}
                            ></EditTablePlayerListModal>
                            : null
                    }




                </View>
        )
    }
    else {
        return (
            <LoadingPage></LoadingPage>
        )
    }



}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: "#f4f6f8",
    },
    header: {
        paddingHorizontal: 16,
        paddingTop: 18,
        paddingBottom: 8,
    },
    headerAction: {
        alignItems: "center",
        borderRadius: 8,
        height: 36,
        justifyContent: "center",
        width: 36,
    },
    eyebrow: {
        color: "#2563eb",
        fontSize: 12,
        fontWeight: "800",
        textTransform: "uppercase",
    },
    headline: {
        color: "#111827",
        fontSize: 28,
        fontWeight: "800",
        lineHeight: 34,
        marginTop: 4,
    },
    headerText: {
        color: "#4b5563",
        fontSize: 14,
        lineHeight: 21,
        marginTop: 6,
        maxWidth: 640,
    },
    listContent: {
        gap: 12,
        paddingHorizontal: 16,
        paddingBottom: 24,
        paddingTop: 8,
    },
    emptyWrap: {
        alignItems: "center",
        flex: 1,
        justifyContent: "center",
        padding: 20,
    },
    emptyCard: {
        maxWidth: 520,
        backgroundColor: "#ffffff",
        width: "100%",
    },
    emptyBody: {
        alignItems: "center",
        backgroundColor: "#ffffff",
        gap: 12,
        paddingVertical: 20,
    },
    emptyTitle: {
        color: "#111827",
        fontSize: 22,
        fontWeight: "800",
        textAlign: "center",
    },
    emptyText: {
        color: "#6b7280",
        lineHeight: 20,
        maxWidth: 380,
        textAlign: "center",
    },
    primaryButton: {
        minWidth: 160,
    },
});
