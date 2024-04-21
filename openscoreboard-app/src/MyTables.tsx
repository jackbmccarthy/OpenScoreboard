

import React, {  useEffect, useState } from 'react';
import { Button,  View,  NativeBaseProvider, FlatList,  AddIcon,  Text } from 'native-base';
import db, { getUserPath } from '../database';
import { openScoreboardButtonTextColor } from "../openscoreboardtheme";
import { openScoreboardTheme } from "../openscoreboardtheme";
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

    const openRegistrationModal = (tableID:string, tableIndex:number) => {
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
                    sportName:sportName,
                    scoringType:scoringType
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
                <NativeBaseProvider>
                    <Button height={"100%"} width={"100%"} variant={"ghost"} onPress={() => {
                        setShowCreateTable(true)
                    }} >
                        <AddIcon size="xl" color={openScoreboardButtonTextColor}  ></AddIcon>
                    </Button>
                </NativeBaseProvider>

            ),
        });

        loadTables()
    }, [])

    if (doneLoading) {
        return (
            <NativeBaseProvider theme={openScoreboardTheme}>
                <View width={"100vw"} height={"100vh"}>
                    <View flex={1}>
                        {
                            tableList.length > 0 ?
                                <FlatList maxW={"lg"} width={"100%"} alignSelf="center"
                                    //contentContainerStyle={{alignItems:"center", width:"100%"}}
                                    data={tableList}
                                    renderItem={(item) => {
                                        return (
                                            <TableItem index={item.index} {...props} openEditPlayerList={openEditPlayerList} openLinkModal={openLinkModal} openEditTable={openEditTable} openRegistrationModal={openRegistrationModal} {...item.item} />
                                        )
                                    }}
                                >

                                </FlatList>
                                :
                                <View justifyContent={"center"} alignItems="center">
                                    <View>
                                        <Text fontSize={"xl"} fontWeight="bold">{i18n.t("noTables")}</Text>
                                        <View padding={2}>
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
                        }
                    </View>



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
            </NativeBaseProvider>
        )
    }
    else {
        return (
            <LoadingPage></LoadingPage>
        )
    }



}