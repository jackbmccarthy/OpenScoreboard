
import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from 'heroui-native/button';
import { Card } from 'heroui-native/card';
import { AntDesign } from '@expo/vector-icons';
import { getUserPath } from '../database';
import LoadingPage from './LoadingPage';
import { openScoreboardButtonTextColor } from "../openscoreboardtheme";
import getMyTeamMatches from './functions/teammatches';
import { SelectTeamMatchTableModal } from './modals/SelectTeamMatchTableModal';
import { TeamMatchItem } from './listitems/TeamMatchItem';
import { NewTeamMatchModal } from './modals/NewTeamMatchModal';
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
            sportName: sportName,
            scoringType: scoringType
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
                    <Pressable onPress={() => {
                        setShowNewTeamMatchModal(true)
                    }} style={styles.headerAction}>
                        <AntDesign name="plus" size={22} color={openScoreboardButtonTextColor}></AntDesign>
                    </Pressable>

            ),
        });
        loadTeamMatches()


    }, [])

    if (doneLoading) {
        return (
            <View style={styles.screen}>
                <View style={styles.header}>
                    <Text style={styles.eyebrow}>{i18n.t("myTeamMatches")}</Text>
                    <Text style={styles.headline}>Team competition schedule</Text>
                    <Text style={styles.headerText}>Track head-to-head team fixtures, open table assignment, and jump into scorekeeping when the match is ready.</Text>
                </View>
                    {
                        teamMatchList.length > 0 ?
                            <FlatList
                                contentContainerStyle={styles.listContent}
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

                            <View style={styles.emptyWrap}>
                                <Card style={styles.emptyCard}>
                                    <Card.Body style={styles.emptyBody}>
                                        <Text style={styles.emptyTitle}>{i18n.t("noTeamMatches")}</Text>
                                        <Text style={styles.emptyText}>Create a team match to schedule a fixture, assign tables, and manage match-day scoring.</Text>
                                        <Button
                                            onPress={() => {
                                                setShowNewTeamMatchModal(true)
                                            }}
                                            style={styles.primaryButton}
                                        >
                                            <Button.Label>{i18n.t("createOne")}</Button.Label>
                                        </Button>
                                    </Card.Body>
                                </Card>
                            </View>
                    }





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
        minWidth: 160,
    },
});
