import React, { useEffect, useState } from 'react';
import { View, Input, Text, Button, FormControl } from 'native-base';
import { FontAwesome } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';


export default function JerseyColorOptions({color, onSelect}) {

    let [selectedIndex, setSelectedIndex] = useState("")


    useEffect(()=>{
        let index = availableColors.indexOf(color)
        if(index >= 0){
           setSelectedIndex(index) 
        }
        else{
            setSelectedIndex("")
        }
        
    }, [color])

    const availableColors = [
        "#000000",
        "#ff0000",
        //"#ff4000",
        "#ff8000",
        "#ffbf00",
        "#ffff00",
        "#bfff00",
      //  "#80ff00",
       // "#40ff00",
        "#00ff00",
        "#00ff40",
       // "#00ff80",
        "#00ffbf",
        "#00ffff",
        "#00bfff",
        "#0080ff",
        //"#0040ff",
      //  "#0000ff",
        "#4000ff",
        "#8000ff",
        "#bf00ff",
        "#ff00ff",
        "#ff00bf",
        "#ff0080",
        "#ff0040",
        "#B8B8B8"
    ]

    return (
        <View flexDirection={"row"} flexWrap="wrap">
            {
                availableColors.map((color, index) => {
                    return (
                        <View padding={1} borderWidth={selectedIndex === index ? 2 : 2} borderColor={ selectedIndex === index ?  "black" :"transparent"} key={color}>
                            <TouchableOpacity
                                onPress={() => {
                                    setSelectedIndex(index)
                                    onSelect(availableColors[index])
                                }}
                                style={{backgroundColor:color, padding: 2 }}>
                                <Text fontSize={"xl"} color={color}>OO</Text>
                            </TouchableOpacity>

                        </View>

                    )
                })
            }
        </View>
    )
}