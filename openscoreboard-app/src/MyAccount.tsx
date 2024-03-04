

import React from 'react';
import { Text, Button, View, NativeBaseProvider, } from 'native-base';
import { signOut } from '../database';
import { openScoreboardButtonTextColor } from "../openscoreboardtheme";
import { openScoreboardTheme } from "../openscoreboardtheme";
import { isLocalDatabase } from '../openscoreboard.config';




export default function MyAccount() {



    return (
        <NativeBaseProvider theme={openScoreboardTheme}>
            <View height="100%" width={"100%"} flex={1} >

                <Text fontSize={"3xl"}>More Coming Soon...</Text>
                {isLocalDatabase ? null :
                    <View padding={1}>
                        <Button
                            onPress={() => {
                                signOut()
                            }}
                        >
                            <Text color={openScoreboardButtonTextColor}>Log Out</Text>
                        </Button>
                    </View>
                }



            </View>
        </NativeBaseProvider>
    )
}