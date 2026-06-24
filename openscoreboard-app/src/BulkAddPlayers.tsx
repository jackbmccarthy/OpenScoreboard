import { Button, FormControl, NativeBaseProvider, TextField, View, Text, Select, Spinner } from "native-base";
import { useState, useEffect } from "react";
import { newImportedPlayer } from "./classes/Player";
import jsonFlags from './flags/countries.json'
import { addImportedPlayer, getMyPlayerLists } from "./functions/players";
import LoadingPage from "./LoadingPage";
import i18n from "./translations/translate";


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

function isValidImageUrl(url: string) {
    const urlRegex = /^(ftp|http|https):\/\/[^ "]+$/;
    return url === '' || url.match(urlRegex);
}

function normalizeGender(value = "") {
    return `${value || ""}`.trim().slice(0, 1).toUpperCase();
}

function normalizeNumberField(value) {
    const parsedValue = parseInt(`${value || ""}`, 10);
    return Number.isNaN(parsedValue) ? "" : parsedValue;
}



export default function BulkAddPlayer() {

    let [csvValue, setCSVValue] = useState("")
    let [doneLoading, setDoneLoading] = useState(false)
    let [myPlayerLists, setMyPlayerLists] = useState([])
    let [selectedPlayerListID, setSelectedPlayerListID] = useState("")
    let [loadingPlayers, setLoadingPlayers] = useState(false)

    async function loadPlayerLists() {
        setDoneLoading(false)
        let playerLists = await getMyPlayerLists()
        setMyPlayerLists(playerLists)
        setDoneLoading(true)
    }



    useEffect(() => {
        loadPlayerLists()
    }, [])

    async function onSubmit() {
        if (validateCSV(csvValue) === true) {
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
                let playerID = await addImportedPlayer(selectedPlayerListID, newPlayer);
            })
        }

    }

    return (
        <NativeBaseProvider>

            <View>
                <FormControl>
                    <FormControl.Label>{i18n.t("playerListID")}</FormControl.Label>
                    {
                        doneLoading ?
                            myPlayerLists.length > 0 ?
                                <FormControl>
                                    <FormControl.Label>{i18n.t("selectPlayerList")}</FormControl.Label>

                                    <Select onValueChange={(text) => {
                                        setSelectedPlayerListID(text)
                                    }} selectedValue={selectedPlayerListID}>
                                        {
                                            myPlayerLists.map((playerList) => {
                                                return (
                                                    <Select.Item key={playerList[1].id} label={playerList[1].playerListName} value={playerList[1].id} />
                                                )
                                            })
                                        }
                                    </Select>
                                </FormControl>
                                :
                                <Text>{i18n.t("noPlayerListsGoAdd")}</Text>
                            :
                            <LoadingPage></LoadingPage>
                    }

                    <FormControl.Label>{i18n.t("csvColumnOrder")}</FormControl.Label>
                    <TextField multiline
                        placeholder="CSV Values"
                        onChangeText={(text) => {
                            setCSVValue(text)
                        }}
                    ></TextField>
                </FormControl>

                <Button onPress={async () => {
                    if (selectedPlayerListID.length > 0 && !loadingPlayers) {
                        setLoadingPlayers(true)
                        await onSubmit()
                        setLoadingPlayers(false)
                    }


                }}>
                    {
                        loadingPlayers ?
                            <Spinner></Spinner> :
                            <Text>{i18n.t("submit")}</Text>
                    }

                </Button>



            </View>
        </NativeBaseProvider>

    )
}
