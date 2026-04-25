
import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from 'heroui-native/button';
import { Card } from 'heroui-native/card';
import { AntDesign } from '@expo/vector-icons';
import { deleteMyScoreboard, getMyScoreboards } from './functions/scoreboards';
import { getUserPath } from '../database';
import LoadingPage from './LoadingPage';
import { openScoreboardButtonTextColor } from "../openscoreboardtheme";
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
                <Pressable onPress={() => {
                        setShowNewScoreboardModal(true)
                    }} style={styles.headerAction}>
                    <AntDesign name="plus" size={22} color={openScoreboardButtonTextColor}></AntDesign>
                </Pressable>

            ),
        });
        getScoreboards()


    }, [])

    if (doneLoading) {
        return (
            <View style={styles.screen}>
                <View style={styles.header}>
                    <Text style={styles.eyebrow}>{i18n.t("myScoreboards")}</Text>
                    <Text style={styles.headline}>Overlay and broadcast layouts</Text>
                    <Text style={styles.headerText}>Keep scoreboard designs ready to launch, adjust visibility rules, and jump into the editor when a layout needs a quick tweak.</Text>
                </View>
                {
                    scoreboardList.length > 0 ?
                        <FlatList
                            contentContainerStyle={styles.listContent}
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
                                        await deleteMyScoreboard(myScoreboardID)
                                        setScoreboardList([...scoreboardList].filter((scoreboard) => {
                                            return scoreboard[0] !== myScoreboardID
                                        }))
                                    }}
                                    {...item} ></ScoreboardItem>
                            }}
                        ></FlatList>
                        :
                        <View style={styles.emptyWrap}>
                            <Card style={styles.emptyCard}>
                                <Card.Body style={styles.emptyBody}>
                                    <Text style={styles.emptyTitle}>{i18n.t("noScoreboards")}</Text>
                                    <Text style={styles.emptyText}>Create a scoreboard layout to power your editor link, dynamic URLs, and live match presentation.</Text>
                                    <Button
                                        onPress={() => {
                                            setShowNewScoreboardModal(true)
                                        }}
                                        style={styles.primaryButton}
                                    >
                                        <Button.Label>{i18n.t("createOne")}</Button.Label>
                                    </Button>
                                </Card.Body>
                            </Card>
                        </View>
                }

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


        )
    }
    else {
        return <LoadingPage></LoadingPage>
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
        color: "#7c3aed",
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
        backgroundColor: "#ffffff",
        maxWidth: 520,
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
