import React, { useState } from 'react';
import { Text, Button, View, Divider, Spinner, Checkbox } from 'native-base';
import { FontAwesome } from '@expo/vector-icons';
import { openScoreboardButtonTextColor, openScoreboardColor } from "../../openscoreboardtheme";
import { deletePlayerList } from '../functions/players';
import i18n from '../translations/translate';

export function TableLiveScoringLinkItem(props) {
    let [isChecked, setIsChecked] = useState("");
    return (
        <View>
            <View padding={1} justifyContent={"center"} >
                <Checkbox
                    onChange={(event) => {
                        props.onTableSelected(event, props.item["id"])
                    }}
                    value={isChecked}>
                    <Text fontSize={"3xl"} fontWeight="bold">{props.item["tableName"]}</Text>

                </Checkbox>



            </View>
            <Divider></Divider>
        </View>
    );
}
