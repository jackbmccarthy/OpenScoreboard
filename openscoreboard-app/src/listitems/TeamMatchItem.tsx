import React, { useEffect, useState } from 'react';
import { Button, View, Text, Divider } from 'native-base';
import { openScoreboardColor } from "../../openscoreboardtheme";
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { getTeamMatchTeamScore } from '../functions/teammatches';

export function TeamMatchItem(props) {

    return (
        <View width={"100%"} padding={1}>

            <Text fontSize={"xl"} textAlign={"center"}>{props.item[1].teamAScore} - {props.item[1].teamAName} <Text fontWeight={"bold"}>VS </Text> {props.item[1].teamBName} -  {props.item[1].teamBScore}</Text>
            <Text fontSize={"lg"} textAlign={"center"}>{props.item[1]["sportName"] ? props.item[1]["sportDisplayName"] + " - " : ""}{new Date(props.item[1].startTime).toLocaleDateString()}</Text>

            <View flexDirection={"row"} padding={1} justifyContent="center">

                <Button variant={"ghost"}
                    onPress={() => {
                        props.openTeamMatchTableSelection(props.item[1].id, props.index);
                    }}
                >
                    <MaterialCommunityIcons name="scoreboard" size={24} color={openScoreboardColor} />

                </Button>
                <View>
                    <Button
                        onPress={() => {
                            props.openTeamMatchEdit(props.item[1].id, props.index);
                        }}
                        variant="ghost"

                    >
                        <FontAwesome name="edit" size={24} color={openScoreboardColor} />
                    </Button>
                </View>
                <View>
                    <Button
                        onPress={() => {
                            props.navigation.navigate("ArchivedMatchList", { teamMatchID: props.item[1].id, });
                        }}
                        variant="ghost"

                    >
                        <FontAwesome name="history" size={24} color={openScoreboardColor} />
                    </Button>
                </View>
                <View>
                    <Button
                        onPress={() => {
                            props.openDeleteTeamMatch(props.item[0])
                        }}
                        variant="ghost"

                    >
                        <FontAwesome name="trash" size={24} color={openScoreboardColor} />
                    </Button>
                </View>
                {/* <View>
                    <Button variant={"ghost"}
                        onPress={() => {
                            props.openTeamMatchTableSelection(props.item[1].id);
                        }}
                    >
                        <FontAwesome name="edit" size={24} color={openScoreboardColor} />

                    </Button>

                </View> */}

            </View>
            <Divider></Divider>
        </View>
    );
}
