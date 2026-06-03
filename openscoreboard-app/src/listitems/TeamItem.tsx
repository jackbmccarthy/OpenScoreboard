import React from 'react';
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

export function TeamItem(props) {

    const team = props.item[1];
    const teamName = team.teamName || team.name || "Unnamed team";
    const teamLogoURL = team.teamLogoURL || "";
    const rosterPreview = getRosterPreview(team.players);
    const openTeam = () => {
        props.openEditTeam(team.id, props.item[0]);
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
                    <Text color={"gray.900"} fontSize={"xl"} fontWeight={"bold"} numberOfLines={1}>
                        {teamName}
                    </Text>
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
