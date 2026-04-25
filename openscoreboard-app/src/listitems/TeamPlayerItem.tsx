import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from 'heroui-native/button';
import { Input } from 'heroui-native/input';
import { Separator } from 'heroui-native/separator';
import { openScoreboardColor } from "../../openscoreboardtheme";
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
                    <View style={styles.editorWrap}>
                        <View style={styles.editorFields}>
                            <Text style={styles.label}>{i18n.t("firstName")}</Text>
                            <Input
                                onChangeText={setFirstName}
                                value={firstName}></Input>
                            <Text style={styles.label}>{i18n.t("lastName")}</Text>
                            <Input
                                onChangeText={setLastName}
                                value={lastName}></Input>
                            <Text style={styles.label}>{i18n.t("imageURL")}</Text>
                            <Input
                                onChangeText={setImageURL}
                                value={imageURL}></Input>

                        </View>

                        <View style={styles.saveWrap}>
                            <Button
                                onPress={() => {
                                    setIsEditing(false);
                                    props.onUpdate(props.id, { ...props, firstName: firstName, lastName: lastName, imageURL: imageURL });
                                }}
                            >
                                <Button.Label>{i18n.t("save")}</Button.Label>
                            </Button>
                        </View>
                    </View>

                    :
                    <>
                        <View style={styles.displayRow}>
                            <View style={styles.playerCopy}>
                                <Text style={styles.playerName}>{firstName} {lastName}</Text>
                                <Text style={styles.playerMeta}>{imageURL?.length > 0 ? imageURL : "No player image set"}</Text>
                            </View>
                            <View style={styles.actionRow}>
                                <Button isIconOnly onPress={() => {
                                    setIsEditing(true);
                                }}>
                                    <FontAwesome name='edit' size={24} color={openScoreboardColor} />
                                </Button>
                                <Button variant={tappedDelete ? "danger" : "primary"} isIconOnly onPress={() => {
                                    if (tappedDelete) {
                                        props.onDelete(props.id)
                                        setTappedDelete(false)
                                    }
                                    else {
                                        setTappedDelete(true)
                                    }

                                }}>
                                    <FontAwesome name='trash' size={24} color={"white"} />
                                </Button>
                            </View>

                        </View>

                    </>
                }
            </View>
            <Separator></Separator>
        </>

    );
}

const styles = StyleSheet.create({
    editorWrap: {
        alignItems: "center",
        flexDirection: "row",
        gap: 12,
        paddingVertical: 6,
    },
    editorFields: {
        flex: 1,
        gap: 6,
    },
    label: {
        color: "#374151",
        fontSize: 13,
        fontWeight: "600",
        marginTop: 4,
    },
    saveWrap: {
        alignItems: "center",
        justifyContent: "center",
    },
    displayRow: {
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 8,
    },
    playerCopy: {
        flex: 1,
        minWidth: 0,
        paddingRight: 10,
    },
    playerName: {
        color: "#111827",
        fontWeight: "700",
    },
    playerMeta: {
        color: "#6b7280",
        fontSize: 12,
        lineHeight: 17,
        marginTop: 2,
    },
    actionRow: {
        flexDirection: "row",
        gap: 6,
    },
});
