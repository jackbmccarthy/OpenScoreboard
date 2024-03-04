import React, { useState } from 'react';
import { Button, Text, View, Avatar, Divider, FormControl } from 'native-base';
import { getPlayerFormatted } from '../functions/players';
import JerseyColorOptions from '../components/JerseyColorOptions';
import { FontAwesome5 } from '@expo/vector-icons';
export function ImportPlayerItem(props) {
   // let [jerseyColor, setJerseyColor] = useState("")

    return (
        <>
            <View flex={1}>
                <Button 
                    onPress={() => {
                        if(typeof props.selectImportPlayer === "function"){
                            props.selectImportPlayer({...JSON.parse(JSON.stringify(props))});
                        }
                        
                    }}
                    padding={1} variant={"ghost"} justifyContent="flex-start">

                    <View flex={1} alignItems="center" flexDirection={"row"}>
                        {
                            props.jerseyColor !=="" ?
                            <FontAwesome5 name="tshirt" size={18} color={props.jerseyColor} />
                            : null
                        }
                    
                    
                        {props.imageURL && props.imageURL.length > 0 ?
                            <View padding={1}>
                                <Avatar size={"sm"} source={{ uri: props.imageURL }}></Avatar>
                            </View>

                            : <View padding={1}>
                                <Avatar size={"sm"} source={{ uri: "" }}></Avatar>
                            </View>}
                        <Text fontSize={"lg"}>{getPlayerFormatted(props)}</Text>


                    </View>
                </Button>
            </View>
            <Divider></Divider>
        </>


    );
}
