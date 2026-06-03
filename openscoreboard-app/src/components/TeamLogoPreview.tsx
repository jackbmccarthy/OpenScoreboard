import React, { useEffect, useState } from 'react';
import { Image } from 'react-native';
import { Text, View } from 'native-base';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { openScoreboardColor } from '../../openscoreboardtheme';

function getTeamInitials(teamName = "") {
    const words = teamName.trim().split(/\s+/).filter(Boolean);

    if (words.length === 0) {
        return "";
    }

    return words.slice(0, 2).map((word) => word[0]?.toUpperCase()).join("");
}

export default function TeamLogoPreview({ logoURL = "", teamName = "", size = 54, borderRadius = 8, label = "" }) {
    const [imageFailed, setImageFailed] = useState(false);
    const trimmedLogoURL = typeof logoURL === "string" ? logoURL.trim() : "";
    const hasLogoURL = trimmedLogoURL.length > 0;
    const initials = getTeamInitials(teamName);

    useEffect(() => {
        setImageFailed(false);
    }, [trimmedLogoURL]);

    const preview = (
        <View
            alignItems={"center"}
            backgroundColor={"blue.50"}
            borderColor={"blue.100"}
            borderWidth={1}
            justifyContent={"center"}
            overflow={"hidden"}
            style={{
                borderRadius,
                height: size,
                maxHeight: size,
                maxWidth: size,
                minHeight: size,
                minWidth: size,
                width: size,
            }}
        >
            {hasLogoURL && !imageFailed ? (
                <Image
                    onError={() => setImageFailed(true)}
                    resizeMode={"contain"}
                    source={{ uri: trimmedLogoURL }}
                    style={{ backgroundColor: "white", height: size, width: size }}
                />
            ) : initials ? (
                <Text color={openScoreboardColor} fontSize={size >= 70 ? "2xl" : "md"} fontWeight={"bold"}>
                    {initials}
                </Text>
            ) : (
                <MaterialCommunityIcons name="shield-account-outline" size={Math.max(22, Math.round(size * 0.46))} color={openScoreboardColor} />
            )}
        </View>
    );

    if (!label) {
        return preview;
    }

    return (
        <View alignItems={"center"} flexDirection={"row"}>
            {preview}
            <View flex={1} marginLeft={3}>
                <Text color={"gray.900"} fontSize={"sm"} fontWeight={"bold"}>
                    {label}
                </Text>
                <Text color={"gray.600"} fontSize={"xs"} marginTop={1}>
                    {hasLogoURL ? (imageFailed ? "Logo URL could not be previewed" : "Logo preview") : "No logo URL provided"}
                </Text>
            </View>
        </View>
    );
}
