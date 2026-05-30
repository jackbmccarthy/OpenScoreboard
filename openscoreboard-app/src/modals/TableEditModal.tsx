import React, { useEffect, useState } from 'react';
import { Button, View, Modal, Text, Spinner, Input } from 'native-base';
import { FontAwesome, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import db from '../../database';
import { openScoreboardButtonTextColor, openScoreboardColor } from "../../openscoreboardtheme";
import { deleteTable, resetTablePassword } from '../functions/tables';
import i18n from '../translations/translate';
import { CopyInputRightButton } from '../components/CopyButton';
import { subFolderPath } from '../../openscoreboard.config';

function ModalSection({ children, icon, subtitle, title, tone = "default" }) {
    const isDanger = tone === "danger";

    return (
        <View
            backgroundColor={"white"}
            borderColor={isDanger ? "red.200" : "gray.200"}
            borderRadius={8}
            borderWidth={1}
            padding={4}
        >
            <View alignItems={"center"} flexDir={"row"} marginBottom={3}>
                <View
                    alignItems={"center"}
                    backgroundColor={isDanger ? "red.50" : "gray.100"}
                    borderRadius={999}
                    height={34}
                    justifyContent={"center"}
                    marginRight={3}
                    width={34}
                >
                    {icon}
                </View>
                <View flex={1}>
                    <Text color={isDanger ? "red.700" : "gray.900"} fontSize={"md"} fontWeight={"bold"}>{title}</Text>
                    {subtitle ? (
                        <Text color={"gray.600"} fontSize={"sm"} marginTop={1}>{subtitle}</Text>
                    ) : null}
                </View>
            </View>
            {children}
        </View>
    );
}

export function TableEditModal(props) {
    let [doneLoading, setDoneLoading] = useState(false);
    let [reload, setReload] = useState(false);
    let [tableName, setTableName] = useState(props.tableName || "");
    let [accessPassword, setAccessPassword] = useState(props.password || "");
    let [showConfirmPasswordReset, setShowConfirmPasswordReset] = useState(false);
    let [showDeleteTable, setShowDeleteTable] = useState(false);
    let [loadingDeleteTable, setLoadingDeleteTable] = useState(false);
    let [savingTableName, setSavingTableName] = useState(false);
    let [resettingPassword, setResettingPassword] = useState(false);
    let [statusMessage, setStatusMessage] = useState("");

    const scoreKeepingURL = `${window.location.origin}${subFolderPath}/scoring/table/${props.id}/${tableName}/${accessPassword}?sportName=${props.sportName}&scoringType=${props.scoringType}`;

    useEffect(() => {
        setDoneLoading(true);
    }, []);

    async function saveTableName() {
        setSavingTableName(true);
        await db.ref("tables/" + props.id + "/tableName").set(tableName);
        setReload(true);
        setStatusMessage("Table name saved.");
        setSavingTableName(false);
    }

    async function resetShareAccess() {
        setResettingPassword(true);
        const newPassword = await resetTablePassword(props.id);
        setAccessPassword(newPassword);
        setReload(true);
        setStatusMessage("Share access reset. Existing scoring links have been replaced.");
        setShowConfirmPasswordReset(false);
        setResettingPassword(false);
    }

    return (
        <Modal isOpen={props.isOpen} onClose={() => {
            props.onClose(reload);
            setReload(false);
        }}>
            <Modal.Content maxW={680} width={"92%"}>
                <Modal.CloseButton />
                <Modal.Header>
                    <View paddingRight={8}>
                        <Text color={"gray.900"} fontSize={"xl"} fontWeight={"bold"}>{i18n.t("editTable")}</Text>
                        <Text color={"gray.600"} fontSize={"sm"} marginTop={1}>{props.tableName}</Text>
                    </View>
                </Modal.Header>
                <Modal.Body backgroundColor={"gray.50"}>
                    {doneLoading ?
                        <View>
                            {statusMessage ? (
                                <View
                                    backgroundColor={"green.50"}
                                    borderColor={"green.200"}
                                    borderRadius={8}
                                    borderWidth={1}
                                    marginBottom={3}
                                    padding={3}
                                >
                                    <Text color={"green.800"} fontSize={"sm"} fontWeight={"semibold"}>{statusMessage}</Text>
                                </View>
                            ) : null}

                            <ModalSection
                                icon={<FontAwesome name="edit" size={16} color={openScoreboardColor} />}
                                title={"Table name"}
                                subtitle={"This is the name shown throughout the app and in share links."}
                            >
                                <View alignItems={"center"} flexDir={"row"}>
                                    <Input
                                        backgroundColor={"white"}
                                        borderColor={"gray.300"}
                                        color={"gray.900"}
                                        flex={1}
                                        value={tableName}
                                        onChangeText={setTableName}
                                    />
                                    <Button
                                        backgroundColor={"black"}
                                        borderRadius={8}
                                        isDisabled={!tableName.trim() || savingTableName}
                                        marginLeft={2}
                                        onPress={saveTableName}
                                    >
                                        {savingTableName ? (
                                            <Spinner color={openScoreboardButtonTextColor} size={"sm"} />
                                        ) : (
                                            <Text color={openScoreboardButtonTextColor} fontWeight={"bold"}>{i18n.t("save")}</Text>
                                        )}
                                    </Button>
                                </View>
                            </ModalSection>

                            <View marginTop={3}>
                                <ModalSection
                                    icon={<MaterialCommunityIcons name="link-variant" size={18} color={openScoreboardColor} />}
                                    title={"Share access"}
                                    subtitle={"Copy the scoring link, or reset access to invalidate older scoring links."}
                                >
                                    <Input
                                        backgroundColor={"white"}
                                        borderColor={"gray.300"}
                                        color={"gray.900"}
                                        isReadOnly
                                        InputRightElement={<CopyInputRightButton text={scoreKeepingURL} />}
                                        value={scoreKeepingURL}
                                    />

                                    {showConfirmPasswordReset ? (
                                        <View
                                            backgroundColor={"amber.50"}
                                            borderColor={"amber.200"}
                                            borderRadius={8}
                                            borderWidth={1}
                                            marginTop={3}
                                            padding={3}
                                        >
                                            <Text color={"amber.900"} fontSize={"sm"} fontWeight={"bold"}>{i18n.t("areYouSure")}</Text>
                                            <Text color={"amber.900"} fontSize={"sm"} marginTop={1}>{i18n.t("accessCutOff")}</Text>
                                            <View flexDir={"row"} marginTop={3}>
                                                <Button
                                                    backgroundColor={"black"}
                                                    borderRadius={8}
                                                    isDisabled={resettingPassword}
                                                    onPress={resetShareAccess}
                                                >
                                                    {resettingPassword ? (
                                                        <Spinner color={openScoreboardButtonTextColor} size={"sm"} />
                                                    ) : (
                                                        <Text color={openScoreboardButtonTextColor} fontWeight={"bold"}>{i18n.t("yesReset")}</Text>
                                                    )}
                                                </Button>
                                                <Button
                                                    marginLeft={2}
                                                    onPress={() => {
                                                        setShowConfirmPasswordReset(false);
                                                    }}
                                                    variant={"ghost"}
                                                >
                                                    <Text color={"gray.700"} fontWeight={"bold"}>{i18n.t("no")}</Text>
                                                </Button>
                                            </View>
                                        </View>
                                    ) : (
                                        <Button
                                            alignSelf={"flex-start"}
                                            marginTop={3}
                                            onPress={() => {
                                                setShowConfirmPasswordReset(true);
                                            }}
                                            variant={"outline"}
                                        >
                                            <Text color={"gray.900"} fontWeight={"bold"}>{i18n.t("resetShareAccess")}</Text>
                                        </Button>
                                    )}
                                </ModalSection>
                            </View>

                            <View marginTop={3}>
                                <ModalSection
                                    icon={<FontAwesome5 name="trash" size={14} color={"#B91C1C"} />}
                                    title={i18n.t("deleteTable")}
                                    subtitle={"Remove this table from your account. Archived data is not shown from this table after deletion."}
                                    tone={"danger"}
                                >
                                    {showDeleteTable ? (
                                        <View
                                            backgroundColor={"red.50"}
                                            borderColor={"red.200"}
                                            borderRadius={8}
                                            borderWidth={1}
                                            padding={3}
                                        >
                                            <Text color={"red.800"} fontSize={"sm"} fontWeight={"bold"}>{i18n.t("deleteTableAreSure")}</Text>
                                            <View flexDir={"row"} marginTop={3}>
                                                <Button
                                                    backgroundColor={"red.700"}
                                                    borderRadius={8}
                                                    isDisabled={loadingDeleteTable}
                                                    onPress={async () => {
                                                        setLoadingDeleteTable(true);
                                                        await deleteTable(props.myTableID);
                                                        setLoadingDeleteTable(false);
                                                        props.onClose(true);
                                                    }}
                                                >
                                                    {loadingDeleteTable ?
                                                        <Spinner color={openScoreboardButtonTextColor} size={"sm"} />
                                                        :
                                                        <Text color={openScoreboardButtonTextColor} fontWeight={"bold"}>{i18n.t("yes")}</Text>}
                                                </Button>
                                                <Button
                                                    marginLeft={2}
                                                    onPress={() => {
                                                        setShowDeleteTable(false);
                                                    }}
                                                    variant={"ghost"}
                                                >
                                                    <Text color={"gray.700"} fontWeight={"bold"}>{i18n.t("no")}</Text>
                                                </Button>
                                            </View>
                                        </View>
                                    ) : (
                                        <Button
                                            alignSelf={"flex-start"}
                                            borderColor={"red.200"}
                                            borderRadius={8}
                                            onPress={async () => {
                                                setShowDeleteTable(true);
                                            }}
                                            variant={"outline"}
                                        >
                                            <Text color={"red.700"} fontWeight={"bold"}>{i18n.t("deleteTable")}</Text>
                                        </Button>
                                    )}
                                </ModalSection>
                            </View>
                        </View>

                        :
                        <View alignItems={"center"} justifyContent={"center"} padding={6}>
                            <Spinner color={openScoreboardColor} />
                            <Text color={"gray.600"} fontSize={"sm"} marginTop={2}>Loading settings</Text>
                        </View>}
                </Modal.Body>
            </Modal.Content>
        </Modal>
    );
}
