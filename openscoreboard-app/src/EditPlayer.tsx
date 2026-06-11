import React, { useEffect, useState } from 'react';
import { Button, Text, View, FormControl, Input, Spinner, FlatList, Modal } from 'native-base';
import { openScoreboardButtonTextColor, openScoreboardColor } from "../openscoreboardtheme";
import { updateCurrentPlayer } from './functions/scoring';
import { getImportPlayerList, sortPlayers } from './functions/players';
import JerseyColorOptions from './components/JerseyColorOptions';
import { ImportPlayerItem } from './listitems/ImportPlayerItem';
import { getImportTeamMembersList } from './functions/teammatches';
import { getPlayerListIDForTable } from './functions/tables';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import i18n from './translations/translate';

export function EditPlayer(props) {

    let [showManualInput, setShowManualInput] = useState(false);
    let [showImportSearch, setShowImportSearch] = useState(false);
    let [showImportedPlayer, setShowImportedPlayer] = useState(false);
    let [loadingSave, setLoadingSave] = useState(false);
    let [firstName, setFirstName] = useState("");
    let [lastName, setLastName] = useState("");
    let [jerseyColor, setJerseyColor] = useState("");
    let [enableCountry, setEnableCountry] = useState(false);
    let [country, setCountry] = useState("");

    let [loadingImportedPlayers, setLoadingImportedPlayers] = useState(false);
    let [importedPlayers, setImportedPlayers] = useState([]);

    let [showColorPalette, setShowColorPalette] = useState(false)

    let [importedPlayerSearchText, setImportedPlayerSearchText] = useState("");
    let [showImportPlayerConfirmation, setShowImportPlayerConfirmation] = useState(false);
    let [selectedImportPlayer, setSelectedImportPlayer] = useState({});
    let [loadingImport, setLoadingImport] = useState(false);

    const selectImportPlayer = (player) => {
        setSelectedImportPlayer(player);
        setShowImportPlayerConfirmation(true);
    };

    const hasJerseyColor = typeof jerseyColor === "string" && jerseyColor.trim().length > 0;

    function resetJerseyColorToCurrentPlayer() {
        const currentPlayer = props[props.player];
        setJerseyColor(currentPlayer?.jerseyColor || "");
    }

    function renderJerseyColorSummary() {
        return (
            <View
                alignItems={"center"}
                backgroundColor={"gray.50"}
                borderColor={"gray.200"}
                borderRadius={8}
                borderWidth={1}
                flexDirection={"row"}
                marginBottom={2}
                padding={2}
            >
                <View
                    alignItems={"center"}
                    backgroundColor={hasJerseyColor ? jerseyColor : "white"}
                    borderColor={hasJerseyColor ? "gray.300" : "gray.200"}
                    borderRadius={999}
                    borderStyle={hasJerseyColor ? "solid" : "dashed"}
                    borderWidth={1}
                    height={34}
                    justifyContent={"center"}
                    marginRight={3}
                    width={34}
                >
                    <Ionicons name={hasJerseyColor ? "shirt" : "shirt-outline"} size={17} color={hasJerseyColor ? "white" : "gray"} />
                </View>
                <View flex={1}>
                    <Text color={"gray.500"} fontSize={"2xs"} fontWeight={"bold"} textTransform={"uppercase"}>
                        {i18n.t("jerseyColor")}
                    </Text>
                    <Text color={"gray.900"} fontSize={"sm"} fontWeight={"bold"} numberOfLines={1}>
                        {hasJerseyColor ? "Color selected" : "No jersey color"}
                    </Text>
                </View>
                <Button
                    borderColor={"blue.200"}
                    borderRadius={8}
                    minHeight={34}
                    onPress={() => setShowColorPalette(true)}
                    paddingX={3}
                    variant={"outline"}
                >
                    <Text color={openScoreboardColor} fontSize={"xs"} fontWeight={"bold"}>
                        Change
                    </Text>
                </Button>
            </View>
        );
    }

    function renderJerseyColorPicker({ showSaveActions = false } = {}) {
        function closeColorPicker() {
            if (showSaveActions) {
                resetJerseyColorToCurrentPlayer();
            }
            setShowColorPalette(false);
        }

        return (
            <Modal isOpen={showColorPalette} onClose={closeColorPicker}>
                <Modal.Content maxWidth={420} width={"92%"}>
                    <Modal.CloseButton />
                    <Modal.Header>{i18n.t("jerseyColor")}</Modal.Header>
                    <Modal.Body>
                        <JerseyColorOptions color={jerseyColor} onSelect={(color) => {
                            setJerseyColor(color);
                        }} />
                    </Modal.Body>
                    <Modal.Footer>
                        <Button
                            marginRight={2}
                            onPress={() => {
                                setJerseyColor("");
                            }}
                            variant={"ghost"}
                        >
                            <Text color={"gray.700"} fontWeight={"bold"}>
                                Clear
                            </Text>
                        </Button>
                        {showSaveActions ? (
                            <>
                                <Button
                                    marginRight={2}
                                    onPress={closeColorPicker}
                                    variant={"ghost"}
                                >
                                    <Text color={"gray.700"} fontWeight={"bold"}>
                                        {i18n.t("back")}
                                    </Text>
                                </Button>
                                <Button
                                    backgroundColor={openScoreboardColor}
                                    borderRadius={8}
                                    onPress={async () => {
                                        setLoadingSave(true);
                                        await updateCurrentPlayer(props.matchID, props.player, { ...props[props.player], isImported: true, jerseyColor: jerseyColor });
                                        setLoadingSave(false);
                                        setShowColorPalette(false);
                                        if (typeof props.updateMatchPlayer === "function") {
                                            props.updateMatchPlayer(props.player, { ...props[props.player], isImported: true, jerseyColor: jerseyColor });
                                        }
                                    }}
                                >
                                    {loadingSave ?
                                        <Spinner color={openScoreboardButtonTextColor}></Spinner>
                                        :
                                        <Text color={openScoreboardButtonTextColor}>{i18n.t("save")}</Text>}
                                </Button>
                            </>
                        ) : (
                            <Button
                                backgroundColor={openScoreboardColor}
                                borderRadius={8}
                                onPress={() => setShowColorPalette(false)}
                            >
                                <Text color={openScoreboardButtonTextColor} fontWeight={"bold"}>
                                    Done
                                </Text>
                            </Button>
                        )}
                    </Modal.Footer>
                </Modal.Content>
            </Modal>
        );
    }

    function resetPlayerView() {
        setJerseyColor("")
        setShowColorPalette(false)
        setShowImportPlayerConfirmation(false)
        setShowImportedPlayer(false)
        setShowManualInput(false)
    }

    useEffect(() => {


        let player = props[props.player];
        if (player) {
            if (player.isImported) {
                setShowImportedPlayer(true);
            }
            if (player.firstName?.length > 0 || player.lastName?.length > 0) {
                setFirstName(player.firstName);
                setLastName(player.lastName);
                setJerseyColor(player.jerseyColor);
                setCountry(player.country);
                if (!player.isImported) {
                    setShowManualInput(true);
                }
            }
            else {
                setShowImportedPlayer(false)
                setShowManualInput(false)
                setFirstName("");
                setLastName("");
                setJerseyColor("");
                setCountry("");
            }

        }
        else {
            setShowImportedPlayer(false)
            setShowManualInput(false)
            setFirstName("");
            setLastName("");
            setJerseyColor("");
            setCountry("");
        }
    }, [props.player]);

    if (showManualInput || showImportSearch) {
        return (
            <>
                {showManualInput ?
                    <FormControl>
                        <FormControl.Label>{i18n.t("firstName")}</FormControl.Label>
                        <Input defaultValue={firstName} onChangeText={setFirstName}></Input>
                        <FormControl.Label>{i18n.t("lastName")}</FormControl.Label>
                        <Input defaultValue={lastName} onChangeText={setLastName}></Input>
                        <FormControl.Label>{i18n.t("jerseyColor")}</FormControl.Label>
                        {renderJerseyColorSummary()}
                        {renderJerseyColorPicker()}

                        {/* <FormControl.Label>Country</FormControl.Label> */}
                        <View flexDir={"row"}>
                            <View padding={1} flex={1}>
                                <Button
                                    onPress={async () => {
                                        setLoadingSave(true);
                                        console.log(props.matchID, props.player, { ...props[props.player], firstName: firstName, lastName: lastName, jerseyColor: jerseyColor, isImported: false })
                                        await updateCurrentPlayer(props.matchID, props.player, { ...props[props.player], firstName: firstName, lastName: lastName, jerseyColor: jerseyColor, isImported: false });
                                        setLoadingSave(false);
                                        if (typeof props.updateMatchPlayer === "function") {
                                            props.updateMatchPlayer(props.player, { ...props[props.player], firstName: firstName, lastName: lastName, jerseyColor: jerseyColor, isImported: false })
                                        }
                                        if (typeof props.setShowPlayerSelection === "function") {
                                            props.setShowPlayerSelection(false)
                                        }
                                        if (typeof props.setEditPlayer === "function") {
                                            props.setEditPlayer("")
                                        }
                                        if (!props.isWizard && typeof props.onClose === "function") {
                                            props.onClose();
                                        }


                                    }}
                                >
                                    {loadingSave ?
                                        <Spinner color={openScoreboardButtonTextColor}></Spinner>
                                        :
                                        <Text color={openScoreboardButtonTextColor}>{i18n.t("save")}</Text>}

                                </Button>
                            </View>
                            <View padding={1} flex={1}>
                                <Button variant={"outline"}
                                    onPress={async () => {
                                        setShowManualInput(false);
                                    }}
                                >

                                    <Text color={openScoreboardColor}>{i18n.t("back")}</Text>


                                </Button>
                            </View>
                        </View>

                    </FormControl>
                    :
                    null}



                {showImportSearch ?

                    showImportPlayerConfirmation ?
                        <View>
                            <Text fontSize={"xl"} fontWeight="bold" textAlign={"center"}>
                                {i18n.t("importPlayerQuestion")}
                            </Text>
                            <ImportPlayerItem  {...selectedImportPlayer}></ImportPlayerItem>
                            <FormControl.Label>{i18n.t("jerseyColor")}</FormControl.Label>
                            {renderJerseyColorSummary()}
                            {renderJerseyColorPicker()}
                            <View flex={1} padding={1} flexDirection={"row"}>
                                <View flex={1} padding={1}>
                                    <Button
                                        onPress={async () => {
                                            setLoadingImport(true);
                                            await updateCurrentPlayer(props.matchID, props.player, { ...selectedImportPlayer, isImported: true, jerseyColor: jerseyColor });
                                            setLoadingImport(false);
                                            if (typeof props.updateMatchPlayer === "function") {
                                                props.updateMatchPlayer(props.player, { ...selectedImportPlayer, isImported: true, jerseyColor: jerseyColor })
                                            }
                                            setShowImportPlayerConfirmation(false);
                                            setShowImportSearch(false);
                                            setShowImportedPlayer(false);

                                            if (props.isWizard) {
                                                props.setShowPlayerSelection(false)
                                                resetPlayerView()

                                            }
                                            else {
                                                props.onClose();
                                            }

                                        }}
                                    >
                                        {loadingImport ?
                                            <Spinner color={openScoreboardButtonTextColor}></Spinner>
                                            :
                                            <Text color={openScoreboardButtonTextColor}>{i18n.t("import")}</Text>}

                                    </Button>
                                </View>
                                <View flex={1} padding={1}>
                                    <Button
                                        onPress={() => {
                                            setShowImportPlayerConfirmation(false);
                                        }}
                                        variant={"ghost"}>
                                        <Text>{i18n.t("back")}</Text>
                                    </Button>
                                </View>
                            </View>
                        </View>
                        :
                        <>

                            {
                                importedPlayers.length > 0 ?
                                    <>
                                        <View>
                                            <FormControl>
                                                <FormControl.Label>{i18n.t("searchPlayerName")}:</FormControl.Label>
                                                <View padding={1}>
                                                    <Input placeholder={i18n.t("searchPlayerName")} onChangeText={(text) => {
                                                        setImportedPlayerSearchText(text);
                                                    }}></Input>
                                                </View>


                                                <FormControl.Label>{i18n.t("selectPlayerFromList")}:</FormControl.Label>

                                            </FormControl>

                                        </View>
                                        <View >
                                            <FlatList data={importedPlayers.filter((item) => {
                                                if (item[1].firstName.toLowerCase().includes(importedPlayerSearchText.toLowerCase()) || item[1].lastName.toLowerCase().includes(importedPlayerSearchText.toLowerCase())) {
                                                    return true;
                                                }
                                            })}
                                                renderItem={(item) => {
                                                    return (
                                                        <ImportPlayerItem selectImportPlayer={selectImportPlayer} id={item.item[0]} {...item.item[1]} />
                                                    );
                                                }}
                                            ></FlatList>
                                        </View>
                                    </>
                                    :
                                    <View padding={2} >
                                        <Text textAlign={"center"} fontSize={"md"} fontWeight="bold">{i18n.t("noImportablePlayers")}</Text>
                                    </View>

                            }


                        </>


                    :
                    null}





            </>
        );
    }
    else {
        if (showImportedPlayer) {
            return (
                <View padding={1}>
                    <View flexDirection={"row"} alignItems="center">
                        <View flex={1}>
                            <ImportPlayerItem  {...props[props.player]}></ImportPlayerItem>
                        </View>
                        <View padding={1} >
                            <Button variant={"ghost"} onPress={() => {
                                setShowImportedPlayer(false);
                            }}>
                                <FontAwesome name='edit' size={24} color={openScoreboardColor} />
                            </Button>
                        </View>
                    </View>
                    {renderJerseyColorSummary()}
                    {renderJerseyColorPicker({ showSaveActions: true })}

                </View>
            );
        }
        else {
            return (<>
                <View padding={1}>
                    <Button
                        onPress={() => {
                            setShowManualInput(true);
                        }}
                    >
                        <Text color={openScoreboardButtonTextColor}>{i18n.t("enterManually")}</Text>
                    </Button>
                </View>
                <Text textAlign={"center"} fontSize={"4xl"}>{i18n.t("or")}</Text>
                <View padding={1}>
                    <Button
                        onPress={async () => {
                            setLoadingImportedPlayers(true);
                            let playerList = []
                            if (props.isTeamMatch) {
                                //Get TeamMates
                                playerList = await getImportTeamMembersList(props.player, props.teamMatchID)
                            }
                            else {
                                let playerListID = await getPlayerListIDForTable(props.route.params.tableID)
                                if (playerListID.length > 0) {
                                    playerList = await getImportPlayerList(playerListID);
                                }


                            }

                            setImportedPlayers(sortPlayers(playerList));
                            setShowImportSearch(true);
                            setLoadingImportedPlayers(false);


                        }}
                    >
                        {loadingImportedPlayers ?
                            <Spinner color={openScoreboardButtonTextColor}></Spinner> :
                            <Text color={openScoreboardButtonTextColor}>{i18n.t("importPlayer")}</Text>}
                    </Button>
                </View>

            </>);
        }

    }





}
