import React from 'react';
import { Text, View, Divider, Pressable } from 'native-base';
import { AntDesign } from '@expo/vector-icons';
import { openScoreboardColor } from "../../openscoreboardtheme";
import { Link } from '@react-navigation/native';

export const HomeItem = ({ item, navigation }) => {

    return (
        <>
        
            
            <Pressable width={"100%"} flexDir={"row"} _hover={{ backgroundColor: "gray.300" }} flex={1} justifyContent={"space-between"}

                onPress={() => {
                  
                    navigation.navigate(item.route);
                }}
                padding={0}
                variant={"ghost"}
            >

                <View padding={0} flex={1}>
                    <Text textAlign={"left"} fontSize="xl" fontWeight={"bold"}>{item.title}</Text>
                    <Text fontSize={"xs"}>{item.description}</Text>

                </View>
                <View alignItems={"center"} justifyContent={"center"} padding={0}>
                    <AntDesign name="arrowright" size={24} color={openScoreboardColor} />
                </View>



            </Pressable>
          
            <Divider></Divider>
        </>




    );
};
