


import React, { Component, useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, ScrollView, Share } from 'react-native';
import { Button, View, NativeBaseProvider, FlatList, Fab, AddIcon, Input, Text } from 'native-base';
import { addNewScoreboard, getMyScoreboards, getScoreboardTypesList } from './functions/scoreboards';
import { getUserPath } from '../database';
import LoadingPage from './LoadingPage';
import { openScoreboardButtonTextColor } from "../openscoreboardtheme";
import { openScoreboardTheme } from "../openscoreboardtheme";

import getMyTeamMatches from './functions/teammatches';
import { LinearGradient } from 'expo-linear-gradient';
import { SelectTeamMatchTableModal } from './modals/SelectTeamMatchTableModal';
import { TeamMatchItem } from './listitems/TeamMatchItem';
import { NewTeamMatchModal } from './modals/NewTeamMatchModal';
import { TableLinkModal } from './modals/TableLinkModal';
import { TeamMatchLinkModal } from './modals/TeamMatchLinkModal';
import { EditTeamMatchModal } from './modals/EditTeamMatchModal';
import { DeleteTeamMatchModal } from './modals/DeleteTeamMatchModal';
import i18n from './translations/translate';

export default function MyTeamMatches(props) {

    let [teamMatchList, setTeamMatchList] = useState([])
    let [doneLoading, setDoneLoading] = useState(false)
    let [showNewTeamMatchModal, setShowNewTeamMatchModal] = useState(false)
    let [showTeamMatchTableModal, setShowTeamMatchTableModal] = useState(false)
    let [showDeleteTeamMatchModel, setShowDeleteTeamMatchModal] = useState(false)
    let [deleteTeamMatchMyID, setDeleteTeamMatchMyID] = useState("")

    let [showTeamMatchEditModal, setShowTeamMatchEditModal] = useState(false)
    let [showLinkModal, setShowLinkModal] = useState(false)
    let [selectedTeamMatchID, setSelectedTeamMatchID] = useState("")
    let [selectedTeamMatchIndex, setSelectedTeamMatchIndex] = useState(0)
    let [selectedTableID, setSelectedTableID] = useState("")

    let [teamScoringType, setTeamScoringType] = useState("")
    let [teamSportName, setTeamSportName] = useState("")
    const openTeamMatchTableSelection = (teamMatchID, teamMatchIndex) => {

        setSelectedTeamMatchID(teamMatchID)
        setSelectedTeamMatchIndex(teamMatchIndex)
        setShowTeamMatchTableModal(true)
    }
    const openTeamMatchEdit = (teamMatchID, teamMatchIndex) => {

        setSelectedTeamMatchID(teamMatchID)
        setSelectedTeamMatchIndex(teamMatchIndex)
        setShowTeamMatchEditModal(true)
    }
    const closeTeamMatchTableSelection = () => {
        setShowTeamMatchTableModal(true)
    }

    const openTeamMatchLink = (teamMatchID, tableID, sportName, scoringType) => {
        setSelectedTeamMatchID(teamMatchID)
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
            sportName:sportName,
            scoringType:scoringType
        })
    }

    async function loadTeamMatches() {
        setDoneLoading(false)
        setTeamMatchList(await getMyTeamMatches(getUserPath()))
        setDoneLoading(true)
    }

    async function openDeleteTeamMatch(myTeamMatchID) {
        setDeleteTeamMatchMyID(myTeamMatchID)
        setShowDeleteTeamMatchModal(true)
    }
    async function hideDeleteTeamMatch(reload = false) {
        setShowDeleteTeamMatchModal(false)
        setDeleteTeamMatchMyID("")

        if (reload) {
            loadTeamMatches()
        }



    }

    useEffect(() => {
        props.navigation.setOptions({
            headerRight: () => (
                <NativeBaseProvider>
                    <Button height={"100%"} width={"100%"} variant={"ghost"} onPress={() => {
                        setShowNewTeamMatchModal(true)
                    }} >
                        <AddIcon size="xl" color={openScoreboardButtonTextColor}  ></AddIcon>
                    </Button>
                </NativeBaseProvider>

            ),
        });
        loadTeamMatches()


    }, [])

    if (doneLoading) {
        return (
            <NativeBaseProvider theme={openScoreboardTheme}>

                <View height={"100vh"} width={"100vw"}  >
                    <View flex={1}>
                        {
                            teamMatchList.length > 0 ?
                                <FlatList 
                                    data={teamMatchList.sort((a, b) => {
                                        return new Date(a[1].startTime) > new Date(b[1].startTime) ? -1 : 1
                                    })}
                                    keyExtractor={(item) => { return item[0] }}
                                    renderItem={(item) => {
                                        return (

                                            <TeamMatchItem {...props}
                                                openTeamMatchEdit={openTeamMatchEdit}
                                                openTeamMatchTableSelection={openTeamMatchTableSelection}
                                                openDeleteTeamMatch={openDeleteTeamMatch}
                                                {...item}></TeamMatchItem>

                                        )

                                    }}
                                ></FlatList>
                                :

                                <View justifyContent={"center"} alignItems="center">
                                    <View>
                                        <Text fontSize={"xl"} fontWeight="bold">{i18n.t("noTeamMatches")}</Text>
                                        <View padding={2}>
                                            <Button
                                                onPress={() => {
                                                    setShowNewTeamMatchModal(true)
                                                }}
                                            >
                                                <Text color={openScoreboardButtonTextColor}>{i18n.t("createOne")}</Text>
                                            </Button>
                                        </View>
                                    </View>
                                </View>
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
                        showTeamMatchEditModal ?
                            <EditTeamMatchModal isOpen={showTeamMatchEditModal}
                                tableID={selectedTableID}
                                {...teamMatchList[selectedTeamMatchIndex][1]}
                                onClose={(reload) => {
                                    setShowTeamMatchEditModal(false)
                                    if (reload) {
                                        loadTeamMatches()
                                    }
                                }} isTeamMatch={true}  ></EditTeamMatchModal>

                            : null
                    }
                    {
                        showLinkModal ?
                            <TeamMatchLinkModal isOpen={showLinkModal}
                                tableID={selectedTableID}
                                {...teamMatchList[selectedTeamMatchIndex][1]}
                                onClose={() => {
                                    setShowLinkModal(false)
                                    setShowTeamMatchTableModal(true)
                                }} isTeamMatch={true}  ></TeamMatchLinkModal>

                            : null
                    }
                    {
                        showDeleteTeamMatchModel ?
                            <DeleteTeamMatchModal
                                isOpen={showDeleteTeamMatchModel}
                                onClose={hideDeleteTeamMatch}
                                allTeamMatches={teamMatchList}
                                deleteTeamMatchMyID={deleteTeamMatchMyID}
                            ></DeleteTeamMatchModal>
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