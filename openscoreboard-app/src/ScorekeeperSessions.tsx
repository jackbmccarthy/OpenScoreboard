import React, { useEffect } from 'react';
import { NativeBaseProvider, ScrollView, View } from 'native-base';
import { getUserPath } from '../database';
import { openScoreboardTheme } from '../openscoreboardtheme';
import { ScorekeeperSessionsPanel } from './components/ScorekeeperSessionsPanel';
import { ListPageHeader, PageScaffold } from './components/ListPage';

export default function ScorekeeperSessions(props) {
    const ownerID = getUserPath() || "";

    useEffect(() => {
        props.navigation.setOptions({
            title: "Scorekeeper Sessions",
        });
    }, [props.navigation]);

    return (
        <NativeBaseProvider theme={openScoreboardTheme}>
            <ScrollView backgroundColor={"gray.50"} contentContainerStyle={{ paddingBottom: 40 }}>
                <PageScaffold>
                    <ListPageHeader
                        actionIcon={"table"}
                        actionLabel={"Back to Tables"}
                        description={"Monitor live scoring pages, reload kiosks, and block duplicate scorekeepers."}
                        onAction={() => props.navigation.navigate("MyTables")}
                        title={"Scorekeeper Sessions"}
                    />

                    <View
                        backgroundColor={"white"}
                        borderColor={"gray.200"}
                        borderRadius={8}
                        borderWidth={1}
                        marginX={3}
                        marginTop={4}
                        padding={4}
                    >
                        <ScorekeeperSessionsPanel
                            ownerID={ownerID}
                            title={"Live scorekeeper monitor"}
                            description={"Sessions automatically leave this list about a minute after the scorekeeping page disconnects or stops heartbeating. Blocked devices stay blocked until you unblock them."}
                        />
                    </View>
                </PageScaffold>
            </ScrollView>
        </NativeBaseProvider>
    );
}
