

import React, { useEffect, useState } from 'react';
import { Text, Button, View, NativeBaseProvider, FlatList, AddIcon, } from 'native-base';
import { openScoreboardButtonTextColor } from "../openscoreboardtheme";
import { openScoreboardTheme } from "../openscoreboardtheme";
import { getMyPlayerLists } from './functions/players';
import LoadingPage from './LoadingPage';
import { AddPlayerListModal } from './modals/AddPlayerListModal';
import { PlayerListItem } from './listitems/PlayerListItem';

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
                <NativeBaseProvider>
                    <Button height={"100%"} width={"100%"} variant={"ghost"} onPress={() => {
                        setShowNewPlayerList(true)
                    }} >
                        <AddIcon size="xl" color={openScoreboardButtonTextColor}  ></AddIcon>
                    </Button>
                </NativeBaseProvider>

            ),
        });
        loadMyPlayerList()


    }, [])

    if (doneLoading) {
        return (
            <NativeBaseProvider theme={openScoreboardTheme}>

                <View width={"100vw"} height={"100vh"}>
                    <View flex={1}>
                        {
                            myPlayerLists.length > 0 ?
                                <FlatList
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
                                <View justifyContent={"center"} alignItems="center">
                                    <View>
                                        <Text fontSize={"xl"} fontWeight="bold">You have no Player Lists.</Text>
                                        <View padding={2}>
                                            <Button
                                                onPress={() => {
                                                    setShowNewPlayerList(true)
                                                }}
                                            >
                                                <Text color={openScoreboardButtonTextColor}>Create One!</Text>
                                            </Button>
                                        </View>
                                    </View>
                                </View>
                        }

                    </View>


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
            </NativeBaseProvider>
        )
    }
    else {
        return <LoadingPage></LoadingPage>
    }

}