import React, { useState } from 'react';
import { Button, View, FormControl, Input, Text, Divider } from 'native-base';
import { openScoreboardButtonTextColor, openScoreboardColor } from "../../openscoreboardtheme";
import { FontAwesome } from '@expo/vector-icons';
import i18n from '../translations/translate';

export function TeamPlayerItem(props) {

    let [isEditing, setIsEditing] = useState(false);

    let [tappedDelete, setTappedDelete] = useState(false)

    let [firstName, setFirstName] = useState(props.firstName);
    let [lastName, setLastName] = useState(props.lastName);
    let [imageURL, setImageURL] = useState(props.imageURL)

    return (
        <>
            <View>
                {isEditing ?
                    <View alignItems={"center"} flexDirection={"row"}>
                        <View flex={2}>
                            <FormControl>
                                <FormControl.Label>{i18n.t("firstName")}</FormControl.Label>
                                <Input
                                    onChangeText={setFirstName}
                                    value={firstName}></Input>
                                <FormControl.Label>{i18n.t("lastName")}</FormControl.Label>
                                <Input
                                    onChangeText={setLastName}
                                    value={lastName}></Input>
                                <FormControl.Label>{i18n.t("imageURL")}</FormControl.Label>
                                <Input
                                    onChangeText={setImageURL}
                                    value={imageURL}></Input>

                            </FormControl>

                        </View>

                        <View flex={1} alignItems="center" justifyContent={"center"} padding={1}>
                            <Button
                                onPress={() => {
                                    setIsEditing(false);
                                    props.onUpdate(props.id, { ...props, firstName: firstName, lastName: lastName, imageURL: imageURL });
                                }}
                            >
                                <Text color={openScoreboardButtonTextColor}>{i18n.t("save")}</Text>
                            </Button>
                        </View>
                    </View>

                    :
                    <>
                        <View padding={1} justifyContent="space-between" alignItems={"center"} flexDirection={"row"}>
                            <Text>{firstName} {lastName}</Text>
                            <View flexDir={"row"} padding={1}>
                                <Button onPress={() => {
                                    setIsEditing(true);
                                }}>
                                    <FontAwesome name='edit' size={24} color={openScoreboardButtonTextColor} />
                                </Button>
                                <View paddingLeft={1}>
                                    <Button backgroundColor={tappedDelete ? "#FF0000" : openScoreboardColor} onPress={() => {
                                        if (tappedDelete) {
                                            props.onDelete(props.id)
                                            setTappedDelete(false)
                                        }
                                        else {
                                            setTappedDelete(true)
                                        }

                                    }}>
                                        <FontAwesome name='trash' size={24} color={openScoreboardButtonTextColor} />
                                    </Button>
                                </View>
                            </View>

                        </View>

                    </>
                }
            </View>
            <Divider></Divider>
        </>

    );
}
