import React, { useEffect } from 'react';
import { Button, NativeBaseProvider, ScrollView, Text, View } from 'native-base';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getUserPath } from '../database';
import { openScoreboardColor, openScoreboardTheme } from '../openscoreboardtheme';
import { ScorekeeperSessionsPanel } from './components/ScorekeeperSessionsPanel';

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
                <View alignSelf={"center"} maxWidth={960} padding={4} width={"100%"}>
                    <View
                        backgroundColor={"white"}
                        borderColor={"gray.200"}
                        borderRadius={8}
                        borderWidth={1}
                        padding={4}
                    >
                        <View alignItems={"center"} flexDirection={"row"}>
                            <View
                                alignItems={"center"}
                                backgroundColor={"blue.50"}
                                borderRadius={999}
                                height={42}
                                justifyContent={"center"}
                                marginRight={3}
                                width={42}
                            >
                                <MaterialCommunityIcons name="monitor-eye" size={22} color={openScoreboardColor} />
                            </View>
                            <View flex={1}>
                                <Text color={"gray.900"} fontSize={"2xl"} fontWeight={"bold"}>Scorekeeper Sessions</Text>
                                <Text color={"gray.600"} fontSize={"sm"} marginTop={1}>
                                    Monitor live scoring pages, reload kiosks, and block duplicate scorekeepers.
                                </Text>
                            </View>
                            <Button
                                backgroundColor={"white"}
                                borderColor={"blue.100"}
                                borderRadius={8}
                                borderWidth={1}
                                marginLeft={2}
                                onPress={() => props.navigation.navigate("MyTables")}
                                variant={"outline"}
                            >
                                <Text color={"blue.700"} fontSize={"sm"} fontWeight={"bold"}>Back to Tables</Text>
                            </Button>
                        </View>
                    </View>

                    <View
                        backgroundColor={"white"}
                        borderColor={"gray.200"}
                        borderRadius={8}
                        borderWidth={1}
                        marginTop={4}
                        padding={4}
                    >
                        <ScorekeeperSessionsPanel
                            ownerID={ownerID}
                            title={"Live scorekeeper monitor"}
                            description={"Sessions automatically leave this list about a minute after the scorekeeping page disconnects or stops heartbeating. Blocked devices stay blocked until you unblock them."}
                        />
                    </View>
                </View>
            </ScrollView>
        </NativeBaseProvider>
    );
}
