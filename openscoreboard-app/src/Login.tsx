import React, { Component, useEffect, useRef, useState } from 'react';
import { Input, Item, Text, Button, Toast, View, FormControl, Image } from 'native-base';
import { ScrollView, ActivityIndicator, Linking, TextInput, Platform } from 'react-native';
import firebase from 'firebase';
import googleSignInImage from './img/googlelogin.png'
//import { withNavigationFocus } from 'react-navigation';
import * as firebaseui from 'firebaseui'
import { NativeBaseProvider } from 'native-base';
import { openScoreboardColor } from "../openscoreboardtheme";
import { openScoreboardTheme } from "../openscoreboardtheme";

async function loginToGoogle() {
    var googleProvider = new firebase.auth.GoogleAuthProvider()
    googleProvider.addScope("https://www.googleapis.com/auth/userinfo.email")
    googleProvider.addScope("https://www.googleapis.com/auth/userinfo.profile")
    firebase.auth().useDeviceLanguage()
    firebase.auth().signInWithPopup(googleProvider).then((result) => {
        /** @type {firebase.auth.OAuthCredential} */
        var credential = result.credential;
        // This gives you a Google Access Token. You can use it to access the Google API.
        var token = credential.accessToken;
        // The signed-in user info.
        var user = result.user;
        // IdP data available in result.additionalUserInfo.profile.
        // ...
    }).catch((error) => {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        // The email of the user's account used.
        var email = error.email;
        // The firebase.auth.AuthCredential type that was used.
        var credential = error.credential;
        // ...
    });
}


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