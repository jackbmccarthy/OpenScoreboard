import React, { useState } from 'react';
import { Button, Text, View, Avatar, NativeBaseProvider, Divider } from 'native-base';
import { FontAwesome } from '@expo/vector-icons';
import { openScoreboardButtonTextColor } from "../../openscoreboardtheme";
import { openScoreboardTheme } from "../../openscoreboardtheme";

export function PreLoadedPlayerItem(props) {
    let [isSelected, setIsSelected] = useState(props.isSelected);
    let [isDeleted, setIsDeleted] = useState(false);


    return (
        <NativeBaseProvider theme={openScoreboardTheme}>
            <View>

                <View padding={2} justifyContent={"space-between"} alignItems={"center"} flexDirection={"row"}>
                    <View alignItems={"center"} flexDirection={"row"}>
                        {props.imageURL && props.imageURL.length > 0 ?
                            <View padding={1}>
                                <Avatar square source={{ uri: props.imageURL }}></Avatar>
                            </View>
                            : null}
                        <Text fontSize={"lg"} fontWeight="bold">{props.firstName + " " + props.lastName}</Text>
                    </View>
                    <View style={{ flexDirection: "row" }}>
                        <View padding={1}>
                            <Button
                                onPress={() => {
                                    props.onEdit(props.selectedPlayer);
                                }}
                            >
                                <FontAwesome color={openScoreboardButtonTextColor} name="edit"></FontAwesome>
                            </Button>
                        </View>
                        <View padding={1}>
                            <Button onPress={() => {
                                props.onDelete(props.selectedPlayer);
                            }}>
                                <FontAwesome color={openScoreboardButtonTextColor} name="trash"></FontAwesome>
                            </Button>
                        </View>

                    </View>
                </View>



            </View>

            <Divider></Divider>
        </NativeBaseProvider>

    );



}
