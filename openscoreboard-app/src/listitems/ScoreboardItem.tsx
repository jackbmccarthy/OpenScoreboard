import React, { useState } from 'react';
import { Button, View, Text } from 'native-base';
import { openScoreboardButtonTextColor, openScoreboardColor } from "../../openscoreboardtheme";
import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import i18n from '../translations/translate';

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

function getScoreboardTypeLabel(type) {
    if (!type) {
        return "Scoreboard";
    }

    return type
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (letter) => letter.toUpperCase())
        .trim();
}

function getVisibilityLabel(scoreboard) {
    if (scoreboard.alwaysShow) {
        return "Always on";
    }

    if (scoreboard.showInBetweenGames) {
        return "Between games";
    }

    if (scoreboard.showDuringActiveMatch) {
        return "During games";
    }

    if (scoreboard.showDuringTimeOuts) {
        return "During timeouts";
    }

    return "Not configured";
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

export function ScoreboardItem(props) {
    let [showDelete, setShowDelete] = useState(false);
    const scoreboard = props.item[1];

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
                    <MaterialCommunityIcons name="scoreboard-outline" size={23} color={openScoreboardColor} />
                </View>
                <View flex={1} marginLeft={3}>
                    <Text color={"gray.900"} fontSize={"xl"} fontWeight={"bold"} numberOfLines={1}>
                        {scoreboard.name}
                    </Text>
                    <Text color={"gray.600"} fontSize={"sm"} marginTop={1}>
                        {getScoreboardTypeLabel(scoreboard.type)}
                    </Text>
                </View>
            </View>

            <View flexDirection={"row"} flexWrap={"wrap"} marginTop={2}>
                <MetadataPill label={"Visibility"} value={getVisibilityLabel(scoreboard)} />
                <MetadataPill label={"Type"} value={getScoreboardTypeLabel(scoreboard.type)} />
            </View>

            {showDelete ? (
                <View
                    backgroundColor={"red.50"}
                    borderColor={"red.200"}
                    borderRadius={8}
                    borderWidth={1}
                    marginTop={4}
                    padding={3}
                >
                    <Text color={"red.800"} fontSize={"sm"} fontWeight={"bold"}>{i18n.t("deleteThisScoreboard")}?</Text>
                    <View flexDirection={"row"} marginTop={3}>
                        <Button
                            backgroundColor={"red.700"}
                            borderRadius={8}
                            onPress={() => {
                                props.onDelete(props.item[0]);
                            }}
                        >
                            <Text color={openScoreboardButtonTextColor} fontWeight={"bold"}>{i18n.t("yes")}</Text>
                        </Button>
                        <Button
                            marginLeft={2}
                            onPress={() => {
                                setShowDelete(false);
                            }}
                            variant={"ghost"}
                        >
                            <Text color={"gray.700"} fontWeight={"bold"}>{i18n.t("no")}</Text>
                        </Button>
                    </View>
                </View>
            ) : (
                <View flexDirection={"row"} flexWrap={"wrap"} marginTop={3}>
                    <ActionButton
                        isPrimary
                        icon={(color) => <FontAwesome5 name="edit" size={15} color={color} />}
                        label={"Edit design"}
                        onPress={() => {
                            props.onSelect(`/editor/?t=editor&sid=${scoreboard.id}`)
                        }}
                    />
                    <ActionButton
                        icon={(color) => <Ionicons name="settings-outline" size={19} color={color} />}
                        label={"Settings"}
                        onPress={() => {
                            props.openScoreboardSettings(scoreboard.id, props.index)
                        }}
                    />
                    <ActionButton
                        icon={(color) => <FontAwesome5 name="trash" size={15} color={color} />}
                        label={"Delete"}
                        onPress={() => {
                            setShowDelete(true);
                        }}
                        tone={"danger"}
                    />
                </View>
            )}
        </View>
    );
}
