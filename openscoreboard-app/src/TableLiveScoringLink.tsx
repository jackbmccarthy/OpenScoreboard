

import React, {  useEffect, useState } from 'react';
import { Button,  View,  NativeBaseProvider, FlatList,  AddIcon,  Text, Input } from 'native-base';
import db, { getUserPath } from '../database';
import { openScoreboardButtonTextColor, openScoreboardColor } from "../openscoreboardtheme";
import { openScoreboardTheme } from "../openscoreboardtheme";
import CreateNewTableModal from './modals/CreateNewTableModal';
import { TableItem } from './listitems/TableItem';
import LoadingPage from './LoadingPage';
import { TableEditModal } from './modals/TableEditModal';
import { TableLinkModal } from './modals/TableLinkModal';
import { EditTablePlayerListModal } from './modals/EditTablePlayerListModal';
import i18n from './translations/translate';
import { TableLiveScoringLinkItem } from './listitems/TableLiveScoringLinkItem';
import CopyButton from './components/CopyButton';
import { subFolderPath } from '../openscoreboard.config';





export default function TableLiveScoringLink(props) {

    let [tableList, setTableList] = useState([])
    let [doneLoading, setDoneLoading] = useState(false)
    let [selectedTables, setSelectedTables] = useState({})

    function onTableSelected(isSelected, tableId){
        let tempSelectedTables = {...selectedTables}
        if(isSelected === true){
            tempSelectedTables[tableId] = true
        }
        else{
            tempSelectedTables[tableId] = false
        }
        setSelectedTables(tempSelectedTables)
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

                ])
                let tableNameSnapShot = tableDataPromise[0]
                let tableName = tableNameSnapShot.val()

                //let tableIDSnapShot = await db.ref(tournamentDB+"/"+tableID+"/id").get()
                return {
                    myTableID: tableID[0],
                    id: tableID[1],
                    tableName: tableName,

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
        loadTables()
    }, [])

    if (doneLoading) {
        return (
            <NativeBaseProvider theme={openScoreboardTheme}>
                <View width={"100vw"} height={"100vh"}>
                    <View flex={1}>
                        <View maxW={"lg"} width={"100%"} alignSelf="center">
                            <Text fontSize={"2xl"}>{i18n.t("selectAndShareCreatedURL")}</Text>
                        {Object.entries(selectedTables).filter(([id,isSelected])=>{
                            return isSelected
                        }).length > 0 ? 
                        <View padding={1} flexDir={"row"}>
                                                <Input flex={1} isReadOnly value={`${"https://openscoreboard.com/live-scoring?tables="}${Object.entries(selectedTables).filter(([id,isSelected])=>{
                            return isSelected
                        }).map(([id,isSelected])=>{
                            return id
                        }).join(",")}`}></Input>
                                                <CopyButton text={`${"https://openscoreboard.com/live-scoring?tables="}${Object.entries(selectedTables).filter(([id,isSelected])=>{
                            return isSelected
                        }).map(([id,isSelected])=>{
                            return id
                        }).join(",")}`} />
                                            </View>
                    
                    : null
                    }
                        </View>
                        
                        {
                            tableList.length > 0 ?
                                <FlatList maxW={"lg"} width={"100%"} alignSelf="center"
                                    //contentContainerStyle={{alignItems:"center", width:"100%"}}
                                    data={tableList}
                                    renderItem={(item) => {
                                        return (
                                            <TableLiveScoringLinkItem {...item} onTableSelected={onTableSelected} ></TableLiveScoringLinkItem>
                                        )
                                    }}
                                >

                                </FlatList>
                                :
                                <View justifyContent={"center"} alignItems="center">
                                    <View>
                                        <Text fontSize={"xl"} fontWeight="bold">{i18n.t("noTables")}</Text>
                                        <View padding={2}>
                                          
                                                <Text fontSize={"xl"} fontWeight="bold" color={openScoreboardColor}>{i18n.t("goBackToTables")}</Text>
                                           
                                        </View>
                                    </View>
                                </View>
                        }
                    </View>
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