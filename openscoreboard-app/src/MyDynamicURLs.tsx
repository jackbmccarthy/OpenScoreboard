
import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from 'heroui-native/button';
import { Card } from 'heroui-native/card';
import { AntDesign } from '@expo/vector-icons';

import { openScoreboardButtonTextColor } from "../openscoreboardtheme";

import LoadingPage from './LoadingPage';
import { getMyDynamicURLs } from './functions/dynamicurls';
import { DynamicURLItem } from './listitems/DynamicURLItem';
import { EditDynamicURLModal } from './modals/EditDynamicURLModal';
import { CreateDynamicURLModal } from './modals/CreateDynamicURLModal';
import i18n from './translations/translate';

export default function MyDynamicURLs(props) {

    let [showNewDynamicURLModal, setShowNewDynamicURLModal] = useState(false)
    let [doneLoading, setDoneLoading] = useState(false)
    let [dynamicURLList, setDynamicURLList] = useState([])
    let [showEditDynamicURLModal, setShowEditDynamicModal] = useState(false)
    let [editDynamicURL, setEditDynamicURL] = useState({})


    async function loadMyDynamicURLs() {
        setDoneLoading(false)
        let myURLs = await getMyDynamicURLs(true)
        setDynamicURLList(myURLs)
        setDoneLoading(true)
    }

    const openEditDynamicURLModal = (myDynamicURLID, dynamicURLSettings) => {
        setEditDynamicURL({ ...dynamicURLSettings, myID: myDynamicURLID })
        setShowEditDynamicModal(true)

    }



    useEffect(() => {



        props.navigation.setOptions({
            headerRight: () => (
                <Pressable onPress={() => {
                        setShowNewDynamicURLModal(true)
                    }} style={styles.headerAction}>
                    <AntDesign name="plus" size={22} color={openScoreboardButtonTextColor}></AntDesign>
                </Pressable>

            ),
        });

        loadMyDynamicURLs()
    }, [])

    if (doneLoading) {
        return (
            <View style={styles.screen}>
                <View style={styles.header}>
                    <Text style={styles.eyebrow}>{i18n.t("dynamicURLs")}</Text>
                    <Text style={styles.headline}>Reusable public links</Text>
                    <Text style={styles.headerText}>Tie scorekeeping and display links to a scoreboard so operators can rotate tables and team matches without rebuilding share links.</Text>
                </View>
                {
                    dynamicURLList.length > 0 ?
                        <FlatList
                            contentContainerStyle={styles.listContent}
                            data={dynamicURLList}
                            keyExtractor={(item) => item[0]}
                            renderItem={(item) => {
                                return (
                                    <DynamicURLItem
                                        reload={() => { loadMyDynamicURLs() }}
                                        openEditDynamicURLModal={openEditDynamicURLModal}
                                        {...item} ></DynamicURLItem>
                                )
                            }}
                        >

                        </FlatList>
                        :
                        <View style={styles.emptyWrap}>
                            <Card style={styles.emptyCard}>
                                <Card.Body style={styles.emptyBody}>
                                    <Text style={styles.emptyTitle}>{i18n.t("noDynamicURLs")}</Text>
                                    <Text style={styles.emptyText}>Create a dynamic URL when you want one stable public link that can follow a table, match, or scoreboard assignment.</Text>
                                    <Button
                                        onPress={() => {
                                            setShowNewDynamicURLModal(true)
                                        }}
                                        style={styles.primaryButton}
                                    >
                                        <Button.Label>{i18n.t("createOne")}</Button.Label>
                                    </Button>
                                </Card.Body>
                            </Card>
                        </View>
                }



                {showNewDynamicURLModal ?
                    <CreateDynamicURLModal isOpen={showNewDynamicURLModal}
                        onClose={(reload) => {
                            setShowNewDynamicURLModal(false)
                            if (reload) {
                                loadMyDynamicURLs()
                            }
                        }}
                    ></CreateDynamicURLModal>
                    : null
                }
                {showEditDynamicURLModal ?
                    <EditDynamicURLModal {...editDynamicURL}
                        isOpen={showEditDynamicURLModal}
                        onClose={(reload) => {

                            setShowEditDynamicModal(false)
                            if (reload) {
                                loadMyDynamicURLs()
                            }
                        }}
                    ></EditDynamicURLModal>
                    : null
                }


            </View>
        )
    }
    else {
        return (
            <LoadingPage></LoadingPage>
        )
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
        color: "#0f766e",
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
        maxWidth: 680,
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
        maxWidth: 400,
        textAlign: "center",
    },
    primaryButton: {
        minWidth: 160,
    },
});
