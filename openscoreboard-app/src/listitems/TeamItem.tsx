import React, { useState } from 'react';
import { Button, View, Text, Divider } from 'native-base';
import { openScoreboardButtonTextColor, openScoreboardColor } from "../../openscoreboardtheme";
import { FontAwesome } from '@expo/vector-icons';
import { deleteMyTeam } from '../functions/teams';

export function TeamItem(props) {

    let [showDelete, setShowDelete] = useState(false);
    let [loadingDelete, setLoadingDelete] = useState();
    return (
        <View>
            <View padding={1}>
<Text fontSize={"3xl"} fontWeight="bold">{props.item[1].name}</Text>
            </View>
            
            <View padding={1} >
                
                {showDelete ?
                    <View alignItems={"center"} flexDirection={"row"} justifyContent={"space-around"}>
                        <Text fontSize={"xl"} fontWeight={"bold"}>Delete Team?</Text>
                        <View padding={1}>
                            <Button variant={"ghost"}
                                onPress={async () => {
                                    setLoadingDelete(true);
                                    await deleteMyTeam(props.item[0]);
                                    setLoadingDelete(false);
                                    if (typeof props.onDelete === "function") {
                                        props.onDelete(props.item[0]);
                                    }
                                }}
                            >
                                <Text>Yes</Text>
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
                    <View alignItems={"center"} flexDirection={"row"} justifyContent={"center"}>
                        <View padding={1}>
                            <Button variant={"ghost"}
                                onPress={() => {
                                    props.openEditTeam(props.item[1].id, props.item[0]);
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
            <Divider></Divider>
        </View>
    );
}
