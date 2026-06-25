import React from 'react';
import { Button, Menu, Text, View } from 'native-base';
import { openScoreboardButtonTextColor, openScoreboardColor } from "../../openscoreboardtheme";
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { isTeamScoreOnlyTeamMatch } from '../classes/TeamMatch';

function getSortedTables(currentMatches = {}) {
    return Object.keys(currentMatches || {})
        .filter((tableNumber) => {
            const parsedTableNumber = parseInt(tableNumber, 10);
            return !Number.isNaN(parsedTableNumber) && parsedTableNumber > 0;
        })
        .sort((a, b) => {
            return parseInt(a, 10) > parseInt(b, 10) ? 1 : -1;
        });
}

function TeamScoreRow({ label, name, score }) {
    return (
        <View
            alignItems={"center"}
            backgroundColor={"gray.50"}
            borderColor={"gray.200"}
            borderRadius={8}
            borderWidth={1}
            flexDirection={"row"}
            marginTop={2}
            padding={2}
        >
            <View
                alignItems={"center"}
                backgroundColor={openScoreboardColor}
                borderRadius={6}
                height={38}
                justifyContent={"center"}
                marginRight={3}
                minWidth={44}
                paddingX={2}
            >
                <Text color={"white"} fontSize={"lg"} fontWeight={"bold"}>{score || 0}</Text>
            </View>
            <View flex={1}>
                <Text color={"gray.500"} fontSize={"2xs"} fontWeight={"bold"} textTransform={"uppercase"}>
                    {label}
                </Text>
                <Text color={"gray.900"} fontSize={"md"} fontWeight={"bold"} numberOfLines={1}>
                    {name || "TBD"}
                </Text>
            </View>
        </View>
    );
}

function ActionContent({ icon, isPrimary = false, label }) {
    const foregroundColor = isPrimary ? openScoreboardButtonTextColor : openScoreboardColor;
    const textColor = isPrimary ? openScoreboardButtonTextColor : "blue.700";

    return (
        <View alignItems={"center"} flexDirection={"row"}>
            {icon(foregroundColor)}
            <Text
                color={textColor}
                fontSize={"sm"}
                fontWeight={"bold"}
                marginLeft={2}
            >
                {label}
            </Text>
            <MaterialCommunityIcons
                name="chevron-down"
                size={18}
                color={textColor === openScoreboardButtonTextColor ? openScoreboardButtonTextColor : openScoreboardColor}
                style={{ marginLeft: 6 }}
            />
        </View>
    );
}

function TeamMatchAction({ label, icon, onPress, isPrimary = false, isActive = false }) {
    return (
        <View marginBottom={2} width={{ base: "48.5%", md: "18.8%" }}>
            <Button
                backgroundColor={isPrimary || isActive ? openScoreboardColor : "white"}
                borderColor={isPrimary || isActive ? openScoreboardColor : "blue.100"}
                borderRadius={8}
                borderWidth={1}
                justifyContent={"flex-start"}
                minHeight={44}
                onPress={onPress}
                paddingX={3}
                variant={isPrimary || isActive ? "solid" : "outline"}
                width={"100%"}
            >
                <View alignItems={"center"} flexDirection={"row"}>
                    {icon(isPrimary || isActive ? openScoreboardButtonTextColor : openScoreboardColor)}
                    <Text
                        color={isPrimary || isActive ? openScoreboardButtonTextColor : "blue.700"}
                        fontSize={"sm"}
                        fontWeight={"bold"}
                        marginLeft={2}
                    >
                        {label}
                    </Text>
                </View>
            </Button>
        </View>
    );
}

function TeamMatchMenuAction({ label, icon, onPickTable, tables, isPrimary = false }) {
    return (
        <View marginBottom={2} width={{ base: "48.5%", md: "18.8%" }}>
            <Menu
                placement={"bottom left"}
                trigger={(triggerProps) => (
                    <Button
                        {...triggerProps}
                        backgroundColor={isPrimary ? openScoreboardColor : "white"}
                        borderColor={isPrimary ? openScoreboardColor : "blue.100"}
                        borderRadius={8}
                        borderWidth={1}
                        isDisabled={tables.length === 0}
                        justifyContent={"flex-start"}
                        minHeight={44}
                        paddingX={3}
                        variant={isPrimary ? "solid" : "outline"}
                        width={"100%"}
                    >
                        <ActionContent icon={icon} isPrimary={isPrimary} label={label} />
                    </Button>
                )}
            >
                {tables.length > 0 ? tables.map((tableNumber) => (
                    <Menu.Item
                        key={`${label}-${tableNumber}`}
                        onPress={() => onPickTable(tableNumber)}
                    >
                        <View alignItems={"center"} flexDirection={"row"}>
                            <MaterialCommunityIcons name="table-tennis" size={16} color={openScoreboardColor} />
                            <Text color={"gray.900"} fontSize={"sm"} fontWeight={"bold"} marginLeft={2}>
                                Table {tableNumber}
                            </Text>
                        </View>
                    </Menu.Item>
                )) : (
                    <Menu.Item isDisabled>No tables available</Menu.Item>
                )}
            </Menu>
        </View>
    );
}

function TableChip({ label }) {
    return (
        <View
            alignItems={"center"}
            backgroundColor={"white"}
            borderColor={"blue.100"}
            borderRadius={999}
            borderWidth={1}
            flexDirection={"row"}
            marginRight={2}
            marginTop={2}
            minHeight={36}
            paddingX={3}
        >
            <MaterialCommunityIcons name="table-tennis" size={16} color={openScoreboardColor} />
            <Text
                color={"blue.700"}
                fontSize={"sm"}
                fontWeight={"bold"}
                marginLeft={1}
            >
                {label}
            </Text>
        </View>
    );
}

export function TeamMatchItem(props) {
    const teamMatch = props.item[1];
    const matchDate = teamMatch.startTime ? new Date(teamMatch.startTime).toLocaleDateString() : "No date";
    const sportLabel = teamMatch.sportDisplayName || teamMatch.sportName || "Team match";
    const tableNumbers = getSortedTables(teamMatch.currentMatches || {});
    const isScoreOnlyMatch = isTeamScoreOnlyTeamMatch(teamMatch);

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
            <View flexDirection={"row"} flexWrap={"wrap"} justifyContent={"space-between"}>
                <View flex={1} minWidth={220} paddingRight={3}>
                    <Text color={"gray.900"} fontSize={"xl"} fontWeight={"bold"} numberOfLines={1}>
                        {teamMatch.teamAName || "Team A"} vs {teamMatch.teamBName || "Team B"}
                    </Text>
                    <Text color={"gray.600"} fontSize={"sm"} marginTop={1}>
                        {isScoreOnlyMatch ?
                            `Team score only - ${matchDate}` :
                            `${sportLabel} - ${matchDate} - ${tableNumbers.length} ${tableNumbers.length === 1 ? "table" : "tables"}`}
                    </Text>
                </View>
            </View>

            <View marginTop={3}>
                <TeamScoreRow label={"Team A"} name={teamMatch.teamAName} score={teamMatch.teamAScore} />
                <TeamScoreRow label={"Team B"} name={teamMatch.teamBName} score={teamMatch.teamBScore} />
            </View>

            {!isScoreOnlyMatch ? <View marginTop={3}>
                <Text color={"gray.700"} fontSize={"sm"} fontWeight={"bold"}>Tables</Text>
                <View flexDirection={"row"} flexWrap={"wrap"}>
                    {tableNumbers.map((tableNumber) => (
                        <TableChip
                            key={tableNumber}
                            label={`Table ${tableNumber}`}
                        />
                    ))}
                    {tableNumbers.length === 0 ? (
                        <Text color={"gray.600"} fontSize={"sm"} marginTop={2}>
                            No tables have been added yet.
                        </Text>
                    ) : null}
                </View>
            </View> : null}

            <View flexDirection={"row"} flexWrap={"wrap"} justifyContent={"space-between"} marginTop={4}>
                {isScoreOnlyMatch ? (
                    <>
                        <TeamMatchAction
                            isPrimary
                            icon={(color) => <MaterialCommunityIcons name="counter" size={20} color={color} />}
                            label={"Score"}
                            onPress={() => {
                                props.openTeamMatchEdit(teamMatch.id, props.item[0]);
                            }}
                        />
                        <TeamMatchAction
                            icon={(color) => <MaterialCommunityIcons name="share-outline" size={19} color={color} />}
                            label={"Links"}
                            onPress={() => {
                                props.openTeamMatchLink(teamMatch.id, "", teamMatch.sportName, teamMatch.scoringType);
                            }}
                        />
                    </>
                ) : (
                    <>
                        <TeamMatchMenuAction
                            isPrimary
                            icon={(color) => <MaterialCommunityIcons name="scoreboard-outline" size={20} color={color} />}
                            label={"Scoring"}
                            tables={tableNumbers}
                            onPickTable={(tableNumber) => {
                                props.goToKeepScore(teamMatch.id, tableNumber, teamMatch.sportName, teamMatch.scoringType);
                            }}
                        />
                        <TeamMatchMenuAction
                            icon={(color) => <MaterialCommunityIcons name="share-outline" size={19} color={color} />}
                            label={"Links"}
                            tables={tableNumbers}
                            onPickTable={(tableNumber) => {
                                props.openTeamMatchLink(teamMatch.id, tableNumber, teamMatch.sportName, teamMatch.scoringType);
                            }}
                        />
                        <TeamMatchAction
                            icon={(color) => <FontAwesome name="history" size={18} color={color} />}
                            label={"History"}
                            onPress={() => {
                                props.navigation.navigate("ArchivedMatchList", {
                                    teamMatchID: teamMatch.id,
                                    name: `${teamMatch.teamAName} vs ${teamMatch.teamBName}`,
                                });
                            }}
                        />
                    </>
                )}
                <TeamMatchAction
                    icon={(color) => <FontAwesome name="eye" size={17} color={color} />}
                    label={"Public"}
                    onPress={() => {
                        props.navigation.navigate("TeamMatchPublicView", {
                            teamMatchID: teamMatch.id,
                        });
                    }}
                />
                <TeamMatchAction
                    icon={(color) => <FontAwesome name="edit" size={17} color={color} />}
                    label={"Manage"}
                    onPress={() => {
                        props.openTeamMatchEdit(teamMatch.id, props.item[0]);
                    }}
                />
            </View>
        </View>
    );
}
