import React, { useState } from 'react';
import { View, Text, Button } from 'native-base';
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable } from 'react-native';
import { openScoreboardButtonTextColor, openScoreboardColor } from "../../openscoreboardtheme";
import { setStringAsync } from 'expo-clipboard';
import i18n from '../translations/translate';

const URL_ICON_BUTTON_WIDTH = 42;

function copyTextToClipboard(text, setWasCopied) {
    setWasCopied(true)
    setStringAsync(text)
    setTimeout(() => {
        setWasCopied(false)
    }, 2000)
}

export default function CopyButton({ text }) {
    let [wasCopied, setWasCopied] = useState(false)


    return (

        <View padding={1}>
            <Button
                onPress={() => {
                    copyTextToClipboard(text, setWasCopied)
                }}
            >
                {
                    wasCopied ?
                        <Text color={openScoreboardButtonTextColor}>{i18n.t("copied")}!</Text> :
                        <FontAwesome name="copy" color={openScoreboardButtonTextColor} size={24} />
                }

            </Button>
        </View>
    )
}

export function CopyInputRightButton({ text }) {
    let [wasCopied, setWasCopied] = useState(false)

    function openTextURL() {
        if (typeof window !== "undefined") {
            window.open(text, "_blank", "noopener,noreferrer")
        }
    }

    return (
        <View flexDirection={"row"} height={"100%"} width={URL_ICON_BUTTON_WIDTH * 2}>
            <Pressable
                accessibilityLabel={"Open link in a new tab"}
                accessibilityRole={"button"}
                onPress={openTextURL}
                style={({ hovered, pressed }) => ({
                    alignItems: "center",
                    backgroundColor: hovered || pressed ? "#F3F4F6" : "#FFFFFF",
                    borderBottomColor: "#D1D5DB",
                    borderBottomWidth: 1,
                    borderLeftColor: "#D1D5DB",
                    borderLeftWidth: 1,
                    borderTopColor: "#D1D5DB",
                    borderTopWidth: 1,
                    height: "100%",
                    justifyContent: "center",
                    minHeight: 40,
                    width: URL_ICON_BUTTON_WIDTH,
                })}
            >
                <MaterialCommunityIcons name="open-in-new" color={openScoreboardColor} size={20} />
            </Pressable>
            <Pressable
                accessibilityLabel={"Copy link"}
                accessibilityRole={"button"}
                onPress={() => {
                    copyTextToClipboard(text, setWasCopied)
                }}
                style={({ hovered, pressed }) => ({
                    alignItems: "center",
                    backgroundColor: hovered || pressed || wasCopied ? "#111827" : "#000000",
                    borderBottomRightRadius: 6,
                    borderTopRightRadius: 6,
                    height: "100%",
                    justifyContent: "center",
                    minHeight: 40,
                    width: URL_ICON_BUTTON_WIDTH,
                })}
            >
                <MaterialCommunityIcons name={wasCopied ? "check" : "content-copy"} color={openScoreboardButtonTextColor} size={20} />
            </Pressable>
        </View>
    )
}
