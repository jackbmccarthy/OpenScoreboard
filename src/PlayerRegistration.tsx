

import React, { Component, useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Share } from 'react-native';
import { Text, Button, View, NativeBaseProvider, Spinner, FormControl, Input, } from 'native-base';
//import { withNavigationFocus, NavigationEvents } from 'react-navigation';


import db, { getUserPath } from '../database';
import { openScoreboardButtonTextColor, openScoreboardColor } from "../openscoreboardtheme";
import { openScoreboardTheme } from "../openscoreboardtheme";
import JerseyColorOptions from './components/JerseyColorOptions';
import { SuccessfulRegistrationModal } from './modals/SuccessfulRegistrationModal';
import { getNewPlayer, newImportedPlayer } from './classes/Player';
import { addImportedPlayer, getImportPlayerList, getPlayerListName, watchForPlayerListPasswordChange } from './functions/players';
import Unauthorized from './Unauthorized';
import i18n from './translations/translate';

export default function PlayerRegistration({ route, navigation }) {

    let [selectedColor, setSelectedColor] = useState("")
    let [firstName, setFirstName] = useState("")
    let [lastName, setLastName] = useState("")
    let [unauthorized, setUnAuthorized] = useState(false)

    let [playerListExists, setPlayerListExists] = useState(false)
    let [loadingPlayer, setLoadingPlayer] = useState(false)
    let [showSuccess, setShowSuccess] = useState(false)

    useEffect(() => {
        let unSub = watchForPlayerListPasswordChange(route.params.playerListID, (password) => {
            if (typeof password === "string" && password !== route.params.password) {
                setUnAuthorized(true)

            }
        })
        return unSub
    }, [])


    useEffect(() => {
        getPlayerListName(route.params.playerListID).then((playerList) => {
            if (playerList.length > 0) {
                setPlayerListExists(true)
            }
        })
    }, [])




    if (!unauthorized) {
        return (
            <NativeBaseProvider theme={openScoreboardTheme}>
                <View justifyContent={"center"} alignItems="center" width={"100%"} height={"100%"}>

                    <View>
                        <Text textAlign={"center"} lineHeight={"2xl"} fontSize={"3xl"}>{i18n.t("playerRegistration")}</Text>
                        <Text textAlign={"center"} lineHeight={"2xl"} >{i18n.t("registerHere")}</Text>

                    </View>

                    <View maxWidth={"lg"}>
                        <FormControl>
                            <FormControl.Label>{i18n.t("firstName")}</FormControl.Label>
                            <Input value={firstName}
                                onChangeText={(text) => {
                                    setFirstName(text)
                                }}
                                type="text"></Input>
                            <FormControl.Label>{i18n.t("lastName")}</FormControl.Label>
                            <Input value={lastName}
                                onChangeText={(text) => {
                                    setLastName(text)
                                }}
                                type="text"></Input>
                            <FormControl.Label>{i18n.t("jerseyColor")}</FormControl.Label>
                            <JerseyColorOptions color={selectedColor} onSelect={(selectedColor) => {
                                setSelectedColor(selectedColor)
                            }} ></JerseyColorOptions>
                        </FormControl>
                        <View flexDirection={"row"}>
                            <View flex={1} padding={1}>
                                <Button
                                    onPress={async () => {
                                        setLoadingPlayer(true)
                                        if (playerListExists) {
                                            await addImportedPlayer(route.params.playerListID, newImportedPlayer(firstName, lastName, "", "", selectedColor))
                                            setShowSuccess(true)
                                        }
                                        setLoadingPlayer(false)
                                    }}
                                >
                                    {
                                        loadingPlayer ?
                                            <Spinner  ></Spinner>
                                            :
                                            <Text color={openScoreboardButtonTextColor}>{i18n.t("register")}</Text>
                                    }


                                </Button>
                            </View>

                        </View>

                    </View>


                    {showSuccess ?
                        <SuccessfulRegistrationModal
                            isOpen={showSuccess}
                            onClose={() => {
                                setShowSuccess(false)
                                setSelectedColor("")
                                setFirstName("")
                                setLastName("")
                            }}
                        ></SuccessfulRegistrationModal>
                        : null
                    }
                </View>
            </NativeBaseProvider>
        )
    }
    else {
        return (
            <Unauthorized></Unauthorized>
        )
    }

}