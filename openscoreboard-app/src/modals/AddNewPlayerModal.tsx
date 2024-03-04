import React, { useEffect, useRef, useState } from 'react';
import { Button, Text, View, Input, Modal, FormControl, ChevronLeftIcon, TextField } from 'native-base';
import { openScoreboardButtonTextColor, openScoreboardColor } from "../../openscoreboardtheme";
import { addImportedPlayer, editImportedPlayer } from '../functions/players';
import { newImportedPlayer } from '../classes/Player';
import CountryFlagList from '../components/CountryFlagList';
import jsonFlags from '../flags/countries.json'



function validateCSV(csvString: string) {
    const rows = csvString.split('\n');

    for (let i = 0; i < rows.length; i++) {
        const columns = rows[i].split(',');

        // Check if the CSV row has the correct number of columns
        if (columns.length !== 4) {
            return `Error: Row ${i + 1} does not have exactly 4 columns.`;
        }

        // Check if the first and second columns have length less than 60
        if (columns[0].length > 60 || columns[1].length > 60) {
            return `Error: Row ${i + 1}, Column 1 or Column 2 has length greater than 60.`;
        }

        // Check if the third column is either blank or a valid image URL
        if (columns[2] !== '' && !isValidImageUrl(columns[2])) {
            return `Error: Row ${i + 1}, Column 3 should be either blank or a valid image URL.`;
        }

        // Check if the fourth column has a valid value from a predefined array
        const validValues = Object.keys(jsonFlags); // Define your array of valid values
        if (!validValues.includes(columns[3].toUpperCase())) {
            return `Error: Row ${i + 1}, Column 4 does not have a valid value.`;
        }
    }

    return true; // If all checks pass, return true
}

function isValidImageUrl(url: string) {
    const urlRegex = /^(ftp|http|https):\/\/[^ "]+$/;
    return url === '' || url.match(urlRegex);
}

export function AddNewPlayerModal(props) {



    let [firstName, setFirstName] = useState("");
    let [lastName, setLastName] = useState("");
    let [imageURL, setImageURL] = useState("");
    let [country, setCountry] = useState("");
    let [allCountries, setAllCountries] = useState({});
    let [isBulkAdd, setIsBulkAdd] = useState(false)

    let [showCountrySelection, setShowCountrySelection] = useState(false);

    let [csvValue, setCSVValue] = useState("")
    let [doneLoading, setDoneLoading] = useState(false)
    let [myPlayerLists, setMyPlayerLists] = useState([])
    let [selectedPlayerListID, setSelectedPlayerListID] = useState("")
    let [loadingPlayers, setLoadingPlayers] = useState(false)
    let [csvError, setCSVError] = useState("")

    const onAddPressed = async () => {
        if (props.isEditing) {
            let player = newImportedPlayer(firstName, lastName, imageURL, country);
            await editImportedPlayer(props.route.params.playerListID, props.id, player);
            props.onClose();
            props.onConfirmEdit(
                {
                    ...player,
                    id: props.id
                }
            );
            resetPlayerFields();
        }
        else {
            if (isBulkAdd) {
                let submissionBulk = await onBulkSubmit()
                if (submissionBulk === true) {
                    props.onClose();
                    resetPlayerFields();
                }
            }
            else {
                let newPlayer = newImportedPlayer(firstName, lastName, imageURL, country);
                let playerID = await addImportedPlayer(props.route.params.playerListID, newPlayer);
                props.onConfirmAdd({
                    ...newPlayer,
                    id: playerID
                });
                props.onClose();
                resetPlayerFields();
            }
        }
    }
    async function onBulkSubmit() {
        const csvValidation = validateCSV(csvValue)

        if (csvValidation === true) {
            let splitCSV = csvValue.split("\n")
            let playerList = splitCSV.map((player) => {
                let playerSplit = player.split(",")
                return newImportedPlayer(playerSplit[0], playerSplit[1], playerSplit[2], playerSplit[3])
            })
            playerList.forEach(async (newPlayer) => {
                let playerID = await addImportedPlayer(props.route.params.playerListID, newPlayer);
            })
        }
        else {
            setCSVError(csvValidation)
            return csvValidation
        }
        return true
    }

    let playerFirstName = useRef()

    function canSubmit() {
        if (isBulkAdd) {
            return true
        }
        else {
            if (firstName && firstName.length > 0) {
                return true;
            }
            else {
                return false;
            }
        }

    }

    useEffect(() => {
        async function getCountryNames() {
            let flagList = jsonFlags;
            setAllCountries(flagList);
        }
        getCountryNames();

    }, []);

    const resetPlayerFields = () => {
        setFirstName("");
        setLastName("");
        setImageURL("");
        setCountry("");
        setCSVValue("")
    };

    useEffect(() => {
        setTimeout(() => {
            document.getElementById(playerFirstName.current.id).focus()
        }, 200);

    }, [])

    useEffect(() => {
        setFirstName(props.firstName || "");
        setLastName(props.lastName || "");
        setImageURL(props.imageURL || "");
        setCountry(props.country || "");
    }, [props.firstName, props.lastName, props.imageURL, props.country]);

    return (
        <Modal isOpen={props.isOpen}
            onClose={() => {
                props.onClose();
            }}
        >
            <Modal.Content>
                <Modal.CloseButton></Modal.CloseButton>
                <Modal.Header>{props.isEditing ? "Edit Player" : "Add New Player"}</Modal.Header>
                <Modal.Body>
                    <FormControl>
                        {
                            props.isEditing ?
                                null
                                :
                                <View flexDir={"row"}>
                                    <View padding={1} flex={1}>
                                        <Button
                                            onPress={() => {
                                                setIsBulkAdd(false)
                                            }}
                                            variant={isBulkAdd ? 'outline' : "solid"}
                                        >
                                            <Text
                                                color={isBulkAdd ? openScoreboardColor : openScoreboardButtonTextColor}
                                            >Single</Text>
                                        </Button>
                                    </View>
                                    <View padding={1} flex={1}>
                                        <Button
                                            onPress={() => {
                                                setIsBulkAdd(true)
                                            }}

                                            variant={!isBulkAdd ? 'outline' : "solid"}>
                                            <Text color={!isBulkAdd ? openScoreboardColor : openScoreboardButtonTextColor}>Bulk</Text>
                                        </Button>
                                    </View>


                                </View>
                        }



                        {showCountrySelection ?
                            <>
                                <View>
                                    <Button padding={1} justifyContent={"flex-start"} variant={"ghost"} onPress={() => {
                                        setShowCountrySelection(false);
                                    }}>
                                        <View alignItems={"center"} flexDirection={"row"}>
                                            <ChevronLeftIcon></ChevronLeftIcon>
                                            <Text>Back</Text>
                                        </View>

                                    </Button>
                                </View>
                                <CountryFlagList onSelection={(countryCode) => {
                                    setCountry(countryCode);
                                    setShowCountrySelection(false);
                                }}></CountryFlagList>
                            </>


                            :
                            <>
                                {isBulkAdd ?
                                    <>
                                        <FormControl isInvalid={csvError.length > 0}>
                                            <FormControl.Label>First Name, Last Name, Image URL, Country Code</FormControl.Label>

                                            <FormControl.ErrorMessage>{csvError}</FormControl.ErrorMessage>

                                            <TextField
                                                multiline
                                                placeholder="Paste CSV Values"
                                                onChangeText={(text) => {
                                                    setCSVValue(text)
                                                }}
                                            ></TextField>
                                        </FormControl>


                                    </>
                                    : <>
                                        <FormControl.Label>
                                            First Name
                                        </FormControl.Label>
                                        <Input ref={playerFirstName} value={firstName}
                                            onChangeText={(text) => {
                                                setFirstName(text);
                                            }}
                                        ></Input>

                                        <FormControl.Label>
                                            Last Name
                                        </FormControl.Label>
                                        <Input value={lastName}
                                            onChangeText={(text) => {
                                                setLastName(text);
                                            }}
                                        ></Input>

                                        <FormControl.Label>
                                            Image URL
                                        </FormControl.Label>
                                        <Input value={imageURL}
                                            onChangeText={(text) => {
                                                setImageURL(text);
                                            }}
                                        ></Input>
                                        <FormControl.Label>
                                            Country
                                        </FormControl.Label>
                                        <Button onPress={() => {
                                            setShowCountrySelection(true);
                                        }}>
                                            <Text color={openScoreboardButtonTextColor}>{country.length > 0 ? allCountries[country.toUpperCase()] : "Select Country"}</Text>
                                        </Button>
                                    </>
                                }

                            </>}

                    </FormControl>
                </Modal.Body>
                <Modal.Footer>
                    <View>
                        <Button disabled={!canSubmit()}
                            onPress={onAddPressed}

                        >
                            <Text color={openScoreboardButtonTextColor}>{props.isEditing ? "Update" : "Add"}</Text>
                        </Button>
                    </View>
                    <View>
                        <Button variant={"ghost"}
                            onPress={() => {
                                props.onClose();
                            }}
                        >
                            <Text>Close</Text>
                        </Button>
                    </View>
                </Modal.Footer>
            </Modal.Content>
        </Modal>
    );
}
