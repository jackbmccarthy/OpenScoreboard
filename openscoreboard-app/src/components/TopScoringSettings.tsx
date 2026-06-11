import React, { useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { Spinner, Text, View } from 'native-base';
import { openScoreboardButtonTextColor, openScoreboardColor } from "../../openscoreboardtheme";
import { switchSides } from '../functions/scoring';
import { FontAwesome5, MaterialIcons, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { ScoringGradientButton } from './ScoringGradientButton';

function ToolbarButton({ icon, iconSize, isCompact, label, onPress, isDisabled = false, isLoading = false }) {
    const buttonHeight = isCompact ? 40 : 52;

    return (
        <View flex={1} style={{ height: buttonHeight, maxHeight: buttonHeight, paddingHorizontal: isCompact ? 2 : 5 }}>
            <ScoringGradientButton
                disabled={isDisabled || isLoading}
                onPress={onPress}
                style={{
                    height: buttonHeight,
                    maxHeight: buttonHeight,
                    width: "100%",
                }}
                contentStyle={{
                    paddingHorizontal: 2,
                    paddingVertical: isCompact ? 2 : 5,
                }}
            >
                {isLoading ? (
                    <Spinner color={openScoreboardButtonTextColor} size={"sm"} />
                ) : (
                    icon(openScoreboardButtonTextColor, iconSize)
                )}
                <Text color={openScoreboardButtonTextColor} fontSize={"2xs"} fontWeight={"bold"} lineHeight={"xs"} marginTop={0.5} numberOfLines={1}>
                    {label}
                </Text>
            </ScoringGradientButton>
        </View>
    );
}

export function TopScoringSettings(props) {

    let [loadingSwitchSide, setLoadingSwitchSide] = useState(false);
    const { height, width } = useWindowDimensions();
    const isCompact = width < 480 || height < 720;
    const iconSize = isCompact ? 16 : 22;
    const toolbarHeight = isCompact ? 48 : 66;


    return (<View flexShrink={0} style={{ height: toolbarHeight, maxHeight: toolbarHeight }}>
        <View flexDirection={"row"} alignItems="center" backgroundColor={openScoreboardColor} style={{ height: toolbarHeight, maxHeight: toolbarHeight, paddingHorizontal: isCompact ? 5 : 10, paddingVertical: isCompact ? 4 : 7 }}>
            <ToolbarButton
                icon={(color, size) => <MaterialIcons name="timer" size={size} color={color} />}
                iconSize={iconSize}
                isCompact={isCompact}
                label={"Timeout"}
                onPress={() => {
                    props.openTimeOutModal();
                }}
            />
            <ToolbarButton
                icon={(color, size) => <MaterialCommunityIcons name="cards" size={size} color={color} />}
                iconSize={iconSize}
                isCompact={isCompact}
                label={isCompact ? "Penalty" : "Penalties"}
                onPress={() => {
                    props.openPenaltyModal();
                }}
            />
            <ToolbarButton
                icon={(color, size) => <FontAwesome5 name="table-tennis" size={size - 2} color={color} />}
                iconSize={iconSize}
                isCompact={isCompact}
                label={"Service"}
                onPress={() => {
                    props.openServiceModal();
                }}
            />
            <ToolbarButton
                icon={(color, size) => <MaterialCommunityIcons name="account-switch-outline" size={size + 2} color={color} />}
                iconSize={iconSize}
                isCompact={isCompact}
                isLoading={loadingSwitchSide}
                label={"Sides"}
                onPress={async () => {
                    setLoadingSwitchSide(true);
                    await switchSides(props.matchID);
                    setLoadingSwitchSide(false);
                }}
            />
            <ToolbarButton
                icon={(color, size) => <MaterialCommunityIcons name="star-four-points-circle-outline" size={size + 1} color={color} />}
                iconSize={iconSize}
                isCompact={isCompact}
                label={"Highlight"}
                onPress={async () => {
                    props.openSignificantPointsModal();
                }}
            />
            <ToolbarButton
                icon={(color, size) => <Ionicons name="settings-sharp" size={size} color={color} />}
                iconSize={iconSize}
                isCompact={isCompact}
                label={"Settings"}
                onPress={() => {
                    props.openAdvanceSettingsModal()
                }}
            />
        </View>

    </View>);

}
