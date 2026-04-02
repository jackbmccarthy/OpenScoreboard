import React, { useState } from 'react';
import { View, Text, Button, Divider } from 'native-base';
import { FontAwesome } from '@expo/vector-icons';
import { openScoreboardButtonTextColor, openScoreboardColor } from "../../openscoreboardtheme";
import { deleteScheduledTableMatch } from '../functions/scoring';
import i18n from '../translations/translate';

export function ScheduledMatchItem(props) {

    let [deleteMatch, setDeleteMatch] = useState(false);
    let [loadingDelete, setLoadingDelete] = useState(false);
    const { item } = props;
    return (
        <View>
            {deleteMatch ?
                <View>
                    <Text textAlign={"center"} fontSize="xl">{i18n.t("areYouSureDeleteMatch")}?</Text>
                    <View flexDirection={"row"}>
                        <View flex={1} padding={1}>
                            <Button variant={"outline"}
                                onPress={async () => {
                                    setLoadingDelete(true);
                                    await deleteScheduledTableMatch(props.route.params.tableID, item[0]);
                                    setLoadingDelete(false);
                                    props.reload();
                                }}
                            >
                                <Text>{i18n.t("yes")}</Text>
                            </Button>
                        </View>
                        <View flex={1} padding={1}>
                            <Button onPress={() => {
                                setDeleteMatch(false);
                            }}>
                                <Text color={openScoreboardButtonTextColor}>{i18n.t("no")}</Text>
                            </Button>
                        </View>
                    </View>
                </View>
                :
                <>
                    <View>
                        <Text textAlign={"center"}>
                            <Text fontSize={"xl"} fontWeight={"bold"}>{item[1]["playerA"].length > 0 ? item[1]["playerA"] : "TBD"}</Text>
                            <Text fontSize={"lg"}> VS. </Text>
                            <Text fontSize={"xl"} fontWeight={"bold"}>{item[1]["playerB"] ? item[1]["playerB"] : "TBD"}</Text>
                            <Text fontSize={"lg"}> @{new Date(item[1]["startTime"]).toLocaleString()} </Text>
                        </Text>



                        <View alignItems={"center"} justifyContent="space-evenly" flexDirection={"row"}>
                            <View padding={1}>
                                <Button variant={"ghost"} onPress={async () => {


                                    props.setEditMatch({
                                        matchID: item[1]["matchID"],
                                        scheduledMatchID: item[0],
                                        schedMatchStartTime: item[1]["startTime"]
                                    });
                                    props.setShowEditScheduledMatch(true);
                                }}>
                                    <FontAwesome name="edit" size={24} color={openScoreboardColor} />
                                </Button>
                            </View>
                            <View padding={1}>
                                <Button variant={"ghost"} onPress={async () => {
                                    setDeleteMatch(true);
                                }}>
                                    <FontAwesome name="trash" size={24} color={openScoreboardColor} />
                                </Button>
                            </View>

                        </View>

                    </View>
                </>}


            <Divider></Divider>
        </View>
    );
}
