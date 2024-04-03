import React, { useEffect, useState } from 'react';
import { View, NativeBaseProvider, FlatList, Divider, Text, Button } from 'native-base';
import { TextInput } from 'react-native';
import db from '../database';
import { FontAwesome } from '@expo/vector-icons'
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
            <NativeBaseProvider>
                <View width={"100vw"} height={"100vh"}>
                    <View flex={1}></View>
                    {
                        archivedMatchList.length > 0 ?
                            <FlatList
                                data={archivedMatchList}
                                renderItem={(item) => {
                                    return (
                                        <>
                                            <ArchivedMatchItem {...item}></ArchivedMatchItem>
                                            <Divider></Divider>
                                        </>
                                    )
                                }}
                            ></FlatList>
                            :
                            <View justifyContent={"center"} alignItems="center">
                                <View>
                                    <Text fontSize={"xl"} fontWeight="bold">{i18n.t("noArchivedMatchesTable")}</Text>
                                    
                                </View>
                            </View>
                    }

                </View>


            </NativeBaseProvider>

        )
    }
    else {
        return <LoadingPage></LoadingPage>
    }

}