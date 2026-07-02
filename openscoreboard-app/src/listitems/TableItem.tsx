import React from 'react';
import { Text, View } from 'native-base';
import { openScoreboardColor } from "../../openscoreboardtheme";
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { supportedSports } from '../functions/sports';
import { getUserPath } from '../../database';
import { MetadataPill, ResourceAction, ResourceCard } from '../components/ListPage';

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

export function TableItem(props) {
    const sportDisplayName = supportedSports[props.sportName]?.displayName || "Table Tennis";
    const currentMatch = props.currentMatchPreview || {};
    const currentMatchA = currentMatch.playerA || "TBD";
    const currentMatchB = currentMatch.playerB || "TBD";
    const hasCurrentMatch = props.hasCurrentMatch === true;
    const isKioskMode = props.tableMode === "kiosk";

    return (
        <ResourceCard
            icon={(color) => <MaterialCommunityIcons name={isKioskMode ? "monitor-lock" : "table-tennis"} size={23} color={color} />}
            meta={(
                <>
                    <MetadataPill label={"Sport"} value={sportDisplayName} />
                    <MetadataPill label={"Mode"} value={isKioskMode ? "Kiosk" : "Standard"} />
                    <MetadataPill label={"Status"} value={hasCurrentMatch ? "Active match" : "Waiting"} />
                </>
            )}
            title={props.tableName}
            subtitle={isKioskMode ? "Kiosk table" : "Standard scoring table"}
            actions={(
                <>
                    {hasCurrentMatch ? (
                        <ResourceAction
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
                        <ResourceAction
                            isPrimary
                            isLoading={props.isCreatingMatch}
                            label={isKioskMode ? "Open kiosk" : "Create match"}
                            icon={(color) => <MaterialCommunityIcons name={isKioskMode ? "monitor-lock" : "plus-box-outline"} size={20} color={color} />}
                            onPress={() => {
                                props.createMatchForTable(props);
                            }}
                        />
                    )}
                    <ResourceAction
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
                    <ResourceAction
                        label={"Share"}
                        icon={(color) => <Ionicons name="share-social-outline" size={19} color={color} />}
                        onPress={() => {
                            props.openLinkModal(props.id, props.index);
                        }}
                    />
                </>
            )}
        >
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

        </ResourceCard>
    );
}
