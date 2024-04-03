

import React from 'react';
import { Text, Button, View, NativeBaseProvider, } from 'native-base';
import { signOut } from '../database';
import { openScoreboardButtonTextColor } from "../openscoreboardtheme";
import { openScoreboardTheme } from "../openscoreboardtheme";
import { isLocalDatabase } from '../openscoreboard.config';
import i18n from './translations/translate';




export default function MyAccount() {



    return (
        <NativeBaseProvider theme={openScoreboardTheme}>
            <View height="100%" width={"100%"} flex={1} >

                <Text fontSize={"3xl"}>{i18n.t("moreComingSoon")}</Text>
                {isLocalDatabase ? null :
                    <View padding={1}>
                        <Button
                            onPress={() => {
                                signOut()
                            }}
                        >
                            <Text color={openScoreboardButtonTextColor}>{i18n.t("logOut")}</Text>
                        </Button>
                    </View>
                }



            </View>
        </NativeBaseProvider>
    )
}