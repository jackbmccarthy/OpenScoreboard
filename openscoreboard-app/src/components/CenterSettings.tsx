import React, { useEffect, useState } from 'react';
import { Button, Text, View } from 'native-base';
//import { openScoreboardButtonTextColor } from '../../openscoreboard.config';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { switchSides } from '../functions/scoring';
import { AntDesign, FontAwesome5, Entypo } from '@expo/vector-icons';
import i18n from '../translations/translate';
import { openScoreboardButtonTextColor } from '../../openscoreboardtheme';

export function CenterSettings(props) {
    let [serveLeft, setServeLeft] = useState(false);
    let [loadingSwitchSide, setLoadingSwitchSide] = useState(false);

    useEffect(() => {
        if (props.isSwitched) {
            setServeLeft(props.isACurrentlyServing ? false : true);
        }
        else {
            setServeLeft(props.isACurrentlyServing ? true : false);
        }

    }, [props.isSwitched, props.isACurrentlyServing]);
    return (

        <View style={{ transform: "translate(-50%, -50%)" }} position={"absolute"} top={"50%"} left={"50%"}>
            <View position={"relative"}>
                <Button
                    onPress={() => {
                    }}
                    borderStyle={"groove"} borderWidth="4" borderColor={"white"} padding={1}>
                    <View alignItems={"center"} flexDirection={"row"}>
                        {serveLeft ?
                            <AntDesign name="caretleft" size={24} color={openScoreboardButtonTextColor} />
                            : null}

                        <Text color={openScoreboardButtonTextColor} fontWeight={"bold"} textAlign={"center"}>{i18n.t("serve")}</Text>
                        {!serveLeft ?
                            <AntDesign name="caretright" size={24} color={openScoreboardButtonTextColor} />
                            : null}

                    </View>
                </Button>
            </View>
            <View padding={1}>
                <Button disabled={loadingSwitchSide}
                    onPress={async () => {
                        setLoadingSwitchSide(true);
                        await switchSides(props.matchID);
                        setLoadingSwitchSide(false);
                    }}
                    borderStyle={"groove"} borderWidth="4" borderColor={"white"} padding={1}>
                    <View justifyContent={"center"} alignItems="center">
                        <MaterialCommunityIcons name="account-switch-outline" size={26} color={openScoreboardButtonTextColor} />
                    </View>


                </Button>
            </View>

            <View padding={1}>
                <Button 
                    onPress={async () => {
                       
                    }}
                    borderStyle={"groove"} borderWidth="4" borderColor={"white"} padding={1}>
                    <View justifyContent={"center"} flexDirection="row" alignItems="center">
                    <Entypo name="thumbs-up" size={24} color={openScoreboardButtonTextColor} />
                    <FontAwesome5 name="table-tennis" size={24} color={openScoreboardButtonTextColor} />
                    </View>


                </Button>
            </View>
        </View>
    );
}
