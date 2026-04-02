

import React from 'react';
import { Text, View, NativeBaseProvider, } from 'native-base';
import { openScoreboardColor } from "../openscoreboardtheme";
import { openScoreboardTheme } from "../openscoreboardtheme";
import i18n from './translations/translate';
export default function Unauthorized(props) {

    return (
        <NativeBaseProvider theme={openScoreboardTheme}>
            <View justifyContent={"center"} alignItems="center">
                <Text fontSize={"5xl"} color={openScoreboardColor}>{i18n.t("unauthorized")}</Text>
            </View>
        </NativeBaseProvider>
    )
}