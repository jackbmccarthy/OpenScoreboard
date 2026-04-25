import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Card } from 'heroui-native/card';
import { Separator } from 'heroui-native/separator';
import { getArchivedMatchesForTable, getArchivedMatchesForTeamMatch } from './functions/scoring';
import LoadingPage from './LoadingPage';
import { ArchivedMatchItem } from './listitems/ArchivedMatchItem';
import i18n from './translations/translate';

export default function ArchivedMatchList(props) {

    let [archivedMatchList, setArchivedMatchList] = useState([])
    let [doneLoadingMatchList, setDoneLoadingMatchList] = useState(false)

    async function loadArchivedMatches() {
        setDoneLoadingMatchList(false)
        let matches = await getArchivedMatchesForTable(props.route.params.tableID)
        setArchivedMatchList(matches)
        setDoneLoadingMatchList(true)

    }

    async function loadArchivedTeamMatches() {
        setDoneLoadingMatchList(false)
        let matches = await getArchivedMatchesForTeamMatch(props.route.params.teamMatchID)
        setArchivedMatchList(matches)
        setDoneLoadingMatchList(true)
    }

    useEffect(() => {
        if (props.route.params.tableID) {
            loadArchivedMatches()
        }
        else if (props.route.params.teamMatchID) {
            loadArchivedTeamMatches()
        }

    }, [])
    if (doneLoadingMatchList) {
        return (
            <View style={styles.screen}>
                {
                    archivedMatchList.length > 0 ?
                        <FlatList
                            data={archivedMatchList}
                            contentContainerStyle={styles.listContent}
                            ItemSeparatorComponent={() => <Separator />}
                            renderItem={(item) => {
                                return (
                                    <ArchivedMatchItem {...item}></ArchivedMatchItem>
                                )
                            }}
                        ></FlatList>
                        :
                        <View style={styles.emptyState}>
                            <Card style={styles.emptyCard}>
                                <Card.Body>
                                    <Card.Title style={styles.emptyTitle}>{i18n.t("noArchivedMatchesTable")}</Card.Title>
                                </Card.Body>
                            </Card>
                        </View>
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
        width: "100%",
        backgroundColor: "#f7f7f8",
    },
    listContent: {
        padding: 12,
        gap: 12,
    },
    emptyState: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
    },
    emptyCard: {
        backgroundColor: "#ffffff",
        width: "100%",
        maxWidth: 520,
    },
    emptyBody: {
        backgroundColor: "#ffffff",
    },
    emptyTitle: {
        textAlign: "center",
    },
});
