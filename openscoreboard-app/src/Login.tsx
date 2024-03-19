import React, { Component, useEffect, useRef, } from 'react';
import { Text,  View, } from 'native-base';
import firebase from 'firebase';
import * as firebaseui from 'firebaseui'
import { NativeBaseProvider } from 'native-base';
import { openScoreboardColor } from "../openscoreboardtheme";
import { openScoreboardTheme } from "../openscoreboardtheme";



export default function Login() {

    let ui = useRef(new firebaseui.auth.AuthUI(firebase.auth()))
    useEffect(() => {
        ui.current.start("#uicontainer", {
            signInOptions: [
                firebase.auth.EmailAuthProvider.PROVIDER_ID,
                firebase.auth.GoogleAuthProvider.PROVIDER_ID
            ]
        })

        return () => {
            ui.current.delete()
        }
    }, [])
    return (
        <NativeBaseProvider theme={openScoreboardTheme}>

            <link type="text/css" rel="stylesheet" href="https://www.gstatic.com/firebasejs/ui/5.0.0/firebase-ui-auth.css" />
            <View >
                <Text textAlign={"center"} padding={3} fontSize={"5xl"} fontWeight="bold" color={openScoreboardColor}>Open Scoreboard</Text>
                <div id="uicontainer"></div>
            </View>
        </NativeBaseProvider>

    )
}