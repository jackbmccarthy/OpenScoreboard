import React, { useState } from 'react';
import { Button, View } from 'native-base';
import { openScoreboardButtonTextColor, openScoreboardColor } from "../../openscoreboardtheme";
import { switchSides } from '../functions/scoring';
import { FontAwesome5, MaterialIcons, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

export function TopScoringSettings(props) {

    let [loadingSwitchSide, setLoadingSwitchSide] = useState(false);


    return (<View>
        <View flexDirection={"row"} alignItems="center" padding={1} backgroundColor={openScoreboardColor}>

            <View flex={1}>
                <Button
                    onPress={() => {
                        props.openTimeOutModal();
                    }}
                >
                    <MaterialIcons name="timer" size={24} color={openScoreboardButtonTextColor} />
                </Button>
            </View>
            <View flex={1}>
                <Button
                    onPress={() => {
                        props.openPenaltyModal();
                    }}
                >
                    <MaterialCommunityIcons name="cards" size={24} color={openScoreboardButtonTextColor} />
                </Button>
            </View>


            <View flex={1}>
                <Button
                    onPress={() => {
                        props.openServiceModal();
                    }}
                >
                    <View alignItems={"center"} flexDirection={"row"}>


                        <FontAwesome5 name="table-tennis" size={24} color={openScoreboardButtonTextColor} />


                    </View>
                </Button>
            </View>
            <View flex={1}>
                <Button disabled={loadingSwitchSide}
                    onPress={async () => {
                        setLoadingSwitchSide(true);
                        await switchSides(props.matchID);
                        setLoadingSwitchSide(false);
                    }}
                >
                    <View justifyContent={"center"} alignItems="center">
                        <MaterialCommunityIcons name="account-switch-outline" size={26} color={openScoreboardButtonTextColor} />
                    </View>


                </Button>
            </View>

            <View flex={1}>
                <Button
                    onPress={async () => {
                        props.openSignificantPointsModal();
                    }}
                >
                    <View justifyContent={"center"} flexDirection="row" alignItems="center">
                        <MaterialCommunityIcons name="hand-clap" size={24} color={openScoreboardButtonTextColor} />
                    </View>


                </Button>
            </View>
            <View flex={1}>
                <Button
                onPress={()=>{
                    props.openAdvanceSettingsModal()
                }}
                >
                    <Ionicons name="settings-sharp" size={24} color={openScoreboardButtonTextColor} />
                </Button>
            </View>
        </View>

    </View>);

}
