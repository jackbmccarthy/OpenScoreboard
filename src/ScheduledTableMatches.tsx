import React, { useEffect, useState } from 'react';
import { View, Input, Button, ScrollView, FlatList, NativeBaseProvider, AddIcon, Text } from 'native-base';
import { TouchableOpacity } from 'react-native';

import LoadingPage from './LoadingPage';

import { getScheduledTableMatches } from './functions/tables';
import { openScoreboardButtonTextColor } from "../openscoreboardtheme";
import { openScoreboardTheme } from "../openscoreboardtheme";
import { EditPlayer } from './EditPlayer';
import { EditScheduledMatchModal } from './modals/EditScheduledMatchModal';
import { NewScheduledMatchModal } from './modals/NewScheduledMatchModal';
import { ScheduledMatchItem } from './listitems/ScheduledMatchItem';
import i18n from './translations/translate';



export default function ScheduledTableMatches(props) {
    let [selectedIndex, setSelectedIndex] = useState("")
    let [loadingDone, setLoadingDone] = useState(false)
    let [scheduledMatches, setScheduledMatches] = useState([])
    let [showCreateNewScheduledMatch, setShowCreateNewScheduledMatch] = useState(false)
    let [showEditScheduledMatch, setShowEditScheduledMatch] = useState(false)
    let [editMatch, setEditMatch] = useState({})


    async function loadScheduledMatches() {
        setLoadingDone(false)
        let matches = await getScheduledTableMatches(props.route.params.tableID)
        setScheduledMatches(matches)
        setLoadingDone(true)
    }

    useEffect(() => {
        loadScheduledMatches()

        props.navigation.setOptions({
            headerRight: () => (
                <NativeBaseProvider>
                    <Button height={"100%"} width={"100%"} variant={"ghost"} onPress={() => {
                        setShowCreateNewScheduledMatch(true)
                    }} >
                        <AddIcon size="xl" color={openScoreboardButtonTextColor}  ></AddIcon>
                    </Button>
                </NativeBaseProvider>

            ),
        });
    }, [])
    if (loadingDone) {
        return (
            <NativeBaseProvider theme={openScoreboardTheme}>
                <View>
                    {
                        scheduledMatches.length > 0 ?
                            <FlatList
                                data={scheduledMatches.sort((a, b) => {
                                    return new Date(a[1]["startTime"]) > new Date(b[1]["startTime"]) ? -1 : 1
                                })}
                                renderItem={(match) => {
                                    return (
                                        <ScheduledMatchItem reload={loadScheduledMatches} {...props} setShowEditScheduledMatch={setShowEditScheduledMatch} setEditMatch={setEditMatch} {...match} ></ScheduledMatchItem>
                                    )
                                }}
                            />
                            :
                            <View justifyContent={"center"} alignItems="center">
                                <View>
                                    <Text fontSize={"xl"} fontWeight="bold">{i18n.t("noScheduledTables")}</Text>
                                    <View padding={2}>
                                        <Button
                                            onPress={() => {
                                                setShowCreateNewScheduledMatch(true)
                                            }}
                                        >
                                            <Text color={openScoreboardButtonTextColor}>{i18n.t("createOne")}</Text>
                                        </Button>
                                    </View>
                                </View>
                            </View>
                    }

                    {
                        showCreateNewScheduledMatch ?
                            <NewScheduledMatchModal isOpen={showCreateNewScheduledMatch}
                                {...props}
                                onClose={(reload) => {
                                    setShowCreateNewScheduledMatch(false)
                                    if (reload) {
                                        loadScheduledMatches()
                                    }
                                }}></NewScheduledMatchModal>
                            : null
                    }


                    {
                        showEditScheduledMatch ?
                            <EditScheduledMatchModal

                                isOpen={showEditScheduledMatch}
                                {...props} {...editMatch}
                                onClose={(reload) => {
                                    setShowEditScheduledMatch(false)
                                    if (reload) {
                                        loadScheduledMatches()
                                    }
                                }} />
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