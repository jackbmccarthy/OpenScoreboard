import React from 'react';
import { Text, View, Divider, Pressable } from 'native-base';
import Svg, { Path } from 'react-native-svg';
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
                    <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <Path
                            d="M7 4L13 10L7 16"
                            stroke={openScoreboardColor}
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </Svg>
                </View>



            </Pressable>

            <Divider></Divider>
        </>




    );
};
