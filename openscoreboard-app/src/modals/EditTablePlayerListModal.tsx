import React, { useEffect, useState } from 'react';
import { Text, Button, View, Input, Spinner, Modal, FormControl, Select } from 'native-base';
import { openScoreboardButtonTextColor, openScoreboardColor } from "../../openscoreboardtheme";
import { getMyPlayerLists } from '../functions/players';
import { setPlayerListToTable } from '../functions/tables';
import i18n from '../translations/translate';
import { CopyInputRightButton } from '../components/CopyButton';
import { subFolderPath } from '../../openscoreboard.config';
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';

function ModalSection({ children, title, subtitle, icon }) {
    return (
        <View
            backgroundColor={"white"}
            borderColor={"gray.200"}
            borderRadius={8}
            borderWidth={1}
            padding={4}
        >
            <View alignItems={"center"} flexDir={"row"} marginBottom={subtitle ? 3 : 2}>
                <View
                    alignItems={"center"}
                    backgroundColor={"gray.100"}
                    borderRadius={999}
                    height={34}
                    justifyContent={"center"}
                    marginRight={3}
                    width={34}
                >
                    {icon}
                </View>
                <View flex={1}>
                    <Text color={"gray.900"} fontSize={"md"} fontWeight={"bold"}>{title}</Text>
                    {subtitle ? (
                        <Text color={"gray.600"} fontSize={"sm"} marginTop={1}>{subtitle}</Text>
                    ) : null}
                </View>
            </View>
            {children}
        </View>
    );
}

export function EditTablePlayerListModal(props) {
    let [doneLoading, setDoneLoading] = useState(false)
    let [myPlayerLists, setMyPlayerLists] = useState([])
    let [selectedPlayerListPassword, setSelectedPlayerListPassword] = useState("")
    let [selectedPlayerListID, setSelectedPlayerListID] = useState("")
    let [loadingPlayerListSave, setLoadingPlayerListSave] = useState(false)

    const playerRegistrationURL = selectedPlayerListID
        ? `${window.location.origin}${subFolderPath}/playerregistration/${selectedPlayerListID}/${selectedPlayerListPassword}`
        : "";

    function setSelectedPlayerList(playerListID, playerLists = myPlayerLists) {
        setSelectedPlayerListID(playerListID || "")
        const selectedPlayerList = playerLists.find((playerList) => playerListID === playerList[1]["id"])
        setSelectedPlayerListPassword(selectedPlayerList?.[1]?.password || "")
    }

    async function loadPlayerLists() {
        setDoneLoading(false)
        let playerLists = await getMyPlayerLists()
        setMyPlayerLists(playerLists)
        setSelectedPlayerList(props.playerListID, playerLists)
        setDoneLoading(true)
    }

    useEffect(() => {
        setSelectedPlayerList(props.playerListID)

    }, [props.playerListID])

    useEffect(() => {
        loadPlayerLists()
    }, [])

    return (
        <Modal isOpen={props.isOpen} onClose={() => {
            props.onClose(false);
        }}>
            <Modal.Content maxW={640} width={"92%"}>
                <Modal.CloseButton />
                <Modal.Header>
                    <View paddingRight={8}>
                        <Text color={"gray.900"} fontSize={"xl"} fontWeight={"bold"}>{i18n.t("editPlayerList")}</Text>
                        <Text color={"gray.600"} fontSize={"sm"} marginTop={1}>{props.tableName}</Text>
                    </View>
                </Modal.Header>
                <Modal.Body backgroundColor={"gray.50"}>
                    {
                        doneLoading ?
                            myPlayerLists.length > 0 ?
                                <View>
                                    <ModalSection
                                        title={i18n.t("selectPlayerList")}
                                        subtitle={"Choose which roster is available for this table."}
                                        icon={<FontAwesome5 name="users" size={15} color={openScoreboardColor} />}
                                    >
                                        <FormControl>
                                            <Select
                                                backgroundColor={"white"}
                                                borderColor={"gray.300"}
                                                onValueChange={(text) => {
                                                    setSelectedPlayerList(text)
                                                }}
                                                selectedValue={selectedPlayerListID}
                                            >
                                                {
                                                    myPlayerLists.map((playerList) => {
                                                        return (
                                                            <Select.Item key={playerList[1].id} label={playerList[1].playerListName} value={playerList[1].id} />
                                                        )
                                                    })
                                                }
                                            </Select>
                                        </FormControl>
                                    </ModalSection>

                                    {selectedPlayerListID ? (
                                        <View marginTop={3}>
                                            <ModalSection
                                                title={i18n.t("selfPlayerRegistration")}
                                                subtitle={"Share this link so players can register themselves."}
                                                icon={<MaterialCommunityIcons name="account-plus-outline" size={18} color={openScoreboardColor} />}
                                            >
                                                <Input
                                                    backgroundColor={"white"}
                                                    borderColor={"gray.300"}
                                                    color={"gray.900"}
                                                    isReadOnly
                                                    InputRightElement={<CopyInputRightButton text={playerRegistrationURL} />}
                                                    value={playerRegistrationURL}
                                                />
                                            </ModalSection>
                                        </View>
                                    ) : null}
                                </View>
                                :
                                <ModalSection
                                    title={i18n.t("noPlayerListsGoAdd")}
                                    subtitle={"Create a player list first, then attach it to this table."}
                                    icon={<FontAwesome5 name="users" size={15} color={openScoreboardColor} />}
                                >
                                    <Text color={"gray.600"} fontSize={"sm"}>No player lists are available yet.</Text>
                                </ModalSection>
                            :
                            <View alignItems={"center"} justifyContent={"center"} padding={6}>
                                <Spinner color={openScoreboardColor} />
                                <Text color={"gray.600"} fontSize={"sm"} marginTop={2}>Loading player lists</Text>
                            </View>
                    }
                </Modal.Body>
                <Modal.Footer backgroundColor={"white"}>
                    <Button
                        backgroundColor={"black"}
                        borderRadius={8}
                        isDisabled={myPlayerLists.length === 0 || !selectedPlayerListID || loadingPlayerListSave}
                        onPress={async () => {
                            setLoadingPlayerListSave(true);
                            await setPlayerListToTable(props.id, selectedPlayerListID, props.myTableID)
                            setLoadingPlayerListSave(false);
                            props.onClose(true);
                        }}
                    >

                        {loadingPlayerListSave ?
                            <Spinner color={openScoreboardButtonTextColor} size={"sm"} /> :
                            <Text color={openScoreboardButtonTextColor} fontWeight={"bold"}>{i18n.t("save")}</Text>}

                    </Button>
                    <Button
                        marginLeft={2}
                        onPress={() => {
                            props.onClose(false);
                        }}
                        variant={"ghost"}
                    >
                        <Text color={"gray.700"} fontWeight={"bold"}>{i18n.t("close")}</Text>
                    </Button>
                </Modal.Footer>

            </Modal.Content>
        </Modal>
    );
}
