

import React, { Component, useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, ScrollView, Share } from 'react-native';
import { Button, View, NativeBaseProvider, FlatList, Fab, AddIcon, Text } from 'native-base';
import { deleteMyScoreboard, getMyScoreboards } from './functions/scoreboards';
import { getUserPath } from '../database';
import LoadingPage from './LoadingPage';
import { openScoreboardButtonTextColor } from "../openscoreboardtheme";
import { openScoreboardTheme } from "../openscoreboardtheme";
import { NewScoreBoardModal } from './modals/NewScoreBoardModal';
import { ScoreboardItem } from './listitems/ScoreboardItem';
import { ScoreboardMessageModal } from './modals/ScoreboardMessageModal';
import { EditScoreboardSettingsModal } from './modals/EditScoreboardSettingsModal';
import i18n from './translations/translate';


export default function MyScoreboards(props) {

    let [scoreboardList, setScoreboardList] = useState([])
    let [doneLoading, setDoneLoading] = useState(false)
    let [showNewScoreboardModal, setShowNewScoreboardModal] = useState(false)

    let [showScoreboardMessage, setShowScoreboardMessage] = useState(false)
    let [scoreboardLink, setScoreboardLink] = useState("")
    let [selectedScoreboardID, setSelectedScoreboardID] = useState("")
    let [selectedScoreboardIndex, setSelectedScoreboardIndex] = useState(0)
    let [showScoreboardSettings, setShowScoreboardSettings] = useState(false)

    const openScoreboardSettings = (scoreboardID, index) => {
        setSelectedScoreboardID(scoreboardID)
        setSelectedScoreboardIndex(index)
        setShowScoreboardSettings(true)
    }

    async function getScoreboards() {

        setDoneLoading(false)
        let scoreboards = await getMyScoreboards(getUserPath())
        setScoreboardList(scoreboards)
        setDoneLoading(true)

    }

    useEffect(() => {
        props.navigation.setOptions({
            headerRight: () => (
                <NativeBaseProvider>
                    <Button height={"100%"} width={"100%"} variant={"ghost"} onPress={() => {
                        setShowNewScoreboardModal(true)
                    }} >
                        <AddIcon size="xl" color={openScoreboardButtonTextColor} ></AddIcon>
                    </Button>
                </NativeBaseProvider>

            ),
        });
        getScoreboards()


    }, [])

    if (doneLoading) {
        return (
            <NativeBaseProvider theme={openScoreboardTheme}>
                <View width={"100vw"} height={"100vh"}>
                    <View flex={1}>
                        {
                            scoreboardList.length > 0 ?
                                <View flex={1}>
                                    <FlatList
                                        data={scoreboardList}
                                        keyExtractor={(item) => { return item[0] }}
                                        renderItem={(item) => {
                                            return <ScoreboardItem

                                                openScoreboardSettings={openScoreboardSettings}
                                                onSelect={(url) => {
                                                    setScoreboardLink(url)
                                                    setShowScoreboardMessage(true)
                                                }}
                                                onDelete={async (myScoreboardID) => {
                                                    deleteMyScoreboard(myScoreboardID)
                                                    setScoreboardList([...scoreboardList].filter((scoreboard) => {
                                                        return scoreboard[0] !== myScoreboardID
                                                    }))
                                                }}
                                                {...item} ></ScoreboardItem>
                                        }}
                                    ></FlatList>
                                </View>
                                :
                                <View justifyContent={"center"} alignItems="center">
                                    <View>
                                        <Text fontSize={"xl"} fontWeight="bold">{i18n.t("noScoreboards")}</Text>
                                        <View padding={2}>
                                            <Button
                                                onPress={() => {
                                                    setShowNewScoreboardModal(true)
                                                }}
                                            >
                                                <Text color={openScoreboardButtonTextColor}>{i18n.t("createOne")}</Text>
                                            </Button>
                                        </View>
                                    </View>
                                </View>
                        }
                    </View>


                    <ScoreboardMessageModal editorURL={scoreboardLink} isOpen={showScoreboardMessage} onClose={() => {
                        setShowScoreboardMessage(false)
                    }}></ScoreboardMessageModal>

                    <NewScoreBoardModal onClose={(reload = true) => {
                        setShowNewScoreboardModal(false)
                        if (reload === true) {
                            getScoreboards()
                        }
                    }} isOpen={showNewScoreboardModal}></NewScoreBoardModal>
                    {
                        showScoreboardSettings ?
                            <EditScoreboardSettingsModal
                                scoreboardID={selectedScoreboardID}
                                {...scoreboardList[selectedScoreboardIndex]}
                                isOpen={showScoreboardSettings} onClose={() => {
                                    setShowScoreboardSettings(false)
                                }} ></EditScoreboardSettingsModal>
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