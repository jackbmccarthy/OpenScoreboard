import React, { useEffect, useState } from 'react';
import { Button, Text, View, FormControl, Input, Spinner, FlatList } from 'native-base';
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

    function resetPlayerView(){
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
                        <JerseyColorOptions color={jerseyColor} onSelect={(color) => {
                            setJerseyColor(color);
                        }}></JerseyColorOptions>

                        {/* <FormControl.Label>Country</FormControl.Label> */}
                        <View flexDir={"row"}>
                            <View padding={1} flex={1}>
                                <Button
                                    onPress={async () => {
                                        setLoadingSave(true);
                                        await updateCurrentPlayer(props.matchID, props.player, { ...props[props.player], firstName: firstName, lastName: lastName, jerseyColor: jerseyColor, isImported:false });
                                        setLoadingSave(false);
                                        if(typeof props.setShowPlayerSelection === "function"){
                                            props.setShowPlayerSelection(false)
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
                        <JerseyColorOptions color={jerseyColor} onSelect={(color) => {
                            setJerseyColor(color);
                        }}></JerseyColorOptions>
                            <View flex={1} padding={1} flexDirection={"row"}>
                                <View flex={1} padding={1}>
                                    <Button
                                        onPress={async () => {
                                            setLoadingImport(true);
                                            await updateCurrentPlayer(props.matchID, props.player, { ...selectedImportPlayer, isImported: true, jerseyColor:jerseyColor });
                                            setLoadingImport(false);
                                            if(typeof props.updateMatchPlayer === "function"){
                                                props.updateMatchPlayer(props.player, { ...selectedImportPlayer, isImported: true, jerseyColor:jerseyColor })
                                            }
                                            setShowImportPlayerConfirmation(false);
                                            setShowImportSearch(false);
                                            setShowImportedPlayer(false);
                                            
                                            if(props.isWizard){
                                                props.setShowPlayerSelection(false)
                                                resetPlayerView()

                                            }
                                            else{
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
                                <FlatList scr data={importedPlayers.filter((item) => {
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
                                    <View  padding={2} >
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
                            setShowColorPalette(true)
                        }}>
                            <Ionicons name="color-palette" size={24} color={openScoreboardColor} />
                        </Button>
                    </View>
                    <View padding={1} >
                        <Button variant={"ghost"} onPress={() => {
                            setShowImportedPlayer(false);
                        }}>
                            <FontAwesome name='edit' size={24} color={openScoreboardColor} />
                        </Button>
                    </View>
                    </View>
                    {showColorPalette ?
                    <View>
                        <JerseyColorOptions color={jerseyColor} onSelect={(color) => {
                            setJerseyColor(color);
                        }}></JerseyColorOptions>
                        <View flexDirection={"row"} alignItems="center">
                            <View flex={1} padding={1}>
                                <Button 
                                onPress={()=>{
                                    updateCurrentPlayer(props.matchID, props.player, { ...props[props.player], isImported: true, jerseyColor:jerseyColor })
                                    setShowColorPalette(false)
                                }}
                                >
                                    <Text color={openScoreboardButtonTextColor}>{i18n.t("save")}</Text>
                                </Button>
                            </View>
                            <View flex={1} padding={1}>
                                <Button 
                                onPress={()=>{
                                    setShowColorPalette(false)
                                }}
                                variant={"ghost"}>
                                    <Text>{i18n.t("back")}</Text>
                                </Button>
                            </View>
                        </View>
                    </View>
                    : null
                }
                    
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
                            if(props.isTeamMatch) {
                                //Get TeamMates
                                playerList = await getImportTeamMembersList(props.player, props.teamMatchID)
                            }
                            else{
                              let playerListID = await  getPlayerListIDForTable(props.route.params.tableID)
                              if(playerListID.length >0 ){
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
