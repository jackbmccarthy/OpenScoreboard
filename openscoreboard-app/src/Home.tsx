import React from 'react';
import { TouchableOpacity, } from 'react-native';
import { Text, ScrollView, NativeBaseProvider, View, Image, FlatList, Button } from 'native-base';
import { openScoreboardButtonTextColor, openScoreboardTheme } from "../openscoreboardtheme";
import i18n from './translations/translate';
import { HomeItem } from './listitems/HomeItem';

export default function Home(props) {

    const scoringScreens = [
        {
            route: "MyTables",
            title: i18n.t("tables"),
            description: i18n.t("tableDescription"),

        },
        {
            route: "MyTeamMatches",
            title: i18n.t("teamMatches"),
            description: i18n.t("teamMatchDescription"),

        },
    ]
    const importables = [
        {
            route: "MyPlayerLists",
            title: i18n.t("players"),
            description: i18n.t("playersDescription"),

        },
        {
            route: "MyTeams",
            title: i18n.t("teams"),
            description: i18n.t("teamDescription"),

        },

    ]
    const scoreboards = [
        {
            route: "MyScoreboards",
            title: i18n.t("scoreboards"),
            description: i18n.t("scoreboardsDescription"),

        },
        {
            route: "DynamicURLS",
            title: "Dynamic URLs",
            description: i18n.t("dynamicURLDescription"),

        }
    ]

    const account = [

        {
            route: "MyAccount",
            title: i18n.t("accountSettings"),
            description: i18n.t("accountSettingsDescription"),

        },
        {
            route: "",
            title: `${i18n.t("tutorials")}(${i18n.t("comingSoon")})`,
            description: i18n.t("tutorialsDescription"),

        },
    ]


    return (
        <NativeBaseProvider theme={openScoreboardTheme}>
            <ScrollView
            >
                <View>
                    <Text fontSize={"2xl"} textAlign="center" underline fontWeight={"bold"}>{i18n.t("scoring")}</Text>
                </View>
                <FlatList
                alignSelf={"center"}
                width={"100%"}
                maxW={500}
                data={scoringScreens}
                    renderItem={(item)=>{ return (
                        <HomeItem {...item} navigation={props.navigation}></HomeItem>
                    )}}
                    >

                    </FlatList>
               

                <View>
                    <Text fontSize={"2xl"} textAlign="center" underline fontWeight={"bold"}>{i18n.t("importablePlayersTeams")}</Text>
                </View>
                <FlatList
                alignSelf={"center"}
                width={"100%"}
                maxW={500}
                data={importables}
                    renderItem={(item)=>{ return (
                        <HomeItem {...item} navigation={props.navigation}></HomeItem>
                    )}}
                    >

                    </FlatList>
             

                <View>
                    <Text fontSize={"2xl"} textAlign="center" underline fontWeight={"bold"}>{i18n.t("scoreboardsOverlays")}</Text>
                </View>
                <FlatList
                alignSelf={"center"}
                width={"100%"}
                maxW={500}
                data={scoreboards}
                    renderItem={(item)=>{ return (
                        <HomeItem {...item} navigation={props.navigation}></HomeItem>
                    )}}
                    >

                    </FlatList>
              

                <View>
                    <Text fontSize={"2xl"} textAlign="center" underline fontWeight={"bold"}>{i18n.t("account")}</Text>
                </View>
                <FlatList
                alignSelf={"center"}
                width={"100%"}
                maxW={500}
                data={account}
                    renderItem={(item)=>{ return (
                        <HomeItem {...item} navigation={props.navigation}></HomeItem>
                    )}}
                    >

                    </FlatList>
             




            </ScrollView>
        </NativeBaseProvider>
    )
}