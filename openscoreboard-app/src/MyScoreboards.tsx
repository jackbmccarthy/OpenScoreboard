

import React, { useEffect, useMemo, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { Button, View, NativeBaseProvider, ScrollView, Text, Input } from 'native-base';
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

function getScoreboardTypeLabel(type) {
    if (!type) {
        return "Scoreboard";
    }

    return `${type}`
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (letter) => letter.toUpperCase())
        .trim();
}

function scoreboardMatchesSearch(scoreboardEntry, searchText) {
    const normalizedSearch = searchText.trim().toLowerCase();

    if (!normalizedSearch) {
        return true;
    }

    const [scoreboardID, scoreboard = {}] = scoreboardEntry || [];
    const searchableText = [
        scoreboardID,
        scoreboard.id,
        scoreboard.name,
        scoreboard.type,
        getScoreboardTypeLabel(scoreboard.type),
    ].filter(Boolean).join(" ").toLowerCase();

    return searchableText.includes(normalizedSearch);
}

export default function MyScoreboards(props) {

    let [scoreboardList, setScoreboardList] = useState([])
    let [doneLoading, setDoneLoading] = useState(false)
    let [showNewScoreboardModal, setShowNewScoreboardModal] = useState(false)

    let [showScoreboardMessage, setShowScoreboardMessage] = useState(false)
    let [scoreboardLink, setScoreboardLink] = useState("")
    let [selectedScoreboardID, setSelectedScoreboardID] = useState("")
    let [selectedScoreboardIndex, setSelectedScoreboardIndex] = useState(0)
    let [showScoreboardSettings, setShowScoreboardSettings] = useState(false)
    let [searchText, setSearchText] = useState("")
    const { width } = useWindowDimensions()
    const useTwoColumns = width >= 760

    const filteredScoreboards = useMemo(() => {
        return scoreboardList.filter((scoreboard) => scoreboardMatchesSearch(scoreboard, searchText))
    }, [scoreboardList, searchText])

    const openScoreboardSettings = (scoreboardID) => {
        const index = scoreboardList.findIndex((scoreboard) => {
            return scoreboard?.[0] === scoreboardID || scoreboard?.[1]?.id === scoreboardID
        })
        setSelectedScoreboardID(scoreboardID)
        setSelectedScoreboardIndex(index >= 0 ? index : 0)
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
                        <ScrollView backgroundColor={"gray.50"}>
                            <View
                                alignSelf={"center"}
                                maxWidth={1180}
                                padding={4}
                                width={"100%"}
                            >
                                <View
                                    backgroundColor={"white"}
                                    borderColor={"gray.200"}
                                    borderRadius={8}
                                    borderWidth={1}
                                    padding={4}
                                >
                                    <Text color={"gray.900"} fontSize={"2xl"} fontWeight={"bold"}>
                                        My Scoreboards
                                    </Text>
                                    <Text color={"gray.600"} fontSize={"sm"} marginTop={1}>
                                        Manage every scoreboard saved under your account. Open a design, adjust settings, or find a specific scoreboard by name or type.
                                    </Text>
                                    <Text color={"gray.500"} fontSize={"xs"} fontWeight={"bold"} marginTop={3} textTransform={"uppercase"}>
                                        {scoreboardList.length} {scoreboardList.length === 1 ? "scoreboard" : "scoreboards"}
                                    </Text>
                                    <Input
                                        marginTop={3}
                                        placeholder={"Search scoreboards by name or type"}
                                        value={searchText}
                                        onChangeText={setSearchText}
                                    />
                                </View>

                                {scoreboardList.length > 0 && filteredScoreboards.length > 0 ? (
                                    <View
                                        flexDirection={"row"}
                                        flexWrap={"wrap"}
                                        marginTop={2}
                                        width={"100%"}
                                    >
                                        {filteredScoreboards.map((scoreboard) => {
                                            return (
                                                <View key={scoreboard[0]} width={useTwoColumns ? "50%" : "100%"}>
                                                    <ScoreboardItem
                                                        item={scoreboard}
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
                                ) : (
                                    <View
                                        alignItems={"center"}
                                        backgroundColor={"white"}
                                        borderColor={"gray.200"}
                                        borderRadius={8}
                                        borderWidth={1}
                                        marginTop={4}
                                        padding={6}
                                    >
                                        <Text color={"gray.900"} fontSize={"xl"} fontWeight="bold">
                                            {scoreboardList.length > 0 ? "No scoreboards match your search" : i18n.t("noScoreboards")}
                                        </Text>
                                        {scoreboardList.length > 0 ? (
                                            <Button marginTop={3} onPress={() => setSearchText("")} variant={"outline"}>
                                                <Text color={"blue.700"} fontWeight={"bold"}>Clear search</Text>
                                            </Button>
                                        ) : (
                                            <View padding={2}>
                                            <Button
                                                onPress={() => {
                                                    setShowNewScoreboardModal(true)
                                                }}
                                            >
                                                <Text color={openScoreboardButtonTextColor}>{i18n.t("createOne")}</Text>
                                            </Button>
                                            </View>
                                        )}
                                    </View>
                                )}
                            </View>
                        </ScrollView>
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
