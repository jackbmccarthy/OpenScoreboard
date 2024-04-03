


import React, { Component, useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, ScrollView, Share } from 'react-native';
import { Button, View, NativeBaseProvider, FlatList, Fab, AddIcon, Select, Text } from 'native-base';
import { addNewScoreboard, getMyScoreboards, getScoreboardTypesList } from './functions/scoreboards';
import { getUserPath } from '../database';
import LoadingPage from './LoadingPage';
import { openScoreboardButtonTextColor } from "../openscoreboardtheme";
import { openScoreboardTheme } from "../openscoreboardtheme";
import { openBrowserAsync } from 'expo-web-browser';
import { getMyTeams } from './functions/teams';
import { NewTeamModal } from './modals/NewTeamModal';
import { TeamItem } from './listitems/TeamItem';
import i18n from './translations/translate';

export default function MyTeams(props) {

    let [teamList, setTeamList] = useState([])
    let [doneLoading, setDoneLoading] = useState(false)
    let [showNewTeamModal, setShowNewTeamModal] = useState(false)
    let [isEditingTeam, setIsEditingTeam] = useState(false)
    let [editingTeamID, setEditingTeamID] = useState("")
    let [editingMyTeamID, setEditingMyTeamID] = useState("")

    async function loadTeams() {
        setDoneLoading(false)
        let myTeams = await getMyTeams(getUserPath())
        setTeamList(myTeams)
        setDoneLoading(true)
    }

    const openEditTeam = (teamID, myTeamID) => {
        setEditingTeamID(teamID)
        setEditingMyTeamID(myTeamID)
        setIsEditingTeam(true)
        setShowNewTeamModal(true)
    }
    const closeEditTeam = () => {
        setIsEditingTeam(false)
        setEditingTeamID("")
        setShowNewTeamModal(false)
    }



    useEffect(() => {
        props.navigation.setOptions({
            headerRight: () => (
                <NativeBaseProvider>
                    <Button height={"100%"} width={"100%"} variant={"ghost"} onPress={() => {
                        setEditingMyTeamID("")
                        setEditingTeamID("")
                        setIsEditingTeam(false)

                        setShowNewTeamModal(true)
                    }} >
                        <AddIcon size="xl" color={openScoreboardButtonTextColor} ></AddIcon>
                    </Button>
                </NativeBaseProvider>

            ),
        });
        loadTeams()


    }, [])

    if (doneLoading) {
        return (
            <NativeBaseProvider theme={openScoreboardTheme}>
                <View  width={"100vw"} height={"100vh"} >
                    <View flex={1}>
                        {
                            teamList.length > 0 ?
                                <FlatList
                                    data={teamList}
                                    keyExtractor={(item) => { return item[0] }}
                                    renderItem={(item) => {
                                        return <TeamItem
                                            onDelete={(deletedMyTeamID) => {
                                                setTeamList([...teamList.filter((myTeam) => {
                                                    return myTeam[0] !== deletedMyTeamID
                                                })])
                                            }}
                                            openEditTeam={openEditTeam}
                                            closeEditTeam={closeEditTeam}
                                            {...item} ></TeamItem>
                                    }}
                                ></FlatList>
                                :
                                <View justifyContent={"center"} alignItems="center">
                                    <View>
                                        <Text fontSize={"xl"} fontWeight="bold">{i18n.t("noTeams")}</Text>
                                        <View padding={2}>
                                            <Button
                                                onPress={() => {
                                                    setShowNewTeamModal(true)
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
                        showNewTeamModal ?
<NewTeamModal

                        isEditingTeam={isEditingTeam}
                        editingTeamID={editingTeamID}
                        editingMyTeamID={editingMyTeamID}
                        onClose={(reload = true) => {
                            setShowNewTeamModal(false)
                            if (reload === true) {
                                loadTeams()
                            }
                        }} isOpen={showNewTeamModal}></NewTeamModal>
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