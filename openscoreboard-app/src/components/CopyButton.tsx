import React, { useState } from 'react';
import { View, Input, Text, Button, FormControl } from 'native-base';
import { FontAwesome } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import { openScoreboardButtonTextColor } from "../../openscoreboardtheme";
import { setStringAsync } from 'expo-clipboard';
import i18n from '../translations/translate';


export default function CopyButton({text}){
    let [wasCopied, setWasCopied] = useState(false)


    return (
        
        <View padding={1}>
            <Button
            onPress={()=>{
                setWasCopied(true)
                setStringAsync(text)
                setTimeout(()=>{
                    setWasCopied(false)
                }, 2000)
            }}
            >
                {
                    wasCopied ? 
                    <Text color={openScoreboardButtonTextColor}>{i18n.t("copied")}!</Text>:
                    <FontAwesome name="copy" color={openScoreboardButtonTextColor} size={24} />
                }
                
            </Button>
        </View>
    )
}