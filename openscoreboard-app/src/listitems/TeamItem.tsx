import React, { useState } from 'react';
import { Pressable, Text, View } from 'native-base';
import { StyleSheet } from 'react-native';
import { openScoreboardColor } from "../../openscoreboardtheme";
import { FontAwesome5 } from '@expo/vector-icons';
import TeamLogoPreview from '../components/TeamLogoPreview';

function getPlayerDisplayName(player = {}) {
    const firstName = player.firstName || "";
    const lastName = player.lastName || "";
    const fullName = `${firstName} ${lastName}`.trim();

    return fullName || player.name || "";
}

function getRosterPreview(players = {}, maxPlayers = 5) {
    const playerNames = Object.values(players || {})
        .map(getPlayerDisplayName)
        .filter(Boolean);

    if (playerNames.length === 0) {
        return "";
    }

    const visiblePlayers = playerNames.slice(0, maxPlayers).join(", ");
    const hiddenCount = playerNames.length - maxPlayers;

    return hiddenCount > 0 ? `${visiblePlayers}, +${hiddenCount} more` : visiblePlayers;
}

function getCompetitionTitle(competition) {
    return competition?.data?.title || competition?.title || "Competition";
}

export function TeamItem(props) {

    const [showCompetitions, setShowCompetitions] = useState(false);
    const team = props.item[1];
    const teamName = team.teamName || team.name || "Unnamed team";
    const teamLogoURL = team.teamLogoURL || "";
    const teamJerseyColor = team.teamJerseyColor || "";
    const linkedCompetitions = props.competitions || [];
    const visibleCompetitions = linkedCompetitions.slice(0, 4);
    const rosterPreview = getRosterPreview(team.players);
    const openTeam = () => {
        props.openEditTeam(team.id, props.item[0]);
    };
    const openCompetition = (event, competitionID) => {
        event?.stopPropagation?.();
        props.onOpenCompetition?.(competitionID);
    };
    const toggleCompetitions = (event) => {
        event?.stopPropagation?.();
        if (linkedCompetitions.length > 0) {
            setShowCompetitions((currentValue) => !currentValue);
        }
    };

    return (
        <Pressable
            backgroundColor={"white"}
            borderColor={"gray.200"}
            borderRadius={8}
            borderWidth={1}
            marginX={3}
            marginY={2}
            minHeight={82}
            onPress={openTeam}
            padding={4}
            _hover={{ backgroundColor: "gray.50", borderColor: "blue.200" }}
        >
            <View alignItems={"center"} flexDirection={"row"}>
                <TeamLogoPreview logoURL={teamLogoURL} teamName={teamName} size={50} />
                <View flex={1} marginLeft={3} paddingRight={3}>
                    <View alignItems={"center"} flexDirection={"row"}>
                        {teamJerseyColor ? (
                            <View
                                backgroundColor={teamJerseyColor}
                                borderColor={"gray.300"}
                                borderRadius={999}
                                borderWidth={1}
                                height={14}
                                marginRight={2}
                                width={14}
                            />
                        ) : null}
                        <Text color={"gray.900"} flex={1} fontSize={"xl"} fontWeight={"bold"} numberOfLines={1}>
                            {teamName}
                        </Text>
                    </View>
                    {rosterPreview ? (
                        <Text color={"gray.600"} fontSize={"sm"} marginTop={1} numberOfLines={1}>
                            {rosterPreview}
                        </Text>
                    ) : null}
                </View>
                <View style={styles.editIconWrap}>
                    <FontAwesome5 name="edit" size={16} color={openScoreboardColor} />
                </View>
            </View>
            <View borderTopColor={"gray.100"} borderTopWidth={1} marginTop={3}>
                {linkedCompetitions.length > 0 ? (
                    <Pressable
                        accessibilityRole={"button"}
                        accessibilityState={{ expanded: showCompetitions }}
                        onPress={toggleCompetitions}
                        paddingTop={3}
                        _hover={{ backgroundColor: "gray.50" }}
                    >
                        <View alignItems={"center"} flexDirection={"row"}>
                            <View flex={1} paddingRight={2}>
                                <Text color={"gray.500"} fontSize={"2xs"} fontWeight={"bold"} textTransform={"uppercase"}>
                                    Linked competitions
                                </Text>
                                <Text color={"gray.700"} fontSize={"xs"} marginTop={1}>
                                    {linkedCompetitions.length} competition{linkedCompetitions.length === 1 ? "" : "s"}
                                </Text>
                            </View>
                            <FontAwesome5 name={showCompetitions ? "chevron-up" : "chevron-down"} size={13} color={openScoreboardColor} />
                        </View>
                    </Pressable>
                ) : (
                    <View alignItems={"center"} flexDirection={"row"} paddingTop={3}>
                        <View flex={1} paddingRight={2}>
                            <Text color={"gray.500"} fontSize={"2xs"} fontWeight={"bold"} textTransform={"uppercase"}>
                                Linked competitions
                            </Text>
                            <Text color={"gray.500"} fontSize={"xs"} marginTop={1}>
                                No linked competitions
                            </Text>
                        </View>
                    </View>
                )}
                {showCompetitions && linkedCompetitions.length > 0 ? (
                    <View paddingTop={1}>
                        {visibleCompetitions.map((competition) => {
                            const archived = competition.archived === true || !!competition.archivedOn;
                            return (
                                <Pressable
                                    key={competition.id}
                                    accessibilityRole={"button"}
                                    marginTop={2}
                                    onPress={(event) => openCompetition(event, competition.id)}
                                    _hover={{ backgroundColor: "blue.50" }}
                                >
                                    <View
                                        alignItems={"center"}
                                        backgroundColor={"gray.50"}
                                        borderColor={"gray.200"}
                                        borderRadius={6}
                                        borderWidth={1}
                                        flexDirection={"row"}
                                        paddingX={3}
                                        paddingY={2}
                                    >
                                        <View flex={1} paddingRight={2}>
                                            <Text color={"gray.900"} fontSize={"xs"} fontWeight={"bold"} numberOfLines={1}>
                                                {getCompetitionTitle(competition)}
                                            </Text>
                                            <Text color={"gray.500"} fontSize={"2xs"} marginTop={1}>
                                                {competition.teamContestCount || 0} contest{competition.teamContestCount === 1 ? "" : "s"}
                                                {typeof competition.teamCompletedContestCount !== "undefined" ? ` - ${competition.teamCompletedContestCount} complete` : ""}
                                                {archived ? " - archived" : ""}
                                            </Text>
                                        </View>
                                        <FontAwesome5 name="chevron-right" size={12} color={openScoreboardColor} />
                                    </View>
                                </Pressable>
                            );
                        })}
                        {linkedCompetitions.length > visibleCompetitions.length ? (
                            <Text color={"gray.500"} fontSize={"2xs"} marginTop={2}>
                                +{linkedCompetitions.length - visibleCompetitions.length} more competition{linkedCompetitions.length - visibleCompetitions.length === 1 ? "" : "s"}
                            </Text>
                        ) : null}
                    </View>
                ) : null}
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    editIconWrap: {
        alignItems: "center",
        height: 32,
        justifyContent: "center",
        width: 32,
    },
});
