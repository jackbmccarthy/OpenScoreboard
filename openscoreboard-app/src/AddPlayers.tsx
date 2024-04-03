import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, TouchableOpacity, } from 'react-native';
import { ScrollView, Button, View, NativeBaseProvider,  FlatList, AddIcon, Text } from 'native-base';
import { openScoreboardButtonTextColor } from "../openscoreboardtheme";
import { openScoreboardTheme } from "../openscoreboardtheme";
import { deleteImportedPlayer, getImportPlayerList } from './functions/players';
import { sortPlayers } from './functions/players';
import { DeletePlayerModal } from './modals/DeletePlayerModal';
import { AddNewPlayerModal } from './modals/AddNewPlayerModal';
import { PreLoadedPlayerItem } from './listitems/PreLoadedPlayerItem';
import i18n from './translations/translate';


export default function AddPlayers(props) {

    let [playerList, setPlayerList] = useState([])
    let [showAddNewPlayer, setShowAddNewPlayer] = useState(false)
    let [editingPlayer, setEditingPlayer] = useState({})
    let [isEditing, setIsEditing] = useState(false)
    let [isDeleting, setIsDeleting] = useState(false)
    let [deletingPlayer, setDeletingPlayer] = useState({})

    useEffect(() => {

   

        props.navigation.setOptions({
            headerRight: () => (
                <NativeBaseProvider>
                    <Button height={"100%"} width={"100%"} variant={"ghost"} onPress={() => {
                        setShowAddNewPlayer(true)
                        setIsEditing(false)
                    }} >
                        <AddIcon size="xl" color={openScoreboardButtonTextColor}  ></AddIcon>
                    </Button>
                </NativeBaseProvider>

            ),
        });



        async function loadPlayers() {
          
            let playerValues = await getImportPlayerList(props.route.params.playerListID)
            if (playerValues.length > 0) {
                playerValues = sortPlayers(playerValues)
            }
            setPlayerList(playerValues)
           

        }
        loadPlayers()
    }, [props.navigation])


    return (<NativeBaseProvider theme={openScoreboardTheme}>
        <View>

            <ScrollView contentContainerStyle={{ backgroundColor: "white" }}>
            
                    {
                        playerList.length > 0 ?
<FlatList
                    keyExtractor={(item, index) => {
                        return item[0] + index
                    }} 
                    data={playerList}
                    renderItem={(item) => {
                        return <PreLoadedPlayerItem
                            onEdit={(player) => {
                                setEditingPlayer(player)
                                setShowAddNewPlayer(true)
                                setIsEditing(true)
                            }}
                            onDelete={(player) => {
                                setIsDeleting(true)
                                setDeletingPlayer(player)
                            }}
                            {...props} {...item.item[1]} id={item.item[0]} selectedPlayer={{ id: item.item[0], ...item.item[1] }} />
                    }}
                ></FlatList>
                        :
<View justifyContent={"center"} alignItems="center">
                                <View>
                                    <Text fontSize={"xl"} fontWeight="bold">{i18n.t("noPlayersInList")}</Text>
                                    <View padding={2}>
                                        <Button
                                            onPress={() => {
                                                setShowAddNewPlayer(true)
                        setIsEditing(false)
                                            }}
                                        >
                                            <Text color={openScoreboardButtonTextColor}>{i18n.t("createOne")}</Text>
                                        </Button>
                                    </View>
                                </View>
                            </View>
                    }
                



            </ScrollView>
            {
                showAddNewPlayer ?
 <AddNewPlayerModal
             {...props} {...editingPlayer} isOpen={showAddNewPlayer} isEditing={isEditing} onClose={() => {
                setShowAddNewPlayer(false)
                setEditingPlayer({})
            }}
                onConfirmAdd={(player) => {
                    let copiedPlayerList = [...playerList]
                    copiedPlayerList.push([player.id, { ...player }])
                    setPlayerList(sortPlayers(copiedPlayerList))
                    setEditingPlayer({})
                }}

                onConfirmEdit={(player) => {
                    for (let index = 0; index < playerList.length; index++) {
                        const id = playerList[index][0];
                        if (id === player.id) {
                            let copiedPlayerList = [...playerList]
                            copiedPlayerList[index] = [player.id, { ...player }]
                            setPlayerList(sortPlayers(copiedPlayerList))
                        }
                        setEditingPlayer({})

                    }
                }}
            />
                : null
            }
           {
            isDeleting ?
            <DeletePlayerModal {...props}
                onConfirmDelete={async (player) => {
                    deleteImportedPlayer(props.route.params.playerListID, player.id)
                   // db.ref("tournaments/" + props.route.params["tournamentID"] + "/predefinedplayers/" + player.id).remove()
                    for (let index = 0; index < playerList.length; index++) {
                        const id = playerList[index][0];
                        if (id === player.id) {
                            let copiedPlayerList = [...playerList]
                            copiedPlayerList.splice(index, 1)
                            setPlayerList(sortPlayers(copiedPlayerList))
                        }

                    }
                }}
                isOpen={isDeleting} {...deletingPlayer} onClose={() => {
                    setIsDeleting(false)
                }} />

                : null
           }
            
        </View></NativeBaseProvider>
    )
}