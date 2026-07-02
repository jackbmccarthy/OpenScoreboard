

import React, { useEffect, useMemo, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { View, NativeBaseProvider, ScrollView } from 'native-base';
import { deleteMyScoreboard, getMyScoreboards } from './functions/scoreboards';
import { getUserPath } from '../database';
import LoadingPage from './LoadingPage';
import { openScoreboardTheme } from "../openscoreboardtheme";
import { NewScoreBoardModal } from './modals/NewScoreBoardModal';
import { ScoreboardItem } from './listitems/ScoreboardItem';
import { ScoreboardMessageModal } from './modals/ScoreboardMessageModal';
import { EditScoreboardSettingsModal } from './modals/EditScoreboardSettingsModal';
import i18n from './translations/translate';
import { HeaderActions, HeaderIconButton } from './components/HeaderActions';
import { EmptyState, ListPageHeader, ListToolbar, PageScaffold } from './components/ListPage';
import { compareByCreatedDesc } from './functions/listSorting';

const scoreboardSortOptions = [
    { label: "Recently created", value: "createdDesc" },
    { label: "Name A-Z", value: "nameAsc" },
    { label: "Name Z-A", value: "nameDesc" },
    { label: "Type A-Z", value: "typeAsc" },
];

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

function sortScoreboards(scoreboards, sortBy) {
    return [...scoreboards].sort((firstEntry, secondEntry) => {
        const firstScoreboard = firstEntry?.[1] || {};
        const secondScoreboard = secondEntry?.[1] || {};
        const firstName = `${firstScoreboard.name || ""}`.toLowerCase();
        const secondName = `${secondScoreboard.name || ""}`.toLowerCase();

        if (sortBy === "nameAsc") {
            return firstName.localeCompare(secondName);
        }

        if (sortBy === "nameDesc") {
            return secondName.localeCompare(firstName);
        }

        if (sortBy === "typeAsc") {
            return getScoreboardTypeLabel(firstScoreboard.type).localeCompare(getScoreboardTypeLabel(secondScoreboard.type)) || firstName.localeCompare(secondName);
        }

        return compareByCreatedDesc(firstEntry, secondEntry) || firstName.localeCompare(secondName);
    });
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
    let [scoreboardSort, setScoreboardSort] = useState("createdDesc")
    const { width } = useWindowDimensions()
    const useTwoColumns = width >= 760

    const filteredScoreboards = useMemo(() => {
        const filteredList = scoreboardList.filter((scoreboard) => scoreboardMatchesSearch(scoreboard, searchText));
        return sortScoreboards(filteredList, scoreboardSort);
    }, [scoreboardList, scoreboardSort, searchText])

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
                            <PageScaffold>
                                <ListPageHeader
                                    actionIcon={"plus"}
                                    actionLabel={i18n.t("createOne")}
                                    description={"Manage every scoreboard saved under your account. Open a design, adjust settings, or find a specific scoreboard by name or type."}
                                    onAction={() => setShowNewScoreboardModal(true)}
                                    title={"My Scoreboards"}
                                />
                                {scoreboardList.length > 0 ? (
                                    <ListToolbar
                                        countLabel={`Showing ${filteredScoreboards.length} of ${scoreboardList.length} scoreboard${scoreboardList.length === 1 ? "" : "s"}.`}
                                        onSearchChange={setSearchText}
                                        onSortChange={setScoreboardSort}
                                        searchPlaceholder={"Search scoreboards by name or type"}
                                        searchValue={searchText}
                                        sortOptions={scoreboardSortOptions}
                                        sortValue={scoreboardSort}
                                    />
                                ) : null}

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
                                    <EmptyState
                                        actionLabel={scoreboardList.length > 0 ? "Clear search" : i18n.t("createOne")}
                                        description={scoreboardList.length > 0 ? "Try searching by another scoreboard name or type." : "Create a scoreboard design for tables, team matches, streams, or venue displays."}
                                        icon={scoreboardList.length > 0 ? "scoreboard-outline" : "scoreboard"}
                                        onAction={() => scoreboardList.length > 0 ? setSearchText("") : setShowNewScoreboardModal(true)}
                                        title={scoreboardList.length > 0 ? "No scoreboards match your search" : i18n.t("noScoreboards")}
                                    />
                                )}
                            </PageScaffold>
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
