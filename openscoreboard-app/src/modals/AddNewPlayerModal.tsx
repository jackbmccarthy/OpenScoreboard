import React, { useEffect, useRef, useState } from 'react';
import { Button, Text, View, Input, Modal, FormControl, TextField } from 'native-base';
import { openScoreboardButtonTextColor, openScoreboardColor } from "../../openscoreboardtheme";
import { addImportedPlayer, editImportedPlayer } from '../functions/players';
import { newImportedPlayer } from '../classes/Player';
import CountrySelect from '../components/CountrySelect';
import jsonFlags from '../flags/countries.json'
import i18n from '../translations/translate';



function validateCSV(csvString: string) {
    const rows = csvString.split('\n');

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i].trim();
        if (!row) {
            continue;
        }

        const columns = row.split(',');
        const firstColumn = `${columns[0] || ""}`.trim().toLowerCase().replace(/\s+/g, "");
        if (i === 0 && firstColumn === "firstname") {
            continue;
        }

        // Check if the CSV row has the correct number of columns
        if (![4, 8].includes(columns.length)) {
            return `Error: Row ${i + 1} must have either 4 columns or 8 columns.`;
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
        if (columns[3] && !validValues.includes(columns[3].toUpperCase())) {
            return `Error: Row ${i + 1}, Column 4 does not have a valid value.`;
        }
    }

    return true; // If all checks pass, return true
}

function normalizeGender(value = "") {
    return `${value || ""}`.trim().slice(0, 1).toUpperCase();
}

function normalizeNumberField(value) {
    const parsedValue = parseInt(`${value || ""}`, 10);
    return Number.isNaN(parsedValue) ? "" : parsedValue;
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
    let [gender, setGender] = useState("");
    let [rating, setRating] = useState("");
    let [ranking, setRanking] = useState("");
    let [isBulkAdd, setIsBulkAdd] = useState(false)

    let [csvValue, setCSVValue] = useState("")
    let [doneLoading, setDoneLoading] = useState(false)
    let [myPlayerLists, setMyPlayerLists] = useState([])
    let [selectedPlayerListID, setSelectedPlayerListID] = useState("")
    let [loadingPlayers, setLoadingPlayers] = useState(false)
    let [csvError, setCSVError] = useState("")

    const onAddPressed = async () => {
        if (props.isEditing) {
            let player = newImportedPlayer(firstName, lastName, imageURL, country, props.jerseyColor || "", gender, normalizeNumberField(rating), normalizeNumberField(ranking));
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
                let newPlayer = newImportedPlayer(firstName, lastName, imageURL, country, "", gender, normalizeNumberField(rating), normalizeNumberField(ranking));
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
                .map((row) => row.trim())
                .filter(Boolean)
                .filter((row, index) => !(index === 0 && row.split(",")[0]?.trim().toLowerCase().replace(/\s+/g, "") === "firstname"));
            let playerList = splitCSV.map((player) => {
                let playerSplit = player.split(",")
                return newImportedPlayer(
                    playerSplit[0],
                    playerSplit[1],
                    playerSplit[2],
                    playerSplit[3],
                    playerSplit[4] || "",
                    normalizeGender(playerSplit[5]),
                    normalizeNumberField(playerSplit[6]),
                    normalizeNumberField(playerSplit[7])
                )
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

    const resetPlayerFields = () => {
        setFirstName("");
        setLastName("");
        setImageURL("");
        setCountry("");
        setGender("");
        setRating("");
        setRanking("");
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
        setGender(props.gender || "");
        setRating(`${props.rating || ""}`);
        setRanking(`${props.ranking || ""}`);
    }, [props.firstName, props.lastName, props.imageURL, props.country, props.gender, props.rating, props.ranking]);

    return (
        <Modal isOpen={props.isOpen}
            onClose={() => {
                props.onClose();
            }}
        >
            <Modal.Content>
                <Modal.CloseButton></Modal.CloseButton>
                <Modal.Header>{props.isEditing ? i18n.t("editPlayer") : i18n.t("addNewPlayer")}</Modal.Header>
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
                                            >{i18n.t("single")}</Text>
                                        </Button>
                                    </View>
                                    <View padding={1} flex={1}>
                                        <Button
                                            onPress={() => {
                                                setIsBulkAdd(true)
                                            }}

                                            variant={!isBulkAdd ? 'outline' : "solid"}>
                                            <Text color={!isBulkAdd ? openScoreboardColor : openScoreboardButtonTextColor}>{i18n.t("bulk")}</Text>
                                        </Button>
                                    </View>


                                </View>
                        }



                        {isBulkAdd ?
                            <>
                                <FormControl isInvalid={csvError.length > 0}>
                                    <FormControl.Label>{i18n.t("csvOrder")}</FormControl.Label>

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
                                    {i18n.t("firstName")}
                                </FormControl.Label>
                                <Input ref={playerFirstName} value={firstName}
                                    onChangeText={(text) => {
                                        setFirstName(text);
                                    }}
                                ></Input>

                                <FormControl.Label>
                                    {i18n.t("lastName")}
                                </FormControl.Label>
                                <Input value={lastName}
                                    onChangeText={(text) => {
                                        setLastName(text);
                                    }}
                                ></Input>

                                <FormControl.Label>
                                    {i18n.t("imageURL")}
                                </FormControl.Label>
                                <Input value={imageURL}
                                    onChangeText={(text) => {
                                        setImageURL(text);
                                    }}
                                ></Input>
                                <FormControl.Label>
                                    {i18n.t("country")}
                                </FormControl.Label>
                                <CountrySelect value={country} onChange={setCountry} />
                                <FormControl.Label>
                                    Gender
                                </FormControl.Label>
                                <Input maxLength={1} value={gender} onChangeText={(text) => setGender(normalizeGender(text))}></Input>
                                <FormControl.Label>
                                    Rating
                                </FormControl.Label>
                                <Input keyboardType={"numeric"} value={rating} onChangeText={(text) => setRating(`${normalizeNumberField(text)}`)}></Input>
                                <FormControl.Label>
                                    Ranking
                                </FormControl.Label>
                                <Input keyboardType={"numeric"} value={ranking} onChangeText={(text) => setRanking(`${normalizeNumberField(text)}`)}></Input>
                            </>
                        }

                    </FormControl>
                </Modal.Body>
                <Modal.Footer>
                    <View>
                        <Button disabled={!canSubmit()}
                            onPress={onAddPressed}

                        >
                            <Text color={openScoreboardButtonTextColor}>{props.isEditing ? i18n.t("update") : i18n.t("add")}</Text>
                        </Button>
                    </View>
                    <View>
                        <Button variant={"ghost"}
                            onPress={() => {
                                props.onClose();
                            }}
                        >
                            <Text>{i18n.t("close")}</Text>
                        </Button>
                    </View>
                </Modal.Footer>
            </Modal.Content>
        </Modal>
    );
}
