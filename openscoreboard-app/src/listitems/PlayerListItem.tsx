import React, { useState } from 'react';
import { Text, Button, View } from 'native-base';
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { openScoreboardButtonTextColor, openScoreboardColor } from "../../openscoreboardtheme";

function ActionButton({ label, icon, onPress, tone = "default", isPrimary = false }) {
    const isDanger = tone === "danger";
    const foreground = isDanger ? "#B91C1C" : isPrimary ? openScoreboardButtonTextColor : openScoreboardColor;

    return (
        <Button
            backgroundColor={isPrimary ? openScoreboardColor : "white"}
            borderColor={isDanger ? "red.200" : isPrimary ? openScoreboardColor : "blue.100"}
            borderRadius={8}
            borderWidth={1}
            justifyContent={"flex-start"}
            marginRight={2}
            marginTop={2}
            minHeight={44}
            onPress={onPress}
            paddingX={3}
            variant={isPrimary ? "solid" : "outline"}
        >
            <View alignItems={"center"} flexDirection={"row"}>
                {icon(foreground)}
                <Text
                    color={isDanger ? "red.700" : isPrimary ? openScoreboardButtonTextColor : "blue.700"}
                    fontSize={"sm"}
                    fontWeight={"bold"}
                    marginLeft={2}
                >
                    {label}
                </Text>
            </View>
        </Button>
    );
}

function formatModifiedDate(value) {
    if (!value) {
        return "Unknown";
    }

    const date = value instanceof Date ? value : new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Unknown";
    }

    return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

function MetadataPill({ label, value }) {
    return (
        <View
            backgroundColor={"gray.50"}
            borderColor={"gray.200"}
            borderRadius={999}
            borderWidth={1}
            marginRight={2}
            marginTop={2}
            paddingX={3}
            paddingY={1}
        >
            <Text color={"gray.500"} fontSize={"2xs"} fontWeight={"bold"} textTransform={"uppercase"}>
                {label}
            </Text>
            <Text color={"gray.900"} fontSize={"sm"} fontWeight={"bold"}>
                {value}
            </Text>
        </View>
    );
}

export function PlayerListItem(props) {
    const playerList = props.item[1];
    const playerCount = playerList.playerCount || 0;

    return (
        <View
            backgroundColor={"white"}
            borderColor={"gray.200"}
            borderRadius={8}
            borderWidth={1}
            marginX={3}
            marginY={2}
            padding={4}
        >
            <View alignItems={"center"} flexDirection={"row"}>
                <View
                    alignItems={"center"}
                    backgroundColor={"blue.50"}
                    borderColor={"blue.100"}
                    borderRadius={8}
                    borderWidth={1}
                    height={46}
                    justifyContent={"center"}
                    width={46}
                >
                    <FontAwesome5 name="users" size={20} color={openScoreboardColor} />
                </View>
                <View flex={1} marginLeft={3}>
                    <Text color={"gray.900"} fontSize={"xl"} fontWeight={"bold"} numberOfLines={1}>
                        {playerList.playerListName}
                    </Text>
                    <Text color={"gray.600"} fontSize={"sm"} marginTop={1}>
                        Player list
                    </Text>
                </View>
            </View>

            <View flexDirection={"row"} flexWrap={"wrap"} marginTop={2}>
                <MetadataPill
                    label={"Active players"}
                    value={`${playerCount} ${playerCount === 1 ? "player" : "players"}`}
                />
                <MetadataPill
                    label={"Last modified"}
                    value={formatModifiedDate(playerList.modifiedOn)}
                />
            </View>

            <View flexDirection={"row"} flexWrap={"wrap"} marginTop={3}>
                <ActionButton
                    isPrimary
                    icon={(color) => <MaterialCommunityIcons name="account-group-outline" size={19} color={color} />}
                    label={"Manage players"}
                    onPress={() => {
                        props.navigation.navigate("AddPlayers", { playerListID: playerList.id });
                    }}
                />
            </View>
        </View>
    );
}
