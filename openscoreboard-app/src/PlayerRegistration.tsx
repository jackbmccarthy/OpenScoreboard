

import React, { Component, useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView,  Share } from 'react-native';
import { Text, Button, Tab, Tabs, Container, Icon,View, ListItem, Body, Card, CardItem, NativeBaseProvider, Spinner, FormControl, Input, } from 'native-base';
//import { withNavigationFocus, NavigationEvents } from 'react-navigation';


import db, { getUserPath } from '../database';
import { openScoreboardButtonTextColor, openScoreboardColor } from "../openscoreboardtheme";
import { openScoreboardTheme } from "../openscoreboardtheme";
import JerseyColorOptions from './components/JerseyColorOptions';
import { SuccessfulRegistrationModal } from './modals/SuccessfulRegistrationModal';
import { getNewPlayer, newImportedPlayer } from './classes/Player';
import { addImportedPlayer, getImportPlayerList, watchForPlayerListPasswordChange } from './functions/players';
import Unauthorized from './Unauthorized';

export default function PlayerRegistration({route, navigation}){

    let [selectedColor, setSelectedColor] = useState("")
    let [firstName, setFirstName] = useState("")
    let [lastName, setLastName] = useState("")
    let [unauthorized, setUnAuthorized] = useState(false)

    let [playerListExists, setPlayerListExists] = useState(false)
    let [loadingPlayer, setLoadingPlayer] = useState()
    let [showSuccess, setShowSuccess] = useState(false)

    useEffect(()=>{
        let unSub =  watchForPlayerListPasswordChange(route.params.playerListID, (password)=>{
             if(typeof password ==="string" && password !== route.params.password){
                 setUnAuthorized(true)
                 
             }
         })
         return unSub
     }, [])


    useEffect(()=>{
        getImportPlayerList(route.params.playerListID).then((playerList)=>{
            if(playerList.length > 0){
                setPlayerListExists(true)
            }
        })
    }, [])

    
    

if(!unauthorized){
    return (
        <NativeBaseProvider theme={openScoreboardTheme}>
            <View justifyContent={"center"} alignItems="center" width={"100%"}height={"100%"}>
                
                <View>
                    <Text textAlign={"center"} lineHeight={"2xl"} fontSize={"3xl"}>Player Registration</Text>
                    <Text  textAlign={"center"}  lineHeight={"2xl"} >Please register your name here.</Text>
               
                </View>
                
                <View maxWidth={"lg"}>
                    <FormControl>
                        <FormControl.Label>First Name</FormControl.Label>
                        <Input value={firstName}
                        onChangeText={(text)=>{
                            setFirstName(text)
                        }}
                        type="text"></Input>
                        <FormControl.Label>Last Name</FormControl.Label>
                        <Input value={lastName}
                        onChangeText={(text)=>{
                            setLastName(text)
                        }}
                        type="text"></Input>
                        <FormControl.Label>Jersey Color</FormControl.Label>
                        <JerseyColorOptions color={selectedColor} onSelect={(selectedColor)=>{
                            setSelectedColor(selectedColor)
                        }} ></JerseyColorOptions>
                    </FormControl>
                    <View flexDirection={"row"}>
                        <View flex={1} padding={1}>
                        <Button
                        onPress={async ()=>{
                            setLoadingPlayer(true)
                            if(playerListExists ){
                                await addImportedPlayer(route.params.playerListID,newImportedPlayer(firstName, lastName, "", "", selectedColor))  
                                setShowSuccess(true)
                            }
                            setLoadingPlayer(false)
                        }}
                        >
                            {
                                loadingPlayer ?
<Spinner  ></Spinner>
                                :
<Text color={openScoreboardButtonTextColor}>Register</Text>
                            }
                            
                            
                        </Button>
                        </View>
                  
                        </View>
                    
                </View>
          
             
            {showSuccess ?
                <SuccessfulRegistrationModal
                isOpen={showSuccess}
                onClose={()=>{
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
else{
    return(
        <Unauthorized></Unauthorized>
    )
}
    
}