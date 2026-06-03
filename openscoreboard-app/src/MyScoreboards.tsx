

import React, { Component, useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, Share, useWindowDimensions } from 'react-native';
import { Button, View, NativeBaseProvider, ScrollView, Fab, AddIcon, Text } from 'native-base';
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
import { HeaderActions, HeaderIconButton } from './components/HeaderActions';


export default function MyScoreboards(props) {

    let [scoreboardList, setScoreboardList] = useState([])
    let [doneLoading, setDoneLoading] = useState(false)
    let [showNewScoreboardModal, setShowNewScoreboardModal] = useState(false)

    let [showScoreboardMessage, setShowScoreboardMessage] = useState(false)
    let [scoreboardLink, setScoreboardLink] = useState("")
    let [selectedScoreboardID, setSelectedScoreboardID] = useState("")
    let [selectedScoreboardIndex, setSelectedScoreboardIndex] = useState(0)
    let [showScoreboardSettings, setShowScoreboardSettings] = useState(false)
    const { width } = useWindowDimensions()
    const useTwoColumns = width >= 760

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
                <HeaderActions
                    navigation={props.navigation}
                    action={<HeaderIconButton label={i18n.t("createOne")} onPress={() => {
                        setShowNewScoreboardModal(true)
                    }} />}
                />
            ),
        });
        getScoreboards()


    }, [])

    if (doneLoading) {
        return (
            <NativeBaseProvider theme={openScoreboardTheme}>
                <View width={"100%"} height={"100%"}>
                    <View flex={1}>
                        {
                            scoreboardList.length > 0 ?
                                <ScrollView>
                                    <View
                                        alignSelf={"center"}
                                        flexDirection={"row"}
                                        flexWrap={"wrap"}
                                        maxWidth={1180}
                                        paddingY={2}
                                        width={"100%"}
                                    >
                                        {scoreboardList.map((scoreboard, index) => {
                                            return (
                                                <View key={scoreboard[0]} width={useTwoColumns ? "50%" : "100%"}>
                                                    <ScoreboardItem
                                                        item={scoreboard}
                                                        index={index}
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
                                                    />
                                                </View>
                                            )
                                        })}
                                    </View>
                                </ScrollView>
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
                                    getScoreboards()
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
