import React, { useEffect, useState } from 'react';
import { Button, View, Modal, Text, Divider, Spinner } from 'native-base';
import { FontAwesome } from '@expo/vector-icons';
import db from '../../database';
import { openScoreboardButtonTextColor, openScoreboardColor } from "../../openscoreboardtheme";
import LoadingPage from '../LoadingPage';
import { EditTextItem } from '../components/EditTextItem';
import { deleteTable, resetTablePassword } from '../functions/tables';
import i18n from '../translations/translate';

export function TableEditModal(props) {
    let [doneLoading, setDoneLoading] = useState(false);
    let [reload, setReload] = useState(false);
    let [showConfirmPasswordReset, setShowConfirmPasswordReset] = useState(false);
    let [showDeleteTable, setShowDeleteTable] = useState(false);
    let [loadingDeleteTable, setLoadingDeleteTable] = useState(false);

    useEffect(() => {

        async function getTableInfo() {

            setDoneLoading(true);
        }
        getTableInfo();


    }, []);



    return (
        <Modal isOpen={props.isOpen} onClose={() => {
            props.onClose(reload);
            setReload(false);
        }}>
            <Modal.Content>
                <Modal.CloseButton></Modal.CloseButton>
                <Modal.Header>{i18n.t("editTable")}</Modal.Header>
                <Modal.Body>
                    {doneLoading ?
                        <View width="100%" alignSelf="center" maxW="lg">


                            <EditTextItem value={props.tableName} fieldName={"Table Name"} onSubmit={(text) => {
                                setReload(true);
                                db.ref("tables/" + props.id + "/tableName").set(text);
                            }}></EditTextItem>
                            <Divider></Divider>

                            {showConfirmPasswordReset ?
                                <>
                                    <View padding={1}>
                                        <Text fontSize={"lg"} textAlign="center" fontWeight="bold">{i18n.t("areYouSure")}</Text>
                                        <Text>{i18n.t("accessCutOff")}</Text>

                                    </View>
                                    <View flexDirection={"row"}>
                                        <View padding={1} flex={1}>
                                            <Button onPress={() => {
                                                resetTablePassword(props.id);
                                                setReload(true);
                                                setShowConfirmPasswordReset(false);
                                            }} variant={"outline"}>
                                                <Text>{i18n.t("yesReset")}</Text>
                                            </Button>
                                        </View>
                                        <View padding={1} flex={1}>
                                            <Button onPress={() => {
                                                setShowConfirmPasswordReset(false);
                                            }}>
                                                <Text color={openScoreboardButtonTextColor}>{i18n.t("no")}</Text>
                                            </Button>
                                        </View>
                                    </View>
                                </>
                                :

                                <View padding={2} style={{
                                    flexDirection: "row",
                                    justifyContent: "space-between",

                                    alignItems: "center",
                                }}>
                                    <Text>{i18n.t("resetShareAccess")}</Text>
                                    <View>
                                        <Button onPress={() => {
                                            setShowConfirmPasswordReset(true);
                                        }}>
                                            <Text color={openScoreboardButtonTextColor}>{i18n.t("reset")}</Text>
                                        </Button>

                                    </View>
                                </View>}
                            <Divider></Divider>
                            {showDeleteTable ?
                                <View>
                                    <Text>{i18n.t("deleteTableAreSure")}</Text>
                                    <View flexDirection={"row"}>
                                        <View flex={1} padding={1}>
                                            <Button variant={"outline"}
                                                onPress={async () => {
                                                    setLoadingDeleteTable(true);
                                                    await deleteTable(props.myTableID);
                                                    setLoadingDeleteTable(false);
                                                    props.onClose(true);
                                                }}
                                            >{loadingDeleteTable ?
                                                <Spinner color={openScoreboardColor}></Spinner>
                                                :
                                                <Text>{i18n.t("yes")}</Text>}


                                            </Button>
                                        </View>
                                        <View flex={1} padding={1}>
                                            <Button
                                                onPress={() => {
                                                    setShowDeleteTable(false);
                                                }}
                                            >
                                                <Text color={openScoreboardButtonTextColor}>{i18n.t("no")}</Text>
                                            </Button>
                                        </View>
                                    </View>
                                </View>
                                :
                                <View padding={1} justifyContent={"space-between"} alignItems={"center"} flexDirection={"row"}>
                                    <Text>{i18n.t("deleteTable")}</Text>
                                    <Button variant={"ghost"} onPress={async () => {
                                        setShowDeleteTable(true);
                                    }}>
                                        <FontAwesome name="trash" size={24} color={openScoreboardColor} />
                                    </Button>
                                </View>}


                        </View>

                        :
                        <LoadingPage></LoadingPage>}


                </Modal.Body>
            </Modal.Content>
        </Modal>
    );
}
