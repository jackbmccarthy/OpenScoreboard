import React, { useState } from 'react';
import { Text, Button, View, Divider, Spinner } from 'native-base';
import { FontAwesome } from '@expo/vector-icons';
import { openScoreboardButtonTextColor, openScoreboardColor } from "../../openscoreboardtheme";
import { deletePlayerList } from '../functions/players';

export function PlayerListItem(props) {
    let [showDelete, setShowDelete] = useState(false);
    let [loadingDelete, setLoadingDelete] = useState(false)
    return (
        <View>
            <View padding={1} >
                <Text fontSize={"3xl"} fontWeight="bold">{props.item[1].playerListName}</Text>
                <View flexDirection={"row"} padding={1} justifyContent="space-evenly">
                {showDelete ?
                    <View alignItems={"center"} flexDirection={"row"}>
                        <Text fontSize={"xl"} fontWeight={"bold"}>Delete Player List?</Text>
                        <View padding={1}>
                            <Button variant={"ghost"}
                                onPress={async () => {
                            
                                    setLoadingDelete(true);

                                    await deletePlayerList(props.item[0]);
                                    setLoadingDelete(false);
                                    
                                    if (typeof props.onDelete === "function") {
                                        props.onDelete(props.item[0]);
                                    }
                                }}
                            >   
                            { 
                            loadingDelete ?
                                <Spinner color={openScoreboardColor}></Spinner>:
                                <Text>Yes</Text>
                            }
                                
                            </Button>
                        </View>
                        <View padding={1}>
                            <Button
                                onPress={() => {
                                    setShowDelete(false);
                                }}
                            >
                                <Text color={openScoreboardButtonTextColor}>No</Text>
                            </Button>
                        </View>
                    </View>
                    :
                    <View alignItems={"center"} flexDirection={"row"}>
                        <View padding={1}>
                            <Button variant={"ghost"}
                                onPress={() => {
                                    props.navigation.navigate("AddPlayers", { playerListID: props.item[1].id });
                                }}
                            >
                                <FontAwesome name='edit' size={24} color={openScoreboardColor} />

                            </Button>
                        </View>

                        <View padding={1}>
                            <Button variant={"ghost"}
                                onPress={() => {
                                    setShowDelete(true);
                                }}
                            >
                                <FontAwesome name="trash" size={24} color={openScoreboardColor} />
                            </Button>
                        </View>
                    </View>}
</View>


            </View>
            <Divider></Divider>
        </View>
    );
}
