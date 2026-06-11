import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { View } from 'native-base';
import { LinearGradient } from 'expo-linear-gradient';

export const scoringGradientColors = ["#020617", "#07111F", "#0B1F4D", "#1D4ED8"];
export const scoringGradientPressedColors = ["#020617", "#0B1220", "#1E3A8A", "#2563EB"];

export function ScoringGradientButton({
    accessibilityLabel = "",
    borderColor = "#60A5FA",
    borderRadius = 10,
    borderWidth = 1,
    children,
    contentStyle = {},
    disabled = false,
    disabledOpacity = 0.65,
    onPress,
    style = {},
}) {
    return (
        <Pressable
            accessibilityLabel={accessibilityLabel}
            accessibilityRole={"button"}
            disabled={disabled}
            onPress={onPress}
            style={({ pressed }) => ([
                {
                    borderColor: pressed ? "#93C5FD" : borderColor,
                    borderRadius,
                    borderWidth,
                    opacity: disabled ? disabledOpacity : 1,
                    overflow: "hidden",
                    shadowColor: "#020617",
                    shadowOffset: { height: 1, width: 0 },
                    shadowOpacity: 0.24,
                    shadowRadius: 4,
                },
                style,
            ])}
        >
            {({ pressed }) => (
                <>
                    <LinearGradient
                        colors={pressed ? scoringGradientPressedColors : scoringGradientColors}
                        end={{ x: 1, y: 1 }}
                        start={{ x: 0, y: 0 }}
                        style={[StyleSheet.absoluteFill, { borderRadius }]}
                    />
                    <View
                        alignItems={"center"}
                        justifyContent={"center"}
                        style={[
                            {
                                height: "100%",
                                width: "100%",
                            },
                            contentStyle,
                        ]}
                    >
                        {children}
                    </View>
                </>
            )}
        </Pressable>
    );
}
