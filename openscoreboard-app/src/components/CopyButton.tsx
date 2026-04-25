import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { openScoreboardButtonTextColor } from "../../openscoreboardtheme";
import { setStringAsync } from 'expo-clipboard';
import i18n from '../translations/translate';


export default function CopyButton({ text }) {
    let [wasCopied, setWasCopied] = useState(false)


    return (

        <View style={styles.wrap}>
            <Pressable
                onPress={() => {
                    setWasCopied(true)
                    setStringAsync(text)
                    setTimeout(() => {
                        setWasCopied(false)
                    }, 2000)
                }}
                style={({ pressed }) => [styles.button, pressed ? styles.pressed : null]}
            >
                {
                    wasCopied ?
                        <Text style={styles.label}>{i18n.t("copied")}!</Text> :
                        <FontAwesome name="copy" color={openScoreboardButtonTextColor} size={24} />
                }

            </Pressable>
        </View>
    )
}

const styles = StyleSheet.create({
    wrap: {
        padding: 4,
    },
    button: {
        alignItems: "center",
        backgroundColor: "#2563eb",
        borderRadius: 10,
        height: 42,
        justifyContent: "center",
        minWidth: 54,
        paddingHorizontal: 12,
    },
    pressed: {
        opacity: 0.8,
    },
    label: {
        color: openScoreboardButtonTextColor,
        fontSize: 13,
        fontWeight: "700",
    },
});
