import React, { useState } from 'react';
import { Button, Text, View, Spinner, Divider } from 'native-base';
import { openScoreboardButtonTextColor } from "../../openscoreboardtheme";
import { setScheduledTableMatchToCurrentMatch } from '../functions/tables';
import { FontAwesome5 } from '@expo/vector-icons';
import i18n from '../translations/translate';

export function ScoringScheduledMatchItem(props) {

    let [loadingNewMatch, setLoadingNewMatch] = useState(false);
    let [showConfirm, setShowConfirm] = useState(false);

    return (
        <View>

            <View padding={1} justifyContent={"space-between"} flexDirection="row" alignItems={"center"}>
                <View>
                    <View justifyContent={"space-between"} flexDirection="row" alignItems={"center"}>
                        <Text textAlign={"center"} fontWeight={"bold"}>{props.item[1]["playerA"].length > 0 ? props.item[1]["playerA"] : "TBD"}</Text>
                        <Text textAlign={"center"}> VS </Text>
                        <Text textAlign={"center"} fontWeight={"bold"}>{props.item[1]["playerB"].length > 0 ? props.item[1]["playerB"] : "TBD"}</Text>
                    </View>
                    <Text>{new Date(props.item[1]["startTime"]).toLocaleString(Intl.Locale, { timeStyle: "short", dateStyle: "short" })} </Text>
                </View>

                <View flexDirection={"row"} alignItems={"center"}>
                    {showConfirm ?
                        <>
                            <View padding={1}>
                                <Button onPress={async () => {
                                    setLoadingNewMatch(true);
                                    await props.beforeConfirm();
                                    await setScheduledTableMatchToCurrentMatch(props.tableID, props.item[1]["matchID"], props.item[0]);
                                    setLoadingNewMatch(false);
                                    props.onConfirm();
                                }}>
                                    {loadingNewMatch ?
                                        <Spinner color={openScoreboardButtonTextColor} />
                                        :
                                        <Text color={openScoreboardButtonTextColor}>{i18n.t("confirm")}</Text>}

                                </Button>
                            </View>
                            <View padding={1}>
                                <Button
                                    onPress={() => {
                                        setShowConfirm(false);
                                    }}
                                    variant={"ghost"}>
                                    <Text>{i18n.t("back")}</Text>
                                </Button>
                            </View>
                        </>
                        :
                        <Button onPress={() => {
                            setShowConfirm(true);

                        }}>
                            {loadingNewMatch ?
                                <Spinner color={openScoreboardButtonTextColor} />
                                :
                                <FontAwesome5 name="table-tennis" size={24} color={openScoreboardButtonTextColor} />}

                        </Button>}

                </View>
            </View>
            <Divider></Divider>
        </View>
    );
}
