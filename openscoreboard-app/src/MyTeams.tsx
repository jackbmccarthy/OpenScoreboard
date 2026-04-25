
import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from 'heroui-native/card';
import { AntDesign } from '@expo/vector-icons';
import { getUserPath } from '../database';
import LoadingPage from './LoadingPage';
import { openScoreboardButtonTextColor } from "../openscoreboardtheme";
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
                    <Pressable onPress={() => {
                        setEditingMyTeamID("")
                        setEditingTeamID("")
                        setIsEditingTeam(false)

                        setShowNewTeamModal(true)
                    }} style={styles.headerAction}>
                        <AntDesign name="plus" size={22} color={openScoreboardButtonTextColor}></AntDesign>
                    </Pressable>

            ),
        });
        loadTeams()


    }, [])

    if (doneLoading) {
        return (
            <View style={styles.screen}>
                <View style={styles.header}>
                    <Text style={styles.eyebrow}>{i18n.t("myTeams")}</Text>
                    <Text style={styles.headline}>Team rosters and identities</Text>
                    <Text style={styles.headerText}>Keep logos, names, and players organized so team matches are ready to assign without extra setup.</Text>
                </View>
                {
                    teamList.length > 0 ?
                        <FlatList
                            contentContainerStyle={styles.listContent}
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
                        <View style={styles.emptyWrap}>
                            <Card style={styles.emptyCard}>
                                <Card.Body style={styles.emptyBody}>
                                    <Text style={styles.emptyTitle}>{i18n.t("noTeams")}</Text>
                                    <Text style={styles.emptyText}>Create a team once and reuse it across team matches, lineups, and table assignments.</Text>
                                    <Pressable
                                        onPress={() => {
                                            setShowNewTeamModal(true)
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
        color: "#16a34a",
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
