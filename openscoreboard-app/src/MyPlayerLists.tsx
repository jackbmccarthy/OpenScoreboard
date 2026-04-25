

import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from 'heroui-native/card';
import { Spinner } from 'heroui-native/spinner';
import { AntDesign } from '@expo/vector-icons';
import { openScoreboardButtonTextColor, openScoreboardColor } from "../openscoreboardtheme";
import { getMyPlayerLists } from './functions/players';
import LoadingPage from './LoadingPage';
import { AddPlayerListModal } from './modals/AddPlayerListModal';
import { PlayerListItem } from './listitems/PlayerListItem';
import i18n from './translations/translate';

export default function MyPlayerLists(props) {
    let [doneLoading, setDoneLoading] = useState(false)
    let [myPlayerLists, setMyPlayerLists] = useState([])
    let [showNewPlayerList, setShowNewPlayerList] = useState(false)

    async function loadMyPlayerList() {
        setDoneLoading(false)
        let playerLists = await getMyPlayerLists()
        setMyPlayerLists(playerLists)
        setDoneLoading(true)
    }

    useEffect(() => {
        props.navigation.setOptions({
            headerRight: () => (
                    <Pressable onPress={() => {
                        setShowNewPlayerList(true)
                    }} style={styles.headerAction}>
                        <AntDesign name="plus" size={22} color={openScoreboardButtonTextColor}></AntDesign>
                    </Pressable>

            ),
        });
        loadMyPlayerList()


    }, [])

    if (doneLoading) {
        return (
            <View style={styles.screen}>
                <View style={styles.header}>
                    <Text style={styles.eyebrow}>{i18n.t("playerLists")}</Text>
                    <Text style={styles.headline}>Reusable player sources</Text>
                    <Text style={styles.headerText}>Build player pools once, then pull them into scoring and registration workflows whenever you need them.</Text>
                </View>

                {
                    myPlayerLists.length > 0 ?
                        <FlatList
                            contentContainerStyle={styles.listContent}
                            data={myPlayerLists}
                            renderItem={(item) => {
                                return <PlayerListItem
                                    onDelete={(myPlayerListID) => {
                                        let newList = myPlayerLists.filter((playerList) => {
                                            return playerList[0] !== myPlayerListID
                                        })
                                        setMyPlayerLists(newList)
                                    }}
                                    {...props} {...item}></PlayerListItem>
                            }}
                        ></FlatList>
                        :
                        <View style={styles.emptyWrap}>
                            <Card style={styles.emptyCard}>
                                <Card.Body style={styles.emptyBody}>
                                    <Text style={styles.emptyTitle}>{i18n.t("noPlayerLists")}</Text>
                                    <Text style={styles.emptyText}>Start with a player list so imports and registrations have a shared source of truth.</Text>
                                    <Pressable
                                        onPress={() => {
                                            setShowNewPlayerList(true)
                                        }}
                                        style={({ pressed }) => [styles.primaryButton, pressed ? styles.primaryButtonPressed : null]}
                                    >
                                        <Text style={styles.primaryButtonLabel}>{i18n.t("createOne")}</Text>
                                    </Pressable>
                                </Card.Body>
                            </Card>
                        </View>
                }


                {
                    showNewPlayerList ?
                        <AddPlayerListModal {...props} isOpen={showNewPlayerList} onClose={(reload = true) => {
                            setShowNewPlayerList(false)
                            if (reload) {
                                loadMyPlayerList()
                            }
                        }} ></AddPlayerListModal>
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
        alignItems: "center",
        backgroundColor: "#2563eb",
        borderRadius: 10,
        justifyContent: "center",
        minHeight: 42,
        minWidth: 160,
        paddingHorizontal: 18,
    },
    primaryButtonLabel: {
        color: "#ffffff",
        fontSize: 14,
        fontWeight: "700",
    },
    primaryButtonPressed: {
        opacity: 0.8,
    },
});
