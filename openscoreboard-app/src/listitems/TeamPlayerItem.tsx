import React, { useState } from 'react';
import { Button, View, FormControl, Input, Text, Divider } from 'native-base';
import { openScoreboardButtonTextColor, openScoreboardColor } from "../../openscoreboardtheme";
import { FontAwesome } from '@expo/vector-icons';
import i18n from '../translations/translate';
import CountrySelect, { getCountryName } from '../components/CountrySelect';

export function TeamPlayerItem(props) {

    let [isEditing, setIsEditing] = useState(false);

    let [tappedDelete, setTappedDelete] = useState(false)

    let [firstName, setFirstName] = useState(props.firstName);
    let [lastName, setLastName] = useState(props.lastName);
    let [imageURL, setImageURL] = useState(props.imageURL)
    let [country, setCountry] = useState(props.country || "")
    let [gender, setGender] = useState(props.gender || "")
    let [rating, setRating] = useState(`${props.rating || ""}`)
    let [ranking, setRanking] = useState(`${props.ranking || ""}`)

    function normalizeGender(value = "") {
        return `${value || ""}`.trim().slice(0, 1).toUpperCase();
    }

    function normalizeNumberField(value) {
        const parsedValue = parseInt(`${value || ""}`, 10);
        return Number.isNaN(parsedValue) ? "" : parsedValue;
    }

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
                                <FormControl.Label>{i18n.t("country")}</FormControl.Label>
                                <CountrySelect value={country} onChange={setCountry} />
                                <FormControl.Label>Gender</FormControl.Label>
                                <Input
                                    maxLength={1}
                                    onChangeText={(value) => setGender(normalizeGender(value))}
                                    value={gender}></Input>
                                <FormControl.Label>Rating</FormControl.Label>
                                <Input
                                    keyboardType={"numeric"}
                                    onChangeText={(value) => setRating(`${normalizeNumberField(value)}`)}
                                    value={rating}></Input>
                                <FormControl.Label>Ranking</FormControl.Label>
                                <Input
                                    keyboardType={"numeric"}
                                    onChangeText={(value) => setRanking(`${normalizeNumberField(value)}`)}
                                    value={ranking}></Input>

                            </FormControl>

                        </View>

                        <View flex={1} alignItems="center" justifyContent={"center"} padding={1}>
                            <Button
                                onPress={() => {
                                    setIsEditing(false);
                                    props.onUpdate(props.id, { ...props, firstName: firstName, lastName: lastName, imageURL: imageURL, country: country, gender: gender, rating: normalizeNumberField(rating), ranking: normalizeNumberField(ranking) });
                                }}
                            >
                                <Text color={openScoreboardButtonTextColor}>{i18n.t("save")}</Text>
                            </Button>
                        </View>
                    </View>

                    :
                    <>
                        <View padding={1} justifyContent="space-between" alignItems={"center"} flexDirection={"row"}>
                            <View>
                                <Text>{firstName} {lastName}</Text>
                                {country ? (
                                    <Text color={"gray.600"} fontSize={"xs"}>{getCountryName(country)}</Text>
                                ) : null}
                                {(gender || rating || ranking) ? (
                                    <Text color={"gray.600"} fontSize={"xs"}>
                                        {[gender ? `Gender ${gender}` : "", rating ? `Rating ${rating}` : "", ranking ? `Ranking ${ranking}` : ""].filter(Boolean).join(" | ")}
                                    </Text>
                                ) : null}
                            </View>
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
