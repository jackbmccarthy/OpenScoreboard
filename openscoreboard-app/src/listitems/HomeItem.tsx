import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Separator } from 'heroui-native/separator';
import { AntDesign } from '@expo/vector-icons';
import { openScoreboardColor } from "../../openscoreboardtheme";

export const HomeItem = ({ accentColor = openScoreboardColor, item, navigation, isLast = false }) => {
    const isDisabled = !item.route;

    return (
        <>
            <Pressable
                disabled={isDisabled}
                onPress={() => {
                    if (item.route) {
                        navigation.navigate(item.route);
                    }
                }}
                style={({ pressed }) => [
                    styles.button,
                    pressed && !isDisabled ? styles.buttonPressed : null,
                    isDisabled ? styles.buttonDisabled : null,
                ]}
            >
                <View style={[
                    styles.row,
                    isDisabled ? styles.disabledRow : null,
                ]}>
                    <View style={[
                        styles.marker,
                        { backgroundColor: isDisabled ? "#d4d4d8" : accentColor },
                    ]}></View>
                    <View style={styles.copy}>
                        <Text style={[
                            styles.title,
                            isDisabled ? styles.disabledTitle : null,
                        ]}>{item.title}</Text>
                        <Text style={[
                            styles.description,
                            isDisabled ? styles.disabledDescription : null,
                        ]}>{item.description}</Text>
                    </View>
                    <View style={[
                        styles.iconWrap,
                        !isDisabled ? { backgroundColor: `${accentColor}14` } : null,
                        isDisabled ? styles.disabledIconWrap : null,
                    ]}>
                        <AntDesign name="arrowright" size={20} color={isDisabled ? "#a1a1aa" : accentColor} />
                    </View>
                </View>
            </Pressable>

            {!isLast ? <Separator></Separator> : null}
        </>




    );
};

const styles = StyleSheet.create({
    button: {
        backgroundColor: "transparent",
        borderRadius: 0,
        minHeight: 74,
        paddingHorizontal: 0,
        paddingVertical: 0,
        width: "100%",
    },
    buttonPressed: {
        opacity: 0.86,
    },
    buttonDisabled: {
        opacity: 0.72,
    },
    row: {
        alignItems: "center",
        backgroundColor: "#ffffff",
        flexDirection: "row",
        gap: 10,
        justifyContent: "space-between",
        minHeight: 74,
        paddingHorizontal: 10,
        paddingVertical: 12,
        width: "100%",
    },
    disabledRow: {
        backgroundColor: "#fafafa",
    },
    marker: {
        borderRadius: 6,
        height: 44,
        width: 4,
    },
    copy: {
        flex: 1,
        minWidth: 0,
        paddingRight: 8,
    },
    title: {
        color: "#111827",
        fontSize: 16,
        fontWeight: "800",
        lineHeight: 22,
        textAlign: "left",
    },
    disabledTitle: {
        color: "#71717a",
    },
    description: {
        color: "#6b7280",
        fontSize: 12,
        lineHeight: 17,
        marginTop: 2,
    },
    disabledDescription: {
        color: "#a1a1aa",
    },
    iconWrap: {
        alignItems: "center",
        backgroundColor: "#f3f4f6",
        borderRadius: 8,
        height: 34,
        justifyContent: "center",
        width: 34,
    },
    disabledIconWrap: {
        backgroundColor: "#f4f4f5",
    },
});
