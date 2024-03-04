import React, { useState } from 'react';
import { Button, View, Text, Divider } from 'native-base';
import { openScoreboardColor } from "../../openscoreboardtheme";
import { FontAwesome, Ionicons } from '@expo/vector-icons';


export function ScoreboardItem(props) {

    let [showDelete, setShowDelete] = useState(false);
    return (
        <>
            <View>
                <View width="100%" flex={1} padding={2}>

                    <View flexDirection={"row"}>
                        <Text textAlign={"left"} fontSize={"xl"} fontWeight={"bold"}>{props.item[1].name}</Text>
                    </View>
                    {showDelete ?
                        <View alignItems={"center"} flexDirection={"row"}>
                            <Text fontSize={"xl"} fontWeight={"bold"}>Delete this scoreboard?</Text>
                            <View padding={1}>
                                <Button
                                    onPress={() => {
                                        props.onDelete(props.item[0]);
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
                                    <Text>No</Text>
                                </Button>
                            </View>
                        </View>

                        :
                        <View flexDirection={"row"} alignItems="center" justifyContent={"center"}>
                            <View padding={1}>
                                <Button variant={"ghost"} padding={1}
                                    onPress={() => {
                                        props.onSelect(`/editor/?t=editor&sid=${props.item[1].id}`)

                                    }}
                                >
                                    <FontAwesome name='edit' size={24} color={openScoreboardColor} />
                                </Button>
                            </View>
                            <View padding={1}>
                                <Button variant={"ghost"} padding={1}
                                    onPress={() => {
                                        props.openScoreboardSettings(props.item[1].id, props.index)

                                    }}
                                >
                                    <Ionicons name='settings' size={24} color={openScoreboardColor} />
                                </Button>
                            </View>
                            <View padding={1}>
                                <Button variant={"ghost"} padding={1}
                                    onPress={() => {

                                        setShowDelete(true);
                                    }}
                                >
                                    <FontAwesome name='trash' size={24} color={openScoreboardColor} />
                                </Button>
                            </View>


                        </View>}

                </View>
            </View>

            <Divider></Divider>
        </>



    );
}
