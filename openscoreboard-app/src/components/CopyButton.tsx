import React, { useState } from 'react';
import { View, Input, Text, Button, FormControl } from 'native-base';
import { FontAwesome } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import { openScoreboardButtonTextColor } from "../../openscoreboardtheme";
import { setStringAsync } from 'expo-clipboard';
import i18n from '../translations/translate';

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

    return (
        <Button
            backgroundColor={"black"}
            borderLeftRadius={0}
            borderRightRadius={6}
            height={"100%"}
            minW={76}
            onPress={() => {
                copyTextToClipboard(text, setWasCopied)
            }}
        >
            <Text color={openScoreboardButtonTextColor} fontSize={"sm"} fontWeight={"bold"}>
                {wasCopied ? i18n.t("copied") : "Copy"}
            </Text>
        </Button>
    )
}
