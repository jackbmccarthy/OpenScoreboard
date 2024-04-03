import React from 'react';
import { Text, Button, View, Divider } from 'native-base';
import { openScoreboardColor } from "../../openscoreboardtheme";
import { Ionicons, FontAwesome, MaterialCommunityIcons, AntDesign } from '@expo/vector-icons';
import { supportedSports } from '../functions/sports';

export function TableItem(props) {
console.log(props)
const iconSize = 24

    return (
        <>
            <View maxW={"lg"}>
                <View padding={1} flexDirection={"column"}>
                        <Text textAlign={"left"} fontSize={"xl"} fontWeight={"bold"}>{props.tableName}</Text>
                        <View padding={0}>
                            <Text lineHeight={"1em"}  padding={0} textAlign={"left"} fontSize={"sm"} fontWeight={"medium"}>{supportedSports[props.sportName]?.displayName?supportedSports[props.sportName]?.displayName :"Table Tennis"}</Text>
                        </View>
                        
                    </View>
                <View width="100%" flex={1} >
                    <View flexDirection={"row"} alignItems="center" justifyContent={"space-between"}>
                        <View padding={1}>
                            <Button padding={1} variant="ghost"
                                onPress={() => {
                                    props.navigation.navigate("TableScoring", { tableID: props.id, name: props.tableName, password: props.password, sportName:props.sportName? props.sportName : "tableTennis", scoringType:props.scoringType ? props.scoringType : null });

                                }}
                            >
                                <MaterialCommunityIcons name="scoreboard" size={iconSize} color={openScoreboardColor} />
                            </Button>
                        </View>
                        <View padding={1}>
                            <Button padding={1} variant="ghost"
                                onPress={() => {
                                    props.openEditPlayerList(props)
                                    //props.navigation.navigate("AddPlayers", { tableID: props.id, name: props.tableName });

                                }}
                            >
                                <FontAwesome name="users" size={iconSize} color={openScoreboardColor} />
                            </Button>
                        </View>
                        <View>
                            <Button 
                            onPress={()=>{
                                props.navigation.navigate("ArchivedMatchList", { tableID: props.id, });
                            }}
                            padding={1} variant="ghost"

                            >
                                <FontAwesome name="history" size={iconSize} color={openScoreboardColor} />
                            </Button>
                        </View>
                        <View>
                            <Button variant={"ghost"} padding={1}
                                onPress={() => {
                                   props.navigation.navigate("ScheduledTableMatches", { tableID: props.id, name: props.tableName, sportName:props.sportName,scoringType:props.scoringType });
                                }}
                            >
                                <AntDesign name="calendar" size={iconSize} color={openScoreboardColor} />
                            </Button>
                        </View>
                        <View>
                            <Button variant={"ghost"} padding={1}
                                onPress={() => {
                                    props.openEditTable(props)
                                }}
                            >
                                <Ionicons name="settings" size={iconSize} color={openScoreboardColor} />
                            </Button>
                        </View>
                        <View>
                            <Button variant={"ghost"} padding={1}
                                onPress={() => {
                                    props.openLinkModal(props.id, props.index)
                                }}
                            >
                                <FontAwesome name="share" size={iconSize} color={openScoreboardColor} />
                            </Button>
                        </View>
                    </View>
                    

                </View>
            </View>

            <Divider></Divider>
        </>



    );
}
