import React, { useEffect, useState } from 'react';
import { Image } from 'react-native';
import { Button, FormControl, Input, NativeBaseProvider, ScrollView, Spinner, Text, View } from 'native-base';
import { openScoreboardButtonTextColor, openScoreboardColor, openScoreboardTheme } from "../openscoreboardtheme";
import JerseyColorOptions from './components/JerseyColorOptions';
import CountrySelect from './components/CountrySelect';
import { SuccessfulRegistrationModal } from './modals/SuccessfulRegistrationModal';
import { newImportedPlayer } from './classes/Player';
import { addImportedPlayer, getPlayerListDetails, watchForPlayerListPasswordChange } from './functions/players';
import Unauthorized from './Unauthorized';
import i18n from './translations/translate';
import { normalizePlayerRegistrationFields } from './registrationFields';

const openScoreboardLogo = require("../assets/favicon.png");

export default function PlayerRegistration({ route }) {
    const playerListID = route.params.playerListID;
    const password = route.params.password;

    const [selectedColor, setSelectedColor] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [country, setCountry] = useState("");
    const [imageURL, setImageURL] = useState("");
    const [unauthorized, setUnAuthorized] = useState(false);
    const [playerListExists, setPlayerListExists] = useState(false);
    const [doneLoading, setDoneLoading] = useState(false);
    const [loadingPlayer, setLoadingPlayer] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [playerListName, setPlayerListName] = useState("");
    const [description, setDescription] = useState("");
    const [registrationFields, setRegistrationFields] = useState(normalizePlayerRegistrationFields());

    useEffect(() => {
        let unSub = watchForPlayerListPasswordChange(playerListID, (currentPassword) => {
            if (typeof currentPassword === "string" && currentPassword !== password) {
                setUnAuthorized(true);
            }
        });

        return unSub;
    }, [password, playerListID]);

    useEffect(() => {
        let isActive = true;

        async function loadPlayerList() {
            setDoneLoading(false);
            const playerList = await getPlayerListDetails(playerListID);

            if (!isActive) {
                return;
            }

            const listExists = Object.keys(playerList || {}).length > 0;
            setPlayerListExists(listExists);
            setPlayerListName(playerList.playerListName || "");
            setDescription(playerList.description || "");
            setRegistrationFields(normalizePlayerRegistrationFields(playerList.registrationFields));
            setDoneLoading(true);
        }

        loadPlayerList();

        return () => {
            isActive = false;
        };
    }, [playerListID]);

    const resetPlayerFields = () => {
        setSelectedColor("");
        setFirstName("");
        setLastName("");
        setCountry("");
        setImageURL("");
    };

    const registerPlayer = async () => {
        setLoadingPlayer(true);

        if (playerListExists) {
            await addImportedPlayer(playerListID, newImportedPlayer(
                firstName.trim(),
                registrationFields.lastName ? lastName.trim() : "",
                registrationFields.imageURL ? imageURL.trim() : "",
                registrationFields.country ? country : "",
                registrationFields.jerseyColor ? selectedColor : "",
            ));
            setShowSuccess(true);
        }

        setLoadingPlayer(false);
    };

    const canRegister = playerListExists && firstName.trim().length > 0 && !loadingPlayer;

    if (unauthorized) {
        return <Unauthorized />;
    }

    if (!doneLoading) {
        return (
            <NativeBaseProvider theme={openScoreboardTheme}>
                <View alignItems={"center"} backgroundColor={"gray.50"} height={"100%"} justifyContent={"center"}>
                    <Spinner color={openScoreboardColor} />
                </View>
            </NativeBaseProvider>
        );
    }

    return (
        <NativeBaseProvider theme={openScoreboardTheme}>
            <ScrollView backgroundColor={"gray.50"}>
                <View alignItems={"center"} minHeight={"100%"} padding={4} width={"100%"}>
                    <View maxWidth={680} paddingY={8} width={"100%"}>
                        <View alignItems={"center"} marginBottom={5}>
                            <Image
                                resizeMode="contain"
                                source={openScoreboardLogo}
                                style={{
                                    borderRadius: 18,
                                    height: 78,
                                    width: 78,
                                }}
                            />
                            <Text color={"gray.900"} fontSize={"2xl"} fontWeight={"bold"} marginTop={3}>
                                Open Scoreboard
                            </Text>
                            <Text color={"gray.600"} fontSize={"sm"} marginTop={1} textAlign={"center"}>
                                Player registration
                            </Text>
                        </View>

                        <View
                            backgroundColor={"white"}
                            borderColor={"gray.200"}
                            borderRadius={8}
                            borderWidth={1}
                            overflow={"hidden"}
                        >
                            <View backgroundColor={"#111827"} padding={5}>
                                <Text color={"white"} fontSize={"3xl"} fontWeight={"bold"}>
                                    Join {playerListName || "this player list"}
                                </Text>
                                <Text color={"gray.200"} fontSize={"md"} marginTop={2}>
                                    Register your details so the event organizer can add you to matches and scoreboards.
                                </Text>
                            </View>

                            <View padding={5}>
                                {playerListExists ? (
                                    <>
                                        <View
                                            backgroundColor={"blue.50"}
                                            borderColor={"blue.100"}
                                            borderRadius={8}
                                            borderWidth={1}
                                            marginBottom={5}
                                            padding={4}
                                        >
                                            <Text color={"gray.900"} fontSize={"lg"} fontWeight={"bold"}>
                                                {playerListName || "Player List"}
                                            </Text>
                                            <Text color={"gray.700"} fontSize={"sm"} marginTop={1}>
                                                {description || "Enter the requested player information below. Only the fields enabled by the organizer are shown."}
                                            </Text>
                                        </View>

                                        <FormControl isRequired>
                                            <FormControl.Label>{i18n.t("firstName")}</FormControl.Label>
                                            <Input
                                                placeholder="First name"
                                                type="text"
                                                value={firstName}
                                                onChangeText={setFirstName}
                                            />
                                        </FormControl>

                                        {registrationFields.lastName ? (
                                            <FormControl marginTop={3}>
                                                <FormControl.Label>{i18n.t("lastName")}</FormControl.Label>
                                                <Input
                                                    placeholder="Last name"
                                                    type="text"
                                                    value={lastName}
                                                    onChangeText={setLastName}
                                                />
                                            </FormControl>
                                        ) : null}

                                        {registrationFields.country ? (
                                            <FormControl marginTop={3}>
                                                <FormControl.Label>{i18n.t("country")}</FormControl.Label>
                                                <CountrySelect value={country} onChange={setCountry} />
                                            </FormControl>
                                        ) : null}

                                        {registrationFields.jerseyColor ? (
                                            <FormControl marginTop={3}>
                                                <FormControl.Label>{i18n.t("jerseyColor")}</FormControl.Label>
                                                <JerseyColorOptions color={selectedColor} onSelect={setSelectedColor} />
                                            </FormControl>
                                        ) : null}

                                        {registrationFields.imageURL ? (
                                            <FormControl marginTop={3}>
                                                <FormControl.Label>{i18n.t("imageURL")}</FormControl.Label>
                                                <Input
                                                    placeholder="Image URL"
                                                    type="text"
                                                    value={imageURL}
                                                    onChangeText={setImageURL}
                                                />
                                            </FormControl>
                                        ) : null}

                                        <Button
                                            backgroundColor={openScoreboardColor}
                                            borderRadius={8}
                                            isDisabled={!canRegister}
                                            marginTop={5}
                                            onPress={registerPlayer}
                                        >
                                            {loadingPlayer ? (
                                                <Spinner color={openScoreboardButtonTextColor} />
                                            ) : (
                                                <Text color={openScoreboardButtonTextColor} fontWeight={"bold"}>
                                                    {i18n.t("register")}
                                                </Text>
                                            )}
                                        </Button>
                                    </>
                                ) : (
                                    <View alignItems={"center"} padding={5}>
                                        <Text color={"gray.900"} fontSize={"xl"} fontWeight={"bold"} textAlign={"center"}>
                                            Registration list unavailable
                                        </Text>
                                        <Text color={"gray.600"} marginTop={2} textAlign={"center"}>
                                            This registration link is not connected to an active player list.
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>

                    {showSuccess ? (
                        <SuccessfulRegistrationModal
                            isOpen={showSuccess}
                            onClose={() => {
                                setShowSuccess(false);
                                resetPlayerFields();
                            }}
                        />
                    ) : null}
                </View>
            </ScrollView>
        </NativeBaseProvider>
    );
}
