import React from 'react';
import { Text, Button, View } from 'native-base';
import { openScoreboardButtonTextColor, openScoreboardColor } from "../../openscoreboardtheme";
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { supportedSports } from '../functions/sports';
import { getUserPath } from '../../database';

function MatchPlayerPreview({ label, name }) {
    return (
        <View
            flex={1}
            minW={120}
            backgroundColor={"gray.50"}
            borderColor={"gray.200"}
            borderRadius={8}
            borderWidth={1}
            padding={3}
        >
            <Text color={"gray.500"} fontSize={"xs"} fontWeight={"semibold"}>{label}</Text>
            <Text color={"gray.900"} fontSize={"md"} fontWeight={"bold"} marginTop={1} numberOfLines={1}>
                {name || "TBD"}
            </Text>
        </View>
    );
}

function TableAction({ label, icon, onPress, isPrimary = false, isLoading = false }) {
    return (
        <View width={{ base: "48.5%", md: "31.5%" }} marginBottom={2}>
            <Button
                backgroundColor={isPrimary ? openScoreboardColor : "white"}
                borderColor={isPrimary ? openScoreboardColor : "blue.100"}
                borderWidth={1}
                justifyContent={"flex-start"}
                minHeight={44}
                onPress={onPress}
                paddingX={3}
                isLoading={isLoading}
                isDisabled={isLoading}
                variant={isPrimary ? "solid" : "outline"}
                width={"100%"}
            >
                <View alignItems={"center"} flexDir={"row"} width={"100%"}>
                    {icon(isPrimary ? openScoreboardButtonTextColor : openScoreboardColor)}
                    <Text
                        color={isPrimary ? openScoreboardButtonTextColor : "blue.700"}
                        fontSize={"sm"}
                        fontWeight={"semibold"}
                        marginLeft={2}
                    >
                        {label}
                    </Text>
                </View>
            </Button>
        </View>
    );
}

export function TableItem(props) {
    const sportDisplayName = supportedSports[props.sportName]?.displayName || "Table Tennis";
    const currentMatch = props.currentMatchPreview || {};
    const currentMatchA = currentMatch.playerA || "TBD";
    const currentMatchB = currentMatch.playerB || "TBD";
    const hasCurrentMatch = props.hasCurrentMatch === true;
    const isKioskMode = props.tableMode === "kiosk";

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
            <View>
                <View>
                    <View alignItems={"center"} flexDirection={"row"} flexWrap={"wrap"}>
                        <Text color={"gray.900"} fontSize={"xl"} fontWeight={"bold"}>{props.tableName}</Text>
                        {isKioskMode ? (
                            <View backgroundColor={"blue.50"} borderColor={"blue.100"} borderRadius={999} borderWidth={1} marginLeft={2} paddingX={2} paddingY={0.5}>
                                <Text color={"blue.800"} fontSize={"2xs"} fontWeight={"bold"}>Kiosk</Text>
                            </View>
                        ) : null}
                    </View>
                    <Text color={"gray.600"} fontSize={"sm"} marginTop={1}>{sportDisplayName}</Text>
                </View>
            </View>

            <View marginTop={4}>
                <Text color={"gray.700"} fontSize={"sm"} fontWeight={"bold"}>Current match</Text>
                {hasCurrentMatch ? (
                    <View alignItems={"center"} flexDir={"row"} marginTop={2}>
                        <MatchPlayerPreview label={"Player A"} name={currentMatchA} />
                        <View paddingX={2}>
                            <Text color={"gray.500"} fontSize={"xs"} fontWeight={"bold"}>VS</Text>
                        </View>
                        <MatchPlayerPreview label={"Player B"} name={currentMatchB} />
                    </View>
                ) : (
                    <View
                        backgroundColor={"gray.50"}
                        borderColor={"gray.200"}
                        borderRadius={8}
                        borderWidth={1}
                        marginTop={2}
                        padding={3}
                    >
                        <Text color={"gray.700"} fontSize={"sm"} fontWeight={"medium"}>
                            {isKioskMode ? "Waiting for the next scheduled match." : "No match has been created for this table yet."}
                        </Text>
                    </View>
                )}
            </View>

            <View flexDir={"row"} flexWrap={"wrap"} justifyContent={"space-between"} marginTop={4}>
                {hasCurrentMatch ? (
                    <TableAction
                        isPrimary
                        label={"Live scoring"}
                        icon={(color) => <MaterialCommunityIcons name="scoreboard-outline" size={20} color={color} />}
                        onPress={() => {
                            props.navigation.navigate("TableScoring", {
                                tableID: props.id,
                                name: props.tableName,
                                password: props.password,
                                sportName: props.sportName ? props.sportName : "tableTennis",
                                scoringType: props.scoringType ? props.scoringType : null,
                                ownerID: getUserPath() || "",
                            });
                        }}
                    />
                ) : (
                    <TableAction
                        isPrimary
                        isLoading={props.isCreatingMatch}
                        label={isKioskMode ? "Open kiosk" : "Create match"}
                        icon={(color) => <MaterialCommunityIcons name={isKioskMode ? "monitor-lock" : "plus-box-outline"} size={20} color={color} />}
                        onPress={() => {
                            props.createMatchForTable(props);
                        }}
                    />
                )}
                <TableAction
                    label={"Manage"}
                    icon={(color) => <Ionicons name="settings-outline" size={19} color={color} />}
                    onPress={() => {
                        props.navigation.navigate("TableEditor", {
                            tableID: props.id,
                            myTableID: props.myTableID,
                            name: props.tableName,
                            sportName: props.sportName,
                            scoringType: props.scoringType,
                        });
                    }}
                />
                <TableAction
                    label={"Share"}
                    icon={(color) => <Ionicons name="share-social-outline" size={19} color={color} />}
                    onPress={() => {
                        props.openLinkModal(props.id, props.index);
                    }}
                />
            </View>
        </View>
    );
}
