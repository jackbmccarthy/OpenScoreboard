import { Text, View, Pressable } from 'native-base';
import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { openScoreboardColor } from "../../openscoreboardtheme";

export const HomeItem = ({ item, navigation }) => {
    const isDisabled = !item.route || item.disabled;

    return (
        <Pressable
            width={"100%"}
            minHeight={160}
            flexDir={"row"}
            _hover={{ backgroundColor: "gray.50", borderColor: "blue.200" }}
            flex={1}
            justifyContent={"space-between"}
            borderRadius={8}
            borderWidth={1}
            borderColor={isDisabled ? "gray.200" : "gray.100"}
            backgroundColor={isDisabled ? "gray.100" : "white"}
            onPress={() => {
                if (!isDisabled) {
                    navigation.navigate(item.route);
                }
            }}
            padding={4}
            variant={"ghost"}
        >
            <View padding={0} flex={1} paddingRight={3}>
                <Text textAlign={"left"} fontSize="lg" fontWeight={"bold"} color={isDisabled ? "gray.500" : "gray.900"}>{item.title}</Text>
                <Text fontSize={"sm"} color={"gray.600"} marginTop={1}>{item.description}</Text>
                {item.options?.length ? (
                    <View flexDir={"row"} flexWrap={"wrap"} marginTop={3}>
                        {item.options.map((option) => (
                            <View
                                key={option}
                                backgroundColor={"blue.50"}
                                borderColor={"blue.100"}
                                borderWidth={1}
                                borderRadius={999}
                                paddingX={2}
                                paddingY={1}
                                marginRight={2}
                                marginBottom={2}
                            >
                                <Text fontSize={"xs"} color={"blue.700"}>{option}</Text>
                            </View>
                        ))}
                    </View>
                ) : null}
            </View>
            <View alignItems={"center"} justifyContent={"center"} padding={0}>
                {!isDisabled ? (
                    <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <Path
                            d="M7 4L13 10L7 16"
                            stroke={openScoreboardColor}
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </Svg>
                ) : null}
            </View>
        </Pressable>
    );
};
